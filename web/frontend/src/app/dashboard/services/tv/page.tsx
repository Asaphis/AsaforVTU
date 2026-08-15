'use client';

/* Ferixas route compatibility: cable TV is handled by the live /dashboard/services/cable purchase flow. */
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Tv } from 'lucide-react';

export default function TVPage() {
  const router = useRouter();
  useEffect(() => { router.replace('/dashboard/services/cable'); }, [router]);
  return <main className="mx-auto max-w-3xl"><div className="rounded-2xl border border-[#E8EDF2] bg-white p-10 text-center"><span className="mx-auto grid h-10 w-10 place-items-center rounded-xl bg-[#FFF8E8] text-[#D69B04]"><Tv size={20} /></span><p className="mt-4 text-sm font-bold text-[#012044]">Opening cable TV service…</p></div></main>;
}
