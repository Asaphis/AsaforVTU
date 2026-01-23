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
    <div className="space-y-8 pb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Financial Intelligence</h2>
          <p className="text-slate-500 font-medium">Revenue, cost, and profitability analytics.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-xl border border-slate-200">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Scope</label>
            <select
              value={selectedScope}
              onChange={(e) => setSelectedScope(e.target.value)}
              className="bg-transparent text-sm font-medium text-slate-900 outline-none cursor-pointer min-w-[180px]"
            >
              <option value="">Universal Matrix</option>
              {users.map((u) => (
                <option key={u.uid || u.id} value={`${u.uid || u.id}|${u.email || ""}`}>
                  {u.displayName || u.email || u.uid}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-xl border border-slate-200">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Timeline</label>
            <div className="flex items-center gap-2">
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-transparent text-sm font-medium text-slate-900 outline-none cursor-pointer" />
              <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">to</span>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-transparent text-sm font-medium text-slate-900 outline-none cursor-pointer" />
            </div>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Processing Analytics...</p>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden">
          <CardHeader className="p-6 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">Obligation Capacity</CardTitle>
            <CardDescription className="text-slate-500 text-sm">Estimated liquidity required in provider channels.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-2">
            <div className="text-2xl font-bold text-slate-900">₦{requiredProviderBalance.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden">
          <CardHeader className="p-6 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">Ecosystem Balance</CardTitle>
            <CardDescription className="text-slate-500 text-sm">Aggregate liquidity across platform nodes.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-2">
            <div className="text-2xl font-bold text-slate-900">₦{(selectedScope ? walletBalance : Number(data?.totalWalletBalance || 0)).toLocaleString()}</div>
            <p className="text-[11px] text-slate-500 font-medium mt-2">
              {selectedScope ? "Specific node liquidity" : "Global platform liquidity"}
            </p>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden">
          <CardHeader className="p-6 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">Net Yield</CardTitle>
            <CardDescription className="text-slate-500 text-sm">Profitability after channel fees.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-2">
            <div className="space-y-4">
              <div className="flex justify-between items-end border-b border-slate-100 pb-4">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Gross Flow</span>
                <span className="text-lg font-bold text-slate-900">
                  ₦{Number(totals.netProfitTotal + totals.providerCostTotal + totals.smsCostTotal).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-sm font-bold text-emerald-600">Net Profit Yield</span>
                <span className="text-2xl font-bold text-slate-900">
                  ₦{Number(totals.netProfitTotal || 0).toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-1">
        <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden">
          <CardHeader className="p-6">
            <CardTitle className="text-xl font-bold text-slate-900">Ecosystem Breakdown</CardTitle>
            <CardDescription className="text-slate-500">Detailed transaction and performance logs</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="border-slate-100 hover:bg-transparent">
                  <TableHead className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">ID / Hash</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-500">Initiator</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-500">Service Node</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-500">User Value</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-500">Channel Fee</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-500">Net Gain</TableHead>
                  <TableHead className="px-6 text-right text-xs font-bold uppercase tracking-wider text-slate-500">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {txs.length === 0 ? (
                  <TableRow className="border-0">
                    <TableCell colSpan={7} className="text-center py-16">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No logs</p>
                    </TableCell>
                  </TableRow>
                ) : txs.map((t) => {
                  const isService = t.isService || ['airtime', 'data', 'electricity', 'exam', 'cable', 'bill'].includes(String(t.serviceType || t.type || '').toLowerCase());
                  const net = isService ? (Number(t.userPrice || 0) - Number(t.providerCost || 0) - Number(t.smsCost || 0)) : 0;
                  return (
                    <TableRow key={t.id} className="border-slate-50 hover:bg-slate-50/50 transition-colors group">
                      <TableCell className="px-6 py-4 font-mono text-xs text-slate-500">
                        {t.id.slice(0, 12)}...
                      </TableCell>
                      <TableCell className="text-sm font-bold text-slate-900">
                        {t.user || 'Platform'}
                      </TableCell>
                      <TableCell className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        {t.serviceType || t.type}
                      </TableCell>
                      <TableCell className="text-sm font-bold text-slate-900">
                        ₦{Number(t.userPrice || 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-red-600 text-xs font-medium">
                        -₦{Number(t.providerCost || 0).toLocaleString()}
                      </TableCell>
                      <TableCell className={cn("font-bold text-sm", net > 0 ? "text-emerald-600" : "text-slate-500")}>
                        ₦{net.toLocaleString()}
                      </TableCell>
                      <TableCell className="px-6 text-right">
                        <Badge className={cn(
                          "px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border",
                          String(t.status).toLowerCase() === 'success' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-orange-50 text-orange-600 border-orange-100'
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
