'use client';

import React from 'react';
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/outline';

export function WalletStatusChecker() {
  const account = useCurrentAccount();
  const client = useSuiClient();
  const [balance, setBalance] = React.useState<string | null>(null);
  const [networkStatus, setNetworkStatus] = React.useState<'checking' | 'connected' | 'error'>('checking');

  React.useEffect(() => {
    const checkWalletStatus = async () => {
      if (!account?.address) {
        setBalance(null);
        setNetworkStatus('error');
        return;
      }

      try {
        // Check network connectivity
        setNetworkStatus('checking');
        const balance = await client.getBalance({
          owner: account.address,
        });
        
        const suiBalance = (parseInt(balance.totalBalance) / 1_000_000_000).toFixed(4);
        setBalance(suiBalance);
        setNetworkStatus('connected');
      } catch (error) {
        console.error('Error checking wallet status:', error);
        setNetworkStatus('error');
        setBalance(null);
      }
    };

    checkWalletStatus();
  }, [account?.address, client]);

  const getStatusIcon = (status: typeof networkStatus) => {
    switch (status) {
      case 'connected':
        return <CheckCircleIcon className="w-5 h-5 text-green-400" />;
      case 'error':
        return <XCircleIcon className="w-5 h-5 text-red-400" />;
      case 'checking':
        return <ClockIcon className="w-5 h-5 text-yellow-400 animate-spin" />;
    }
  };

  const getStatusText = (status: typeof networkStatus) => {
    switch (status) {
      case 'connected':
        return 'Connected';
      case 'error':
        return 'Connection Error';
      case 'checking':
        return 'Checking...';
    }
  };

  if (!account) {
    return (
      <div className="bg-gray-500/10 border border-gray-500/20 rounded-lg p-3">
        <div className="flex items-center text-sm text-gray-400">
          <XCircleIcon className="w-4 h-4 mr-2" />
          No wallet connected
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-3 space-y-2">
      <h4 className="text-sm font-semibold text-white mb-2">Wallet Status</h4>
      
      <div className="space-y-1 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-gray-400">Network:</span>
          <div className="flex items-center">
            {getStatusIcon(networkStatus)}
            <span className="ml-1 text-white">{getStatusText(networkStatus)}</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-gray-400">Address:</span>
          <span className="text-white font-mono text-xs">
            {account.address.slice(0, 8)}...{account.address.slice(-6)}
          </span>
        </div>
        
        {balance !== null && (
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Balance:</span>
            <span className="text-white">{balance} SUI</span>
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <span className="text-gray-400">Network:</span>
          <span className="text-white capitalize">
            {process.env.NEXT_PUBLIC_SUI_NETWORK || 'testnet'}
          </span>
        </div>
      </div>
    </div>
  );
}