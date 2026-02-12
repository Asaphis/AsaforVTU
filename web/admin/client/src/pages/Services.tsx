import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Smartphone, Wifi, Tv, Zap, Edit, Trash2, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getAllPlans, createPlan, updatePlan, deletePlan, getAdminSettings, updateAdminSettings, getServices, createService, deleteService, updateService } from "@/lib/backend";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ServicesPage() {
  const [activeTab, setActiveTab] = useState("categories");
  const { toast } = useToast();
  const [plans, setPlans] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loadingPlans, setLoadingPlans] = useState<boolean>(true);
  const [openNew, setOpenNew] = useState(false);
  const [openNewService, setOpenNewService] = useState(false);
  const [openNewCable, setOpenNewCable] = useState(false);
  const [openNewPower, setOpenNewPower] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [openEditService, setOpenEditService] = useState(false);
  const [airtimeNetworks, setAirtimeNetworks] = useState<Record<string, { enabled: boolean; discount: number }>>({
    MTN: { enabled: true, discount: 2 },
    Airtel: { enabled: true, discount: 2 },
    Glo: { enabled: true, discount: 2 },
    "9mobile": { enabled: true, discount: 2 },
  });

  useEffect(() => {
    let mounted = true;
    const loadPlans = async () => {
      setLoadingPlans(true);
      try {
        const [data, settings, srvs] = await Promise.all([getAllPlans(), getAdminSettings(), getServices()]);
        if (!mounted) return;
        setPlans(data);
        setServices(srvs);
        const nets = (settings?.airtimeNetworks as any) || {};
        const merged: Record<string, { enabled: boolean; discount: number }> = { ...airtimeNetworks };
        for (const key of Object.keys(merged)) {
          const v = nets[key];
          if (v) {
            merged[key] = { enabled: v.enabled !== false, discount: Number(v.discount ?? merged[key].discount) };
          }
        }
        setAirtimeNetworks(merged);
      } catch (e: any) {
        toast({ title: "Failed to load plans", description: e.message || "Unable to fetch plans", variant: "destructive" });
      } finally {
        if (mounted) setLoadingPlans(false);
      }
    };
    loadPlans();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Service Management</h2>
        <p className="text-muted-foreground">Manage VTU services, plans, and pricing.</p>
      </div>

      <Tabs defaultValue="categories" onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5 lg:w-[500px]">
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="airtime"><Smartphone className="mr-2 h-4 w-4" /> Airtime</TabsTrigger>
          <TabsTrigger value="data"><Wifi className="mr-2 h-4 w-4" /> Data</TabsTrigger>
          <TabsTrigger value="cable"><Tv className="mr-2 h-4 w-4" /> Cable</TabsTrigger>
          <TabsTrigger value="electricity"><Zap className="mr-2 h-4 w-4" /> Power</TabsTrigger>
        </TabsList>

        {/* Categories Content */}
        <TabsContent value="categories" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={openNewService} onOpenChange={setOpenNewService}>
              <DialogTrigger asChild>
                <Button className="shadow-lg shadow-primary/20">
                  <Plus className="mr-2 h-4 w-4" /> Add Category
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add Service Category</DialogTitle>
                </DialogHeader>
                <NewServiceForm 
                   onCreated={(srv) => {
                      setServices(prev => [...prev, srv]);
                      setOpenNewService(false);
                   }} 
                />
              </DialogContent>
            </Dialog>
            <Dialog open={openEditService} onOpenChange={(v) => { setOpenEditService(v); if (!v) setEditingService(null); }}>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Edit Service Category</DialogTitle>
                </DialogHeader>
                {editingService && (
                  <EditServiceForm
                    service={editingService}
                    onSaved={(updated) => {
                      setServices(prev => prev.map(x => x.id === editingService.id ? { ...x, ...updated } : x));
                      setOpenEditService(false);
                      setEditingService(null);
                    }}
                  />
                )}
              </DialogContent>
            </Dialog>
          </div>
          <Card className="border-none shadow-sm">
             <CardHeader>
               <CardTitle>Service Categories</CardTitle>
               <CardDescription>Manage services displayed on the dashboard slider.</CardDescription>
             </CardHeader>
             <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Category Group</TableHead>
                      <TableHead>ID</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {services.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">
                           <div className="flex items-center gap-2">
                             {s.icon && <img src={s.icon} className="w-6 h-6 rounded-full" alt="" />}
                             {s.name}
                           </div>
                        </TableCell>
                        <TableCell>{s.category}</TableCell>
                        <TableCell className="font-mono text-xs">{s.id}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingService(s);
                              setOpenEditService(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive"
                            onClick={async () => {
                              if (!confirm('Delete this service category?')) return;
                              try {
                                await deleteService(s.id);
                                setServices(prev => prev.filter(x => x.id !== s.id));
                                toast({ title: "Deleted" });
                              } catch(e: any) {
                                toast({ title: "Error", description: e.message, variant: "destructive" });
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
             </CardContent>
          </Card>
        </TabsContent>

        {/* Airtime Content */}
        <TabsContent value="airtime" className="space-y-4">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle>Airtime Networks</CardTitle>
              <CardDescription>Enable or disable airtime for specific networks and set discounts.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Network</TableHead>
                    <TableHead>Discount (%)</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {['MTN', 'Airtel', 'Glo', '9mobile'].map((network) => (
                    <TableRow key={network}>
                      <TableCell className="font-medium">{network}</TableCell>
                      <TableCell>{airtimeNetworks[network]?.discount ?? 2}%</TableCell>
                      <TableCell>
                        <Switch
                          checked={Boolean(airtimeNetworks[network]?.enabled)}
                          onCheckedChange={async (val) => {
                            const updated = { ...airtimeNetworks, [network]: { ...(airtimeNetworks[network] || { discount: 2 }), enabled: Boolean(val) } };
                            setAirtimeNetworks(updated);
                            try {
                              await updateAdminSettings({ airtimeNetworks: updated as any });
                              toast({ title: "Settings updated", description: `${network} status changed` });
                            } catch (e: any) {
                              toast({ title: "Update failed", description: e.message || "Unable to save settings", variant: "destructive" });
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            const currentDiscount = airtimeNetworks[network]?.discount ?? 2;
                            const val = prompt(`Set discount for ${network} (%)`, String(currentDiscount));
                            if (val === null) return;
                            const discount = parseFloat(val);
                            if (isNaN(discount)) {
                              toast({ title: "Invalid input", description: "Please enter a valid number", variant: "destructive" });
                              return;
                            }
                            
                            const updated = { 
                              ...airtimeNetworks, 
                              [network]: { 
                                ...(airtimeNetworks[network] || { enabled: true }), 
                                discount 
                              } 
                            };
                            setAirtimeNetworks(updated);
                            try {
                              await updateAdminSettings({ airtimeNetworks: updated as any });
                              toast({ title: "Discount updated", description: `${network} set to ${discount}%` });
                            } catch (e: any) {
                              toast({ title: "Update failed", description: e.message, variant: "destructive" });
                            }
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Content */}
        <TabsContent value="data" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={openNew} onOpenChange={setOpenNew}>
              <DialogTrigger asChild>
                <Button className="shadow-lg shadow-primary/20">
                  <Plus className="mr-2 h-4 w-4" /> Add Data Plan
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[520px]">
                <DialogHeader>
                  <DialogTitle>Create Data Plan</DialogTitle>
                </DialogHeader>
                <NewPlanForm
                  onCreated={(plan) => {
                    setPlans((prev) => [plan, ...prev]);
                    setOpenNew(false);
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle>Data Plans</CardTitle>
              <CardDescription>Manage data plans and pricing.</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingPlans ? (
                <div className="p-6 text-sm text-muted-foreground">Loading plans...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Network</TableHead>
                      <TableHead>Plan Name</TableHead>
                      <TableHead>Price (User)</TableHead>
                      <TableHead>Price (API)</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {plans.filter(p => !p.type || p.type === 'data').map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.network}</TableCell>
                        <TableCell>{p.name}</TableCell>
                        <TableCell>₦{Number(p.priceUser || 0).toLocaleString()}</TableCell>
                        <TableCell>₦{Number(p.priceApi || 0).toLocaleString()}</TableCell>
                        <TableCell>
                          {p.active ? (
                            <Badge className="bg-emerald-500">Active</Badge>
                          ) : (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={async () => {
                              const priceUser = Number(prompt("New user price (₦)", String(p.priceUser)) || "");
                              const priceApi = Number(prompt("New API price (₦)", String(p.priceApi)) || "");
                              try {
                                const updated = await updatePlan(p.id, {
                                  priceUser: isNaN(priceUser) ? undefined : priceUser,
                                  priceApi: isNaN(priceApi) ? undefined : priceApi,
                                });
                                setPlans((prev) => prev.map((x) => (x.id === p.id ? updated : x)));
                                toast({ title: "Plan updated", description: `${updated.network} ${updated.name}` });
                              } catch (e: any) {
                                toast({ title: "Update failed", description: e.message || "Unable to update", variant: "destructive" });
                              }
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive"
                            onClick={async () => {
                              const confirmDelete = confirm(`Delete plan ${p.network} ${p.name}?`);
                              if (!confirmDelete) return;
                              try {
                                await deletePlan(p.id);
                                setPlans((prev) => prev.filter((x) => x.id !== p.id));
                                toast({ title: "Plan deleted", description: `${p.network} ${p.name}` });
                              } catch (e: any) {
                                toast({ title: "Delete failed", description: e.message || "Unable to delete", variant: "destructive" });
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cable Content */}
        <TabsContent value="cable" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={openNewCable} onOpenChange={setOpenNewCable}>
              <DialogTrigger asChild>
                <Button className="shadow-lg shadow-primary/20">
                  <Plus className="mr-2 h-4 w-4" /> Add Cable Plan
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[520px]">
                <DialogHeader>
                  <DialogTitle>Create Cable Plan</DialogTitle>
                </DialogHeader>
                <NewPlanForm
                  type="cable"
                  onCreated={(plan) => {
                    setPlans((prev) => [plan, ...prev]);
                    setOpenNewCable(false);
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle>Cable TV Packages</CardTitle>
              <CardDescription>Manage DSTV, GOTV, and Startimes packages.</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingPlans ? (
                <div className="p-6 text-sm text-muted-foreground">Loading plans...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Provider</TableHead>
                      <TableHead>Package Name</TableHead>
                      <TableHead>Price (User)</TableHead>
                      <TableHead>Price (API)</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {plans.filter(p => p.type === 'cable').map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.network}</TableCell>
                        <TableCell>{p.name}</TableCell>
                        <TableCell>₦{Number(p.priceUser || 0).toLocaleString()}</TableCell>
                        <TableCell>₦{Number(p.priceApi || 0).toLocaleString()}</TableCell>
                        <TableCell>
                          {p.active ? (
                            <Badge className="bg-emerald-500">Active</Badge>
                          ) : (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={async () => {
                              const priceUser = Number(prompt("New user price (₦)", String(p.priceUser)) || "");
                              const priceApi = Number(prompt("New API price (₦)", String(p.priceApi)) || "");
                              try {
                                const updated = await updatePlan(p.id, {
                                  priceUser: isNaN(priceUser) ? undefined : priceUser,
                                  priceApi: isNaN(priceApi) ? undefined : priceApi,
                                });
                                setPlans((prev) => prev.map((x) => (x.id === p.id ? updated : x)));
                                toast({ title: "Plan updated", description: `${updated.network} ${updated.name}` });
                              } catch (e: any) {
                                toast({ title: "Update failed", description: e.message || "Unable to update", variant: "destructive" });
                              }
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive"
                            onClick={async () => {
                              const confirmDelete = confirm(`Delete plan ${p.network} ${p.name}?`);
                              if (!confirmDelete) return;
                              try {
                                await deletePlan(p.id);
                                setPlans((prev) => prev.filter((x) => x.id !== p.id));
                                toast({ title: "Plan deleted", description: `${p.network} ${p.name}` });
                              } catch (e: any) {
                                toast({ title: "Delete failed", description: e.message || "Unable to delete", variant: "destructive" });
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Power Content */}
        <TabsContent value="electricity" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={openNewPower} onOpenChange={setOpenNewPower}>
              <DialogTrigger asChild>
                <Button className="shadow-lg shadow-primary/20">
                  <Plus className="mr-2 h-4 w-4" /> Add Power Company
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[520px]">
                <DialogHeader>
                  <DialogTitle>Create Power Company</DialogTitle>
                </DialogHeader>
                <NewPlanForm
                  type="electricity"
                  onCreated={(plan) => {
                    setPlans((prev) => [plan, ...prev]);
                    setOpenNewPower(false);
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle>Electricity Providers</CardTitle>
              <CardDescription>Manage electricity discos and fees.</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingPlans ? (
                <div className="p-6 text-sm text-muted-foreground">Loading plans...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Disco</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Price/Fee</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {plans.filter(p => p.type === 'electricity').map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.network}</TableCell>
                        <TableCell>{p.name}</TableCell>
                        <TableCell>₦{Number(p.priceUser || 0).toLocaleString()}</TableCell>
                        <TableCell>
                          {p.active ? (
                            <Badge className="bg-emerald-500">Active</Badge>
                          ) : (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={async () => {
                              const priceUser = Number(prompt("New fee (₦)", String(p.priceUser)) || "");
                              try {
                                const updated = await updatePlan(p.id, {
                                  priceUser: isNaN(priceUser) ? undefined : priceUser,
                                });
                                setPlans((prev) => prev.map((x) => (x.id === p.id ? updated : x)));
                                toast({ title: "Plan updated", description: `${updated.network} ${updated.name}` });
                              } catch (e: any) {
                                toast({ title: "Update failed", description: e.message || "Unable to update", variant: "destructive" });
                              }
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive"
                            onClick={async () => {
                              const confirmDelete = confirm(`Delete ${p.network}?`);
                              if (!confirmDelete) return;
                              try {
                                await deletePlan(p.id);
                                setPlans((prev) => prev.filter((x) => x.id !== p.id));
                                toast({ title: "Deleted", description: `${p.network}` });
                              } catch (e: any) {
                                toast({ title: "Delete failed", description: e.message || "Unable to delete", variant: "destructive" });
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EditServiceForm({ service, onSaved }: { service: any; onSaved: (srv: any) => void }) {
  const { toast } = useToast();
  const [name, setName] = useState(service?.name || "");
  const [icon, setIcon] = useState(service?.icon || "");
  const [category, setCategory] = useState(service?.category || "Other");
  const [saving, setSaving] = useState(false);
  return (
    <div className="space-y-4">
      <Label>Service Name</Label>
      <Input value={name} onChange={e => setName(e.target.value)} />
      <Label>Service ID</Label>
      <Input value={service?.id || ""} disabled />
      <Label>Icon URL</Label>
      <Input placeholder="https://..." value={icon} onChange={e => setIcon(e.target.value)} />
      <Label>Category Group</Label>
      <Select value={category} onValueChange={setCategory}>
        <SelectTrigger>
          <SelectValue placeholder="Select Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Airtime & Data">Airtime & Data</SelectItem>
          <SelectItem value="Data Plans">Data Plans</SelectItem>
          <SelectItem value="Cable TV">Cable TV</SelectItem>
          <SelectItem value="Electricity">Electricity</SelectItem>
          <SelectItem value="Exam PINs">Exam PINs</SelectItem>
          <SelectItem value="Internet">Internet</SelectItem>
          <SelectItem value="Betting">Betting</SelectItem>
          <SelectItem value="Other">Other</SelectItem>
        </SelectContent>
      </Select>
      <div className="flex justify-end pt-4">
        <Button
          disabled={saving}
          onClick={async () => {
            setSaving(true);
            try {
              await updateService(service.id, { name, icon, category });
              toast({ title: "Service Updated" });
              onSaved({ id: service.id, name, icon, category });
            } catch (e: any) {
              toast({ title: "Error", description: e.message, variant: "destructive" });
            } finally {
              setSaving(false);
            }
          }}
        >
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
function NewPlanForm({ onCreated, type = 'data' }: { onCreated: (plan: any) => void, type?: string }) {
  const { toast } = useToast();
  const [network, setNetwork] = useState("");
  const [name, setName] = useState("");
  const [priceUser, setPriceUser] = useState("");
  const [priceApi, setPriceApi] = useState("");
  const [active, setActive] = useState(true);
  const [variationId, setVariationId] = useState("");
  const [networkId, setNetworkId] = useState("");
  const [saving, setSaving] = useState(false);
  return (
    <div className="space-y-4">
      <Label>{type === 'electricity' ? 'Disco' : type === 'cable' ? 'Provider' : 'Network'}</Label>
      <Input placeholder={type === 'electricity' ? 'IKEDC / EKEDC' : type === 'cable' ? 'DSTV / GOTV' : 'MTN / Glo / Airtel / 9mobile'} value={network} onChange={e => setNetwork(e.target.value)} />
      <Label>{type === 'cable' ? 'Package Name' : 'Plan Name'}</Label>
      <Input placeholder={type === 'cable' ? 'DSTV Compact' : '1GB SME'} value={name} onChange={e => setName(e.target.value)} />
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Price (User)</Label>
          <Input type="number" placeholder="0" value={priceUser} onChange={e => setPriceUser(e.target.value)} />
        </div>
        <div>
          <Label>Price (API)</Label>
          <Input type="number" placeholder="0" value={priceApi} onChange={e => setPriceApi(e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Provider Variation ID</Label>
          <Input placeholder="e.g. 349" value={variationId} onChange={e => setVariationId(e.target.value)} />
        </div>
        <div>
          <Label>{type === 'electricity' ? 'Disco ID' : type === 'cable' ? 'Provider ID' : 'Network ID'}</Label>
          <Input type="number" placeholder={type === 'electricity' ? 'e.g. 1' : type === 'cable' ? 'e.g. 1' : '1=MTN,2=Glo,4=Airtel,3=9mobile'} value={networkId} onChange={e => setNetworkId(e.target.value)} />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Switch checked={active} onCheckedChange={setActive} />
        <Label>Active</Label>
      </div>
      <div className="flex justify-end">
        <Button
          disabled={saving}
          onClick={async () => {
            if (!network || !name || !priceUser || !priceApi || !variationId || !networkId) {
              toast({ title: "Missing fields", description: "Provide all fields including provider mapping", variant: "destructive" });
              return;
            }
            setSaving(true);
            try {
              const plan = await createPlan({ 
                network, 
                name, 
                priceUser: Number(priceUser), 
                priceApi: Number(priceApi), 
                active, 
                metadata: { 
                  variation_id: variationId, 
                  networkId: Number(networkId),
                  type: type
                } 
              });
              toast({ title: "Plan created", description: `${plan.network} ${plan.name}` });
              onCreated(plan);
              setNetwork(""); setName(""); setPriceUser(""); setPriceApi(""); setVariationId("");
            } catch (e: any) {
              toast({ title: "Creation failed", description: e.message || "Unable to create plan", variant: "destructive" });
            } finally {
              setSaving(false);
            }
          }}
        >
          {saving ? "Saving..." : "Create Plan"}
        </Button>
      </div>
    </div>
  );
}

function NewServiceForm({ onCreated }: { onCreated: (srv: any) => void }) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [id, setId] = useState("");
  const [icon, setIcon] = useState("");
  const [category, setCategory] = useState("Airtime & Data");
  const [saving, setSaving] = useState(false);

  return (
    <div className="space-y-4">
      <Label>Service Name</Label>
      <Input placeholder="e.g. MTN" value={name} onChange={e => {
         setName(e.target.value);
         if (!id) setId(e.target.value.toLowerCase().replace(/\s+/g, '-'));
      }} />
      
      <Label>Service ID (Slug)</Label>
      <Input placeholder="e.g. mtn-data" value={id} onChange={e => setId(e.target.value)} />

      <Label>Icon URL</Label>
      <Input placeholder="https://..." value={icon} onChange={e => setIcon(e.target.value)} />

      <Label>Category Group</Label>
      <Select value={category} onValueChange={setCategory}>
        <SelectTrigger>
          <SelectValue placeholder="Select Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Airtime & Data">Airtime & Data</SelectItem>
          <SelectItem value="Data Plans">Data Plans</SelectItem>
          <SelectItem value="Cable TV">Cable TV</SelectItem>
          <SelectItem value="Electricity">Electricity</SelectItem>
          <SelectItem value="Exam PINs">Exam PINs</SelectItem>
          <SelectItem value="Internet">Internet</SelectItem>
          <SelectItem value="Betting">Betting</SelectItem>
          <SelectItem value="Other">Other</SelectItem>
        </SelectContent>
      </Select>

      <div className="flex justify-end pt-4">
        <Button 
           disabled={saving}
           onClick={async () => {
             if (!name || !id) {
                toast({ title: "Required", description: "Name and ID are required", variant: "destructive" });
                return;
             }
             setSaving(true);
             try {
               const res = await createService({ name, id, icon, category });
               onCreated({ id: res.id, name, icon, category });
               toast({ title: "Service Created" });
               setName(""); setId(""); setIcon("");
             } catch(e: any) {
               toast({ title: "Error", description: e.message, variant: "destructive" });
             } finally {
               setSaving(false);
             }
           }}
        >
          {saving ? "Creating..." : "Create Service"}
        </Button>
      </div>
    </div>
  );
}
