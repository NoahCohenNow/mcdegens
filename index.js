import dotenv from 'dotenv';
import { Connection, Keypair, PublicKey, LAMPORTS_PER_SOL, Transaction, SystemProgram } from '@solana/web3.js';
import { getAssociatedTokenAddress, createTransferInstruction, getAccount } from '@solana/spl-token';
import { logger } from './utils/logger.js';
import { getAirdropWinners } from './utils/holders.js';
import bs58 from 'bs58';
import fs from 'fs';
import path from 'path';
import simpleGit from 'simple-git';

dotenv.config();

// Configuration
const CONFIG = {
  rpcUrl: process.env.HELIUS_RPC_URL,
  creatorPrivateKey: process.env.CREATOR_WALLET_PRIVATE_KEY,
  tokenMint: process.env.YMN_TOKEN_MINT,
  creatorFeeWallet: process.env.CREATOR_FEE_WALLET,
  checkIntervalMinutes: parseInt(process.env.CHECK_INTERVAL_MINUTES) || 10,
  minBalanceToProcess: parseFloat(process.env.MIN_BALANCE_TO_PROCESS) || 0.1,
  buybackPercentage: parseInt(process.env.BUYBACK_PERCENTAGE) || 50,
  airdropPercentage: parseInt(process.env.AIRDROP_PERCENTAGE) || 50,
  minHoldersForAirdrop: parseInt(process.env.MIN_HOLDERS_FOR_AIRDROP) || 10,
  numberOfWinners: parseInt(process.env.NUMBER_OF_WINNERS_PER_ROUND) || 1,
  minHolderBalance: parseFloat(process.env.MIN_HOLDER_BALANCE) || 100,
  slippageBps: parseInt(process.env.SLIPPAGE_BPS) || 300
};

let connection;
let creatorKeypair;

// Stats tracking
const STATS_FILE = 'stats.json';
let stats = {
  totalDistributedSOL: 0,
  totalWinners: 0,
  totalDraws: 0,
  averageWinAmount: 0,
  lastDrawTime: null,
  nextDrawTime: null,
  lastWinner: null,
  currentPoolValue: 0,
  recentTransactions: []
};

/**
 * Load stats from file
 */
function loadStats() {
  try {
    if (fs.existsSync(STATS_FILE)) {
      const data = fs.readFileSync(STATS_FILE, 'utf8');
      stats = JSON.parse(data);
      logger.info('Stats loaded from file');
    }
  } catch (error) {
    logger.warn('Could not load stats, starting fresh', { error: error.message });
  }
}

/**
 * Save stats to file and push to GitHub
 */
async function saveStats() {
  try {
    // Save to file
    fs.writeFileSync(STATS_FILE, JSON.stringify(stats, null, 2));
    logger.success('Stats saved to stats.json');
    
    // Push to GitHub if enabled
    if (process.env.GITHUB_AUTO_PUSH === 'true') {
      await pushStatsToGitHub();
    }
  } catch (error) {
    logger.error('Failed to save stats', { error: error.message });
  }
}

/**
 * Push stats.json to GitHub
 */
async function pushStatsToGitHub() {
  try {
    const git = simpleGit();
    
    // Configure git with GitHub token
    if (process.env.GITHUB_TOKEN) {
      const repo = process.env.GITHUB_REPO; // format: username/repo-name
      const remoteUrl = `https://${process.env.GITHUB_TOKEN}@github.com/${repo}.git`;
      
      // Check if remote exists, if not add it
      const remotes = await git.getRemotes();
      if (!remotes.find(r => r.name === 'origin')) {
        await git.addRemote('origin', remoteUrl);
      }
    }
    
    // Add, commit, and push stats.json
    await git.add('stats.json');
    await git.commit(`Update stats: ${new Date().toISOString()}`, ['stats.json']);
    await git.push('origin', process.env.GITHUB_BRANCH || 'main');
    
    logger.success('Stats pushed to GitHub');
  } catch (error) {
    logger.error('Failed to push stats to GitHub', { error: error.message });
    // Don't throw - stats are still saved locally
  }
}

