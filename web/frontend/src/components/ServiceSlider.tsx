'use client';

import { useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, Pagination, A11y } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/a11y';
import Image from 'next/image';

interface Service {
  id: string;
  name: string;
  icon: string;
  category?: string;
}

const placeholder = '/assets/images/hero-placeholder.png';
const services: Service[] = [
  // Mobile Networks - Airtime & Data
  { id: 'mtn', name: 'MTN', icon: placeholder, category: 'Airtime & Data' },
  { id: 'airtel', name: 'Airtel', icon: placeholder, category: 'Airtime & Data' },
  { id: 'glo', name: 'Glo', icon: placeholder, category: 'Airtime & Data' },
  { id: '9mobile', name: '9mobile', icon: placeholder, category: 'Airtime & Data' },
  
  // Data Bundles
  { id: 'mtn-data', name: 'MTN Data', icon: placeholder, category: 'Data Plans' },
  { id: 'airtel-data', name: 'Airtel Data', icon: placeholder, category: 'Data Plans' },
  { id: 'glo-data', name: 'Glo Data', icon: placeholder, category: 'Data Plans' },
  { id: '9mobile-data', name: '9mobile Data', icon: placeholder, category: 'Data Plans' },
  
  // Exam Pins
  { id: 'waec', name: 'WAEC', icon: placeholder, category: 'Exam PINs' },
  { id: 'neco', name: 'NECO', icon: placeholder, category: 'Exam PINs' },
  { id: 'nabteb', name: 'NABTEB', icon: placeholder, category: 'Exam PINs' },
  
  // Electricity Bills
  { id: 'ibedc', name: 'IBEDC', icon: placeholder, category: 'Electricity' },
  { id: 'ekedc', name: 'EKEDC', icon: placeholder, category: 'Electricity' },
  { id: 'ikedc', name: 'IKEDC', icon: placeholder, category: 'Electricity' },
  { id: 'phed', name: 'PHED', icon: placeholder, category: 'Electricity' },
  { id: 'aedc', name: 'AEDC', icon: placeholder, category: 'Electricity' },
  { id: 'eedc', name: 'EEDC', icon: placeholder, category: 'Electricity' },
  { id: 'kedco', name: 'KEDCO', icon: placeholder, category: 'Electricity' },
  
  // Cable TV
  { id: 'dstv', name: 'DStv', icon: placeholder, category: 'Cable TV' },
  { id: 'gotv', name: 'GOtv', icon: placeholder, category: 'Cable TV' },
  { id: 'startimes', name: 'Startimes', icon: placeholder, category: 'Cable TV' },
  
  // Internet Services
  { id: 'spectranet', name: 'Spectranet', icon: placeholder, category: 'Internet' },
  { id: 'smiile', name: 'SMILE', icon: placeholder, category: 'Internet' },
  
  // Betting
  { id: 'bet9ja', name: 'Bet9ja', icon: placeholder, category: 'Betting' },
  { id: 'betking', name: 'BetKing', icon: placeholder, category: 'Betting' },
  { id: 'sportybet', name: 'SportyBet', icon: placeholder, category: 'Betting' }
];

export function ServiceSlider() {
  const swiperRef = useRef<any>(null);

  // Group services by category
  const servicesByCategory = services.reduce<Record<string, Service[]>>((acc, service) => {
    const category = service.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(service);
    return acc;
  }, {});

  return (
    <section className="py-16 md:py-24 bg-slate-50/30">
      <div className="container px-4 mx-auto">
        <div className="flex flex-col md:flex-row items-end justify-between mb-12 gap-6">
          <div className="space-y-4">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Our Services</h2>
            <p className="text-slate-500 font-medium max-w-xl">Quickly access our most popular digital services with just one click.</p>
          </div>
          <div className="service-swiper-pagination !static !w-auto" />
        </div>
        <Swiper
          ref={swiperRef}
          modules={[Autoplay, Navigation, Pagination, A11y]}
          spaceBetween={24}
          slidesPerView={2.2}
          autoplay={{
            delay: 4000,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          }}
          pagination={{
            clickable: true,
            el: '.service-swiper-pagination',
            bulletClass: 'w-2.5 h-2.5 rounded-full bg-slate-200 mx-1.5 inline-block transition-all duration-300 cursor-pointer hover:bg-slate-300',
            bulletActiveClass: '!bg-primary !w-8',
          }}
          a11y={{
            enabled: true,
            prevSlideMessage: 'Previous service',
            nextSlideMessage: 'Next service',
            firstSlideMessage: 'This is the first service',
            lastSlideMessage: 'This is the last service',
            paginationBulletMessage: 'Go to service {{index}}',
          }}
          breakpoints={{
            480: { slidesPerView: 3 },
            640: { slidesPerView: 4 },
            768: { slidesPerView: 5 },
            1024: { slidesPerView: 6 },
            1280: { slidesPerView: 7 },
          }}
          className="w-full !overflow-visible"
        >
          {services.map((service) => (
            <SwiperSlide key={service.id} className="h-auto">
              <div 
                className="flex flex-col items-center p-6 rounded-[2rem] bg-white border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 h-full cursor-pointer group"
                role="button"
                tabIndex={0}
                onClick={() => {
                  console.log(`Selected service: ${service.name}`);
                }}
              >
                <div className="w-20 h-20 mb-6 flex items-center justify-center bg-slate-50 rounded-2xl p-4 group-hover:bg-primary/5 group-hover:rotate-3 transition-all duration-500 shadow-inner">
                  <Image
                    src={service.icon}
                    alt={`${service.name} logo`}
                    width={64}
                    height={64}
                    className="object-contain w-full h-full transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.onerror = null;
                      target.src = placeholder;
                    }}
                  />
                </div>
                <span className="text-sm md:text-base font-black text-slate-900 text-center leading-tight mb-1">
                  {service.name}
                </span>
                {service.category && (
                  <span className="text-[10px] uppercase tracking-widest text-primary font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    {service.category}
                  </span>
                )}
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}
