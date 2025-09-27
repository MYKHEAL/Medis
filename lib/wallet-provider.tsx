// Wallet provider setup using the latest @mysten/dapp-kit
'use client';

import '@mysten/dapp-kit/dist/index.css';
import { 
  SuiClientProvider, 
  WalletProvider
} from '@mysten/dapp-kit';
import { getFullnodeUrl } from '@mysten/sui/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';

// Create a react-query client with optimized settings for faster wallet connections
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      retryDelay: 500,
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
    },
  },
});

// Network configuration for Sui with optimized settings
const networks = {
  devnet: { url: getFullnodeUrl('devnet') },
  testnet: { url: getFullnodeUrl('testnet') },
  mainnet: { url: getFullnodeUrl('mainnet') },
};

interface WalletContextProviderProps {
  children: ReactNode;
}

export function WalletContextProvider({ children }: WalletContextProviderProps) {
  // Get the network from environment variable, default to testnet
  const defaultNetwork = (process.env.NEXT_PUBLIC_SUI_NETWORK as 'devnet' | 'testnet' | 'mainnet') || 'testnet';
  
  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networks} defaultNetwork={defaultNetwork}>
        <WalletProvider
          autoConnect
          preferredWallets={['Sui Wallet', 'Suiet Wallet', 'Ethos Wallet']}
        >
          {children}
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
}