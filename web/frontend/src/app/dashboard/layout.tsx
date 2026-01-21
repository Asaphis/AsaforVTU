'use client';

import DashboardLayout from '@/components/dashboard/DashboardLayout';
import DashboardGuard from '@/components/dashboard/DashboardGuard';
import { useEffect } from 'react';

export default function Layout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    console.log('[DEBUG] DashboardLayout: Layout mounted');
  }, []);

  return (
    <DashboardGuard>
      <DashboardLayout>
        {children}
      </DashboardLayout>
    </DashboardGuard>
  );
}
