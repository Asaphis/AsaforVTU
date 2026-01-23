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
    <div className="space-y-8 pb-8">
      <div>
        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">API Settings</h2>
        <p className="text-slate-500 font-medium">Configure provider credentials and webhook endpoints.</p>
      </div>

      <div className="grid gap-10 md:grid-cols-2">
        <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden lg:col-span-1">
          <CardHeader className="p-6 pb-2">
            <CardTitle className="text-xl font-bold text-slate-900">Provider Configuration</CardTitle>
            <CardDescription className="text-slate-500">Set credentials for upstream VTU provider</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-3">
              <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider ml-1">Endpoint URL</Label>
              <Input className="h-10 rounded-xl bg-white border-slate-200 focus-visible:ring-primary/20 transition-all text-slate-900 px-4" value={form.providerBaseUrl} onChange={e => setForm((p: any) => ({ ...p, providerBaseUrl: e.target.value }))} />
            </div>
            
            <div className="space-y-3">
              <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider ml-1">API Key</Label>
              <div className="relative group">
                <Input 
                  type={showKey ? "text" : "password"} 
                  value={form.apiKey}
                  onChange={e => setForm((p: any) => ({ ...p, apiKey: e.target.value }))}
                  className="h-10 rounded-xl bg-white border-slate-200 focus-visible:ring-primary/20 transition-all text-slate-900 px-4 pr-12"
                />
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 w-8 rounded-md hover:bg-slate-100"
                  onClick={() => setShowKey(!showKey)}
                >
                  {showKey ? <EyeOff className="h-4 w-4 text-slate-600" /> : <Eye className="h-4 w-4 text-slate-600" />}
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider ml-1">Secret Token</Label>
              <Input type="password" value={form.secretKey} className="h-10 rounded-xl bg-white border-slate-200 focus-visible:ring-primary/20 transition-all text-slate-900 px-4" onChange={e => setForm((p: any) => ({ ...p, secretKey: e.target.value }))} />
            </div>
          </CardContent>
          <CardFooter className="bg-slate-50/50 border-t border-slate-100 p-6">
            <Button className="w-full h-10 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-sm text-sm" onClick={async () => {
              const payload = { cashbackEnabled: !!form.cashbackEnabled, dailyReferralBudget: Number(form.dailyReferralBudget || 0), pricing: {}, providerBaseUrl: form.providerBaseUrl, apiKey: form.apiKey, secretKey: form.secretKey };
              const res = await updateAdminSettings(payload);
              toast({ title: 'System Recalibrated', description: res.message || 'Config Nodes Updated' });
            }}>
              <Save className="mr-2 h-4 w-4" /> Save Settings
            </Button>
          </CardFooter>
        </Card>

        <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden lg:col-span-1">
          <CardHeader className="p-6 pb-2">
            <CardTitle className="text-xl font-bold text-slate-900">Webhook</CardTitle>
            <CardDescription className="text-slate-500">Use this URL for status updates</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-3">
              <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider ml-1">Webhook URL</Label>
              <div className="flex flex-col gap-4">
                <div className="flex gap-3">
                  <Input readOnly value="https://asaforvtu.onrender.com/api/webhook" className="h-10 bg-white border-slate-200 rounded-xl text-slate-600 font-mono text-xs px-4" />
                  <Button variant="outline" className="h-10 rounded-xl border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-bold px-4" onClick={() => {
                    navigator.clipboard.writeText("https://asaforvtu.onrender.com/api/webhook");
                    toast({ title: "Vector Copied", description: "Webhook URL injected to clipboard" });
                  }}>Copy</Button>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <p className="text-xs leading-relaxed text-slate-500 font-medium">
                    Establishing this connection ensures quick status propagation across the service node architecture.
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

