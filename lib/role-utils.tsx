'use client';

import { useState, useEffect } from 'react';
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';

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
      console.log('🔍 Checking roles for address:', account.address);
      
      const roles = {
        isAdmin: false,
        isHospital: false,
        isPatient: false,
      };

      try {
        // === ADMIN CHECK ===
        const adminCapId = process.env.NEXT_PUBLIC_ADMIN_CAP_ID;
        console.log('🔧 Admin Cap ID from env:', adminCapId);
        
        if (adminCapId && adminCapId !== '0x0' && adminCapId !== 'undefined') {
          try {
            const adminCapObject = await client.getObject({
              id: adminCapId,
              options: { showOwner: true, showContent: true },
            });
            
            console.log('👑 AdminCap object:', adminCapObject);
            
            if (adminCapObject.data?.owner && 
                typeof adminCapObject.data.owner === 'object' &&
                'AddressOwner' in adminCapObject.data.owner) {
              const ownerAddress = adminCapObject.data.owner.AddressOwner;
              console.log('👑 AdminCap owner:', ownerAddress);
              console.log('👤 Current user:', account.address);
              
              if (ownerAddress === account.address) {
                roles.isAdmin = true;
                console.log('✅ USER IS ADMIN!');
              } else {
                console.log('❌ User is NOT admin');
              }
            } else {
              console.log('❌ AdminCap has no valid owner');
            }
          } catch (error) {
            console.log('⚠️ Error checking admin role:', error);
          }
        } else {
          console.log('❌ No valid AdminCap ID configured (value:', adminCapId, ')');
        }

        // === HOSPITAL CHECK ===
        const hospitalRegistryId = process.env.NEXT_PUBLIC_HOSPITAL_REGISTRY_ID;
        const packageId = process.env.NEXT_PUBLIC_PACKAGE_ID;
        
        if (hospitalRegistryId && packageId && 
            hospitalRegistryId !== '0x0' && packageId !== '0x0' &&
            hospitalRegistryId !== 'undefined' && packageId !== 'undefined') {
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
            
            if (result.results?.[0]?.returnValues?.[0]) {
              const returnValue = result.results[0].returnValues[0] as any;
              // Boolean is returned as [1] for true, [0] for false
              const isHospital = Array.isArray(returnValue) && returnValue.length > 0 && returnValue[0] === 1;
              
              if (isHospital) {
                roles.isHospital = true;
                console.log('✅ USER IS HOSPITAL!');
              } else {
                console.log('❌ User is NOT hospital');
              }
            }
          } catch (error) {
            console.log('⚠️ Error checking hospital role:', error);
          }
        } else {
          console.log('❌ Missing hospital registry or package ID (registry:', hospitalRegistryId, 'package:', packageId, ')');
        }

        // === PATIENT CHECK ===
        if (packageId && packageId !== '0x0' && packageId !== 'undefined') {
          try {
            const ownedObjects = await client.getOwnedObjects({
              owner: account.address,
              filter: {
                StructType: `${packageId}::medical_records::MedicalRecord`,
              },
              options: { showContent: true },
            });
            
            console.log('📋 Medical records owned:', ownedObjects.data.length);
            
            if (ownedObjects.data.length > 0) {
              roles.isPatient = true;
              console.log('✅ USER IS PATIENT!');
            } else {
              console.log('❌ User has no medical records');
            }
          } catch (error) {
            console.log('⚠️ Error checking patient role:', error);
          }
        } else {
          console.log('❌ No valid package ID for patient check (value:', packageId, ')');
        }

        // Default to patient if no other roles (connected users can be potential patients)
        if (!roles.isAdmin && !roles.isHospital && !roles.isPatient) {
          roles.isPatient = true;
          console.log('🏥 Defaulting to patient role');
        }

        console.log('🎭 Final roles:', roles);

        if (isMounted) {
          const hasRole = roles.isAdmin || roles.isHospital || roles.isPatient;
          setRole({
            ...roles,
            isLoading: false,
            hasRole,
          });
        }
      } catch (error) {
        console.error('❌ Error in role detection:', error);
        if (isMounted) {
          // Default to patient role on error
          setRole({
            isAdmin: false,
            isHospital: false,
            isPatient: true,
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