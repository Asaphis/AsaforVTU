'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Wallet, CreditCard, ArrowRightLeft, Eye, EyeOff, Copy } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getWalletBalance, transferWallet, initiateFunding } from '@/lib/services';
import { useWalletListener } from '@/hooks/useWalletListener';
import { useToast } from '@/components/ui/toast'; // Assuming we have toast, otherwise use alert

export default function WalletPage() {
  const { user } = useAuth();
  const [showMain, setShowMain] = useState(false);
  const [showCashback, setShowCashback] = useState(false);
  const [showReferral, setShowReferral] = useState(false);
  
  // Use real-time wallet listener for live updates
  const { balance, loading, error, refresh } = useWalletListener(!!user);
  
  const [balances, setBalances] = useState({
    mainBalance: 0,
    cashbackBalance: 0,
    referralBalance: 0
  });

  // Update local state when balance updates
  useEffect(() => {
    if (balance) {
      setBalances(balance);
    }
  }, [balance]);

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
        // Refresh balance immediately after transfer
        await refresh();
      } else {
        alert(result.message || 'Transfer failed');
      }
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-6xl">
        {/* Main Wallet */}
        <div className="lg:col-span-7 bg-[#0B4F6C] text-white rounded-[1.5rem] p-8 shadow-lg relative overflow-hidden group">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <p className="text-blue-100/60 font-bold uppercase tracking-widest text-[9px]">Primary Balance</p>
            </div>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-4xl lg:text-5xl font-black tracking-tighter">
                {showMain ? <span className="flex items-baseline gap-1.5"><span className="text-xl font-medium text-blue-200/50">₦</span>{(balances.mainBalance || 0).toLocaleString()}</span> : '••••••'}
              </h2>
              <button 
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all active:scale-90" 
                onClick={() => setShowMain(s => !s)}
              >
                {showMain ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="relative flex-grow w-full sm:w-auto">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#C58A17] font-bold text-sm">₦</span>
                <input
                  type="number"
                  min={100}
                  step={50}
                  value={fundAmount}
                  onChange={(e) => setFundAmount(Number(e.target.value))}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#C58A17]/30 font-bold text-lg text-white"
                  placeholder="0.00"
                />
              </div>
              <button
                className="w-full sm:w-auto bg-[#C58A17] hover:bg-[#A67513] py-3.5 px-8 rounded-xl text-[10px] uppercase tracking-widest font-black shadow-lg transition-all active:scale-95 text-white"
                onClick={startFunding}
                disabled={funding}
              >
                {funding ? 'PROCESSING...' : 'INITIALIZE FUNDING'}
              </button>
            </div>
          </div>
        </div>

        {/* Info Card */}
        <div className="lg:col-span-5 bg-white rounded-[1.5rem] p-6 border border-gray-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-[#0B4F6C] border border-gray-100 shadow-inner">
                <ArrowRightLeft size={20} />
              </div>
              <div>
                <h3 className="font-bold text-[#0B4F6C] text-sm tracking-tight">Smart Transfer</h3>
                <p className="text-[8px] text-[#C58A17] font-bold uppercase tracking-widest">Protocol</p>
              </div>
            </div>
            <p className="text-gray-500 text-[11px] leading-relaxed font-medium">
              Consolidate network earnings into your primary wallet with zero latency.
            </p>
          </div>
          <div className="mt-4 p-3 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#0B4F6C] tracking-widest">{referralCode}</span>
            <Copy size={12} className="text-gray-300 cursor-pointer hover:text-[#C58A17]" />
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
