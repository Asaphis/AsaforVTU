'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { BrandLockup } from '@/components/BrandLockup';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="container-main flex justify-between items-center h-16">
        <Link href="/" aria-label="Ferixas AsaforVTU home"><BrandLockup compact /></Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex gap-8">
          <Link href="#services" className="text-gray-600 hover:text-[#0A1F44]">
            Services
          </Link>
          <Link href="#about" className="text-gray-600 hover:text-[#0A1F44]">
            About
          </Link>
          <Link href="#contact" className="text-gray-600 hover:text-[#0A1F44]">
            Contact
          </Link>
        </div>

        {/* Auth Buttons */}
        <div className="hidden md:flex gap-3">
          <Link href="/login">
            <button className="px-4 py-2 text-[#0A1F44] hover:bg-gray-100 rounded-lg transition">
              Login
            </button>
          </Link>
          <Link href="/register">
            <button className="btn-accent">Sign Up</button>
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 p-4 space-y-4">
          <Link href="#services" className="block text-gray-600">
            Services
          </Link>
          <Link href="#about" className="block text-gray-600">
            About
          </Link>
          <Link href="/login" className="block">
            <button className="w-full px-4 py-2 border-2 border-[#0A1F44] rounded-lg">
              Login
            </button>
          </Link>
          <Link href="/register" className="block">
            <button className="w-full btn-accent">Sign Up</button>
          </Link>
        </div>
      )}
    </nav>
  );
}
