import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useRoute, Link } from "wouter";
import { cn } from "@/lib/utils";
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
    <div className="space-y-8 animate-in fade-in duration-500 text-slate-900">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">User Profile</h2>
          <p className="text-slate-500 font-medium">Overview of account status and activity.</p>
        </div>
        <div className="flex gap-3">
          <Link href={`/wallet?userId=${encodeURIComponent(user.email || user.uid || user.id || "")}`}>
            <Button className="bg-primary hover:bg-primary/90 text-white font-bold rounded-xl px-6 h-11 shadow-md transition-all">
              Fund Wallet
            </Button>
          </Link>
          <Link href={`/transactions?uid=${encodeURIComponent(user.uid || user.id || "")}&email=${encodeURIComponent(user.email || "")}`}>
            <Button variant="outline" className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50 rounded-xl h-11 px-6 shadow-sm transition-all">
              View Transactions
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden md:col-span-1">
          <CardHeader className="p-6 pb-2 border-b border-slate-50">
            <CardTitle className="text-xl font-bold text-slate-900">{user.displayName || "User Profile"}</CardTitle>
            <CardDescription className="text-primary font-bold text-xs uppercase tracking-wider">{user.email}</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="flex justify-between items-center py-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">User ID</span>
              <span className="font-mono text-xs text-slate-600">#{user.uid?.slice(0, 12)}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Phone</span>
              <span className="text-sm font-bold text-slate-700">{user.phone || "Not Set"}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Joined</span>
              <span className="text-sm font-bold text-slate-700">{user.joinedAt ? new Date(user.joinedAt).toLocaleDateString() : "—"}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status</span>
              <Badge className={cn(
                "px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border",
                user.status === 'inactive' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
              )}>
                {user.status === 'inactive' ? 'Inactive' : 'Active'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden md:col-span-2">
          <CardHeader className="p-6 pb-2 border-b border-slate-50">
            <CardTitle className="text-xl font-bold text-slate-900">Financial Summary</CardTitle>
          </CardHeader>
          <CardContent className="p-6 grid gap-6 md:grid-cols-3">
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 shadow-inner">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Wallet Balance</div>
              <div className="text-2xl font-bold text-slate-900">₦{Number(finance?.walletBalance || 0).toLocaleString()}</div>
            </div>
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 shadow-inner">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Cashback</div>
              <div className="text-2xl font-bold text-slate-900">₦{Number(user.cashbackBalance || 0).toLocaleString()}</div>
            </div>
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 shadow-inner">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Referrals</div>
              <div className="text-2xl font-bold text-slate-900">₦{Number(user.referralBalance || 0).toLocaleString()}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden md:col-span-1">
          <CardHeader className="p-6 pb-2 border-b border-slate-50">
            <CardTitle className="text-lg font-bold text-slate-900">Lifetime Stats</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="flex justify-between items-center py-1">
              <span className="text-xs font-bold text-slate-400">Total Deposited</span>
              <span className="text-sm font-bold text-slate-900">₦{Number(finance?.totalDeposited || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-xs font-bold text-slate-400">Total Spent</span>
              <span className="text-sm font-bold text-slate-900">₦{Number(finance?.totalSpent || 0).toLocaleString()}</span>
            </div>
            <div className="pt-4 border-t border-slate-100">
              <div className="text-[10px] font-bold text-primary uppercase tracking-wider mb-1">Generated Profit</div>
              <div className="text-3xl font-bold text-slate-900">₦{Number(finance?.netProfit || 0).toLocaleString()}</div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden md:col-span-2">
          <CardHeader className="p-6 bg-slate-50/50 border-b border-slate-100">
            <CardTitle className="text-lg font-bold text-slate-900">Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="border-slate-100">
                  <TableHead className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Service</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-500">Amount</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-500">Status</TableHead>
                  <TableHead className="px-6 text-right text-xs font-bold uppercase tracking-wider text-slate-500">Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {txs.length === 0 ? (
                  <TableRow className="border-0">
                    <TableCell colSpan={4} className="text-center py-12 text-slate-400 font-bold uppercase tracking-widest text-[10px]">No activity found</TableCell>
                  </TableRow>
                ) : txs.slice(0, 5).map((t) => (
                  <TableRow key={t.id} className="border-slate-50 hover:bg-slate-50/50 transition-colors group">
                    <TableCell className="px-6 py-4 text-sm font-bold text-slate-900 capitalize">{t.type}</TableCell>
                    <TableCell className="text-sm font-bold text-slate-900">₦{Number(t.amount || 0).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge className={cn(
                        "px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border",
                        t.status === 'success' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-orange-50 text-orange-600 border-orange-100'
                      )}>
                        {t.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-6 text-right text-xs text-slate-500 font-medium">
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
