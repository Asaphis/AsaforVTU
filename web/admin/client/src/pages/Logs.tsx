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
    <div className="space-y-8 pb-8">
      <div>
        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">System Logs</h2>
        <p className="text-slate-500 font-medium">Audit trail of platform activity and events.</p>
      </div>

      <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden">
        <CardHeader className="p-6">
          <CardTitle className="text-xl font-bold text-slate-900">Nodal Events</CardTitle>
          <CardDescription className="text-slate-500">Historical trace of platform executions</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="border-slate-100 hover:bg-transparent">
                <TableHead className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Timestamp</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-500">Action</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-500">Initiator</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-500">Status</TableHead>
                <TableHead className="px-6 text-right text-xs font-bold uppercase tracking-wider text-slate-500">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id} className="border-slate-50 hover:bg-slate-50/50 transition-colors group">
                  <TableCell className="px-6 py-4 font-mono text-xs text-slate-500">
                    {new Date(
                      (typeof log.timestamp === 'number') ? log.timestamp : (log.timestamp?._seconds ? log.timestamp._seconds * 1000 : log.timestamp || Date.now())
                    ).toLocaleString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', month: 'short', day: 'numeric' })}
                  </TableCell>
                  <TableCell className="text-sm font-bold text-slate-900">{log.action}</TableCell>
                  <TableCell className="text-xs text-slate-500 font-medium">{log.user}</TableCell>
                  <TableCell>
                    <Badge variant={log.status === 'success' ? 'default' : log.status === 'error' ? 'destructive' : 'secondary'}
                           className={cn(
                             "px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border",
                             log.status === 'success' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                             log.status === 'error' ? 'bg-red-50 text-red-600 border-red-100' : 
                             'bg-orange-50 text-orange-600 border-orange-100'
                           )}>
                      {log.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-6 text-right text-sm font-bold text-slate-900">₦{Number(log.amount || 0).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
