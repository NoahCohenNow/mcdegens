import axios from 'axios';
import { logger } from './logger.js';

/**
 * Get all token holders using Helius API
 */
export async function getTokenHolders(tokenMint, rpcUrl) {
  try {
    logger.info(`Fetching holders for token: ${tokenMint}`);
    
    const response = await axios.post(rpcUrl, {
      jsonrpc: '2.0',
      id: 'holder-snapshot',
      method: 'getTokenAccounts',
      params: {
        mint: tokenMint,
        limit: 1000,
        displayOptions: {
          showZeroBalance: false
        }
      }
    });

    if (response.data.error) {
      throw new Error(`RPC Error: ${response.data.error.message}`);
    }

    const accounts = response.data.result?.token_accounts || [];
    
    const holders = accounts.map(account => ({
      address: account.owner,
      balance: parseFloat(account.amount) / Math.pow(10, account.decimals || 9),
      tokenAccount: account.address
    }));

    logger.success(`Found ${holders.length} token holders`);
    return holders;
  } catch (error) {
    logger.error('Failed to fetch token holders', { error: error.message });
    throw error;
  }
}

/**
 * Filter holders based on minimum balance requirement
 */
export function filterQualifiedHolders(holders, minBalance, excludeAddresses = []) {
  const qualified = holders.filter(holder => 
    holder.balance >= minBalance && 
    !excludeAddresses.includes(holder.address)
  );
  
  logger.info(`${qualified.length} holders qualified (min: ${minBalance} tokens)`);
  return qualified;
}

/**
 * Select random winners from qualified holders
 */
export function selectRandomWinners(holders, numberOfWinners) {
  if (holders.length === 0) {
    logger.warn('No holders available for selection');
    return [];
  }

  const actualWinners = Math.min(numberOfWinners, holders.length);
  const shuffled = [...holders].sort(() => Math.random() - 0.5);
  const winners = shuffled.slice(0, actualWinners);
  
  logger.success(`Selected ${winners.length} random winner(s)`, {
    winners: winners.map(w => ({ address: w.address, balance: w.balance }))
  });
  
  return winners;
}

/**
 * Get holder snapshot and select winners
 */
export async function getAirdropWinners(tokenMint, rpcUrl, config) {
  const holders = await getTokenHolders(tokenMint, rpcUrl);
  
  const excludeAddresses = [
    config.creatorWallet,
    config.creatorFeeWallet
  ].filter(Boolean);
  
  const qualified = filterQualifiedHolders(
    holders, 
    config.minHolderBalance,
    excludeAddresses
  );
  
  if (qualified.length < config.minHoldersForAirdrop) {
    logger.warn(`Not enough qualified holders (${qualified.length}/${config.minHoldersForAirdrop})`);
    return [];
  }
  
  return selectRandomWinners(qualified, config.numberOfWinners);
}
