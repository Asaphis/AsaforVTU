'use client';

/* Ferixas prototype port: the approved Wouter application intentionally runs only in the browser for review. */
import dynamic from 'next/dynamic';

const PrototypeApp = dynamic(() => import('../App'), {
  ssr: false,
  loading: () => <main className="auth-gate"><p>Loading AsaforVTU prototype…</p></main>,
});

export default function PrototypeClient() {
  return <PrototypeApp />;
}
