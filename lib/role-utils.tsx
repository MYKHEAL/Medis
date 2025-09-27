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
      const roles = {
        isAdmin: false,
        isHospital: false,
        isPatient: false,
      };

      try {
        // Check if user is admin by checking if they own the AdminCap
        const adminCapId = process.env.NEXT_PUBLIC_ADMIN_CAP_ID;
        if (adminCapId && adminCapId !== '0x0') {
          try {
            const adminCapObject = await client.getObject({
              id: adminCapId,
              options: { showOwner: true },
            });
            
            if (adminCapObject.data?.owner && 
                typeof adminCapObject.data.owner === 'object' &&
                'AddressOwner' in adminCapObject.data.owner && 
                adminCapObject.data.owner.AddressOwner === account.address) {
              roles.isAdmin = true;
            }
          } catch (error) {
            console.log('Error checking admin role:', error);
          }
        }

        // Check if user is a registered hospital
        const hospitalRegistryId = process.env.NEXT_PUBLIC_HOSPITAL_REGISTRY_ID;
        if (hospitalRegistryId && hospitalRegistryId !== '0x0') {
          try {
            const result = await client.devInspectTransactionBlock({
              transactionBlock: (() => {
                const tx = new Transaction();
                tx.moveCall({
                  target: `${CONTRACT_CONFIG.packageId}::${CONTRACT_CONFIG.moduleName}::is_registered_hospital`,
                  arguments: [
                    tx.object(hospitalRegistryId),
                    tx.pure.address(account.address),
                  ],
                });
                return tx;
              })(),
              sender: '0x0000000000000000000000000000000000000000000000000000000000000000',
            });
            
            if (result.results?.[0]?.returnValues?.[0]?.[0]) {
              roles.isHospital = true;
            }
          } catch (error) {
            console.log('Error checking hospital role:', error);
          }
        }

        // Check if user has any medical records (making them a patient)
        try {
          const ownedObjects = await client.getOwnedObjects({
            owner: account.address,
            filter: {
              StructType: `${CONTRACT_CONFIG.packageId}::${CONTRACT_CONFIG.moduleName}::MedicalRecord`,
            },
            options: {
              showContent: true,
              showDisplay: true,
            },
          });
          
          if (ownedObjects.data.length > 0) {
            roles.isPatient = true;
          }
        } catch (error) {
          console.log('Error checking patient role:', error);
        }

        // If user has no specific role but is connected, they can be considered a potential patient
        if (!roles.isAdmin && !roles.isHospital && !roles.isPatient) {
          roles.isPatient = true; // Default role for any connected user
        }

        if (isMounted) {
          const hasRole = roles.isAdmin || roles.isHospital || roles.isPatient;
          setRole({
            ...roles,
            isLoading: false,
            hasRole,
          });
        }
      } catch (error) {
        console.error('Error checking user role:', error);
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
  if (role.isAdmin) return 'System Administrator';
  if (role.isHospital) return 'Registered Hospital';
  if (role.isPatient) return 'Patient';
  return 'Unknown Role';
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