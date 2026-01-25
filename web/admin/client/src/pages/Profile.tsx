import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { updateAdminProfile, changeAdminPassword } from "@/lib/backend";
import { ShieldCheck } from "lucide-react";

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
    <div className="space-y-8 animate-in fade-in duration-500 pb-12 text-slate-900">
      <div>
        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">My Profile</h2>
        <p className="text-slate-500 font-medium text-sm">Calibrate administrator identity and security credentials.</p>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        <Card className="border border-slate-200 bg-white rounded-2xl shadow-sm overflow-hidden md:col-span-1">
          <CardHeader className="text-center p-6 pb-2 border-b border-slate-100">
            <div className="mx-auto mb-6 relative group">
              <Avatar className="h-28 w-28 border-4 border-white shadow-md ring-2 ring-primary/20">
                <AvatarImage src={(user as any).photoURL || ""} className="object-cover" />
                <AvatarFallback className="text-3xl bg-primary text-white font-bold">
                  {String((user as any).displayName || (user as any).email || "A").charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-2 right-0 bg-primary h-8 w-8 rounded-xl flex items-center justify-center border-4 border-white shadow">
                <ShieldCheck className="h-4 w-4 text-white" />
              </div>
            </div>
            <CardTitle className="text-xl font-bold text-slate-900">{(user as any).displayName || 'Admin User'}</CardTitle>
            <CardDescription className="text-primary font-bold uppercase tracking-wider text-[10px] mt-2">{(user as any).email || ''}</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-slate-100">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Authority</span>
              <span className="text-sm font-bold text-slate-900 capitalize">{(user as any).role || 'Super Admin'}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-slate-100">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Node Status</span>
              <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-md text-[9px] font-bold uppercase tracking-wider px-3 py-1">Active</Badge>
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Last Sync</span>
              <span className="text-sm font-bold text-slate-600">Just now</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 bg-white rounded-2xl shadow-sm overflow-hidden md:col-span-2">
          <CardHeader className="p-6 pb-3">
            <CardTitle className="text-xl font-bold text-slate-900">Profile Details</CardTitle>
            <CardDescription className="text-slate-500 font-medium text-sm">Modify identification parameters</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-3">
                <Label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider ml-2">Public Identifier</Label>
                <Input className="h-12 rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-primary/30 transition-all font-medium text-slate-900 px-4 outline-none" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Admin User" />
              </div>
              <div className="space-y-3">
                <Label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider ml-2">Comm Channel</Label>
                <Input className="h-12 rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-primary/30 transition-all font-medium text-slate-900 px-4 outline-none" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="08012345678" />
              </div>
            </div>
            <div className="space-y-3">
              <Label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider ml-2">Authenticated Email</Label>
              <Input value={(user as any).email || ""} disabled className="h-12 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 font-mono text-xs px-4" />
            </div>
          </CardContent>
          <CardFooter className="border-t border-slate-100 p-6">
            <Button className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl uppercase tracking-widest text-[11px]" onClick={handleUpdateProfile} disabled={isUpdatingProfile}>
              {isUpdatingProfile ? "Saving..." : "Save Changes"}
            </Button>
          </CardFooter>
        </Card>

        <Card className="border border-slate-200 bg-white rounded-2xl shadow-sm overflow-hidden md:col-span-3">
          <CardHeader className="p-6 pb-3">
            <CardTitle className="text-xl font-bold text-slate-900">Security</CardTitle>
            <CardDescription className="text-slate-500 font-medium text-sm">Rotate access credentials</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
             <div className="grid gap-6 md:grid-cols-3">
              <div className="space-y-3">
                <Label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider ml-2">Current Password</Label>
                <Input type="password" value={currentPassword} className="h-12 rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-primary/30 transition-all font-medium text-slate-900 px-4 outline-none" onChange={(e) => setCurrentPassword(e.target.value)} />
              </div>
              <div className="space-y-3">
                <Label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider ml-2">New Password</Label>
                <Input type="password" value={newPassword} className="h-12 rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-primary/30 transition-all font-medium text-slate-900 px-4 outline-none" onChange={(e) => setNewPassword(e.target.value)} />
              </div>
              <div className="space-y-3">
                <Label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider ml-2">Confirm Password</Label>
                <Input type="password" value={confirmPassword} className="h-12 rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-primary/30 transition-all font-medium text-slate-900 px-4 outline-none" onChange={(e) => setConfirmPassword(e.target.value)} />
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t border-slate-100 p-6">
             <Button onClick={handleChangePassword} disabled={isUpdatingPassword} variant="outline" className="w-full h-12 border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-bold rounded-xl transition-all uppercase tracking-widest text-[11px]">
               {isUpdatingPassword ? "Updating..." : "Update Password"}
             </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

