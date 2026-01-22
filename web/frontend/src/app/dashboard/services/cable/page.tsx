'use client';

import { useState } from 'react';
import { Tv } from 'lucide-react';
import { useService } from '@/hooks/useServices';
import { useAuth } from '@/contexts/AuthContext';
import { processTransaction } from '@/lib/services';
import TransactionPinModal from '@/components/dashboard/TransactionPinModal';

const CABLE_PROVIDERS = ['DSTV', 'GOTV', 'Startimes'];

export default function CablePage() {
  const { user } = useAuth();
  const { service, loading, error } = useService('tv');
  const [provider, setProvider] = useState(CABLE_PROVIDERS[0]);
  const [smartcardNumber, setSmartcardNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [showPinModal, setShowPinModal] = useState(false);
  const [processing, setProcessing] = useState(false);

  const handlePurchase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!smartcardNumber || !amount) return;
    setShowPinModal(true);
  };

  const onPinSuccess = async () => {
    if (!user || !service) return;
    
    setProcessing(true);
    try {
      const result = await processTransaction(
        user.uid,
        Number(amount),
        'cable',
        {
          provider,
          smartcardNumber,
          serviceProvider: service.slug
        }
      );

      if (result.success) {
        alert('Cable subscription successful!');
        setSmartcardNumber('');
        setAmount('');
      } else {
        alert(`Transaction failed: ${result.message}`);
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {loading ? (
            <div className="dashboard-card text-center py-20 animate-pulse bg-gray-50 border-none">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl mx-auto mb-4" />
              <div className="h-4 w-32 bg-gray-100 mx-auto rounded" />
            </div>
          ) : error ? (
            <div className="dashboard-card text-center py-20 border-red-100 bg-red-50/30">
              <p className="text-red-500 font-bold uppercase tracking-widest text-sm">Error loading service</p>
              <p className="text-xs text-red-400 mt-2">{error}</p>
            </div>
          ) : !service ? (
            <div className="dashboard-card text-center py-20 bg-gray-50 border-none">
              <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">Service currently unavailable</p>
            </div>
          ) : (
            <>
              <div className="text-center mb-10">
                <div className="w-20 h-20 rounded-[2rem] bg-[#0A1F44] flex items-center justify-center text-[#F97316] mx-auto mb-6 shadow-xl shadow-blue-900/20">
                  <Tv size={40} />
                </div>
                <h1 className="text-4xl font-black text-[#0A1F44] tracking-tight uppercase">
                  {service.name}
                </h1>
                <p className="text-gray-400 font-medium mt-2">{service.description || 'Quick and easy cable TV subscriptions.'}</p>
              </div>

              <form onSubmit={handlePurchase} className="dashboard-card border-none shadow-brand p-10 space-y-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#F97316]/5 rounded-full -mr-16 -mt-16 blur-2xl" />
                
                <div className="space-y-6 relative z-10">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Select Provider</label>
                    <div className="grid grid-cols-3 gap-3">
                      {CABLE_PROVIDERS.map(p => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setProvider(p)}
                          className={`py-4 rounded-2xl font-black text-xs uppercase tracking-widest border-2 transition-all ${
                            provider === p 
                              ? 'bg-[#0A1F44] border-[#0A1F44] text-white shadow-lg shadow-blue-900/20 scale-[1.05]' 
                              : 'bg-gray-50 border-transparent text-gray-400 hover:border-gray-200'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Smartcard / IUC Number</label>
                    <input 
                      type="text" 
                      placeholder="Enter number" 
                      className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-[#0A1F44]/20 focus:bg-white focus:outline-none transition-all font-bold text-[#0A1F44] text-lg"
                      value={smartcardNumber}
                      onChange={(e) => setSmartcardNumber(e.target.value.replace(/\D/g, ''))}
                      required
                      minLength={10}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Plan Amount (₦)</label>
                    <input 
                      type="number" 
                      className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-[#0A1F44]/20 focus:bg-white focus:outline-none transition-all font-bold text-[#0A1F44] text-lg"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      min="1000"
                      required
                      placeholder="e.g. 3500"
                    />
                  </div>

                  <div className="p-5 rounded-2xl bg-[#0A1F44]/5 border border-[#0A1F44]/5 flex justify-between items-center">
                    <span className="text-[10px] font-black text-[#0A1F44]/60 uppercase tracking-widest">Available Balance</span>
                    <span className="text-lg font-black text-[#0A1F44]">₦{user?.walletBalance?.toLocaleString() ?? '0.00'}</span>
                  </div>
                </div>

                <button 
                    type="submit" 
                    className="w-full py-5 rounded-2xl bg-[#F97316] text-white font-black text-xs uppercase tracking-[0.2em] hover:bg-[#F97316]/90 transition-all shadow-xl shadow-orange-900/20 disabled:opacity-30 relative z-10" 
                    disabled={!service.enabled || processing}
                >
                  {processing ? 'PROCESSING...' : service.enabled ? 'SUBSCRIBE NOW' : 'COMING SOON'}
                </button>
              </form>
            </>
          )}

          <TransactionPinModal 
            isOpen={showPinModal} 
            onClose={() => setShowPinModal(false)} 
            onSuccess={onPinSuccess}
          />
        </div>
  );
}
