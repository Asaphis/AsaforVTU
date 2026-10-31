import type { Metadata } from 'next';
import CustomerClient from '../CustomerClient';

type RouteMeta = { title: string; description: string };

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://asaforvtu.onrender.com';
const siteName = 'AsaforVTU';
const publicMeta: Record<string, RouteMeta> = {
  '/': { title: 'Airtime, Data, Bills and Exam PINs in Nigeria', description: 'Use AsaforVTU in Nigeria for airtime, data, electricity, cable TV and exam PIN services through one wallet-based account.' },
  '/about': { title: 'About AsaforVTU and Ferixas', description: 'Learn about AsaforVTU, a Nigeria-focused digital-services platform operated under the Ferixas brand by an individual operator.' },
  '/services': { title: 'Digital Services in Nigeria', description: 'Explore airtime, data, electricity, cable TV and exam PIN services available through AsaforVTU in Nigeria.' },
  '/services/airtime': { title: 'Buy Airtime in Nigeria', description: 'Review the airtime service and supported Nigerian networks available through AsaforVTU.' },
  '/services/data': { title: 'Buy Data Bundles in Nigeria', description: 'Review available Nigerian network data bundles and purchase details through AsaforVTU.' },
  '/services/electricity': { title: 'Buy Electricity Tokens in Nigeria', description: 'Review supported Nigerian electricity token services and the information needed before payment.' },
  '/services/cable': { title: 'Renew Cable TV in Nigeria', description: 'Review supported cable TV renewal services and customer details needed before payment.' },
  '/services/exam-pins': { title: 'Buy Exam PINs in Nigeria', description: 'Review supported Nigerian examination PIN services and purchase information.' },
  '/how-it-works': { title: 'How AsaforVTU Works', description: 'Learn how to create an account, verify email, fund a wallet, buy a service and keep a transaction receipt.' },
  '/pricing': { title: 'AsaforVTU Pricing', description: 'Review the service total, provider, recipient details and applicable charges before confirming an AsaforVTU transaction.' },
  '/updates': { title: 'AsaforVTU Service Updates', description: 'Find service availability, maintenance and platform updates for AsaforVTU customers in Nigeria.' },
  '/help': { title: 'AsaforVTU Help Centre', description: 'Find answers about AsaforVTU accounts, wallets, transactions, services and support.' },
  '/contact': { title: 'Contact AsaforVTU Support', description: 'Contact AsaforVTU support for account, transaction, privacy, refund and data-request help.' },
  '/privacy': { title: 'AsaforVTU Privacy Policy', description: 'Read how AsaforVTU handles account, payment, transaction, support and browser-storage information.' },
  '/terms': { title: 'AsaforVTU Terms of Service', description: 'Read the terms for using AsaforVTU digital services in Nigeria.' },
  '/refund-policy': { title: 'AsaforVTU Refund and Service Resolution Policy', description: 'Learn when an AsaforVTU payment or service issue can be reviewed and what information is needed.' },
};

function routePath(route?: string[]) {
  return route?.length ? `/${route.join('/')}` : '/';
}

function getMeta(path: string) {
  if (publicMeta[path]) return publicMeta[path];
  if (path.startsWith('/dashboard') || ['/login', '/register', '/verify-email', '/forgot-password', '/reset-password', '/payment-complete'].includes(path)) {
    return { title: 'AsaforVTU Account', description: 'Private AsaforVTU account area.' };
  }
  return { title: 'Page not found', description: 'The requested AsaforVTU page could not be found.' };
}

export async function generateMetadata({ params }: { params: Promise<{ route?: string[] }> }): Promise<Metadata> {
  const path = routePath((await params).route);
  const meta = getMeta(path);
  const canonical = new URL(path, siteUrl).toString();
  const privateRoute = path.startsWith('/dashboard') || ['/login', '/register', '/verify-email', '/forgot-password', '/reset-password', '/payment-complete'].includes(path);
  return {
    title: meta.title,
    description: meta.description,
    alternates: { canonical },
    robots: privateRoute ? { index: false, follow: false } : { index: true, follow: true },
    openGraph: { type: 'website', url: canonical, siteName, title: meta.title, description: meta.description, images: [{ url: '/pwa-icon-512.png', width: 512, height: 512, alt: 'AsaforVTU' }] },
    twitter: { card: 'summary_large_image', title: meta.title, description: meta.description, images: ['/pwa-icon-512.png'] },
  };
}

export default async function CustomerRoutePage({ params }: { params: Promise<{ route?: string[] }> }) {
  const path = routePath((await params).route);
  const meta = getMeta(path);
  const isPublic = Boolean(publicMeta[path]);
  return <>
    {isPublic && <noscript><section><h1>{meta.title}</h1><p>{meta.description}</p><p>AsaforVTU is operated under the Ferixas brand in Nigeria by Husseni Abduljabar Tolani.</p><nav><a href="/services">Services</a> · <a href="/about">About</a> · <a href="/privacy">Privacy</a> · <a href="/terms">Terms</a> · <a href="/refund-policy">Refund policy</a> · <a href="/contact">Contact</a></nav></section></noscript>}
    <CustomerClient />
  </>;
}
