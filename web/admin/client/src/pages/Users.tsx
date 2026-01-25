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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Search, UserPlus, Filter, ShieldCheck } from "lucide-react";
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
        setUsers(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("Failed to load users:", e);
        if (mounted) setUsers([]);
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
    if (!Array.isArray(users)) return [];
    return users.filter(user =>
      String(user?.displayName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(user?.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(user?.phone || '').includes(searchTerm)
    );
  }, [users, searchTerm]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 text-slate-900">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">User Directory</h2>
          <p className="text-slate-500 font-medium">Manage platform accounts and access levels.</p>
        </div>
        <div className="flex gap-3">
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-white font-bold rounded-xl px-4 h-11 shadow-sm transition-all border-0">
                <UserPlus className="mr-2 h-4 w-4" />
                Enroll User
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px] bg-white border-slate-200 text-slate-900 rounded-2xl shadow-xl">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold tracking-tight">Enroll New User</DialogTitle>
              </DialogHeader>
              <AddUserForm onDone={async () => { await reloadUsers(); }} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden">
        <CardHeader className="p-6 bg-slate-50/50 border-b border-slate-100">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-bold text-slate-900">Active Accounts</CardTitle>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64 group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                <Input
                  placeholder="Search users..."
                  className="pl-10 h-10 bg-white border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus-visible:ring-primary/20 transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Users...</p>
            </div>
          ) : (
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="border-slate-100 hover:bg-transparent">
                <TableHead className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Identity</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-500">Communication</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-500">Liquidity</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-500">Status</TableHead>
                <TableHead className="px-6 text-right text-xs font-bold uppercase tracking-wider text-slate-500">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="p-12 text-center text-slate-400">
                    No users found or error loading data.
                  </TableCell>
                </TableRow>
              ) : filteredUsers.map((user) => (
                <TableRow key={user.id} className="border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <TableCell className="px-6 py-4">
                    <span className="text-sm font-bold text-slate-900">
                      {user.displayName || user.fullName || user.email || user.uid}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-slate-500 font-medium">
                    {user.email || '—'}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-bold text-slate-900">₦{Number(user.walletBalance || 0).toLocaleString()}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.status === 'inactive' ? 'secondary' : 'default'} 
                           className={cn(
                             "px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider",
                             user.status !== 'inactive' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-50 text-slate-500 border border-slate-100'
                           )}>
                      {user.status === 'inactive' ? 'Suspended' : 'Active'}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-6 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-slate-100 rounded-lg">
                          <MoreHorizontal className="h-4 w-4 text-slate-400" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56 rounded-xl bg-white border-slate-200 shadow-lg text-slate-600">
                        <DropdownMenuLabel className="text-xs font-bold text-slate-400 uppercase tracking-widest px-4 py-3">Management</DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-slate-100" />
                        <DropdownMenuItem className="px-4 py-2.5 hover:bg-slate-50 cursor-pointer" onClick={() => {
                            const targetUid = String(user.uid || user.id || "");
                            if (!targetUid) return;
                            setLocation(`/users/${encodeURIComponent(targetUid)}`);
                          }}>View Profile</DropdownMenuItem>
                        <DropdownMenuItem className="px-4 py-2.5 hover:bg-slate-50 cursor-pointer" onClick={() => {
                            const userId = String(user.email || user.uid || user.id || "");
                            const qs = new URLSearchParams({ userId }).toString();
                            setLocation(`/wallet?${qs}`);
                          }}>Manage Wallet</DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-slate-100" />
                        <DropdownMenuItem className="px-4 py-2.5 text-red-600 hover:bg-red-50 cursor-pointer font-bold" onClick={async () => {
                            try {
                              const res = await suspendUser({ uid: user.uid || user.id, email: user.email, suspend: !(user.status === 'inactive') });
                              toast({ title: res.disabled ? 'Account Suspended' : 'Account Restored' });
                              await reloadUsers();
                            } catch (e: any) {
                              toast({ title: 'Action Failed', description: e.message, variant: 'destructive' });
                            }
                          }}>
                          {user.status === 'inactive' ? 'Unblock User' : 'Suspend Account'}
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

