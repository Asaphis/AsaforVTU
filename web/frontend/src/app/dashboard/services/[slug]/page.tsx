'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { useService } from '@/hooks/useServices';

const implementedRoutes = new Set(['airtime', 'data', 'cable', 'electricity', 'exam-pins', 'tv']);

export default function DynamicServicePage() {
  const params = useParams<{ slug: string }>();
  const slug = String(params?.slug || '');
  const { service, loading } = useService(slug);

  if (implementedRoutes.has(slug)) return null;

  if (loading) {
    return <div className="min-h-[45vh] grid place-items-center text-slate-500"><Loader2 className="animate-spin" /><span className="mt-3 text-sm">Loading service…</span></div>;
  }

  if (!service) {
    return <div className="rounded-2xl border border-slate-200 bg-white p-8"><h1 className="text-2xl font-black text-[#012044]">Service not found</h1><Link className="mt-5 inline-flex text-sm font-bold text-[#036A97]" href="/dashboard">Back to dashboard</Link></div>;
  }

  return (
    <section className="max-w-2xl rounded-[24px] border border-slate-200 bg-white p-7 shadow-sm">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-bold text-[#036A97]"><ArrowLeft size={16} /> Back to dashboard</Link>
      <p className="mt-8 text-xs font-extrabold uppercase tracking-[0.18em] text-[#147115]">Admin-managed service</p>
      <h1 className="mt-3 text-4xl font-black tracking-tight text-[#012044]">{service.name}</h1>
      <p className="mt-4 max-w-xl text-slate-600">{service.description || 'This service is available in the AsaforVTU catalog.'}</p>
      <div className="mt-7 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><AlertCircle className="mt-0.5 shrink-0" size={18} /><p>This service is visible because it is active in the admin catalog. Its purchase flow will appear here only after its provider contract is configured on the backend.</p></div>
      <Link href="/dashboard/support" className="mt-6 inline-flex rounded-lg bg-[#036A97] px-4 py-2.5 text-sm font-bold text-white">Contact support</Link>
    </section>
  );
}
