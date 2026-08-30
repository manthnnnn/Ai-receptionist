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
    description: 'Operates in the cloud — handles calls even when clinic systems are closed.',
    color: 'text-primary-600 bg-primary-50 border border-primary-100',
  },
  {
    icon: ShieldCheck,
    title: 'Zero Double-Bookings',
    description: 'Database-level advisory locks prevent conflicting slot reservations.',
    color: 'text-emerald-600 bg-emerald-50 border border-emerald-100',
  },
  {
    icon: Zap,
    title: 'Sub-800ms Turnaround',
    description: 'Streaming bi-directional voice pipeline with instant interruption barge-in.',
    color: 'text-amber-600 bg-amber-50 border border-amber-100',
  },
  {
    icon: Users,
    title: 'Multi-Tenant Isolation',
    description: 'PostgreSQL Row-Level Security ensures complete data privacy for each clinic.',
    color: 'text-violet-600 bg-violet-50 border border-violet-100',
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
  'LLM: Groq LLaMA 3.3',
  'Lock: SELECT FOR UPDATE',
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-primary-500 selection:text-white">
      {/* Navigation */}
      <nav className="border-b border-slate-200/80 bg-white/85 backdrop-blur-xl sticky top-0 z-40 px-6 py-3.5 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-apple bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white shadow-sm">
              <Sparkles className="w-4 h-4" strokeWidth={2} />
            </div>
            <span className="font-semibold text-[15px] tracking-apple text-slate-900">Clinic AI</span>
          </div>

          <Link
            href="/dashboard"
            className="bg-primary-500 hover:bg-primary-600 text-white font-medium text-xs px-4.5 py-2 rounded-apple transition-apple flex items-center gap-1.5 shadow-sm"
          >
            <span>Open Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} />
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 md:py-28 px-6 max-w-4xl mx-auto text-center space-y-7">
        <div className="inline-flex items-center gap-2 bg-primary-50 border border-primary-200/70 text-primary-700 text-xs font-medium px-4 py-1.5 rounded-full shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-primary-500" strokeWidth={1.5} />
          <span>Multilingual Voice AI · Marathi, Hindi & English</span>
        </div>

        <h1 className="text-4xl md:text-[54px] font-semibold text-slate-950 tracking-tight leading-[1.12]">
          Never Miss a <br className="hidden md:block" />Patient Call Again
        </h1>

        <p className="text-slate-600 text-base md:text-lg max-w-xl mx-auto leading-relaxed">
          24/7 AI phone receptionist that answers patient calls, checks doctor availability in real-time, and books appointments without double-booking collisions.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-primary-500 hover:bg-primary-600 text-white font-medium px-7 py-3 rounded-apple shadow-md shadow-primary-500/20 transition-apple text-sm"
          >
            <Mic className="w-4 h-4" strokeWidth={1.5} />
            <span>Try Voice Demo</span>
          </Link>
        </div>

        {/* Tech Stack Pills */}
        <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
          {techStack.map((item) => (
            <span key={item} className="flex items-center gap-1.5 text-xs text-slate-500 bg-white border border-slate-200 px-3 py-1 rounded-full font-mono shadow-xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" strokeWidth={1.5} />
              {item}
            </span>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-14 px-6 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f) => (
            <div
              key={f.title}
              className="bg-white border border-slate-200/90 hover:border-primary-300 p-6 rounded-apple-lg space-y-3 transition-apple shadow-card card-hover"
            >
              <div className={`w-10 h-10 rounded-apple ${f.color} flex items-center justify-center`}>
                <f.icon className="w-5 h-5" strokeWidth={1.5} />
              </div>
              <h3 className="text-[15px] font-semibold text-slate-900 tracking-apple">{f.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-14 px-6 max-w-5xl mx-auto text-center space-y-9">
        <div>
          <h2 className="text-2xl md:text-3xl font-semibold text-slate-950 tracking-tight">Transparent Pricing</h2>
          <p className="text-xs text-slate-500 mt-2">Direct COGS ~₹3.23/min with 54%–67% gross margins</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
          {pricingTiers.map((tier) => (
            <div
              key={tier.name}
              className={`p-6 rounded-apple-lg space-y-4 relative transition-apple shadow-card ${
                tier.highlighted
                  ? 'bg-gradient-to-b from-blue-50/50 to-white border-2 border-primary-500/50 shadow-md'
                  : 'bg-white border border-slate-200/90'
              }`}
            >
              {tier.highlighted && (
                <span className="absolute -top-3 right-4 bg-primary-500 text-white text-[10px] font-semibold px-2.5 py-0.5 rounded-full shadow-xs">
                  POPULAR
                </span>
              )}
              <span className="text-xs font-semibold text-primary-600 uppercase tracking-wider">{tier.name}</span>
              <div className="text-2xl font-semibold text-slate-900 tracking-apple">
                {tier.price} <span className="text-xs font-normal text-slate-500">/ mo</span>
              </div>
              <p className="text-xs text-slate-500">{tier.description}</p>
              <ul className="space-y-2 text-xs text-slate-600 pt-3 border-t border-slate-100">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" strokeWidth={1.5} />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-8 px-6 text-center text-xs text-slate-500">
        <p>© 2026 Clinic AI. All rights reserved.</p>
      </footer>
    </div>
  );
}
