// Test component to verify role detection works properly
'use client';

import React from 'react';
import { useUserRole } from '@/lib/role-utils';
import { useCurrentAccount } from '@mysten/dapp-kit';

export default function RoleDebug() {
  const account = useCurrentAccount();
  const userRole = useUserRole();

  if (!account) {
    return (
      <div className="p-4 bg-gray-100 rounded-lg">
        <h3 className="font-bold text-gray-800">Role Debug</h3>
        <p className="text-gray-600">No wallet connected</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <h3 className="font-bold text-gray-800 mb-2">Role Debug</h3>
      <div className="space-y-1 text-sm">
        <p><strong>Address:</strong> {account.address}</p>
        <p><strong>Loading:</strong> {userRole.isLoading ? 'Yes' : 'No'}</p>
        <p><strong>Is Admin:</strong> {userRole.isAdmin ? 'Yes' : 'No'}</p>
        <p><strong>Is Hospital:</strong> {userRole.isHospital ? 'Yes' : 'No'}</p>
        <p><strong>Is Patient:</strong> {userRole.isPatient ? 'Yes' : 'No'}</p>
        <p><strong>Has Role:</strong> {userRole.hasRole ? 'Yes' : 'No'}</p>
      </div>
    </div>
  );
}