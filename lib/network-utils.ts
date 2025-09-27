// Network utilities for checking connectivity and RPC status
'use client';

import { getFullnodeUrl } from '@mysten/sui/client';

export interface NetworkStatus {
  isOnline: boolean;
  latency: number | null;
  error: string | null;
  network: 'devnet' | 'testnet' | 'mainnet';
}

/**
 * Check the status of the Sui network RPC endpoint
 * @param network The network to check (devnet, testnet, mainnet)
 * @returns NetworkStatus object with connectivity information
 */
export async function checkNetworkStatus(network: 'devnet' | 'testnet' | 'mainnet' = 'testnet'): Promise<NetworkStatus> {
  const startTime = Date.now();
  const rpcUrl = getFullnodeUrl(network);
  
  try {
    // Simple fetch request to check if the RPC is responsive
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'rpc.discover',
        params: []
      }),
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });
    
    const latency = Date.now() - startTime;
    
    if (response.ok) {
      return {
        isOnline: true,
        latency,
        error: null,
        network
      };
    } else {
      return {
        isOnline: false,
        latency: null,
        error: `RPC returned status ${response.status}`,
        network
      };
    }
  } catch (error: any) {
    const latency = Date.now() - startTime;
    
    return {
      isOnline: false,
      latency: null,
      error: error.message || 'Unknown network error',
      network
    };
  }
}

/**
 * Check if the user has general internet connectivity
 * @returns Boolean indicating if online
 */
export function isOnline(): boolean {
  if (typeof navigator !== 'undefined') {
    return navigator.onLine;
  }
  return true; // Assume online in server context
}

/**
 * Get detailed network information
 * @returns Object with network details
 */
export function getNetworkDetails() {
  if (typeof navigator !== 'undefined' && (navigator as any).connection) {
    const connection = (navigator as any).connection;
    return {
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
      saveData: connection.saveData
    };
  }
  return null;
}