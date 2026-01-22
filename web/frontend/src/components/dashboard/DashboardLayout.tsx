'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { LayoutDashboard, Wallet, List, User, Settings, ShieldCheck, LifeBuoy, Smartphone, Wifi, Tv, Zap, FileText, LogOut, Bell, Menu, Eye, EyeOff, X } from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationContext';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { notifications, removeNotification, clearNotifications } = useNotifications();
  const [notifOpen, setNotifOpen] = useState(false);

  const primaryItems = [
    { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    { href: '/dashboard/wallet', label: 'Wallet', icon: Wallet },
    { href: '/dashboard/transactions', label: 'Transactions', icon: List },
  ];

  const serviceItems = [
    { href: '/dashboard/services/airtime', label: 'Airtime', icon: Smartphone },
    { href: '/dashboard/services/data', label: 'Data', icon: Wifi },
    { href: '/dashboard/services/cable', label: 'Cable TV', icon: Tv },
    { href: '/dashboard/services/electricity', label: 'Electricity', icon: Zap },
    { href: '/dashboard/services/exam-pins', label: 'Exam PINs', icon: FileText },
  ];
  
  const accountItems = [
    { href: '/dashboard/profile', label: 'Profile', icon: User },
    { href: '/dashboard/settings', label: 'Settings', icon: Settings },
    { href: '/dashboard/security', label: 'Security', icon: ShieldCheck },
    { href: '/dashboard/support', label: 'Support', icon: LifeBuoy },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="fixed inset-0 tech-pattern pointer-events-none opacity-[0.03]" />
      {/** Mobile drawer */}
      <MobileSidebar
        openLabel="Menu"
        pathname={pathname}
        onLogout={async () => { await signOut(); router.push('/'); }}
        items={{ primary: primaryItems, services: serviceItems, account: accountItems }}
      />
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-72 bg-white/70 backdrop-blur-xl border-r border-gray-100 flex-col overflow-y-auto z-40 transition-all duration-300">
        <div className="flex flex-col h-full">
          <div className="p-8">
            <div className="flex items-center gap-4 group cursor-pointer">
              <div className="w-12 h-12 rounded-2xl bg-[#0B4F6C] flex items-center justify-center text-white shadow-xl shadow-[#0B4F6C]/20 group-hover:scale-110 transition-transform duration-500">
                <img src="/logo.png" alt="AsaforVTU Logo" className="w-8 h-8 object-contain" />
              </div>
              <span className="font-black text-2xl tracking-tighter text-[#0B4F6C]">Asafor<span className="text-[#C58A17]">VTU</span></span>
            </div>
          </div>
          <nav className="px-4 space-y-2 flex-grow">
            {primaryItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-4 px-5 py-3.5 text-sm font-bold rounded-2xl transition-all duration-300 ${
                  pathname === href ? 'bg-[#0B4F6C] text-white shadow-lg shadow-[#0B4F6C]/20 scale-[1.02]' : 'text-gray-500 hover:bg-gray-50 hover:text-[#0B4F6C]'
                }`}
              >
                <Icon size={20} className={pathname === href ? 'text-white' : 'text-gray-400'} />
                {label}
              </Link>
            ))}
            <div className="px-5 pt-8 pb-3 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400/80">Digital Services</div>
            <div className="space-y-2">
              {serviceItems.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-4 px-5 py-3.5 text-sm font-bold rounded-2xl transition-all duration-300 ${
                    pathname === href ? 'bg-[#0B4F6C] text-white shadow-lg shadow-[#0B4F6C]/20 scale-[1.02]' : 'text-gray-500 hover:bg-gray-50 hover:text-[#0B4F6C]'
                  }`}
                >
                  <Icon size={20} className={pathname === href ? 'text-white' : 'text-gray-400'} />
                  {label}
                </Link>
              ))}
            </div>
          </nav>
          <div className="mt-auto p-6 bg-gray-50/30 border-t border-gray-100/50">
            <div className="px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400/80">System</div>
            <nav className="space-y-2">
              {accountItems.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-4 px-5 py-3.5 text-sm font-bold rounded-2xl transition-all duration-300 ${
                    pathname === href ? 'bg-[#0B4F6C] text-white shadow-lg shadow-[#0B4F6C]/20' : 'text-gray-500 hover:bg-gray-50 hover:text-[#0B4F6C]'
                  }`}
                >
                  <Icon size={18} className={pathname === href ? 'text-white' : 'text-gray-400'} />
                  {label}
                </Link>
              ))}
              <button
                onClick={async () => { await signOut(); router.push('/'); }}
                className="w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl text-red-500 font-bold text-sm hover:bg-red-50 transition-all duration-300 mt-4 group"
              >
                <LogOut size={18} className="group-hover:translate-x-1 transition-transform" />
                Logout Account
              </button>
            </nav>
          </div>
        </div>
      </aside>
      <main className="md:ml-72 transition-all duration-300 relative z-10 min-h-screen flex flex-col bg-gray-50/30">
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100">
          <div className="mx-auto px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <button className="md:hidden p-3 rounded-2xl bg-white border border-gray-100 shadow-sm active:scale-90 transition-transform" onClick={() => (document.getElementById('mobile-sidebar-toggle') as HTMLButtonElement)?.click()}>
                <Menu className="text-[#0B4F6C]" size={24} />
              </button>
              <div className="hidden sm:block">
                <h1 className="text-2xl font-black text-[#0B4F6C] tracking-tight flex items-center gap-2">
                  Welcome back, <span className="text-[#C58A17]">{user?.fullName?.split(' ')[0]}</span>
                </h1>
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-0.5 opacity-70">Security ID: @{user?.username}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-5">
              <div className="relative">
                <button className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white border border-gray-100 shadow-sm text-gray-500 hover:text-[#0B4F6C] hover:shadow-md transition-all relative group" onClick={() => setNotifOpen((v) => !v)}>
                  <Bell size={22} className="group-hover:rotate-12 transition-transform" />
                  {notifications.length > 0 && (
                    <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-[#C58A17] rounded-full border-2 border-white ring-2 ring-orange-100 animate-pulse" />
                  )}
                </button>
                {notifOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                    <div className="absolute right-0 mt-3 z-50 w-80 bg-white border border-gray-100 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50 bg-gray-50/50">
                        <div className="text-sm font-black text-[#0B4F6C] uppercase tracking-widest">Notifications</div>
                        <button className="text-[10px] font-black text-gray-400 hover:text-[#C58A17] uppercase tracking-widest" onClick={() => clearNotifications()}>Clear All</button>
                      </div>
                      <div className="max-h-96 overflow-y-auto p-2">
                        {notifications.length === 0 ? (
                          <div className="py-12 text-center">
                            <Bell size={32} className="mx-auto text-gray-200 mb-2" />
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">All caught up!</p>
                          </div>
                        ) : (
                          notifications.map((n) => (
                            <div key={n.id} className="p-4 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100 group">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <div className="text-sm font-bold text-[#0B4F6C]">{n.title}</div>
                                  {n.message && <div className="text-xs text-gray-500 mt-1 font-medium">{n.message}</div>}
                                </div>
                                <button className="p-1 text-gray-300 hover:text-red-500 transition-colors" onClick={() => removeNotification(n.id)}>
                                  <X size={14} />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
              
              <div className="h-10 w-[1px] bg-gray-100 mx-2" />
              
              <WalletBalanceHeader />
            </div>
          </div>
        </header>
        <div className="px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}

function WalletBalanceHeader() {
  const { user } = useAuth();
  const [show, setShow] = useState<boolean>(false);
  useEffect(() => {
    const v = sessionStorage.getItem('showMainBalance');
    setShow(v === 'true');
  }, []);
  useEffect(() => {
    sessionStorage.setItem('showMainBalance', String(show));
  }, [show]);
  const amount = `₦${(user?.walletBalance || 0).toLocaleString()}`;
  return (
    <div className="bg-gray-50/50 px-4 py-2 rounded-2xl border border-gray-100 flex items-center gap-4 group">
      <div className="text-right">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Balance</p>
        <p className="text-lg font-black text-[#0B4F6C] tracking-tight leading-none">{show ? amount : '••••••'}</p>
      </div>
      <button 
        className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-gray-100 shadow-sm text-gray-400 hover:text-[#0B4F6C] transition-all active:scale-90" 
        onClick={() => setShow(s => !s)}
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}

function MobileSidebar({
  pathname,
  items,
  onLogout,
  openLabel,
}: {
  pathname: string;
  items: { primary: { href: string; label: string; icon: any }[]; services: { href: string; label: string; icon: any }[]; account: { href: string; label: string; icon: any }[] };
  onLogout: () => void;
  openLabel: string;
}) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const btn = document.getElementById('mobile-sidebar-toggle');
    if (!btn) return;
    btn.onclick = () => setOpen(true);
  }, []);
  return (
    <>
      <button id="mobile-sidebar-toggle" style={{ position: 'absolute', left: -9999, top: -9999 }} aria-label={openLabel}></button>
      {open && (
        <>
          <div className="fixed inset-0 bg-black/30 z-50" onClick={() => setOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 z-50 flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <span className="font-black text-[#0B4F6C]">Asafor<span className="text-[#C58A17]">VTU</span></span>
              <button className="p-2 rounded-xl border border-gray-200" onClick={() => setOpen(false)}>
                <X />
              </button>
            </div>
            <nav className="px-2 py-4 space-y-1 overflow-y-auto">
              {items.primary.map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href} className={`flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 ${pathname === href ? 'bg-[#0B4F6C]/10 text-[#0B4F6C] font-black' : 'text-gray-700 font-bold'}`} onClick={() => setOpen(false)}>
                  <Icon size={20} className={pathname === href ? 'text-[#C58A17]' : 'text-gray-400'} />
                  {label}
                </Link>
              ))}
              <div className="px-4 pt-6 pb-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">Services</div>
              {items.services.map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href} className={`flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 ${pathname === href ? 'bg-[#0B4F6C]/10 text-[#0B4F6C] font-black' : 'text-gray-700 font-bold'}`} onClick={() => setOpen(false)}>
                  <Icon size={20} className={pathname === href ? 'text-[#C58A17]' : 'text-gray-400'} />
                  {label}
                </Link>
              ))}
            </nav>
            <div className="mt-auto border-t border-gray-100 p-4">
              <nav className="space-y-1">
                {items.account.map(({ href, label, icon: Icon }) => (
                  <Link key={href} href={href} className={`flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 ${pathname === href ? 'bg-[#0B4F6C]/10 text-[#0B4F6C] font-black' : 'text-gray-600 font-bold'} text-sm`} onClick={() => setOpen(false)}>
                    <Icon size={18} className={pathname === href ? 'text-[#C58A17]' : 'text-gray-400'} />
                    {label}
                  </Link>
                ))}
                <button onClick={() => { onLogout(); setOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 font-black text-sm hover:bg-red-50 transition-all mt-2">
                  <LogOut size={18} />
                  Logout
                </button>
              </nav>
            </div>
          </div>
        </>
      )}
    </>
  );
}

