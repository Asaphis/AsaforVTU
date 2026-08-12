'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Smartphone, Wifi, Tv, Zap, CreditCard, GraduationCap, Eye, EyeOff, ChevronLeft, ChevronRight, Pause, Play, Megaphone } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { getWalletHistory, getWalletBalance, getAnnouncements, transferToMain } from '@/lib/services';
import { useNotifications } from '@/contexts/NotificationContext';

export default function Dashboard() {
  const router = useRouter();
  const { user, loading, initialized, refreshUser } = useAuth();
  const [showMain, setShowMain] = useState(true);
  const [showCashback, setShowCashback] = useState(true);
  const [showReferral, setShowReferral] = useState(true);
  const [processingWithdrawal, setProcessingWithdrawal] = useState(false);
  const { addNotification } = useNotifications();
  const [recent, setRecent] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [currentAnnIndex, setCurrentAnnIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [walletBalance, setWalletBalance] = useState<any>(null);
  
  const nextAnnouncement = useCallback(() => {
    setAnnouncements((prev: any[]) => {
      if (prev.length <= 1) return prev;
      setCurrentAnnIndex((current: number) => (current + 1) % prev.length);
      return prev;
    });
  }, []);

  const prevAnnouncement = useCallback(() => {
    setAnnouncements((prev: any[]) => {
      if (prev.length <= 1) return prev;
      setCurrentAnnIndex((current: number) => (current - 1 + prev.length) % prev.length);
      return prev;
    });
  }, []);

  useEffect(() => {
    if (announcements.length <= 1 || isPaused) return;
    const timer = setInterval(nextAnnouncement, 6000);
    return () => clearInterval(timer);
  }, [announcements.length, isPaused, nextAnnouncement]);

  useEffect(() => {
    const loadAnnouncements = async () => {
      try {
        const data = await getAnnouncements();
        const filtered = data
          .filter((a: any) => a.is_active !== false)
          .sort((a: any, b: any) => {
            const getTime = (val: any) => {
              if (!val) return 0;
              if (typeof val === 'number') return val;
              if (typeof val === 'string') return new Date(val).getTime();
              return new Date(val).getTime() || 0;
            };
            return getTime(b.created_at) - getTime(a.created_at);
          })
          .slice(0, 3);
        setAnnouncements(filtered);
      } catch (e) {
        console.error('Announcements load failed', e);
      }
    };
    if (user) {
      loadAnnouncements();
      const interval = setInterval(loadAnnouncements, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => {
    if (!initialized || loading) return;
    if (user && !user.emailVerified) {
      router.push('/verify');
    }
    const sm = sessionStorage.getItem('showMainBalance') === 'true';
    const sc = sessionStorage.getItem('showCashbackBalance') === 'true';
    const sr = sessionStorage.getItem('showReferralBalance') === 'true';
    setShowMain(sm);
    setShowCashback(sc);
    setShowReferral(sr);
  }, [initialized, user, loading, router]);

  // Fetch wallet balance from backend
  useEffect(() => {
    const fetchBalance = async () => {
      if (!user) return;
      try {
        const balance = await getWalletBalance();
        if (balance) {
          setWalletBalance(balance);
        }
      } catch (e) {
        console.error('Failed to fetch wallet balance:', e);
      }
    };
    
    if (user) {
      fetchBalance();
      // Refresh balance every 10 seconds
      const interval = setInterval(fetchBalance, 10000);
      return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => {
    const loadRecent = async () => {
      if (!user) return;
      try {
        const items = await getWalletHistory();
        setRecent(items.slice(0, 5));
      } catch (e) {
        console.error('Recent history load failed', e);
      }
    };
    loadRecent();
  }, [user]);

  const handleWithdraw = async (type: 'referral' | 'cashback') => {
    if (!user || processingWithdrawal) return;
    
    const amount = type === 'referral' ? (walletBalance?.referral_balance ?? 0) : (walletBalance?.cashback_balance ?? 0);
    if (amount <= 0) {
      addNotification('warning', 'Insufficient balance', 'No funds available to withdraw');
      return;
    }

    if (!confirm(`Are you sure you want to withdraw ₦${amount.toLocaleString()} to your main wallet?`)) {
      return;
    }

    setProcessingWithdrawal(true);
    try {
      await transferToMain(amount, type);
      addNotification('success', 'Withdrawal successful', `₦${amount.toLocaleString()} moved to main wallet`);
      await refreshUser();
      // Refresh wallet balance
      const balance = await getWalletBalance();
      if (balance) setWalletBalance(balance);
    } catch (error: any) {
      console.error("Withdrawal failed: ", error);
      addNotification('error', 'Withdrawal failed', error.message || 'Please try again');
    } finally {
      setProcessingWithdrawal(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-16 bg-gray-100 rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-64 bg-gray-100 rounded-[2rem]" />
          <div className="h-64 bg-gray-100 rounded-2xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-48 bg-gray-100 rounded-2xl" />
          <div className="h-48 bg-gray-100 rounded-2xl" />
        </div>
      </div>
    );
  }

  const actions = [
    { icon: Smartphone, label: 'Airtime', href: '/dashboard/services/airtime' },
    { icon: Wifi, label: 'Data', href: '/dashboard/services/data' },
    { icon: Tv, label: 'Cable TV', href: '/dashboard/services/cable' },
    { icon: Zap, label: 'Electricity', href: '/dashboard/services/electricity' },
    { icon: GraduationCap, label: 'Exam PINs', href: '/dashboard/services/exam-pins' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
        {announcements.length > 0 && (
          <div 
            className="relative bg-[#0B4F6C] text-white p-4 rounded-2xl shadow-xl shadow-[#0B4F6C]/10 group transition-all duration-500 overflow-hidden border border-white/5"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            <div className="flex items-center gap-5">
              <div className="flex-shrink-0 p-3 bg-white/10 rounded-xl text-[#C58A17] animate-pulse">
                <Megaphone size={20} />
              </div>
              
              <div className="flex-grow relative h-[48px] flex flex-col justify-center">
                {announcements.map((ann: any, index: number) => (
                  <div 
                    key={ann.id}
                    className={`absolute inset-0 flex flex-col justify-center transition-all duration-700 ease-in-out ${
                      index === currentAnnIndex ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
                    }`}
                  >
                    <h3 className="font-bold text-sm">{ann.title}</h3>
                    <p className="text-xs text-white/80 mt-1 line-clamp-2">{ann.content}</p>
                  </div>
                ))}
              </div>
              
              {announcements.length > 1 && (
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => prevAnnouncement()}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button 
                    onClick={() => setIsPaused(!isPaused)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    {isPaused ? <Play size={16} /> : <Pause size={16} />}
                  </button>
                  <button 
                    onClick={() => nextAnnouncement()}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="dashboard-card border-none shadow-brand p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-[#0A1F44]/5 rounded-full -mr-24 -mt-24 blur-3xl" />
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-black text-[#0A1F44]">Wallet Balance</h2>
                  <button 
                    onClick={() => {
                      setShowMain(!showMain);
                      sessionStorage.setItem('showMainBalance', String(!showMain));
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    {showMain ? <Eye size={20} className="text-[#0A1F44]" /> : <EyeOff size={20} className="text-gray-400" />}
                  </button>
                </div>
                
                <div className="text-5xl font-black text-[#0A1F44] mb-2">
                  {showMain ? `₦${(walletBalance?.main_balance || user?.walletBalance || 0).toLocaleString()}` : '•••••••••'}
                </div>
                <p className="text-sm text-gray-400 font-medium">Main Balance</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="dashboard-card border-none shadow-brand p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#C58A17]/5 rounded-full -mr-16 -mt-16 blur-2xl" />
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">Cashback</h3>
                    <button 
                      onClick={() => {
                        setShowCashback(!showCashback);
                        sessionStorage.setItem('showCashbackBalance', String(!showCashback));
                      }}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      {showCashback ? <Eye size={16} className="text-[#C58A17]" /> : <EyeOff size={16} className="text-gray-400" />}
                    </button>
                  </div>
                  
                  <div className="text-2xl font-black text-[#C58A17] mb-1">
                    {showCashback ? `₦${(walletBalance?.cashback_balance || user?.cashbackBalance || 0).toLocaleString()}` : '••••'}
                  </div>
                  
                  <button 
                    onClick={() => handleWithdraw('cashback')}
                    disabled={processingWithdrawal || (walletBalance?.cashback_balance || user?.cashbackBalance || 0) <= 0}
                    className="mt-3 w-full py-2 rounded-xl bg-[#C58A17]/10 text-[#C58A17] font-black text-xs uppercase tracking-widest hover:bg-[#C58A17]/20 transition-all disabled:opacity-30"
                  >
                    {processingWithdrawal ? 'Withdrawing...' : 'Withdraw to Main'}
                  </button>
                </div>
              </div>

              <div className="dashboard-card border-none shadow-brand p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#0A1F44]/5 rounded-full -mr-16 -mt-16 blur-2xl" />
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">Referral</h3>
                    <button 
                      onClick={() => {
                        setShowReferral(!showReferral);
                        sessionStorage.setItem('showReferralBalance', String(!showReferral));
                      }}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      {showReferral ? <Eye size={16} className="text-[#0A1F44]" /> : <EyeOff size={16} className="text-gray-400" />}
                    </button>
                  </div>
                  
                  <div className="text-2xl font-black text-[#0A1F44] mb-1">
                    {showReferral ? `₦${(walletBalance?.referral_balance || user?.referralBalance || 0).toLocaleString()}` : '••••'}
                  </div>
                  
                  <button 
                    onClick={() => handleWithdraw('referral')}
                    disabled={processingWithdrawal || (walletBalance?.referral_balance || user?.referralBalance || 0) <= 0}
                    className="mt-3 w-full py-2 rounded-xl bg-[#0A1F44]/10 text-[#0A1F44] font-black text-xs uppercase tracking-widest hover:bg-[#0A1F44]/20 transition-all disabled:opacity-30"
                  >
                    {processingWithdrawal ? 'Withdrawing...' : 'Withdraw to Main'}
                  </button>
                </div>
              </div>
            </div>

            <div className="dashboard-card border-none shadow-brand p-6">
              <h3 className="text-lg font-black text-[#0A1F44] mb-4">Quick Actions</h3>
              <div className="grid grid-cols-5 gap-4">
                {actions.map((action) => (
                  <Link key={action.href} href={action.href} className="group">
                    <div className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-gray-50 border-2 border-transparent group-hover:border-[#0A1F44]/20 group-hover:bg-white transition-all">
                      <div className="w-12 h-12 rounded-xl bg-[#0A1F44] flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                        <action.icon size={20} />
                      </div>
                      <span className="text-xs font-black text-[#0A1F44] text-center">{action.label}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="dashboard-card border-none shadow-brand p-6">
            <h3 className="text-lg font-black text-[#0A1F44] mb-4">Recent Transactions</h3>
            {recent.length === 0 ? (
              <p className="text-gray-400 text-sm">No recent transactions</p>
            ) : (
              <div className="space-y-3">
                {recent.map((tx: any) => (
                  <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                    <div>
                      <p className="text-sm font-bold text-[#0A1F44]">{tx.description || tx.type}</p>
                      <p className="text-xs text-gray-400">{new Date(tx.created_at).toLocaleDateString()}</p>
                    </div>
                    <span className={`text-sm font-black ${tx.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                      {tx.type === 'credit' ? '+' : '-'}₦{Number(tx.amount).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
    </div>
  );
}
