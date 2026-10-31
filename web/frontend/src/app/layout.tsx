/* Ferixas customer application document shell. */
import type { Metadata } from 'next';
import './globals.css';
import '../pwa.css';

export const viewport = { themeColor: '#071a2b' };

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://asaforvtu.onrender.com'),
  title: {
    default: 'AsaforVTU | Airtime, Data, Bills and Exam PINs in Nigeria',
    template: '%s | AsaforVTU',
  },
  description: 'AsaforVTU is a Nigeria-focused digital-services platform operated under the Ferixas brand for airtime, data, electricity, cable TV and exam PIN services.',
  keywords: ['airtime Nigeria', 'data bundles Nigeria', 'electricity tokens Nigeria', 'cable TV renewal Nigeria', 'exam PINs Nigeria', 'AsaforVTU'],
  authors: [{ name: 'Husseni Abduljabar Tolani' }],
  creator: 'Ferixas',
  publisher: 'Ferixas',
  alternates: { canonical: '/' },
  robots: { index: true, follow: true },
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/pwa-icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/pwa-icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/pwa-icon-192.png',
  },
};

const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      name: 'AsaforVTU',
      url: 'https://asaforvtu.onrender.com',
      description: 'Nigeria-focused digital services for airtime, data, electricity, cable TV and exam PINs.',
      inLanguage: 'en-NG',
    },
    {
      '@type': 'Organization',
      name: 'Ferixas',
      url: 'https://asaforvtu.onrender.com',
      brand: { '@type': 'Brand', name: 'AsaforVTU' },
      areaServed: { '@type': 'Country', name: 'Nigeria' },
      contactPoint: { '@type': 'ContactPoint', email: 'asaphis.org@gmail.com', telephone: '+2347032420031', contactType: 'customer support' },
    },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en-NG"><body>{children}<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} /></body></html>;
}
