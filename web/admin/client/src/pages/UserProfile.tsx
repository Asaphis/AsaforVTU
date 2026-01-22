import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useRoute, Link } from "wouter";
import { listUsers, getUserTransactions, getFinanceUser } from "@/lib/backend";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

export default function UserProfilePage() {
  const [, params] = useRoute("/users/:uid");
  const uidParam = (params as any)?.uid || "";
  const { toast } = useToast();
  const [user, setUser] = useState<any | null>(null);
  const [txs, setTxs] = useState<any[]>([]);
  const [finance, setFinance] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const users = await listUsers(500);
        const found = users.find((u: any) => String(u.uid || u.id || "").toLowerCase() === uidParam.toLowerCase());
        if (!mounted) return;
        setUser(found || null);
        const res = await getUserTransactions({ uid: uidParam, email: String(found?.email || "") });
        setTxs(res || []);
        const fin = await getFinanceUser({ uid: uidParam, email: String(found?.email || "") });
        setFinance(fin || null);
      } catch (e: any) {
        toast({ title: "Failed to load user", description: e.message || "Unable to fetch", variant: "destructive" });
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [uidParam]);

  if (loading && !user) {
    return <div className="p-6 text-sm text-muted-foreground">Loading user...</div>;
  }

  if (!user) {
    return <div className="p-6 text-sm text-muted-foreground">User not found</div>;
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div>
          <h2 className="text-4xl font-black text-white tracking-tighter mb-2 italic">Node Intelligence</h2>
          <p className="text-slate-400 font-medium">Deep-trace analysis of ecosystem member activity and nodal status.</p>
        </div>
        <div className="flex gap-4">
          <Link href={`/wallet?userId=${encodeURIComponent(user.email || user.uid || user.id || "")}`}>
            <Button className="bg-primary hover:bg-primary/90 text-white font-black rounded-2xl px-8 h-12 shadow-2xl shadow-primary/30 uppercase tracking-widest text-[10px] border-0 italic transition-all hover:scale-105 active:scale-95">
              Inject Capital
            </Button>
          </Link>
          <Link href={`/transactions?uid=${encodeURIComponent(user.uid || user.id || "")}&email=${encodeURIComponent(user.email || "")}`}>
            <Button variant="outline" className="border-white/10 bg-white/5 text-white hover:bg-white/10 font-black rounded-2xl h-12 px-8 shadow-xl transition-all hover:scale-105 active:scale-95 uppercase tracking-widest text-[10px] italic">
              Audit Traces
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        <Card className="border-0 shadow-2xl bg-white/5 backdrop-blur-xl rounded-[2.5rem] ring-1 ring-white/10 overflow-hidden md:col-span-1">
          <CardHeader className="p-10 pb-6 bg-white/[0.02]">
            <CardTitle className="text-2xl font-black text-white tracking-tight italic">{user.displayName || user.email || user.uid}</CardTitle>
            <CardDescription className="text-primary font-black uppercase tracking-widest text-[10px] mt-2 italic opacity-80">{user.email}</CardDescription>
          </CardHeader>
          <CardContent className="p-10 pt-2 space-y-4">
            <div className="flex justify-between items-center py-4 border-b border-white/5">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Global UID</span>
              <span className="font-mono text-[10px] text-slate-400 opacity-60 italic">{user.uid || user.id}</span>
            </div>
            <div className="flex justify-between items-center py-4 border-b border-white/5">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Comm Link</span>
              <span className="text-sm font-bold text-white italic">{user.phone || "NODE_SILENT"}</span>
            </div>
            <div className="flex justify-between items-center py-4 border-b border-white/5">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Initialization</span>
              <span className="text-sm font-bold text-white italic">{user.joinedAt ? new Date(user.joinedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : "—"}</span>
            </div>
            <div className="flex justify-between items-center py-4">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Operational</span>
              <Badge className={cn(
                "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border-0",
                user.status === 'inactive' ? 'bg-red-500/10 text-red-400 ring-1 ring-red-500/20' : 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20'
              )}>
                {user.status === 'inactive' ? 'Terminated' : 'Active'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-2xl bg-white/5 backdrop-blur-xl rounded-[2.5rem] ring-1 ring-white/10 overflow-hidden md:col-span-2">
          <CardHeader className="p-10 pb-6 bg-white/[0.02]">
            <CardTitle className="text-2xl font-black text-white tracking-tight italic">Liquidity Matrix</CardTitle>
            <CardDescription className="text-slate-500 uppercase tracking-widest text-[10px] font-black mt-2">Real-time nodal balance propagation</CardDescription>
          </CardHeader>
          <CardContent className="p-10 grid gap-8 md:grid-cols-3">
            <div className="bg-white/5 p-6 rounded-[2rem] border border-white/5 shadow-inner group hover:bg-white/[0.08] transition-all">
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 group-hover:text-primary transition-colors">Core Wallet</div>
              <div className="text-3xl font-black text-white tracking-tighter italic">₦{Number(finance?.walletBalance || 0).toLocaleString()}</div>
            </div>
            <div className="bg-white/5 p-6 rounded-[2rem] border border-white/5 shadow-inner group hover:bg-white/[0.08] transition-all">
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 group-hover:text-primary transition-colors">Yield Node</div>
              <div className="text-3xl font-black text-white tracking-tighter italic">₦{Number(user.cashbackBalance || 0).toLocaleString()}</div>
            </div>
            <div className="bg-white/5 p-6 rounded-[2rem] border border-white/5 shadow-inner group hover:bg-white/[0.08] transition-all">
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 group-hover:text-primary transition-colors">Affiliate Link</div>
              <div className="text-3xl font-black text-white tracking-tighter italic">₦{Number(user.referralBalance || 0).toLocaleString()}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-10 md:grid-cols-3">
        <Card className="border-0 shadow-2xl bg-white/5 backdrop-blur-xl rounded-[2.5rem] ring-1 ring-white/10 overflow-hidden md:col-span-1">
          <CardHeader className="p-10 pb-6 bg-white/[0.02]">
            <CardTitle className="text-2xl font-black text-white tracking-tight italic">Magnitude Totals</CardTitle>
            <CardDescription className="text-slate-500 uppercase tracking-widest text-[10px] font-black mt-2">Historical node activity magnitude</CardDescription>
          </CardHeader>
          <CardContent className="p-10 grid gap-6 md:grid-cols-2">
            <div className="space-y-1">
              <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic">Gross Injection</div>
              <div className="text-xl font-black text-white tracking-tight">₦{Number(finance?.totalDeposited || 0).toLocaleString()}</div>
            </div>
            <div className="space-y-1">
              <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic">Mag Flow Out</div>
              <div className="text-xl font-black text-white tracking-tight">₦{Number(finance?.totalSpent || 0).toLocaleString()}</div>
            </div>
            <div className="space-y-1">
              <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic">Channel Fee</div>
              <div className="text-xl font-black text-red-400/60 tracking-tight">₦{Number(finance?.totalProviderCost || 0).toLocaleString()}</div>
            </div>
            <div className="space-y-1">
              <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic">Signal Cost</div>
              <div className="text-xl font-black text-red-400/60 tracking-tight">₦{Number(finance?.totalSmsCost || 0).toLocaleString()}</div>
            </div>
            <div className="md:col-span-2 pt-4 border-t border-white/5 space-y-1">
              <div className="text-[10px] font-black text-primary uppercase tracking-[0.2em] italic">Net Profit Yield</div>
              <div className="text-4xl font-black text-white tracking-tighter drop-shadow-[0_0_15px_rgba(var(--primary),0.3)]">₦{Number(finance?.netProfit || 0).toLocaleString()}</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-2xl bg-white/5 backdrop-blur-xl rounded-[2.5rem] ring-1 ring-white/10 overflow-hidden md:col-span-2">
          <CardHeader className="p-10 pb-6 bg-white/[0.02]">
            <CardTitle className="text-2xl font-black text-white tracking-tight italic text-primary">Risk Intelligence</CardTitle>
            <CardDescription className="text-slate-500 uppercase tracking-widest text-[10px] font-black mt-2">Projected nodal thresholds and profit probability</CardDescription>
          </CardHeader>
          <CardContent className="p-10 grid gap-8 md:grid-cols-3">
            <div className="space-y-3">
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">Cap Threshold</div>
              <div className="text-2xl font-black text-white tracking-tight">₦{Number(finance?.risk?.providerBalanceRequired || 0).toLocaleString()}</div>
              <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">Required Provider Bal</p>
            </div>
            <div className="space-y-3">
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">Signal Delta</div>
              <div className="text-2xl font-black text-white tracking-tight">₦{Number(finance?.risk?.smsCost || 0).toLocaleString()}</div>
              <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">Estimated Signal Overhead</p>
            </div>
            <div className="space-y-3">
              <div className="text-[10px] font-black text-primary uppercase tracking-[0.2em] italic">Expected Yield</div>
              <div className="text-3xl font-black text-white tracking-tighter italic">₦{Number(finance?.risk?.expectedProfit || 0).toLocaleString()}</div>
              <p className="text-[9px] text-primary/60 font-bold uppercase tracking-widest">Projected Net Gains</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-2xl bg-white/5 backdrop-blur-xl rounded-[2.5rem] ring-1 ring-white/10 overflow-hidden">
        <CardHeader className="p-10 bg-white/[0.02]">
          <CardTitle className="text-2xl font-black text-white tracking-tight italic">Nodal Activity Feed</CardTitle>
          <CardDescription className="text-slate-500 uppercase tracking-widest text-[10px] font-black mt-2">Recent secure transmissions for this user node</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-white/[0.01]">
              <TableRow className="border-white/5">
                <TableHead className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Trace ID</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Node Type</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Magnitude</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Status</TableHead>
                <TableHead className="px-10 text-right text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Transmission</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {txs.length === 0 ? (
                <TableRow className="border-0">
                  <TableCell colSpan={5} className="text-center py-20 text-slate-600 font-black uppercase tracking-widest text-[10px]">Neural link empty</TableCell>
                </TableRow>
              ) : txs.map((t) => (
                <TableRow key={t.id} className="border-white/5 hover:bg-white/[0.03] transition-colors group">
                  <TableCell className="px-10 py-6 font-mono text-[10px] text-slate-500 italic">{t.id.slice(0,16)}...</TableCell>
                  <TableCell className="text-sm font-black text-white group-hover:text-primary transition-colors tracking-tight italic">{t.type}</TableCell>
                  <TableCell className="text-lg font-black text-white tracking-tighter">₦{Number(t.amount || 0).toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant={t.status === 'success' ? 'default' : t.status === 'pending' ? 'secondary' : 'destructive'} 
                           className={cn(
                             "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border-0",
                             t.status === 'success' ? 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20' : 
                             t.status === 'pending' ? 'bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20' : 
                             'bg-red-500/10 text-red-400 ring-1 ring-red-500/20'
                           )}>
                      {t.status || '—'}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-10 text-right text-[10px] text-slate-500 font-bold italic opacity-60">
                    {t.createdAt ? new Date(t.createdAt._seconds ? t.createdAt._seconds * 1000 : t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
    </div>
  );
}
