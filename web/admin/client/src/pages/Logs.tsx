import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getAllTransactions } from "@/lib/backend";
import { cn } from "@/lib/utils";

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
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div>
        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">System Chronology</h2>
        <p className="text-slate-500 font-medium text-sm">Immutable audit trail of ecosystem activity and nodal events.</p>
      </div>

      <Card className="border border-slate-200 bg-white rounded-2xl shadow-sm overflow-hidden">
        <CardHeader className="p-6 pb-3">
          <CardTitle className="text-xl font-bold text-slate-900">Nodal Events</CardTitle>
          <CardDescription className="text-slate-500 uppercase tracking-widest text-[10px] font-bold mt-2">Historical trace of platform executions</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow className="border-slate-200 hover:bg-transparent">
                <TableHead className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-600">Timestamp</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-600">Action node</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-600">Initiator</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-600">Status</TableHead>
                <TableHead className="px-6 text-right text-[10px] font-bold uppercase tracking-widest text-slate-600">Magnitude</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id} className="border-slate-200 hover:bg-slate-50 transition-colors group">
                  <TableCell className="px-6 py-4 font-mono text-[10px] text-slate-500">
                    {new Date(
                      (typeof log.timestamp === 'number') ? log.timestamp : (log.timestamp?._seconds ? log.timestamp._seconds * 1000 : log.timestamp || Date.now())
                    ).toLocaleString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', month: 'short', day: 'numeric' })}
                  </TableCell>
                  <TableCell className="text-sm font-bold text-slate-900 uppercase tracking-tight">{log.action}</TableCell>
                  <TableCell className="text-sm font-medium text-slate-700 group-hover:text-primary transition-colors tracking-tight">{log.user}</TableCell>
                  <TableCell>
                    <Badge variant={log.status === 'success' ? 'default' : log.status === 'error' ? 'destructive' : 'secondary'}
                           className={cn(
                             "px-3 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest border",
                             log.status === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                             log.status === 'error' ? 'bg-red-50 text-red-700 border-red-100' : 
                             'bg-amber-50 text-amber-700 border-amber-100'
                           )}>
                      {log.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-6 text-right text-lg font-bold text-slate-900 tracking-tight">₦{Number(log.amount || 0).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
