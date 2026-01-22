'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';

export default function SettingsPage() {
  const [notifications, setNotifications] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [smsAlerts, setSmsAlerts] = useState(false);

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-4xl font-black text-[#0A1F44] tracking-tight">System Settings</h1>
        <p className="text-gray-400 font-medium mt-1">Personalize your dashboard experience</p>
      </div>

      <div className="dashboard-card border-none shadow-brand p-10 space-y-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#F97316]/5 rounded-full -mr-32 -mt-32 blur-3xl" />
        
        <div className="space-y-8 relative z-10">
          <div className="flex items-center justify-between p-6 rounded-[2rem] bg-gray-50/50 border border-gray-100 group transition-all hover:bg-white hover:shadow-xl hover:shadow-blue-900/5">
            <div>
              <Label className="text-base font-black text-[#0A1F44] uppercase tracking-tight">Push Notifications</Label>
              <p className="text-xs text-gray-400 font-medium mt-1">Receive real-time alerts for transactions and account activity.</p>
            </div>
            <div className="scale-125">
              <Checkbox checked={notifications} onCheckedChange={(v) => setNotifications(Boolean(v))} className="border-2 border-[#0A1F44] data-[state=checked]:bg-[#0A1F44]" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Interface Theme</label>
              <select
                className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-[#0A1F44]/20 focus:bg-white focus:outline-none transition-all font-bold text-[#0A1F44] appearance-none"
                value={theme}
                onChange={(e) => setTheme(e.target.value as 'light' | 'dark')}
              >
                <option value="light">Light Mode</option>
                <option value="dark">Dark Mode (Beta)</option>
              </select>
            </div>
            
            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Alerts Phone Number</label>
              <div className="relative">
                <Input 
                  placeholder="080..." 
                  className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-[#0A1F44]/20 focus:bg-white transition-all font-bold text-[#0A1F44] h-auto"
                />
                <div className="flex items-center gap-3 mt-4 ml-1">
                  <Checkbox checked={smsAlerts} onCheckedChange={(v) => setSmsAlerts(Boolean(v))} className="border-2 border-[#F97316] data-[state=checked]:bg-[#F97316]" />
                  <span className="text-xs font-black text-[#0A1F44]/60 uppercase tracking-widest">Enable SMS alerts</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 relative z-10">
          <Button className="bg-[#F97316] hover:bg-[#F97316]/90 text-white font-black text-xs uppercase tracking-[0.2em] px-10 py-6 rounded-2xl shadow-xl shadow-orange-900/20 transition-all active:scale-95 h-auto">
            Save Preferences
          </Button>
        </div>
      </div>
    </div>
  );
}
