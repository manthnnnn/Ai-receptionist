'use client';

import React from 'react';
import { useClinic } from './clinic-context';
import { Sparkles, Building2, PhoneCall, Mic, ChevronDown } from 'lucide-react';

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
    <header className="bg-white border-b border-surface-200/80 px-5 py-3 flex flex-wrap items-center justify-between gap-3">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-apple bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white shadow-sm">
            <Sparkles className="w-4 h-4" strokeWidth={2} />
          </div>
          <span className="font-semibold text-[15px] tracking-apple text-surface-900">Clinic AI</span>
        </div>
      </div>

      {/* Tenant Switcher */}
      <div className="flex items-center">
        <div className="flex items-center bg-surface-50 border border-surface-200 rounded-apple px-3 py-2 text-sm gap-2 transition-apple hover:border-surface-300">
          <Building2 className="w-4 h-4 text-surface-400" strokeWidth={1.5} />
          <select
            value={activeClinicId}
            onChange={(e) => setActiveClinicId(e.target.value)}
            aria-label="Select Clinic"
            className="bg-transparent text-surface-800 font-medium focus:outline-none cursor-pointer pr-4 appearance-none text-[13px]"
          >
            {clinics.map((c) => (
              <option key={c.id} value={c.id} className="bg-white text-surface-900">
                {c.name}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-surface-400 -ml-2 pointer-events-none" strokeWidth={1.5} />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2.5">
        {/* Latency Badge */}
        <div className="hidden sm:flex items-center gap-2 bg-surface-50 border border-surface-200 px-3 py-1.5 rounded-full text-xs text-surface-500">
          <span className="status-dot bg-emerald-400"></span>
          <span>Latency <strong className="text-emerald-600 font-semibold">~575ms</strong></span>
        </div>

        {/* PSTN Simulator */}
        <button
          onClick={() => setIsPhoneSimulatorOpen(true)}
          className="flex items-center gap-2 bg-white hover:bg-surface-50 text-surface-600 hover:text-surface-900 border border-surface-200 hover:border-surface-300 font-medium px-3.5 py-2 rounded-apple text-xs transition-apple"
        >
          <PhoneCall className="w-3.5 h-3.5 text-amber-500" strokeWidth={1.5} />
          <span>Simulate Call</span>
        </button>

        {/* WebRTC Tester */}
        <button
          onClick={() => setIsVoiceTesterOpen(true)}
          className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white font-medium px-3.5 py-2 rounded-apple text-xs transition-apple shadow-sm"
        >
          <Mic className="w-3.5 h-3.5" strokeWidth={1.5} />
          <span>Voice Test</span>
        </button>
      </div>
    </header>
  );
}
