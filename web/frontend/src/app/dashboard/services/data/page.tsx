'use client';

import { useEffect, useState } from 'react';
import { Wifi } from 'lucide-react';
import { useService } from '@/hooks/useServices';
import { useAuth } from '@/contexts/AuthContext';
import { purchaseData } from '@/lib/services';
import TransactionPinModal from '@/components/dashboard/TransactionPinModal';
import TransactionResultModal from '@/components/dashboard/TransactionResultModal';
import { DATA_PLANS, DataPlan } from '@/data/dataPlans';
import { getServicePlans, ServicePlan } from '@/lib/services';

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
  // Initialize with empty or first plan of first network
  const [selectedPlan, setSelectedPlan] = useState<DataPlan | undefined>(
    DATA_PLANS[NETWORKS[0].value]?.[0]
  );
  const [dynamicPlans, setDynamicPlans] = useState<Record<string, DataPlan[]>>({});
  const [showPinModal, setShowPinModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  
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
      const initial = byNet[NETWORKS[0].value] || DATA_PLANS[NETWORKS[0].value] || [];
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
                  <Wifi size={40} />
                </div>
                <h1 className="text-4xl font-black text-[#0A1F44] tracking-tight uppercase">
                  {service.name}
                </h1>
                <p className="text-gray-400 font-medium mt-2">{service.description || 'Buy affordable data bundles instantly.'}</p>
              </div>

              <form onSubmit={handlePurchase} className="dashboard-card border-none shadow-brand p-10 space-y-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#F97316]/5 rounded-full -mr-16 -mt-16 blur-2xl" />
                
                <div className="space-y-6 relative z-10">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Select Network</label>
                    <div className="grid grid-cols-4 gap-3">
                      {NETWORKS.map(n => (
                        <button
                          key={n.value}
                          type="button"
                          onClick={() => {
                            setNetwork(n);
                            const plans = (dynamicPlans[n.value] || DATA_PLANS[n.value] || []);
                            setSelectedPlan(plans[0]);
                          }}
                          className={`py-4 rounded-2xl font-black text-xs uppercase tracking-widest border-2 transition-all ${
                            network.value === n.value 
                              ? 'bg-[#0A1F44] border-[#0A1F44] text-white shadow-lg shadow-blue-900/20 scale-[1.05]' 
                              : 'bg-gray-50 border-transparent text-gray-400 hover:border-gray-200'
                          }`}
                        >
                          {n.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Phone Number</label>
                    <input 
                      type="tel" 
                      placeholder="080..." 
                      className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-[#0A1F44]/20 focus:bg-white focus:outline-none transition-all font-bold text-[#0A1F44] text-lg"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                      required
                      minLength={11}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Data Plan</label>
                    <select 
                      className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-[#0A1F44]/20 focus:bg-white focus:outline-none transition-all font-bold text-[#0A1F44] appearance-none"
                      value={selectedPlan?.variation_id || ''}
                      onChange={(e) => {
                          const plans = (dynamicPlans[network.value] || DATA_PLANS[network.value] || []);
                          const plan = plans.find(p => p.variation_id === e.target.value) || plans[0];
                          setSelectedPlan(plan);
                      }}
                    >
                      {((dynamicPlans[network.value] || DATA_PLANS[network.value] || [])).map(plan => (
                        <option key={plan.variation_id} value={plan.variation_id}>
                          {plan.name} - ₦{plan.price.toLocaleString()}
                        </option>
                      ))}
                    </select>
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
                  {processing ? 'PROCESSING...' : service.enabled ? `PURCHASE ${selectedPlan?.name?.split('(')[0] || 'DATA'}` : 'COMING SOON'}
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
