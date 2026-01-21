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
          <div className="flex flex-col items-center text-center space-y-8 max-w-4xl mx-auto">
            <div className="inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-medium border-primary/20 bg-primary/5 text-primary backdrop-blur-sm animate-in fade-in slide-in-from-bottom-3 duration-1000">
              <Zap className="w-4 h-4 mr-2 text-accent" /> Secure & Instant Digital Services
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-950 leading-[1.1]">
              The Future of <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary/80 to-accent">Digital Economy.</span>
            </h1>
            <p className="text-xl text-slate-600 max-w-2xl leading-relaxed">
              Experience the fastest way to top up airtime, data, and pay bills. 
              AsaforVTU provides a premium, secure gateway for all your digital needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-6 w-full sm:w-auto">
              <Link href="/register" className="w-full sm:w-auto">
                <Button size="lg" className="h-14 px-10 text-lg font-semibold rounded-2xl shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/30 transition-all duration-300">Get Started Free</Button>
              </Link>
              <Link href="/services" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="h-14 px-10 text-lg font-semibold rounded-2xl border-2 hover:bg-slate-50 transition-all duration-300">Explore Services</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Services Slider */}
      <section id="services">
        <ServiceSlider />
      </section>

      {/* Features Section */}
      <section id="features" className="pt-16 pb-24 bg-muted/50">
        <div className="container px-4 md:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <h2 className="text-3xl font-bold tracking-tight">Everything you need</h2>
            <p className="text-muted-foreground text-lg">
              We provide a seamless experience for all your digital transaction needs.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Zap className="h-6 w-6 text-primary" />}
              title="Instant Airtime"
              description="Top up any network instantly with our automated system. No delays, no waiting."
            />
            <FeatureCard 
              icon={<Globe className="h-6 w-6 text-secondary" />}
              title="Data Bundles"
              description="Get affordable data plans for MTN, Glo, Airtel, and 9mobile starting from ₦150."
            />
            <FeatureCard 
              icon={<Shield className="h-6 w-6 text-green-500" />}
              title="Secure Wallet"
              description="Your funds are protected with bank-grade security and two-factor authentication."
            />
            <FeatureCard 
              icon={<Smartphone className="h-6 w-6 text-purple-500" />}
              title="Bill Payment"
              description="Pay for electricity, cable TV, and other utilities with just a few clicks."
            />
            <FeatureCard 
              icon={<Clock className="h-6 w-6 text-orange-500" />}
              title="24/7 Availability"
              description="Our services are always online. Transaction anytime, anywhere."
            />
            <FeatureCard 
              icon={<Users className="h-6 w-6 text-blue-500" />}
              title="Reseller API"
              description="Developers can integrate our robust API to build their own VTU platforms."
            />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24">
        <div className="container px-4 md:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <h2 className="text-3xl font-bold tracking-tight">Simple Pricing</h2>
            <p className="text-muted-foreground text-lg">
              Competitive rates for resellers and individuals.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
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
              features={["Wholesale Rates", "Dedicated Account Manager", "White Label Solution", "Higher Limits"]}
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-primary text-white relative overflow-hidden">
        <div className="container px-4 md:px-6 relative z-10 text-center space-y-6">
          <h2 className="text-3xl md:text-5xl font-bold text-white">Ready to get started?</h2>
          <p className="text-white/90 text-xl max-w-2xl mx-auto">
            Join thousands of users who trust AsaforVTU for their daily transactions.
          </p>
          <div className="pt-4">
            <Link href="/register">
              <Button size="lg" className="h-14 px-8 text-lg font-bold bg-accent hover:bg-accent/90 text-accent-foreground">
                Create Free Account
              </Button>
            </Link>
          </div>
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white/10 rounded-full blur-3xl -z-10"></div>
      </section>

      <Footer />
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <Card className="border-none shadow-md hover:shadow-xl transition-shadow duration-300">
      <CardHeader>
        <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center mb-4">
          {icon}
        </div>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-base">{description}</CardDescription>
      </CardContent>
    </Card>
  )
}

function PricingCard({ title, price, features, isPopular }: { title: string, price: string, features: string[], isPopular?: boolean }) {
  return (
    <Card className={`relative flex flex-col ${isPopular ? 'border-primary shadow-lg scale-105 z-10' : ''}`}>
      {isPopular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-bold">
          MOST POPULAR
        </div>
      )}
      <CardHeader>
        <CardTitle className="text-xl">{title}</CardTitle>
        <div className="mt-4">
          <span className="text-4xl font-bold">₦{price}</span>
          {price !== "Custom" && <span className="text-muted-foreground">/one-time</span>}
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <ul className="space-y-3">
          {features.map((feature, i) => (
            <li key={i} className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-green-500" />
              {feature}
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button className="w-full" variant={isPopular ? "default" : "outline"}>Choose Plan</Button>
      </CardFooter>
    </Card>
  )
}

import { Users } from "lucide-react";
import { ServiceSlider } from "@/components/ServiceSlider";

