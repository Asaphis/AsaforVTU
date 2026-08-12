import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { isAuthenticated } from "@/lib/auth";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [location, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const authenticated = await isAuthenticated();
      console.log("Auth state:", authenticated ? "authenticated" : "not authenticated");
      setIsAuthenticated(authenticated);
      if (authenticated && (location === "/login" || location === "/forgot-password")) {
        setLocation("/");
      }
      setIsLoading(false);
    };
    checkAuth();
  }, [location, setLocation]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    setLocation("/login");
    return null;
  }

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
