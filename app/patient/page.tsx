'use client';

import { useState, useEffect } from 'react';
import { ConnectButton, useCurrentAccount } from '@mysten/dapp-kit';
import { Users, FileText, Download, ArrowLeft, Building2, Calendar, Shield, Eye, Activity } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useMedicalRecordsContract } from '@/lib/contract-utils';
import { useIPFS } from '@/lib/ipfs-utils';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { gradients, animations, shadows } from '@/lib/ui-utils';

interface MedicalRecord {
  id: string;
  hospitalAddress: string;
  hospitalName: string;
  fileName: string;
  ipfsHash: string;
  timestamp: number;
  createdAt: Date;
  description?: string;
}

interface HospitalSummary {
  address: string;
  name: string;
  recordCount: number;
  latestRecord: Date;
}

export default function PatientDashboard() {
  const account = useCurrentAccount();
  const { getOwnedRecords } = useMedicalRecordsContract();
  const { downloadMedicalRecord, createDownloadUrl, revokeDownloadUrl } = useIPFS();
  
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [hospitalSummaries, setHospitalSummaries] = useState<HospitalSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [downloadingRecord, setDownloadingRecord] = useState<string | null>(null);

  // Load patient's medical records
  useEffect(() => {
    const loadMedicalRecords = async () => {
      if (!account) return;
      
      setIsLoading(true);
      try {
        console.log('📋 Loading medical records for patient:', account.address);
        const ownedObjects = await getOwnedRecords(account.address);
        
        console.log('📋 Owned medical record objects:', ownedObjects);
        
        // Parse real medical record objects from blockchain
        const records: MedicalRecord[] = ownedObjects.map((obj: any, index: number) => {
          const content = obj.data?.content?.fields;
          
          return {
            id: obj.data?.objectId || `record-${index}`,
            hospitalAddress: content?.hospital_address || 'Unknown Hospital',
            hospitalName: `Hospital ${content?.hospital_address?.slice(0, 6)}...${content?.hospital_address?.slice(-4)}` || 'Unknown Hospital',
            fileName: `Medical_Record_${index + 1}.pdf`,
            ipfsHash: content?.ipfs_hash || 'QmPlaceholder...',
            timestamp: parseInt(content?.timestamp) || Date.now(),
            createdAt: new Date(parseInt(content?.created_at) || Date.now()),
            description: 'Medical record issued by registered hospital'
          };
        });
        
        // Create hospital summaries
        const hospitalMap = new Map<string, HospitalSummary>();
        
        records.forEach(record => {
          const hospitalAddress = record.hospitalAddress;
          if (hospitalMap.has(hospitalAddress)) {
            const summary = hospitalMap.get(hospitalAddress)!;
            summary.recordCount += 1;
            if (record.createdAt > summary.latestRecord) {
              summary.latestRecord = record.createdAt;
            }
          } else {
            hospitalMap.set(hospitalAddress, {
              address: hospitalAddress,
              name: record.hospitalName,
              recordCount: 1,
              latestRecord: record.createdAt
            });
          }
        });
        
        const summaries = Array.from(hospitalMap.values()).sort((a, b) => 
          b.latestRecord.getTime() - a.latestRecord.getTime()
        );
        
        // If no real records, show helpful message
        if (records.length === 0) {
          console.log('📋 No medical records found for this patient');
          setMedicalRecords([]);
          setHospitalSummaries([]);
        } else {
          console.log('📋 Loaded medical records:', records);
          console.log('📋 Hospital summaries:', summaries);
          setMedicalRecords(records);
          setHospitalSummaries(summaries);
        }
      } catch (error) {
        console.error('Error loading medical records:', error);
        setMedicalRecords([]); // Set empty array on error
      } finally {
        setIsLoading(false);
      }
    };

    loadMedicalRecords();
  }, [account, getOwnedRecords]);

  const handleDownloadRecord = async (record: MedicalRecord) => {
    setDownloadingRecord(record.id);
    try {
      // For demo purposes, create a mock file
      const mockContent = `Medical Record: ${record.fileName}\nHospital: ${record.hospitalName}\nDate: ${record.createdAt.toLocaleDateString()}\nDescription: ${record.description}`;
      const blob = new Blob([mockContent], { type: 'text/plain' });
      const file = new File([blob], record.fileName, { type: 'text/plain' });
      
      const downloadUrl = createDownloadUrl(file);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = record.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      revokeDownloadUrl(downloadUrl);
      
      // In real implementation:
      // const file = await downloadMedicalRecord(record.ipfsHash, record.fileName, 'application/pdf');
      // Handle file download...
    } catch (error) {
      console.error('Error downloading record:', error);
      alert('Failed to download medical record. Please try again.');
    } finally {
      setDownloadingRecord(null);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    if (extension === 'pdf') return '📄';
    if (['jpg', 'jpeg', 'png', 'gif'].includes(extension || '')) return '🖼️';
    if (['doc', 'docx'].includes(extension || '')) return '📝';
    return '📁';
  };

  const getRecordTypeColor = (fileName: string) => {
    if (fileName.toLowerCase().includes('blood')) return 'bg-red-100 text-red-800';
    if (fileName.toLowerCase().includes('heart') || fileName.toLowerCase().includes('ecg')) return 'bg-pink-100 text-pink-800';
    if (fileName.toLowerCase().includes('x-ray') || fileName.toLowerCase().includes('scan')) return 'bg-blue-100 text-blue-800';
    return 'bg-gray-100 text-gray-800';
  };

  if (!account) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden flex items-center justify-center">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
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
              <Users className="w-16 h-16 text-purple-400 mx-auto mb-4" />
            </motion.div>
            <h2 className="text-2xl font-bold text-white mb-4">Patient Access Required</h2>
            <p className="text-slate-300 mb-6">
              Please connect your wallet to view your medical records
            </p>
            <ConnectButton />
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-purple-500/5 to-pink-500/5 rounded-full blur-3xl" />
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
                <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 mr-4 shadow-lg">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Patient Dashboard</h1>
                  <p className="text-purple-200">View and manage your medical records</p>
                </div>
              </motion.div>
            </div>
            <div className="backdrop-blur-sm bg-white/10 rounded-xl p-2">
              <ConnectButton />
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
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          <Card variant="glass" className="p-6 group hover:scale-105 transition-all duration-300">
            <div className="flex items-center">
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
                className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg"
              >
                <FileText className="w-6 h-6 text-white" />
              </motion.div>
              <div className="ml-4">
                <motion.p 
                  key={medicalRecords.length}
                  initial={{ scale: 1.2 }}
                  animate={{ scale: 1 }}
                  className="text-2xl font-bold text-white"
                >
                  {medicalRecords.length}
                </motion.p>
                <p className="text-purple-200">Total Records</p>
              </div>
            </div>
          </Card>
          
          <Card variant="glass" className="p-6 group hover:scale-105 transition-all duration-300">
            <div className="flex items-center">
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
                className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 shadow-lg"
              >
                <Building2 className="w-6 h-6 text-white" />
              </motion.div>
              <div className="ml-4">
                <motion.p 
                  key={new Set(medicalRecords.map(r => r.hospitalAddress)).size}
                  initial={{ scale: 1.2 }}
                  animate={{ scale: 1 }}
                  className="text-2xl font-bold text-white"
                >
                  {new Set(medicalRecords.map(r => r.hospitalAddress)).size}
                </motion.p>
                <p className="text-blue-200">Hospitals</p>
              </div>
            </div>
          </Card>
          
          <Card variant="glass" className="p-6 group hover:scale-105 transition-all duration-300">
            <div className="flex items-center">
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
                className="p-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 shadow-lg"
              >
                <Calendar className="w-6 h-6 text-white" />
              </motion.div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-white">
                  {medicalRecords.length > 0 ? 
                    medicalRecords[0].createdAt.toLocaleDateString() : 'None'
                  }
                </p>
                <p className="text-emerald-200">Latest Record</p>
              </div>
            </div>
          </Card>
          
          <Card variant="glass" className="p-6 group hover:scale-105 transition-all duration-300">
            <div className="flex items-center">
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
                className="p-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 shadow-lg"
              >
                <Shield className="w-6 h-6 text-white" />
              </motion.div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-white">100%</p>
                <p className="text-orange-200">Encrypted</p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Hospitals That Issued Records */}
        {hospitalSummaries.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mb-8"
          >
            <Card variant="glass" className="overflow-hidden">
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-white flex items-center">
                      <motion.div
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.6 }}
                        className="mr-3"
                      >
                        <Building2 className="w-6 h-6 text-blue-400" />
                      </motion.div>
                      Healthcare Providers
                    </h2>
                    <p className="text-blue-200 mt-1">
                      Hospitals and clinics that have issued medical records to you
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {hospitalSummaries.map((hospital, index) => (
                    <motion.div
                      key={hospital.address}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card variant="glass" className="p-4 hover:scale-105 transition-all duration-300 bg-gradient-to-br from-blue-500/10 to-cyan-500/10">
                        <div className="flex items-start space-x-3">
                          <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg">
                            <Building2 className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-white font-medium truncate">{hospital.name}</h3>
                            <p className="text-blue-300 text-xs font-mono truncate">{formatAddress(hospital.address)}</p>
                            <div className="mt-2 space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-blue-200">Records:</span>
                                <span className="text-white font-medium">{hospital.recordCount}</span>
                              </div>
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-blue-200">Latest:</span>
                                <span className="text-white">{hospital.latestRecord.toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Medical Records */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Card variant="glass" className="overflow-hidden">
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-white flex items-center">
                    <motion.div
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.6 }}
                      className="mr-3"
                    >
                      <FileText className="w-6 h-6 text-purple-400" />
                    </motion.div>
                    Your Medical Records
                  </h2>
                  <p className="text-purple-200 mt-1">
                    All your medical records are encrypted and stored securely on IPFS
                  </p>
                </div>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="p-2 rounded-lg bg-white/10"
                  style={{ willChange: 'transform' }}
                >
                  <Activity className="w-5 h-5 text-purple-400" />
                </motion.div>
              </div>
            </div>
            
            <div className="p-6">
              {isLoading ? (
                <div className="text-center py-12">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="rounded-full h-12 w-12 border-4 border-purple-500/30 border-t-purple-400 mx-auto mb-4"
                    style={{ willChange: 'transform' }}
                  />
                  <p className="text-purple-200">Loading your medical records...</p>
                </div>
              ) : medicalRecords.length === 0 ? (
                <div className="text-center py-12">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <FileText className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                  </motion.div>
                  <h3 className="text-lg font-medium text-white mb-2">No Medical Records</h3>
                  <p className="text-purple-200 mb-6">
                    You don't have any medical records yet. When hospitals issue records to your wallet, they will appear here.
                  </p>
                  <Link href="/" className="inline-flex items-center justify-center h-11 px-6 text-base rounded-xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl">
                    Return to Home
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  <AnimatePresence>
                    {medicalRecords.map((record, index) => (
                      <motion.div 
                        key={record.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.1 }}
                        className="group"
                      >
                        <Card variant="glass" className="p-6 hover:scale-[1.02] transition-all duration-300">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-4 flex-1">
                              <motion.div 
                                className="text-2xl p-2 rounded-lg bg-white/10"
                                whileHover={{ scale: 1.1 }}
                              >
                                {getFileIcon(record.fileName)}
                              </motion.div>
                              <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-2">
                                  <h3 className="text-lg font-medium text-white">{record.fileName}</h3>
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-500/20 text-purple-200 border border-purple-400/30`}>
                                    {record.fileName.split('_')[0].replace(/([A-Z])/g, ' $1').trim()}
                                  </span>
                                </div>
                                
                                <div className="space-y-2 text-sm text-purple-200">
                                  <div className="flex items-center space-x-2">
                                    <Building2 className="w-4 h-4 text-blue-400" />
                                    <span>Issued by: {record.hospitalName}</span>
                                    <span className="text-purple-300">({formatAddress(record.hospitalAddress)})</span>
                                  </div>
                                  
                                  <div className="flex items-center space-x-2">
                                    <Calendar className="w-4 h-4 text-emerald-400" />
                                    <span>Date: {formatDate(record.createdAt)}</span>
                                  </div>
                                  
                                  {record.description && (
                                    <div className="flex items-start space-x-2">
                                      <Eye className="w-4 h-4 mt-0.5 text-cyan-400" />
                                      <span>{record.description}</span>
                                    </div>
                                  )}
                                  
                                  <div className="flex items-center space-x-2">
                                    <Shield className="w-4 h-4 text-orange-400" />
                                    <span className="font-mono text-xs">IPFS: {record.ipfsHash.slice(0, 20)}...</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            <Button
                              onClick={() => handleDownloadRecord(record)}
                              disabled={downloadingRecord === record.id}
                              variant="primary"
                              gradient
                              loading={downloadingRecord === record.id}
                              icon={!downloadingRecord ? <Download className="w-4 h-4" /> : undefined}
                            >
                              {downloadingRecord === record.id ? 'Downloading...' : 'Download'}
                            </Button>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Patient Information */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-8"
        >
          <Card variant="glass" className="p-6">
            <div className="flex items-start">
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 mr-4 shadow-lg"
              >
                <Users className="w-6 h-6 text-white" />
              </motion.div>
              <div>
                <h3 className="text-lg font-medium text-white mb-2">Your Rights & Privacy</h3>
                <ul className="text-purple-200 space-y-1 text-sm">
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-purple-400 rounded-full" />
                    <span>You own and control all your medical data</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-purple-400 rounded-full" />
                    <span>All records are encrypted before storage on IPFS</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-purple-400 rounded-full" />
                    <span>Only you can decrypt and view your medical files</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-purple-400 rounded-full" />
                    <span>Records are permanently stored on the blockchain</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-purple-400 rounded-full" />
                    <span>You can download your records anytime, anywhere</span>
                  </li>
                </ul>
                <div className="mt-4 p-3 rounded-lg bg-white/10 border border-purple-400/30">
                  <p className="text-purple-200 text-sm flex items-center">
                    <Shield className="w-4 h-4 mr-2 text-purple-400" />
                    <strong>Your Wallet:</strong> 
                    <span className="ml-2 font-mono text-purple-300">{formatAddress(account.address)}</span>
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}