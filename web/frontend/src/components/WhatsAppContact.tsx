'use client';

import { MessageCircle } from 'lucide-react';

export function WhatsAppContact() {
  const number = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '').replace(/\D/g, '');
  const defaultMessage = process.env.NEXT_PUBLIC_WHATSAPP_DEFAULT_MESSAGE || 'Hello Ferixas Support, I need help with AsaforVTU.';
  if (!number) return null;
  return (
    <a
      href={`https://wa.me/${number}?text=${encodeURIComponent(defaultMessage)}`}
      target="_blank"
      rel="noreferrer"
      aria-label="Contact AsaforVTU support on WhatsApp"
      className="fixed bottom-5 right-5 z-50 inline-flex h-[52px] items-center gap-2 rounded-full bg-[#147115] px-4 text-sm font-extrabold text-white shadow-[0_16px_34px_rgba(20,113,21,0.28)] transition hover:-translate-y-0.5 hover:bg-[#036A97] focus:outline-none focus:ring-4 focus:ring-[#99BC0D]/35"
    >
      <MessageCircle size={20} /> WhatsApp us
    </a>
  );
}
