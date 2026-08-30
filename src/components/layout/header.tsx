'use client';

import React from 'react';
import { useClinic } from './clinic-context';
import { Building2, PhoneCall, Mic, ChevronDown, Activity } from 'lucide-react';
import Link from 'next/link';

export function Header() {
  const {
    activeClinicId,
    setActiveClinicId,
    clinics,
    activeClinic,
    setIsVoiceTesterOpen,
    setIsPhoneSimulatorOpen,
  } = useClinic();

  return (
    <header className="bg-black sticky top-0 z-40 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 border-b border-white/10">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gcore-orange to-amber-600 flex items-center justify-center text-white shadow-gcore-btn transition-apple group-hover:scale-105">
            <Activity className="w-4 h-4" strokeWidth={2.5} />
          </div>
          <span className="font-bold text-[15px] tracking-tight text-white flex items-center gap-1.5">
            Clinic<span className="text-gcore-orange">AI</span>
            <span className="text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full gcore-badge">
              Edge
            </span>
          </span>
        </Link>
      </div>

      {/* Tenant Switcher */}
      <div className="flex items-center">
        <div className="flex items-center gcore-card rounded-apple px-3.5 py-1.5 text-xs gap-2 transition-apple hover:border-gcore-orange/40 bg-[#080808]">
          <Building2 className="w-3.5 h-3.5 text-gcore-orange" strokeWidth={1.8} />
          <select
            value={activeClinicId}
            onChange={(e) => setActiveClinicId(e.target.value)}
            aria-label="Select Clinic"
            className="bg-transparent text-white font-medium focus:outline-none cursor-pointer pr-4 appearance-none text-[12px]"
          >
            {clinics.map((c) => (
              <option key={c.id} value={c.id} className="bg-black text-white">
                {c.name}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-neutral-400 -ml-2 pointer-events-none" strokeWidth={1.5} />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        {/* Latency Badge */}
        <div className="hidden sm:flex items-center gap-2 gcore-card px-3 py-1 rounded-full text-[11px] text-neutral-300 bg-[#080808]">
          <span className="status-dot bg-gcore-orange animate-pulse"></span>
          <span>Latency <strong className="text-orange-300 font-semibold font-mono">~575ms</strong></span>
        </div>

        {/* PSTN Simulator */}
        <button
          onClick={() => setIsPhoneSimulatorOpen(true)}
          className="gcore-btn-dark px-3.5 py-2 text-xs flex items-center gap-2"
        >
          <PhoneCall className="w-3.5 h-3.5 text-gcore-orange" strokeWidth={1.8} />
          <span>Simulate Call</span>
        </button>

        {/* WebRTC Tester */}
        <button
          onClick={() => setIsVoiceTesterOpen(true)}
          className="gcore-btn-orange px-4 py-2 text-xs flex items-center gap-2 shadow-gcore-btn"
        >
          <Mic className="w-3.5 h-3.5" strokeWidth={2} />
          <span>Voice Console</span>
        </button>
      </div>
    </header>
  );
}
