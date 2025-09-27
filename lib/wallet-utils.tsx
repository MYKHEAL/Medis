// Wallet connection utilities and hooks
'use client';

import { ConnectButton, useCurrentAccount, useSuiClient, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';

export { ConnectButton, useCurrentAccount, useSuiClient };

// Custom hook for wallet connection status
export function useWalletConnection() {
  const account = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  
  return {
    isConnected: !!account,
    account,
    signAndExecute,
    address: account?.address,
  };
}

// Utility function to create transactions
export function createTransaction() {
  return new Transaction();
}

// Address formatting utility
export function formatAddress(address: string, prefix = 6, suffix = 4): string {
  if (!address) return '';
  if (address.length <= prefix + suffix) return address;
  return `${address.slice(0, prefix)}...${address.slice(-suffix)}`;
}

// Network configuration
export const NETWORK_CONFIG = {
  devnet: 'https://fullnode.devnet.sui.io',
  testnet: 'https://fullnode.testnet.sui.io',
  mainnet: 'https://fullnode.mainnet.sui.io',
} as const;

export type NetworkType = keyof typeof NETWORK_CONFIG;