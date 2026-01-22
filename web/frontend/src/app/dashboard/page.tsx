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
      <div className="py-12">
        <div className="h-48 rounded-2xl bg-gray-100 animate-pulse" />
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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {announcements.length > 0 && (
          <div 
            className="relative bg-[#0A1F44] text-white p-4 rounded-2xl shadow-xl shadow-blue-900/10 group transition-all duration-500 overflow-hidden border border-white/5"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            <div className="flex items-center gap-5">
              <div className="flex-shrink-0 p-3 bg-white/10 rounded-xl text-[#F97316] animate-pulse">
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
                    <h5 className="font-bold text-xs text-[#F97316] uppercase tracking-[0.2em] mb-0.5">{ann.title}</h5>
                    <p className="text-base text-blue-50/90 line-clamp-1 leading-tight font-medium">{ann.content}</p>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="flex gap-1">
                  {announcements.map((_, i) => (
                    <div 
                      key={i} 
                      className={`h-1.5 rounded-full transition-all duration-300 ${i === currentAnnIndex ? 'w-6 bg-[#F97316]' : 'w-1.5 bg-white/20'}`} 
                    />
                  ))}
                </div>
                {announcements.length > 1 && (
                  <div className="flex items-center gap-2 ml-3">
                    <button onClick={prevAnnouncement} className="p-2 hover:bg-white/10 rounded-xl transition-colors"><ChevronLeft size={18} /></button>
                    <button onClick={nextAnnouncement} className="p-2 hover:bg-white/10 rounded-xl transition-colors"><ChevronRight size={18} /></button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-gradient-to-br from-[#0A1F44] via-[#0D2B5D] to-[#0A1F44] text-white rounded-[2rem] p-10 shadow-2xl shadow-blue-900/20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-[#F97316]/10 transition-colors duration-700" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#F97316]/5 rounded-full -ml-24 -mb-24 blur-3xl" />
            
            <div className="relative z-10">
              <p className="text-blue-200/80 font-medium tracking-wide mb-3 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#F97316] animate-ping" />
                Available Balance
              </p>
              <div className="flex items-center justify-between">
                <h2 className="text-6xl font-bold tracking-tight">
                  {showMain ? <span className="flex items-baseline gap-1"><span className="text-3xl font-medium text-blue-200/50">₦</span>{(user.walletBalance || 0).toLocaleString()}</span> : '••••••'}
                </h2>
                <button 
                  className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/10 hover:bg-white/20 transition-all active:scale-90" 
                  onClick={() => { setShowMain(s => !s); sessionStorage.setItem('showMainBalance', String(!showMain)); }}
                >
                  {showMain ? <EyeOff size={24} /> : <Eye size={24} />}
                </button>
              </div>
              
              <div className="mt-8 flex gap-3">
                <Link href="/dashboard/wallet" className="btn-accent py-3 px-8 text-sm uppercase tracking-widest font-bold">
                  Fund Wallet
                </Link>
                <button className="bg-white/10 hover:bg-white/15 px-8 py-3 rounded-xl text-sm font-bold uppercase tracking-widest transition-all">
                  History
                </button>
              </div>
            </div>
          </div>

          <div className="dashboard-card flex flex-col justify-between overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#F97316]/5 rounded-full -mr-16 -mt-16 blur-2xl" />
            <div>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-[#F97316]">
                  <CreditCard size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-[#0A1F44] text-lg">Account</h3>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">{user.username}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 rounded-xl bg-gray-50/50 border border-gray-100">
                  <span className="text-sm text-gray-500 font-medium">Status</span>
                  <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold uppercase tracking-wider">
                    {user.accountStatus}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-xl bg-gray-50/50 border border-gray-100">
                  <span className="text-sm text-gray-500 font-medium">Verification</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${user.isVerified ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                    {user.isVerified ? 'Verified' : 'Pending'}
                  </span>
                </div>
              </div>
            </div>
            
            <Link href="/dashboard/profile" className="mt-6 text-sm text-[#0A1F44] font-bold flex items-center gap-2 hover:gap-3 transition-all group">
              View full profile <ChevronRight size={16} className="text-[#F97316] group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="dashboard-card group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#F97316]/5 rounded-full -mr-12 -mt-12 blur-2xl" />
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-bold text-[#0A1F44] text-lg">Cashback Wallet</h3>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Reward Savings</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#F97316] flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                <Play size={24} />
              </div>
            </div>
            <div className="flex items-baseline gap-1 mb-8">
              <span className="text-xl font-bold text-gray-300">₦</span>
              <p className="text-4xl font-black text-[#0A1F44] tracking-tighter">
                {showCashback ? (user.cashbackBalance || 0).toLocaleString() : '••••••'}
              </p>
            </div>
            <button 
              onClick={() => handleWithdraw('cashback')}
              className="w-full py-4 rounded-2xl bg-white border-2 border-[#0A1F44] text-[#0A1F44] font-black text-xs uppercase tracking-[0.2em] hover:bg-[#0A1F44] hover:text-white transition-all disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-[#0A1F44]"
              disabled={processingWithdrawal || (user.cashbackBalance || 0) <= 0}
            >
              Move to Main Wallet
            </button>
          </div>

          <div className="dashboard-card group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#0A1F44]/5 rounded-full -mr-12 -mt-12 blur-2xl" />
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-bold text-[#0A1F44] text-lg">Referral Bonus</h3>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Network Earnings</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0A1F44] flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                <GraduationCap size={24} />
              </div>
            </div>
            <div className="flex items-baseline gap-1 mb-8">
              <span className="text-xl font-bold text-gray-300">₦</span>
              <p className="text-4xl font-black text-[#0A1F44] tracking-tighter">
                {showReferral ? (user.referralBalance || 0).toLocaleString() : '••••••'}
              </p>
            </div>
            <button 
              onClick={() => handleWithdraw('referral')}
              className="w-full py-4 rounded-2xl bg-white border-2 border-[#0A1F44] text-[#0A1F44] font-black text-xs uppercase tracking-[0.2em] hover:bg-[#0A1F44] hover:text-white transition-all disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-[#0A1F44]"
              disabled={processingWithdrawal || (user.referralBalance || 0) <= 0}
            >
              Move to Main Wallet
            </button>
          </div>
        </div>

        <div>
          <div className="flex items-end justify-between mb-8">
            <div>
              <h3 className="text-3xl font-black text-[#0A1F44]">Quick Services</h3>
              <p className="text-gray-400 font-medium mt-1">What would you like to do today?</p>
            </div>
            <Link href="/dashboard/services" className="text-sm font-bold text-[#F97316] hover:underline uppercase tracking-widest">
              See All
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {actions.map(({ icon: Icon, label, href }) => (
              <Link key={label} href={href} className="service-card py-8">
                <div className="service-icon group-hover:scale-110 group-hover:-translate-y-1 transition-all">
                  <Icon size={32} />
                </div>
                <p className="font-bold text-[#0A1F44] tracking-tight">{label}</p>
                <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-8 h-1 bg-[#F97316] rounded-full mx-auto" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="dashboard-card">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-[#0A1F44]">
                <Zap size={24} />
              </div>
              <h3 className="text-2xl font-black text-[#0A1F44]">Recent Activity</h3>
            </div>
            <Link href="/dashboard/transactions" className="p-2 hover:bg-gray-50 rounded-xl transition-colors">
              <ChevronRight size={24} className="text-gray-300" />
            </Link>
          </div>

          {recent.length === 0 ? (
            <div className="text-center py-20 bg-gray-50/50 rounded-[2rem] border border-dashed border-gray-200">
              <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                <Pause size={32} className="text-gray-300" />
              </div>
              <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recent.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100 group">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                      tx.type === 'credit' 
                        ? 'bg-green-50 text-green-600 group-hover:bg-green-100' 
                        : 'bg-red-50 text-red-600 group-hover:bg-red-100'
                    }`}>
                      {tx.type === 'credit' ? <ChevronRight size={20} className="-rotate-90" /> : <ChevronRight size={20} className="rotate-90" />}
                    </div>
                    <div>
                      <p className="text-base font-bold text-[#0A1F44] leading-none mb-1">
                        {tx.description || tx.walletType ? `${tx.type} ${tx.walletType ? `(${tx.walletType})` : ''}` : tx.type}
                      </p>
                      <p className="text-xs text-gray-400 font-bold tracking-tighter uppercase">{tx.reference}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-black tracking-tight ${tx.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                      {tx.type === 'credit' ? '+' : '-'}₦{(tx.amount || 0).toLocaleString()}
                    </p>
                    <p className="text-[10px] text-gray-300 font-bold uppercase tracking-widest mt-1">
                      {tx.createdAt ? new Date(tx.createdAt._seconds ? tx.createdAt._seconds * 1000 : tx.createdAt).toLocaleDateString() : '-'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
    </div>
  );
}
}