/**
 * Initialize Solana connection and wallet
 */
async function initialize() {
  logger.info('🎰 FEEFREAK RAFFLE INITIALIZING 🎰');
  logger.info('100% of creator fees → Random holder raffles');
  
  // Load existing stats
  loadStats();
  
  // Validate configuration
  if (!CONFIG.rpcUrl || !CONFIG.creatorPrivateKey || !CONFIG.tokenMint) {
    throw new Error('Missing required environment variables. Check .env file.');
  }

  // Initialize connection
  connection = new Connection(CONFIG.rpcUrl, 'confirmed');
  logger.success('Connected to Solana');

  // Initialize creator wallet
  try {
    const secretKey = bs58.decode(CONFIG.creatorPrivateKey);
    creatorKeypair = Keypair.fromSecretKey(secretKey);
    logger.success(`Creator wallet loaded: ${creatorKeypair.publicKey.toBase58()}`);
  } catch (error) {
    logger.error('Failed to load creator wallet. Check CREATOR_WALLET_PRIVATE_KEY format.');
    throw error;
  }

  // Validate token mint
  try {
    const mintPubkey = new PublicKey(CONFIG.tokenMint);
    logger.success(`Token mint validated: ${mintPubkey.toBase58()}`);
  } catch (error) {
    logger.error('Invalid YMN_TOKEN_MINT address');
    throw error;
  }

  logger.info(`Draw interval: Every ${CONFIG.checkIntervalMinutes} minutes`);
  logger.info(`Winners per draw: ${CONFIG.numberOfWinners}`);
}

/**
 * Get SOL balance from creator fee wallet
 */
async function getCreatorFeeBalance() {
  try {
    const feeWalletPubkey = CONFIG.creatorFeeWallet 
      ? new PublicKey(CONFIG.creatorFeeWallet)
      : creatorKeypair.publicKey;
    
    const balance = await connection.getBalance(feeWalletPubkey);
    const solBalance = balance / LAMPORTS_PER_SOL;
    
    logger.info(`Creator fee balance: ${solBalance.toFixed(4)} SOL`);
    return { balance: solBalance, pubkey: feeWalletPubkey };
  } catch (error) {
    logger.error('Failed to fetch creator fee balance', { error: error.message });
    throw error;
  }
}



/**
 * Execute raffle draw to random winners
 */
async function executeRaffleDraw(solAmount) {
  logger.info(`🎰 EXECUTING RAFFLE DRAW: ${solAmount.toFixed(4)} SOL 🎰`);
  
  try {
    // Get random winners
    const winners = await getAirdropWinners(CONFIG.tokenMint, CONFIG.rpcUrl, {
      creatorWallet: creatorKeypair.publicKey.toBase58(),
      creatorFeeWallet: CONFIG.creatorFeeWallet,
      minHolderBalance: CONFIG.minHolderBalance,
      minHoldersForAirdrop: CONFIG.minHoldersForAirdrop,
      numberOfWinners: CONFIG.numberOfWinners
    });

    if (winners.length === 0) {
      logger.warn('No qualified holders found. Skipping draw.');
      return { success: false, reason: 'No qualified holders' };
    }

    // Split SOL among winners
    const amountPerWinner = solAmount / winners.length;
    const lamportsPerWinner = Math.floor(amountPerWinner * LAMPORTS_PER_SOL);

    logger.info(`💰 Sending ${amountPerWinner.toFixed(4)} SOL to ${winners.length} winner(s)`);

    // Create and send transactions
    const results = [];
    for (const winner of winners) {
      try {
        const transaction = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: creatorKeypair.publicKey,
            toPubkey: new PublicKey(winner.address),
            lamports: lamportsPerWinner
          })
        );

        const signature = await connection.sendTransaction(transaction, [creatorKeypair]);
        await connection.confirmTransaction(signature);
        
        logger.transaction(
          `🎉 Winner: ${winner.address.slice(0, 8)}...`,
          signature,
          { amount: amountPerWinner, balance: winner.balance }
        );

        results.push({ winner: winner.address, signature, amount: amountPerWinner });
        
        // Update stats for each winner
        stats.totalDistributedSOL += amountPerWinner;
        stats.totalWinners += 1;
        stats.lastWinner = winner.address;
        
        // Add to recent transactions (keep last 20 for better feed)
        stats.recentTransactions.unshift({
          type: 'raffle_win',
          winner: winner.address,
          amount: amountPerWinner,
          signature,
          timestamp: new Date().toISOString()
        });
        if (stats.recentTransactions.length > 20) {
          stats.recentTransactions = stats.recentTransactions.slice(0, 20);
        }
      } catch (error) {
        logger.error(`Failed to send prize to ${winner.address}`, { error: error.message });
      }
    }

    return { success: true, results };
  } catch (error) {
    logger.error('Raffle draw failed', { error: error.message });
    throw error;
  }
}

