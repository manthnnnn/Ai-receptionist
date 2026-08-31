'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useClinic } from '@/components/layout/clinic-context';
import { type LucideIcon } from 'lucide-react';
import {
  ShieldCheck,
  Terminal,
  PlusCircle,
  Calendar,
  Phone,
  TrendingUp,
  Zap,
  Coins,
  Banknote,
  Sparkles,
  CheckCircle2,
  PhoneCall
} from 'lucide-react';

// ── Count-Up Hook ────────────────────────────────────────────────
function useCountUp(target: number, duration = 1200, decimals = 0) {
  const [value, setValue] = useState(0);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let start = 0;
    const steps = 60;
    const increment = target / steps;
    const delay = duration / steps;
    ref.current = setInterval(() => {
      start += increment;
      if (start >= target) {
        setValue(target);
        if (ref.current) clearInterval(ref.current);
      } else {
        setValue(Number(start.toFixed(decimals)));
      }
    }, delay);
    return () => { if (ref.current) clearInterval(ref.current); };
  }, [target, duration, decimals]);

  return value;
}

// ── Scroll Reveal Hook ───────────────────────────────────────────
function useScrollReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.12 }
    );
    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

// ── KPI Card ─────────────────────────────────────────────────────
interface KPICardProps {
  label: string;
  rawValue: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  accent: string;
  borderColor: string;
  sub: string;
  SubIcon: LucideIcon;
  subColor: string;
  delay: number;
}

