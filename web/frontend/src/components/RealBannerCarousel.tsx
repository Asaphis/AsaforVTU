// AsaforVTU review carousel: shows only user-supplied promotional artwork with accessible controls.
"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

const banners = [
  { source: "/assets/banners/asaforvtu-blue-convenience.png", label: "AsaforVTU wallet convenience promotion" },
  { source: "/assets/banners/asaforvtu-blue-services.png", label: "AsaforVTU services promotion" },
  { source: "/assets/banners/asaforvtu-green-hero.png", label: "AsaforVTU top-up services promotion" },
  { source: "/assets/banners/asaforvtu-blue-hero.png", label: "AsaforVTU digital services promotion" },
] as const;

export default function RealBannerCarousel() {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setActive((current) => (current + 1) % banners.length), 5000);
    return () => window.clearInterval(timer);
  }, []);
  const select = (index: number) => setActive((index + banners.length) % banners.length);
  return <section className="real-banner-carousel" aria-label="AsaforVTU promotions">
    <img src={banners[active].source} alt={banners[active].label} />
    <div className="real-banner-carousel__controls">
      <button type="button" aria-label="Previous promotion" onClick={() => select(active - 1)}><ChevronLeft size={16} /></button>
      <div>{banners.map((banner, index) => <button type="button" key={banner.source} aria-label={`Show promotion ${index + 1}`} className={active === index ? "active" : ""} onClick={() => select(index)} />)}</div>
      <button type="button" aria-label="Next promotion" onClick={() => select(active + 1)}><ChevronRight size={16} /></button>
    </div>
  </section>;
}
