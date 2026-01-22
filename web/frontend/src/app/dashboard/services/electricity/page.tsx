'use client';

import { useState } from 'react';
import { Zap } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useService } from '@/hooks/useServices';
import { processTransaction } from '@/lib/services';
import TransactionPinModal from '@/components/dashboard/TransactionPinModal';

export default function ElectricityPage() {
  const { user, refreshUser } = useAuth();
  const { service, loading, error } = useService('electricity');
  
  const [provider, setProvider] = useState('ikedc');
  const [meterNumber, setMeterNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [showPinModal, setShowPinModal] = useState(false);
  const [processing, setProcessing] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    if (user.walletBalance < Number(amount)) {
      alert('Insufficient wallet balance');
      return;
    }

    setShowPinModal(true);
  };

  const onPinSuccess = async () => {
    if (!user || !service) return;
    setProcessing(true);
    try {
      const result = await processTransaction(
        user.uid,
        Number(amount),
        'electricity',
        { provider, meterNumber, serviceName: service.name }
      );
      
      if (result.success) {
        alert('Payment successful!');
        setMeterNumber('');
        setAmount('');
        refreshUser();
      } else {
        alert(`Transaction failed: ${result.message}`);
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading service...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
  if (!service) return <div className="p-8 text-center">Service not available</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center mb-10">
        <div className="w-20 h-20 rounded-[2rem] bg-[#0A1F44] flex items-center justify-center text-[#F97316] mx-auto mb-6 shadow-xl shadow-blue-900/20">
          <Zap size={40} />
        </div>
        <h1 className="text-4xl font-black text-[#0A1F44] tracking-tight uppercase">
          {service.name}
        </h1>
        <p className="text-gray-400 font-medium mt-2">{service.description || 'Pay electricity bills across all networks instantly.'}</p>
      </div>

      <form onSubmit={handleSubmit} className="dashboard-card border-none shadow-brand p-10 space-y-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#F97316]/5 rounded-full -mr-16 -mt-16 blur-2xl" />
        
        <div className="space-y-6 relative z-10">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Select Provider (Disco)</label>
            <select 
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-[#0A1F44]/20 focus:bg-white focus:outline-none transition-all font-bold text-[#0A1F44] appearance-none"
            >
              <option value="ikedc">Ikeja Electric (IKEDC)</option>
              <option value="ekedc">Eko Electric (EKEDC)</option>
              <option value="aedc">Abuja Electric (AEDC)</option>
              <option value="ibedc">Ibadan Electric (IBEDC)</option>
              <option value="kano">Kano Electric (KEDCO)</option>
              <option value="ph">Port Harcourt Electric (PHED)</option>
              <option value="jos">Jos Electric (JED)</option>
              <option value="kaduna">Kaduna Electric (KAEDCO)</option>
              <option value="enugu">Enugu Electric (EEDC)</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Meter Number</label>
            <input 
              type="text" 
              value={meterNumber}
              onChange={(e) => setMeterNumber(e.target.value)}
              placeholder="Enter meter number"
              className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-[#0A1F44]/20 focus:bg-white focus:outline-none transition-all font-bold text-[#0A1F44] text-lg"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Payment Amount (₦)</label>
            <input 
              type="number" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              min="100"
              className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-[#0A1F44]/20 focus:bg-white focus:outline-none transition-all font-bold text-[#0A1F44] text-lg"
              required
            />
          </div>

          <div className="p-5 rounded-2xl bg-[#0A1F44]/5 border border-[#0A1F44]/5 flex justify-between items-center">
            <span className="text-[10px] font-black text-[#0A1F44]/60 uppercase tracking-widest">Available Balance</span>
            <span className="text-lg font-black text-[#0A1F44]">₦{user?.walletBalance?.toLocaleString() ?? '0.00'}</span>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={!service.enabled || processing}
          className="w-full py-5 rounded-2xl bg-[#0A1F44] text-white font-black text-xs uppercase tracking-[0.2em] hover:bg-[#0A1F44]/90 transition-all shadow-xl shadow-blue-900/20 disabled:opacity-30 relative z-10"
        >
          {processing ? 'PROCESSING...' : 'PAY BILL NOW'}
        </button>
      </form>

      <TransactionPinModal 
        isOpen={showPinModal}
        onClose={() => setShowPinModal(false)}
        onSuccess={onPinSuccess}
      />
    </div>
  );
}
