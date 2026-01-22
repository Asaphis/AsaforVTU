import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter, Download, RotateCcw, Receipt } from "lucide-react";
import { getAllTransactions, getUserTransactions } from "@/lib/backend";
import { Link } from "wouter";
import { useEffectOnce } from "@/lib/useEffectOnce";
import TransactionReceiptModal from "@/components/TransactionReceiptModal";

export default function TransactionsPage() {
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [context, setContext] = useState<{ uid?: string; email?: string } | null>(null);
  const [selectedTx, setSelectedTx] = useState<any | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        let data: any[] = [];
        try {
          const params = new URLSearchParams(window.location.search);
          const uid = params.get("uid") || undefined;
          const email = params.get("email") || undefined;
          if (uid || email) {
            setContext({ uid, email });
            data = await getUserTransactions({ uid, email });
          } else {
            data = await getAllTransactions();
          }
        } catch {
          data = await getAllTransactions();
        }
        if (!mounted) return;
        setTransactions(data);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const typeOk = filterType === "all" ? true : String(t.type || '').toLowerCase() === filterType;
      const statusOk = filterStatus === "all" ? true : String(t.status || '').toLowerCase() === filterStatus;
      return typeOk && statusOk;
    });
  }, [transactions, filterType, filterStatus]);

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div>
          <h2 className="text-4xl font-black text-white tracking-tighter mb-2 italic">Operation Logs</h2>
          <p className="text-slate-400 font-medium">
            {context?.uid || context?.email ? "Selective trace for targeted node identification." : "Universal transaction matrix of all system events."}
          </p>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" className="border-white/10 bg-white/5 text-white hover:bg-white/10 font-black rounded-2xl h-12 px-6 shadow-xl transition-all hover:scale-105 active:scale-95">
            <Download className="mr-2 h-5 w-5 text-primary" />
            Extract Archive
          </Button>
        </div>
      </div>

      <Card className="border-0 shadow-2xl bg-white/5 backdrop-blur-xl rounded-[2.5rem] ring-1 ring-white/10 overflow-hidden">
        <CardHeader className="p-10 pb-6 bg-white/[0.02]">
          <div className="flex flex-col lg:flex-row gap-6 justify-between items-center">
            <div className="relative w-full lg:w-96 group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-primary transition-colors" />
              <Input placeholder="Trace ID or Subject..." className="pl-14 h-14 bg-white/5 border-white/10 rounded-2xl text-white placeholder:text-slate-600 focus-visible:ring-primary/40 focus-visible:bg-white/10 transition-all duration-500" />
            </div>
            <div className="flex items-center gap-4 w-full lg:w-auto">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[160px] h-14 bg-white/5 border-white/10 rounded-2xl text-white font-bold focus:ring-primary/40">
                  <SelectValue placeholder="Node Type" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/10 rounded-2xl">
                  <SelectItem value="all" className="font-bold">All Services</SelectItem>
                  <SelectItem value="airtime">Airtime</SelectItem>
                  <SelectItem value="data">Data Stream</SelectItem>
                  <SelectItem value="cable">Satellite TV</SelectItem>
                  <SelectItem value="electricity">Power Grid</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[160px] h-14 bg-white/5 border-white/10 rounded-2xl text-white font-bold focus:ring-primary/40">
                  <SelectValue placeholder="Flow Status" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/10 rounded-2xl">
                  <SelectItem value="all" className="font-bold">Universal</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="pending">Queued</SelectItem>
                  <SelectItem value="failed">Terminated</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" size="icon" className="h-14 w-14 rounded-2xl border-white/10 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10">
                <Filter className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-24 text-center">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Retrieving Secure Archives...</p>
            </div>
          ) : (
          <Table>
            <TableHeader className="bg-white/[0.01]">
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Trace ID</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Initiator</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Node</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Magnitude</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Timestamp</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Status</TableHead>
                <TableHead className="px-10 text-right text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Operations</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.map((t) => (
                <TableRow key={t.id} className="border-white/5 hover:bg-white/[0.03] transition-colors group">
                  <TableCell className="px-10 py-6 font-mono text-[10px] text-slate-500 tracking-tighter italic">
                    {t.id.slice(0, 16)}...
                  </TableCell>
                  <TableCell className="text-sm font-black text-white group-hover:text-primary transition-colors tracking-tight">
                    {t.userId || t.user || 'Platform'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        {t.type}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-lg font-black text-white tracking-tighter">
                    ₦{Number(t.amount || 0).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-slate-400 text-xs font-medium opacity-60">
                    {t.createdAt 
                      ? new Date(t.createdAt._seconds ? t.createdAt._seconds * 1000 : t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })
                      : '—'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={t.status === 'success' ? 'default' : t.status === 'pending' ? 'secondary' : 'destructive'} 
                           className={cn(
                             "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border-0",
                             t.status === 'success' ? 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20' : 
                             t.status === 'pending' ? 'bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20' : 
                             'bg-red-500/10 text-red-400 ring-1 ring-red-500/20'
                           )}>
                      {t.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-10 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {t.status === 'failed' && (
                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-white/5 text-primary hover:bg-primary hover:text-white transition-all">
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-10 w-10 rounded-xl bg-white/5 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all"
                        onClick={() => { setSelectedTx(t); setIsReceiptOpen(true); }}
                      >
                        <Receipt className="h-4 w-4" />
                      </Button>
                      <Link href={`/transactions/${encodeURIComponent(t.id)}`}>
                        <Button variant="outline" className="h-10 border-white/10 bg-white/5 text-white hover:bg-white/10 font-black text-[10px] px-4 rounded-xl uppercase tracking-widest">
                          Details
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          )}
        </CardContent>
      </Card>
    </div>
      <TransactionReceiptModal 
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        transaction={selectedTx}
      />
    </div>
  );
}
