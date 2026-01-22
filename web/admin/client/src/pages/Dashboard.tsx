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
    <div className="space-y-10 pb-12 animate-in fade-in duration-1000">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Dashboard Overview</h1>
          <p className="text-slate-500 mt-2 font-medium">Monitoring platform performance and user activity.</p>
        </div>
        <div className="flex items-center gap-2 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse ml-2" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 pr-2">Live Status: Active</span>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, i) => (
          <Card key={i} className="border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white/80 backdrop-blur-sm hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-500 rounded-[2.5rem] group overflow-hidden relative">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 p-8">
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                {card.title}
              </CardTitle>
              <div className={cn("p-3 rounded-2xl transition-all duration-500 group-hover:scale-110 shadow-sm", card.bg)}>
                <card.icon className={cn("h-5 w-5", card.color)} />
              </div>
            </CardHeader>
            <CardContent className="px-8 pb-8">
              <div className="text-3xl font-black text-slate-900 tracking-tighter">
                {isLoading ? <Skeleton className="h-10 w-28" /> : card.value}
              </div>
              <div className="flex items-center mt-3">
                <span className={cn(
                  "flex items-center text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full",
                  card.trendUp ? "text-emerald-600 bg-emerald-50" : "text-red-600 bg-red-50"
                )}>
                  {card.trendUp ? <ArrowUpRight size={10} className="mr-1" /> : <ArrowDownRight size={10} className="mr-1" />}
                  {card.trend}
                </span>
                <span className="text-[10px] text-slate-400 ml-3 font-bold uppercase tracking-widest">Growth</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-7">
        <Card className="lg:col-span-4 border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white rounded-[2.5rem] overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between p-10 pb-4">
            <div>
              <CardTitle className="text-2xl font-black text-slate-900 tracking-tight">Performance Flow</CardTitle>
              <p className="text-sm text-slate-400 font-medium mt-1">Daily revenue generated over the past 7 days</p>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 text-slate-400">
              <BarChart3 size={20} />
            </div>
          </CardHeader>
          <CardContent className="p-10 pt-4">
            <div className="h-[380px] w-full">
              {isLoading ? (
                <Skeleton className="h-full w-full rounded-3xl" />
              ) : chartData.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
                  <Activity size={48} className="opacity-20" />
                  <p className="text-sm font-bold uppercase tracking-widest">Waiting for data...</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: 800 }}
                      dy={15}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: 800 }}
                      tickFormatter={(value: number) => `₦${value.toLocaleString()}`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        borderRadius: '24px', 
                        border: 'none', 
                        boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)', 
                        fontWeight: 'bold',
                        padding: '16px'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="total" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={5}
                      fillOpacity={1} 
                      fill="url(#colorTotal)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white rounded-[2.5rem] overflow-hidden">
          <CardHeader className="p-10 pb-4">
            <CardTitle className="text-2xl font-black text-slate-900 tracking-tight">Recent Activity</CardTitle>
            <p className="text-sm text-slate-400 font-medium mt-1">Last {recent.length} actions on platform</p>
          </CardHeader>
          <CardContent className="p-10 pt-4">
            <div className="space-y-8">
              {isLoading ? (
                Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)
              ) : recent.length > 0 ? (
                recent.map((tx: any, i: number) => (
                  <div key={i} className="flex items-center justify-between group cursor-pointer">
                    <div className="flex items-center gap-5">
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-sm group-hover:shadow-md",
                        tx.status === 'success' ? 'bg-emerald-50 text-emerald-500' : 'bg-orange-50 text-orange-500'
                      )}>
                        <Activity size={20} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-slate-900 group-hover:text-primary transition-colors truncate max-w-[140px]">
                          {tx.user || tx.user_email || "Platform User"}
                        </span>
                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-[0.15em] mt-1">
                          {tx.type} • {new Date(tx.createdAt?._seconds ? tx.createdAt._seconds * 1000 : tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <span className="text-sm font-black text-slate-900 tracking-tighter">₦${tx.amount?.toLocaleString()}</span>
                      <span className={cn(
                        "text-[9px] font-black uppercase tracking-widest mt-1.5 px-2 py-0.5 rounded-md",
                        tx.status === 'success' ? 'bg-emerald-100/50 text-emerald-600' : 'bg-orange-100/50 text-orange-600'
                      )}>
                        {tx.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-20 text-center">
                  <Activity size={48} className="mx-auto text-slate-100 mb-4" />
                  <p className="text-xs text-slate-400 font-black uppercase tracking-widest">No activity found</p>
                </div>
              )}
            </div>
            <button className="w-full mt-10 py-5 bg-slate-50 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:bg-primary hover:text-white transition-all duration-500 shadow-sm hover:shadow-xl hover:shadow-primary/20">
              View All Platform Logs
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
