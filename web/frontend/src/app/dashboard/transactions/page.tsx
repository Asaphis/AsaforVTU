'use client';

/* Ferixas activity ledger: calm paper table, compact semantic status signals, and live detail links. */
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getWalletHistory } from '@/lib/services';
import { ArrowUpRight, ArrowDownLeft, Clock, Receipt, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

const getTransactionDate = (transaction: any) => transaction.created_at || transaction.createdAt?.toDate?.() || (transaction.createdAt?._seconds ? transaction.createdAt._seconds * 1000 : transaction.createdAt);

export default function TransactionsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!user) return;
      try { setTransactions(await getWalletHistory()); }
      catch (error) { console.error('Error fetching transactions:', error); }
      finally { setLoading(false); }
    };
    fetchTransactions();
  }, [user]);

  return (
    <main className="space-y-5 pb-24 lg:pb-8">
      <section className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#718096]">Activity</p><h1 className="mt-1 text-2xl font-extrabold tracking-tight text-[#012044]">Transaction history.</h1><p className="mt-1 text-sm text-[#718096]">Wallet funding and completed service purchases.</p></div><span className="inline-flex items-center gap-2 self-start rounded-xl bg-[#F3FAFC] px-3 py-2 text-xs font-bold text-[#036A97] sm:self-auto"><Receipt size={15} />{transactions.length} entries</span></section>

      <section className="overflow-hidden rounded-2xl border border-[#E8EDF2] bg-white">
        {loading ? <div className="space-y-3 p-5 animate-pulse"><div className="h-12 rounded-xl bg-[#E8EDF2]" /><div className="h-12 rounded-xl bg-[#E8EDF2]" /><div className="h-12 rounded-xl bg-[#E8EDF2]" /></div> : transactions.length === 0 ? <div className="px-5 py-16 text-center"><span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#FFF7F4] text-[#718096]"><Clock size={22} /></span><p className="mt-4 font-extrabold text-[#012044]">No transactions yet</p><p className="mt-1 text-sm text-[#718096]">Completed wallet and service activity will appear here.</p></div> : <><div className="hidden grid-cols-[minmax(220px,1.6fr)_1fr_120px_120px_36px] gap-4 border-b border-[#E8EDF2] bg-[#FFF7F4] px-5 py-3 text-[11px] font-bold uppercase tracking-[0.12em] text-[#718096] md:grid"><span>Activity</span><span>Reference</span><span>Amount</span><span>Status</span><span /></div><div className="divide-y divide-[#E8EDF2]">{transactions.map((transaction) => {
          const isCredit = transaction.type === 'credit';
          const dateValue = getTransactionDate(transaction);
          const date = dateValue ? new Date(dateValue) : null;
          const status = String(transaction.status || 'pending').toLowerCase();
          const statusStyle = status === 'success' || status === 'successful' ? 'bg-[#EAF5C7] text-[#416000]' : status === 'pending' ? 'bg-[#FFF2D6] text-[#895B00]' : 'bg-[#FCEAE5] text-[#B3442D]';
          return <button key={transaction.id} onClick={() => router.push(`/dashboard/transactions/${transaction.id}`)} className="group grid w-full gap-3 px-4 py-4 text-left transition hover:bg-[#FFFDFB] md:grid-cols-[minmax(220px,1.6fr)_1fr_120px_120px_36px] md:items-center md:gap-4 md:px-5"><span className="flex min-w-0 items-center gap-3"><span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${isCredit ? 'bg-[#EDF8E7] text-[#147115]' : 'bg-[#F3FAFC] text-[#036A97]'}`}>{isCredit ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}</span><span className="min-w-0"><span className="block truncate text-sm font-extrabold text-[#012044]">{transaction.description || transaction.serviceType || transaction.type}</span><span className="mt-0.5 block text-xs text-[#718096]">{transaction.walletType ? `${transaction.walletType} wallet` : date ? date.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Transaction'}</span></span></span><code className="hidden truncate text-xs font-bold text-[#718096] md:block">{transaction.reference || '—'}</code><span className={`text-sm font-extrabold ${isCredit ? 'text-[#147115]' : 'text-[#012044]'}`}>{isCredit ? '+' : '-'}₦{Number(transaction.amount || 0).toLocaleString()}</span><span className={`w-fit rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] ${statusStyle}`}>{status}</span><ChevronRight size={18} className="hidden text-[#718096] transition group-hover:translate-x-0.5 md:block" /></button>;
        })}</div></>}
      </section>
    </main>
  );
}