/**
 * Process creator fees - execute raffle draw
 */
async function processCreatorFees() {
  logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  logger.info('🎰 CHECKING CREATOR FEE BALANCE 🎰');
  
  try {
    const { balance, pubkey } = await getCreatorFeeBalance();
    
    // Update current pool value in stats
    stats.currentPoolValue = balance;

    if (balance < CONFIG.minBalanceToProcess) {
      logger.info(`Balance too low (${balance.toFixed(4)} SOL < ${CONFIG.minBalanceToProcess} SOL). Skipping draw.`);
      return;
    }

    // Calculate how much we can use (reserve for transaction fees)
    const estimatedDrawFees = 0.005 * CONFIG.numberOfWinners; // ~0.005 SOL per transaction
    const bufferForSafety = 0.005;
    const reserveForFees = estimatedDrawFees + bufferForSafety;
    
    const availableBalance = balance - reserveForFees;

    if (availableBalance <= 0) {
      logger.warn('Not enough balance after reserving for fees');
      return;
    }

    // 100% goes to raffle winners
    const prizePool = availableBalance;

    logger.success('🎰 FEEFREAK RAFFLE DRAW 🎰');
    logger.info(`Total Balance: ${balance.toFixed(4)} SOL`);
    logger.info(`Reserved for Fees: ${reserveForFees.toFixed(4)} SOL`);
    logger.info(`Prize Pool: ${prizePool.toFixed(4)} SOL`);

    // Execute raffle draw
    await executeRaffleDraw(prizePool);

    // Update draw stats
    stats.totalDraws++;
    stats.lastDrawTime = new Date().toISOString();
    stats.nextDrawTime = new Date(Date.now() + CONFIG.checkIntervalMinutes * 60 * 1000).toISOString();
    stats.averageWinAmount = stats.totalWinners > 0 ? stats.totalDistributedSOL / stats.totalWinners : 0;
    
    // Update pool value after draw (should be near zero)
    const { balance: balanceAfterDraw } = await getCreatorFeeBalance();
    stats.currentPoolValue = balanceAfterDraw;
    
    // Save stats to file
    await saveStats();

    logger.success('✅ RAFFLE DRAW COMPLETE ✅');
  } catch (error) {
    logger.error('Failed to process raffle draw', { error: error.message });
  }
  
  logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

/**
 * Start the raffle loop
 */
async function start() {
  await initialize();
  
  logger.success('🚀 FEEFREAK RAFFLE RUNNING 🚀');
  logger.info(`Next draw: Every ${CONFIG.checkIntervalMinutes} minutes`);
  
  // Run immediately on start
  await processCreatorFees();
  
  // Then run on interval
  const intervalMs = CONFIG.checkIntervalMinutes * 60 * 1000;
  setInterval(async () => {
    await processCreatorFees();
  }, intervalMs);
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  logger.info('FeeFreak Raffle shutting down...');
  process.exit(0);
});

// Start the raffle
start().catch(error => {
  logger.error('Fatal error', { error: error.message });
  process.exit(1);
});
