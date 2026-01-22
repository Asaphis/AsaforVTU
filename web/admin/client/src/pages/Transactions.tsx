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
import { cn } from "@/lib/utils";
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
    <div className="space-y-8 animate-in fade-in duration-500 text-slate-900">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Transactions</h2>
          <p className="text-slate-500 font-medium">
            {context?.uid || context?.email ? `Filtering logs for ${context.email || context.uid}` : "View and manage all system transactions."}
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl h-11 px-5 shadow-sm">
            <Download className="mr-2 h-4 w-4 text-slate-400" />
            Export CSV
          </Button>
        </div>
      </div>

      <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden">
        <CardHeader className="p-6 bg-slate-50/50 border-b border-slate-100">
          <div className="flex flex-col lg:flex-row gap-4 justify-between items-center">
            <div className="relative w-full lg:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input placeholder="Search Transaction ID..." className="pl-11 h-11 bg-white border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus-visible:ring-primary/20 transition-all" />
            </div>
            <div className="flex items-center gap-3 w-full lg:w-auto">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[150px] h-11 bg-white border-slate-200 rounded-xl text-slate-700 font-medium">
                  <SelectValue placeholder="All Services" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Services</SelectItem>
                  <SelectItem value="airtime">Airtime</SelectItem>
                  <SelectItem value="data">Data</SelectItem>
                  <SelectItem value="cable">Cable TV</SelectItem>
                  <SelectItem value="electricity">Electricity</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[150px] h-11 bg-white border-slate-200 rounded-xl text-slate-700 font-medium">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Loading Transactions...</p>
            </div>
          ) : (
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="border-slate-100 hover:bg-transparent">
                <TableHead className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Transaction ID</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-500">User</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-500">Service</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-500">Amount</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-500">Date & Time</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-500">Status</TableHead>
                <TableHead className="px-6 text-right text-xs font-bold uppercase tracking-wider text-slate-500">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.map((t) => (
                <TableRow key={t.id} className="border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <TableCell className="px-6 py-4 font-mono text-xs text-slate-500">
                    #{t.id.slice(0, 8)}
                  </TableCell>
                  <TableCell className="text-sm font-bold text-slate-900">
                    {t.userId || t.user || 'System'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 text-[10px] font-bold uppercase">
                      {t.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm font-bold text-slate-900">
                    ₦{Number(t.amount || 0).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-slate-500 text-xs font-medium">
                    {t.createdAt 
                      ? new Date(t.createdAt._seconds ? t.createdAt._seconds * 1000 : t.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                      : '—'}
                  </TableCell>
                  <TableCell>
                    <Badge className={cn(
                      "px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border",
                      t.status === 'success' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                      t.status === 'pending' ? 'bg-orange-50 text-orange-600 border-orange-100' : 
                      'bg-red-50 text-red-600 border-red-100'
                    )}>
                      {t.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-9 w-9 rounded-lg text-slate-400 hover:text-primary hover:bg-slate-100"
                        onClick={() => { setSelectedTx(t); setIsReceiptOpen(true); }}
                      >
                        <Receipt className="h-4 w-4" />
                      </Button>
                      <Link href={`/transactions/${encodeURIComponent(t.id)}`}>
                        <Button variant="outline" className="h-9 border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold rounded-lg px-3">
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
      <TransactionReceiptModal 
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        transaction={selectedTx}
      />
    </div>
  );
}
