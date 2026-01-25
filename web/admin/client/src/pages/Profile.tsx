import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { updateAdminProfile, changeAdminPassword } from "@/lib/backend";

export default function ProfilePage() {
  const user = auth.currentUser || {};
  const { toast } = useToast();
  const [displayName, setDisplayName] = useState((user as any).displayName || "");
  const [phoneNumber, setPhoneNumber] = useState((user as any).phoneNumber || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const handleUpdateProfile = async () => {
    setIsUpdatingProfile(true);
    try {
      await updateAdminProfile({ displayName, phoneNumber });
      toast({ title: "Profile updated", description: "Your changes have been saved." });
    } catch (e: any) {
      toast({ title: "Update failed", description: e.message || "An error occurred", variant: "destructive" });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords mismatch", description: "New password and confirmation do not match.", variant: "destructive" });
      return;
    }
    setIsUpdatingPassword(true);
    try {
      await changeAdminPassword({ currentPassword, newPassword });
      toast({ title: "Password updated", description: "Your password has been changed successfully." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e: any) {
      toast({ title: "Update failed", description: e.message || "An error occurred", variant: "destructive" });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-12">
      <div>
        <h2 className="text-4xl font-black text-white tracking-tighter mb-2 italic">Command Profile</h2>
        <p className="text-slate-400 font-medium">Calibrate administrator protocols and security credentials.</p>
      </div>

      <div className="grid gap-10 md:grid-cols-3">
        <Card className="border-0 shadow-2xl bg-white/5 backdrop-blur-xl rounded-[2.5rem] ring-1 ring-white/10 overflow-hidden md:col-span-1">
          <CardHeader className="text-center p-10 pb-6 bg-white/[0.02]">
            <div className="mx-auto mb-6 relative group">
              <Avatar className="h-32 w-32 border-4 border-white/5 shadow-3xl ring-2 ring-primary/20 group-hover:scale-105 transition-all duration-500">
                <AvatarImage src={(user as any).photoURL || ""} className="object-cover" />
                <AvatarFallback className="text-4xl bg-gradient-to-br from-primary to-indigo-600 text-white font-black italic">
                  {String((user as any).displayName || (user as any).email || "A").charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-2 right-0 bg-primary h-8 w-8 rounded-xl flex items-center justify-center border-4 border-[#0F172A] shadow-xl">
                <ShieldCheck className="h-4 w-4 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-black text-white tracking-tight italic">{(user as any).displayName || 'Alpha Node'}</CardTitle>
            <CardDescription className="text-primary font-black uppercase tracking-widest text-[10px] mt-2 italic opacity-80">{(user as any).email || 'SECURE_CHANNEL'}</CardDescription>
          </CardHeader>
          <CardContent className="p-10 pt-2 space-y-4">
            <div className="flex justify-between items-center py-4 border-b border-white/5">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Authority</span>
              <span className="text-sm font-bold text-white italic capitalize">{(user as any).role || 'Super Admin'}</span>
            </div>
            <div className="flex justify-between items-center py-4 border-b border-white/5">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Node Status</span>
              <Badge className="bg-emerald-500/10 text-emerald-400 border-0 ring-1 ring-emerald-500/20 rounded-lg text-[9px] font-black uppercase tracking-widest px-3 py-1">Active</Badge>
            </div>
            <div className="flex justify-between items-center py-4">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Last Sync</span>
              <span className="text-sm font-bold text-slate-400 italic">Just now</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-2xl bg-white/5 backdrop-blur-xl rounded-[2.5rem] ring-1 ring-white/10 overflow-hidden md:col-span-2">
          <CardHeader className="p-10 pb-6 bg-white/[0.02]">
            <CardTitle className="text-2xl font-black text-white tracking-tight italic">Protocol Metadata</CardTitle>
            <CardDescription className="text-slate-500 uppercase tracking-widest text-[10px] font-black mt-2">Modify identification parameters</CardDescription>
          </CardHeader>
          <CardContent className="p-10 space-y-8">
            <div className="grid gap-8 md:grid-cols-2">
              <div className="space-y-3">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Public Identifier</Label>
                <Input className="h-14 rounded-2xl bg-white/5 border-2 border-white/5 focus:border-primary/40 focus:bg-white/10 transition-all font-bold text-white px-6 outline-none" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Admin User" />
              </div>
              <div className="space-y-3">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Comm Channel</Label>
                <Input className="h-14 rounded-2xl bg-white/5 border-2 border-white/5 focus:border-primary/40 focus:bg-white/10 transition-all font-bold text-white px-6 outline-none" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="08012345678" />
              </div>
            </div>
            <div className="space-y-3">
              <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Authenticated Email</Label>
              <Input value={(user as any).email || ""} disabled className="h-14 bg-white/[0.02] border-white/5 rounded-2xl text-slate-500 font-mono text-xs px-6 italic" />
            </div>
          </CardContent>
          <CardFooter className="bg-white/[0.02] border-t border-white/5 p-10">
            <Button className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-black rounded-2xl shadow-2xl shadow-primary/30 uppercase tracking-widest text-[11px] border-0 italic transition-all hover:scale-[1.02] active:scale-[0.98]" onClick={handleUpdateProfile} disabled={isUpdatingProfile}>
              {isUpdatingProfile ? "Synchronizing..." : "Commit Protocol Updates"}
            </Button>
          </CardFooter>
        </Card>

        <Card className="border-0 shadow-2xl bg-white/5 backdrop-blur-xl rounded-[2.5rem] ring-1 ring-white/10 overflow-hidden md:col-span-3">
          <CardHeader className="p-10 pb-6 bg-white/[0.02]">
            <CardTitle className="text-2xl font-black text-white tracking-tight italic">Security Cipher</CardTitle>
            <CardDescription className="text-slate-500 uppercase tracking-widest text-[10px] font-black mt-2">Rotate cryptographic access credentials</CardDescription>
          </CardHeader>
          <CardContent className="p-10 space-y-8">
             <div className="grid gap-8 md:grid-cols-3">
              <div className="space-y-3">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Current Cipher</Label>
                <Input type="password" value={currentPassword} className="h-14 rounded-2xl bg-white/5 border-2 border-white/5 focus:border-primary/40 focus:bg-white/10 transition-all font-bold text-white px-6 outline-none" onChange={(e) => setCurrentPassword(e.target.value)} />
              </div>
              <div className="space-y-3">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">New Cipher</Label>
                <Input type="password" value={newPassword} className="h-14 rounded-2xl bg-white/5 border-2 border-white/5 focus:border-primary/40 focus:bg-white/10 transition-all font-bold text-white px-6 outline-none" onChange={(e) => setNewPassword(e.target.value)} />
              </div>
              <div className="space-y-3">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Confirm Cipher</Label>
                <Input type="password" value={confirmPassword} className="h-14 rounded-2xl bg-white/5 border-2 border-white/5 focus:border-primary/40 focus:bg-white/10 transition-all font-bold text-white px-6 outline-none" onChange={(e) => setConfirmPassword(e.target.value)} />
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-white/[0.02] border-t border-white/5 p-10">
             <Button onClick={handleChangePassword} disabled={isUpdatingPassword} variant="outline" className="w-full h-14 border-white/10 bg-white/5 text-white hover:bg-white/10 font-black rounded-2xl shadow-xl transition-all uppercase tracking-widest text-[11px] italic">
               {isUpdatingPassword ? "Encrypting..." : "Initialize Cipher Rotation"}
             </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

