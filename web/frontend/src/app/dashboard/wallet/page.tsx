'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Wallet, CreditCard, ArrowRightLeft, Eye, EyeOff, Copy } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getWalletBalance, transferWallet, initiateFunding } from '@/lib/services';
import { useToast } from '@/components/ui/toast'; // Assuming we have toast, otherwise use alert

export default function WalletPage() {
  const { user } = useAuth();
  const [showMain, setShowMain] = useState(false);
  const [showCashback, setShowCashback] = useState(false);
  const [showReferral, setShowReferral] = useState(false);
  
  // Local state for balance to reflect backend source of truth
  const [balances, setBalances] = useState({
    mainBalance: user?.walletBalance || 0,
    cashbackBalance: user?.cashbackBalance || 0,
    referralBalance: user?.referralBalance || 0
  });
  
  // Initial fetch from backend
  const fetchBalance = async () => {
    try {
      const data = await getWalletBalance();
      if (data) {
        setBalances(data);
      }
    } catch (error) {
      console.error("Failed to fetch wallet balance:", error);
    }
  };

  useEffect(() => {
    // Update balances from context if available (optimistic/fallback)
    if (user) {
      setBalances(prev => ({
        ...prev,
        mainBalance: user.walletBalance ?? prev.mainBalance,
        cashbackBalance: user.cashbackBalance ?? prev.cashbackBalance,
        referralBalance: user.referralBalance ?? prev.referralBalance
      }));
    }
    
    // Fetch fresh data from backend
    fetchBalance();
  }, [user]);

  useEffect(() => {
    setShowMain(sessionStorage.getItem('showMainBalance') === 'true');
    setShowCashback(sessionStorage.getItem('showCashbackBalance') === 'true');
    setShowReferral(sessionStorage.getItem('showReferralBalance') === 'true');
  }, []);
  useEffect(() => {
    sessionStorage.setItem('showMainBalance', String(showMain));
  }, [showMain]);
  useEffect(() => {
    sessionStorage.setItem('showCashbackBalance', String(showCashback));
  }, [showCashback]);
  useEffect(() => {
    sessionStorage.setItem('showReferralBalance', String(showReferral));
  }, [showReferral]);
  
  const format = (n?: number) => `₦${(n || 0).toLocaleString()}`;
  const referralCode = user?.referral || user?.username || user?.uid || 'N/A';
  const [processing, setProcessing] = useState<'cashback' | 'referral' | null>(null);
  const [fundAmount, setFundAmount] = useState<number>(1000);
  const [funding, setFunding] = useState(false);

  const startFunding = async () => {
    if (!user || funding) return;
    if (!fundAmount || fundAmount <= 0) return alert('Enter a valid amount');
    setFunding(true);
    try {
      const result = await initiateFunding(fundAmount);
      if (result.error) {
        alert(result.error);
      } else if (result.link) {
        window.location.href = result.link;
      } else {
        alert('No checkout link returned');
      }
    } catch (e: any) {
      alert(e.message || 'Failed to start payment');
    } finally {
      setFunding(false);
    }
  };

  const transfer = async (type: 'referral' | 'cashback') => {
    if (!user || processing) return;
    const amount = type === 'referral' ? balances.referralBalance : balances.cashbackBalance;
    if (amount <= 0) return;
    
    setProcessing(type);
    try {
      const result = await transferWallet(amount, type);
      if (result.success) {
        alert(`Transferred ${format(amount)} to main wallet`);
        // Refresh balance
        fetchBalance();
      } else {
        alert(result.message);
      }
    } catch (e: any) {
      alert(e.message || 'Transfer failed');
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-4xl font-black text-[#0A1F44] tracking-tight">My Wallet</h1>
          <p className="text-gray-400 font-medium mt-1">Manage your funds and earnings</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Wallet */}
        <div className="lg:col-span-2 bg-gradient-to-br from-[#0A1F44] via-[#0D2B5D] to-[#0A1F44] text-white rounded-[2rem] p-10 shadow-2xl shadow-blue-900/20 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-[#F97316]/10 transition-colors duration-700" />
          
          <div className="relative z-10">
            <p className="text-blue-200/80 font-medium tracking-wide mb-3 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#F97316] animate-ping" />
              Main Wallet Balance
            </p>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-6xl font-bold tracking-tight">
                {showMain ? <span className="flex items-baseline gap-1"><span className="text-3xl font-medium text-blue-200/50">₦</span>{(balances.mainBalance || 0).toLocaleString()}</span> : '••••••'}
              </h2>
              <button 
                className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/10 hover:bg-white/20 transition-all active:scale-90" 
                onClick={() => setShowMain(s => !s)}
              >
                {showMain ? <EyeOff size={24} /> : <Eye size={24} />}
              </button>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="relative flex-grow w-full sm:w-auto">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 font-bold text-lg">₦</span>
                <input
                  type="number"
                  min={100}
                  step={50}
                  value={fundAmount}
                  onChange={(e) => setFundAmount(Number(e.target.value))}
                  className="w-full pl-10 pr-4 py-4 rounded-2xl bg-white/10 text-white placeholder:text-white/30 border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#F97316]/50 font-bold text-lg transition-all"
                  placeholder="0.00"
                />
              </div>
              <button
                className="w-full sm:w-auto btn-accent py-4 px-10 text-xs uppercase tracking-[0.2em] font-black shadow-xl shadow-[#F97316]/20"
                onClick={startFunding}
                disabled={funding}
              >
                {funding ? 'Processing...' : 'Add Funds'}
              </button>
            </div>
            <p className="mt-4 text-[10px] text-blue-200/50 font-black uppercase tracking-[0.2em] flex items-center gap-2">
              <CreditCard size={12} /> Flutterwave Secured • Bank • Card • USSD
            </p>
          </div>
        </div>

        {/* Info Card */}
        <div className="dashboard-card flex flex-col justify-between overflow-hidden relative border-none bg-white shadow-brand">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#F97316]/5 rounded-full -mr-16 -mt-16 blur-2xl" />
          <div>
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center text-[#F97316] shadow-sm">
                <ArrowRightLeft size={28} />
              </div>
              <div>
                <h3 className="font-black text-[#0A1F44] text-xl tracking-tight">Quick Transfer</h3>
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Internal Movement</p>
              </div>
            </div>
            <p className="text-gray-500 text-sm font-medium leading-relaxed">
              Move your earned commissions and rewards from your secondary wallets to your main balance instantly.
            </p>
          </div>
          <div className="mt-8 p-4 rounded-2xl bg-blue-50/50 border border-blue-100/50">
            <div className="flex items-center gap-2 text-[#0A1F44]">
              <Copy size={16} />
              <span className="text-xs font-black uppercase tracking-widest">Code: {referralCode}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Bonus Wallet */}
        <div className="dashboard-card group relative overflow-hidden border-none shadow-brand">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#F97316]/5 rounded-full -mr-12 -mt-12 blur-2xl transition-all group-hover:scale-150" />
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="font-black text-[#0A1F44] text-xl tracking-tight">Cashback</h3>
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">Transaction Rewards</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#F97316] flex items-center justify-center group-hover:rotate-12 transition-all">
              <ArrowRightLeft size={24} />
            </div>
          </div>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-gray-300">₦</span>
              <p className="text-4xl font-black text-[#0A1F44] tracking-tighter">
                {showCashback ? (balances.cashbackBalance || 0).toLocaleString() : '••••••'}
              </p>
            </div>
            <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 hover:bg-gray-100 transition-all" onClick={() => setShowCashback(s => !s)}>
              {showCashback ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <button
            className="w-full py-4 rounded-2xl bg-[#0A1F44] text-white font-black text-xs uppercase tracking-[0.2em] hover:bg-[#0A1F44]/90 transition-all disabled:opacity-30 shadow-lg shadow-blue-900/10"
            onClick={() => transfer('cashback')}
            disabled={processing === 'cashback' || balances.cashbackBalance <= 0}
          >
            {processing === 'cashback' ? 'Transferring...' : 'Transfer to Wallet'}
          </button>
        </div>

        {/* Referral Wallet */}
        <div className="dashboard-card group relative overflow-hidden border-none shadow-brand">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#0A1F44]/5 rounded-full -mr-12 -mt-12 blur-2xl transition-all group-hover:scale-150" />
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="font-black text-[#0A1F44] text-xl tracking-tight">Referrals</h3>
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">Network Earnings</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0A1F44] flex items-center justify-center group-hover:-rotate-12 transition-all">
              <ArrowRightLeft size={24} />
            </div>
          </div>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-gray-300">₦</span>
              <p className="text-4xl font-black text-[#0A1F44] tracking-tighter">
                {showReferral ? (balances.referralBalance || 0).toLocaleString() : '••••••'}
              </p>
            </div>
            <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 hover:bg-gray-100 transition-all" onClick={() => setShowReferral(s => !s)}>
              {showReferral ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <button
            className="w-full py-4 rounded-2xl bg-[#F97316] text-white font-black text-xs uppercase tracking-[0.2em] hover:bg-[#F97316]/90 transition-all disabled:opacity-30 shadow-lg shadow-orange-900/10"
            onClick={() => transfer('referral')}
            disabled={processing === 'referral' || balances.referralBalance <= 0}
          >
            {processing === 'referral' ? 'Transferring...' : 'Transfer to Wallet'}
          </button>
        </div>
      </div>
    </div>
  );
}
