"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from 'next/navigation';
import { Menu, X, LogIn, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Services', href: '#services' },
    { name: 'Features', href: '#features' },
    { name: 'Pricing', href: '#pricing' },
  ];

  return (
    <header className={`fixed w-full top-0 left-0 z-50 transition-all duration-500 ${scrolled ? 'py-3' : 'py-6'}`}>
      <div className="container mx-auto px-4">
        <div className={`flex items-center justify-between h-16 px-6 rounded-[2rem] transition-all duration-500 border ${scrolled ? 'bg-white/90 backdrop-blur-xl shadow-lg border-slate-200/50' : 'bg-white/50 backdrop-blur-md border-white/20 shadow-xl'}`}>
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="flex items-center group">
              <div className="h-12 w-12 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                <img 
                  src="/logo.png" 
                  alt="AsaforVTU Logo" 
                  className="h-full w-full object-contain transition-all duration-500"
                />
              </div>
              <span className={`ml-2 font-bold text-2xl transition-colors duration-300 ${scrolled ? 'text-slate-900' : 'text-slate-900'}`}>AsaforVTU</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-10">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`text-sm font-semibold transition-all duration-300 hover:scale-105 ${scrolled ? 'text-slate-600 hover:text-primary' : 'text-slate-600 hover:text-primary'}`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Auth Buttons - Desktop */}
          <div className="hidden md:flex items-center space-x-4">
            <Link href="/login">
              <Button variant="ghost" className={`font-semibold rounded-xl ${scrolled ? 'text-slate-700 hover:bg-slate-100' : 'text-slate-700 hover:bg-slate-100'}`}>
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button className={`bg-primary text-white shadow-lg shadow-primary/20 font-semibold px-6 rounded-xl transition-all duration-300 hover:scale-105`}>
                Get Started
              </Button>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-foreground/70 hover:text-foreground focus:outline-none"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className={`md:hidden ${isOpen ? 'block' : 'hidden'} bg-background border-t`}>
        <div className="px-2 pt-2 pb-3 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className={`block px-3 py-2 rounded-md text-base font-medium ${pathname === link.href ? 'bg-primary/10 text-primary' : 'text-foreground/80 hover:bg-accent'}`}
              onClick={() => setIsOpen(false)}
            >
              {link.name}
            </Link>
          ))}
          <div className="pt-4 pb-2 space-y-2 border-t">
            <Link href="/login" className="block w-full">
              <Button variant="outline" className="w-full justify-start" onClick={() => setIsOpen(false)}>
                <LogIn className="w-4 h-4 mr-2" />
                Sign In
              </Button>
            </Link>
            <Link href="/register" className="block w-full">
              <Button className="w-full justify-start" onClick={() => setIsOpen(false)}>
                <UserPlus className="w-4 h-4 mr-2" />
                Create Account
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

