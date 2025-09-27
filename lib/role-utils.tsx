'use client';

import { useState, useEffect } from 'react';
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { CONTRACT_CONFIG } from './contract-utils';

export interface UserRole {
  isAdmin: boolean;
  isHospital: boolean;
  isPatient: boolean;
  isLoading: boolean;
  hasRole: boolean;
}

export function useUserRole(): UserRole {
  const account = useCurrentAccount();
  const client = useSuiClient();
  const [role, setRole] = useState<UserRole>({
    isAdmin: false,
    isHospital: false,
    isPatient: false,
    isLoading: true,
    hasRole: false,
  });

  useEffect(() => {
    if (!account?.address) {
      setRole({
        isAdmin: false,
        isHospital: false,
        isPatient: false,
        isLoading: false,
        hasRole: false,
      });
      return;
    }

    let isMounted = true;

    const checkUserRole = async () => {
      console.log('🔍 Checking role for address:', account.address);
      
      // Small delay to ensure wallet connection is stable
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const roles = {
        isAdmin: false,
        isHospital: false,
        isPatient: false,
      };

      try {
        // Debug environment variables
        console.log('🗺️ Environment check:');
        console.log('- Package ID:', process.env.NEXT_PUBLIC_PACKAGE_ID);
        console.log('- Admin Cap ID:', process.env.NEXT_PUBLIC_ADMIN_CAP_ID);
        console.log('- Hospital Registry ID:', process.env.NEXT_PUBLIC_HOSPITAL_REGISTRY_ID);
        
        // Check if user is admin by checking if they own the AdminCap
        const adminCapId = process.env.NEXT_PUBLIC_ADMIN_CAP_ID;
        console.log('🔧 Admin Cap ID:', adminCapId);
        
        if (adminCapId && adminCapId !== '0x0') {
          try {
            console.log('🔍 Fetching AdminCap object...');
            const adminCapObject = await client.getObject({
              id: adminCapId,
              options: { showOwner: true, showContent: true },
            });
            
            console.log('👑 Admin Cap Object:', adminCapObject);
            
            if (adminCapObject.data?.owner) {
              console.log('👑 Admin Cap Owner details:', adminCapObject.data.owner);
              console.log('👤 Current user address:', account.address);
              
              if (typeof adminCapObject.data.owner === 'object' &&
                  'AddressOwner' in adminCapObject.data.owner && 
                  adminCapObject.data.owner.AddressOwner === account.address) {
                roles.isAdmin = true;
                console.log('✅ User is ADMIN - AdminCap owner match!');
              } else {
                console.log('❌ User is NOT admin. Expected:', account.address, 'Got:', adminCapObject.data.owner);
              }
            } else {
              console.log('❌ Admin Cap has no owner information');
            }
          } catch (error) {
            console.log('⚠️ Error checking admin role:', error);
          }
        } else {
          console.log('❌ No Admin Cap ID configured');
        }

        // Check if user is a registered hospital
        const hospitalRegistryId = process.env.NEXT_PUBLIC_HOSPITAL_REGISTRY_ID;
        const packageId = process.env.NEXT_PUBLIC_PACKAGE_ID;
        
        console.log('🏥 Hospital Registry ID:', hospitalRegistryId);
        console.log('📦 Package ID:', packageId);
        
        if (hospitalRegistryId && hospitalRegistryId !== '0x0' && packageId && packageId !== '0x0') {
          try {
            const result = await client.devInspectTransactionBlock({
              transactionBlock: (() => {
                const tx = new Transaction();
                tx.moveCall({
                  target: `${packageId}::medical_records::is_registered_hospital`,
                  arguments: [
                    tx.object(hospitalRegistryId),
                    tx.pure.address(account.address),
                  ],
                });
                return tx;
              })(),
              sender: '0x0000000000000000000000000000000000000000000000000000000000000000',
            });
            
            console.log('🏥 Hospital check result:', result);
            
            // Parse the boolean result properly
            if (result.results && result.results.length > 0 && 
                result.results[0].returnValues && result.results[0].returnValues.length > 0) {
              const returnValue = result.results[0].returnValues[0] as any;
              console.log('🏥 Raw return value:', returnValue);
              
              // Handle different possible return formats
              let isRegistered = false;
              if (Array.isArray(returnValue)) {
                isRegistered = returnValue.length > 0 && (returnValue[0] === 1 || returnValue[0] === true);
              } else {
                isRegistered = returnValue === 1 || returnValue === true;
              }
              
              if (isRegistered) {
                roles.isHospital = true;
                console.log('✅ User is HOSPITAL (verified in contract)');
              } else {
                console.log('❌ User is NOT hospital (not in contract registry)');
              }
            } else {
              console.log('❌ No valid return from hospital check');
            }
          } catch (error) {
            console.log('⚠️ Error checking hospital role:', error);
            // If we can't verify, assume not a hospital for safety
            roles.isHospital = false;
          }
        }

        // Check if user has any medical records (making them a patient)
        if (packageId && packageId !== '0x0') {
          try {
            const ownedObjects = await client.getOwnedObjects({
              owner: account.address,
              filter: {
                StructType: `${packageId}::medical_records::MedicalRecord`,
              },
              options: {
                showContent: true,
                showDisplay: true,
              },
            });
            
            console.log('📋 Owned medical records:', ownedObjects);
            
            if (ownedObjects.data.length > 0) {
              roles.isPatient = true;
              console.log('✅ User is PATIENT (has records)');
            } else {
              console.log('❌ User has no medical records');
            }
          } catch (error) {
            console.log('⚠️ Error checking patient role:', error);
          }
        }

        // If user has no specific role but is connected, they can be considered a potential patient
        if (!roles.isAdmin && !roles.isHospital && !roles.isPatient) {
          // For any connected wallet that doesn't have specific roles, default to patient
          roles.isPatient = true;
          console.log('🏥 User has no detected roles, defaulting to patient');
        }

        console.log('🎭 Final roles:', roles);

        if (isMounted) {
          // Always consider user as having a role if wallet is connected
          const hasRole = roles.isAdmin || roles.isHospital || roles.isPatient;
          setRole({
            ...roles,
            isLoading: false,
            hasRole: true, // Always true for connected wallets
          });
        }
      } catch (error) {
        console.error('❌ Error checking user role:', error);
        if (isMounted) {
          setRole({
            isAdmin: false,
            isHospital: false,
            isPatient: true, // Default to patient role if role check fails
            isLoading: false,
            hasRole: true,
          });
        }
      }
    };

    setRole(prev => ({ ...prev, isLoading: true }));
    checkUserRole();

    return () => {
      isMounted = false;
    };
  }, [account?.address, client]);

  return role;
}

