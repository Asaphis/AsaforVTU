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
    <div className="space-y-10 animate-in fade-in duration-700 pb-12">
      <div>
        <h2 className="text-4xl font-black text-white tracking-tighter mb-2 italic">Core Configuration</h2>
        <p className="text-slate-400 font-medium">Calibrate VTU provider protocols and instant signal webhooks.</p>
      </div>

      <div className="grid gap-10 md:grid-cols-2">
        <Card className="border-0 shadow-2xl bg-white/5 backdrop-blur-xl rounded-[2.5rem] ring-1 ring-white/10 overflow-hidden lg:col-span-1">
          <CardHeader className="p-10 pb-6 bg-white/[0.02]">
            <CardTitle className="text-2xl font-black text-white tracking-tight italic flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              Provider Link
            </CardTitle>
            <CardDescription className="text-slate-500 uppercase tracking-widest text-[10px] font-black mt-2">Establish upstream VTU matrix connections</CardDescription>
          </CardHeader>
          <CardContent className="p-10 space-y-8">
            <div className="space-y-3">
              <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Node Endpoint URL</Label>
              <Input className="h-14 rounded-2xl bg-white/5 border-2 border-white/5 focus:border-primary/40 focus:bg-white/10 transition-all font-bold text-white px-6 outline-none" value={form.providerBaseUrl} onChange={e => setForm((p: any) => ({ ...p, providerBaseUrl: e.target.value }))} />
            </div>
            
            <div className="space-y-3">
              <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Secure API Key</Label>
              <div className="relative group">
                <Input 
                  type={showKey ? "text" : "password"} 
                  value={form.apiKey}
                  onChange={e => setForm((p: any) => ({ ...p, apiKey: e.target.value }))}
                  className="h-14 rounded-2xl bg-white/5 border-2 border-white/5 focus:border-primary/40 focus:bg-white/10 transition-all font-bold text-white px-6 pr-14 outline-none"
                />
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-xl hover:bg-white/10"
                  onClick={() => setShowKey(!showKey)}
                >
                  {showKey ? <EyeOff className="h-4 w-4 text-slate-400" /> : <Eye className="h-4 w-4 text-slate-400" />}
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Secret Encryption Token</Label>
              <Input type="password" value={form.secretKey} className="h-14 rounded-2xl bg-white/5 border-2 border-white/5 focus:border-primary/40 focus:bg-white/10 transition-all font-bold text-white px-6 outline-none" onChange={e => setForm((p: any) => ({ ...p, secretKey: e.target.value }))} />
            </div>
          </CardContent>
          <CardFooter className="bg-white/[0.02] border-t border-white/5 p-10">
            <Button className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-black rounded-2xl shadow-2xl shadow-primary/30 uppercase tracking-widest text-[11px] border-0 italic transition-all hover:scale-[1.02] active:scale-[0.98]" onClick={async () => {
              const payload = { cashbackEnabled: !!form.cashbackEnabled, dailyReferralBudget: Number(form.dailyReferralBudget || 0), pricing: {}, providerBaseUrl: form.providerBaseUrl, apiKey: form.apiKey, secretKey: form.secretKey };
              const res = await updateAdminSettings(payload);
              toast({ title: 'System Recalibrated', description: res.message || 'Config Nodes Updated' });
            }}>
              <Save className="mr-3 h-5 w-5" /> Commit Node Changes
            </Button>
          </CardFooter>
        </Card>

        <Card className="border-0 shadow-2xl bg-white/5 backdrop-blur-xl rounded-[2.5rem] ring-1 ring-white/10 overflow-hidden lg:col-span-1">
          <CardHeader className="p-10 pb-6 bg-white/[0.02]">
            <CardTitle className="text-2xl font-black text-white tracking-tight italic">Signal Receiver</CardTitle>
            <CardDescription className="text-slate-500 uppercase tracking-widest text-[10px] font-black mt-2">Provision this URL for real-time status synchronization</CardDescription>
          </CardHeader>
          <CardContent className="p-10 space-y-6">
            <div className="space-y-3">
              <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Ecosystem Webhook URL</Label>
              <div className="flex flex-col gap-4">
                <div className="flex gap-3">
                  <Input readOnly value="https://asaforvtu.onrender.com/api/webhook" className="h-14 bg-white/5 border-2 border-white/5 rounded-2xl text-slate-400 font-mono text-xs px-6 italic" />
                  <Button variant="outline" className="h-14 rounded-2xl border-white/10 bg-white/5 text-white hover:bg-white/10 font-black text-[10px] px-6 uppercase tracking-widest" onClick={() => {
                    navigator.clipboard.writeText("https://asaforvtu.onrender.com/api/webhook");
                    toast({ title: "Vector Copied", description: "Webhook URL injected to clipboard" });
                  }}>Copy</Button>
                </div>
                <div className="p-6 bg-primary/5 rounded-2xl border border-primary/10">
                  <p className="text-[10px] leading-relaxed text-slate-400 font-medium tracking-wide uppercase italic opacity-80">
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

