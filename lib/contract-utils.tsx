// Smart contract interaction utilities for Medis dApp
'use client';

import { useSuiClient, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { SuiObjectResponse } from '@mysten/sui/client';

// Contract addresses (these will be set after deployment)
export const CONTRACT_CONFIG = {
  packageId: process.env.NEXT_PUBLIC_PACKAGE_ID || '0x0', // Will be set after deployment
  moduleName: 'medical_records',
} as const;

// Types for contract interactions
export interface HospitalInfo {
  name: string;
  address: string;
  registered_at: string;
}

export interface MedicalRecord {
  id: string;
  patient_address: string;
  hospital_address: string;
  ipfs_hash: string;
  timestamp: string;
  created_at: string;
}

// Hook for contract interactions
export function useMedicalRecordsContract() {
  const client = useSuiClient();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();

  // Admin functions
  const registerHospital = async (
    adminCapId: string,
    registryId: string,
    hospitalAddress: string,
    hospitalName: string,
    clockId: string
  ) => {
    console.log('🔧 Register Hospital Debug Info:');
    console.log('Package ID:', CONTRACT_CONFIG.packageId);
    console.log('Admin Cap ID:', adminCapId);
    console.log('Registry ID:', registryId);
    console.log('Hospital Address:', hospitalAddress);
    console.log('Hospital Name:', hospitalName);
    console.log('Clock ID:', clockId);
    
    try {
      const tx = new Transaction();
      
      tx.moveCall({
        target: `${CONTRACT_CONFIG.packageId}::${CONTRACT_CONFIG.moduleName}::register_hospital`,
        arguments: [
          tx.object(adminCapId),
          tx.object(registryId),
          tx.pure.address(hospitalAddress),
          tx.pure.string(hospitalName),
          tx.object(clockId),
        ],
      });

      return new Promise((resolve, reject) => {
        signAndExecute(
          { transaction: tx },
          {
            onSuccess: (result) => {
              console.log('✅ Registration successful:', result);
              resolve(result);
            },
            onError: (error) => {
              console.error('❌ Registration failed:', error);
              
              // Enhanced error handling
              let userMessage = 'Transaction failed. ';
              
              if (error?.message) {
                if (error.message.includes('User rejected')) {
                  userMessage = 'Transaction was cancelled by user.';
                } else if (error.message.includes('Insufficient gas')) {
                  userMessage = 'Insufficient gas. Please try again.';
                } else if (error.message.includes('network')) {
                  userMessage = 'Network error. Check your connection and try again.';
                } else if (error.message.includes('Invalid object')) {
                  userMessage = 'Invalid object reference. Please refresh and try again.';
                } else {
                  userMessage += error.message;
                }
              }
              
              const enhancedError = new Error(userMessage);
              enhancedError.cause = error;
              reject(enhancedError);
            },
          }
        );
      });
    } catch (error) {
      console.error('❌ Transaction setup failed:', error);
      throw new Error('Failed to prepare transaction. Please check your wallet connection.');
    }
  };

  // Hospital functions
  const issueRecord = async (
    registryId: string,
    recordRegistryId: string,
    patientAddress: string,
    ipfsHash: string,
    timestamp: number,
    clockId: string
  ) => {
    try {
      const tx = new Transaction();
      
      tx.moveCall({
        target: `${CONTRACT_CONFIG.packageId}::${CONTRACT_CONFIG.moduleName}::issue_record`,
        arguments: [
          tx.object(registryId),
          tx.object(recordRegistryId),
          tx.pure.address(patientAddress),
          tx.pure.string(ipfsHash),
          tx.pure.u64(timestamp),
          tx.object(clockId),
        ],
      });

      return new Promise((resolve, reject) => {
        signAndExecute(
          { transaction: tx },
          {
            onSuccess: (result) => {
              console.log('✅ Record issued successfully:', result);
              resolve(result);
            },
            onError: (error) => {
              console.error('❌ Record issuance failed:', error);
              
              // Enhanced error handling
              let userMessage = 'Failed to issue medical record. ';
              
              if (error?.message) {
                if (error.message.includes('User rejected')) {
                  userMessage = 'Transaction was cancelled by user.';
                } else if (error.message.includes('Insufficient gas')) {
                  userMessage = 'Insufficient gas. Please get more SUI tokens and try again.';
                } else if (error.message.includes('network')) {
                  userMessage = 'Network error. Check your connection and try again.';
                } else if (error.message.includes('not registered')) {
                  userMessage = 'Hospital not registered. Please contact admin.';
                } else {
                  userMessage += error.message;
                }
              }
              
              const enhancedError = new Error(userMessage);
              enhancedError.cause = error;
              reject(enhancedError);
            },
          }
        );
      });
    } catch (error) {
      console.error('❌ Transaction setup failed:', error);
      throw new Error('Failed to prepare transaction. Please check your wallet connection.');
    }
  };

  // Query functions
  const getHospitalInfo = async (registryId: string, hospitalAddress: string) => {
    try {
      const result = await client.devInspectTransactionBlock({
        transactionBlock: (() => {
          const tx = new Transaction();
          tx.moveCall({
            target: `${CONTRACT_CONFIG.packageId}::${CONTRACT_CONFIG.moduleName}::get_hospital_info`,
            arguments: [
              tx.object(registryId),
              tx.pure.address(hospitalAddress),
            ],
          });
          return tx;
        })(),
        sender: '0x0000000000000000000000000000000000000000000000000000000000000000',
      });
      return result;
    } catch (error) {
      console.error('Error getting hospital info:', error);
      throw error;
    }
  };

  const isRegisteredHospital = async (registryId: string, hospitalAddress: string) => {
    try {
      const result = await client.devInspectTransactionBlock({
        transactionBlock: (() => {
          const tx = new Transaction();
          tx.moveCall({
            target: `${CONTRACT_CONFIG.packageId}::${CONTRACT_CONFIG.moduleName}::is_registered_hospital`,
            arguments: [
              tx.object(registryId),
              tx.pure.address(hospitalAddress),
            ],
          });
          return tx;
        })(),
        sender: '0x0000000000000000000000000000000000000000000000000000000000000000',
      });
      return result;
    } catch (error) {
      console.error('Error checking hospital registration:', error);
      throw error;
    }
  };

  const getOwnedRecords = async (ownerAddress: string) => {
    try {
      const result = await client.getOwnedObjects({
        owner: ownerAddress,
        filter: {
          StructType: `${CONTRACT_CONFIG.packageId}::${CONTRACT_CONFIG.moduleName}::MedicalRecord`,
        },
        options: {
          showContent: true,
          showDisplay: true,
        },
      });
      return result.data;
    } catch (error) {
      console.error('Error getting owned records:', error);
      throw error;
    }
  };

  const getRecordsCount = async (recordRegistryId: string) => {
    try {
      const result = await client.devInspectTransactionBlock({
        transactionBlock: (() => {
          const tx = new Transaction();
          tx.moveCall({
            target: `${CONTRACT_CONFIG.packageId}::${CONTRACT_CONFIG.moduleName}::get_records_count`,
            arguments: [tx.object(recordRegistryId)],
          });
          return tx;
        })(),
        sender: '0x0000000000000000000000000000000000000000000000000000000000000000',
      });
      return result;
    } catch (error) {
      console.error('Error getting records count:', error);
      throw error;
    }
  };

  return {
    // Admin functions
    registerHospital,
    
    // Hospital functions
    issueRecord,
    
    // Query functions
    getHospitalInfo,
    isRegisteredHospital,
    getOwnedRecords,
    getRecordsCount,
  };
}