export function getRoleDisplayName(role: UserRole): string {
  const roles = [];
  if (role.isAdmin) roles.push('System Administrator');
  if (role.isHospital) roles.push('Registered Hospital');
  if (role.isPatient) roles.push('Patient');
  
  if (roles.length === 0) return 'Unknown Role';
  if (roles.length === 1) return roles[0];
  if (roles.length === 2) return `${roles[0]} & ${roles[1]}`;
  return roles.join(', ');
}

export function getPrimaryRole(role: UserRole): 'admin' | 'hospital' | 'patient' | null {
  if (role.isAdmin) return 'admin';
  if (role.isHospital) return 'hospital';
  if (role.isPatient) return 'patient';
  return null;
}

export function getAvailableRoutes(role: UserRole): Array<{
  path: string;
  name: string;
  description: string;
  color: string;
  gradient: string;
}> {
  const routes = [];

  if (role.isAdmin) {
    routes.push({
      path: '/admin',
      name: 'Admin Portal',
      description: 'Register hospitals, manage system permissions, and monitor platform activity.',
      color: 'purple',
      gradient: 'from-purple-500 to-indigo-600',
    });
  }

  if (role.isHospital) {
    routes.push({
      path: '/hospital',
      name: 'Hospital Portal',
      description: 'Issue encrypted medical records, manage patient data, and track healthcare delivery.',
      color: 'emerald',
      gradient: 'from-emerald-500 to-teal-600',
    });
  }

  if (role.isPatient) {
    routes.push({
      path: '/patient',
      name: 'Patient Portal',
      description: 'Access your medical records, download files, and manage your healthcare data.',
      color: 'pink',
      gradient: 'from-pink-500 to-rose-600',
    });
  }

  return routes;
}