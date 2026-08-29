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
  Mic
} from 'lucide-react';

const features = [
  {
    icon: PhoneCall,
    title: '24/7 Autonomous Telephony',
    description: 'Operates in the cloud — the clinic dashboard does not need to stay open.',
    color: 'text-primary-500 bg-primary-50',
  },
  {
    icon: ShieldCheck,
    title: 'Zero Double-Bookings',
    description: 'Database-level advisory locks prevent slot collisions.',
    color: 'text-emerald-500 bg-emerald-50',
  },
  {
    icon: Zap,
    title: 'Sub-800ms Turnaround',
    description: 'Streaming audio pipeline with instant interruption barge-in.',
    color: 'text-amber-500 bg-amber-50',
  },
  {
    icon: Users,
    title: 'Multi-Tenant Isolation',
    description: 'PostgreSQL Row-Level Security ensures complete data separation.',
    color: 'text-violet-500 bg-violet-50',
  },
];

const pricingTiers = [
  {
    name: 'Starter',
    price: '₹2,999',
    description: 'Solo practice with 1 doctor',
    features: ['300 AI Voice minutes', '24/7 Call handling', 'Atomic slot booking'],
    highlighted: false,
  },
  {
    name: 'Growth',
    price: '₹6,999',
    description: '2–5 Doctor Polyclinic',
    features: ['1,000 AI Voice minutes', 'Roster & breaks manager', 'Custom FAQ knowledge base'],
    highlighted: true,
  },
  {
    name: 'Pro',
    price: '₹14,999',
    description: 'Multi-specialty center',
    features: ['2,500 AI Voice minutes', 'Priority telephony routing', 'Multi-doctor schedule sync'],
    highlighted: false,
  },
];

const techStack = [
  'VAD: Silero (Local)',
  'STT: Deepgram Nova-2',
  'LLM: Groq LLaMA 3.1',
  'Lock: SELECT FOR UPDATE',
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-surface-950 text-surface-100 flex flex-col selection:bg-primary-500 selection:text-white">
      {/* Navigation */}
      <nav className="border-b border-white/5 bg-surface-950/80 backdrop-blur-xl sticky top-0 z-40 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-apple bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white shadow-sm">
              <Sparkles className="w-4 h-4" strokeWidth={2} />
            </div>
            <span className="font-semibold text-[15px] tracking-apple text-white">Clinic AI</span>
          </div>

          <Link
            href="/dashboard"
            className="bg-white hover:bg-surface-100 text-surface-900 font-medium text-xs px-5 py-2.5 rounded-apple transition-apple flex items-center gap-1.5 shadow-sm"
          >
            <span>Open Dashboard</span>
            <ArrowRight className="w-3 h-3" strokeWidth={1.5} />
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-24 px-6 max-w-4xl mx-auto text-center space-y-8">
        <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 text-primary-300 text-xs font-medium px-4 py-1.5 rounded-full">
          <Sparkles className="w-3 h-3" strokeWidth={1.5} />
          <span>Sub-800ms Bi-Directional Voice Pipeline</span>
        </div>

        <h1 className="text-4xl md:text-[56px] font-semibold text-white tracking-tight leading-[1.1]">
          Never Miss a <br className="hidden md:block" />Patient Call Again
        </h1>

        <p className="text-surface-400 text-base md:text-lg max-w-xl mx-auto leading-relaxed">
          24/7 AI phone receptionist that handles patient calls, checks availability in real-time, and books appointments without double-booking collisions.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-primary-500 hover:bg-primary-600 text-white font-medium px-7 py-3 rounded-apple shadow-lg shadow-primary-500/20 transition-apple text-sm"
          >
            <Mic className="w-4 h-4" strokeWidth={1.5} />
            <span>Try Interactive Demo</span>
          </Link>
        </div>

        {/* Tech Stack Pills */}
        <div className="pt-6 flex flex-wrap items-center justify-center gap-3">
          {techStack.map((item) => (
            <span key={item} className="flex items-center gap-1.5 text-xs text-surface-400 font-mono">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" strokeWidth={1.5} />
              {item}
            </span>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-6 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f) => (
            <div
              key={f.title}
              className="bg-white/[0.03] border border-white/5 hover:border-white/10 p-6 rounded-apple-lg space-y-3 transition-apple"
            >
              <div className={`w-10 h-10 rounded-apple ${f.color} flex items-center justify-center`}>
                <f.icon className="w-5 h-5" strokeWidth={1.5} />
              </div>
              <h3 className="text-[15px] font-semibold text-white tracking-apple">{f.title}</h3>
              <p className="text-xs text-surface-400 leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16 px-6 max-w-5xl mx-auto text-center space-y-10">
        <div>
          <h2 className="text-2xl md:text-3xl font-semibold text-white tracking-tight">Transparent Pricing</h2>
          <p className="text-xs text-surface-400 mt-2">Direct COGS ~₹3.23/min with 54%–67% gross margins</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
          {pricingTiers.map((tier) => (
            <div
              key={tier.name}
              className={`p-6 rounded-apple-lg space-y-4 relative transition-apple ${
                tier.highlighted
                  ? 'bg-white/[0.06] border-2 border-primary-500/50 shadow-lg shadow-primary-500/10'
                  : 'bg-white/[0.03] border border-white/5'
              }`}
            >
              {tier.highlighted && (
                <span className="absolute -top-3 right-4 bg-primary-500 text-white text-[10px] font-semibold px-2.5 py-0.5 rounded-full">
                  POPULAR
                </span>
              )}
              <span className="text-xs font-semibold text-primary-400 uppercase tracking-wider">{tier.name}</span>
              <div className="text-2xl font-semibold text-white tracking-apple">
                {tier.price} <span className="text-xs font-normal text-surface-400">/ mo</span>
              </div>
              <p className="text-xs text-surface-400">{tier.description}</p>
              <ul className="space-y-2 text-xs text-surface-300 pt-3 border-t border-white/5">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" strokeWidth={1.5} />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-white/5 py-8 px-6 text-center text-xs text-surface-500">
        <p>© 2026 Clinic AI. All rights reserved.</p>
      </footer>
    </div>
  );
}
