'use client';

/* Ferixas preferences: concise operational controls in the shared warm-paper account setting. */
import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { BellRing, Monitor, MessageSquare } from 'lucide-react';

export default function SettingsPage() {
  const [notifications, setNotifications] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [smsAlerts, setSmsAlerts] = useState(false);

  return <main className="mx-auto max-w-4xl space-y-5 pb-24 lg:pb-8"><section><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#718096]">Preferences</p><h1 className="mt-1 text-2xl font-extrabold tracking-tight text-[#012044]">Settings.</h1><p className="mt-1 text-sm text-[#718096]">Choose how you would like to hear from AsaforVTU.</p></section><section className="overflow-hidden rounded-2xl border border-[#E8EDF2] bg-white"><div className="divide-y divide-[#E8EDF2]"><div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#F3FAFC] text-[#036A97]"><BellRing size={19} /></span><div><Label className="font-extrabold text-[#012044]">Dashboard notifications</Label><p className="mt-0.5 text-sm text-[#718096]">Receive alerts for account and transaction activity.</p></div></div><Checkbox checked={notifications} onCheckedChange={(value) => setNotifications(Boolean(value))} aria-label="Toggle dashboard notifications" className="h-5 w-5 border-[#036A97] data-[state=checked]:bg-[#036A97]" /></div><div className="grid gap-5 p-5 sm:grid-cols-2"><div><div className="flex items-center gap-2"><Monitor size={16} className="text-[#036A97]" /><Label htmlFor="theme" className="text-sm font-bold text-[#012044]">Interface theme</Label></div><select id="theme" value={theme} onChange={(event) => setTheme(event.target.value as 'light' | 'dark')} className="mt-2 w-full rounded-xl border border-[#E8EDF2] bg-white px-3 py-2.5 text-sm font-medium text-[#012044] outline-none focus:border-[#036A97] focus:ring-2 focus:ring-[#036A97]/10"><option value="light">Light mode</option><option value="dark">Dark mode (beta)</option></select></div><div><div className="flex items-center gap-2"><MessageSquare size={16} className="text-[#036A97]" /><Label htmlFor="alerts-phone" className="text-sm font-bold text-[#012044]">SMS alerts</Label></div><Input id="alerts-phone" placeholder="080…" className="mt-2 h-11 border-[#E8EDF2] focus-visible:ring-[#036A97]" /><label className="mt-3 flex cursor-pointer items-center gap-2 text-xs font-medium text-[#718096]"><Checkbox checked={smsAlerts} onCheckedChange={(value) => setSmsAlerts(Boolean(value))} className="border-[#036A97] data-[state=checked]:bg-[#036A97]" />Enable SMS alerts</label></div></div></div><div className="flex items-center justify-between gap-4 bg-[#FFFDFB] px-5 py-4"><p className="text-xs text-[#718096]">Preference saving will be enabled when account notifications are connected.</p><Button className="shrink-0 rounded-xl bg-[#036A97] px-4 text-sm font-bold text-white hover:bg-[#012044]">Save preferences</Button></div></section></main>;
}
