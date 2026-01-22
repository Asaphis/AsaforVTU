import { useMemo } from "react";
import { getAdminStats } from "@/lib/backend";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Users, 
  Wallet, 
  Activity, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight,
  ShieldCheck,
  Zap,
  Clock,
  BarChart3
} from "lucide-react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { data: stats, isLoading, isError } = useQuery<any>({
    queryKey: ["admin-stats"],
    queryFn: async () => await getAdminStats(),
    refetchInterval: 10000,
  });

  const chartData = useMemo(() => {
    const days = (stats && stats.dailyTotals) || [];
    return days.map((d: any) => ({ name: d.day, total: d.total }));
  }, [stats]);

  const recent = ((stats && stats.recentTransactions) || []).slice(0, 6);

  if (isError) {
    return (
      <div className="p-8 text-center bg-white rounded-[2.5rem] border border-red-50 shadow-sm">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShieldCheck className="text-red-500" size={32} />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Connection Issues</h2>
        <p className="text-slate-500 mb-6 max-w-md mx-auto">We're having trouble reaching the administration services. Please check your network or server status.</p>
        <button onClick={() => window.location.reload()} className="px-6 py-3 bg-primary text-white rounded-2xl font-bold hover:shadow-lg transition-all">Retry Connection</button>
      </div>
    );
  }

  const cards = [
    {
      title: "Platform Users",
      value: Number((stats && stats.totalUsers) || 0).toLocaleString(),
      icon: Users,
      trend: "+12%",
      trendUp: true,
      color: "text-blue-500",
      bg: "bg-blue-50/50"
    },
    {
      title: "Wallet Balance",
      value: `₦${Number((stats && stats.walletBalance) || 0).toLocaleString()}`,
      icon: Wallet,
      trend: "+5.2%",
      trendUp: true,
      color: "text-emerald-500",
      bg: "bg-emerald-50/50"
    },
    {
      title: "Transactions",
      value: Number((stats && stats.totalTransactions) || 0).toLocaleString(),
      icon: Activity,
      trend: "+18%",
      trendUp: true,
      color: "text-violet-500",
      bg: "bg-violet-50/50"
    },
    {
      title: "Today's Sales",
      value: `₦${Number((stats && stats.todaySales) || 0).toLocaleString()}`,
      icon: Zap,
      trend: "+8%",
      trendUp: true,
      color: "text-orange-500",
      bg: "bg-orange-50/50"
    },
  ];

  return (
    <div className="space-y-12 pb-12 animate-in fade-in duration-1000">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-5xl font-black text-white tracking-tighter mb-2">
            System <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-400">Insights</span>
          </h1>
          <p className="text-slate-400 text-lg font-medium">Real-time platform overview and health metrics.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 bg-white/5 backdrop-blur-xl px-5 py-3 rounded-2xl border border-white/10 shadow-2xl">
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.6)]" />
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-300">Operational</span>
          </div>
          <button className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-2xl font-black text-sm transition-all shadow-xl shadow-primary/20 hover:scale-105 active:scale-95">
            Refresh Data
          </button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, i) => (
          <Card key={i} className="border-0 shadow-2xl bg-white/5 backdrop-blur-xl hover:bg-white/[0.08] transition-all duration-500 rounded-[2.5rem] group overflow-hidden relative ring-1 ring-white/10">
            <div className={cn("absolute top-0 left-0 w-1 h-full opacity-50", card.color.replace('text', 'bg'))} />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-8">
              <CardTitle className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-400">
                {card.title}
              </CardTitle>
              <div className={cn("p-3.5 rounded-2xl transition-all duration-500 group-hover:scale-110 shadow-2xl", card.bg.replace('/50', '/20'), "bg-white/5")}>
                <card.icon className={cn("h-6 w-6", card.color)} />
              </div>
            </CardHeader>
            <CardContent className="px-8 pb-8">
              <div className="text-4xl font-black text-white tracking-tighter">
                {isLoading ? <Skeleton className="h-10 w-28 bg-white/5" /> : card.value}
              </div>
              <div className="flex items-center mt-4">
                <span className={cn(
                  "flex items-center text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl border border-white/5",
                  card.trendUp ? "text-emerald-400 bg-emerald-500/10" : "text-red-400 bg-red-500/10"
                )}>
                  {card.trendUp ? <ArrowUpRight size={12} className="mr-1.5" /> : <ArrowDownRight size={12} className="mr-1.5" />}
                  {card.trend}
                </span>
                <span className="text-[10px] text-slate-500 ml-4 font-black uppercase tracking-widest opacity-60">vs last week</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-7">
        <Card className="lg:col-span-4 border-0 shadow-2xl bg-white/5 backdrop-blur-xl rounded-[2.5rem] overflow-hidden ring-1 ring-white/10">
          <CardHeader className="flex flex-row items-center justify-between p-10 pb-4">
            <div>
              <CardTitle className="text-2xl font-black text-white tracking-tight">Revenue Stream</CardTitle>
              <p className="text-sm text-slate-400 font-medium mt-1">Platform earnings performance</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 text-primary ring-1 ring-white/10">
              <BarChart3 size={24} />
            </div>
          </CardHeader>
          <CardContent className="p-10 pt-4">
            <div className="h-[400px] w-full">
              {isLoading ? (
                <Skeleton className="h-full w-full rounded-3xl bg-white/5" />
              ) : chartData.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4">
                  <Activity size={56} className="opacity-10" />
                  <p className="text-sm font-black uppercase tracking-widest opacity-30">Generating data matrix...</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748B', fontSize: 11, fontWeight: 800 }}
                      dy={15}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748B', fontSize: 11, fontWeight: 800 }}
                      tickFormatter={(value: number) => `₦${(value/1000).toFixed(0)}k`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        backdropFilter: 'blur(16px)',
                        borderRadius: '24px', 
                        border: '1px solid rgba(255,255,255,0.1)', 
                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', 
                        fontWeight: 'black',
                        padding: '20px',
                        color: 'white'
                      }}
                      itemStyle={{ color: 'white' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="total" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={6}
                      fillOpacity={1} 
                      fill="url(#colorTotal)" 
                      animationDuration={2000}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 border-0 shadow-2xl bg-white/5 backdrop-blur-xl rounded-[2.5rem] overflow-hidden ring-1 ring-white/10">
          <CardHeader className="p-10 pb-4">
            <CardTitle className="text-2xl font-black text-white tracking-tight">Recent Activity</CardTitle>
            <p className="text-sm text-slate-400 font-medium mt-1">Real-time transaction feed</p>
          </CardHeader>
          <CardContent className="p-10 pt-4">
            <div className="space-y-8">
              {isLoading ? (
                Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-2xl bg-white/5" />)
              ) : recent.length > 0 ? (
                recent.map((tx: any, i: number) => (
                  <div key={i} className="flex items-center justify-between group cursor-pointer border-b border-white/5 pb-6 last:border-0 last:pb-0">
                    <div className="flex items-center gap-5">
                      <div className={cn(
                        "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-xl group-hover:scale-110 group-hover:rotate-3",
                        tx.status === 'success' ? 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20' : 'bg-orange-500/10 text-orange-400 ring-1 ring-orange-500/20'
                      )}>
                        <Activity size={24} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-base font-black text-white group-hover:text-primary transition-colors truncate max-w-[140px] tracking-tight">
                          {tx.user || tx.user_email || "Platform User"}
                        </span>
                        <span className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mt-1.5 flex items-center gap-2">
                          {tx.type} <span className="h-1 w-1 rounded-full bg-slate-700" /> {new Date(tx.createdAt?._seconds ? tx.createdAt._seconds * 1000 : tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <span className="text-lg font-black text-white tracking-tighter">₦${tx.amount?.toLocaleString()}</span>
                      <span className={cn(
                        "text-[9px] font-black uppercase tracking-[0.25em] mt-2 px-3 py-1 rounded-lg border",
                        tx.status === 'success' ? 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5' : 'border-orange-500/20 text-orange-400 bg-orange-500/5'
                      )}>
                        {tx.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-24 text-center">
                  <Activity size={64} className="mx-auto text-white/5 mb-6" />
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em]">Neural link empty</p>
                </div>
              )}
            </div>
            <button className="w-full mt-12 py-5 bg-white/5 rounded-2xl text-[11px] font-black text-slate-400 uppercase tracking-[0.25em] hover:bg-primary hover:text-white transition-all duration-500 shadow-xl hover:shadow-primary/30 ring-1 ring-white/10 border-0">
              Analyze Full Archive
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
