import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getAllTransactions } from "@/lib/backend";

export default function LogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const tx = await getAllTransactions();
        if (!mounted) return;
        const mapped = (tx || []).map((t: any) => ({
          id: t.id,
          action: t.type || "transaction",
          user: t.user || t.user_email || t.userEmail || t.email || t.userId || "System",
          status: t.status || "success",
          timestamp: t.createdAt || t.created_at || Date.now(),
          ip: "",
          amount: t.amount || 0,
        }));
        setLogs(mapped);
      } catch {
        if (!mounted) return;
        setLogs([]);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-12">
      <div>
        <h2 className="text-4xl font-black text-white tracking-tighter mb-2 italic">System Chronology</h2>
        <p className="text-slate-400 font-medium">Immutable audit trail of ecosystem activity and nodal events.</p>
      </div>

      <Card className="border-0 shadow-2xl bg-white/5 backdrop-blur-xl rounded-[2.5rem] ring-1 ring-white/10 overflow-hidden">
        <CardHeader className="p-10 pb-6 bg-white/[0.02]">
          <CardTitle className="text-2xl font-black text-white tracking-tight italic">Nodal Events</CardTitle>
          <CardDescription className="text-slate-500 uppercase tracking-widest text-[10px] font-black mt-2">Historical trace of platform executions</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-white/[0.01]">
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Timestamp</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Action node</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Initiator</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Status</TableHead>
                <TableHead className="px-10 text-right text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Magnitude</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id} className="border-white/5 hover:bg-white/[0.03] transition-colors group">
                  <TableCell className="px-10 py-6 font-mono text-[10px] text-slate-500 italic">
                    {new Date(
                      (typeof log.timestamp === 'number') ? log.timestamp : (log.timestamp?._seconds ? log.timestamp._seconds * 1000 : log.timestamp || Date.now())
                    ).toLocaleString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', month: 'short', day: 'numeric' })}
                  </TableCell>
                  <TableCell className="text-sm font-black text-white uppercase tracking-tighter italic">{log.action}</TableCell>
                  <TableCell className="text-sm font-bold text-slate-400 group-hover:text-primary transition-colors tracking-tight">{log.user}</TableCell>
                  <TableCell>
                    <Badge variant={log.status === 'success' ? 'default' : log.status === 'error' ? 'destructive' : 'secondary'}
                           className={cn(
                             "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border-0",
                             log.status === 'success' ? 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20' : 
                             log.status === 'error' ? 'bg-red-500/10 text-red-400 ring-1 ring-red-500/20' : 
                             'bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20'
                           )}>
                      {log.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-10 text-right text-lg font-black text-white tracking-tighter">₦{Number(log.amount || 0).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
