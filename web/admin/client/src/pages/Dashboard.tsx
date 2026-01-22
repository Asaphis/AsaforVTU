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
    <div className="space-y-8 pb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Dashboard Overview
          </h1>
          <p className="text-slate-500 font-medium">Monitoring platform health and performance.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-xl border border-slate-200">
            <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">System Online</span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, i) => (
          <Card key={i} className="border border-slate-200 shadow-sm bg-white hover:shadow-md transition-all duration-200 rounded-2xl overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-6">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {card.title}
              </CardTitle>
              <div className={cn("p-2 rounded-lg bg-slate-50")}>
                <card.icon className={cn("h-5 w-5", card.color)} />
              </div>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="text-2xl font-bold text-slate-900">
                {isLoading ? <Skeleton className="h-8 w-24 bg-slate-100" /> : card.value}
              </div>
              <div className="flex items-center mt-2">
                <span className={cn(
                  "flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full",
                  card.trendUp ? "text-emerald-600 bg-emerald-50" : "text-red-600 bg-red-50"
                )}>
                  {card.trendUp ? <ArrowUpRight size={10} className="mr-1" /> : <ArrowDownRight size={10} className="mr-1" />}
                  {card.trend}
                </span>
                <span className="text-[10px] text-slate-400 ml-2">from last week</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        <Card className="lg:col-span-4 border border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden">
          <CardHeader className="p-6 pb-2">
            <CardTitle className="text-xl font-bold text-slate-900">Revenue Analysis</CardTitle>
            <p className="text-sm text-slate-500 font-medium">Platform earnings over time</p>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[320px] w-full">
              {isLoading ? (
                <Skeleton className="h-full w-full rounded-xl bg-slate-50" />
              ) : chartData.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
                  <Activity size={40} className="opacity-20" />
                  <p className="text-xs font-bold uppercase tracking-widest opacity-40">No data available</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
                      tickFormatter={(value: number) => `₦${(value/1000).toFixed(0)}k`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff',
                        borderRadius: '12px', 
                        border: '1px solid #e2e8f0', 
                        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', 
                        padding: '12px',
                        fontSize: '12px'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="total" 
                      stroke="#3b82f6" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorTotal)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 border border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden">
          <CardHeader className="p-6 pb-2">
            <CardTitle className="text-xl font-bold text-slate-900">Recent Transactions</CardTitle>
            <p className="text-sm text-slate-500 font-medium">Latest platform activity</p>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              {isLoading ? (
                Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-xl bg-slate-50" />)
              ) : recent.length > 0 ? (
                recent.map((tx: any, i: number) => (
                  <div key={i} className="flex items-center justify-between border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center bg-slate-50",
                        tx.status === 'success' ? 'text-emerald-500' : 'text-orange-500'
                      )}>
                        <Activity size={18} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900 truncate max-w-[120px]">
                          {tx.user || tx.user_email || "User"}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mt-0.5">
                          {tx.type} • {new Date(tx.createdAt?._seconds ? tx.createdAt._seconds * 1000 : tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <span className="text-sm font-bold text-slate-900">₦{tx.amount?.toLocaleString()}</span>
                      <span className={cn(
                        "text-[9px] font-bold uppercase tracking-wider mt-1 px-2 py-0.5 rounded-md",
                        tx.status === 'success' ? 'text-emerald-600 bg-emerald-50' : 'text-orange-600 bg-orange-50'
                      )}>
                        {tx.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center">
                  <Activity size={32} className="mx-auto text-slate-200 mb-4" />
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">No recent activity</p>
                </div>
              )}
            </div>
            <button className="w-full mt-8 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 transition-all">
              View All Transactions
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
