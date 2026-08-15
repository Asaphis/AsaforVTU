'use client';

/* Ferixas receipt: focused transaction confirmation with printable live transaction details. */
import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getWalletHistory } from '@/lib/services';
import { ArrowLeft, CheckCircle2, AlertCircle, Clock, Printer, Copy } from 'lucide-react';

const naira = (value: number) => `₦${Number(value || 0).toLocaleString()}`;

export default function TransactionReceiptPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tx, setTx] = useState<any | null>(null);
  const [now, setNow] = useState<number>(Date.now());

  useEffect(() => {
    const run = async () => {
      if (!user) return;
      try {
        const items = await getWalletHistory();
        setTx(items.find((item) => String(item.id) === String(params?.id)) || null);
      } finally { setLoading(false); }
    };
    run();
  }, [user, params?.id]);

  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);

  const balances = useMemo(() => {
    const before = Number(tx?.balanceBefore || 0);
    const after = Number(tx?.balanceAfter || 0);
    const amount = Number(tx?.amount || 0);
    return { before, after, amount, isDebit: String(tx?.type) === 'debit' };
  }, [tx]);

  const createdMs = useMemo(() => {
    const value = tx?.created_at || tx?.createdAt;
    if (!value) return undefined;
    return value._seconds ? value._seconds * 1000 : new Date(value).getTime();
  }, [tx]);
  const timeAgo = useMemo(() => {
    if (!createdMs) return '-';
    const seconds = Math.max(0, Math.floor((now - createdMs) / 1000));
    if (seconds >= 86400) return `${Math.floor(seconds / 86400)}d ago`;
    if (seconds >= 3600) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds >= 60) return `${Math.floor(seconds / 60)}m ago`;
    return `${seconds}s ago`;
  }, [createdMs, now]);

  const copyReference = async () => {
    if (!tx?.reference) return;
    try { await navigator.clipboard.writeText(tx.reference); alert('Reference copied.'); }
    catch { alert('Unable to copy the reference.'); }
  };

  if (loading) return <div className="space-y-4 animate-pulse"><div className="h-8 w-40 rounded bg-[#E8EDF2]" /><div className="h-[420px] rounded-2xl bg-[#E8EDF2]" /></div>;

  if (!tx) return <main className="space-y-5"><button onClick={() => router.push('/dashboard/transactions')} className="inline-flex items-center gap-2 text-sm font-bold text-[#036A97]"><ArrowLeft size={16} />Back to activity</button><section className="rounded-2xl border border-[#E8EDF2] bg-white p-8 text-center"><p className="font-extrabold text-[#012044]">Transaction not found</p><p className="mt-1 text-sm text-[#718096]">This wallet entry may no longer be available.</p></section></main>;

  const statusOk = String(tx.status).toLowerCase() === 'success' || String(tx.status).toLowerCase() === 'successful';
  const statusPending = String(tx.status).toLowerCase() === 'pending';
  const statusColor = statusOk ? 'bg-[#EAF5C7] text-[#416000]' : statusPending ? 'bg-[#FFF2D6] text-[#895B00]' : 'bg-[#FCEAE5] text-[#B3442D]';

  return <main className="mx-auto max-w-3xl space-y-5 pb-24 lg:pb-8"><button onClick={() => router.push('/dashboard/transactions')} className="inline-flex items-center gap-2 text-sm font-bold text-[#036A97] transition hover:text-[#012044]"><ArrowLeft size={16} />Back to activity</button><section className="overflow-hidden rounded-[26px] border border-[#E8EDF2] bg-white shadow-[0_12px_30px_rgba(1,32,68,0.05)]"><div className="bg-[#012044] px-5 py-6 text-white sm:px-7"><div className="flex items-start justify-between gap-4"><div className="flex items-center gap-3"><span className={`grid h-11 w-11 place-items-center rounded-full ${statusOk ? 'bg-[#99BC0D] text-[#012044]' : 'bg-white/15 text-white'}`}>{statusOk ? <CheckCircle2 size={23} /> : <AlertCircle size={22} />}</span><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-white/55">Transaction receipt</p><h1 className="mt-1 text-xl font-extrabold">{statusOk ? 'Completed transaction' : 'Transaction update'}</h1></div></div><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] ${statusOk ? 'bg-[#99BC0D] text-[#012044]' : 'bg-white/15 text-white'}`}>{tx.status || 'pending'}</span></div><div className="mt-7"><p className="text-xs text-white/55">{balances.isDebit ? 'Amount debited' : 'Amount credited'}</p><p className="mt-1 text-3xl font-extrabold tracking-tight">{balances.isDebit ? '-' : '+'}{naira(balances.amount)}</p></div></div><div className="p-5 sm:p-7"><div className="grid gap-3 sm:grid-cols-3">{[{ label: 'Balance before', value: naira(balances.before) }, { label: balances.isDebit ? 'Debited amount' : 'Credited amount', value: naira(balances.amount) }, { label: 'Balance after', value: naira(balances.after) }].map((item) => <div key={item.label} className="rounded-xl bg-[#FFF7F4] p-3.5"><p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#718096]">{item.label}</p><p className="mt-1 text-lg font-extrabold text-[#012044]">{item.value}</p></div>)}</div><div className="mt-5 grid gap-3 sm:grid-cols-2"><div className="rounded-xl border border-[#E8EDF2] p-3.5"><p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#718096]">Description</p><p className="mt-1.5 text-sm font-bold text-[#012044]">{tx.description || tx.serviceType || 'Wallet transaction'}</p></div><div className="rounded-xl border border-[#E8EDF2] p-3.5"><p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#718096]">Reference</p><div className="mt-1.5 flex items-center justify-between gap-2"><code className="min-w-0 truncate text-xs font-bold text-[#012044]">{tx.reference || '—'}</code><button onClick={copyReference} aria-label="Copy transaction reference" className="shrink-0 rounded-md p-1.5 text-[#036A97] hover:bg-[#F3FAFC]"><Copy size={14} /></button></div></div></div><div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-[#E8EDF2] pt-4 text-xs text-[#718096]"><span className="inline-flex items-center gap-1.5"><Clock size={14} />{createdMs ? new Date(createdMs).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' }) : '—'}</span><span>{timeAgo}</span></div><div className="mt-6 flex flex-wrap gap-2"><button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-xl bg-[#036A97] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#012044]"><Printer size={16} />Print receipt</button><button onClick={() => router.push('/dashboard/transactions')} className="rounded-xl border border-[#E8EDF2] px-4 py-2.5 text-sm font-bold text-[#012044] transition hover:bg-[#FFF7F4]">Close</button></div></div></section></main>;
}
