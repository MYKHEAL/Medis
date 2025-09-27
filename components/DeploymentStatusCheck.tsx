'use client';

export function DeploymentStatusCheck() {
  // Only show deployment status in development environment
  if (process.env.NODE_ENV === 'production') {
    return null;
  }
  
  // In development, check if environment variables are configured
  const envVars = [
    process.env.NEXT_PUBLIC_PACKAGE_ID,
    process.env.NEXT_PUBLIC_ADMIN_CAP_ID,
    process.env.NEXT_PUBLIC_HOSPITAL_REGISTRY_ID,
    process.env.NEXT_PUBLIC_RECORD_REGISTRY_ID,
  ];
  
  const isValidId = (id: string | undefined) => 
    id && id !== '0x0' && id !== 'undefined' && id.length > 10;
  
  const allConfigured = envVars.every(isValidId);
  
  // Only show warning in development if not all configured
  if (allConfigured) {
    return null;
  }
  
  return (
    <div className="mb-4 bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
      <div className="flex items-center">
        <span className="text-amber-400 mr-2">⚠️</span>
        <span className="text-amber-300">Development: Some environment variables not configured</span>
      </div>
      <p className="text-xs text-amber-400 mt-1">
        This message only appears in development mode.
      </p>
    </div>
  );
}