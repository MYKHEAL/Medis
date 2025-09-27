'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ExclamationTriangleIcon, 
  InformationCircleIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface WalletTroubleshootingProps {
  isVisible: boolean;
  onClose: () => void;
  error?: Error | null;
}

export function WalletTroubleshooting({ isVisible, onClose, error }: WalletTroubleshootingProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const troubleshootingSteps = [
    {
      id: 'wallet-connection',
      title: 'Wallet Connection Issues',
      icon: '🔗',
      steps: [
        'Ensure your Sui wallet extension is installed and enabled',
        'Check that your wallet is unlocked',
        'Try refreshing the page and reconnecting',
        'Make sure you are on the correct network (Testnet)',
      ]
    },
    {
      id: 'transaction-errors',
      title: 'Transaction Signing Errors',
      icon: '✍️',
      steps: [
        'Check if you have sufficient SUI tokens for gas fees',
        'Ensure you are connected to the correct wallet address',
        'Try signing the transaction again',
        'If using multiple wallets, make sure the correct one is selected',
      ]
    },
    {
      id: 'network-issues',
      title: 'Network & RPC Issues',
      icon: '🌐',
      steps: [
        'Check your internet connection',
        'Switch to a different RPC endpoint in wallet settings',
        'Clear browser cache and reload',
        'Try again in a few minutes (network congestion)',
      ]
    },
    {
      id: 'permission-errors',
      title: 'Permission & Role Issues',
      icon: '🔐',
      steps: [
        'Verify you have the correct role (Admin, Hospital, Patient)',
        'Check that your address is properly registered',
        'Contact admin if you need hospital registration',
        'Ensure smart contract objects are deployed correctly',
      ]
    }
  ];

  const getErrorCategory = (error?: Error | null) => {
    if (!error?.message) return null;
    
    const message = error.message.toLowerCase();
    
    if (message.includes('user rejected') || message.includes('cancelled')) {
      return { type: 'user-action', message: 'Transaction was cancelled by user' };
    }
    if (message.includes('insufficient gas') || message.includes('insufficient funds')) {
      return { type: 'gas', message: 'Insufficient gas or SUI tokens' };
    }
    if (message.includes('network') || message.includes('connection')) {
      return { type: 'network', message: 'Network connection issue' };
    }
    if (message.includes('invalid object') || message.includes('not found')) {
      return { type: 'object', message: 'Invalid or missing blockchain object' };
    }
    if (message.includes('not registered') || message.includes('permission')) {
      return { type: 'permission', message: 'Permission or registration issue' };
    }
    
    return { type: 'unknown', message: error.message };
  };

  const errorInfo = getErrorCategory(error);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="w-full max-w-2xl max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <Card variant="glass" className="bg-white/10 backdrop-blur-xl border-white/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <ExclamationTriangleIcon className="w-8 h-8 text-amber-400 mr-3" />
                    <h2 className="text-2xl font-bold text-white">Wallet Troubleshooting</h2>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={onClose}
                    className="text-gray-400 hover:text-white"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </Button>
                </div>

                {/* Error Information */}
                {errorInfo && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20"
                  >
                    <div className="flex items-start">
                      <ExclamationTriangleIcon className="w-5 h-5 text-red-400 mr-3 mt-0.5 flex-shrink-0" />
                      <div>
                        <h3 className="font-semibold text-red-300 mb-1">Error Detected</h3>
                        <p className="text-red-200 text-sm">{errorInfo.message}</p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Quick Actions */}
                <div className="mb-6 grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.reload()}
                    className="border-blue-500/30 text-blue-300 hover:bg-blue-500/10"
                  >
                    🔄 Refresh Page
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Try to reconnect wallet
                      window.dispatchEvent(new Event('wallet-reconnect'));
                    }}
                    className="border-green-500/30 text-green-300 hover:bg-green-500/10"
                  >
                    🔗 Reconnect Wallet
                  </Button>
                </div>

                {/* Troubleshooting Sections */}
                <div className="space-y-3">
                  {troubleshootingSteps.map((section) => (
                    <motion.div
                      key={section.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="border border-white/10 rounded-lg overflow-hidden"
                    >
                      <button
                        onClick={() => toggleSection(section.id)}
                        className="w-full p-4 text-left bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-between"
                      >
                        <div className="flex items-center">
                          <span className="text-2xl mr-3">{section.icon}</span>
                          <span className="font-semibold text-white">{section.title}</span>
                        </div>
                        <motion.div
                          animate={{ rotate: expandedSection === section.id ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </motion.div>
                      </button>
                      
                      <AnimatePresence>
                        {expandedSection === section.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                          >
                            <div className="p-4 bg-white/5">
                              <ol className="space-y-2">
                                {section.steps.map((step, index) => (
                                  <li key={index} className="flex items-start text-sm text-gray-300">
                                    <span className="inline-flex items-center justify-center w-5 h-5 bg-blue-500/20 text-blue-300 rounded-full text-xs font-semibold mr-3 mt-0.5 flex-shrink-0">
                                      {index + 1}
                                    </span>
                                    {step}
                                  </li>
                                ))}
                              </ol>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </div>

                {/* Additional Resources */}
                <div className="mt-6 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <div className="flex items-start">
                    <InformationCircleIcon className="w-5 h-5 text-blue-400 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-blue-300 mb-2">Need More Help?</h3>
                      <div className="space-y-1 text-sm text-blue-200">
                        <p>• Check the browser console (F12) for detailed error logs</p>
                        <p>• Ensure you're using a supported Sui wallet (Sui Wallet, Ethos, etc.)</p>
                        <p>• Verify your wallet is connected to the correct network (Testnet)</p>
                        <p>• Contact the admin if you need role permissions</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <Button onClick={onClose} className="bg-gradient-to-r from-purple-600 to-blue-600">
                    Got it, thanks!
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}