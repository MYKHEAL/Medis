// Smart contract interaction utilities for Medis dApp
'use client';

import { useSuiClient, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { SuiObjectResponse } from '@mysten/sui/client';

// Contract addresses (these will be set after deployment)
export const CONTRACT_CONFIG = {
  packageId: process.env.NEXT_PUBLIC_PACKAGE_ID || '0x0',
  moduleName: 'medical_records',
} as const;

// Validate environment variables
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
  const requiredEnvVars = [
    'NEXT_PUBLIC_PACKAGE_ID',
    'NEXT_PUBLIC_HOSPITAL_REGISTRY_ID',
    'NEXT_PUBLIC_RECORD_REGISTRY_ID',
    'NEXT_PUBLIC_ADMIN_CAP_ID'
  ];
  
  const missingVars = requiredEnvVars.filter(varName => 
    !process.env[varName] || process.env[varName] === '0x0'
  );
  
  if (missingVars.length > 0) {
    console.warn('⚠️ Missing required environment variables for production:', missingVars);
    console.warn('Please set these variables in your Vercel dashboard under Environment Variables');
  }
}

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

  // Helper function to check if hospital is registered
  const isRegisteredHospital = async (registryId: string, hospitalAddress: string): Promise<boolean> => {
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
      
      // Parse the boolean result from the smart contract
      if (result.results && result.results.length > 0 && 
          result.results[0].returnValues && result.results[0].returnValues.length > 0) {
        const returnValue = result.results[0].returnValues[0] as any;
        console.log('Hospital registration check result:', returnValue);
        
        // Handle different possible return formats
        if (Array.isArray(returnValue)) {
          return returnValue.length > 0 && (returnValue[0] === 1 || returnValue[0] === true);
        } else {
          return returnValue === 1 || returnValue === true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error checking hospital registration:', error);
      // In case of error, assume not registered to be safe
      return false;
    }
  };

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
    
    // CRITICAL: Check if hospital is already registered before attempting registration
    // This prevents EHospitalAlreadyRegistered (error code 3) aborts
    try {
      console.log('🔍 Checking if hospital is already registered...');
      const isAlreadyRegistered = await isRegisteredHospital(registryId, hospitalAddress);
      
      if (isAlreadyRegistered) {
        const error = new Error(`Hospital with address ${hospitalAddress} is already registered in the system.`);
        console.error('❌ Registration blocked - hospital already exists:', hospitalAddress);
        throw error;
      }
      
      console.log('✅ Hospital is not registered yet, proceeding with registration...');
    } catch (checkError: any) {
      // If it's our custom error, re-throw it
      if (checkError.message.includes('already registered')) {
        throw checkError;
      }
      // If it's a network/other error, log but continue (fail-safe)
      console.warn('⚠️ Could not verify registration status, proceeding anyway:', checkError);
    }
    
    console.log('🔨 Building transaction...');
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

    console.log('📤 Submitting transaction to wallet...');
    return new Promise((resolve, reject) => {
      // Add timeout to prevent hanging
      const timeoutId = setTimeout(() => {
        console.error('⏱️ Transaction timeout - wallet did not respond within 60 seconds');
        reject(new Error('Transaction timeout: Wallet did not respond within 60 seconds. Please try again.'));
      }, 60000); // 60 second timeout

      signAndExecute(
        { transaction: tx },
        {
          onSuccess: (result) => {
            clearTimeout(timeoutId);
            console.log('✅ Registration successful:', result);
            resolve(result);
          },
          onError: (error) => {
            clearTimeout(timeoutId);
            console.error('❌ Registration failed:', error);
            reject(error);
          },
        }
      );
    });
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
          onSuccess: (result) => resolve(result),
          onError: (error) => reject(error),
        }
      );
    });
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
