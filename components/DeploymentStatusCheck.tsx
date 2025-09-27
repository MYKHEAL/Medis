'use client';

import { useState, useEffect } from 'react';

export function DeploymentStatusCheck() {
  const [allConfigured, setAllConfigured] = useState(false);
  
  useEffect(() => {
    const packageId = process.env.NEXT_PUBLIC_PACKAGE_ID;
    const adminCapId = process.env.NEXT_PUBLIC_ADMIN_CAP_ID;
    const hospitalRegistryId = process.env.NEXT_PUBLIC_HOSPITAL_REGISTRY_ID;
    const recordRegistryId = process.env.NEXT_PUBLIC_RECORD_REGISTRY_ID;
    
    const isValidId = (id: string | undefined) => 
      id && id !== '0x0' && id !== 'undefined' && id.length > 10;
    
    const configured = Boolean(isValidId(packageId) && isValidId(adminCapId) && 
                     isValidId(hospitalRegistryId) && isValidId(recordRegistryId));
    
    setAllConfigured(configured);
    
    if (!configured && process.env.NODE_ENV === 'production') {
      console.error('⚠️ Missing environment variables for production deployment');
    }
  }, []);
  
  if (allConfigured) return null;
  
  return (
    <div className="mb-4 bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
      <div className="flex items-center">
        <span className="text-amber-400 mr-2">⚠️</span>
        <span className="text-amber-300">Environment variables not fully configured</span>
      </div>
    </div>
  );
}