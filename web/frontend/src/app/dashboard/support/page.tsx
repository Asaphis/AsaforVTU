'use client';

/* Ferixas support workspace: a compact two-pane ticket desk with live replies and attachments. */
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, Paperclip, Plus, User, MessageSquare, FileText } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { createTicket, replyToTicket, getTicketMessages, getTickets } from '@/lib/services';

const attachmentTypes = 'image/jpeg,image/png,image/webp,image/gif,application/pdf,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,video/mp4,video/webm,video/quicktime';

export default function SupportPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [replies, setReplies] = useState<any[]>([]);
  const [replyMessage, setReplyMessage] = useState('');
  const [replyFiles, setReplyFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const { toast } = useToast();
  const chatEndRef = useRef<HTMLDivElement>(null);

  const loadTickets = async () => {
    try { setTickets(await getTickets()); }
    catch (error) { console.error('Failed to load tickets:', error); }
  };
  const loadTicketMessages = async (ticketId: string) => {
    try { setReplies(await getTicketMessages(ticketId)); }
    catch (error) { console.error('Failed to load messages:', error); }
  };
  useEffect(() => { loadTickets(); }, []);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [replies]);

  const handleCreateTicket = async () => {
    if (!subject || !message) { toast({ type: 'destructive', title: 'Details required', description: 'Add a subject and message.' }); return; }
    setSubmitting(true);
    try { await createTicket(subject, message); toast({ type: 'default', title: 'Ticket created', description: 'Our team can now review your request.' }); setSubject(''); setMessage(''); await loadTickets(); }
    catch (error: any) { toast({ type: 'destructive', title: 'Unable to create ticket', description: error.message }); }
    finally { setSubmitting(false); }
  };
  const handleReply = async () => {
    if ((!replyMessage && !replyFiles.length) || !selectedTicket) return;
    setSendingReply(true);
    try { await replyToTicket(selectedTicket.id, replyMessage, replyFiles); toast({ type: 'default', title: 'Reply sent', description: 'Your message has been added to the ticket.' }); setReplyMessage(''); setReplyFiles([]); await loadTicketMessages(selectedTicket.id); await loadTickets(); }
    catch (error: any) { toast({ type: 'destructive', title: 'Unable to send reply', description: error.message }); }
    finally { setSendingReply(false); }
  };
  const handleSelectTicket = (ticket: any) => { setSelectedTicket(ticket); loadTicketMessages(ticket.id); };

  return <main className="space-y-5 pb-24 lg:pb-8"><section><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#718096]">Support</p><h1 className="mt-1 text-2xl font-extrabold tracking-tight text-[#012044]">How can we help?</h1><p className="mt-1 text-sm text-[#718096]">Open a ticket and continue the conversation here.</p></section><div className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]"><aside className="space-y-4"><section className="rounded-2xl border border-[#E8EDF2] bg-white p-4"><div className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-lg bg-[#F3FAFC] text-[#036A97]"><Plus size={16} /></span><p className="font-extrabold text-[#012044]">New ticket</p></div><div className="mt-4 space-y-3"><div><Label htmlFor="ticket-subject" className="text-xs font-bold text-[#012044]">Subject</Label><Input id="ticket-subject" value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="What do you need help with?" className="mt-1.5 border-[#E8EDF2] focus-visible:ring-[#036A97]" /></div><div><Label htmlFor="ticket-message" className="text-xs font-bold text-[#012044]">Message</Label><textarea id="ticket-message" rows={4} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Share the details…" className="mt-1.5 w-full resize-none rounded-xl border border-[#E8EDF2] bg-white p-3 text-sm text-[#012044] outline-none placeholder:text-[#718096] focus:border-[#036A97] focus:ring-2 focus:ring-[#036A97]/10" /></div><Button onClick={handleCreateTicket} disabled={submitting} className="w-full rounded-xl bg-[#036A97] font-bold text-white hover:bg-[#012044]">{submitting ? 'Creating ticket…' : 'Create ticket'}</Button></div></section><section className="overflow-hidden rounded-2xl border border-[#E8EDF2] bg-white"><div className="flex items-center justify-between border-b border-[#E8EDF2] px-4 py-3"><p className="font-extrabold text-[#012044]">Your tickets</p><span className="rounded-full bg-[#FFF7F4] px-2 py-0.5 text-xs font-bold text-[#718096]">{tickets.length}</span></div><div className="max-h-[360px] overflow-y-auto p-2">{tickets.length === 0 ? <p className="p-3 text-sm text-[#718096]">No tickets yet.</p> : tickets.map((ticket) => <button key={ticket.id} onClick={() => handleSelectTicket(ticket)} className={`mb-1 w-full rounded-xl p-3 text-left transition ${selectedTicket?.id === ticket.id ? 'bg-[#F3FAFC] ring-1 ring-[#036A97]/15' : 'hover:bg-[#FFF7F4]'}`}><p className="truncate text-sm font-bold text-[#012044]">{ticket.subject}</p><p className="mt-1 text-xs text-[#718096]">{ticket.created_at ? new Date(ticket.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' }) : 'Support ticket'}</p></button>)}</div></section></aside><section className="flex min-h-[520px] flex-col overflow-hidden rounded-2xl border border-[#E8EDF2] bg-white">{selectedTicket ? <><header className="flex items-center justify-between border-b border-[#E8EDF2] px-4 py-4 sm:px-5"><div className="min-w-0"><p className="text-xs font-bold uppercase tracking-[0.12em] text-[#718096]">Support ticket</p><h2 className="mt-0.5 truncate text-base font-extrabold text-[#012044]">{selectedTicket.subject}</h2></div><span className="inline-flex items-center gap-1 rounded-full bg-[#EAF5C7] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#416000]"><MessageCircle size={12} />Open</span></header><div className="flex-1 space-y-3 overflow-y-auto bg-[#FFFDFB] p-4 sm:p-5">{replies.length === 0 ? <div className="grid h-full place-items-center text-center"><div><span className="mx-auto grid h-11 w-11 place-items-center rounded-2xl bg-[#F3FAFC] text-[#036A97]"><MessageSquare size={20} /></span><p className="mt-3 text-sm font-bold text-[#012044]">No replies yet</p><p className="mt-1 text-xs text-[#718096]">Send a message and our team will respond here.</p></div></div> : replies.map((reply) => <article key={reply.id} className={`max-w-[82%] rounded-2xl px-3.5 py-3 ${reply.is_admin ? 'mr-auto rounded-tl-sm bg-white shadow-sm ring-1 ring-[#E8EDF2]' : 'ml-auto rounded-tr-sm bg-[#012044] text-white'}`}><p className={`whitespace-pre-wrap text-sm leading-6 ${reply.is_admin ? 'text-[#012044]' : 'text-white'}`}>{reply.message}</p>{Array.isArray(reply.attachments) && reply.attachments.length > 0 && <div className="mt-2 flex flex-wrap gap-1.5">{reply.attachments.map((attachment: any) => <a key={attachment.id} href={attachment.url || attachment.download_url || '#'} target="_blank" rel="noreferrer" className={`inline-flex max-w-full items-center gap-1 rounded-md px-2 py-1 text-[11px] font-bold ${reply.is_admin ? 'bg-[#F3FAFC] text-[#036A97]' : 'bg-white/15 text-white'}`}><Paperclip size={11} /><span className="truncate">{attachment.original_name}</span></a>)}</div>}<p className={`mt-2 text-[10px] ${reply.is_admin ? 'text-[#718096]' : 'text-white/55'}`}>{reply.is_admin ? 'Support team' : 'You'} · {reply.created_at ? new Date(reply.created_at).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' }) : ''}</p></article>)}<div ref={chatEndRef} /></div><footer className="border-t border-[#E8EDF2] p-3 sm:p-4"><div className="flex gap-2"><Input value={replyMessage} onChange={(event) => setReplyMessage(event.target.value)} placeholder="Write a reply…" className="h-11 flex-1 border-[#E8EDF2] focus-visible:ring-[#036A97]" /><label title="Attach document, image, or video" className="inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-[#E8EDF2] text-[#036A97] transition hover:bg-[#F3FAFC]"><Paperclip size={17} /><input className="sr-only" type="file" multiple accept={attachmentTypes} onChange={(event) => setReplyFiles(Array.from(event.target.files || []).slice(0, 3))} /></label><Button onClick={handleReply} disabled={sendingReply || (!replyMessage && !replyFiles.length)} className="h-11 w-11 shrink-0 rounded-xl bg-[#036A97] p-0 text-white hover:bg-[#012044]" aria-label="Send reply">{sendingReply ? <span className="text-xs">…</span> : <Send size={17} />}</Button></div>{replyFiles.length > 0 && <div className="mt-2 flex flex-wrap gap-1.5">{replyFiles.map((file) => <span key={`${file.name}-${file.size}`} className="inline-flex max-w-full items-center gap-1 rounded-md bg-[#F3FAFC] px-2 py-1 text-[11px] font-bold text-[#036A97]"><FileText size={11} /><span className="max-w-[180px] truncate">{file.name}</span></span>)}</div>}</footer></> : <div className="grid flex-1 place-items-center p-8 text-center"><div><span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#FFF7F4] text-[#718096]"><MessageCircle size={22} /></span><p className="mt-4 font-extrabold text-[#012044]">Select a support ticket</p><p className="mt-1 text-sm text-[#718096]">Choose an existing conversation or create a new one.</p></div></div>}</section></div></main>;
}
