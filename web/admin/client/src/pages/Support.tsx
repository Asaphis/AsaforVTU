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
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      <Card className="border border-slate-200 bg-white rounded-2xl shadow-sm">
        <CardContent className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
              <ShieldCheck className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Support Center</h1>
              <p className="text-slate-500 font-medium text-sm">Real-time communication and broadcasts</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-slate-50 text-slate-600 border border-slate-200 px-3 py-1 text-[10px] font-bold uppercase tracking-wider">
              {tickets.filter(t => t.status === 'open').length} Active
            </Badge>
            <Badge className="bg-slate-50 text-slate-600 border border-slate-200 px-3 py-1 text-[10px] font-bold uppercase tracking-wider">
              {announcements.length} Broadcasts
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="tickets" className="space-y-6">
        <TabsList className="bg-white border border-slate-200 p-2 rounded-xl">
          <TabsTrigger value="tickets" className="rounded-lg px-6 h-10 text-[10px] font-bold uppercase tracking-wider data-[state=active]:bg-primary data-[state=active]:text-white">Tickets</TabsTrigger>
          <TabsTrigger value="announcements" className="rounded-lg px-6 h-10 text-[10px] font-bold uppercase tracking-wider data-[state=active]:bg-primary data-[state=active]:text-white">Announcements</TabsTrigger>
        </TabsList>

        <TabsContent value="tickets">
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="md:col-span-1 border border-slate-200 bg-white rounded-2xl overflow-hidden">
              <CardHeader className="p-6 pb-2">
                <CardTitle className="text-lg font-bold text-slate-900">Communication Archives</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {tickets.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTicket(t)}
                    className={`w-full text-left p-4 rounded-xl border transition-colors ${selectedTicket?.id === t.id ? 'border-primary bg-primary/5' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-sm font-bold text-slate-900 truncate">{t.subject || "Ticket"}</div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider">{t.userEmail}</div>
                      </div>
                      <Badge className={cn(
                        "px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border",
                        t.status === 'open' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                        t.status === 'replied' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                        'bg-emerald-50 text-emerald-600 border-emerald-100'
                      )}>
                        {t.status}
                      </Badge>
                    </div>
                    <div className="mt-2 text-xs text-slate-500 line-clamp-2">{t.lastMessage}</div>
                  </button>
                ))}
              </CardContent>
            </Card>

            <Card className="md:col-span-2 border border-slate-200 bg-white rounded-2xl overflow-hidden">
              {selectedTicket ? (
                <>
                  <CardHeader className="p-6 pb-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Button variant="ghost" size="icon" className="md:hidden rounded-lg text-slate-600 hover:bg-slate-100" onClick={() => setSelectedTicket(null)}>
                        <X className="w-5 h-5" />
                      </Button>
                      <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center">
                        <User className="w-5 h-5 text-slate-600" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900 leading-tight">{selectedTicket.subject}</h3>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider">{selectedTicket.userEmail}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedTicket.status !== 'solved' && (
                        <Button variant="outline" size="sm" onClick={() => markAsSolved(selectedTicket.id)} className="h-9 border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-[10px] px-4">
                          Mark Solved
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => deleteTicket(selectedTicket.id)} className="text-red-600 hover:bg-red-50 rounded-lg h-9 w-9">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>

                  <CardContent className="p-6 space-y-6 max-h-[48rem] overflow-y-auto">
                    {replies.map((r, i) => (
                      <div key={r.id || i} className={`flex ${r.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`p-4 rounded-xl max-w-[80%] ${r.sender === 'admin' ? 'bg-primary text-white' : 'bg-slate-50 border border-slate-200 text-slate-700'}`}>
                          <p className="text-sm font-medium">{r.text}</p>
                          <div className={`mt-2 text-[10px] ${r.sender === 'admin' ? 'text-white/80' : 'text-slate-500'}`}>
                            {r.createdAt?.seconds ? new Date(r.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </CardContent>

                  <div className="p-6 border-t border-slate-100">
                    <div className="relative group max-w-5xl">
                      <Textarea 
                        placeholder="Type a reply..." 
                        value={replyMsg}
                        onChange={(e) => setReplyMsg(e.target.value)}
                        className="min-h-[100px] bg-white border border-slate-200 rounded-xl text-sm text-slate-900 p-4 pr-14 resize-none placeholder:text-slate-400"
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
                        className="absolute bottom-3 right-3 h-10 w-10 rounded-lg bg-primary hover:bg-primary/90 text-white"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Select a ticket</h3>
                  <p className="text-sm text-slate-500">Choose a conversation to view and reply.</p>
                </div>
              )}
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="announcements">
          <Card className="border border-slate-200 bg-white rounded-2xl shadow-sm">
            <CardHeader className="p-6 pb-3 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Broadcast Hub</h2>
                <p className="text-slate-500 font-medium text-sm">Post announcements to all users</p>
              </div>
              <Dialog open={openAnnouncement} onOpenChange={setOpenAnnouncement}>
                <DialogTrigger asChild>
                  <Button className="bg-primary hover:bg-primary/90 text-white font-bold rounded-xl px-6 h-10">
                    <Plus className="w-4 h-4 mr-2" /> New Announcement
                  </Button>
                </DialogTrigger>
                <DialogContent className="rounded-xl bg-white border border-slate-200 p-6">
                  <DialogHeader><DialogTitle className="text-lg font-bold">Create Announcement</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Title</Label>
                      <Input value={newAnn.title} onChange={e => setNewAnn({...newAnn, title: e.target.value})} placeholder="Maintenance notice" />
                    </div>
                    <div className="space-y-2">
                      <Label>Content</Label>
                      <Textarea className="min-h-[140px]" value={newAnn.content} onChange={e => setNewAnn({...newAnn, content: e.target.value})} placeholder="Details..." />
                    </div>
                    <div className="flex justify-end">
                      <Button onClick={handleCreateAnn}>Publish</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {announcements.map((ann) => (
                  <Card key={ann.id} className="border border-slate-200 bg-white rounded-xl">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center">
                            <Megaphone className="w-5 h-5 text-orange-500" />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-900">{ann.title}</div>
                            <div className="text-[10px] text-slate-500 uppercase tracking-wider">
                              {ann.createdAt?.seconds ? new Date(ann.createdAt.seconds * 1000).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                            </div>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteAnn(ann.id)} className="text-red-600 hover:bg-red-50 rounded-lg h-9 w-9">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="mt-4 text-sm text-slate-700 leading-relaxed">{ann.content}</p>
                    </CardContent>
                  </Card>
                ))}
                {announcements.length === 0 && (
                  <div className="md:col-span-2 p-12 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50">
                    <Megaphone className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm text-slate-500">No announcements yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
