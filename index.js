import dotenv from 'dotenv';
import { Connection, Keypair, PublicKey, LAMPORTS_PER_SOL, Transaction, SystemProgram } from '@solana/web3.js';
import { getAssociatedTokenAddress, createTransferInstruction, getAccount } from '@solana/spl-token';
import { logger } from './utils/logger.js';
import { getAirdropWinners } from './utils/holders.js';
import bs58 from 'bs58';

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

/**
 * Initialize Solana connection and wallet
 */
async function initialize() {
  logger.info('🔥 BROTHERHOOD PROTOCOL INITIALIZING 🔥');
  logger.info('Half for the fire, half for the family');
  
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

  logger.info(`Check interval: Every ${CONFIG.checkIntervalMinutes} minutes`);
  logger.info(`Buyback: ${CONFIG.buybackPercentage}% | Airdrops: ${CONFIG.airdropPercentage}%`);
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
 * Reserve SOL for manual buybacks
 * This amount stays in the creator wallet for you to manually buyback tokens
 */
async function reserveForBuyback(solAmount) {
  logger.info(`🔥 RESERVING FOR MANUAL BUYBACK: ${solAmount.toFixed(4)} SOL 🔥`);
  
  try {
    // This SOL stays in the creator wallet
    // You will manually use it to buyback $YMN tokens
    logger.success(`${solAmount.toFixed(4)} SOL reserved in wallet for buybacks`);
    logger.info(`Wallet: ${creatorKeypair.publicKey.toBase58()}`);
    logger.info(`This SOL remains in your wallet for manual token buybacks`);
    
    // Log for transparency
    return {
      success: true,
      solReserved: solAmount,
      wallet: creatorKeypair.publicKey.toBase58(),
      message: 'SOL reserved for manual buyback'
    };
  } catch (error) {
    logger.error('Failed to reserve buyback funds', { error: error.message });
    throw error;
  }
}

/**
 * Execute airdrops to random winners
 */
async function executeAirdrops(solAmount) {
  logger.info(`👥 EXECUTING AIRDROPS: ${solAmount.toFixed(4)} SOL 👥`);
  
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
      logger.warn('No qualified winners found. Skipping airdrops.');
      return { success: false, reason: 'No qualified holders' };
    }

    // Split SOL among winners
    const amountPerWinner = solAmount / winners.length;
    const lamportsPerWinner = Math.floor(amountPerWinner * LAMPORTS_PER_SOL);

    logger.info(`Sending ${amountPerWinner.toFixed(4)} SOL to each of ${winners.length} winner(s)`);

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
          `Airdrop sent to ${winner.address.slice(0, 8)}...`,
          signature,
          { amount: amountPerWinner, balance: winner.balance }
        );

        results.push({ winner: winner.address, signature, amount: amountPerWinner });
      } catch (error) {
        logger.error(`Failed to send airdrop to ${winner.address}`, { error: error.message });
      }
    }

    return { success: true, results };
  } catch (error) {
    logger.error('Airdrop execution failed', { error: error.message });
    throw error;
  }
}

/**
 * Process creator fees - split and execute
 */
async function processCreatorFees() {
  logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  logger.info('🔥 CHECKING CREATOR WALLET BALANCE 🔥');
  
  try {
    const { balance, pubkey } = await getCreatorFeeBalance();

    if (balance < CONFIG.minBalanceToProcess) {
      logger.info(`Balance too low (${balance.toFixed(4)} SOL < ${CONFIG.minBalanceToProcess} SOL). Skipping.`);
      return;
    }

    // Calculate how much we can use (reserve for transaction fees)
    // We need to keep enough for airdrop transactions + buffer
    const estimatedAirdropFees = 0.005 * CONFIG.numberOfWinners; // ~0.005 SOL per transaction
    const bufferForSafety = 0.01;
    const reserveForFees = estimatedAirdropFees + bufferForSafety;
    
    const availableBalance = balance - reserveForFees;

    if (availableBalance <= 0) {
      logger.warn('Not enough balance after reserving for fees');
      return;
    }

    // Split 50/50
    const buybackAmount = (availableBalance * CONFIG.buybackPercentage) / 100;
    const airdropAmount = (availableBalance * CONFIG.airdropPercentage) / 100;

    logger.success('💎 SACRIFICE PROTOCOL ACTIVATED 💎');
    logger.info(`Total Balance: ${balance.toFixed(4)} SOL`);
    logger.info(`Reserved for Fees: ${reserveForFees.toFixed(4)} SOL`);
    logger.info(`Available for Protocol: ${availableBalance.toFixed(4)} SOL`);
    logger.info(`├─ For the Fire (Manual Buyback): ${buybackAmount.toFixed(4)} SOL`);
    logger.info(`└─ For the Family (Airdrops): ${airdropAmount.toFixed(4)} SOL`);

    // Reserve for manual buyback (stays in wallet)
    await reserveForBuyback(buybackAmount);

    // Execute airdrops (sends from wallet)
    await executeAirdrops(airdropAmount);

    logger.success('✅ BROTHERHOOD PROTOCOL CYCLE COMPLETE ✅');
    logger.info(`Remaining in wallet for buybacks: ~${buybackAmount.toFixed(4)} SOL`);
  } catch (error) {
    logger.error('Failed to process creator fees', { error: error.message });
  }
  
  logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

/**
 * Start the monitoring loop
 */
async function start() {
  await initialize();
  
  logger.success('🚀 BROTHERHOOD PROTOCOL RUNNING 🚀');
  
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
  logger.info('Brotherhood Protocol shutting down...');
  process.exit(0);
});

// Start the protocol
start().catch(error => {
  logger.error('Fatal error', { error: error.message });
  process.exit(1);
});
