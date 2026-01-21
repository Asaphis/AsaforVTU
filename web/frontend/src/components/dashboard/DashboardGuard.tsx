'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function DashboardGuard({ children }: { children: React.ReactNode }) {
  const { user, initialized, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log('[DEBUG] DashboardGuard: Checking status...', { initialized, loading, user: !!user });
    if (initialized && !loading) {
      if (!user) {
        console.log('[DEBUG] DashboardGuard: No user found, but NOT redirecting for debugging');
        // router.replace('/login'); // TEMPORARILY DISABLED
      } else {
        console.log('[DEBUG] DashboardGuard: User authenticated:', user.uid);
      }
    }
  }, [initialized, loading, user, router]);

  if (!initialized || loading) {
    console.log('[DEBUG] DashboardGuard: Still loading...', { initialized, loading });
    return <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">Loading...</div>;
  }

  // We are NOT returning null or redirecting for now
  return <>{children}</>;
}
