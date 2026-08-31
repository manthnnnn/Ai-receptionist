'use client';

import React from 'react';
import { useClinic } from './clinic-context';
import { Building2, PhoneCall, Mic, ChevronDown, Activity, Menu, Power, Plus, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { ThemeToggle } from './theme-toggle';

interface HeaderProps {
  onMenuToggle?: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
  const {
    activeClinicId,
    setActiveClinicId,
    activeClinic,
    clinics,
    toggleAgentActive,
    setIsVoiceTesterOpen,
    setIsPhoneSimulatorOpen,
    setIsAddClinicModalOpen,
  } = useClinic();

  const isAgentActive = activeClinic?.agent_enabled ?? true;

  return (
    <header
      className="sticky top-0 z-40 px-4 md:px-6 py-2.5 flex items-center justify-between gap-3 border-b transition-colors duration-300"
      style={{ background: 'var(--header-bg)', borderColor: 'var(--border)' }}
    >
      {/* Left: Hamburger (mobile) + Brand */}
      <div className="flex items-center gap-2 md:gap-3 min-w-0">
        {/* Mobile hamburger — hidden on desktop */}
        <button
          onClick={onMenuToggle}
          className="lg:hidden w-9 h-9 flex items-center justify-center rounded-apple hover:bg-white/5 [html.light_&]:hover:bg-black/5 transition-apple flex-shrink-0"
          aria-label="Open navigation menu"
          style={{ color: 'var(--text-secondary)' }}
        >
          <Menu className="w-5 h-5" strokeWidth={2} />
        </button>

        <Link href="/" className="flex items-center gap-2 group flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gcore-orange to-amber-600 flex items-center justify-center text-white shadow-gcore-btn transition-apple group-hover:scale-105">
            <Activity className="w-4 h-4" strokeWidth={2.5} />
          </div>
          <span className="font-bold text-[15px] tracking-tight flex items-center gap-1.5 hidden sm:flex" style={{ color: 'var(--text-primary)' }}>
            Clinic<span className="text-gcore-orange">AI</span>
            <span className="text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full gcore-badge hidden md:inline-flex">Admin</span>
          </span>
        </Link>
      </div>

      {/* Center: Tenant Switcher & Quick Add Clinic */}
      <div className="flex items-center gap-2 max-w-[320px] md:max-w-none">
        <div className="flex items-center gcore-card rounded-apple px-2.5 md:px-3 py-1.5 text-xs gap-1.5 md:gap-2 transition-apple hover:border-gcore-orange/40">
          <Building2 className="w-3.5 h-3.5 text-gcore-orange flex-shrink-0" strokeWidth={1.8} />
          <select
            value={activeClinicId}
            onChange={(e) => setActiveClinicId(e.target.value)}
            aria-label="Select Clinic"
            className="bg-transparent font-medium focus:outline-none cursor-pointer appearance-none text-[12px] truncate max-w-[130px] md:max-w-[190px]"
            style={{ color: 'var(--text-primary)' }}
          >
            {clinics.map((c) => (
              <option key={c.id} value={c.id} style={{ background: 'var(--surface)', color: 'var(--text-primary)' }}>
                {c.name} {c.agent_enabled === false ? '(Paused)' : ''}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 -ml-1 pointer-events-none flex-shrink-0" strokeWidth={1.5} style={{ color: 'var(--text-muted)' }} />
        </div>

        {/* Quick Add Clinic Button */}
        <button
          onClick={() => setIsAddClinicModalOpen(true)}
          className="hidden md:flex items-center gap-1 gcore-card px-2.5 py-1.5 rounded-apple text-xs font-semibold text-gcore-orange hover:bg-gcore-orange/10 border border-gcore-orange/30 transition-apple"
          title="Onboard new clinic client"
        >
          <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
          <span>New Clinic</span>
        </button>
      </div>

      {/* Right: Master Agent Switch + Actions */}
      <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
        {/* Master AI Agent Switch Pill */}
        <button
          onClick={() => toggleAgentActive(!isAgentActive)}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold border flex items-center gap-2 transition-apple cursor-pointer ${
            isAgentActive
              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/60 shadow-sm'
              : 'bg-rose-950/60 border-rose-500/40 text-rose-300 hover:bg-rose-900/60 shadow-sm'
          }`}
          title={isAgentActive ? 'AI Agent is ON. Click to pause (calls will forward to PSTN human receptionist).' : 'AI Agent is PAUSED. Click to activate.'}
        >
          <span className={`w-2 h-2 rounded-full ${isAgentActive ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
          <span className="hidden sm:inline">{isAgentActive ? 'AI Agent: ON' : 'AI Agent: PAUSED'}</span>
          <span className="sm:hidden">{isAgentActive ? 'ON' : 'PAUSED'}</span>
        </button>

        <ThemeToggle />

        {/* Simulate Call — icon only on mobile */}
        <button
          onClick={() => setIsPhoneSimulatorOpen(true)}
          className="gcore-btn-dark px-2.5 md:px-3.5 py-1.5 text-xs flex items-center gap-2"
          aria-label="Simulate Call"
        >
          <PhoneCall className="w-3.5 h-3.5 text-gcore-orange" strokeWidth={1.8} />
          <span className="hidden md:inline">Simulate Call</span>
        </button>

        {/* Voice Console — icon only on mobile */}
        <button
          onClick={() => setIsVoiceTesterOpen(true)}
          className="gcore-btn-orange px-2.5 md:px-4 py-1.5 text-xs flex items-center gap-2 shadow-gcore-btn"
          aria-label="Voice Console"
        >
          <Mic className="w-3.5 h-3.5" strokeWidth={2} />
          <span className="hidden md:inline">Voice Console</span>
        </button>
      </div>
    </header>
  );
}
