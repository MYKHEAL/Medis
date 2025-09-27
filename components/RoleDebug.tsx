'use client';

import { useCurrentAccount } from '@mysten/dapp-kit';
import { useUserRole } from '@/lib/role-utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export function RoleDebug() {
  const account = useCurrentAccount();
  const userRole = useUserRole();

  if (!account) return null;

  return (
    <Card className="bg-black/50 border-yellow-500/50 max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-yellow-400 text-sm font-mono">
          🐛 Debug Panel (Remove in Production)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-xs font-mono">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <p className="text-gray-400">Wallet Address:</p>
            <p className="text-white break-all">{account.address}</p>
          </div>
          <div>
            <p className="text-gray-400">Network:</p>
            <p className="text-white">{process.env.NEXT_PUBLIC_SUI_NETWORK || 'Unknown'}</p>
          </div>
        </div>
        
        <div className="border-t border-gray-700 pt-3">
          <p className="text-gray-400 mb-2">Role Detection Status:</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div className={`p-2 rounded ${userRole.isLoading ? 'bg-yellow-900/50' : 'bg-gray-800'}`}>
              <p className="text-gray-400">Loading:</p>
              <p className={userRole.isLoading ? 'text-yellow-400' : 'text-gray-300'}>
                {userRole.isLoading ? 'Yes' : 'No'}
              </p>
            </div>
            <div className={`p-2 rounded ${userRole.isAdmin ? 'bg-purple-900/50' : 'bg-gray-800'}`}>
              <p className="text-gray-400">Admin:</p>
              <p className={userRole.isAdmin ? 'text-purple-400' : 'text-gray-300'}>
                {userRole.isAdmin ? 'Yes' : 'No'}
              </p>
            </div>
            <div className={`p-2 rounded ${userRole.isHospital ? 'bg-emerald-900/50' : 'bg-gray-800'}`}>
              <p className="text-gray-400">Hospital:</p>
              <p className={userRole.isHospital ? 'text-emerald-400' : 'text-gray-300'}>
                {userRole.isHospital ? 'Yes' : 'No'}
              </p>
            </div>
            <div className={`p-2 rounded ${userRole.isPatient ? 'bg-pink-900/50' : 'bg-gray-800'}`}>
              <p className="text-gray-400">Patient:</p>
              <p className={userRole.isPatient ? 'text-pink-400' : 'text-gray-300'}>
                {userRole.isPatient ? 'Yes' : 'No'}
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700 pt-3">
          <p className="text-gray-400 mb-2">Environment Config:</p>
          <div className="space-y-1">
            <div>
              <span className="text-gray-400">Package ID: </span>
              <span className="text-white">{process.env.NEXT_PUBLIC_PACKAGE_ID || 'Not Set'}</span>
            </div>
            <div>
              <span className="text-gray-400">Admin Cap ID: </span>
              <span className="text-white">{process.env.NEXT_PUBLIC_ADMIN_CAP_ID || 'Not Set'}</span>
            </div>
            <div>
              <span className="text-gray-400">Hospital Registry ID: </span>
              <span className="text-white">{process.env.NEXT_PUBLIC_HOSPITAL_REGISTRY_ID || 'Not Set'}</span>
            </div>
          </div>
        </div>

        <div className="text-center pt-3 border-t border-gray-700">
          <p className="text-gray-500 text-xs">
            Check browser console for detailed logs (F12 → Console)
          </p>
        </div>
      </CardContent>
    </Card>
  );
}