function KPICard({ label, rawValue, prefix = '', suffix = '', decimals = 0, accent, borderColor, sub, SubIcon, subColor, delay }: KPICardProps) {
  const count = useCountUp(rawValue, 1200, decimals);
  const displayVal = decimals > 0 ? count.toFixed(decimals) : Math.round(count);

  return (
    <div
      className={`reveal gcore-card rounded-apple-xl p-5 flex flex-col justify-between bg-[#080808] [html.light_&]:bg-white [html.light_&]:shadow-light-card ${borderColor}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <span className="text-[11px] font-bold text-neutral-400 [html.light_&]:text-slate-600 uppercase tracking-wider">{label}</span>
      <div className="mt-2 mb-1">
        <span className={`text-[28px] font-extrabold tracking-tight ${accent} animate-count-up`}>
          {prefix}{displayVal}{suffix}
        </span>
      </div>
      <div className="flex items-center gap-1.5 text-xs font-medium pt-2 border-t border-white/[0.06] [html.light_&]:border-slate-100">
        <SubIcon className={`w-3.5 h-3.5 ${subColor}`} strokeWidth={1.8} />
        <span className={subColor}>{sub}</span>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────
export default function DashboardOverviewPage() {
  const { 
    activeClinic, 
    stats, 
    toggleAgentActive, 
    setIsVoiceTesterOpen, 
    setIsManualBookingOpen, 
    setIsPhoneSimulatorOpen 
  } = useClinic();
  useScrollReveal();

  const isAgentActive = activeClinic?.agent_enabled !== false;

  const kpiCards = [
    {
      label: 'Appointments',
      rawValue: stats?.appointments_count ?? 3,
      prefix: '',
      suffix: '',
      decimals: 0,
      accent: 'text-white [html.light_&]:text-slate-900',
      borderColor: 'border border-white/10 [html.light_&]:border-slate-200 hover:border-gcore-orange/40',
      sub: 'Zero collision lock',
      SubIcon: ShieldCheck,
      subColor: 'text-orange-400 [html.light_&]:text-orange-700 font-medium',
    },
    {
      label: 'Total Inbound Calls',
      rawValue: stats?.total_calls_count ?? 3,
      prefix: '',
      suffix: '',
      decimals: 0,
      accent: 'text-white [html.light_&]:text-slate-900',
      borderColor: 'border border-white/10 [html.light_&]:border-slate-200 hover:border-gcore-orange/40',
      sub: 'PSTN & WebRTC',
      SubIcon: PhoneCall,
      subColor: 'text-neutral-400 [html.light_&]:text-slate-500 font-medium',
    },
    {
      label: 'Autonomous Booking Rate',
      rawValue: stats?.booking_rate_percentage ?? 33.3,
      prefix: '',
      suffix: '%',
      decimals: 1,
      accent: 'text-gcore-orange',
      borderColor: 'border border-white/10 [html.light_&]:border-slate-200 hover:border-gcore-orange/40',
      sub: 'AI voice conversion',
      SubIcon: TrendingUp,
      subColor: 'text-orange-400 [html.light_&]:text-orange-700 font-medium',
    },
    {
      label: 'Avg Turnaround Latency',
      rawValue: stats?.avg_turn_latency_ms ?? 579,
      prefix: '',
      suffix: 'ms',
      decimals: 0,
      accent: 'text-white [html.light_&]:text-slate-900',
      borderColor: 'border border-white/10 [html.light_&]:border-slate-200 hover:border-gcore-orange/40',
      sub: 'Sub-800ms human parity',
      SubIcon: Zap,
      subColor: 'text-orange-400 [html.light_&]:text-orange-700 font-medium',
    },
    {
      label: 'Direct Telephony COGS',
      rawValue: stats?.direct_cogs_inr ?? 12.49,
      prefix: '₹',
      suffix: '',
      decimals: 2,
      accent: 'text-white [html.light_&]:text-slate-900',
      borderColor: 'border border-white/10 [html.light_&]:border-slate-200 hover:border-gcore-orange/40',
      sub: '₹3.23 / min rate',
      SubIcon: Coins,
      subColor: 'text-neutral-400 [html.light_&]:text-slate-500 font-medium',
    },
    {
      label: 'Estimated Revenue',
      rawValue: stats?.est_revenue_inr ?? 2300,
      prefix: '₹',
      suffix: '',
      decimals: 0,
      accent: 'text-gcore-orange',
      borderColor: 'border border-white/10 [html.light_&]:border-slate-200 hover:border-gcore-orange/40',
      sub: 'Verified consultations',
      SubIcon: Banknote,
      subColor: 'text-orange-400 [html.light_&]:text-orange-700 font-medium',
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in text-white [html.light_&]:text-slate-900 transition-colors duration-300">

      {/* Title Banner */}
      <div className="reveal gcore-card rounded-apple-xl p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-white/10 [html.light_&]:border-slate-200 bg-[#080808] [html.light_&]:bg-white [html.light_&]:shadow-light-card">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] uppercase font-mono font-bold tracking-wider px-2 py-0.5 rounded-full gcore-badge">
              Active Medical Tenant
            </span>
            <span className={`flex items-center gap-1 text-[10px] font-mono font-semibold ${isAgentActive ? 'text-emerald-400' : 'text-rose-400'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isAgentActive ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
              {isAgentActive ? 'Agent Active' : 'Agent Paused (Forwarding)'}
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-extrabold text-white [html.light_&]:text-slate-900 tracking-tight">
            {activeClinic?.name || 'Apollo Dental Clinic'}
          </h1>
          <div className="flex flex-wrap items-center gap-2 md:gap-3 text-xs text-neutral-400 [html.light_&]:text-slate-600 mt-1.5 font-medium">
            <span className="flex items-center gap-1.5 text-orange-400 [html.light_&]:text-orange-700">
              <span className="status-dot bg-gcore-orange animate-pulse"></span>
              Persona: <strong>{activeClinic?.agent_name || 'Maya'} ({activeClinic?.primary_language === 'mr' ? 'मराठी' : activeClinic?.primary_language === 'hi' ? 'हिंदी' : 'English'})</strong>
            </span>
            <span className="text-neutral-600 [html.light_&]:text-slate-300">•</span>
            <span className="text-neutral-300 [html.light_&]:text-slate-700 font-mono">{activeClinic?.phone_number}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          {/* Master Agent Toggle */}
          <button
            onClick={() => toggleAgentActive(!isAgentActive)}
            className={`px-3.5 py-2 rounded-apple text-xs font-bold transition-apple flex items-center gap-1.5 border cursor-pointer ${
              isAgentActive
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/60'
                : 'bg-rose-950/60 border-rose-500/40 text-rose-300 hover:bg-rose-900/60'
            }`}
            title="Click to toggle AI Agent state"
          >
            <span className={`w-2 h-2 rounded-full ${isAgentActive ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
            <span>{isAgentActive ? 'AI Receptionist ON' : 'AI Receptionist OFF'}</span>
          </button>

          <button
            onClick={() => setIsVoiceTesterOpen(true)}
            className="gcore-btn-dark px-3 md:px-4 py-2 text-xs flex items-center gap-2"
          >
            <Terminal className="w-4 h-4 text-gcore-orange" strokeWidth={1.8} />
            <span className="hidden sm:inline">Voice Console</span>
            <span className="sm:hidden">Voice</span>
          </button>

          <button
            onClick={() => setIsManualBookingOpen(true)}
            className="gcore-btn-orange px-3 md:px-4 py-2 text-xs flex items-center gap-2 shadow-gcore-btn"
          >
            <PlusCircle className="w-4 h-4" strokeWidth={2} />
            <span className="hidden sm:inline">New Booking</span>
            <span className="sm:hidden">Book</span>
          </button>
        </div>
      </div>

      {/* 6 Animated KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        {kpiCards.map((card, i) => (
          <KPICard
            key={card.label}
            {...card}
            delay={i * 80}
          />
        ))}
      </div>

      {/* Live Engine Banner */}
      <div className="reveal gcore-card rounded-apple-xl p-4 md:p-6 text-white [html.light_&]:text-slate-900 flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 border border-gcore-orange/30 [html.light_&]:border-orange-200 shadow-gcore-glow relative overflow-hidden bg-[#080808] [html.light_&]:bg-white [html.light_&]:shadow-light-card">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gcore-orange/10 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-2 z-10">
          <div className="inline-flex items-center gap-2 gcore-badge px-3 py-1 rounded-full text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5 text-gcore-orange" strokeWidth={2} />
            <span>LiveKit · Groq LLaMA 3.3 · Cartesia Sonic · Supabase RLS</span>
          </div>
          <h3 className="text-base md:text-lg font-bold tracking-tight text-white [html.light_&]:text-slate-900">24/7 Autonomous Medical Voice Telephony</h3>
          <p className="text-xs text-neutral-400 [html.light_&]:text-slate-600 max-w-2xl leading-relaxed">
            Inbound telephony to{' '}
            <strong className="text-orange-400 [html.light_&]:text-orange-700 font-mono">
              {activeClinic?.phone_number || '+91-80-4567-8901'}
            </strong>{' '}
            routes to autonomous speech synthesis with instantaneous database locking.
          </p>
        </div>

        <button
          onClick={() => setIsPhoneSimulatorOpen(true)}
          className="gcore-btn-orange px-5 md:px-6 py-3 text-xs font-semibold flex items-center gap-2 shadow-gcore-btn flex-shrink-0 z-10 w-full md:w-auto justify-center"
        >
          <PhoneCall className="w-4 h-4" strokeWidth={2} />
          <span>Launch Phone Simulator</span>
        </button>
      </div>

      {/* Waveform Pipeline Status */}
      <div className="reveal reveal-delay-2 gcore-card rounded-apple-xl p-4 md:p-5 border border-white/10 [html.light_&]:border-slate-200 bg-[#080808] [html.light_&]:bg-white">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Animated waveform bars */}
            <div className="flex items-end gap-[3px] h-7">
              {[14, 22, 18, 26, 20, 16, 24, 18, 14, 20].map((h, i) => (
                <div
                  key={i}
                  className="waveform-bar"
                  style={{ height: `${h}px`, animationDelay: `${i * 0.07}s` }}
                />
              ))}
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Voice Pipeline Active</p>
              <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>VAD → STT → LLM → TTS streaming</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-[11px] font-mono">
            {[
              { label: 'VAD', val: '~15ms' },
              { label: 'STT', val: '~178ms' },
              { label: 'LLM', val: '~215ms' },
              { label: 'TTS', val: '~170ms' },
            ].map(s => (
              <span key={s.label} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full gcore-card border border-white/10 [html.light_&]:border-slate-200">
                <span style={{ color: 'var(--text-muted)' }}>{s.label}</span>
                <span className="text-gcore-orange font-semibold">{s.val}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
