import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Save, Eye, EyeOff } from "lucide-react";
import { useEffect, useState } from "react";
import { getAdminSettings, updateAdminSettings } from "@/lib/backend";
import { useToast } from "@/hooks/use-toast";

export default function ApiSettingsPage() {
  const [showKey, setShowKey] = useState(false);
  const { toast } = useToast();
  const [form, setForm] = useState<any>({ providerBaseUrl: '', apiKey: '', secretKey: '', cashbackEnabled: false, dailyReferralBudget: 0 });

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const s = await getAdminSettings();
        if (!mounted) return;
        setForm((prev: any) => ({
          ...prev,
          providerBaseUrl: s.providerBaseUrl || '',
          apiKey: s.apiKey || '',
          secretKey: s.secretKey || '',
          cashbackEnabled: !!s.cashbackEnabled,
          dailyReferralBudget: Number(s.dailyReferralBudget || 0)
        }));
      } catch {
        // ignore
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div>
        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Core Configuration</h2>
        <p className="text-slate-500 font-medium text-sm">Calibrate VTU provider protocols and instant signal webhooks.</p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <Card className="border border-slate-200 bg-white rounded-2xl shadow-sm overflow-hidden lg:col-span-1">
          <CardHeader className="p-6 pb-3">
            <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              Provider Link
            </CardTitle>
            <CardDescription className="text-slate-500 uppercase tracking-widest text-[10px] font-bold mt-2">Establish upstream VTU matrix connections</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-3">
              <Label className="text-[10px] font-bold text-slate-600 uppercase tracking-widest ml-2">Node Endpoint URL</Label>
              <Input className="h-12 rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-primary/30 transition-all font-medium text-slate-900 px-4 outline-none" value={form.providerBaseUrl} onChange={e => setForm((p: any) => ({ ...p, providerBaseUrl: e.target.value }))} />
            </div>
            
            <div className="space-y-3">
              <Label className="text-[10px] font-bold text-slate-600 uppercase tracking-widest ml-2">Secure API Key</Label>
              <div className="relative group">
                <Input 
                  type={showKey ? "text" : "password"} 
                  value={form.apiKey}
                  onChange={e => setForm((p: any) => ({ ...p, apiKey: e.target.value }))}
                  className="h-12 rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-primary/30 transition-all font-medium text-slate-900 px-4 pr-12 outline-none"
                />
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-lg hover:bg-slate-100"
                  onClick={() => setShowKey(!showKey)}
                >
                  {showKey ? <EyeOff className="h-4 w-4 text-slate-500" /> : <Eye className="h-4 w-4 text-slate-500" />}
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-[10px] font-bold text-slate-600 uppercase tracking-widest ml-2">Secret Encryption Token</Label>
              <Input type="password" value={form.secretKey} className="h-12 rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-primary/30 transition-all font-medium text-slate-900 px-4 outline-none" onChange={e => setForm((p: any) => ({ ...p, secretKey: e.target.value }))} />
            </div>
          </CardContent>
          <CardFooter className="border-t border-slate-100 p-6">
            <Button className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl uppercase tracking-widest text-[11px]" onClick={async () => {
              const payload = { cashbackEnabled: !!form.cashbackEnabled, dailyReferralBudget: Number(form.dailyReferralBudget || 0), pricing: {}, providerBaseUrl: form.providerBaseUrl, apiKey: form.apiKey, secretKey: form.secretKey };
              const res = await updateAdminSettings(payload);
              toast({ title: 'System Recalibrated', description: res.message || 'Config Nodes Updated' });
            }}>
              <Save className="mr-3 h-4 w-4" /> Commit Node Changes
            </Button>
          </CardFooter>
        </Card>

        <Card className="border border-slate-200 bg-white rounded-2xl shadow-sm overflow-hidden lg:col-span-1">
          <CardHeader className="p-6 pb-3">
            <CardTitle className="text-xl font-bold text-slate-900">Signal Receiver</CardTitle>
            <CardDescription className="text-slate-500 uppercase tracking-widest text-[10px] font-bold mt-2">Provision this URL for real-time status synchronization</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-3">
              <Label className="text-[10px] font-bold text-slate-600 uppercase tracking-widest ml-2">Ecosystem Webhook URL</Label>
              <div className="flex flex-col gap-4">
                <div className="flex gap-3">
                  <Input readOnly value="https://asaforvtu.onrender.com/api/webhook" className="h-12 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 font-mono text-xs px-4" />
                  <Button variant="outline" className="h-12 rounded-xl border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-bold text-[10px] px-6 uppercase tracking-widest" onClick={() => {
                    navigator.clipboard.writeText("https://asaforvtu.onrender.com/api/webhook");
                    toast({ title: "Vector Copied", description: "Webhook URL injected to clipboard" });
                  }}>Copy</Button>
                </div>
                <div className="p-6 bg-primary/5 rounded-xl border border-primary/10">
                  <p className="text-[10px] leading-relaxed text-slate-500 font-medium tracking-wide uppercase opacity-80">
                    Establishing this connection ensures millisecond status propagation across the entire service node architecture.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

