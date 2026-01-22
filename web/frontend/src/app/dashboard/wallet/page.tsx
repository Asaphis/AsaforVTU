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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-4xl font-black text-[#0B4F6C] tracking-tight">Financial Center</h1>
          <div className="h-1.5 w-12 bg-[#C58A17] rounded-full mt-2" />
          <p className="text-gray-400 font-bold uppercase tracking-[0.2em] text-[10px] mt-4">Liquidity & Rewards Management</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Wallet */}
        <div className="lg:col-span-2 bg-gradient-to-br from-[#0B4F6C] via-[#0D2B5D] to-[#0B4F6C] text-white rounded-[2rem] p-8 lg:p-10 shadow-2xl shadow-[#0B4F6C]/20 relative overflow-hidden group asaphis-symbol">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-[#C58A17]/10 transition-colors duration-700" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-[#C58A17] animate-ping" />
              <p className="text-blue-100/70 font-bold uppercase tracking-[0.2em] text-xs">Primary Liquidity Balance</p>
            </div>
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-5xl lg:text-7xl font-black tracking-tighter">
                {showMain ? <span className="flex items-baseline gap-1"><span className="text-2xl lg:text-4xl font-medium text-blue-200/50">₦</span>{(balances.mainBalance || 0).toLocaleString()}</span> : '••••••'}
              </h2>
              <button 
                className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/10 hover:bg-white/20 transition-all active:scale-90 border border-white/10" 
                onClick={() => setShowMain(s => !s)}
              >
                {showMain ? <EyeOff size={24} /> : <Eye size={24} />}
              </button>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="relative flex-grow w-full sm:w-auto">
                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-white/30 font-black text-lg">₦</span>
                <input
                  type="number"
                  min={100}
                  step={50}
                  value={fundAmount}
                  onChange={(e) => setFundAmount(Number(e.target.value))}
                  className="w-full pl-12 pr-6 py-5 rounded-2xl bg-white/10 text-white placeholder:text-white/20 border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#C58A17]/50 font-black text-xl transition-all shadow-inner"
                  placeholder="0.00"
                />
              </div>
              <button
                className="w-full sm:w-auto btn-accent py-5 px-12 text-xs uppercase tracking-[0.3em] font-black shadow-2xl shadow-[#C58A17]/30 group"
                onClick={startFunding}
                disabled={funding}
              >
                <span className="flex items-center justify-center gap-2">
                  {funding ? 'PROCESSING...' : 'INITIALIZE FUNDING'}
                  {!funding && <ArrowRightLeft size={16} className="group-hover:rotate-180 transition-transform duration-500" />}
                </span>
              </button>
            </div>
            <div className="mt-8 pt-6 border-t border-white/5 flex flex-wrap items-center gap-6">
               <div className="flex items-center gap-2 text-[10px] text-blue-100/40 font-black uppercase tracking-[0.2em]">
                 <div className="w-1.5 h-1.5 rounded-full bg-[#4CAF50]" /> Secured by Flutterwave
               </div>
               <div className="flex items-center gap-2 text-[10px] text-blue-100/40 font-black uppercase tracking-[0.2em]">
                 <div className="w-1.5 h-1.5 rounded-full bg-[#C58A17]" /> Multiple Channels
               </div>
            </div>
          </div>
        </div>

        {/* Info Card */}
        <div className="dashboard-card flex flex-col justify-between overflow-hidden relative border-none bg-white shadow-brand asaphis-symbol">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#C58A17]/5 rounded-full -mr-16 -mt-16 blur-2xl" />
          <div>
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 rounded-2xl bg-[#0B4F6C]/5 flex items-center justify-center text-[#0B4F6C]">
                <div className="p-3.5 bg-white rounded-xl shadow-sm border border-gray-100">
                  <ArrowRightLeft size={32} />
                </div>
              </div>
              <div>
                <h3 className="font-black text-[#0B4F6C] text-xl tracking-tighter leading-none">Smart Transfer</h3>
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mt-2">Wallet Optimization</p>
              </div>
            </div>
            <p className="text-gray-500 text-sm font-medium leading-relaxed">
              Consolidate your earnings from across the network into your primary liquidity wallet with zero latency.
            </p>
          </div>
          <div className="mt-8 p-5 rounded-[2rem] bg-gray-50 border border-gray-100 group hover:border-[#0B4F6C]/20 transition-colors">
            <div className="flex items-center justify-between mb-2">
               <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Network ID</span>
               <Copy size={12} className="text-gray-300 group-hover:text-[#C58A17] transition-colors" />
            </div>
            <div className="text-sm font-black text-[#0B4F6C] tracking-[0.2em] uppercase">{referralCode}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Bonus Wallet */}
        <div className="dashboard-card group relative overflow-hidden border-none shadow-brand">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#4CAF50]/5 rounded-full -mr-16 -mt-16 blur-3xl transition-all group-hover:scale-150" />
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="font-black text-[#0B4F6C] text-2xl tracking-tighter">Savings Center</h3>
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mt-1 flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#4CAF50]" />
                Transaction Rewards
              </p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-gray-50 text-[#4CAF50] flex items-center justify-center group-hover:bg-[#4CAF50]/10 group-hover:rotate-12 transition-all shadow-inner">
              <ArrowRightLeft size={28} />
            </div>
          </div>
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-gray-300">₦</span>
              <p className="text-5xl font-black text-[#0B4F6C] tracking-tighter">
                {showCashback ? (balances.cashbackBalance || 0).toLocaleString() : '••••••'}
              </p>
            </div>
            <button className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white border border-gray-100 text-gray-400 hover:text-[#0B4F6C] transition-all shadow-sm active:scale-90" onClick={() => setShowCashback(s => !s)}>
              {showCashback ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          <button
            className="w-full py-5 rounded-2xl bg-[#0B4F6C] text-white font-black text-xs uppercase tracking-[0.3em] hover:bg-[#0D2B5D] transition-all disabled:opacity-30 shadow-xl shadow-[#0B4F6C]/20"
            onClick={() => transfer('cashback')}
            disabled={processing === 'cashback' || balances.cashbackBalance <= 0}
          >
            {processing === 'cashback' ? 'PROCESSING...' : 'MOVE TO PRIMARY'}
          </button>
        </div>

        {/* Referral Wallet */}
        <div className="dashboard-card group relative overflow-hidden border-none shadow-brand">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#C58A17]/5 rounded-full -mr-16 -mt-16 blur-3xl transition-all group-hover:scale-150" />
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="font-black text-[#0B4F6C] text-2xl tracking-tighter">Earning Center</h3>
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mt-1 flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#C58A17]" />
                Network Revenue
              </p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-gray-50 text-[#C58A17] flex items-center justify-center group-hover:bg-[#C58A17]/10 group-hover:-rotate-12 transition-all shadow-inner">
              <ArrowRightLeft size={28} />
            </div>
          </div>
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-gray-300">₦</span>
              <p className="text-5xl font-black text-[#0B4F6C] tracking-tighter">
                {showReferral ? (balances.referralBalance || 0).toLocaleString() : '••••••'}
              </p>
            </div>
            <button className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white border border-gray-100 text-gray-400 hover:text-[#0B4F6C] transition-all shadow-sm active:scale-90" onClick={() => setShowReferral(s => !s)}>
              {showReferral ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          <button
            className="w-full py-5 rounded-2xl bg-[#C58A17] text-white font-black text-xs uppercase tracking-[0.3em] hover:bg-[#A67513] transition-all disabled:opacity-30 shadow-xl shadow-[#C58A17]/20"
            onClick={() => transfer('referral')}
            disabled={processing === 'referral' || balances.referralBalance <= 0}
          >
            {processing === 'referral' ? 'PROCESSING...' : 'MOVE TO PRIMARY'}
          </button>
        </div>
      </div>
    </div>
  );
}
