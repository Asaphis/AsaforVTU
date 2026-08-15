"use client";

import { MessageCircle } from "lucide-react";

export default function WhatsAppContact() {
  const number = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "").replace(/\D/g, "");
  if (!number) return null;
  return <a className="whatsapp-contact" href={`https://wa.me/${number}`} target="_blank" rel="noreferrer" aria-label="Contact AsaforVTU on WhatsApp"><MessageCircle size={23} /><span>WhatsApp</span></a>;
}
