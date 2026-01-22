'use client';

import { useState } from 'react';
import { Smartphone } from 'lucide-react';
import { useService } from '@/hooks/useServices';
import { useAuth } from '@/contexts/AuthContext';
import TransactionPinModal from '@/components/dashboard/TransactionPinModal';
import TransactionResultModal from '@/components/dashboard/TransactionResultModal';
import { useNotifications } from '@/contexts/NotificationContext';
import { purchaseAirtime } from '@/lib/services';

export default function AirtimePage() {
  const { user } = useAuth();
  const { service, loading, error } = useService('airtime');
  const [network, setNetwork] = useState('MTN');
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('100');
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
    <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
          {loading ? (
            <div className="dashboard-card text-center py-20 border-none shadow-brand">
              <div className="w-16 h-16 border-4 border-[#F97316] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Preparing Service...</p>
            </div>
          ) : error ? (
            <div className="dashboard-card text-center py-12 text-red-500 border-none shadow-brand">
              <p className="font-black">Error loading service: {error}</p>
            </div>
          ) : !service ? (
            <div className="dashboard-card text-center py-12 text-gray-400 border-none shadow-brand">
              <p className="font-black">Service not available</p>
            </div>
          ) : (
            <>
              <div className="mb-10 text-center">
                <div className="w-20 h-20 rounded-3xl bg-gray-50 flex items-center justify-center text-[#F97316] mx-auto mb-6 shadow-xl shadow-orange-900/5 border-4 border-white">
                  <Smartphone size={40} />
                </div>
                <h1 className="text-4xl font-black text-[#0A1F44] tracking-tight">
                  {service.name}
                </h1>
                <p className="text-gray-400 font-medium mt-2 max-w-sm mx-auto">{service.description || 'Top up airtime for any network instantly.'}</p>
              </div>

              <form onSubmit={handlePurchase} className="dashboard-card space-y-8 p-10 border-none shadow-brand relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#F97316]/5 rounded-full -mr-16 -mt-16 blur-2xl" />
                
                <div className="space-y-6 relative z-10">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Select Network</label>
                    <div className="grid grid-cols-4 gap-3">
                      {['MTN', 'Glo', 'Airtel', '9mobile'].map((net) => (
                        <button
                          key={net}
                          type="button"
                          onClick={() => setNetwork(net)}
                          className={`py-3 rounded-2xl font-black text-xs transition-all border-2 ${
                            network === net 
                              ? 'bg-[#0A1F44] text-white border-[#0A1F44] shadow-lg shadow-blue-900/20' 
                              : 'bg-gray-50 text-gray-400 border-transparent hover:border-gray-100'
                          }`}
                        >
                          {net}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Phone Number</label>
                    <input 
                      type="tel" 
                      placeholder="08012345678" 
                      className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-[#F97316]/30 focus:bg-white focus:outline-none transition-all font-bold text-[#0A1F44] text-lg tracking-widest placeholder:text-gray-200"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                      required
                      minLength={11}
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Amount (₦)</label>
                    <div className="relative">
                      <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 font-bold text-lg">₦</span>
                      <input 
                        type="number" 
                        className="w-full pl-12 pr-6 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-[#F97316]/30 focus:bg-white focus:outline-none transition-all font-bold text-[#0A1F44] text-lg"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        min="50"
                        required
                      />
                    </div>
                  </div>

                  <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100/50 flex justify-between items-center group">
                      <span className="text-xs font-black text-[#0A1F44]/50 uppercase tracking-widest">Available Balance</span>
                      <span className="text-lg font-black text-[#0A1F44]">₦{user?.walletBalance?.toLocaleString() ?? '0.00'}</span>
                  </div>

                  <button 
                      type="submit" 
                      className="w-full py-5 rounded-2xl bg-[#F97316] text-white font-black text-sm uppercase tracking-[0.2em] hover:bg-[#F97316]/90 transition-all active:scale-[0.98] shadow-xl shadow-orange-900/20 disabled:opacity-30" 
                      disabled={!service.enabled || processing}
                  >
                    {processing ? 'Processing Transaction...' : service.enabled ? `Purchase ${network} Airtime` : 'Temporarily Unavailable'}
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
