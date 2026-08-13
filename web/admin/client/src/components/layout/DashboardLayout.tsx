import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { useEffect, useState } from "react";
import { isAuthenticated, getUser } from "@/lib/auth";
import { useLocation } from "wouter";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      console.log('[DashboardLayout] Starting auth check...');
      
      try {
        const token = localStorage.getItem('access_token');
        const user = localStorage.getItem('user');
        
        console.log('[DashboardLayout] Token exists:', !!token);
        console.log('[DashboardLayout] User exists:', !!user);
        console.log('[DashboardLayout] Token value:', token?.substring(0, 20) + '...');
        console.log('[DashboardLayout] User value:', user);
        
        const authenticated = await isAuthenticated();
        
        console.log('[DashboardLayout] isAuthenticated() returned:', authenticated);
        
        setIsAuthenticated(authenticated);
        
        if (!authenticated) {
          console.log('[DashboardLayout] Not authenticated, redirecting to login');
          // Clear invalid tokens
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          // Redirect to login
          window.location.href = '/login';
          return;
        }
        
        console.log('[DashboardLayout] Auth check passed, showing dashboard');
      } catch (error) {
        console.error('[DashboardLayout] Auth check error:', error);
        setIsAuthenticated(false);
        console.log('[DashboardLayout] Error, redirecting to login');
        window.location.href = '/login';
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  if (isLoading) {
    console.log('[DashboardLayout] Still loading...');
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('[DashboardLayout] Not authenticated, returning null');
    return null; // Will redirect via useEffect
  }

  console.log('[DashboardLayout] Rendering dashboard');
  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
