'use client';

/* Ferixas customer application runs in the browser to preserve the approved interactive experience. */
import dynamic from 'next/dynamic';

const CustomerApp = dynamic(() => import('../App'), {
  ssr: false,
  loading: () => <main className="auth-gate"><p>Loading your AsaforVTU account…</p></main>,
});

export default function CustomerClient() {
  return <CustomerApp />;
}
