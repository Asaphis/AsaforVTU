import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Check, X, Wallet as WalletIcon, RefreshCw } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { creditWallet, debitWallet, getWalletLogs, getWalletRequests, approveWalletRequest, rejectWalletRequest } from "@/lib/backend";

export default function WalletPage() {
  const { toast } = useToast();
  const [creditForm, setCreditForm] = useState({ userId: '', amount: '', reason: '' });
  const [debitForm, setDebitForm] = useState({ userId: '', amount: '', reason: '' });
  const [processing, setProcessing] = useState<'credit'|'debit'|null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [deposits, setDeposits] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  const load = async () => {
    setLoadingRequests(true);
    try {
      const [wl, dp] = await Promise.all([getWalletLogs(), getWalletRequests()]);
      setLogs(wl || []);
      setDeposits(dp || []);
    } catch {
      setLogs([]);
      setDeposits([]);
    } finally {
      setLoadingRequests(false);
    }
  };

  useEffect(() => {
    load();
    try {
      const params = new URLSearchParams(window.location.search);
      const prefill = params.get("userId");
      if (prefill) {
        setCreditForm(prev => ({ ...prev, userId: prefill }));
        setDebitForm(prev => ({ ...prev, userId: prefill }));
      }
    } catch {}
  }, []);

  const handleApprove = async (id: string) => {
    try {
      await approveWalletRequest(id);
      toast({ title: "Approved", description: "Funding request approved" });
      load();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleReject = async (id: string) => {
    try {
      await rejectWalletRequest(id);
      toast({ title: "Rejected", description: "Funding request rejected" });
      load();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-white tracking-tighter mb-2 italic">Capital Flow</h2>
          <p className="text-slate-400 font-medium">Manage node funding requests and manual liquidity adjustments.</p>
        </div>
        <Button variant="outline" onClick={load} disabled={loadingRequests} className="border-white/10 bg-white/5 text-white hover:bg-white/10 rounded-2xl h-12 px-6">
          <RefreshCw className={`mr-2 h-4 w-4 ${loadingRequests ? 'animate-spin' : ''}`} />
          Sync Ledger
        </Button>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        <Card className="bg-primary/10 border-0 shadow-2xl rounded-[2.5rem] ring-1 ring-primary/20 group hover:bg-primary/[0.15] transition-all">
          <CardHeader className="p-8 pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Pending Traces</CardTitle>
          </CardHeader>
          <CardContent className="p-8 pt-2">
            <div className="text-5xl font-black text-white tracking-tighter">{deposits.filter(d => d.status === 'pending').length}</div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-4 italic">Liquidity Volume: ₦{deposits.filter(d => d.status === 'pending').reduce((s, d) => s + Number(d.amount || 0), 0).toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-2xl bg-white/5 backdrop-blur-xl rounded-[2.5rem] ring-1 ring-white/10 overflow-hidden">
          <CardHeader className="p-8 pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Processed Today</CardTitle>
          </CardHeader>
          <CardContent className="p-8 pt-2">
            <div className="text-5xl font-black text-white tracking-tighter">{deposits.filter(d => {
              const dd = new Date(d.createdAt ? (d.createdAt._seconds ? d.createdAt._seconds * 1000 : d.createdAt) : Date.now());
              const now = new Date();
              return d.status === 'success' && dd.getDate() === now.getDate() && dd.getMonth() === now.getMonth() && dd.getFullYear() === now.getFullYear();
            }).length}</div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-4 italic">Total Value: ₦{deposits.filter(d => {
              const dd = new Date(d.createdAt ? (d.createdAt._seconds ? d.createdAt._seconds * 1000 : d.createdAt) : Date.now());
              const now = new Date();
              return d.status === 'success' && dd.getDate() === now.getDate() && dd.getMonth() === now.getMonth() && dd.getFullYear() === now.getFullYear();
            }).reduce((s, d) => s + Number(d.amount || 0), 0).toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-2xl bg-white/5 backdrop-blur-xl rounded-[2.5rem] ring-1 ring-white/10 overflow-hidden">
          <CardHeader className="p-8 pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Global Monthly Flow</CardTitle>
          </CardHeader>
          <CardContent className="p-8 pt-2">
            <div className="text-5xl font-black text-white tracking-tighter">₦{deposits.filter(d => {
              const dd = new Date(d.createdAt ? (d.createdAt._seconds ? d.createdAt._seconds * 1000 : d.createdAt) : Date.now());
              const now = new Date();
              return d.status === 'success' && dd.getMonth() === now.getMonth() && dd.getFullYear() === now.getFullYear();
            }).reduce((s, d) => s + Number(d.amount || 0), 0).toLocaleString()}</div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-4 italic">+ Performance Delta</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="requests" className="space-y-8">
        <TabsList className="bg-white/5 border border-white/10 p-2 rounded-2xl">
          <TabsTrigger value="requests" className="rounded-xl px-6 h-10 font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-primary transition-all">Node Requests</TabsTrigger>
          <TabsTrigger value="adjust" className="rounded-xl px-6 h-10 font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-primary transition-all">Liquidity Injection</TabsTrigger>
          <TabsTrigger value="logs" className="rounded-xl px-6 h-10 font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-primary transition-all">Audit Trails</TabsTrigger>
        </TabsList>

        <TabsContent value="requests">
          <Card className="border-0 shadow-2xl bg-white/5 backdrop-blur-xl rounded-[2.5rem] ring-1 ring-white/10 overflow-hidden">
            <CardHeader className="p-10 pb-6 bg-white/[0.02]">
              <CardTitle className="text-2xl font-black text-white tracking-tight italic">Funding Protocols</CardTitle>
              <CardDescription className="text-slate-500 uppercase tracking-widest text-[10px] font-black mt-2">Authorization required for user node liquidity</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-white/[0.01]">
                  <TableRow className="border-white/5">
                    <TableHead className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Trace ID</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Initiator</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Value Magnitude</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Protocol</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Status</TableHead>
                    <TableHead className="px-10 text-right text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Authorization</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deposits.length === 0 ? (
                    <TableRow className="border-0">
                      <TableCell colSpan={6} className="text-center py-20 text-slate-600 font-black uppercase tracking-widest text-[10px]">No pending transmissions</TableCell>
                    </TableRow>
                  ) : (
                    deposits.map((d) => (
                      <TableRow key={d.id} className="border-white/5 hover:bg-white/[0.03] transition-colors group">
                        <TableCell className="px-10 py-6 font-mono text-[10px] text-slate-500 italic">{d.id.slice(0,12)}</TableCell>
                        <TableCell className="text-sm font-black text-white group-hover:text-primary transition-colors">{d.userEmail || d.user || "System"}</TableCell>
                        <TableCell className="text-lg font-black text-white tracking-tighter">₦{Number(d.amount || 0).toLocaleString()}</TableCell>
                        <TableCell className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">{d.method || "manual"}</TableCell>
                        <TableCell>
                          <Badge className={cn(
                            "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border-0",
                            d.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20' : 
                            d.status === 'pending' ? 'bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20' : 
                            'bg-red-500/10 text-red-400 ring-1 ring-red-500/20'
                          )}>
                            {d.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-10 text-right space-x-3">
                          {d.status === 'pending' && (
                            <>
                              <Button variant="ghost" className="h-10 w-10 rounded-xl bg-white/5 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all" onClick={() => handleApprove(d.id)}>
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" className="h-10 w-10 rounded-xl bg-white/5 text-red-400 hover:bg-red-500 hover:text-white transition-all" onClick={() => handleReject(d.id)}>
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="adjust">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Credit User Wallet</CardTitle>
                <CardDescription>Manually add funds to a user's wallet.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">User Email / ID</label>
                  <Input placeholder="Enter user email..." value={creditForm.userId} onChange={e => setCreditForm(prev => ({ ...prev, userId: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Amount (₦)</label>
                  <Input type="number" placeholder="0.00" value={creditForm.amount} onChange={e => setCreditForm(prev => ({ ...prev, amount: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Reason</label>
                  <Input placeholder="Bonus / Refund / Correction" value={creditForm.reason} onChange={e => setCreditForm(prev => ({ ...prev, reason: e.target.value }))} />
                </div>
                <Button 
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                  disabled={processing === 'credit'}
                  onClick={async () => {
                    if (!creditForm.userId || !creditForm.amount) {
                      toast({ title: 'Missing fields', description: 'Provide user and amount', variant: 'destructive' });
                      return;
                    }
                    setProcessing('credit');
                    try {
                      const amt = Number(creditForm.amount);
                      const res = await creditWallet({ userId: creditForm.userId, amount: amt, walletType: "main", description: creditForm.reason || "Manual Credit" });
                      if (res && res.success) {
                        toast({ title: 'Wallet Credited', description: `New balance: ₦${Number(res.newBalance || 0).toLocaleString()}` });
                        setCreditForm({ userId: '', amount: '', reason: '' });
                      } else {
                        toast({ title: 'Credit Failed', description: res?.error || 'Unable to credit', variant: 'destructive' });
                      }
                    } catch (e: any) {
                      toast({ title: 'Credit Failed', description: e.message || 'Unexpected error', variant: 'destructive' });
                    } finally {
                      setProcessing(null);
                    }
                  }}
                >
                  Credit Wallet
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Debit User Wallet</CardTitle>
                <CardDescription>Manually remove funds from a user's wallet.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">User Email / ID</label>
                  <Input placeholder="Enter user email..." value={debitForm.userId} onChange={e => setDebitForm(prev => ({ ...prev, userId: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Amount (₦)</label>
                  <Input type="number" placeholder="0.00" value={debitForm.amount} onChange={e => setDebitForm(prev => ({ ...prev, amount: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Reason</label>
                  <Input placeholder="Correction / Penalty" value={debitForm.reason} onChange={e => setDebitForm(prev => ({ ...prev, reason: e.target.value }))} />
                </div>
                <Button 
                  variant="destructive" 
                  className="w-full" 
                  disabled={processing === 'debit'} 
                  onClick={async () => {
                    if (!debitForm.userId || !debitForm.amount) {
                      toast({ title: 'Missing fields', description: 'Provide user and amount', variant: 'destructive' });
                      return;
                    }
                    setProcessing('debit');
                    try {
                      const amt = Number(debitForm.amount);
                      const res = await debitWallet({ userId: debitForm.userId, amount: amt, walletType: "main", description: debitForm.reason || "Manual Debit" });
                      if (res && res.success) {
                        toast({ title: 'Wallet Debited', description: `New balance: ₦${Number(res.newBalance || 0).toLocaleString()}` });
                        setDebitForm({ userId: '', amount: '', reason: '' });
                      } else {
                        toast({ title: 'Debit Failed', description: res?.error || 'Unable to debit', variant: 'destructive' });
                      }
                    } catch (e: any) {
                      toast({ title: 'Debit Failed', description: e.message || 'Unexpected error', variant: 'destructive' });
                    } finally {
                      setProcessing(null);
                    }
                  }}
                >
                  Debit Wallet
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="logs">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle>Wallet Logs</CardTitle>
              <CardDescription>Recent wallet credits and debits.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell className="font-mono text-xs">{l.id}</TableCell>
                      <TableCell>{l.user}</TableCell>
                      <TableCell>
                        <Badge variant={l.type === 'credit' ? 'default' : 'secondary'} className={l.type === 'credit' ? 'bg-emerald-500' : ''}>
                          {l.type}
                        </Badge>
                      </TableCell>
                      <TableCell>₦{Number(l.amount || 0).toLocaleString()}</TableCell>
                      <TableCell>{new Date(l.createdAt ? (l.createdAt._seconds ? l.createdAt._seconds * 1000 : l.createdAt) : Date.now()).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
