import { getAnnouncements, getTickets, replyTicket, getTicketMessages, updateTicketStatus, deleteTicketAdmin } from "@/lib/backend";
import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, Megaphone, Trash2, Send, History, CheckCheck, Check, User, ShieldCheck, Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { createAnnouncement, deleteAnnouncement } from "@/lib/backend";
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

  const loadData = async () => {
    try {
      const [ticketsData, annsData] = await Promise.all([
        getTickets(),
        getAnnouncements()
      ]);
      setTickets(Array.isArray(ticketsData) ? ticketsData : []);
      setAnnouncements(Array.isArray(annsData) ? annsData : []);
    } catch (e) {
      console.error("Load error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Refresh data every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedTicket?.id) {
      const load = async () => {
        try {
          const msgs = await getTicketMessages(selectedTicket.id);
          setReplies(Array.isArray(msgs) ? msgs : []);
        } catch (e) {
          console.error("Replies load error:", e);
        }
      };
      load();
      const interval = setInterval(load, 3000);
      return () => clearInterval(interval);
    }
  }, [selectedTicket?.id]);

  useEffect(() => {
    if (replies.length > 0) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [replies]);

  const handleReply = async (id: string) => {
    if (!replyMsg.trim()) return;
    try {
      await replyTicket(id, replyMsg);
      toast({ title: "Success", description: "Reply sent" });
      setReplyMsg('');
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const markAsSolved = async (id: string) => {
    try {
      await updateTicketStatus(id, 'resolved');
      toast({ title: "Success", description: "Ticket marked as resolved" });
      loadData();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const deleteTicket = async (id: string) => {
    if (!confirm("Are you sure you want to delete this ticket?")) return;
    try {
      await deleteTicketAdmin(id);
      toast({ title: "Success", description: "Ticket deleted" });
      loadData();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleCreateAnnouncement = async () => {
    if (!newAnn.title || !newAnn.content) {
      toast({ title: "Error", description: "Title and content are required", variant: "destructive" });
      return;
    }
    try {
      await createAnnouncement(newAnn);
      toast({ title: "Success", description: "Announcement created" });
      setNewAnn({ title: '', content: '', type: 'info' });
      setOpenAnnouncement(false);
      loadData();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!confirm("Are you sure you want to delete this announcement?")) return;
    try {
      await deleteAnnouncement(id);
      toast({ title: "Success", description: "Announcement deleted" });
      loadData();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Support Center</h1>
        <Dialog open={openAnnouncement} onOpenChange={setOpenAnnouncement}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Announcement
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Announcement</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Title</Label>
                <Input 
                  value={newAnn.title}
                  onChange={(e) => setNewAnn({ ...newAnn, title: e.target.value })}
                  placeholder="Announcement title"
                />
              </div>
              <div>
                <Label>Content</Label>
                <Textarea 
                  value={newAnn.content}
                  onChange={(e) => setNewAnn({ ...newAnn, content: e.target.value })}
                  placeholder="Announcement content"
                  rows={4}
                />
              </div>
              <Button onClick={handleCreateAnnouncement}>Create</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="tickets">
        <TabsList>
          <TabsTrigger value="tickets">
            <MessageSquare className="mr-2 h-4 w-4" />
            Tickets
          </TabsTrigger>
          <TabsTrigger value="announcements">
            <Megaphone className="mr-2 h-4 w-4" />
            Announcements
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tickets">
          <div className="space-y-4">
            {tickets.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  No tickets yet
                </CardContent>
              </Card>
            ) : (
              tickets.map((ticket) => (
                <Card key={ticket.id} className={selectedTicket?.id === ticket.id ? "border-primary" : ""}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{ticket.subject}</CardTitle>
                      <Badge variant={ticket.status === 'resolved' ? 'default' : 'secondary'}>
                        {ticket.status}
                      </Badge>
                    </div>
                    <CardDescription className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {ticket.email || 'Unknown'}
                      <span>•</span>
                      {new Date(ticket.created_at).toLocaleString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedTicket(ticket)}
                      >
                        <History className="mr-2 h-4 w-4" />
                        View Messages
                      </Button>
                      {ticket.status !== 'resolved' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => markAsSolved(ticket.id)}
                        >
                          <CheckCheck className="mr-2 h-4 w-4" />
                          Mark Solved
                        </Button>
                      )}
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => deleteTicket(ticket.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="announcements">
          <div className="space-y-4">
            {announcements.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  No announcements yet
                </CardContent>
              </Card>
            ) : (
              announcements.map((ann) => (
                <Card key={ann.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{ann.title}</CardTitle>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => handleDeleteAnnouncement(ann.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <CardDescription>
                      {new Date(ann.created_at).toLocaleString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p>{ann.content}</p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {selectedTicket && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Messages: {selectedTicket.subject}</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setSelectedTicket(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
              {replies.map((reply) => (
                <div 
                  key={reply.id} 
                  className={`p-3 rounded-lg ${reply.is_admin ? 'bg-blue-50 ml-8' : 'bg-gray-50'}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <ShieldCheck className={reply.is_admin ? "text-blue-600" : "text-gray-500"} />
                    <span className="font-medium">
                      {reply.is_admin ? 'Admin' : 'User'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(reply.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p>{reply.message}</p>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <div className="flex gap-2">
              <Textarea
                value={replyMsg}
                onChange={(e) => setReplyMsg(e.target.value)}
                placeholder="Type your reply..."
                rows={2}
              />
              <Button onClick={() => handleReply(selectedTicket.id)}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
