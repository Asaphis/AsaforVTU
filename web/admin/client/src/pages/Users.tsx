import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Search, UserPlus, Filter } from "lucide-react";
import { listUsers, promoteAdmin, suspendUser, deleteUser, updateUserPassword, debitWallet } from "@/lib/backend";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { InputGroup } from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { createUser } from "@/lib/backend";
import { createAdmin } from "@/lib/backend";
import { useLocation } from "wouter";
import { Checkbox } from "@/components/ui/checkbox";
import { Input as RawInput } from "@/components/ui/input";

export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setLocation] = useLocation();

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const data = await listUsers(100);
        if (!mounted) return;
        setUsers(data);
      } catch (e) {
        // ignore
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const reloadUsers = async () => {
    setLoading(true);
    try {
      const data = await listUsers(100);
      setUsers(data);
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter(user =>
      String(user.displayName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(user.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(user.phone || '').includes(searchTerm)
    );
  }, [users, searchTerm]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-white tracking-tighter mb-2">User Directory</h2>
          <p className="text-slate-400 font-medium">Managing the platform's core community and access levels.</p>
        </div>
        <div className="flex gap-4">
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-white font-black rounded-2xl px-6 h-12 shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95 border-0">
                <UserPlus className="mr-2 h-5 w-5" />
                Enroll New User
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] bg-slate-900 border-white/10 text-white rounded-[2rem] shadow-3xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black tracking-tight italic">Enroll Platform User</DialogTitle>
              </DialogHeader>
              <AddUserForm onDone={async () => { await reloadUsers(); }} />
            </DialogContent>
          </Dialog>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-white/10 bg-white/5 text-white hover:bg-white/10 font-black rounded-2xl px-6 h-12 shadow-xl transition-all hover:scale-105 active:scale-95">
                <ShieldCheck className="mr-2 h-5 w-5 text-primary" />
                Auth Admin
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] bg-slate-900 border-white/10 text-white rounded-[2rem] shadow-3xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black tracking-tight italic">Authorize New Admin</DialogTitle>
              </DialogHeader>
              <AddAdminForm />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="border-0 shadow-2xl bg-white/5 backdrop-blur-xl rounded-[2.5rem] ring-1 ring-white/10 overflow-hidden">
        <CardHeader className="p-10 pb-6 bg-white/[0.02]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <CardTitle className="text-2xl font-black text-white tracking-tight">Active Accounts</CardTitle>
              <CardDescription className="text-slate-500 font-medium mt-1 uppercase tracking-widest text-[10px]">
                Comprehensive list of registered ecosystem members
              </CardDescription>
            </div>
            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="relative flex-1 md:w-80 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-primary transition-colors" />
                <Input
                  placeholder="Identify user..."
                  className="pl-12 h-12 bg-white/5 border-white/10 rounded-2xl text-white placeholder:text-slate-600 focus-visible:ring-primary/40 focus-visible:bg-white/10 transition-all duration-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" size="icon" className="h-12 w-12 rounded-2xl border-white/10 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all">
                <Filter className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-20 text-center">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Syncing with database...</p>
            </div>
          ) : (
          <Table>
            <TableHeader className="bg-white/[0.01]">
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Identity</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Communication</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Onboarding</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Liquidity</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Status</TableHead>
                <TableHead className="px-10 text-right text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Operations</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id} className="border-white/5 hover:bg-white/[0.03] transition-colors group">
                  <TableCell className="px-10 py-6">
                    <div className="flex flex-col">
                      <span className="text-base font-black text-white group-hover:text-primary transition-colors tracking-tight">
                        {user.displayName || user.fullName || user.email || user.uid}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-slate-400 opacity-60 group-hover:opacity-100 transition-opacity">
                    {user.email || '—'}
                  </TableCell>
                  <TableCell className="text-slate-400 text-sm font-medium">
                    {user.joinedAt ? new Date(user.joinedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-lg font-black text-white tracking-tighter">₦{Number(user.walletBalance || 0).toLocaleString()}</span>
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 mt-1">Main Wallet</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.status === 'inactive' ? 'secondary' : 'default'} 
                           className={cn(
                             "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border-0",
                             user.status !== 'inactive' ? 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20' : 'bg-slate-500/10 text-slate-400 ring-1 ring-slate-500/20'
                           )}>
                      {user.status === 'inactive' ? 'Suspended' : 'Operational'}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-10 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-12 w-12 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all">
                          <MoreHorizontal className="h-6 w-6" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-64 rounded-3xl bg-slate-900 border-white/10 shadow-3xl text-slate-300">
                        <DropdownMenuLabel className="px-5 py-4 text-white font-black text-sm uppercase tracking-widest">User Control</DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-white/5" />
                        <DropdownMenuItem className="px-5 py-3.5 rounded-2xl focus:bg-white/10 focus:text-white cursor-pointer" onClick={() => {
                            const targetUid = String(user.uid || user.id || "");
                            if (!targetUid) return;
                            setLocation(`/users/${encodeURIComponent(targetUid)}`);
                          }}>View Profile Intelligence</DropdownMenuItem>
                        <DropdownMenuItem className="px-5 py-3.5 rounded-2xl focus:bg-white/10 focus:text-white cursor-pointer" onClick={() => {
                            const qs = new URLSearchParams({ uid: String(user.uid || user.id || ""), email: String(user.email || "") }).toString();
                            setLocation(`/transactions?${qs}`);
                          }}>Audit Transactions</DropdownMenuItem>
                        <DropdownMenuItem className="px-5 py-3.5 rounded-2xl focus:bg-white/10 focus:text-white cursor-pointer" onClick={() => {
                            const userId = String(user.email || user.uid || user.id || "");
                            const qs = new URLSearchParams({ userId }).toString();
                            setLocation(`/wallet?${qs}`);
                          }}>Inject Liquidity</DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-white/5" />
                        <DropdownMenuItem className="px-5 py-3.5 rounded-2xl focus:bg-primary/20 focus:text-primary cursor-pointer font-bold" onClick={async () => {
                            try {
                              const res = await promoteAdmin({ uid: user.uid || user.id, email: user.email });
                              toast({ title: 'Authorization Successful', description: `User ${res.email || user.email} is now an Admin.` });
                              await reloadUsers();
                            } catch (e: any) {
                              toast({ title: 'Auth Failed', description: e.message, variant: 'destructive' });
                            }
                          }}>Elevate to Admin</DropdownMenuItem>
                        <DropdownMenuItem className="px-5 py-3.5 rounded-2xl focus:bg-white/10 focus:text-white cursor-pointer" onClick={async () => {
                            const pwd = prompt('Set new cryptographic password');
                            if (!pwd) return;
                            try {
                              const res = await updateUserPassword({ uid: user.uid || user.id, email: user.email, password: pwd });
                              toast({ title: 'Credential Reset', description: `Credentials updated for ${res.email || user.email}` });
                            } catch (e: any) {
                              toast({ title: 'Update Failed', description: e.message, variant: 'destructive' });
                            }
                          }}>Reset Credentials</DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-white/5" />
                        <DropdownMenuItem className="px-5 py-3.5 rounded-2xl text-red-400 focus:bg-red-500/10 focus:text-red-400 font-bold cursor-pointer" onClick={async () => {
                            try {
                              const res = await suspendUser({ uid: user.uid || user.id, email: user.email, suspend: !(user.status === 'inactive') });
                              toast({ title: res.disabled ? 'Account Suspended' : 'Account Restored' });
                              await reloadUsers();
                            } catch (e: any) {
                              toast({ title: 'Operation Failed', description: e.message, variant: 'destructive' });
                            }
                          }}>
                          {user.status === 'inactive' ? 'Unblock User' : 'Suspend Operations'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function AddUserForm({ onDone }: { onDone: () => void }) {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [saving, setSaving] = useState(false);
  const [requireVerification, setRequireVerification] = useState(false);
  const [verificationLink, setVerificationLink] = useState<string | undefined>(undefined);
  const [redirectUrl, setRedirectUrl] = useState("https://asaforvtu.onrender.com/login");
  return (
    <div className="space-y-4">
      <InputGroup>
        <Label>Email</Label>
        <Input placeholder="user@example.com" value={email} onChange={e => setEmail(e.target.value)} />
      </InputGroup>
      <InputGroup>
        <Label>Password</Label>
        <Input type="password" placeholder="At least 6 characters" value={password} onChange={e => setPassword(e.target.value)} />
      </InputGroup>
      <InputGroup>
        <Label>Display Name</Label>
        <Input placeholder="Full name" value={displayName} onChange={e => setDisplayName(e.target.value)} />
      </InputGroup>
      <InputGroup>
        <Label>Phone Number</Label>
        <Input placeholder="+234..." value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} />
      </InputGroup>
      <div className="flex items-center gap-3">
        <Checkbox id="requireVerification" checked={requireVerification} onCheckedChange={(v) => setRequireVerification(Boolean(v))} />
        <Label htmlFor="requireVerification">Require email verification</Label>
      </div>
      {requireVerification && (
        <InputGroup>
          <Label>Redirect URL</Label>
          <RawInput placeholder="https://asaforvtu.onrender.com/login" value={redirectUrl} onChange={e => setRedirectUrl(e.target.value)} />
        </InputGroup>
      )}
      {verificationLink ? (
        <div className="space-y-2">
          <Label>Verification Link</Label>
          <div className="flex items-center gap-2">
            <RawInput readOnly value={verificationLink} />
            <Button
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(verificationLink || "");
                toast({ title: "Link copied", description: "Verification link copied to clipboard" });
              }}
            >
              Copy
            </Button>
          </div>
        </div>
      ) : null}
      <div className="flex justify-end">
        <Button
          disabled={saving}
          onClick={async () => {
            if (!email || !password) {
              toast({ title: "Missing fields", description: "Email and password are required", variant: "destructive" });
              return;
            }
            setSaving(true);
            try {
              const res = await createUser({ email, password, displayName, phoneNumber, requireVerification, redirectUrl });
              toast({ title: "User Created", description: res.email || email });
              if (res.verificationLink) {
                setVerificationLink(res.verificationLink);
                toast({ title: "Verification Required", description: "Copy and send the verification link to the user" });
              } else {
                setVerificationLink(undefined);
              }
              onDone();
            } catch (e: any) {
              toast({ title: "Create Failed", description: e.message || "Unable to create", variant: "destructive" });
            } finally {
              setSaving(false);
            }
          }}
        >
          Create User
        </Button>
      </div>
    </div>
  );
}

function AddAdminForm() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);
  return (
    <div className="space-y-4">
      <InputGroup>
        <Label>Email</Label>
        <Input placeholder="admin@example.com" value={email} onChange={e => setEmail(e.target.value)} />
      </InputGroup>
      <InputGroup>
        <Label>Password</Label>
        <Input type="password" placeholder="At least 6 characters" value={password} onChange={e => setPassword(e.target.value)} />
      </InputGroup>
      <InputGroup>
        <Label>Display Name</Label>
        <Input placeholder="Admin name" value={displayName} onChange={e => setDisplayName(e.target.value)} />
      </InputGroup>
      <div className="flex justify-end">
        <Button
          disabled={saving}
          onClick={async () => {
            if (!email || !password) {
              toast({ title: "Missing fields", description: "Email and password are required", variant: "destructive" });
              return;
            }
            setSaving(true);
            try {
              const res = await createAdmin({ email, password, displayName });
              toast({ title: "Admin Created", description: res.email || email });
            } catch (e: any) {
              toast({ title: "Create Failed", description: e.message || "Unable to create", variant: "destructive" });
            } finally {
              setSaving(false);
            }
          }}
        >
          Create Admin
        </Button>
      </div>
    </div>
  );
}

