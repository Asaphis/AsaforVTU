'use client';

import Link from 'next/link';
import { ArrowLeft, ArrowRight, FileText, Smartphone, Tv, WalletCards, Wifi, Zap } from 'lucide-react';
import { BrandLockup } from '@/components/BrandLockup';
import { Footer } from '@/components/Footer';
import { useServices } from '@/hooks/useServices';

const iconByName: Record<string, typeof Smartphone> = { phone: Smartphone, wifi: Wifi, tv: Tv, zap: Zap, book: FileText };

export default function ServicesPage() {
  const { services, loading, error } = useServices();
  return <main className="min-h-screen bg-[#FFF7F4] text-[#162337]"><header className="border-b border-[#E8EDF2] bg-white px-5 py-4 md:px-10"><div className="mx-auto flex max-w-7xl items-center justify-between"><Link href="/"><BrandLockup compact /></Link><Link className="inline-flex items-center gap-2 text-sm font-bold text-[#1463DB]" href="/"><ArrowLeft size={16}/>Back to home</Link></div></header><section className="mx-auto max-w-7xl px-5 py-12 md:px-10 md:py-16"><p className="text-xs font-extrabold tracking-[.18em] text-[#147115]">OUR SERVICES</p><h1 className="mt-3 max-w-3xl text-5xl font-extrabold tracking-[-.06em] text-[#012044] md:text-6xl">Essential top-up services in one place.</h1><p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">Choose a supported service, create or sign in to your account, fund your wallet and confirm with your transaction PIN.</p><div className="mt-10 grid gap-3 md:grid-cols-2">{loading ? <p className="text-slate-500">Loading live services…</p> : error ? <p className="text-red-600">Services are temporarily unavailable. Please try again.</p> : services?.map((service,index) => { const Icon=iconByName[service.icon || ''] || WalletCards; return <Link key={service.id} href="/register" className="grid grid-cols-[auto_auto_1fr_auto] items-center gap-4 border border-[#E8EDF2] bg-white p-5 transition hover:border-[#1463DB] hover:bg-[#F4FAFF]"><span className="text-xs font-bold text-slate-400">{String(index+1).padStart(2,'0')}</span><Icon size={22} className="text-[#036A97]"/><span><b className="block text-lg text-[#012044]">{service.name}</b><small className="mt-1 block text-sm text-slate-500">{service.description}</small></span><ArrowRight size={18} className="text-[#147115]"/></Link>})}</div></section><Footer /></main>;
}
