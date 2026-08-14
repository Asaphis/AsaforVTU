'use client';

import { useState } from 'react';
import { GraduationCap } from 'lucide-react';
import { useService } from '@/hooks/useServices';
import { useAuth } from '@/contexts/AuthContext';
import { processTransaction } from '@/lib/services';
import TransactionPinModal from '@/components/dashboard/TransactionPinModal';

const UNIT_PRICE = 3500;

export default function ExamPinsPage() {
  const { service, loading, error } = useService('exam-pins');
  const { user, refreshUser } = useAuth();
  const [examType, setExamType] = useState('waec');
  const [quantity, setQuantity] = useState(1);
  const [showPinModal, setShowPinModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState('');
  const total = UNIT_PRICE * quantity;

  const purchase = async (transactionPin: string) => {
    if (!user || !service) return;
    setProcessing(true);
    setMessage('');
    try {
      const result = await processTransaction(user.uid, total, 'exam-pins', {
        examType, quantity, transactionPin, requestId: `EXAM_${Date.now()}`
      });
      setMessage(result.success ? `Purchase successful. ${result.data?.pins ? 'Your PINs are available in the transaction result.' : 'The provider is processing your order.'}` : result.message);
      if (result.success) await refreshUser();
    } catch (err: any) {
      setMessage(err?.message || 'Exam PIN purchase failed');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading service...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
  if (!service) return <div className="p-8 text-center text-gray-500">Service currently unavailable</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center mb-10">
        <div className="w-20 h-20 rounded-[2rem] bg-[#0A1F44] flex items-center justify-center text-[#F97316] mx-auto mb-6 shadow-xl"><GraduationCap size={40} /></div>
        <h1 className="text-4xl font-black text-[#0A1F44] tracking-tight uppercase">{service.name}</h1>
        <p className="text-gray-400 font-medium mt-2">{service.description || 'Purchase examination result-checking PINs.'}</p>
      </div>
      <form onSubmit={(event) => { event.preventDefault(); setShowPinModal(true); }} className="dashboard-card border-none shadow-brand p-10 space-y-8">
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-500">Exam board</label>
          <select value={examType} onChange={(event) => setExamType(event.target.value)} className="w-full px-5 py-4 rounded-2xl bg-gray-50 font-bold">
            <option value="waec">WAEC Result Checker</option><option value="neco">NECO Result Token</option><option value="nabteb">NABTEB Result Checker</option><option value="jamb">JAMB PIN</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-500">Quantity</label>
          <div className="grid grid-cols-5 gap-3">{[1, 2, 3, 4, 5].map(value => <button type="button" key={value} onClick={() => setQuantity(value)} className={`py-3 rounded-xl font-black ${quantity === value ? 'bg-[#0A1F44] text-white' : 'bg-gray-50 text-gray-500'}`}>{value}</button>)}</div>
        </div>
        <div className="p-5 rounded-2xl bg-[#0A1F44]/5 flex justify-between"><span className="font-bold text-gray-500">Total cost</span><span className="font-black text-[#0A1F44]">₦{total.toLocaleString()}</span></div>
        {message && <p className="rounded-xl bg-gray-50 p-4 text-sm font-semibold text-gray-700">{message}</p>}
        <button type="submit" disabled={!service.enabled || processing} className="w-full py-5 rounded-2xl bg-[#F97316] text-white font-black disabled:opacity-30">{processing ? 'PROCESSING...' : service.enabled ? 'PURCHASE PIN NOW' : 'COMING SOON'}</button>
      </form>
      <TransactionPinModal isOpen={showPinModal} onClose={() => setShowPinModal(false)} onSuccess={purchase} />
    </div>
  );
}
