/* Ferixas prototype port: Next.js document shell for the unconnected review build. */
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AsaforVTU | Ferixas',
  description: 'Interactive AsaforVTU customer experience prototype.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
