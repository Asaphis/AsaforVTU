'use client';

/* Ferixas service purchase flow: focused exam PIN order form with live transaction-PIN confirmation. */
import { useState } from 'react';
import { GraduationCap, Ticket } from 'lucide-react';
import { useService } from '@/hooks/useServices';
import { useAuth } from '@/contexts/AuthContext';
import { processTransaction } from '@/lib/services';
import TransactionPinModal from '@/components/dashboard/TransactionPinModal';

const UNIT_PRICE = 3500;
const boards = [['waec', 'WAEC Result Checker'], ['neco', 'NECO Result Token'], ['nabteb', 'NABTEB Result Checker'], ['jamb', 'JAMB PIN']];

export default function ExamPinsPage() {
  const { service, loading, error } = useService('exam-pins');
  const { user, refreshUser } = useAuth();
  const [examType, setExamType] = useState('waec');
  const [quantity, setQuantity] = useState(1);
  const [showPinModal, setShowPinModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState('');
  const total = UNIT_PRICE * quantity;
  const purchase = async (transactionPin: string) => { if (!user || !service) return; setProcessing(true); setMessage(''); try { const result = await processTransaction(user.uid, total, 'exam-pins', { examType, quantity, transactionPin, requestId: `EXAM_${Date.now()}` }); setMessage(result.success ? `Purchase successful. ${result.data?.pins ? 'Your PINs are available in the transaction result.' : 'The provider is processing your order.'}` : result.message); if (result.success) await refreshUser(); } catch (purchaseError: any) { setMessage(purchaseError?.message || 'Exam PIN purchase failed.'); } finally { setProcessing(false); } };
  if (loading) return <main className="mx-auto max-w-3xl"><div className="rounded-2xl border border-[#E8EDF2] bg-white p-10 text-center"><div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-[#E8EDF2] border-t-[#036A97]" /><p className="mt-4 text-sm font-bold text-[#012044]">Loading exam PIN service…</p></div></main>;
  if (error) return <main className="mx-auto max-w-3xl"><div className="rounded-2xl border border-[#F0C1B5] bg-[#FFF6F3] p-5 text-sm font-medium text-[#B3442D]">{error}</div></main>;
  if (!service) return <main className="mx-auto max-w-3xl"><div className="rounded-2xl border border-[#E8EDF2] bg-white p-8 text-center text-sm text-[#718096]">This service is currently unavailable.</div></main>;
  return <main className="mx-auto max-w-3xl space-y-5 pb-24 lg:pb-8"><section><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#718096]">Services / Exam PINs</p><div className="mt-2 flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#FFF8E8] text-[#D69B04]"><GraduationCap size={20} /></span><div><h1 className="text-2xl font-extrabold tracking-tight text-[#012044]">Buy exam PINs.</h1><p className="text-sm text-[#718096]">Choose an exam board and the quantity you need.</p></div></div></section><form onSubmit={(event) => { event.preventDefault(); setShowPinModal(true); }} className="overflow-hidden rounded-2xl border border-[#E8EDF2] bg-white"><div className="space-y-5 p-5 sm:p-6"><label className="block"><span className="text-sm font-extrabold text-[#012044]">1. Exam board</span><select value={examType} onChange={(event) => setExamType(event.target.value)} className="mt-2 w-full rounded-xl border border-[#E8EDF2] bg-white px-3 py-3 text-sm font-medium text-[#012044] outline-none focus:border-[#036A97] focus:ring-2 focus:ring-[#036A97]/10">{boards.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><div><p className="text-sm font-extrabold text-[#012044]">2. Quantity</p><div className="mt-3 grid grid-cols-5 gap-2">{[1, 2, 3, 4, 5].map((value) => <button type="button" key={value} onClick={() => setQuantity(value)} className={`rounded-xl py-3 text-sm font-extrabold transition ${quantity === value ? 'bg-[#012044] text-white' : 'border border-[#E8EDF2] bg-white text-[#012044] hover:border-[#036A97]'}`}>{value}</button>)}</div></div><div className="flex items-center justify-between rounded-xl bg-[#FFF7F4] px-4 py-3"><span className="inline-flex items-center gap-2 text-sm font-medium text-[#718096]"><Ticket size={16} className="text-[#D69B04]" />Total cost</span><span className="text-lg font-extrabold text-[#012044]">₦{total.toLocaleString()}</span></div>{message && <p className="rounded-xl border border-[#E8EDF2] bg-[#FFFDFB] px-4 py-3 text-sm font-medium text-[#012044]">{message}</p>}</div><footer className="border-t border-[#E8EDF2] bg-[#FFFDFB] p-4 sm:px-6"><button type="submit" disabled={!service.enabled || processing} className="w-full rounded-xl bg-[#036A97] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#012044] disabled:cursor-not-allowed disabled:opacity-40">{processing ? 'Processing purchase…' : service.enabled ? 'Purchase PIN' : 'Service unavailable'}</button></footer></form><TransactionPinModal isOpen={showPinModal} onClose={() => setShowPinModal(false)} onSuccess={purchase} /></main>;
}
