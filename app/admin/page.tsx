'use client';

import { useState } from 'react';
import { ConnectButton, useCurrentAccount } from '@mysten/dapp-kit';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheckIcon, 
  BuildingOffice2Icon, 
  PlusIcon, 
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useMedicalRecordsContract } from '@/lib/contract-utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn, gradients, shadows } from '@/lib/ui-utils';

interface HospitalRegistration {
  name: string;
  address: string;
  registering: boolean;
}

export default function AdminDashboard() {
  const account = useCurrentAccount();
  const { registerHospital, isRegisteredHospital } = useMedicalRecordsContract();
  
  const [hospitalForm, setHospitalForm] = useState({
    name: '',
    address: '',
  });
  const [isRegistering, setIsRegistering] = useState(false);
  const [isCheckingRegistration, setIsCheckingRegistration] = useState(false);
  const [registeredHospitals, setRegisteredHospitals] = useState<HospitalRegistration[]>([]);
  const [registrationError, setRegistrationError] = useState<string>('');

  const handleRegisterHospital = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account || !hospitalForm.name || !hospitalForm.address) return;

    setIsRegistering(true);
    setRegistrationError('');
    
    try {
      const registryId = process.env.NEXT_PUBLIC_HOSPITAL_REGISTRY_ID || '0x0';
      
      // First check if hospital is already registered
      setIsCheckingRegistration(true);
      try {
        const isAlreadyRegistered = await isRegisteredHospital(registryId, hospitalForm.address);
        if (isAlreadyRegistered) {
          setRegistrationError(`Hospital with address ${hospitalForm.address} is already registered in the system.`);
          return;
        }
      } catch (checkError) {
        console.warn('Could not verify existing registration, proceeding with registration:', checkError);
      } finally {
        setIsCheckingRegistration(false);
      }

      const adminCapId = process.env.NEXT_PUBLIC_ADMIN_CAP_ID || '0x0';
      const clockId = '0x6';

      console.log('🔍 Admin dashboard: Starting registration...');
      
      // Add timeout handling for the registration
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Registration timeout: Please check your wallet and try again.'));
        }, 45000); // 45 second timeout
      });
      
      const registrationPromise = registerHospital(
        adminCapId,
        registryId,
        hospitalForm.address,
        hospitalForm.name,
        clockId
      );
      
      await Promise.race([registrationPromise, timeoutPromise]);

      const newHospital: HospitalRegistration = {
        name: hospitalForm.name,
        address: hospitalForm.address,
        registering: false,
      };
      setRegisteredHospitals([...registeredHospitals, newHospital]);
      setHospitalForm({ name: '', address: '' });
      
      // Show success message
      alert(`Hospital "${hospitalForm.name}" registered successfully!`);
      
    } catch (error: any) {
      console.error('Error registering hospital:', error);
      
      // Handle specific error types
      if (error.message && error.message.includes('timeout')) {
        setRegistrationError('Registration timed out. Please check your wallet connection and try again.');
      } else if (error.message && error.message.includes('EHospitalAlreadyRegistered')) {
        setRegistrationError('This hospital address is already registered in the system.');
      } else if (error.message && error.message.includes('MoveAbort')) {
        const match = error.message.match(/MoveAbort.*?(\d+)/);
        if (match) {
          const errorCode = match[1];
          switch (errorCode) {
            case '1':
              setRegistrationError('Access denied: Admin privileges required.');
              break;
            case '3':
              setRegistrationError('Hospital address is already registered.');
              break;
            default:
              setRegistrationError(`Registration failed with error code: ${errorCode}`);
          }
        } else {
          setRegistrationError('Registration failed due to a smart contract error.');
        }
      } else {
        setRegistrationError(error.message || 'Failed to register hospital. Please check your wallet connection and try again.');
      }
    } finally {
      setIsRegistering(false);
      setIsCheckingRegistration(false);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (!account) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <Card variant="glass" className="max-w-md w-full bg-white/10 backdrop-blur-xl">
            <CardContent className="text-center py-12">
              <div className={cn("p-4 rounded-2xl w-fit mx-auto mb-6", gradients.admin, shadows.glow)}>
                <ShieldCheckIcon className="w-16 h-16 text-white" />
              </div>
              <CardTitle className="text-white mb-4 text-2xl">Admin Access Required</CardTitle>
              <p className="text-gray-300 mb-8 text-lg">
                Please connect your admin wallet to access the control panel
              </p>
              <ConnectButton />
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <motion.header 
        className="bg-white/10 backdrop-blur-xl border-b border-white/10"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link href="/" className="mr-4">
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <ArrowLeftIcon className="w-6 h-6 text-white" />
                </motion.div>
              </Link>
              <div className={cn("p-3 rounded-2xl mr-4", gradients.admin, shadows.glow)}>
                <ShieldCheckIcon className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Admin Control Panel</h1>
                <p className="text-gray-300">Manage hospitals and system administration</p>
              </div>
            </div>
            <ConnectButton />
          </div>
        </div>
      </motion.header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Important Notice Card */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card variant="glass" className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
            <CardContent className="p-6">
              <div className="flex items-start">
                <div className={cn("p-3 rounded-2xl mr-4 flex-shrink-0", "bg-gradient-to-br from-blue-500 to-cyan-600", shadows.glow)}>
                  <ShieldCheckIcon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-2">Admin Status</h3>
                  <p className="text-blue-200 mb-3">
                    Your address <code className="bg-blue-900/30 px-2 py-1 rounded text-sm">{formatAddress(account.address)}</code> is the system administrator.
                  </p>
                  <div className="bg-blue-900/20 rounded-lg p-3 mb-3">
                    <p className="text-blue-300 text-sm font-medium mb-1">💡 Quick Setup:</p>
                    <p className="text-blue-200 text-sm mb-2">
                      To also function as a hospital, register your own address below.
                    </p>
                    <Button
                      onClick={() => setHospitalForm({ name: 'Admin Hospital', address: account.address })}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white mr-2"
                    >
                      Auto-fill My Address
                    </Button>
                    <Button
                      onClick={() => setHospitalForm({ name: '', address: '' })}
                      size="sm"
                      variant="outline"
                      className="text-blue-300 border-blue-500/50 hover:bg-blue-900/20"
                    >
                      Clear Form
                    </Button>
                  </div>
                  <div className="bg-amber-900/20 rounded-lg p-3">
                    <p className="text-amber-300 text-sm font-medium mb-1">⚠️ Important:</p>
                    <p className="text-amber-200 text-sm">
                      If you get "already registered" errors, it means the address is already in the system.
                      Use different addresses to register other hospitals.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        {/* Stats Cards */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card variant="glass" hover className="bg-gradient-to-br from-purple-500/10 to-indigo-500/10">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className={cn("p-3 rounded-2xl mr-4", "bg-gradient-to-br from-purple-500 to-indigo-600", shadows.glow)}>
                  <BuildingOffice2Icon className="w-8 h-8 text-white" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-white">{registeredHospitals.length}</p>
                  <p className="text-gray-300">Registered Hospitals</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card variant="glass" hover className="bg-gradient-to-br from-emerald-500/10 to-green-500/10">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className={cn("p-3 rounded-2xl mr-4", "bg-gradient-to-br from-emerald-500 to-green-600", shadows.glow)}>
                  <ShieldCheckIcon className="w-8 h-8 text-white" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-white">Active</p>
                  <p className="text-gray-300">System Status</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card variant="glass" hover className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className={cn("p-3 rounded-2xl mr-4", "bg-gradient-to-br from-cyan-500 to-blue-600", shadows.glow)}>
                  <ShieldCheckIcon className="w-8 h-8 text-white" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-white">Testnet</p>
                  <p className="text-gray-300">Network</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Register Hospital Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card variant="glass" className="bg-gradient-to-br from-white/10 to-white/5">
              <CardHeader>
                <div className="flex items-center">
                  <div className={cn("p-2 rounded-xl mr-3", "bg-gradient-to-br from-emerald-500 to-green-600")}>
                    <PlusIcon className="w-5 h-5 text-white" />
                  </div>
                  <CardTitle className="text-white">Register New Hospital</CardTitle>
                </div>
                <p className="text-gray-300">
                  Add a new medical institution to the platform
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRegisterHospital} className="space-y-6">
                  {registrationError && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-red-500/20 border border-red-500/50 rounded-xl p-4"
                    >
                      <p className="text-red-300 text-sm">
                        <strong>Registration Error:</strong> {registrationError}
                      </p>
                      {registrationError.includes('already registered') && (
                        <div className="mt-3 bg-red-900/20 rounded-lg p-3">
                          <p className="text-red-300 text-xs font-semibold mb-1">💡 Suggestion:</p>
                          <p className="text-red-200 text-xs">
                            This address is already in the system. Try a different hospital address or check if this hospital is already listed below.
                          </p>
                        </div>
                      )}
                    </motion.div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                      Hospital Name
                    </label>
                    <input
                      type="text"
                      value={hospitalForm.name}
                      onChange={(e) => {
                        setHospitalForm({ ...hospitalForm, name: e.target.value });
                        if (registrationError) setRegistrationError('');
                      }}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      placeholder="Enter hospital name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                      Hospital Wallet Address
                    </label>
                    <input
                      type="text"
                      value={hospitalForm.address}
                      onChange={(e) => {
                        setHospitalForm({ ...hospitalForm, address: e.target.value });
                        if (registrationError) setRegistrationError('');
                      }}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      placeholder="0x..."
                      required
                    />
                    <p className="text-gray-400 text-xs mt-2">
                      Current admin address: {formatAddress(account.address)}
                    </p>
                  </div>
                  <Button
                    type="submit"
                    loading={isRegistering || isCheckingRegistration}
                    disabled={!hospitalForm.name || !hospitalForm.address || isRegistering || isCheckingRegistration}
                    className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700"
                    size="lg"
                  >
                    {isCheckingRegistration
                      ? 'Checking Registration...' 
                      : isRegistering
                      ? 'Registering Hospital...'
                      : 'Register Hospital'
                    }
                  </Button>
                  
                  {/* Debug/Help Section */}
                  <div className="mt-4 p-3 bg-gray-800/50 rounded-lg">
                    <p className="text-gray-400 text-xs mb-2">📝 Debug Info:</p>
                    <div className="space-y-1 text-xs">
                      <p className="text-gray-500">Admin Cap: {process.env.NEXT_PUBLIC_ADMIN_CAP_ID?.slice(0, 10)}...{process.env.NEXT_PUBLIC_ADMIN_CAP_ID?.slice(-6)}</p>
                      <p className="text-gray-500">Registry: {process.env.NEXT_PUBLIC_HOSPITAL_REGISTRY_ID?.slice(0, 10)}...{process.env.NEXT_PUBLIC_HOSPITAL_REGISTRY_ID?.slice(-6)}</p>
                      <p className="text-gray-500">Package: {process.env.NEXT_PUBLIC_PACKAGE_ID?.slice(0, 10)}...{process.env.NEXT_PUBLIC_PACKAGE_ID?.slice(-6)}</p>
                    </div>
                    <p className="text-gray-500 text-xs mt-2">💡 If stuck, check browser console (F12) for details</p>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>

          {/* Registered Hospitals List */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card variant="glass" className="bg-gradient-to-br from-white/10 to-white/5">
              <CardHeader>
                <div className="flex items-center">
                  <div className={cn("p-2 rounded-xl mr-3", "bg-gradient-to-br from-purple-500 to-indigo-600")}>
                    <BuildingOffice2Icon className="w-5 h-5 text-white" />
                  </div>
                  <CardTitle className="text-white">Registered Hospitals</CardTitle>
                </div>
                <p className="text-gray-300">
                  Currently authorized medical institutions
                </p>
              </CardHeader>
              <CardContent>
                <AnimatePresence>
                  {registeredHospitals.length === 0 ? (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-12"
                    >
                      <BuildingOffice2Icon className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                      <p className="text-gray-400 mb-2">No hospitals registered yet</p>
                      <p className="text-gray-500 text-sm">Register the first hospital to get started</p>
                    </motion.div>
                  ) : (
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {registeredHospitals.map((hospital, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className={cn("p-2 rounded-lg mr-3", "bg-gradient-to-br from-emerald-500 to-green-600")}>
                                <BuildingOffice2Icon className="w-4 h-4 text-white" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-white">{hospital.name}</h3>
                                <p className="text-sm text-gray-400">
                                  {formatAddress(hospital.address)}
                                </p>
                              </div>
                            </div>
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              Active
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Admin Information */}
        <motion.div 
          className="mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card variant="glass" className="bg-gradient-to-br from-purple-500/10 to-indigo-500/10">
            <CardContent className="p-8">
              <div className="flex items-start">
                <div className={cn("p-3 rounded-2xl mr-4", gradients.admin, shadows.glow)}>
                  <ShieldCheckIcon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-white mb-4">Admin Control Center</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-purple-300 font-medium mb-2">Core Functions</h4>
                      <ul className="text-gray-300 space-y-1 text-sm">
                        <li>• Register new medical institutions</li>
                        <li>• Manage hospital permissions</li>
                        <li>• Monitor system-wide activities</li>
                        <li>• Ensure platform security</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-purple-300 font-medium mb-2">Account Details</h4>
                      <div className="text-gray-300 text-sm space-y-1">
                        <p><strong>Connected:</strong> {formatAddress(account.address)}</p>
                        <p><strong>Role:</strong> System Administrator</p>
                        <p><strong>Network:</strong> Sui Testnet</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}