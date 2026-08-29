import React from 'react';
import Link from 'next/link';
import { 
  Sparkles, 
  PhoneCall, 
  ShieldCheck, 
  Zap, 
  Users, 
  ArrowRight, 
  CheckCircle2, 
  Mic,
  Activity,
  Lock,
  Stethoscope,
  ChevronRight,
  Headphones,
  Cpu
} from 'lucide-react';

const features = [
  {
    icon: PhoneCall,
    title: 'Autonomous Telephony Engine',
    badge: 'Real-time WebRTC + SIP',
    description: 'Direct cellular carrier line connection via cloud voice pipelines. Zero local hardware or server maintenance required.',
    gradient: 'from-sky-500/20 to-blue-600/20',
    iconColor: 'text-sky-400',
  },
  {
    icon: ShieldCheck,
    title: 'Atomic Booking Protection',
    badge: 'PostgreSQL Advisory Locks',
    description: 'Transaction-level concurrency locking guarantees impossible double-booking across simultaneous multi-caller inquiries.',
    gradient: 'from-emerald-500/20 to-teal-600/20',
    iconColor: 'text-emerald-400',
  },
  {
    icon: Zap,
    title: 'Sub-800ms Latency',
    badge: 'Zero-Lag Interruption',
    description: 'Silero neural voice activity detection (VAD) with instant human barge-in and human-parity conversational rhythm.',
    gradient: 'from-cyan-500/20 to-indigo-600/20',
    iconColor: 'text-cyan-400',
  },
  {
    icon: Stethoscope,
    title: 'Clinical Knowledge Matrix',
    badge: 'HIPAA & RLS Protected',
    description: 'Pre-loaded with doctor consultation schedules, treatment procedures, fees, and polyclinic FAQ context.',
    gradient: 'from-violet-500/20 to-purple-600/20',
    iconColor: 'text-violet-400',
  },
];

const stats = [
  { value: '575ms', label: 'Average Voice Turn Latency', sub: 'Sub-second real-time feel' },
  { value: '99.98%', label: 'Appointment Collision Protection', sub: 'ACID transactional locks' },
  { value: '24/7/365', label: 'Autonomous Availability', sub: 'Zero unanswered patient calls' },
  { value: '₹3.23', label: 'Direct COGS / min', sub: '65%+ gross operating margin' },
];

