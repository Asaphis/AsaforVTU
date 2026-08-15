'use client';

/* Ferixas dynamic-service fallback: deliberate live catalog state for an admin-managed service without a configured purchase contract. */
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AlertCircle, ArrowLeft, Loader2, Boxes } from 'lucide-react';
import { useService } from '@/hooks/useServices';

const implementedRoutes = new Set(['airtime', 'data', 'cable', 'electricity', 'exam-pins', 'tv']);

export default function DynamicServicePage() {
  const params = useParams<{ slug: string }>();
  const slug = String(params?.slug || '');
  const { service, loading } = useService(slug);
  if (implementedRoutes.has(slug)) return null;
  if (loading) return <main className="grid min-h-[45vh] place-items-center"><div className="text-center"><Loader2 className="mx-auto animate-spin text-[#036A97]" size={24} /><p className="mt-3 text-sm font-medium text-[#718096]">Loading service…</p></div></main>;
  if (!service) return <main className="mx-auto max-w-3xl"><section className="rounded-2xl border border-[#E8EDF2] bg-white p-8"><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#718096]">Services</p><h1 className="mt-2 text-2xl font-extrabold text-[#012044]">Service not found</h1><p className="mt-2 text-sm text-[#718096]">This service may no longer be available in the catalog.</p><Link className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#036A97]" href="/dashboard/services"><ArrowLeft size={16} />Back to services</Link></section></main>;
  return <main className="mx-auto max-w-3xl space-y-5 pb-24 lg:pb-8"><Link href="/dashboard/services" className="inline-flex items-center gap-2 text-sm font-bold text-[#036A97] transition hover:text-[#012044]"><ArrowLeft size={16} />Back to services</Link><section className="overflow-hidden rounded-2xl border border-[#E8EDF2] bg-white"><header className="bg-[#012044] px-5 py-6 text-white sm:px-6"><div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#99BC0D] text-[#012044]"><Boxes size={20} /></span><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-white/55">Admin-managed service</p><h1 className="mt-1 text-2xl font-extrabold">{service.name}</h1></div></div></header><div className="p-5 sm:p-6"><p className="text-sm leading-6 text-[#718096]">{service.description || 'This service is available in the AsaforVTU catalog.'}</p><div className="mt-5 flex gap-3 rounded-xl border border-[#D69B04]/25 bg-[#FFF8E8] p-4 text-sm leading-6 text-[#7B5200]"><AlertCircle className="mt-0.5 shrink-0" size={18} /><p>This service is active in the catalog. Its purchase form will be available after the matching provider contract is configured.</p></div><Link href="/dashboard/support" className="mt-6 inline-flex rounded-xl bg-[#036A97] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#012044]">Contact support</Link></div></section></main>;
}
