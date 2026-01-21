'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function DashboardGuard({ children }: { children: React.ReactNode }) {
  const { user, initialized, loading } = useAuth();
  const router = useRouter();
  const [debugInfo, setDebugInfo] = useState<string>('');

  useEffect(() => {
    // Add logging to identify why redirects happen
    const status = `Auth State: initialized=${initialized}, loading=${loading}, user=${user ? user.uid : 'null'}`;
    setDebugInfo(status);
    console.log('[DashboardGuard]', status);

    if (initialized && !loading && !user) {
      console.warn('[DashboardGuard] No user found, redirecting to login');
      // Adding a small delay to prevent rapid looping and allow logs to be seen
      const timeout = setTimeout(() => {
        router.replace('/login');
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [initialized, loading, user, router]);

  if (!initialized || loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
        <p className="text-gray-600">Initializing Dashboard...</p>
        <p className="text-xs text-gray-400 mt-2">{debugInfo}</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4">
        <p className="text-red-500 font-medium">Authentication Required</p>
        <p className="text-sm text-gray-600 mt-2 text-center">
          We couldn't verify your session. Redirecting to login...
        </p>
        <button 
          onClick={() => router.push('/login')}
          className="mt-4 px-4 py-2 bg-primary text-white rounded-md text-sm"
        >
          Go to Login
        </button>
      </div>
    );
  }

  return <>{children}</>;
}