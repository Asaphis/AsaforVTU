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
import { creditWallet, debitWallet, getWalletLogs, getWalletRequests, approveWalletRequest, rejectWalletRequest, fixGhostWallets } from "@/lib/backend";
import { cn } from "@/lib/utils";

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
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Wallet Funding</h2>
          <p className="text-slate-500 font-medium">Manage funding requests and manual liquidity adjustments.</p>
        </div>
        <Button variant="outline" onClick={load} disabled={loadingRequests} className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50 rounded-xl h-11 px-6">
          <RefreshCw className={`mr-2 h-4 w-4 ${loadingRequests ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border border-slate-200 shadow-sm rounded-2xl bg-white">
          <CardHeader className="p-6 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-primary">Pending Requests</CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <div className="text-3xl font-bold text-slate-900">{deposits.filter(d => d.status === 'pending').length}</div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-2">Liquidity Volume: ₦{deposits.filter(d => d.status === 'pending').reduce((s, d) => s + Number(d.amount || 0), 0).toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden">
          <CardHeader className="p-6 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-700">Processed Today</CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <div className="text-3xl font-bold text-slate-900">{deposits.filter(d => {
              const dd = new Date(d.createdAt ? (d.createdAt._seconds ? d.createdAt._seconds * 1000 : d.createdAt) : Date.now());
              const now = new Date();
              return d.status === 'success' && dd.getDate() === now.getDate() && dd.getMonth() === now.getMonth() && dd.getFullYear() === now.getFullYear();
            }).length}</div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-2">Total Value: ₦{deposits.filter(d => {
              const dd = new Date(d.createdAt ? (d.createdAt._seconds ? d.createdAt._seconds * 1000 : d.createdAt) : Date.now());
              const now = new Date();
              return d.status === 'success' && dd.getDate() === now.getDate() && dd.getMonth() === now.getMonth() && dd.getFullYear() === now.getFullYear();
            }).reduce((s, d) => s + Number(d.amount || 0), 0).toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden">
          <CardHeader className="p-6 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-700">Global Monthly Flow</CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <div className="text-3xl font-bold text-slate-900">₦{deposits.filter(d => {
              const dd = new Date(d.createdAt ? (d.createdAt._seconds ? d.createdAt._seconds * 1000 : d.createdAt) : Date.now());
              const now = new Date();
              return d.status === 'success' && dd.getMonth() === now.getMonth() && dd.getFullYear() === now.getFullYear();
            }).reduce((s, d) => s + Number(d.amount || 0), 0).toLocaleString()}</div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-2">Performance Delta</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="requests" className="space-y-6">
        <TabsList className="bg-white border border-slate-200 p-2 rounded-xl">
          <TabsTrigger value="requests" className="rounded-lg px-6 h-10 text-[10px] font-bold uppercase tracking-wider data-[state=active]:bg-primary data-[state=active]:text-white">Requests</TabsTrigger>
          <TabsTrigger value="adjust" className="rounded-lg px-6 h-10 text-[10px] font-bold uppercase tracking-wider data-[state=active]:bg-primary data-[state=active]:text-white">Adjust</TabsTrigger>
          <TabsTrigger value="logs" className="rounded-lg px-6 h-10 text-[10px] font-bold uppercase tracking-wider data-[state=active]:bg-primary data-[state=active]:text-white">Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="requests">
          <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden">
            <CardHeader className="p-6">
              <CardTitle className="text-lg font-bold text-slate-900">Funding Requests</CardTitle>
              <CardDescription className="text-slate-500 font-medium">Authorization required for user liquidity</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow className="border-slate-100">
                    <TableHead className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Request ID</TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-500">User</TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-500">Amount</TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-500">Method</TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-500">Status</TableHead>
                    <TableHead className="px-6 text-right text-xs font-bold uppercase tracking-wider text-slate-500">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deposits.length === 0 ? (
                    <TableRow className="border-0">
                      <TableCell colSpan={6} className="text-center py-12 text-slate-500 text-sm">No pending requests</TableCell>
                    </TableRow>
                  ) : (
                    deposits.map((d) => (
                      <TableRow key={d.id} className="border-slate-50 hover:bg-slate-50/50 transition-colors">
                        <TableCell className="px-6 py-4 font-mono text-xs text-slate-500">{d.id.slice(0,12)}</TableCell>
                        <TableCell className="text-sm font-bold text-slate-900">{d.userEmail || d.user || "System"}</TableCell>
                        <TableCell className="text-sm font-bold text-slate-900">₦{Number(d.amount || 0).toLocaleString()}</TableCell>
                        <TableCell className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{d.method || "manual"}</TableCell>
                        <TableCell>
                          <Badge className={cn(
                            "px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border",
                            d.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                            d.status === 'pending' ? 'bg-orange-50 text-orange-600 border-orange-100' : 
                            'bg-red-50 text-red-600 border-red-100'
                          )}>
                            {d.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-6 text-right space-x-2">
                          {d.status === 'pending' && (
                            <>
                              <Button variant="ghost" className="h-9 w-9 rounded-lg text-emerald-600 hover:bg-emerald-50" onClick={() => handleApprove(d.id)}>
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" className="h-9 w-9 rounded-lg text-red-600 hover:bg-red-50" onClick={() => handleReject(d.id)}>
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

            <Card className="border-amber-200 bg-amber-50">
              <CardHeader>
                <CardTitle className="text-amber-800">Troubleshooting</CardTitle>
                <CardDescription className="text-amber-700">Fix common wallet issues.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="outline" 
                  className="w-full border-amber-300 text-amber-900 hover:bg-amber-100"
                  onClick={async () => {
                     if(!confirm('This will scan for wallets with Email IDs and migrate them to UIDs. Continue?')) return;
                     try {
                        const res = await fixGhostWallets(false);
                        toast({ title: 'Migration Complete', description: `Fixed ${res.count} wallets.` });
                        load();
                     } catch(e: any) {
                        toast({ title: 'Error', description: e.message, variant: 'destructive' });
                     }
                  }}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Fix "Ghost" Wallets
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="logs">
          <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden">
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
                        <Badge className={cn(
                          "px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border",
                          l.type === 'credit' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-600 border-slate-200'
                        )}>
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
