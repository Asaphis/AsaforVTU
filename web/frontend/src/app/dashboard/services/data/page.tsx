'use client';

import { useEffect, useState } from 'react';
import { Wifi, Smartphone, ChevronRight, ArrowRightLeft } from 'lucide-react';
import { useService } from '@/hooks/useServices';
import { useAuth } from '@/contexts/AuthContext';
import { purchaseData, getAdminSettings } from '@/lib/services';
import TransactionPinModal from '@/components/dashboard/TransactionPinModal';
import TransactionResultModal from '@/components/dashboard/TransactionResultModal';
import { getServicePlans } from '@/lib/services';

export interface DataPlan {
  id: string;
  name: string;
  price: number;
  networkId: number;
  variation_id: string;
}

const NETWORKS = [
  { label: 'MTN', value: 'MTN', id: 1 },
  { label: 'Glo', value: 'GLO', id: 2 },
  { label: 'Airtel', value: 'AIRTEL', id: 3 },
  { label: '9mobile', value: '9MOBILE', id: 4 },
];

export default function DataPage() {
  const { user } = useAuth();
  const { service, loading, error } = useService('data');
  const [network, setNetwork] = useState(NETWORKS[0]);
  const [phone, setPhone] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<DataPlan | undefined>(undefined);
  const [dynamicPlans, setDynamicPlans] = useState<Record<string, DataPlan[]>>({});
  const [showPinModal, setShowPinModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [adminSettings, setAdminSettings] = useState<any>(null);
  const [loadingSettings, setLoadingSettings] = useState(true);
  
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await getAdminSettings();
        setAdminSettings(settings);
        // If MTN is disabled, select first enabled network
        if (settings?.airtimeNetworks) {
          if (settings.airtimeNetworks['MTN']?.enabled === false) {
            const firstEnabled = NETWORKS.find(n => settings.airtimeNetworks[n.value]?.enabled !== false);
            if (firstEnabled) setNetwork(firstEnabled);
          }
        }
      } catch (e) {
        console.error("Failed to load admin settings", e);
      } finally {
        setLoadingSettings(false);
      }
    };
    loadSettings();
  }, []);
  
  const [resultModal, setResultModal] = useState<{
    open: boolean;
    status: 'success' | 'error';
    title: string;
    message: string;
    transactionId?: string;
  }>({
    open: false,
    status: 'success',
    title: '',
    message: ''
  });

  useEffect(() => {
    let mounted = true;
    const loadPlans = async () => {
      const rows = await getServicePlans();
      if (!mounted || rows.length === 0) return;
      // Group by network and map to DataPlan shape
      const byNet: Record<string, DataPlan[]> = {};
      for (const r of rows) {
        const netKey = (r.network || '').toUpperCase();
        const varId = r.metadata?.variation_id ? String(r.metadata.variation_id) : '';
        const netId = r.metadata?.networkId ? Number(r.metadata.networkId) : undefined;
        if (!varId || !netId) continue; // require provider mapping
        const dp: DataPlan = {
          id: `${netKey}_${varId}`,
          name: r.name || 'Plan',
          price: Number(r.priceUser || 0),
          networkId: netId,
          variation_id: varId
        };
        byNet[netKey] = byNet[netKey] ? [...byNet[netKey], dp] : [dp];
      }
      setDynamicPlans(byNet);
      const initial = byNet[NETWORKS[0].value] || [];
      setSelectedPlan(initial[0]);
    };
    loadPlans();
    return () => { mounted = false; };
  }, []);

  const handlePurchase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !selectedPlan) return;
    setShowPinModal(true);
  };

  const onPinSuccess = async () => {
    if (!user || !service || !selectedPlan) return;
    
    setProcessing(true);
    try {
      // Use variation_id as the planId for the backend provider
      const planId = selectedPlan.variation_id;
      const result = await purchaseData(
        user.uid,
        selectedPlan.price,
        {
          planId,
          phone,
          networkId: network.id
        }
      );
      if (result.success) {
        setResultModal({
          open: true,
          status: 'success',
          title: 'Purchase Successful',
          message: `You have successfully purchased ${selectedPlan.name} for ${phone}.`,
          transactionId: result.transactionId
        });
        setPhone('');
      } else {
        setResultModal({
          open: true,
          status: 'error',
          title: 'Transaction Failed',
          message: result.message || 'Unable to complete your purchase. Please try again.',
          transactionId: result.transactionId
        });
      }
    } catch (err: any) {
      setResultModal({
        open: true,
        status: 'error',
        title: 'System Error',
        message: err.message || 'An unexpected error occurred.',
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
          {loading ? (
            <div className="dashboard-card text-center py-24 border-none shadow-brand relative overflow-hidden">
              <div className="tech-pattern absolute inset-0 opacity-[0.05]" />
              <div className="relative z-10">
                <div className="w-20 h-20 border-8 border-[#C58A17]/10 border-t-[#C58A17] rounded-[2rem] animate-spin mx-auto mb-6 shadow-2xl" />
                <p className="text-gray-400 font-black uppercase tracking-[0.3em] text-[10px]">Synchronizing Data Nodes...</p>
              </div>
            </div>
          ) : error ? (
            <div className="dashboard-card text-center py-16 text-red-500 border-none shadow-brand bg-red-50/30">
              <p className="font-black uppercase tracking-widest">Protocol Sync Error: {error}</p>
            </div>
          ) : !service ? (
            <div className="dashboard-card text-center py-16 text-gray-400 border-none shadow-brand">
              <p className="font-black uppercase tracking-widest">Service Interface Offline</p>
            </div>
          ) : (
            <>
              <div className="text-center mb-12">
                <div className="w-24 h-24 rounded-[2.5rem] bg-gray-50 flex items-center justify-center text-[#0B4F6C] mx-auto mb-8 shadow-2xl shadow-[#0B4F6C]/10 border-8 border-white group hover:-rotate-12 transition-transform duration-500">
                  <Wifi size={48} className="group-hover:scale-110 transition-transform" />
                </div>
                <h1 className="text-5xl font-black text-[#0B4F6C] tracking-tighter uppercase">
                  {service.name}
                </h1>
                <div className="h-1.5 w-12 bg-[#C58A17] rounded-full mx-auto mt-4" />
                <p className="text-gray-400 font-bold uppercase tracking-[0.2em] text-[10px] mt-6 max-w-xs mx-auto leading-relaxed">High-Frequency Broadband Provisioning</p>
              </div>

              <form onSubmit={handlePurchase} className="dashboard-card border-none shadow-brand p-8 lg:p-12 space-y-10 relative overflow-hidden">
                <div className="tech-pattern absolute inset-0 opacity-[0.03]" />
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#C58A17]/5 rounded-full -mr-16 -mt-16 blur-2xl" />
                
                <div className="space-y-8 relative z-10">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2 flex items-center gap-2">
                       <div className="w-1.5 h-1.5 rounded-full bg-[#C58A17]" /> Network Infrastructure
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {NETWORKS.map(n => {
                        const isEnabled = adminSettings?.airtimeNetworks?.[n.value]?.enabled !== false;
                        return (
                          <button
                            key={n.value}
                            type="button"
                            disabled={!isEnabled}
                            onClick={() => {
                              setNetwork(n);
                              const plans = (dynamicPlans[n.value] || []);
                              setSelectedPlan(plans[0]);
                            }}
                            className={`py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] border-2 transition-all ${
                              network.value === n.value 
                                ? 'bg-[#0B4F6C] border-[#0B4F6C] text-white shadow-2xl shadow-[#0B4F6C]/30 scale-[1.05]' 
                                : isEnabled
                                  ? 'bg-gray-50 border-transparent text-gray-400 hover:border-gray-100 hover:bg-white shadow-inner'
                                  : 'bg-gray-100 border-transparent text-gray-300 cursor-not-allowed grayscale'
                            }`}
                          >
                            {n.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2 flex items-center gap-2">
                       <div className="w-1.5 h-1.5 rounded-full bg-[#C58A17]" /> Recipient Terminal
                    </label>
                    <div className="relative group">
                       <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#0B4F6C] transition-colors">
                          <Smartphone size={20} />
                       </div>
                       <input 
                         type="tel" 
                         placeholder="080 0000 0000" 
                         className="w-full pl-16 pr-6 py-5 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-[#0B4F6C]/20 focus:bg-white focus:outline-none transition-all font-black text-[#0B4F6C] text-xl tracking-[0.2em] placeholder:text-gray-200 shadow-inner"
                         value={phone}
                         onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                         required
                         minLength={11}
                       />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2 flex items-center gap-2">
                       <div className="w-1.5 h-1.5 rounded-full bg-[#C58A17]" /> Allocation Plan
                    </label>
                    <div className="relative">
                      <select 
                        className="w-full px-6 py-5 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-[#0B4F6C]/20 focus:bg-white focus:outline-none transition-all font-black text-[#0B4F6C] text-lg appearance-none shadow-inner"
                        value={selectedPlan?.variation_id || ''}
                        onChange={(e) => {
                            const plans = (dynamicPlans[network.value] || []);
                            const plan = plans.find(p => p.variation_id === e.target.value) || plans[0];
                            setSelectedPlan(plan);
                        }}
                      >
                        {(dynamicPlans[network.value] || []).map(plan => (
                          <option key={plan.variation_id} value={plan.variation_id}>
                            {plan.name} - ₦{plan.price.toLocaleString()}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                         <ChevronRight size={20} className="rotate-90" />
                      </div>
                    </div>
                  </div>

                  <div className="p-6 rounded-[2rem] bg-[#0B4F6C]/5 border border-[#0B4F6C]/5 flex justify-between items-center group overflow-hidden relative">
                    <div className="tech-pattern absolute inset-0 opacity-[0.02]" />
                    <span className="text-[10px] font-black text-[#0B4F6C]/60 uppercase tracking-[0.2em] relative z-10">Liquidity Status</span>
                    <span className="text-xl font-black text-[#0B4F6C] relative z-10 tracking-tighter">₦{user?.walletBalance?.toLocaleString() ?? '0.00'}</span>
                  </div>
                </div>

                <button 
                    type="submit" 
                    className="w-full py-6 rounded-2xl bg-[#C58A17] text-white font-black text-xs uppercase tracking-[0.3em] hover:bg-[#A67513] transition-all shadow-2xl shadow-[#C58A17]/30 disabled:opacity-30 relative z-10 group" 
                    disabled={!service.enabled || adminSettings?.airtimeNetworks?.[network.value]?.enabled === false || processing}
                >
                  <span className="flex items-center justify-center gap-3">
                     {processing ? 'EXECUTING PROTOCOL...' : (service.enabled && adminSettings?.airtimeNetworks?.[network.value]?.enabled !== false) ? `INITIATE ${network.label} TOPUP` : 'OFFLINE'}
                     {!processing && <ArrowRightLeft size={18} className="group-hover:rotate-90 transition-transform duration-500" />}
                  </span>
                </button>
              </form>
            </>
          )}

          <TransactionPinModal 
            isOpen={showPinModal} 
            onClose={() => setShowPinModal(false)} 
            onSuccess={onPinSuccess}
          />
          
          <TransactionResultModal
            isOpen={resultModal.open}
            onClose={() => setResultModal(prev => ({ ...prev, open: false }))}
            status={resultModal.status}
            title={resultModal.title}
            message={resultModal.message}
            transactionId={resultModal.transactionId}
            actionLabel="Done"
          />
        </div>
  );
}
