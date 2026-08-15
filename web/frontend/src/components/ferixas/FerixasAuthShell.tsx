import Link from 'next/link';
import { BrandLockup } from '@/components/BrandLockup';
import { Footer } from '@/components/Footer';

export function FerixasAuthShell({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return <main className="min-h-screen bg-[#FFF7F4]"><header className="border-b border-[#E8EDF2] bg-white px-5 py-4"><div className="mx-auto flex max-w-7xl items-center justify-between"><Link href="/"><BrandLockup compact /></Link><Link href="/" className="text-sm font-bold text-[#1463DB]">Back to home</Link></div></header><section className="mx-auto grid max-w-7xl gap-10 px-5 py-12 md:grid-cols-2 md:px-10 md:py-20"><aside className="rounded-2xl bg-[#012044] p-8 text-white md:p-12"><p className="text-xs font-extrabold tracking-[.2em] text-[#99BC0D]">{eyebrow}</p><h1 className="mt-5 text-5xl font-extrabold tracking-[-.06em]">{title}</h1><p className="mt-6 max-w-md text-lg leading-8 text-slate-300">Use one verified account for wallet funding, services, receipts and support.</p><ul className="mt-10 space-y-3 text-sm font-bold text-slate-200"><li>Fast service delivery</li><li>Secure wallet access</li><li>Receipts for every transaction</li></ul></aside><section className="self-center rounded-2xl border border-[#E8EDF2] bg-white p-7 shadow-sm md:p-10">{children}</section></section><Footer /></main>;
}
