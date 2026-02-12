'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState, useEffect, useRef } from 'react';
import { 
  MessageCircle, History, Send, Paperclip, 
  Image as ImageIcon, CheckCircle2, Check, CheckCheck,
  ChevronLeft, Plus, X, User, MessageSquare
} from 'lucide-react';
import { db, auth, storage } from '@/lib/firebase';
import { 
  collection, addDoc, query, where, getDocs, 
  orderBy, doc, runTransaction, onSnapshot, 
  serverTimestamp, updateDoc, limit
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useToast } from '@/components/ui/toast';
import { Badge } from '@/components/ui/badge';
import { createTicket, replyToTicket } from '@/lib/services';

export default function SupportPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [replies, setReplies] = useState<any[]>([]);
  const [replyMessage, setReplyMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [newTicketData, setNewTicketData] = useState({ subject: '', message: '' });
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [replies]);

  // Real-time tickets listener (ADMIN LOGIC STYLE)
  useEffect(() => {
    if (!db) return;
    
    let unsubscribe = () => {};
    const unsubAuth = auth.onAuthStateChanged((user) => {
      if (unsubscribe) unsubscribe();

      if (user) {
        console.log("Setting up ticket listener for user:", user.uid, user.email);
        const ticketsRef = collection(db, 'tickets');
        
        // Query by userId OR userEmail to ensure we fetch existing records
        const q = query(
          ticketsRef, 
          where('userId', 'in', [user.uid, user.email || ''])
        );

        unsubscribe = onSnapshot(q, (snap) => {
          const ticketList = snap.docs
            .filter(d => !d.data().deleted)
            .map(d => ({ id: d.id, ...d.data() }))
            .sort((a: any, b: any) => {
              const timeA = a.lastMessageAt?.seconds || 0;
              const timeB = b.lastMessageAt?.seconds || 0;
              return timeB - timeA;
            });
          
          console.log("Tickets update (Manual Sort):", ticketList.length);
          setTickets(ticketList);
          
          if (selectedTicket) {
            const updated = ticketList.find(t => t.id === selectedTicket.id);
            if (updated) setSelectedTicket(updated);
          }
        }, (error) => {
          console.error("Tickets listener error:", error);
          // Fallback query if 'in' fails
          const fallbackQ = query(ticketsRef, where('userId', '==', user.uid));
          onSnapshot(fallbackQ, (fSnap) => {
             const fList = fSnap.docs.map(d => ({ id: d.id, ...d.data() }));
             setTickets(fList);
          });
        });
      } else {
        setTickets([]);
      }
    });

    return () => {
      unsubAuth();
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Real-time replies listener (ADMIN LOGIC STYLE)
  useEffect(() => {
    if (!selectedTicket || !db) {
      setReplies([]);
      return;
    }

    const repliesRef = collection(db, 'tickets', selectedTicket.id, 'messages');
    const q = query(repliesRef, limit(100));

    const unsubscribe = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Sort on client side
      const sorted = data.sort((a: any, b: any) => {
        const getTime = (val: any) => {
          if (!val) return 0;
          if (typeof val === 'number') return val;
          if (typeof val === 'string') return new Date(val).getTime();
          if (val.toDate) return val.toDate().getTime();
          if (val.seconds) return val.seconds * 1000;
          return new Date(val).getTime() || 0;
        };
        return getTime(a.createdAt) - getTime(b.createdAt);
      });
      setReplies(sorted);
      
      const unreadAdminMessages = snap.docs.filter(d => d.data().sender === 'admin' && !d.data().read);
      unreadAdminMessages.forEach(d => {
        updateDoc(d.ref, { read: true }).catch(err => console.error("Update read error:", err));
      });
    }, (error) => {
      console.error("Replies listener error:", error);
    });

    return () => unsubscribe();
  }, [selectedTicket?.id]);

  const handleReply = async () => {
    if (!replyMessage.trim() || !selectedTicket || !auth.currentUser) return;
    
    setSendingReply(true);
    try {
      // Use backend API to send reply
      const result = await replyToTicket(selectedTicket.id, replyMessage);
      if (!result.success) {
        throw new Error(result.message);
      }
      
      setReplyMessage('');
      toast({ title: "Success", description: "Reply sent successfully" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, type: "destructive" });
    } finally {
      setSendingReply(false);
    }
  };

  const handleCreateTicket = async () => {
    if (!newTicketData.subject || !newTicketData.message || !auth.currentUser) return;
    
    setSubmitting(true);
    try {
      // Use backend API to create ticket - this is the single source of truth
      const result = await createTicket(newTicketData.subject, newTicketData.message);
      if (!result.success) {
        throw new Error(result.message);
      }
      
      toast({ title: "Success", description: "Ticket created successfully" });
      setNewTicketData({ subject: '', message: '' });
      setShowNewTicket(false);
      // The Firestore listener will automatically pick up the new ticket created by the backend
    } catch (e: any) {
      toast({ title: "Error", description: e.message, type: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0] || !selectedTicket) return;
    const file = e.target.files[0];
    setIsUploading(true);
    try {
      const storageRef = ref(storage, `support/${selectedTicket.id}/${Date.now()}-${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      await addDoc(collection(db, 'tickets', selectedTicket.id, 'messages'), {
        text: "Sent an attachment",
        attachmentUrl: url,
        attachmentName: file.name,
        sender: 'user',
        senderId: auth.currentUser.uid,
        senderEmail: auth.currentUser.email,
        createdAt: serverTimestamp(),
        read: false
      });
      await updateDoc(doc(db, 'tickets', selectedTicket.id), { 
        lastMessageAt: serverTimestamp(),
        lastMessage: "Sent an attachment",
        status: 'open'
      });
    } catch (e: any) {
      toast({ title: "Upload failed", description: e.message, type: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] bg-gray-50 overflow-hidden rounded-[2rem] border-none shadow-brand relative">
      <div className="tech-pattern absolute inset-0 opacity-[0.03] pointer-events-none" />
      <div className="flex items-center justify-between px-8 py-6 bg-white border-b z-20">
        <div>
          <h1 className="text-2xl font-black text-[#0B4F6C] flex items-center gap-3 tracking-tighter">
             <div className="p-2 bg-[#0B4F6C]/5 rounded-xl">
                <MessageSquare className="w-6 h-6 text-[#C58A17]" />
             </div>
             SUPPORT CENTER
          </h1>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mt-1.5 ml-11">Real-time Technical Assistance</p>
        </div>
        <Button 
          onClick={() => { setShowNewTicket(true); setSelectedTicket(null); }}
          className="bg-[#C58A17] hover:bg-[#A67513] font-black uppercase text-[10px] tracking-[0.2em] px-8 h-12 rounded-2xl shadow-2xl shadow-[#C58A17]/20 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4 mr-2" /> Launch Ticket
        </Button>
      </div>

      <div className="flex flex-grow overflow-hidden relative z-10">
        <div className={`w-full md:w-[380px] flex flex-col bg-white border-r border-gray-100 transition-all duration-300 ${selectedTicket || showNewTicket ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-6 border-b bg-gray-50/30">
            <div className="relative group">
              <History className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#0B4F6C] transition-colors" />
              <div className="pl-11 pr-4 py-3 bg-white border border-gray-100 rounded-2xl text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] shadow-inner">
                Communication Logs ({tickets.length})
              </div>
            </div>
          </div>
          
          <div className="flex-grow overflow-y-auto p-4 space-y-2">
            {tickets.map((t) => (
              <div 
                key={t.id} 
                onClick={() => { setSelectedTicket(t); setShowNewTicket(false); }}
                className={`group p-6 rounded-[2rem] cursor-pointer transition-all duration-500 border-2 relative ${
                  selectedTicket?.id === t.id 
                    ? 'bg-white border-[#0B4F6C] shadow-2xl shadow-[#0B4F6C]/10 scale-[1.02] z-10' 
                    : 'bg-white border-transparent hover:border-gray-100 hover:bg-gray-50/50'
                }`}
              >
                {t.status === 'open' && selectedTicket?.id !== t.id && (
                  <div className="absolute top-6 right-6 w-2.5 h-2.5 rounded-full bg-[#C58A17] animate-ping" />
                )}
                <div className="flex justify-between items-start mb-3">
                  <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">NODE: {t.id.slice(0,6)}</span>
                  <Badge className={`text-[9px] font-black h-6 uppercase px-3 border-none rounded-full ${
                    t.status === 'open' ? 'bg-[#C58A17] text-white shadow-lg shadow-[#C58A17]/20' : 
                    t.status === 'solved' ? 'bg-[#4CAF50] text-white shadow-lg shadow-[#4CAF50]/20' : 'bg-gray-400 text-white'
                  }`}>
                    {t.status}
                  </Badge>
                </div>
                <h4 className="text-base font-black text-[#0B4F6C] truncate mb-1 tracking-tight group-hover:text-[#C58A17] transition-colors">{t.subject}</h4>
                <p className="text-xs text-gray-400 line-clamp-1 font-medium italic">"{t.lastMessage}"</p>
                <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-50">
                  <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">
                    {t.lastMessageAt?.seconds ? new Date(t.lastMessageAt.seconds * 1000).toLocaleDateString(undefined, { day: '2-digit', month: 'short' }) : 'Real-time'}
                  </span>
                  <ChevronRight size={14} className="text-gray-200 group-hover:text-[#0B4F6C] transition-colors" />
                </div>
              </div>
            ))}
            {tickets.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 text-gray-300">
                <div className="w-20 h-20 bg-gray-50 rounded-[2rem] flex items-center justify-center mb-4">
                   <MessageCircle className="w-10 h-10 opacity-20" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em]">No Active Channels</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex-grow flex flex-col bg-[#F8FAFC] overflow-hidden relative">
          {showNewTicket ? (
            <div className="flex-grow flex items-center justify-center p-8 relative overflow-hidden bg-white">
              <div className="w-full max-w-lg bg-white p-12 rounded-[3.5rem] shadow-[0_32px_64px_-12px_rgba(11,79,108,0.1)] border border-gray-50 relative z-10">
                <div className="text-center mb-12">
                  <div className="w-24 h-24 bg-[#0B4F6C]/5 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 text-[#0B4F6C] shadow-inner group">
                     <Plus size={40} className="group-hover:rotate-90 transition-transform duration-500" />
                  </div>
                  <h2 className="text-4xl font-black text-[#0B4F6C] tracking-tighter uppercase leading-none">Initialize Ticket</h2>
                  <p className="text-[10px] font-black text-[#C58A17] uppercase tracking-[0.3em] mt-3 opacity-70">Security Protocol Activation</p>
                </div>
                <div className="space-y-6">
                  <div className="space-y-2.5">
                    <Label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Protocol Subject</Label>
                    <Input className="h-14 rounded-2xl bg-gray-50 border-transparent focus:border-[#0B4F6C]/20 focus:bg-white font-black text-[#0B4F6C] shadow-inner" value={newTicketData.subject} onChange={e => setNewTicketData({...newTicketData, subject: e.target.value})} placeholder="Issue summary..." />
                  </div>
                  <div className="space-y-2.5">
                    <Label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Detailed Context</Label>
                    <textarea className="w-full min-h-[120px] rounded-[2rem] border-transparent bg-gray-50 p-6 text-sm resize-none focus:border-[#0B4F6C]/20 focus:bg-white focus:outline-none transition-all font-medium text-gray-600 shadow-inner" value={newTicketData.message} onChange={e => setNewTicketData({...newTicketData, message: e.target.value})} placeholder="Describe technical requirements..." />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <Button variant="outline" className="flex-1 h-14 rounded-2xl font-black uppercase text-[10px] tracking-widest border-2" onClick={() => setShowNewTicket(false)}>Abort</Button>
                    <Button className="flex-[2] h-14 bg-[#0B4F6C] text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-2xl shadow-[#0B4F6C]/20" disabled={submitting} onClick={handleCreateTicket}>
                      {submitting ? 'PROCESSING...' : 'EXECUTE PROTOCOL'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : selectedTicket ? (
            <>
              <div className="bg-white border-b px-8 py-5 flex items-center justify-between z-10 shadow-sm">
                <div className="flex items-center gap-5">
                  <Button variant="ghost" size="icon" className="md:hidden rounded-xl" onClick={() => setSelectedTicket(null)}><ChevronLeft /></Button>
                  <div className="h-12 w-12 rounded-2xl bg-[#0B4F6C] flex items-center justify-center text-[#C58A17] shadow-lg shadow-[#0B4F6C]/20"><User size={24} /></div>
                  <div>
                    <h3 className="text-base font-black text-[#0B4F6C] uppercase tracking-tight">{selectedTicket.subject}</h3>
                    <p className="text-[10px] font-black text-[#C58A17] uppercase tracking-[0.2em]">ACTIVE PROTOCOL: {selectedTicket.id.slice(0,8)}</p>
                  </div>
                </div>
              </div>

              <div className="flex-grow overflow-y-auto p-8 space-y-6 bg-gray-50/50 relative">
                <div className="tech-pattern absolute inset-0 opacity-[0.02] pointer-events-none" />
                {replies.map((r, i) => (
                  <div key={r.id || i} className={`flex flex-col relative z-10 animate-in fade-in slide-in-from-bottom-2 ${r.sender === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`p-6 rounded-[2rem] shadow-xl max-w-[85%] relative border border-white/50 ${r.sender === 'user' ? 'bg-[#0B4F6C] text-white' : 'bg-white text-[#0B4F6C]'}`}>
                      <p className="text-sm font-medium leading-relaxed">{r.text}</p>
                      {r.attachmentUrl && (
                        <a href={r.attachmentUrl} target="_blank" rel="noreferrer" className={`mt-4 flex items-center gap-2 p-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${r.sender === 'user' ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-50 hover:bg-gray-100'}`}>
                          <Paperclip size={14} /> {r.attachmentName || 'FILE_NODE.DAT'}
                        </a>
                      )}
                      <div className={`flex justify-end items-center gap-2 mt-4 pt-3 border-t ${r.sender === 'user' ? 'border-white/10' : 'border-gray-50'}`}>
                        <span className={`text-[9px] font-black uppercase tracking-widest ${r.sender === 'user' ? 'opacity-60' : 'opacity-40'}`}>
                          {r.createdAt?.seconds ? new Date(r.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Syncing...'}
                        </span>
                        {r.sender === 'user' && (r.read ? <CheckCheck size={14} className="text-[#C58A17]" /> : <Check size={14} className="opacity-40" />)}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              <div className="p-6 bg-white border-t border-gray-100">
                <div className="flex items-center gap-4 max-w-5xl mx-auto">
                  <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                  <Button variant="ghost" size="icon" className="h-14 w-14 rounded-2xl bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-[#0B4F6C]" onClick={() => fileInputRef.current?.click()} disabled={isUploading}><Paperclip size={24} /></Button>
                  <textarea
                    className="flex-grow bg-gray-50 border-none rounded-[2rem] py-4 px-6 text-sm h-14 resize-none focus:bg-white focus:ring-2 focus:ring-[#0B4F6C]/10 transition-all font-medium text-gray-600 shadow-inner"
                    placeholder="Input technical query..."
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleReply(); } }}
                  />
                  <Button onClick={handleReply} disabled={!replyMessage.trim() || sendingReply} className="bg-[#0B4F6C] hover:bg-[#0D2B5D] rounded-[1.5rem] h-14 w-14 p-0 flex items-center justify-center shadow-2xl shadow-[#0B4F6C]/20 transition-all active:scale-90 group">
                    <Send size={24} className="text-[#C58A17] group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-grow flex flex-col items-center justify-center text-center p-12 relative">
              <div className="tech-pattern absolute inset-0 opacity-[0.02] pointer-events-none" />
              <div className="w-28 h-28 bg-white rounded-[3rem] shadow-2xl flex items-center justify-center mb-8 border border-gray-50 group hover:rotate-12 transition-transform duration-700">
                 <MessageSquare className="w-12 h-12 text-gray-200 group-hover:text-[#C58A17] transition-colors" />
              </div>
              <h3 className="text-2xl font-black text-[#0B4F6C] uppercase tracking-tighter">Initialize Communication</h3>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mt-3">Select active node from registry to proceed</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