const techBadges = [
  { name: 'VAD', val: 'Silero Neural' },
  { name: 'STT', val: 'Deepgram Nova-2' },
  { name: 'LLM', val: 'Groq LLaMA 3.1 8B' },
  { name: 'TTS', val: 'Cartesia Sonic' },
  { name: 'DB Lock', val: 'PostgreSQL Advisory' },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-mesh-dark text-slate-100 flex flex-col selection:bg-sky-500 selection:text-white relative overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-sky-500/15 via-cyan-500/5 to-transparent blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-[600px] -left-40 w-[500px] h-[500px] bg-emerald-500/10 blur-[140px] pointer-events-none -z-10" />
      <div className="absolute top-[900px] -right-40 w-[600px] h-[600px] bg-indigo-500/10 blur-[160px] pointer-events-none -z-10" />

      {/* Navigation */}
      <nav className="border-b border-white/[0.07] bg-slate-950/60 backdrop-blur-2xl sticky top-0 z-50 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-apple bg-gradient-to-br from-sky-400 via-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-glow-cyan">
              <Activity className="w-5 h-5" strokeWidth={2.2} />
            </div>
            <div>
              <span className="font-semibold text-[16px] tracking-tight text-white flex items-center gap-1.5">
                Clinic<span className="text-sky-400 font-bold">AI</span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">Pro</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="bg-white hover:bg-slate-100 text-slate-950 font-medium text-xs px-5 py-2.5 rounded-apple transition-apple flex items-center gap-2 shadow-lg shadow-white/10 hover:shadow-white/20 active:scale-95"
            >
              <span>Launch Console</span>
              <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-20 px-6 max-w-5xl mx-auto text-center space-y-8 relative">
        {/* Apple-style pill */}
        <div className="inline-flex items-center gap-2.5 bg-slate-900/90 border border-slate-700/60 text-sky-300 text-xs font-medium px-4 py-1.5 rounded-full shadow-apple-card animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Medical-Grade Voice Intelligence</span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-400">Sub-800ms Bi-directional</span>
        </div>

        {/* Title */}
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-white tracking-tightest leading-[1.05] animate-slide-up">
          The 24/7 AI Receptionist <br />
          <span className="bg-gradient-to-r from-sky-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
            Engineered for Modern Clinics.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-slate-400 text-base sm:text-xl max-w-2xl mx-auto leading-relaxed font-normal">
          Fields incoming telephone calls, checks real-time doctor rosters, resolves patient FAQs, and atomically locks appointments with zero collision.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto flex items-center justify-center gap-2.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-semibold px-8 py-3.5 rounded-apple shadow-glow-cyan transition-apple text-sm active:scale-95"
          >
            <Mic className="w-4 h-4" strokeWidth={2} />
            <span>Try Interactive Voice Demo</span>
          </Link>

          <Link
            href="/dashboard/appointments"
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-200 font-medium px-7 py-3.5 rounded-apple transition-apple text-sm active:scale-95"
          >
            <span>Explore Dashboard Roster</span>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </Link>
        </div>

        {/* Tech Stack Bar */}
        <div className="pt-8 flex flex-wrap items-center justify-center gap-2.5 max-w-3xl mx-auto">
          {techBadges.map((badge) => (
            <div
              key={badge.name}
              className="glass-chip px-3 py-1.5 rounded-apple text-xs text-slate-300 flex items-center gap-2 font-mono"
            >
              <span className="text-slate-500 uppercase text-[10px] tracking-wider font-semibold">{badge.name}</span>
              <span className="text-sky-300 font-medium">{badge.val}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Interactive Apple-Style Product Preview Showcase */}
      <section className="py-8 px-6 max-w-6xl mx-auto w-full">
        <div className="glass-panel rounded-apple-2xl p-6 sm:p-10 shadow-apple-card border border-white/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="space-y-4 max-w-md text-left">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-3 py-1 rounded-full">
                <span className="status-dot bg-emerald-400 animate-ping" />
                Live Inbound Telephony Stream
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Natural conversations. Zero robot delays.
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                Patients speak naturally in full sentences. The AI understands context, validates doctor slots against leave schedules, and issues instant confirmation via SMS.
              </p>
              
              <div className="pt-2 flex items-center gap-4 text-xs text-slate-300 font-medium">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-sky-400" />
                  <span>Sub-800ms Barge-in</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Atomic Slot Lock</span>
                </div>
              </div>
            </div>

            {/* Mock Audio Visualizer Box */}
            <div className="w-full lg:w-[480px] bg-slate-950/80 border border-slate-800 rounded-apple-xl p-5 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center">
                    <Headphones className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white">Incoming Call from +91 98765 43210</div>
                    <div className="text-[10px] text-slate-400">Dr. Sarah Jenkins (Cardiology)</div>
                  </div>
                </div>
                <span className="text-[11px] font-mono font-medium text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800/50">
                  Active • 00:24
                </span>
              </div>

              {/* Dynamic Soundwave Bars */}
              <div className="bg-slate-900/90 rounded-apple p-4 flex items-center justify-center gap-1.5 h-20">
                {[40, 75, 30, 90, 60, 100, 45, 80, 50, 85, 35, 70, 95, 40, 60, 80, 50, 30, 90, 65].map((h, i) => (
                  <div
                    key={i}
                    className="w-1.5 bg-gradient-to-t from-sky-500 to-cyan-300 rounded-full animate-wave"
                    style={{
                      height: `${h}%`,
                      animationDelay: `${(i % 5) * 0.15}s`,
                    }}
                  />
                ))}
              </div>

              <div className="text-xs text-slate-300 italic bg-slate-900/50 p-3 rounded-apple border border-slate-800/80">
                &ldquo;Yes, Dr. Jenkins has an open consultation slot tomorrow at 10:30 AM. Shall I reserve this for you right now?&rdquo;
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Metrics Row */}
      <section className="py-12 px-6 max-w-6xl mx-auto w-full">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="glass-panel p-6 rounded-apple-lg border border-white/5 space-y-1.5 transition-apple hover:border-sky-500/30"
            >
              <div className="text-3xl sm:text-4xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                {s.value}
              </div>
              <div className="text-xs font-semibold text-sky-400">{s.label}</div>
              <div className="text-[11px] text-slate-400">{s.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 px-6 max-w-6xl mx-auto w-full space-y-8">
        <div className="text-center space-y-3">
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Engineered for High-Volume Medical Practices
          </h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">
            From single doctor clinics to multi-specialty healthcare networks with dozens of concurrent lines.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f) => (
            <div
              key={f.title}
              className="glass-panel p-6 rounded-apple-xl border border-white/5 space-y-4 transition-apple hover:border-sky-500/40 hover:-translate-y-1 relative group"
            >
              <div className={`w-12 h-12 rounded-apple bg-gradient-to-br ${f.gradient} flex items-center justify-center ${f.iconColor}`}>
                <f.icon className="w-6 h-6" strokeWidth={1.8} />
              </div>
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-sky-400/90 font-semibold">{f.badge}</span>
                <h3 className="text-base font-semibold text-white tracking-apple">{f.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{f.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-white/[0.07] py-8 px-6 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-sky-400" />
            <span className="text-slate-400 font-semibold">Clinic AI Pro System</span>
          </div>
          <p>© 2026 Clinic AI Technologies Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

