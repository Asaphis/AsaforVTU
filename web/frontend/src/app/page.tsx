"use client";

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Check, Zap, Smartphone, Shield, Globe, Clock, ArrowRight } from "lucide-react";
import Link from 'next/link';
import Image from 'next/image';

// Using a placeholder image from the public directory
const heroImage = "/assets/images/hero-placeholder.png";

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-24 overflow-hidden bg-white">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent -z-10"></div>
        <div className="container px-4 md:px-6 relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="flex flex-col space-y-8 animate-in fade-in slide-in-from-left duration-1000">
              <div className="inline-flex items-center self-start rounded-full border px-4 py-1.5 text-sm font-medium border-primary/20 bg-primary/5 text-primary backdrop-blur-sm">
                <Zap className="w-4 h-4 mr-2 text-accent" /> Secure & Instant Digital Services
              </div>
              <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-950 leading-[1.1]">
                Digital Top-ups <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary/80 to-accent">Made Simple.</span>
              </h1>
              <p className="text-xl text-slate-600 leading-relaxed">
                The smartest way to buy airtime, data bundles, and pay utility bills. 
                Experience premium, secure delivery with AsaforVTU.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link href="/register">
                  <Button size="lg" className="h-14 px-10 text-lg font-semibold rounded-2xl shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/30 transition-all duration-300">Get Started Now</Button>
                </Link>
                <Link href="/register">
                  <Button size="lg" variant="outline" className="h-14 px-10 text-lg font-semibold rounded-2xl border-2 hover:bg-slate-50 transition-all duration-300">Buy Data Guest</Button>
                </Link>
              </div>
            </div>
            <div className="relative animate-in fade-in zoom-in duration-1000">
              <div className="absolute -inset-4 bg-primary/20 rounded-full blur-3xl opacity-50 animate-pulse"></div>
              <div className="relative w-full h-auto aspect-video max-w-full">
                <Image
                  src={heroImage}
                  alt="Digital Connectivity"
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover rounded-3xl shadow-2xl border border-white/20 hover:scale-[1.02] transition-transform duration-500"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Slider */}
      <section id="services">
        <ServiceSlider />
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white relative overflow-hidden">
        <div className="container px-4 md:px-6">
          <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-slate-950">Everything you need</h2>
            <p className="text-slate-600 text-lg max-w-2xl mx-auto">
              We provide a premium, seamless experience for all your digital transaction needs with industry-leading security.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Zap className="h-7 w-7 text-primary" />}
              title="Instant Airtime"
              description="Top up any network instantly with our automated system. No delays, just speed."
            />
            <FeatureCard 
              icon={<Globe className="h-7 w-7 text-secondary" />}
              title="Data Bundles"
              description="Get affordable data plans for all networks starting from ₦150. Stay connected always."
            />
            <FeatureCard 
              icon={<Shield className="h-7 w-7 text-green-500" />}
              title="Secure Wallet"
              description="Your funds are protected with bank-grade security and two-factor authentication."
            />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-slate-50/50">
        <div className="container px-4 md:px-6">
          <div className="text-center max-w-2xl mx-auto mb-20 space-y-4">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight">Simple Pricing</h2>
            <p className="text-slate-600 text-lg">
              Competitive rates tailored for both resellers and individuals.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <PricingCard 
              title="Starter"
              price="0"
              features={["Standard Rates", "Instant Delivery", "24/7 Support", "Basic Wallet"]}
            />
            <PricingCard 
              title="Reseller"
              price="5,000"
              isPopular
              features={["Discounted Rates", "API Access", "Priority Support", "Detailed Analytics", "Custom Branding"]}
            />
            <PricingCard 
              title="Enterprise"
              price="Custom"
              features={["Wholesale Rates", "Account Manager", "White Label Solution", "Higher Limits"]}
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 bg-primary text-white relative overflow-hidden">
        <div className="container px-4 md:px-6 relative z-10 text-center space-y-8">
          <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight">Ready to join the future?</h2>
          <p className="text-white/80 text-xl max-w-2xl mx-auto leading-relaxed font-medium">
            Join over 10,000+ users who trust AsaforVTU for their daily digital needs. Secure your future today.
          </p>
          <div className="pt-6">
            <Link href="/register">
              <Button size="lg" className="h-16 px-12 text-xl font-black bg-accent hover:bg-accent/90 text-white rounded-[1.5rem] shadow-2xl shadow-accent/20 transition-all duration-300 hover:scale-105">
                Create Free Account
              </Button>
            </Link>
          </div>
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-white/5 rounded-full blur-[100px] -z-10"></div>
      </section>

      <Footer />
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <Card className="group border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_50px_rgba(11,79,108,0.1)] hover:-translate-y-3 transition-all duration-700 rounded-[3rem] p-6 bg-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 transition-transform duration-700 group-hover:scale-150"></div>
      <CardHeader className="relative z-10">
        <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/10 to-transparent flex items-center justify-center mb-8 shadow-sm group-hover:from-primary/20 group-hover:rotate-6 transition-all duration-500">
          <div className="text-primary transform group-hover:scale-110 transition-transform duration-500">
            {icon}
          </div>
        </div>
        <CardTitle className="text-2xl font-black text-slate-900 mb-2">{title}</CardTitle>
      </CardHeader>
      <CardContent className="relative z-10">
        <CardDescription className="text-lg text-slate-600 leading-relaxed font-medium">{description}</CardDescription>
      </CardContent>
    </Card>
  )
}

function PricingCard({ title, price, features, isPopular }: { title: string, price: string, features: string[], isPopular?: boolean }) {
  return (
    <Card className={`relative flex flex-col p-4 rounded-[3rem] transition-all duration-500 border-2 ${isPopular ? 'border-primary shadow-2xl shadow-primary/20 scale-105 z-10 bg-white' : 'border-slate-100 shadow-xl bg-white/80'}`}>
      {isPopular && (
        <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-accent text-white px-6 py-1.5 rounded-full text-xs font-black tracking-widest shadow-lg">
          MOST POPULAR
        </div>
      )}
      <CardHeader className="text-center pt-8">
        <CardTitle className="text-2xl font-black text-slate-900 uppercase tracking-tight">{title}</CardTitle>
        <div className="mt-6">
          <span className="text-5xl font-black text-primary">₦{price}</span>
          {price !== "Custom" && <span className="text-slate-500 font-medium text-lg ml-2">/one-time</span>}
        </div>
      </CardHeader>
      <CardContent className="flex-1 pt-8 px-6">
        <ul className="space-y-4">
          {features.map((feature, i) => (
            <li key={i} className="flex items-center gap-3 text-base font-medium text-slate-700">
              <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <Check className="h-3.5 w-3.5 text-green-600 stroke-[3]" />
              </div>
              {feature}
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter className="pb-8 pt-6">
        <Button className={`w-full h-14 rounded-2xl font-bold text-lg transition-all duration-300 ${isPopular ? 'bg-primary shadow-lg shadow-primary/20 hover:scale-[1.02]' : 'bg-slate-900 text-white hover:bg-slate-800'}`}>Choose {title}</Button>
      </CardFooter>
    </Card>
  )
}

import { Users } from "lucide-react";
import { ServiceSlider } from "@/components/ServiceSlider";

