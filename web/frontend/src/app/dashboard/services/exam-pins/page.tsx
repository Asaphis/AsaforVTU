'use client';

import { GraduationCap } from 'lucide-react';
import { useService } from '@/hooks/useServices';

export default function ExamPinsPage() {
  const { service, loading, error } = useService('exam-pins');

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {loading ? (
            <div className="dashboard-card text-center py-20 animate-pulse bg-gray-50 border-none">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl mx-auto mb-4" />
              <div className="h-4 w-32 bg-gray-100 mx-auto rounded" />
            </div>
          ) : error ? (
            <div className="dashboard-card text-center py-20 border-red-100 bg-red-50/30">
              <p className="text-red-500 font-bold uppercase tracking-widest text-sm">Error loading service</p>
              <p className="text-xs text-red-400 mt-2">{error}</p>
            </div>
          ) : !service ? (
            <div className="dashboard-card text-center py-20 bg-gray-50 border-none">
              <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">Service currently unavailable</p>
            </div>
          ) : (
            <>
              <div className="text-center mb-10">
                <div className="w-20 h-20 rounded-[2rem] bg-[#0A1F44] flex items-center justify-center text-[#F97316] mx-auto mb-6 shadow-xl shadow-blue-900/20">
                  <GraduationCap size={40} />
                </div>
                <h1 className="text-4xl font-black text-[#0A1F44] tracking-tight uppercase">
                  {service.name}
                </h1>
                <p className="text-gray-400 font-medium mt-2">{service.description || 'Instant exam result checker PINs delivery.'}</p>
              </div>

              <div className="dashboard-card border-none shadow-brand p-10 space-y-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#F97316]/5 rounded-full -mr-16 -mt-16 blur-2xl" />
                
                <div className="space-y-6 relative z-10">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Select Exam Board</label>
                    <select className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-[#0A1F44]/20 focus:bg-white focus:outline-none transition-all font-bold text-[#0A1F44] appearance-none">
                      <option>WAEC Result Checker</option>
                      <option>NECO Result Token</option>
                      <option>NABTEB Result Checker</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Quantity</label>
                    <div className="grid grid-cols-5 gap-3">
                      {[1, 2, 3, 4, 5].map(q => (
                        <button key={q} className={`py-3 rounded-xl font-black text-xs transition-all ${q === 1 ? 'bg-[#0A1F44] text-white shadow-lg shadow-blue-900/10' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}>
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-[#0A1F44]/5 border border-[#0A1F44]/5 flex justify-between items-center">
                    <span className="text-[10px] font-black text-[#0A1F44]/60 uppercase tracking-widest">Total Cost</span>
                    <span className="text-lg font-black text-[#0A1F44]">₦3,500</span>
                  </div>
                </div>

                <button className="w-full py-5 rounded-2xl bg-[#F97316] text-white font-black text-xs uppercase tracking-[0.2em] hover:bg-[#F97316]/90 transition-all shadow-xl shadow-orange-900/20 disabled:opacity-30 relative z-10" disabled={!service.enabled}>
                  {service.enabled ? 'PURCHASE PIN NOW' : 'COMING SOON'}
                </button>
              </div>
            </>
          )}
        </div>
  );
}
