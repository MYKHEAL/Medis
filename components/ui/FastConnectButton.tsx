'use client';

import { ConnectButton, useCurrentAccount, useDisconnectWallet } from '@mysten/dapp-kit';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WalletIcon, ChevronDownIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Button } from './Button';

interface FastConnectButtonProps {
  className?: string;
}

export function FastConnectButton({ className }: FastConnectButtonProps) {
  const currentAccount = useCurrentAccount();
  const { mutate: disconnect } = useDisconnectWallet();
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // Auto-close modal when account connects
  useEffect(() => {
    if (currentAccount && isWalletModalOpen) {
      setIsWalletModalOpen(false);
      setIsConnecting(false);
    }
  }, [currentAccount, isWalletModalOpen]);

  // Preload wallet connection resources for faster popup
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const timer = setTimeout(() => {
        // Pre-warm wallet detection
        try {
          const wallets = ['sui', 'suiet', 'ethos', 'martian'];
          wallets.forEach(wallet => {
            if (wallet in window) {
              console.log(`${wallet} wallet detected`);
            }
          });
        } catch (error) {
          // Silent fail for wallet detection
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, []);

  const handleConnect = () => {
    setIsConnecting(true);
    setIsWalletModalOpen(true);
  };

  const handleDisconnect = () => {
    disconnect();
  };

  const handleCloseModal = () => {
    setIsWalletModalOpen(false);
    setIsConnecting(false);
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (currentAccount) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        className="relative"
      >
        <Button
          variant="outline"
          className={`bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm ${className}`}
          onClick={handleDisconnect}
        >
          <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse" />
          {formatAddress(currentAccount.address)}
          <ChevronDownIcon className="w-4 h-4 ml-2" />
        </Button>
      </motion.div>
    );
  }

  return (
    <>
      {/* Fast Connect Button */}
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.1 }}
      >
        <Button
          onClick={handleConnect}
          disabled={isConnecting}
          gradient
          loading={isConnecting}
          className={`bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0 shadow-lg ${className}`}
        >
          {!isConnecting && <WalletIcon className="w-4 h-4 mr-2" />}
          {isConnecting ? 'Connecting...' : 'Connect Wallet'}
        </Button>
      </motion.div>

      {/* Fast Wallet Modal */}
      <AnimatePresence>
        {isWalletModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={handleCloseModal}
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-6"
            >
              {/* Close Button */}
              <button
                onClick={handleCloseModal}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <XMarkIcon className="w-5 h-5 text-gray-500" />
              </button>

              {/* Modal Content */}
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                  className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4"
                >
                  <WalletIcon className="w-8 h-8 text-white" />
                </motion.div>
                
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Connect Your Wallet
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Choose a wallet to connect to Medis dApp
                </p>
                
                {/* Wallet Connection Options */}
                <div className="space-y-3">
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                    <ConnectButton
                      connectText="🦄 Connect Sui Wallet"
                      className="w-full text-left"
                    />
                  </div>
                </div>
                
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                  By connecting, you agree to our Terms of Service
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}