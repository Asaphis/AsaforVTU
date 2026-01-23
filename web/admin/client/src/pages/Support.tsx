import { collection, query, orderBy, onSnapshot, doc, updateDoc, addDoc, serverTimestamp, deleteDoc } from "firebase/firestore";
import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, Megaphone, Trash2, Send, History, CheckCheck, Check, User, ShieldCheck, Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { getAnnouncements, createAnnouncement, deleteAnnouncement, db } from "@/lib/backend";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SupportPage() {
  const { toast } = useToast();
  const [tickets, setTickets] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openAnnouncement, setOpenAnnouncement] = useState(false);
  const [newAnn, setNewAnn] = useState({ title: '', content: '', type: 'info' });
  const [replies, setReplies] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [replyMsg, setReplyMsg] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [replies]);

  const loadData = async () => {
    setLoading(true);
    try {
      const anns = await getAnnouncements();
      setAnnouncements(anns || []);
    } catch (e: any) {
      console.error("Load announcements error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!db) {
      console.error("Firebase DB is not initialized");
      return;
    }
    
    try {
      const ticketsRef = collection(db, 'tickets');
      const q = query(ticketsRef, orderBy('lastMessageAt', 'desc'));
      
      const unsubscribe = onSnapshot(q, (snap: any) => {
        const ticketList = snap.docs.filter((d: any) => !d.data().deleted).map((d: any) => ({ id: d.id, ...d.data() }));
        setTickets(ticketList);
        
        if (selectedTicket) {
          const updated = ticketList.find((t: any) => t.id === selectedTicket.id);
          if (updated) setSelectedTicket(updated);
        }
      }, (err: any) => {
        console.error("Tickets listener error:", err);
      });

      return () => unsubscribe();
    } catch (e) {
      console.error("Failed to setup tickets listener:", e);
    }
  }, [selectedTicket?.id]);

  useEffect(() => {
    if (!selectedTicket || !db) {
      setReplies([]);
      return;
    }

    try {
      const repliesRef = collection(db, 'tickets', selectedTicket.id, 'messages');
      const q = query(repliesRef, orderBy('createdAt', 'asc'));
      
      const unsubscribe = onSnapshot(q, (snap: any) => {
        const replyList = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
        setReplies(replyList);
        
        const unreadReplies = snap.docs.filter((d: any) => d.data().sender === 'user' && !d.data().read);
        unreadReplies.forEach((d: any) => {
          updateDoc(d.ref, { read: true }).catch((e: any) => console.error("Update read status error:", e));
        });
      }, (err: any) => {
        console.error("Replies listener error:", err);
      });

      return () => unsubscribe();
    } catch (e) {
      console.error("Failed to setup replies listener:", e);
    }
  }, [selectedTicket?.id]);

  useEffect(() => { loadData(); }, []);

  const handleReply = async (id: string) => {
    if (!replyMsg.trim()) return;
    try {
      const ticketRef = doc(db, 'tickets', id);
      const replyRef = collection(ticketRef, 'messages');
      
      const replyObj = {
        text: replyMsg,
        sender: 'admin',
        createdAt: serverTimestamp(),
        read: false
      };
      
      await addDoc(replyRef, replyObj);
      await updateDoc(ticketRef, { 
        status: 'open',
        lastMessage: replyMsg,
        lastMessageAt: serverTimestamp()
      });

      toast({ title: "Success", description: "Reply sent" });
      setReplyMsg('');
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const markAsSolved = async (id: string) => {
    try {
      const ticketRef = doc(db, 'tickets', id);
      await updateDoc(ticketRef, { 
        status: 'solved', 
        lastMessageAt: serverTimestamp()
      });
      toast({ title: "Ticket Marked as Solved" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const deleteTicket = async (id: string) => {
    if (!confirm("Are you sure you want to delete this ticket?")) return;
    try {
      const ticketRef = doc(db, 'tickets', id);
      await updateDoc(ticketRef, { deleted: true });
      setSelectedTicket(null);
      toast({ title: "Ticket Deleted" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleCreateAnn = async () => {
    if (!newAnn.title || !newAnn.content) return;
    try {
      await createAnnouncement(newAnn);
      toast({ title: "Success", description: "Announcement posted" });
      setOpenAnnouncement(false);
      setNewAnn({ title: '', content: '', type: 'info' });
      loadData();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleDeleteAnn = async (id: string) => {
    if (!confirm("Delete this announcement?")) return;
    try {
      await deleteAnnouncement(id);
      toast({ title: "Success", description: "Announcement deleted" });
      loadData();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-8 pb-8">
      <div className="flex items-center justify-between p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3 tracking-tight">
             <ShieldCheck className="w-7 h-7 text-primary" />
             Support Center
          </h1>
          <p className="text-slate-500 font-medium mt-1">Real-time communication and announcements.</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge className="bg-emerald-50 text-emerald-600 border border-emerald-100 px-3 py-1.5 font-bold text-[10px] rounded-xl uppercase tracking-wider">
            {tickets.filter(t => t.status === 'open').length} Active Traces
          </Badge>
          <Badge className="bg-orange-50 text-orange-600 border border-orange-100 px-3 py-1.5 font-bold text-[10px] rounded-xl uppercase tracking-wider">
            {announcements.length} Signal Broadcasts
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="tickets" className="space-y-4">
        <div className="px-0">
          <TabsList className="bg-white border border-slate-200 p-1.5 rounded-xl">
            <TabsTrigger value="tickets" className="rounded-lg px-4 h-9 text-xs font-bold uppercase tracking-wider data-[state=active]:bg-slate-100 transition-all">Support Traces</TabsTrigger>
            <TabsTrigger value="announcements" className="rounded-lg px-4 h-9 text-xs font-bold uppercase tracking-wider data-[state=active]:bg-slate-100 transition-all">Broadcast Hub</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="tickets" className="m-0">
          <div className="flex w-full overflow-hidden relative">
            <div className={`w-full md:w-[400px] flex flex-col bg-white border-r border-slate-100 z-10 transition-all duration-300 ${selectedTicket ? 'hidden md:flex' : 'flex'}`}>
              <div className="p-6 border-b border-slate-100 bg-white">
                <div className="relative group">
                  <History className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                  <div className="pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Communication Archives
                  </div>
                </div>
              </div>
              
              <div className="flex-grow overflow-y-auto no-scrollbar p-4 space-y-3">
                {tickets.map((t) => (
                  <div 
                    key={t.id} 
                    onClick={() => setSelectedTicket(t)}
                    className={`group p-6 rounded-[2rem] cursor-pointer transition-all duration-500 border-2 relative overflow-hidden ${
                      selectedTicket?.id === t.id 
                        ? 'bg-white/10 border-primary shadow-[0_20px_40px_-15px_rgba(0,0,0,0.4)] scale-[1.02] z-10' 
                        : 'bg-white/5 border-transparent hover:border-white/10 hover:bg-white/[0.08]'
                    }`}
                  >
                    {t.status === 'open' && selectedTicket?.id !== t.id && (
                      <div className="absolute top-6 right-6 w-2.5 h-2.5 rounded-full bg-primary animate-pulse shadow-[0_0_12px_rgba(var(--primary),0.6)]" />
                    )}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex flex-col">
                        <span className="text-[11px] font-black text-primary uppercase tracking-tighter truncate max-w-[180px] mb-1 italic">{t.userEmail}</span>
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">TRACE_ID: {t.id.slice(0,8)}</span>
                      </div>
                      <Badge className={cn(
                        "text-[9px] font-black h-6 uppercase px-3 border-0 shadow-lg",
                        t.status === 'open' ? 'bg-red-500/20 text-red-400 ring-1 ring-red-500/30' : 
                        t.status === 'replied' ? 'bg-primary/20 text-primary ring-1 ring-primary/30' : 
                        'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30'
                      )}>
                        {t.status}
                      </Badge>
                    </div>
                    <h4 className="text-sm font-black text-white truncate mb-2 tracking-tight group-hover:text-primary transition-colors">{t.subject || "Untitled Session"}</h4>
                    <p className="text-xs text-slate-400 line-clamp-2 font-medium leading-relaxed italic border-l-2 border-white/10 pl-4">{t.lastMessage}</p>
                      <div className="flex justify-between items-center mt-5 pt-4 border-t border-white/5">
                      <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em]">
                        {t.lastMessageAt?.seconds ? new Date(t.lastMessageAt.seconds * 1000).toLocaleDateString() : 'INITIALIZING'}
                      </span>
                      <div className="flex items-center gap-1.5 opacity-40">
                         <div className={`w-1.5 h-1.5 rounded-full ${t.status === 'open' ? 'bg-red-500' : 'bg-slate-700'}`} />
                         <span className="text-[8px] font-black text-slate-500 uppercase">NODE ACTIVE</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Area - Chat Content */}
            <div className={`flex-grow flex flex-col bg-[#0F172A] overflow-hidden transition-all duration-300 relative ${!selectedTicket ? 'hidden md:flex' : 'flex'}`}>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(var(--primary),0.05),transparent_70%)] pointer-events-none" />
              
              {selectedTicket ? (
                <>
                  {/* Chat Header */}
                  <div className="bg-white/5 backdrop-blur-xl border-b border-white/10 px-8 py-5 flex items-center justify-between z-10 shadow-2xl relative">
                    <div className="flex items-center gap-5">
                      <Button variant="ghost" size="icon" className="md:hidden rounded-2xl bg-white/5 border border-white/10 text-white" onClick={() => setSelectedTicket(null)}>
                        <X className="w-5 h-5" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteTicket(selectedTicket.id)} className="text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-2xl h-12 w-12 border border-white/5">
                        <Trash2 className="w-5 h-5" />
                      </Button>
                      <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center text-white shadow-2xl shadow-primary/30 ring-1 ring-white/20">
                        <User className="w-7 h-7" />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-white leading-tight tracking-tight italic">{selectedTicket.subject}</h3>
                        <p className="text-[11px] font-black text-primary truncate max-w-[200px] mt-1 uppercase tracking-widest opacity-80">{selectedTicket.userEmail}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {selectedTicket.status !== 'solved' && (
                        <Button variant="outline" size="sm" onClick={() => markAsSolved(selectedTicket.id)} className="h-10 border-0 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-black text-[10px] px-6 uppercase tracking-widest shadow-xl shadow-emerald-500/20 transition-all hover:scale-105">
                          Resolve Session
                        </Button>
                      )}
                      <div className="px-4 py-2 bg-white/5 rounded-xl text-[9px] font-black text-slate-500 uppercase tracking-widest border border-white/5">
                        X_HASH: {selectedTicket.id.slice(0, 12)}
                      </div>
                    </div>
                  </div>

                  <div className="flex-grow overflow-y-auto no-scrollbar p-8 space-y-8 bg-transparent relative scroll-smooth z-0">
                    {replies.map((r, i) => (
                      <div key={r.id || i} className={`flex flex-col ${r.sender === 'admin' ? 'items-end ml-auto' : 'items-start'} max-w-[85%] md:max-w-[70%]`}>
                        <div className={`p-6 rounded-[2.5rem] shadow-2xl relative transition-all duration-500 hover:scale-[1.01] ${
                          r.sender === 'admin' 
                            ? 'bg-gradient-to-br from-primary to-indigo-600 text-white rounded-tr-none shadow-primary/20 ring-1 ring-white/20' 
                            : 'bg-white/10 backdrop-blur-xl border border-white/10 text-slate-200 rounded-tl-none ring-1 ring-white/5'
                        }`}>
                          <p className="text-sm font-bold leading-relaxed tracking-wide">{r.text}</p>
                          <div className="flex justify-end items-center gap-3 mt-4 pt-3 border-t border-white/10">
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-50">
                              {r.createdAt?.seconds ? new Date(r.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'TRANSMITTING...'}
                            </span>
                            {r.sender === 'admin' && (
                              r.read ? <CheckCheck className="h-4 w-4 text-white/60" /> : <Check className="h-4 w-4 text-white/30" />
                            )}
                          </div>
                        </div>
                        <div className={`mt-2.5 text-[8px] font-black uppercase tracking-[0.3em] ${r.sender === 'admin' ? 'text-primary mr-5' : 'text-slate-500 ml-5'}`}>
                          {r.sender === 'admin' ? 'ADMIN_NODE_01' : 'USER_TERMINAL'}
                        </div>
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Chat Input */}
                  <div className="p-8 bg-white/5 backdrop-blur-xl border-t border-white/10 z-10 relative">
                    <div className="relative group max-w-5xl mx-auto">
                      <Textarea 
                        placeholder="Type a professional neural response..." 
                        value={replyMsg}
                        onChange={(e) => setReplyMsg(e.target.value)}
                        className="min-h-[120px] bg-white/5 border-2 border-white/5 focus:border-primary/40 focus:bg-white/10 rounded-[2rem] text-sm font-bold text-white p-6 pr-20 transition-all resize-none shadow-3xl placeholder:text-slate-600 outline-none"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleReply(selectedTicket.id);
                          }
                        }}
                      />
                      <Button 
                        size="icon" 
                        onClick={() => handleReply(selectedTicket.id)} 
                        disabled={!replyMsg.trim()} 
                        className="absolute bottom-6 right-6 h-14 w-14 rounded-2xl bg-primary hover:bg-primary/90 shadow-2xl shadow-primary/40 disabled:opacity-20 disabled:shadow-none transition-all flex items-center justify-center group-hover:scale-110 active:scale-95 border-0"
                      >
                        <Send className="h-6 w-6 text-white" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-grow flex flex-col items-center justify-center text-center p-12 bg-transparent">
                  <div className="h-32 w-32 rounded-[2.5rem] bg-white/5 border border-white/10 flex items-center justify-center mb-8 shadow-3xl animate-pulse">
                    <MessageSquare className="h-16 w-16 text-primary opacity-40" />
                  </div>
                  <h3 className="text-2xl font-black text-white mb-3 uppercase tracking-tighter italic">Support Matrix</h3>
                  <p className="text-[10px] max-w-[320px] leading-relaxed text-slate-500 font-black uppercase tracking-[0.3em] opacity-60">Establish a neural link with a user session to begin communication protocols.</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="announcements" className="flex-grow flex flex-col overflow-hidden m-0 p-10 bg-transparent relative">
          <div className="max-w-6xl mx-auto w-full space-y-10 z-10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic">Global Signals</h2>
                <p className="text-slate-500 font-medium text-sm mt-1">Universal broadcast protocols for ecosystem-wide synchronization.</p>
              </div>
              <Dialog open={openAnnouncement} onOpenChange={setOpenAnnouncement}>
                <DialogTrigger asChild>
                  <Button className="bg-primary hover:bg-primary/90 text-white font-black rounded-2xl px-8 h-14 shadow-2xl shadow-primary/30 uppercase tracking-widest text-[11px] gap-3 transition-all hover:scale-105 active:scale-95 border-0 italic">
                    <Plus className="w-5 h-5" /> Initiate Broadcast
                  </Button>
                </DialogTrigger>
                <DialogContent className="rounded-[2.5rem] bg-slate-900 border-white/10 shadow-3xl p-10 text-white">
                  <DialogHeader><DialogTitle className="text-3xl font-black italic tracking-tighter">INITIATE BROADCAST</DialogTitle></DialogHeader>
                  <div className="space-y-8 py-6">
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2">Signal Subject</Label>
                      <Input className="h-14 rounded-2xl bg-white/5 border-2 border-white/5 focus:border-primary/40 focus:bg-white/10 transition-all font-black text-white text-lg px-6 outline-none" value={newAnn.title} onChange={e => setNewAnn({...newAnn, title: e.target.value})} placeholder="e.g. CORE_MAINTENANCE" />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2">Broadcast Payload</Label>
                      <Textarea className="min-h-[200px] rounded-[2rem] bg-white/5 border-2 border-white/5 focus:border-primary/40 focus:bg-white/10 transition-all font-bold text-slate-300 resize-none p-6 outline-none text-base" value={newAnn.content} onChange={e => setNewAnn({...newAnn, content: e.target.value})} placeholder="Input transmission data..." />
                    </div>
                    <Button className="w-full h-16 bg-primary hover:bg-primary/90 text-white font-black rounded-2xl shadow-2xl shadow-primary/40 uppercase tracking-[0.2em] text-xs mt-4 border-0 italic transition-all hover:scale-[1.02] active:scale-[0.98]" onClick={handleCreateAnn}>TRANSMIT_TO_ALL_NODES</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {announcements.map((ann) => (
                <Card key={ann.id} className="border-0 shadow-3xl bg-white/5 backdrop-blur-xl hover:bg-white/[0.08] transition-all duration-500 rounded-[2.5rem] group relative ring-1 ring-white/10 overflow-hidden">
                  <CardContent className="p-8">
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-5">
                        <div className="h-14 w-14 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shadow-2xl shadow-orange-500/10 group-hover:scale-110 transition-all duration-500">
                          <Megaphone className="w-7 h-7 text-orange-400" />
                        </div>
                        <div>
                          <h3 className="text-xl font-black text-white leading-tight tracking-tight italic">{ann.title}</h3>
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] mt-2 italic">
                            {ann.createdAt?.seconds ? new Date(ann.createdAt.seconds * 1000).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'ESTABLISHING...'}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteAnn(ann.id)} className="text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-2xl h-12 w-12 border border-white/5 opacity-0 group-hover:opacity-100 transition-all">
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </div>
                    <p className="text-base font-bold text-slate-300 leading-relaxed bg-white/5 p-6 rounded-[1.5rem] border border-white/5 italic shadow-inner">
                      {ann.content}
                    </p>
                    <div className="mt-6 flex justify-end">
                      <div className="px-4 py-1.5 rounded-full bg-white/5 border border-white/5 text-[8px] font-black text-slate-500 uppercase tracking-[0.4em]">Signal Verified</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {announcements.length === 0 && (
                <div className="md:col-span-2 flex flex-col items-center justify-center py-32 bg-white/5 backdrop-blur-xl rounded-[3rem] border-2 border-dashed border-white/10 shadow-3xl">
                  <div className="h-24 w-24 rounded-full bg-white/5 flex items-center justify-center mb-8 animate-pulse">
                    <Megaphone className="w-12 h-12 text-slate-600 opacity-20" />
                  </div>
                  <p className="text-sm font-black text-slate-500 uppercase tracking-[0.4em] italic opacity-60">No Signal Broadcasts Active</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
