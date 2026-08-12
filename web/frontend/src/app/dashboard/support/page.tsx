'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState, useEffect, useRef } from 'react';
import { 
  MessageCircle, History, Send, Paperclip, 
  Image as ImageIcon, CheckCircle2, Check, CheckCheck,
  ChevronLeft, ChevronRight, Plus, X, User, MessageSquare
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { Badge } from '@/components/ui/badge';
import { createTicket, replyToTicket, getTicketMessages, getTickets } from '@/lib/services';

export default function SupportPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [replies, setReplies] = useState<any[]>([]);
  const [replyMessage, setReplyMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const { toast } = useToast();
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      const data = await getTickets();
      setTickets(data);
    } catch (e) {
      console.error('Failed to load tickets:', e);
    }
  };

  const loadTicketMessages = async (ticketId: string) => {
    try {
      const data = await getTicketMessages(ticketId);
      setReplies(data);
    } catch (e) {
      console.error('Failed to load messages:', e);
    }
  };

  const handleCreateTicket = async () => {
    if (!subject || !message) {
      toast({ title: 'Error', description: 'Subject and message are required', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      await createTicket(subject, message);
      toast({ title: 'Success', description: 'Ticket created successfully' });
      setSubject('');
      setMessage('');
      loadTickets();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async () => {
    if (!replyMessage || !selectedTicket) return;
    setSendingReply(true);
    try {
      await replyToTicket(selectedTicket.id, replyMessage);
      toast({ title: 'Success', description: 'Reply sent successfully' });
      setReplyMessage('');
      loadTicketMessages(selectedTicket.id);
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setSendingReply(false);
    }
  };

  const handleSelectTicket = (ticket: any) => {
    setSelectedTicket(ticket);
    loadTicketMessages(ticket.id);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Support Center</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <div className="bg-white rounded-lg shadow p-4 mb-4">
            <h2 className="font-bold mb-4">Create New Ticket</h2>
            <div className="space-y-4">
              <div>
                <Label>Subject</Label>
                <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Enter subject" />
              </div>
              <div>
                <Label>Message</Label>
                <textarea 
                  className="w-full p-2 border rounded-md"
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your issue"
                />
              </div>
              <Button onClick={handleCreateTicket} disabled={submitting} className="w-full">
                {submitting ? 'Creating...' : 'Create Ticket'}
              </Button>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="font-bold mb-4">Your Tickets</h2>
            <div className="space-y-2">
              {tickets.map((ticket) => (
                <div 
                  key={ticket.id}
                  onClick={() => handleSelectTicket(ticket)}
                  className={`p-3 rounded cursor-pointer ${selectedTicket?.id === ticket.id ? 'bg-blue-50 border-blue-200' : 'bg-gray-50'}`}
                >
                  <p className="font-medium text-sm">{ticket.subject}</p>
                  <p className="text-xs text-gray-500">{new Date(ticket.created_at).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="md:col-span-2">
          {selectedTicket ? (
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="font-bold mb-4">{selectedTicket.subject}</h2>
              <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
                {replies.map((reply) => (
                  <div key={reply.id} className={`p-3 rounded ${reply.is_admin ? 'bg-blue-50 ml-8' : 'bg-gray-50'}`}>
                    <p className="text-sm">{reply.message}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {reply.is_admin ? 'Admin' : 'You'} - {new Date(reply.created_at).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input 
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Type your reply..."
                />
                <Button onClick={handleReply} disabled={sendingReply}>
                  {sendingReply ? 'Sending...' : <Send size={16} />}
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
              Select a ticket to view messages
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
