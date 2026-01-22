'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getWalletHistory } from '@/lib/services';
import { ArrowUpRight, ArrowDownLeft, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function TransactionsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!user) return;
      try {
        const history = await getWalletHistory();
        setTransactions(history);
      } catch (error) {
        console.error('Error fetching transactions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [user]);

  if (loading) return <div className="p-8 text-center">Loading transactions...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-[#0A1F44] tracking-tight">Transactions</h1>
          <p className="text-gray-400 font-medium mt-1">Monitor your wallet activity and service history</p>
        </div>
      </div>

      <div className="dashboard-card border-none shadow-brand overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-50 bg-gray-50/50">
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Activity</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Reference</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Amount</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Status</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Date & Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-200">
                        <Clock size={32} />
                      </div>
                      <p className="text-xs font-black text-gray-300 uppercase tracking-widest">No activity found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className="group hover:bg-gray-50 transition-all cursor-pointer"
                    onClick={() => router.push(`/dashboard/transactions/${tx.id}`)}
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                          tx.type === 'credit' 
                            ? 'bg-green-50 text-green-600 group-hover:bg-green-100' 
                            : 'bg-red-50 text-red-600 group-hover:bg-red-100'
                        }`}>
                          {tx.type === 'credit' ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                        </div>
                        <div>
                          <p className="text-base font-bold text-[#0A1F44] leading-none mb-1 capitalize">
                            {tx.description || tx.serviceType || tx.type}
                          </p>
                          <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">
                            {tx.walletType ? `Wallet: ${tx.walletType}` : 'Transaction'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <code className="text-[10px] font-black text-gray-400 uppercase bg-gray-50 px-2 py-1 rounded">
                        {tx.reference?.slice(0, 12)}...
                      </code>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`text-lg font-black tracking-tight ${
                        tx.type === 'credit' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {tx.type === 'credit' ? '+' : '-'}₦{tx.amount?.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        tx.status === 'success' ? 'bg-green-100 text-green-700' :
                        tx.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-[#0A1F44]">
                          {tx.createdAt ? new Date(tx.createdAt._seconds ? tx.createdAt._seconds * 1000 : tx.createdAt).toLocaleDateString() : '-'}
                        </span>
                        <span className="text-[10px] font-black text-gray-300 uppercase">
                          {tx.createdAt ? new Date(tx.createdAt._seconds ? tx.createdAt._seconds * 1000 : tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
