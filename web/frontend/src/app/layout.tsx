/* Ferixas customer application document shell. */
import type { Metadata } from 'next';
import './globals.css';
import '../pwa.css';

export const viewport = { themeColor: '#071a2b' };

export const metadata: Metadata = {
  title: 'AsaforVTU | Ferixas',
  description: 'Interactive AsaforVTU customer experience.',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/pwa-icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/pwa-icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/pwa-icon-192.png',
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
