import { useQuery } from "@tanstack/react-query";
import { getFinanceAnalytics, listUsers, getAllPlans } from "@/lib/backend";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export default function FinancePage() {
  const [users, setUsers] = useState<any[]>([]);
  const [selectedScope, setSelectedScope] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const toRange = () => {
    const start = startDate ? new Date(startDate + "T00:00:00").getTime() : undefined;
    const end = endDate ? new Date(endDate + "T23:59:59").getTime() : undefined;
    return { start, end };
  };
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const rows = await listUsers(500);
        if (mounted) setUsers(rows || []);
      } catch {}
    })();
    return () => { mounted = false; };
  }, []);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["finance-analytics", selectedScope, startDate, endDate],
    queryFn: async () => {
      const { start, end } = toRange();
      const [uid, email] = selectedScope ? selectedScope.split("|") : ["", ""];
      return await getFinanceAnalytics({ uid: uid || undefined, email: email || undefined, start, end });
    },
    staleTime: 10000,
  });
  const daily = data?.daily || { deposits: 0, providerCost: 0, smsCost: 0, netProfit: 0 };
  const weekly = data?.weekly || { deposits: 0, providerCost: 0, smsCost: 0, netProfit: 0 };
  const monthly = data?.monthly || { deposits: 0, providerCost: 0, smsCost: 0, netProfit: 0 };
  const requiredProviderBalance = Number(data?.providerBalanceRequired || 0);
  const walletBalance = Number(data?.walletBalance || 0);
  const totals = data?.totals || { depositsTotal: 0, providerCostTotal: 0, smsCostTotal: 0, netProfitTotal: 0 };
  const txs = (data?.transactions || []).slice(0, 100);

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div className="flex items-center gap-5">
          <div className="p-4 rounded-[1.5rem] bg-gradient-to-br from-primary/20 to-indigo-500/10 ring-1 ring-white/10 shadow-2xl">
            <TrendingUp className="h-8 w-8 text-primary shadow-[0_0_15px_rgba(var(--primary),0.5)]" />
          </div>
          <div>
            <h2 className="text-4xl font-black text-white tracking-tighter mb-1">Fiscal Intelligence</h2>
            <p className="text-slate-400 font-medium">Real-time revenue, cost, and profitability analysis.</p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-4 bg-white/5 backdrop-blur-xl p-3 rounded-[2rem] border border-white/10 shadow-3xl">
          <div className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-xl border border-white/5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Scope</label>
            <select
              value={selectedScope}
              onChange={(e) => setSelectedScope(e.target.value)}
              className="bg-transparent text-sm font-bold text-white outline-none cursor-pointer min-w-[140px]"
            >
              <option value="" className="bg-slate-900 text-white">Universal Matrix</option>
              {users.map((u) => (
                <option key={u.uid || u.id} value={`${u.uid || u.id}|${u.email || ""}`} className="bg-slate-900 text-white">
                  {u.displayName || u.email || u.uid}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-xl border border-white/5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Timeline</label>
            <div className="flex items-center gap-2">
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-transparent text-sm font-bold text-white outline-none cursor-pointer [color-scheme:dark]" />
              <span className="text-slate-600 text-[10px] font-black uppercase">to</span>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-transparent text-sm font-bold text-white outline-none cursor-pointer [color-scheme:dark]" />
            </div>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="p-12 text-center bg-white/5 backdrop-blur-xl rounded-[2.5rem] ring-1 ring-white/10">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Processing Analytics Node...</p>
        </div>
      )}

      <div className="grid gap-8 md:grid-cols-3">
        <Card className="border-0 shadow-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent backdrop-blur-xl rounded-[2.5rem] ring-1 ring-white/10 group hover:bg-white/[0.08] transition-all duration-500 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingUp size={120} className="rotate-12 text-primary" />
          </div>
          <CardHeader className="p-10 pb-4 relative z-10">
            <CardTitle className="text-primary text-[11px] font-black uppercase tracking-[0.25em] flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              Obligation Capacity
            </CardTitle>
            <CardDescription className="text-slate-400 font-medium text-xs mt-2">
              Estimated liquidity required in provider channels.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-10 pt-2 relative z-10">
            <div className="text-5xl font-black text-white tracking-tighter mb-4">
              ₦{requiredProviderBalance.toLocaleString()}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[9px] font-black uppercase tracking-[0.15em] px-2.5 py-1 rounded-lg bg-white/5 text-slate-500 border border-white/5">
                Dynamic Delta: High
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-2xl bg-white/5 backdrop-blur-xl rounded-[2.5rem] ring-1 ring-white/10 group hover:bg-white/[0.08] transition-all duration-500 overflow-hidden relative">
          <CardHeader className="p-10 pb-4">
            <CardTitle className="text-indigo-400 text-[11px] font-black uppercase tracking-[0.25em] flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.6)]" />
              Ecosystem Balance
            </CardTitle>
            <CardDescription className="text-slate-400 font-medium text-xs mt-2">
              Aggregate liquidity available across all platform nodes.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-10 pt-2">
            <div className="text-5xl font-black text-white tracking-tighter">
              ₦{(selectedScope ? walletBalance : Number(data?.totalWalletBalance || 0)).toLocaleString()}
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 mt-4 italic opacity-60">
              {selectedScope ? 'Specific Node Liquidity' : 'Global Platform Liquidity'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-2xl bg-white/5 backdrop-blur-xl rounded-[2.5rem] ring-1 ring-white/10 group hover:bg-white/[0.08] transition-all duration-500 overflow-hidden relative border-l-4 border-l-emerald-500/30">
          <CardHeader className="p-10 pb-4">
            <CardTitle className="text-emerald-400 text-[11px] font-black uppercase tracking-[0.25em] flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)]" />
              Net Yield Matrix
            </CardTitle>
            <CardDescription className="text-slate-400 font-medium text-xs mt-2">
              Platform profitability after channel processing fees.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-10 pt-2">
            <div className="space-y-4">
              <div className="flex justify-between items-end border-b border-white/5 pb-4">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Gross Flow</span>
                <span className="text-xl font-black text-white tracking-tight">
                  ₦{Number(totals.netProfitTotal + totals.providerCostTotal + totals.smsCostTotal).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-sm font-bold text-emerald-400 italic">Net Profit Yield</span>
                <span className="text-4xl font-black text-white tracking-tighter drop-shadow-[0_0_15px_rgba(var(--primary),0.3)]">
                  ₦{Number(totals.netProfitTotal || 0).toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-12 lg:grid-cols-1">
        <Card className="border-0 shadow-2xl bg-white/5 backdrop-blur-xl rounded-[2.5rem] ring-1 ring-white/10 overflow-hidden">
          <CardHeader className="p-10 bg-white/[0.02]">
            <CardTitle className="text-2xl font-black text-white tracking-tight italic">Ecosystem Breakdown</CardTitle>
            <CardDescription className="text-slate-500 uppercase tracking-widest text-[10px] font-black mt-2">
              Detailed transaction and performance logs
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-white/[0.01]">
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">ID / Hash</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Initiator</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Service Node</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">User Value</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Channel Fee</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Net Gain</TableHead>
                  <TableHead className="px-10 text-right text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Matrix Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {txs.length === 0 ? (
                  <TableRow className="border-0">
                    <TableCell colSpan={7} className="text-center py-24">
                      <TrendingUp size={48} className="mx-auto text-white/5 mb-4" />
                      <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">Neural logs empty</p>
                    </TableCell>
                  </TableRow>
                ) : txs.map((t) => {
                  const isService = t.isService || ['airtime', 'data', 'electricity', 'exam', 'cable', 'bill'].includes(String(t.serviceType || t.type || '').toLowerCase());
                  const net = isService ? (Number(t.userPrice || 0) - Number(t.providerCost || 0) - Number(t.smsCost || 0)) : 0;
                  return (
                    <TableRow key={t.id} className="border-white/5 hover:bg-white/[0.03] transition-colors group">
                      <TableCell className="px-10 py-6 font-mono text-[10px] text-slate-500 tracking-tighter italic">
                        {t.id.slice(0, 12)}...
                      </TableCell>
                      <TableCell className="text-sm font-black text-white group-hover:text-primary transition-colors">
                        {t.user || 'Platform'}
                      </TableCell>
                      <TableCell className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        {t.serviceType || t.type}
                      </TableCell>
                      <TableCell className="text-white font-black tracking-tight">
                        ₦{Number(t.userPrice || 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-red-400/60 font-medium text-xs italic">
                        -₦{Number(t.providerCost || 0).toLocaleString()}
                      </TableCell>
                      <TableCell className={cn("font-black tracking-tight text-lg italic", net > 0 ? "text-emerald-400" : "text-slate-600")}>
                        ₦{net.toLocaleString()}
                      </TableCell>
                      <TableCell className="px-10 text-right">
                        <Badge className={cn(
                          "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border-0",
                          String(t.status).toLowerCase() === 'success' ? 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20' : 'bg-orange-500/10 text-orange-400 ring-1 ring-orange-500/20'
                        )}>
                          {t.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-6">
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle>Service Performance (Historical)</CardTitle>
            <CardDescription>Historical performance based only on service transactions (Deposits excluded from profit).</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  <TableHead>Deposits</TableHead>
                  <TableHead>Provider Cost</TableHead>
                  <TableHead>SMS Cost</TableHead>
                  <TableHead>Net Profit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Daily</TableCell>
                  <TableCell>₦{Number(daily.deposits || 0).toLocaleString()}</TableCell>
                  <TableCell>₦{Number(daily.providerCost || 0).toLocaleString()}</TableCell>
                  <TableCell>₦{Number(daily.smsCost || 0).toLocaleString()}</TableCell>
                  <TableCell>₦{Number(daily.netProfit || 0).toLocaleString()}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Weekly</TableCell>
                  <TableCell>₦{Number(weekly.deposits || 0).toLocaleString()}</TableCell>
                  <TableCell>₦{Number(weekly.providerCost || 0).toLocaleString()}</TableCell>
                  <TableCell>₦{Number(weekly.smsCost || 0).toLocaleString()}</TableCell>
                  <TableCell>₦{Number(weekly.netProfit || 0).toLocaleString()}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Monthly</TableCell>
                  <TableCell>₦{Number(monthly.deposits || 0).toLocaleString()}</TableCell>
                  <TableCell>₦{Number(monthly.providerCost || 0).toLocaleString()}</TableCell>
                  <TableCell>₦{Number(monthly.smsCost || 0).toLocaleString()}</TableCell>
                  <TableCell>₦{Number(monthly.netProfit || 0).toLocaleString()}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-none shadow-sm md:col-span-1">
          <CardHeader>
            <CardTitle>Totals (Filtered Range)</CardTitle>
            <CardDescription>Combined across selected date range</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Deposits</span>
              <span className="font-bold">₦{Number(totals.depositsTotal || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Provider Cost</span>
              <span className="font-bold">₦{Number(totals.providerCostTotal || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">SMS Cost</span>
              <span className="font-bold">₦{Number(totals.smsCostTotal || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Net Profit</span>
              <span className="font-bold">₦{Number(totals.netProfitTotal || 0).toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle>Transaction Breakdown</CardTitle>
          <CardDescription>Recent transactions in selected scope</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>User Price</TableHead>
              <TableHead>Provider Cost</TableHead>
              <TableHead>SMS Cost</TableHead>
              <TableHead>Net</TableHead>
              <TableHead>Error Source</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {txs.length === 0 ? (
              <TableRow>
                  <TableCell colSpan={10} className="text-center text-muted-foreground">No transactions</TableCell>
                </TableRow>
              ) : txs.map((t) => {
                const isService = t.isService || ['airtime', 'data', 'electricity', 'exam', 'cable', 'bill'].includes(String(t.serviceType || t.type || '').toLowerCase());
                const net = isService ? (Number(t.userPrice || 0) - Number(t.providerCost || 0) - Number(t.smsCost || 0)) : 0;
                const created = t.createdAt ? new Date(t.createdAt).toLocaleString() : "-";
                return (
                  <TableRow key={t.id}>
                    <TableCell className="font-mono text-xs">{t.id}</TableCell>
                    <TableCell>{t.user}</TableCell>
                    <TableCell>{t.serviceType || t.type}</TableCell>
                    <TableCell>₦{Number(t.userPrice || 0).toLocaleString()}</TableCell>
                    <TableCell>₦{Number(t.providerCost || 0).toLocaleString()}</TableCell>
                    <TableCell>₦{Number(t.smsCost || 0).toLocaleString()}</TableCell>
                    <TableCell className={net > 0 ? "text-green-600 font-bold" : ""}>₦{net.toLocaleString()}</TableCell>
                    <TableCell>{String(t.status || '').toLowerCase() === 'success' ? '-' : (t.failureSource || 'unknown')}</TableCell>
                    <TableCell>{t.status}</TableCell>
                    <TableCell>{created}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selectedScope && (
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle>Capacity by Service</CardTitle>
            <CardDescription>Estimated transactions based on user balance</CardDescription>
          </CardHeader>
          <CardContent>
            <CapacityTable walletBalance={walletBalance} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function CapacityTable({ walletBalance }: { walletBalance: number }) {
  const { data: plans } = useQuery({
    queryKey: ["service-plans"],
    queryFn: () => getAllPlans(),
    staleTime: 60000,
  });
  const rows = (plans || []).map((p: any) => {
    const price = Number(p.priceApi || p.priceUser || 0);
    const capacity = price > 0 ? Math.floor(Number(walletBalance || 0) / price) : 0;
    return { name: `${p.network || ""} ${p.name || ""}`.trim(), price, capacity };
  }).filter((r: any) => r.price > 0);
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Service</TableHead>
          <TableHead>Price</TableHead>
          <TableHead>Capacity</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow>
            <TableCell colSpan={3} className="text-center text-muted-foreground">No service plans</TableCell>
          </TableRow>
        ) : rows.map((r: any, i: number) => (
          <TableRow key={i}>
            <TableCell>{r.name}</TableCell>
            <TableCell>₦{r.price.toLocaleString()}</TableCell>
            <TableCell>{r.capacity.toLocaleString()}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
