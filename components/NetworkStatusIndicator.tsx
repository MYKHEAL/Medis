// Network status indicator component
'use client';

import React, { useState, useEffect } from 'react';
import { WifiIcon, ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { checkNetworkStatus, isOnline } from '@/lib/network-utils';

interface NetworkStatusIndicatorProps {
  className?: string;
}

export function NetworkStatusIndicator({ className = '' }: NetworkStatusIndicatorProps) {
  const [status, setStatus] = useState<{
    isOnline: boolean;
    suiNetwork: 'online' | 'offline' | 'checking';
    latency: number | null;
    error: string | null;
  }>({
    isOnline: true,
    suiNetwork: 'checking',
    latency: null,
    error: null
  });

  useEffect(() => {
    // Check initial status
    checkStatus();
    
    // Set up periodic checks
    const interval = setInterval(checkStatus, 30000); // Check every 30 seconds
    
    // Also check when online/offline events fire
    const handleOnline = () => checkStatus();
    const handleOffline = () => setStatus(prev => ({ ...prev, isOnline: false, suiNetwork: 'offline' }));
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const checkStatus = async () => {
    // Check general internet connectivity
    const online = isOnline();
    
    if (!online) {
      setStatus({
        isOnline: false,
        suiNetwork: 'offline',
        latency: null,
        error: 'No internet connection'
      });
      return;
    }
    
    setStatus(prev => ({ ...prev, isOnline: true, suiNetwork: 'checking' }));
    
    try {
      // Check Sui network status
      const networkStatus = await checkNetworkStatus('testnet');
      
      setStatus({
        isOnline: true,
        suiNetwork: networkStatus.isOnline ? 'online' : 'offline',
        latency: networkStatus.latency,
        error: networkStatus.error
      });
    } catch (error) {
      setStatus({
        isOnline: true,
        suiNetwork: 'offline',
        latency: null,
        error: 'Failed to check Sui network status'
      });
    }
  };

  const getNetworkStatusIcon = () => {
    if (!status.isOnline) {
      return <ExclamationTriangleIcon className="w-4 h-4 text-red-400" />;
    }
    
    if (status.suiNetwork === 'checking') {
      return (
        <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
      );
    }
    
    if (status.suiNetwork === 'online') {
      return <CheckCircleIcon className="w-4 h-4 text-green-400" />;
    }
    
    return <ExclamationTriangleIcon className="w-4 h-4 text-yellow-400" />;
  };

  const getNetworkStatusText = () => {
    if (!status.isOnline) {
      return 'No internet';
    }
    
    if (status.suiNetwork === 'checking') {
      return 'Checking...';
    }
    
    if (status.suiNetwork === 'online') {
      return status.latency ? `${status.latency}ms` : 'Online';
    }
    
    return status.error || 'Network issue';
  };

  const getTooltipText = () => {
    if (!status.isOnline) {
      return 'No internet connection. Please check your network settings.';
    }
    
    if (status.suiNetwork === 'checking') {
      return 'Checking connection to Sui testnet...';
    }
    
    if (status.suiNetwork === 'online') {
      return `Connected to Sui testnet${status.latency ? ` (${status.latency}ms latency)` : ''}`;
    }
    
    return status.error || 'Unable to connect to Sui network. Transactions may fail.';
  };

  const getStatusColor = () => {
    if (!status.isOnline) return 'text-red-400';
    if (status.suiNetwork === 'checking') return 'text-blue-400';
    if (status.suiNetwork === 'online') return 'text-green-400';
    return 'text-yellow-400';
  };

  return (
    <div 
      className={`inline-flex items-center space-x-1 ${className}`}
      title={getTooltipText()}
    >
      {getNetworkStatusIcon()}
      <span className={`text-xs font-medium ${getStatusColor()}`}>
        {getNetworkStatusText()}
      </span>
    </div>
  );
}
