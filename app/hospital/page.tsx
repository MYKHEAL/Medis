'use client';

import React, { useState } from 'react';
import { ConnectButton, useCurrentAccount } from '@mysten/dapp-kit';
import { Building2, FileText, Plus, Upload, ArrowLeft, Users, Clock, Shield, Activity, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useMedicalRecordsContract } from '@/lib/contract-utils';
import { useIPFS } from '@/lib/ipfs-utils';
import FileUpload from '@/components/FileUpload';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusIndicator } from '@/components/ui/StatusIndicator';
import { NetworkStatusIndicator } from '@/components/NetworkStatusIndicator';
import { gradients, animations, shadows } from '@/lib/ui-utils';

interface IssuedRecord {
  id: string;
  patientAddress: string;
  fileName: string;
  ipfsHash: string;
  timestamp: number;
  issuedAt: Date;
}

export default function HospitalDashboard() {
  const account = useCurrentAccount();
  const { issueRecord, isRegisteredHospital } = useMedicalRecordsContract();
  const { uploadMedicalRecord } = useIPFS();
  
  const [recordForm, setRecordForm] = useState({
    patientAddress: '',
    description: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isIssuing, setIsIssuing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [issuedRecords, setIssuedRecords] = useState<IssuedRecord[]>([]);

  // Check if hospital is registered
  React.useEffect(() => {
    const checkRegistration = async () => {
      if (account) {
        try {
          const registryId = process.env.NEXT_PUBLIC_HOSPITAL_REGISTRY_ID || '0x0';
          console.log('🏥 Checking hospital registration for:', account.address);
          
          // Add timeout and retry mechanism
          const maxRetries = 3;
          let lastError: any = null;
          
          for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
              const result = await isRegisteredHospital(registryId, account.address);
              console.log('🏥 Hospital registration result:', result);
              setIsRegistered(result);
              return; // Success, exit the retry loop
            } catch (error: any) {
              console.error(`Error checking registration (attempt ${attempt}/${maxRetries}):`, error);
              lastError = error;
              
              // If this is the last attempt, show the error
              if (attempt === maxRetries) {
                throw error;
              }
              
              // Wait before retrying (exponential backoff)
              const delay = Math.pow(2, attempt) * 1000;
              console.log(`⏳ Waiting ${delay}ms before retry...`);
              await new Promise(resolve => setTimeout(resolve, delay));
            }
          }
        } catch (error) {
          console.error('Error checking registration:', error);
          // Show error state but don't block the UI completely
          setIsRegistered(false);
        }
      }
    };
    checkRegistration();
  }, [account, isRegisteredHospital]);

  // Function to manually refresh registration status
  const refreshRegistrationStatus = async () => {
    if (!account) return;
    
    try {
      const registryId = process.env.NEXT_PUBLIC_HOSPITAL_REGISTRY_ID || '0x0';
      console.log('🔄 Refreshing hospital registration status for:', account.address);
      
      const result = await isRegisteredHospital(registryId, account.address);
      console.log('🏥 Hospital registration result (refresh):', result);
      setIsRegistered(result);
      
      if (result) {
        alert('Hospital registration verified! You can now access the dashboard.');
      } else {
        alert('Hospital not registered. Please contact the admin to register your hospital.');
      }
    } catch (error) {
      console.error('Error refreshing registration:', error);
      alert('Error checking registration status. Please try again.');
    }
  };

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
  };

  const handleIssueRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account || !selectedFile || !recordForm.patientAddress || !recordForm.description) return;

    setIsIssuing(true);
    setIsUploading(true);

    try {
      console.log('🏥 Starting medical record issuance...');
      
      // Upload file to IPFS
      const { ipfsHash } = await uploadMedicalRecord(
        selectedFile,
        recordForm.patientAddress,
        account.address
      );
      
      setIsUploading(false);
      console.log('📋 File uploaded to IPFS:', ipfsHash);

      // Issue record on blockchain
      const registryId = process.env.NEXT_PUBLIC_HOSPITAL_REGISTRY_ID || '0x0';
      const recordRegistryId = process.env.NEXT_PUBLIC_RECORD_REGISTRY_ID || '0x0';
      const clockId = '0x6'; // Sui clock object ID
      const timestamp = Math.floor(Date.now() / 1000);

      console.log('📦 Issuing record on blockchain...');
      await issueRecord(
        registryId,
        recordRegistryId,
        recordForm.patientAddress,
        ipfsHash,
        timestamp,
        clockId
      );

      // Add to local state
      const newRecord: IssuedRecord = {
        id: crypto.randomUUID(),
        patientAddress: recordForm.patientAddress,
        fileName: selectedFile.name,
        ipfsHash,
        timestamp,
        issuedAt: new Date(),
      };
      setIssuedRecords([newRecord, ...issuedRecords]);

      // Reset form
      setRecordForm({ patientAddress: '', description: '' });
      setSelectedFile(null);
      
      console.log('✅ Medical record issued successfully!');
      alert('Medical record issued successfully!');
      
    } catch (error: any) {
      console.error('Error issuing record:', error);
      
      let errorMessage = 'Failed to issue medical record. Please try again.';
      
      // Handle specific contract errors
      if (error.message && error.message.includes('MoveAbort')) {
        const match = error.message.match(/MoveAbort.*?(\d+)/);
        if (match) {
          const errorCode = match[1];
          switch (errorCode) {
            case '2':
              errorMessage = 'Hospital not registered: Your address is not registered as a hospital. Please contact the admin to register your hospital first.';
              setIsRegistered(false); // Update registration status
              break;
            case '1':
              errorMessage = 'Permission denied: Only registered hospitals can issue medical records.';
              break;
            default:
              errorMessage = `Transaction failed with error code: ${errorCode}. Please check your permissions and try again.`;
          }
        }
      } else if (error.message && error.message.includes('timeout')) {
        errorMessage = 'Transaction timed out. Please check your wallet connection and try again.';
      } else if (error.message) {
        errorMessage = `Error: ${error.message}`;
      }
      
      alert(errorMessage);
    } finally {
      setIsIssuing(false);
      setIsUploading(false);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  if (!account) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900 relative overflow-hidden flex items-center justify-center">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10"
        >
          <Card variant="glass" className="max-w-md w-full p-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            >
              <Building2 className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
            </motion.div>
            <h2 className="text-2xl font-bold text-white mb-4">Hospital Access Required</h2>
            <p className="text-slate-300 mb-6">
              Please connect your wallet to access the hospital dashboard
            </p>
            <ConnectButton />
          </Card>
        </motion.div>
      </div>
    );
  }

  if (!isRegistered) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-900 relative overflow-hidden flex items-center justify-center">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10"
        >
          <Card variant="glass" className="max-w-md w-full p-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            >
              <Building2 className="w-16 h-16 text-red-400 mx-auto mb-4" />
            </motion.div>
            <h2 className="text-2xl font-bold text-white mb-4">Hospital Not Registered</h2>
            <p className="text-slate-300 mb-4">
              Your wallet address <code className="bg-red-900/30 px-2 py-1 rounded text-xs">{formatAddress(account.address)}</code> is not registered as a hospital.
            </p>
            <div className="bg-red-900/20 rounded-lg p-4 mb-6 text-left">
              <p className="text-red-300 font-semibold mb-2">To get registered:</p>
              <ol className="text-red-200 text-sm space-y-1 list-decimal list-inside">
                <li>Contact the system administrator</li>
                <li>Provide your wallet address: <code className="bg-red-900/30 px-1 rounded text-xs break-all">{account.address}</code></li>
                <li>Wait for admin to register your hospital in the system</li>
              </ol>
            </div>
            <div className="space-y-3">
              <Button
                onClick={refreshRegistrationStatus}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                Check Registration Status Again
              </Button>
              <Link href="/" className="inline-flex items-center justify-center w-full h-11 px-6 text-base rounded-xl font-semibold bg-white/10 text-white hover:bg-white/20 transition-all duration-200">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Return to Home
              </Link>
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-emerald-500/5 to-cyan-500/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 backdrop-blur-xl bg-white/5 border-b border-white/10"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link href="/" className="mr-4 group">
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 rounded-lg bg-white/10 backdrop-blur-sm group-hover:bg-white/20 transition-all duration-200"
                >
                  <ArrowLeft className="w-5 h-5 text-white" />
                </motion.div>
              </Link>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="flex items-center"
              >
                <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 mr-4 shadow-lg">
                  <Building2 className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Hospital Dashboard</h1>
                  <p className="text-emerald-200">Issue medical records and manage patient data</p>
                </div>
              </motion.div>
            </div>
            <div className="flex items-center space-x-4">
              <NetworkStatusIndicator />
              <div className="backdrop-blur-sm bg-white/10 rounded-xl p-2">
                <ConnectButton />
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <Card variant="glass" className="p-6 group hover:scale-105 transition-all duration-300">
            <div className="flex items-center">
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
                className="p-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 shadow-lg"
                style={{ willChange: 'transform' }}
              >
                <FileText className="w-6 h-6 text-white" />
              </motion.div>
              <div className="ml-4">
                <motion.p 
                  key={issuedRecords.length}
                  initial={{ scale: 1.2 }}
                  animate={{ scale: 1 }}
                  className="text-2xl font-bold text-white"
                >
                  {issuedRecords.length}
                </motion.p>
                <p className="text-emerald-200">Records Issued</p>
              </div>
            </div>
          </Card>
          
          <Card variant="glass" className="p-6 group hover:scale-105 transition-all duration-300">
            <div className="flex items-center">
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
                className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 shadow-lg"
                style={{ willChange: 'transform' }}
              >
                <Users className="w-6 h-6 text-white" />
              </motion.div>
              <div className="ml-4">
                <motion.p 
                  key={new Set(issuedRecords.map(r => r.patientAddress)).size}
                  initial={{ scale: 1.2 }}
                  animate={{ scale: 1 }}
                  className="text-2xl font-bold text-white"
                >
                  {new Set(issuedRecords.map(r => r.patientAddress)).size}
                </motion.p>
                <p className="text-blue-200">Patients Served</p>
              </div>
            </div>
          </Card>
          
          <Card variant="glass" className="p-6 group hover:scale-105 transition-all duration-300">
            <div className="flex items-center">
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
                className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg"
                style={{ willChange: 'transform' }}
              >
                <Clock className="w-6 h-6 text-white" />
              </motion.div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-white">
                  {issuedRecords.length > 0 ? 'Today' : 'None'}
                </p>
                <p className="text-purple-200">Last Activity</p>
              </div>
            </div>
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Issue New Record Form */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <Plus className="w-5 h-5 mr-2" />
                Issue New Medical Record
              </h2>
            </div>
            <div className="p-6">
              <form onSubmit={handleIssueRecord} className="space-y-6">
                <div>
                  <label htmlFor="patient-address" className="block text-sm font-medium text-gray-700 mb-1">
                    Patient Wallet Address
                  </label>
                  <input
                    type="text"
                    id="patient-address"
                    value={recordForm.patientAddress}
                    onChange={(e) => setRecordForm({ ...recordForm, patientAddress: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="0x..."
                    required
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Record Description
                  </label>
                  <textarea
                    id="description"
                    value={recordForm.description}
                    onChange={(e) => setRecordForm({ ...recordForm, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    rows={3}
                    placeholder="Brief description of the medical record..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Medical File
                  </label>
                  <FileUpload
                    onFileSelect={handleFileSelect}
                    acceptedTypes=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.tiff"
                    maxSize={10}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isIssuing || !selectedFile || !recordForm.patientAddress || !recordForm.description}
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  {isUploading ? (
                    <>
                      <Upload className="w-4 h-4 mr-2 animate-spin" />
                      Uploading to IPFS...
                    </>
                  ) : isIssuing ? (
                    <>
                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                      Issuing Record...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Issue Medical Record
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Issued Records List */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Recently Issued Records
              </h2>
            </div>
            <div className="p-6">
              {issuedRecords.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No records issued yet</p>
                  <p className="text-sm text-gray-400">Issue your first medical record to get started</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {issuedRecords.map((record) => (
                    <div key={record.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{record.fileName}</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            Patient: {formatAddress(record.patientAddress)}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            IPFS: {record.ipfsHash.slice(0, 12)}...
                          </p>
                          <p className="text-xs text-gray-500">
                            Issued: {formatDate(record.issuedAt)}
                          </p>
                        </div>
                        <div className="flex items-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Issued
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Hospital Information */}
        <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-start">
            <Building2 className="w-6 h-6 text-green-600 mr-3 mt-0.5" />
            <div>
              <h3 className="text-lg font-medium text-green-900 mb-2">Hospital Capabilities</h3>
              <ul className="text-green-800 space-y-1 text-sm">
                <li>• Issue encrypted medical records to patients</li>
                <li>• Upload files securely to IPFS with encryption</li>
                <li>• Track all issued records and patient interactions</li>
                <li>• Maintain patient data privacy and security</li>
              </ul>
              <p className="text-green-700 mt-3 text-sm">
                <strong>Connected as:</strong> {formatAddress(account.address)}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
