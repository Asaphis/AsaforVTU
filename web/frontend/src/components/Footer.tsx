import Link from 'next/link';
import { BrandLockup } from '@/components/BrandLockup';

export function Footer() {
  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL;
  const supportPhone = process.env.NEXT_PUBLIC_SUPPORT_PHONE;
  return (
    <footer className="bg-[#0A1F44] text-white py-12 mt-20">
      <div className="container-main">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <BrandLockup inverse className="mb-4" />
            <p className="text-gray-300 text-sm">
              Buy airtime, data, electricity tokens, cable TV subscriptions and exam PINs from one wallet.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Services</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li><Link href="#" className="hover:text-white">Airtime</Link></li>
              <li><Link href="#" className="hover:text-white">Data</Link></li>
              <li><Link href="#" className="hover:text-white">Cable TV</Link></li>
              <li><Link href="#" className="hover:text-white">Electricity</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li><Link href="#" className="hover:text-white">About Us</Link></li>
              <li><Link href="#" className="hover:text-white">Contact</Link></li>
              <li><Link href="#" className="hover:text-white">Privacy</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            {supportEmail ? <a href={`mailto:${supportEmail}`} className="block text-sm text-gray-300 hover:text-white">{supportEmail}</a> : <p className="text-sm text-gray-300">Contact support from your account.</p>}
            {supportPhone ? <a href={`tel:${supportPhone}`} className="mt-2 block text-sm text-gray-300 hover:text-white">{supportPhone}</a> : null}
          </div>
        </div>
        <div className="border-t border-gray-700 pt-8 text-center text-gray-400 text-sm">
          <p>&copy; {new Date().getFullYear()} AsaforVTU. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
