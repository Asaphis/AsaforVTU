'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function DashboardGuard({ children }: { children: React.ReactNode }) {
  const { user, initialized, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (initialized && !loading) {
      if (!user) {
        console.log('[DEBUG] DashboardGuard: No user found, redirecting to login');
        router.replace('/login');
      } else {
        console.log('[DEBUG] DashboardGuard: User authenticated:', user.uid);
      }
    }
  }, [initialized, loading, user, router]);

  if (!initialized || loading) {
    return <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
