'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Smartphone, Wifi, Tv, Zap, CreditCard, GraduationCap, Eye, EyeOff, ChevronLeft, ChevronRight, Pause, Play, Megaphone } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { doc, runTransaction } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getWalletHistory } from '@/lib/services';
import { useNotifications } from '@/contexts/NotificationContext';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

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
        const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'), limit(3));
        const snap = await getDocs(q);
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setAnnouncements(data.filter((a: any) => a.active !== false));
      } catch (e) {
        console.error('Announcements load failed', e);
      }
    };
    if (user) loadAnnouncements();
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
    
    const amount = type === 'referral' ? (user.referralBalance ?? 0) : (user.cashbackBalance ?? 0);
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
            className="relative bg-[#0B4F6C] text-white p-4 rounded-2xl shadow-xl shadow-[#0B4F6C]/10 group transition-all duration-500 overflow-hidden border border-white/5 asaphis-symbol"
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-gradient-to-br from-[#0B4F6C] via-[#0D2B5D] to-[#0B4F6C] text-white rounded-[2rem] p-8 lg:p-10 shadow-2xl shadow-[#0B4F6C]/20 relative overflow-hidden group asaphis-symbol">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-[#C58A17]/10 transition-colors duration-700" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#4CAF50]/5 rounded-full -ml-24 -mb-24 blur-3xl" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-[#C58A17] animate-ping" />
                <p className="text-blue-100/70 font-bold uppercase tracking-[0.2em] text-xs">Total Wallet Balance</p>
              </div>
              <div className="flex items-center justify-between">
                <h2 className="text-5xl lg:text-7xl font-black tracking-tighter">
                  {showMain ? <span className="flex items-baseline gap-1"><span className="text-2xl lg:text-4xl font-medium text-blue-200/50">₦</span>{(user.walletBalance || 0).toLocaleString()}</span> : '••••••'}
                </h2>
                <button 
                  className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/10 hover:bg-white/20 transition-all active:scale-90 border border-white/10" 
                  onClick={() => { setShowMain(s => !s); sessionStorage.setItem('showMainBalance', String(!showMain)); }}
                >
                  {showMain ? <EyeOff size={24} /> : <Eye size={24} />}
                </button>
              </div>
              
              <div className="mt-10 flex flex-wrap gap-4">
                <Link href="/dashboard/wallet" className="btn-accent py-3.5 px-10 text-xs uppercase tracking-[0.2em] font-black group">
                  <span className="flex items-center gap-2">Add Money <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" /></span>
                </Link>
                <Link href="/dashboard/transactions" className="bg-white/10 hover:bg-white/15 px-10 py-3.5 rounded-xl text-xs font-black uppercase tracking-[0.2em] transition-all border border-white/10 flex items-center justify-center">
                  History
                </Link>
              </div>
            </div>
          </div>

          <div className="dashboard-card flex flex-col justify-between overflow-hidden relative border-none shadow-brand asaphis-symbol">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#C58A17]/5 rounded-full -mr-16 -mt-16 blur-2xl" />
            <div>
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 rounded-2xl bg-[#0B4F6C]/5 flex items-center justify-center text-[#0B4F6C]">
                  <div className="p-3 bg-white rounded-xl shadow-sm border border-gray-100">
                    <CreditCard size={28} />
                  </div>
                </div>
                <div>
                  <h3 className="font-black text-[#0B4F6C] text-xl">Account</h3>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-[0.1em]">{user.username}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 rounded-2xl bg-gray-50/50 border border-gray-100 group hover:border-[#0B4F6C]/20 transition-colors">
                  <span className="text-sm text-gray-500 font-bold uppercase tracking-wider">Tier Status</span>
                  <span className="px-4 py-1.5 rounded-full bg-[#4CAF50]/10 text-[#4CAF50] text-[10px] font-black uppercase tracking-[0.1em] border border-[#4CAF50]/20">
                    {user.accountStatus}
                  </span>
                </div>
                <div className="flex justify-between items-center p-4 rounded-2xl bg-gray-50/50 border border-gray-100 group hover:border-[#0B4F6C]/20 transition-colors">
                  <span className="text-sm text-gray-500 font-bold uppercase tracking-wider">Identity</span>
                  <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.1em] border ${user.isVerified ? 'bg-[#0B4F6C]/10 text-[#0B4F6C] border-[#0B4F6C]/20' : 'bg-[#C58A17]/10 text-[#C58A17] border-[#C58A17]/20'}`}>
                    {user.isVerified ? 'Verified' : 'Unverified'}
                  </span>
                </div>
              </div>
            </div>
            
            <Link href="/dashboard/profile" className="mt-8 text-xs text-[#0B4F6C] font-black uppercase tracking-[0.2em] flex items-center gap-2 hover:gap-3 transition-all group border-t border-gray-100 pt-6">
              Full Settings <ChevronRight size={14} className="text-[#C58A17] group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="dashboard-card group relative overflow-hidden border-none shadow-brand">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#4CAF50]/5 rounded-full -mr-12 -mt-12 blur-2xl" />
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="font-black text-[#0B4F6C] text-xl">Savings Wallet</h3>
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mt-1 flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#4CAF50]" />
                  Reward Accumulation
                </p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-gray-50 text-[#4CAF50] flex items-center justify-center group-hover:bg-[#4CAF50]/10 group-hover:text-[#4CAF50] transition-all duration-300 shadow-inner">
                <Play size={28} />
              </div>
            </div>
            <div className="flex items-baseline gap-1 mb-8">
              <span className="text-2xl font-bold text-gray-300">₦</span>
              <p className="text-5xl font-black text-[#0B4F6C] tracking-tighter">
                {showCashback ? (user.cashbackBalance || 0).toLocaleString() : '••••••'}
              </p>
            </div>
            <button 
              onClick={() => handleWithdraw('cashback')}
              className="w-full py-5 rounded-2xl bg-[#0B4F6C] text-white font-black text-xs uppercase tracking-[0.3em] hover:bg-[#0D2B5D] transition-all shadow-xl shadow-[#0B4F6C]/20 active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
              disabled={processingWithdrawal || (user.cashbackBalance || 0) <= 0}
            >
              Transfer to Main
            </button>
          </div>

          <div className="dashboard-card group relative overflow-hidden border-none shadow-brand">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#C58A17]/5 rounded-full -mr-12 -mt-12 blur-2xl" />
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="font-black text-[#0B4F6C] text-xl">Referral Bonus</h3>
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mt-1 flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#C58A17]" />
                  Network Earnings
                </p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-gray-50 text-[#C58A17] flex items-center justify-center group-hover:bg-[#C58A17]/10 group-hover:text-[#C58A17] transition-all duration-300 shadow-inner">
                <GraduationCap size={28} />
              </div>
            </div>
            <div className="flex items-baseline gap-1 mb-8">
              <span className="text-2xl font-bold text-gray-300">₦</span>
              <p className="text-5xl font-black text-[#0B4F6C] tracking-tighter">
                {showReferral ? (user.referralBalance || 0).toLocaleString() : '••••••'}
              </p>
            </div>
            <button 
              onClick={() => handleWithdraw('referral')}
              className="w-full py-5 rounded-2xl bg-[#C58A17] text-white font-black text-xs uppercase tracking-[0.3em] hover:bg-[#A67513] transition-all shadow-xl shadow-[#C58A17]/20 active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
              disabled={processingWithdrawal || (user.referralBalance || 0) <= 0}
            >
              Transfer to Main
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
    </div>
  );
}
