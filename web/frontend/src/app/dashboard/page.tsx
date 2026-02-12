'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Smartphone, Wifi, Tv, Zap, CreditCard, GraduationCap, Eye, EyeOff, ChevronLeft, ChevronRight, Pause, Play, Megaphone } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { doc, runTransaction } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getWalletHistory, getWalletBalance, getAnnouncements } from '@/lib/services';
import { useNotifications } from '@/contexts/NotificationContext';
import { useWalletListener } from '@/hooks/useWalletListener';

export default function Dashboard() {
  const router = useRouter();
  const { user, loading, initialized, refreshUser } = useAuth();
  const [showMain, setShowMain] = useState(false);
  const [showCashback, setShowCashback] = useState(false);
  const [showReferral, setShowReferral] = useState(false);
  const [processingWithdrawal, setProcessingWithdrawal] = useState(false);
  const { addNotification } = useNotifications();
  const [recent, setRecent] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [currentAnnIndex, setCurrentAnnIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  
  // Use real-time wallet listener for live balance updates (polls every 10 seconds)
  const { balance: walletBalance, refresh: refreshBalance } = useWalletListener(!!user);

  const nextAnnouncement = useCallback(() => {
    setAnnouncements(prev => {
      if (prev.length <= 1) return prev;
      setCurrentAnnIndex(current => (current + 1) % prev.length);
      return prev;
    });
  }, []);

  const prevAnnouncement = useCallback(() => {
    setAnnouncements(prev => {
      if (prev.length <= 1) return prev;
      setCurrentAnnIndex(current => (current - 1 + prev.length) % prev.length);
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
          .filter((a: any) => a.active !== false)
          .sort((a: any, b: any) => {
            const aTime = a.createdAt ? (typeof a.createdAt === 'number' ? a.createdAt : a.createdAt.toDate?.()?.getTime() || 0) : 0;
            const bTime = b.createdAt ? (typeof b.createdAt === 'number' ? b.createdAt : b.createdAt.toDate?.()?.getTime() || 0) : 0;
            return bTime - aTime;
          })
          .slice(0, 3);
        setAnnouncements(filtered);
      } catch (e) {
        console.error('Announcements load failed', e);
      }
    };
    if (user) {
      loadAnnouncements();
      // Refresh announcements every 30 seconds
      const interval = setInterval(loadAnnouncements, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => {
    if (!initialized || loading) return;
    if (user && !user.isVerified) {
      router.push('/verify');
    }
    const sm = sessionStorage.getItem('showMainBalance') === 'true';
    const sc = sessionStorage.getItem('showCashbackBalance') === 'true';
    const sr = sessionStorage.getItem('showReferralBalance') === 'true';
    setShowMain(sm);
    setShowCashback(sc);
    setShowReferral(sr);
  }, [initialized, user, loading, router]);

  // Fetch wallet balance from backend (single source of truth)
  useEffect(() => {
    const fetchBalance = async () => {
      if (!user) return;
      try {
        const balance = await getWalletBalance();
        if (balance) {
          // Note: Real-time listener from useWalletListener will keep this updated
        }
      } catch (e) {
        console.error('Failed to fetch wallet balance:', e);
      }
    };
    
    if (user) {
      fetchBalance();
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
    
    const amount = type === 'referral' ? (walletBalance?.referralBalance ?? 0) : (walletBalance?.cashbackBalance ?? 0);
    if (amount <= 0) {
      addNotification('warning', 'Insufficient balance', 'No funds available to withdraw');
      return;
    }

    if (!confirm(`Are you sure you want to withdraw ₦${amount.toLocaleString()} to your main wallet?`)) {
        return;
    }

    setProcessingWithdrawal(true);
    try {
      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) throw new Error("User does not exist!");

        const userData = userDoc.data();
        const currentBalance = type === 'referral' ? (userData.referralBalance || 0) : (userData.cashbackBalance || 0);
        
        if (currentBalance < amount) {
            throw new Error("Insufficient balance during transaction");
        }

        const newMainBalance = (userData.walletBalance || 0) + amount;
        
        transaction.update(userRef, {
            [type === 'referral' ? 'referralBalance' : 'cashbackBalance']: 0,
            walletBalance: newMainBalance
        });
      });
      addNotification('success', 'Withdrawal successful', `₦${amount.toLocaleString()} moved to main wallet`);
      await refreshBalance?.();
      await refreshUser();
    } catch (error) {
      console.error("Withdrawal failed: ", error);
      addNotification('error', 'Withdrawal failed', 'Please try again');
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
                {announcements.map((ann, index) => (
                  <div 
                    key={ann.id}
                    className={`absolute inset-0 flex flex-col justify-center transition-all duration-700 ease-in-out ${
                      index === currentAnnIndex 
                        ? 'opacity-100 translate-y-0' 
                        : index < currentAnnIndex 
                          ? 'opacity-0 -translate-y-full' 
                          : 'opacity-0 translate-y-full'
                    }`}
                  >
                    <h5 className="font-bold text-xs text-[#C58A17] uppercase tracking-[0.2em] mb-0.5">{ann.title}</h5>
                    <p className="text-base text-blue-50/90 line-clamp-1 leading-tight font-medium">{ann.content}</p>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="flex gap-1">
                  {announcements.map((_, i) => (
                    <div 
                      key={i} 
                      className={`h-1.5 rounded-full transition-all duration-300 ${i === currentAnnIndex ? 'w-6 bg-[#C58A17]' : 'w-1.5 bg-white/20'}`} 
                    />
                  ))}
                </div>
                {announcements.length > 1 && (
                  <div className="flex items-center gap-2 ml-3">
                    <button onClick={prevAnnouncement} className="p-1 hover:bg-white/10 rounded-full transition-colors"><ChevronLeft size={14} /></button>
                    <button onClick={nextAnnouncement} className="p-1 hover:bg-white/10 rounded-full transition-colors"><ChevronRight size={14} /></button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-6xl">
          <div className="lg:col-span-7 bg-[#0B4F6C] text-white rounded-[1.5rem] p-8 shadow-lg relative overflow-hidden group">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <p className="text-blue-100/60 font-bold uppercase tracking-widest text-[9px]">Primary Balance</p>
              </div>
              <div className="flex items-center justify-between">
                <h2 className="text-4xl lg:text-5xl font-black tracking-tighter">walletBalance.main
                  {showMain ? <span className="flex items-baseline gap-1.5"><span className="text-xl font-medium text-blue-200/50">₦</span>{(user.walletBalance || 0).toLocaleString()}</span> : '••••••'}
                </h2>
                <button 
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all active:scale-90" 
                  onClick={() => { setShowMain(s => !s); sessionStorage.setItem('showMainBalance', String(!showMain)); }}
                >
                  {showMain ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              
              <div className="mt-8 flex gap-3">
                <Link href="/dashboard/wallet" className="bg-[#C58A17] hover:bg-[#A67513] text-white py-3 px-6 rounded-xl text-[10px] uppercase tracking-widest font-bold transition-all flex items-center gap-2 shadow-lg shadow-[#C58A17]/20">
                  Add Money <ChevronRight size={14} />
                </Link>
                <Link href="/dashboard/transactions" className="bg-white/10 hover:bg-white/15 px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border border-white/10">
                  History
                </Link>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 bg-white rounded-[1.5rem] p-6 border border-gray-100 shadow-sm flex flex-col justify-center">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-[#0B4F6C]">
                <CreditCard size={20} />
              </div>
              <div>
                <h3 className="font-bold text-[#0B4F6C] text-sm">Security ID</h3>
                <p className="text-[10px] text-[#C58A17] font-bold">@{user.username}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                <span className="block text-[8px] text-gray-400 font-bold uppercase mb-1">Status</span>
                <span className="text-[9px] font-black text-[#4CAF50] uppercase">{user.accountStatus}</span>
              </div>
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                <span className="block text-[8px] text-gray-400 font-bold uppercase mb-1">Identity</span>
                <span className={`text-[9px] font-black uppercase ${user.isVerified ? 'text-[#0B4F6C]' : 'text-[#C58A17]'}`}>
                  {user.isVerified ? 'Verified' : 'Unverified'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl">
          <div className="bg-white rounded-[1.5rem] p-6 border border-gray-100 shadow-sm group">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-bold text-[#0B4F6C] text-lg">Savings</h3>
                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Rewards</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-gray-50 text-[#4CAF50] flex items-center justify-center">
                <Play size={20} />
              </div>
            </div>
            <div className="flex items-center justify-between mb-6">
              <p className="text-3xl font-black text-[#0B4F6C]">
                {showCashback ? <span className="text-lg text-gray-300 mr-1">₦</span> : ''}
                {showCashback ? (walletBalance?.cashbackBalance || 0).toLocaleString() : '••••••'}
              </p>
              <button className="p-2 text-gray-400 hover:text-[#0B4F6C]" onClick={() => { setShowCashback(s => !s); sessionStorage.setItem('showCashbackBalance', String(!showCashback)); }}>
                {showCashback ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <button 
              onClick={() => handleWithdraw('cashback')}
              className="w-full py-3.5 rounded-xl bg-[#0B4F6C] text-white font-bold text-[10px] uppercase tracking-widest hover:bg-[#0D2B5D] transition-all disabled:opacity-30"
              disabled={processingWithdrawal || (walletBalance?.cashbackBalance || 0) <= 0}
            >
              MOVE TO PRIMARY
            </button>
          </div>

          <div className="bg-white rounded-[1.5rem] p-6 border border-gray-100 shadow-sm group">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-bold text-[#0B4F6C] text-lg">Earning</h3>
                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Revenue</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-gray-50 text-[#C58A17] flex items-center justify-center">
                <GraduationCap size={20} />
              </div>
            </div>
            <div className="flex items-center justify-between mb-6">
              <p className="text-3xl font-black text-[#0B4F6C]">
                {showReferral ? <span className="text-lg text-gray-300 mr-1">₦</span> : ''}
                {showReferral ? (walletBalance?.referralBalance || 0).toLocaleString() : '••••••'}
              </p>
              <button className="p-2 text-gray-400 hover:text-[#0B4F6C]" onClick={() => { setShowReferral(s => !s); sessionStorage.setItem('showReferralBalance', String(!showReferral)); }}>
                {showReferral ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <button 
              onClick={() => handleWithdraw('referral')}
              className="w-full py-3.5 rounded-xl bg-[#C58A17] text-white font-bold text-[10px] uppercase tracking-widest hover:bg-[#A67513] transition-all disabled:opacity-30"
              disabled={processingWithdrawal || (walletBalance?.referralBalance || 0) <= 0}
            >
              MOVE TO PRIMARY
            </button>
          </div>
        </div>

        <div>
          <div className="flex items-end justify-between mb-10">
            <div>
              <h3 className="text-4xl font-black text-[#0B4F6C] tracking-tighter">Quick Services</h3>
              <div className="h-1.5 w-12 bg-[#C58A17] rounded-full mt-2" />
            </div>
            <Link href="/dashboard/services" className="text-xs font-black text-[#0B4F6C] hover:text-[#C58A17] transition-colors uppercase tracking-[0.2em] border-b-2 border-transparent hover:border-[#C58A17] pb-1">
              All Services
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {actions.map(({ icon: Icon, label, href }) => (
              <Link key={label} href={href} className="service-card group py-10">
                <div className="service-icon group-hover:shadow-2xl group-hover:shadow-[#C58A17]/20 group-hover:-translate-y-2 transition-all duration-500">
                  <Icon size={36} />
                </div>
                <p className="font-black text-[#0B4F6C] uppercase tracking-widest text-[10px] mt-2">{label}</p>
              </Link>
            ))}
          </div>
        </div>

        <div className="dashboard-card border-none shadow-brand relative overflow-hidden">
          <div className="tech-pattern absolute inset-0 pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#0B4F6C]/5 flex items-center justify-center text-[#0B4F6C]">
                  <Zap size={28} />
                </div>
                <div>
                  <h3 className="text-3xl font-black text-[#0B4F6C] tracking-tighter">Recent Logs</h3>
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mt-1">Activity Tracking</p>
                </div>
              </div>
              <Link href="/dashboard/transactions" className="w-12 h-12 flex items-center justify-center hover:bg-gray-50 rounded-2xl transition-colors border border-gray-100">
                <ChevronRight size={24} className="text-gray-400" />
              </Link>
            </div>

            {recent.length === 0 ? (
              <div className="text-center py-24 bg-gray-50/50 rounded-[2.5rem] border-2 border-dashed border-gray-100 relative group overflow-hidden">
                <div className="tech-pattern absolute inset-0 opacity-[0.02]" />
                <div className="relative z-10">
                  <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm group-hover:scale-110 transition-transform duration-500">
                    <Pause size={40} className="text-gray-200" />
                  </div>
                  <p className="text-gray-400 font-black uppercase tracking-[0.3em] text-[10px]">Encryption Secure • No Data</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {recent.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-5 rounded-[2rem] hover:bg-gray-50 transition-all duration-300 border border-transparent hover:border-gray-100 group">
                    <div className="flex items-center gap-5">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-inner ${
                        tx.type === 'credit' 
                          ? 'bg-[#4CAF50]/5 text-[#4CAF50] group-hover:bg-[#4CAF50]/10' 
                          : 'bg-red-50 text-red-500 group-hover:bg-red-100'
                      }`}>
                        {tx.type === 'credit' ? <ChevronRight size={24} className="-rotate-90" /> : <ChevronRight size={24} className="rotate-90" />}
                      </div>
                      <div>
                        <p className="text-lg font-black text-[#0B4F6C] leading-none mb-2 tracking-tight">
                          {tx.description || tx.walletType ? `${tx.type} ${tx.walletType ? `(${tx.walletType})` : ''}` : tx.type}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-200" />
                          <p className="text-[10px] text-gray-400 font-black tracking-[0.1em] uppercase">{tx.reference}</p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-2xl font-black tracking-tighter ${tx.type === 'credit' ? 'text-[#4CAF50]' : 'text-red-500'}`}>
                        {tx.type === 'credit' ? '+' : '-'}₦{(tx.amount || 0).toLocaleString()}
                      </p>
                      <p className="text-[9px] text-gray-300 font-black uppercase tracking-[0.2em] mt-1.5">
                        {tx.createdAt ? new Date(tx.createdAt._seconds ? tx.createdAt._seconds * 1000 : tx.createdAt).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
    </div>
  );
}
