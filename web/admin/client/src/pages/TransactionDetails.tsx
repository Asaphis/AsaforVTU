import { useEffect, useState } from "react";
import { useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getTransactionById } from "@/lib/backend";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function TransactionDetailsPage() {
  const [, params] = useRoute("/transactions/:id");
  const id = params?.id || "";
  const [tx, setTx] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const data = await getTransactionById(id);
        if (!mounted) return;
        setTx(data || null);
      } catch {
        if (!mounted) return;
        setTx(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [id]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12 text-slate-900">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Transaction Details</h2>
          <p className="text-slate-500 font-medium">Full information for transaction {id}</p>
        </div>
        <Link href="/transactions">
          <Button variant="outline" className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50 rounded-xl h-10 px-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        </Link>
      </div>

      <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden">
        <CardHeader className="p-6 pb-2 border-b border-slate-100">
          <CardTitle className="text-xl font-bold text-slate-900">Summary</CardTitle>
          <CardDescription className="text-slate-500 font-medium">Core fields and status.</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {loading ? (
            <div className="p-2 text-sm text-slate-400">Loading...</div>
          ) : tx ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div><span className="text-slate-500 text-xs font-bold uppercase tracking-wider">ID</span><div className="font-mono text-xs text-slate-700">{tx.id}</div></div>
                <div><span className="text-slate-500 text-xs font-bold uppercase tracking-wider">User</span><div className="text-slate-900">{tx.user}</div></div>
                <div><span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Type</span><div className="text-slate-900">{tx.type}</div></div>
                <div><span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Amount</span><div className="text-slate-900">₦{Number(tx.amount || 0).toLocaleString()}</div></div>
                <div><span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Status</span><div className="text-slate-900">{tx.status}</div></div>
                <div><span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Created</span><div className="text-slate-900">{new Date(tx.createdAt ? (tx.createdAt._seconds ? tx.createdAt._seconds * 1000 : tx.createdAt) : Date.now()).toLocaleString()}</div></div>
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-bold text-slate-900">Provider Status</h3>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div><span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Status</span><div className="text-slate-900">{tx.providerStatus || '-'}</div></div>
                  <div><span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Error Code</span><div className="text-slate-900">{tx.providerErrorCode || '-'}</div></div>
                  <div className="col-span-2"><span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Error Message</span><div className="font-mono text-xs break-all text-slate-700">{tx.providerErrorMessage || '-'}</div></div>
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-bold text-slate-900">Provider Raw</h3>
                <pre className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs overflow-x-auto text-slate-700">{JSON.stringify(tx.providerRaw || {}, null, 2)}</pre>
              </div>
            </>
          ) : (
            <div className="p-2 text-sm text-slate-400">Not found</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
