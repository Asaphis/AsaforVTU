'use client';

import { useState, useEffect } from 'react';
import { Smartphone, ArrowRightLeft, Info } from 'lucide-react';
import { useService } from '@/hooks/useServices';
import { useAuth } from '@/contexts/AuthContext';
import TransactionPinModal from '@/components/dashboard/TransactionPinModal';
import TransactionResultModal from '@/components/dashboard/TransactionResultModal';
import { useNotifications } from '@/contexts/NotificationContext';
import { purchaseAirtime, getAdminSettings } from '@/lib/services';

export default function AirtimePage() {
  const { user } = useAuth();
  const { service, loading, error } = useService('airtime');
  const [network, setNetwork] = useState('MTN');
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('100');
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
            const firstEnabled = Object.keys(settings.airtimeNetworks).find(k => settings.airtimeNetworks[k]?.enabled);
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

  const networks = ['MTN', 'Glo', 'Airtel', '9mobile'];
  const currentNetworkSettings = adminSettings?.airtimeNetworks?.[network] || { discount: 0, enabled: true };
  const discount = Number(currentNetworkSettings.discount || 0);
  const payableAmount = Number(amount) * (1 - discount / 100);
  
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

  const { addNotification } = useNotifications();

  const handlePurchase = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(amount);
    if (!phone || !amt || amt < 50 || phone.length !== 11) return;
    setShowPinModal(true);
  };

  const onPinSuccess = async () => {
    if (!user || !service) return;
    
    setProcessing(true);
    try {
      const result = await purchaseAirtime(user.uid, Number(amount), { network, phone });

      if (result.success) {
        addNotification('success', 'Airtime purchase successful', `₦${Number(amount).toLocaleString()} on ${network}`);
        setResultModal({
          open: true,
          status: 'success',
          title: 'Purchase Successful',
          message: `You have successfully purchased ₦${Number(amount).toLocaleString()} airtime on ${network} for ${phone}.`,
          transactionId: result.transactionId
        });
        setPhone('');
        setAmount('100');
      } else {
        addNotification('error', 'Transaction failed', result.message);
        setResultModal({
          open: true,
          status: 'error',
          title: 'Transaction Failed',
          message: result.message || 'Unable to complete your purchase. Please try again.',
          transactionId: result.transactionId
        });
      }
    } catch (err: any) {
      addNotification('error', 'Error', err.message);
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
    <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
          {loading ? (
            <div className="dashboard-card text-center py-24 border-none shadow-brand relative overflow-hidden">
              <div className="tech-pattern absolute inset-0 opacity-[0.05]" />
              <div className="relative z-10">
                <div className="w-20 h-20 border-8 border-[#C58A17]/10 border-t-[#C58A17] rounded-[2rem] animate-spin mx-auto mb-6 shadow-2xl" />
                <p className="text-gray-400 font-black uppercase tracking-[0.3em] text-[10px]">Initializing Crypto-Topup...</p>
              </div>
            </div>
          ) : error ? (
            <div className="dashboard-card text-center py-16 text-red-500 border-none shadow-brand bg-red-50/30">
              <p className="font-black uppercase tracking-widest">Protocol Error: {error}</p>
            </div>
          ) : !service ? (
            <div className="dashboard-card text-center py-16 text-gray-400 border-none shadow-brand">
              <p className="font-black uppercase tracking-widest">Service Decommissioned</p>
            </div>
          ) : (
            <>
              <div className="mb-12 text-center">
                <div className="w-24 h-24 rounded-[2.5rem] bg-gray-50 flex items-center justify-center text-[#0B4F6C] mx-auto mb-8 shadow-2xl shadow-[#0B4F6C]/10 border-8 border-white group hover:rotate-12 transition-transform duration-500">
                  <Smartphone size={48} className="group-hover:scale-110 transition-transform" />
                </div>
                <h1 className="text-5xl font-black text-[#0B4F6C] tracking-tighter uppercase">
                  {service.name}
                </h1>
                <div className="h-1.5 w-12 bg-[#C58A17] rounded-full mx-auto mt-4" />
                <p className="text-gray-400 font-bold uppercase tracking-[0.2em] text-[10px] mt-6 max-w-xs mx-auto leading-relaxed">Secure Telecom Liquidity Provisioning</p>
              </div>

              <form onSubmit={handlePurchase} className="dashboard-card space-y-10 p-8 lg:p-12 border-none shadow-brand relative overflow-hidden">
                <div className="tech-pattern absolute inset-0 opacity-[0.03]" />
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#C58A17]/5 rounded-full -mr-16 -mt-16 blur-2xl" />
                
                <div className="space-y-8 relative z-10">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2 flex items-center gap-2">
                       <div className="w-1.5 h-1.5 rounded-full bg-[#C58A17]" /> Select Network Infrastructure
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {networks.map((net) => {
                        const isEnabled = adminSettings?.airtimeNetworks?.[net]?.enabled !== false;
                        const netDiscount = adminSettings?.airtimeNetworks?.[net]?.discount || 0;
                        
                        return (
                          <button
                            key={net}
                            type="button"
                            disabled={!isEnabled}
                            onClick={() => setNetwork(net)}
                            className={`py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all border-2 relative overflow-hidden ${
                              network === net 
                                ? 'bg-[#0B4F6C] text-white border-[#0B4F6C] shadow-2xl shadow-[#0B4F6C]/30 scale-[1.05]' 
                                : isEnabled 
                                  ? 'bg-gray-50 text-gray-400 border-transparent hover:border-gray-100 hover:bg-white shadow-inner'
                                  : 'bg-gray-100 text-gray-300 border-transparent cursor-not-allowed grayscale'
                            }`}
                          >
                            {net}
                            {isEnabled && netDiscount > 0 && (
                              <div className="absolute top-0 right-0 bg-[#C58A17] text-white text-[8px] px-1.5 py-0.5 rounded-bl-lg font-black">
                                -{netDiscount}%
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2 flex items-center gap-2">
                       <div className="w-1.5 h-1.5 rounded-full bg-[#C58A17]" /> Destination Identifier
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
                    <div className="flex justify-between items-center px-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#C58A17]" /> Value Appropriation (₦)
                      </label>
                      {discount > 0 && (
                        <div className="text-[9px] font-black text-[#C58A17] uppercase tracking-wider flex items-center gap-1">
                          <Info size={12} /> {discount}% Discount Applied
                        </div>
                      )}
                    </div>
                    <div className="relative group">
                      <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 font-black text-xl group-focus-within:text-[#0B4F6C] transition-colors">₦</span>
                      <input 
                        type="number" 
                        className="w-full pl-14 pr-6 py-5 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-[#0B4F6C]/20 focus:bg-white focus:outline-none transition-all font-black text-[#0B4F6C] text-2xl tracking-tighter shadow-inner"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        min="50"
                        required
                      />
                      {discount > 0 && (
                        <div className="absolute right-6 top-1/2 -translate-y-1/2 text-right">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter line-through decoration-[#C58A17]/30">₦{Number(amount).toLocaleString()}</p>
                          <p className="text-sm font-black text-[#0B4F6C]">₦{payableAmount.toLocaleString()}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-[#0B4F6C]/5 p-6 rounded-[2rem] border border-[#0B4F6C]/5 flex justify-between items-center group overflow-hidden relative">
                      <div className="tech-pattern absolute inset-0 opacity-[0.02]" />
                      <div className="relative z-10">
                        <span className="text-[10px] font-black text-[#0B4F6C]/60 uppercase tracking-[0.2em]">Available Liquidity</span>
                      </div>
                      <span className="text-xl font-black text-[#0B4F6C] relative z-10 tracking-tighter">₦{user?.walletBalance?.toLocaleString() ?? '0.00'}</span>
                  </div>

                  <button 
                      type="submit" 
                      className="w-full py-6 rounded-2xl bg-[#C58A17] text-white font-black text-xs uppercase tracking-[0.3em] hover:bg-[#A67513] transition-all active:scale-[0.98] shadow-2xl shadow-[#C58A17]/30 disabled:opacity-30 group" 
                      disabled={!service.enabled || !currentNetworkSettings.enabled || processing}
                  >
                    <span className="flex items-center justify-center gap-3">
                       {processing ? 'EXECUTING PROTOCOL...' : (service.enabled && currentNetworkSettings.enabled) ? `INITIATE ${network} TOPUP` : 'OFFLINE'}
                       {!processing && <ArrowRightLeft size={18} className="group-hover:rotate-90 transition-transform duration-500" />}
                    </span>
                  </button>
                </div>
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
