'use client';

import React, { useState } from 'react';
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
  Cpu, 
  Globe, 
  Headphones, 
  Stethoscope, 
  AlertTriangle,
  ChevronRight,
  Play,
  Volume2
} from 'lucide-react';
import { VoiceTestModal } from '@/components/voice/voice-test-modal';
import { PhoneSimulatorModal } from '@/components/voice/phone-simulator-modal';
import { ClinicProvider, useClinic } from '@/components/layout/clinic-context';

function HomeContent() {
  const { setIsVoiceTesterOpen, setIsPhoneSimulatorOpen } = useClinic();
  const [activeTab, setActiveTab] = useState<'mr' | 'hi' | 'en'>('mr');

  const capabilities = [
    {
      id: 'stt',
      title: 'Multilingual STT',
      sub: 'Marathi, Hindi & English',
      icon: Mic,
      tag: 'Edge Native',
    },
    {
      id: 'sip',
      title: 'Carrier Telephony',
      sub: 'PSTN & SIP Webhooks',
      icon: PhoneCall,
      tag: '24/7 Uptime',
    },
    {
      id: 'llm',
      title: 'Groq LLaMA 3.3',
      sub: 'Sub-250ms TTFT',
      icon: Zap,
      tag: 'Humanoid',
    },
    {
      id: 'lock',
      title: 'Atomic Slot Lock',
      sub: 'Zero Collision Booking',
      icon: ShieldCheck,
      tag: 'ACID Safe',
    },
    {
      id: 'emr',
      title: 'Doctor Roster Matrix',
      sub: 'Live Fees & Schedules',
      icon: Stethoscope,
      tag: 'Real-time',
    },
    {
      id: 'triage',
      title: 'Emergency Triage',
      sub: 'Instant Human Transfer',
      icon: AlertTriangle,
      tag: 'Medical Safety',
    },
  ];

  const features = [
    {
      icon: PhoneCall,
      title: '24/7 Autonomous Telephony',
      description: 'Answers patient calls in under 1 ring. Operates seamlessly 24/7/365 with zero human fatigue.',
      tag: 'Instant Pickup',
    },
    {
      icon: Globe,
      title: 'Native Marathi, Hindi & English',
      description: 'Converses fluently with Indian dialect adaptation, natural pronunciation, and Devanagari numerals.',
      tag: 'Multilingual',
    },
    {
      icon: ShieldCheck,
      title: 'Zero Double-Booking Guarantee',
      description: 'Database-level concurrency locks guarantee conflicting patient slots are mathematically impossible.',
      tag: 'Atomic Protection',
    },
    {
      icon: Zap,
      title: 'Sub-600ms Conversational Turn',
      description: 'Ultra-low latency streaming speech recognition and Groq inference for zero-lag human conversation.',
      tag: 'Human Parity',
    },
  ];

  const sampleAudios = {
    mr: {
      user: 'उद्या संध्याकाळी ४ वाजता डॉ. वर्मा यांच्यासोबत रूट कॅनलची वेळ मिळेल का?',
      ai: 'हो नक्कीच! डॉ. आशिष वर्मा रूट कॅनल वेदनारहित उपचारात तज्ज्ञ आहेत. मी उद्या संध्याकाळी ४:०० वाजताची आपली भेट निश्चित करू का?',
      doctor: 'Dr. Ashish Verma (Endodontics)',
    },
    hi: {
      user: 'नमस्ते, कल सुबह 10 बजे दांत की सफाई के लिए डॉक्टर उपलब्ध हैं क्या?',
      ai: 'जी बिल्कुल! डॉ. रोहन मेहता कल सुबह 10:00 बजे उपलब्ध हैं। उनका परामर्श शुल्क ₹500 है। क्या मैं आपका स्लॉट बुक कर दूँ?',
      doctor: 'Dr. Rohan Mehta (General Dentistry)',
    },
    en: {
      user: 'Do you offer cashless claims for Star Health, and what is the consultation fee for braces?',
      ai: 'Yes, absolutely! We support instant cashless claims with Star Health, and Dr. Neha Kulkarni’s orthodontic consultation is ₹750. Shall I reserve a slot for you?',
      doctor: 'Dr. Neha Kulkarni (Orthodontics)',
    },
  };

  const pricingTiers = [
    {
      name: 'Starter Practice',
      price: '₹2,999',
      unit: '/ mo',
      desc: 'Single doctor clinic with automated call reception',
      features: ['300 AI Voice minutes included', '24/7 Inbound telephone reception', 'Marathi, Hindi & English support', 'Zero double-booking protection', 'SMS confirmation dispatch'],
      highlight: false,
    },
    {
      name: 'Polyclinic Growth',
      price: '₹6,999',
      unit: '/ mo',
      desc: '2–5 Doctor multi-specialty healthcare center',
      features: ['1,000 AI Voice minutes included', 'Multi-doctor schedule & break manager', 'Custom clinic FAQ knowledge base', 'Instant emergency human triage transfer', 'Real-time analytics & telemetry'],
      highlight: true,
    },
    {
      name: 'Hospital Network',
      price: '₹14,999',
      unit: '/ mo',
      desc: 'High-volume healthcare centers & multi-branch hospitals',
      features: ['2,500 AI Voice minutes included', 'Multi-branch SIP trunk routing', 'Dedicated WhatsApp confirmation bot', 'Custom EMR / Hospital CRM integration', '99.99% SLA & Dedicated Account Manager'],
      highlight: false,
    },
  ];

  return (
    <div className="min-h-screen bg-gcore-canvas text-slate-100 flex flex-col relative overflow-hidden">
      {/* Gcore Electric Flare & Lighting Rays (Exact match from reference image) */}
      <div className="gcore-electric-ray" />
      <div className="gcore-electric-streak" />
      
      {/* Top Navbar */}
      <nav className="border-b border-white/[0.07] bg-gcore-dark/80 backdrop-blur-xl sticky top-0 z-40 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gcore-orange to-amber-600 flex items-center justify-center text-white shadow-gcore-btn">
              <Activity className="w-4 h-4" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-lg tracking-tight text-white flex items-center gap-1.5">
              Clinic<span className="text-gcore-orange">AI</span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full gcore-badge">
                Edge 2.0
              </span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-xs font-medium text-slate-300">
            <a href="#features" className="hover:text-gcore-orange transition-colors">Features</a>
            <a href="#architecture" className="hover:text-gcore-orange transition-colors">Architecture</a>
            <a href="#demo" className="hover:text-gcore-orange transition-colors">Live Demo</a>
            <a href="#pricing" className="hover:text-gcore-orange transition-colors">Pricing</a>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="gcore-btn-dark px-4 py-2 text-xs"
            >
              Sign in
            </Link>
            <Link
              href="/dashboard"
              className="gcore-btn-orange px-5 py-2 text-xs"
            >
              Launch Console
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-16 px-6 max-w-6xl mx-auto text-center relative z-10 space-y-7">
        {/* Beta Release Pill */}
        <div className="inline-flex items-center gap-2 gcore-badge px-4 py-1.5 rounded-full text-xs font-medium animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-gcore-orange animate-pulse" />
          <span className="text-orange-200">✨ Powered by Groq LLaMA 3.3 · Sub-250ms Edge Inference</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold text-white tracking-tightest leading-[1.08] max-w-5xl mx-auto animate-slide-up">
          Inference at the Edge <br />
          <span className="bg-gradient-to-r from-white via-orange-100 to-gcore-orange bg-clip-text text-transparent">
            Humanoid AI Receptionist
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-slate-400 text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed font-normal">
          Boost your medical practice&apos;s speed and efficiency globally with 24/7 autonomous telephony. Speaks fluent Marathi, Hindi &amp; English with zero-collision slot booking.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
          <button
            onClick={() => setIsPhoneSimulatorOpen(true)}
            className="w-full sm:w-auto gcore-btn-orange px-8 py-3.5 text-sm font-semibold flex items-center justify-center gap-2 shadow-gcore-btn"
          >
            <span>Get started</span>
            <ArrowRight className="w-4 h-4" strokeWidth={2} />
          </button>

          <button
            onClick={() => setIsVoiceTesterOpen(true)}
            className="w-full sm:w-auto gcore-btn-dark px-7 py-3.5 text-sm font-medium flex items-center justify-center gap-2"
          >
            <Mic className="w-4 h-4 text-gcore-orange" strokeWidth={2} />
            <span>Book a demo</span>
          </button>
        </div>

        {/* ─── Gcore Interactive Neural Chip & Circuit Diagram (Exact match from reference) ─── */}
        <div id="architecture" className="pt-14 pb-8 max-w-5xl mx-auto relative">
          <div className="gcore-card rounded-apple-2xl p-8 sm:p-12 relative overflow-hidden border border-white/[0.09]">
            {/* Ambient Background Glow */}
            <div className="absolute inset-0 bg-gradient-to-b from-gcore-orange/[0.07] via-transparent to-transparent pointer-events-none" />

            <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-8 relative z-10">
              {/* Left Satellite Nodes */}
              <div className="space-y-4">
                {capabilities.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    className="gcore-card p-4 rounded-apple-lg flex items-center justify-between gap-3 text-left hover:border-gcore-orange/40 transition-apple group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-apple bg-white/[0.05] border border-white/10 flex items-center justify-center text-gcore-orange group-hover:scale-110 transition-apple">
                        <item.icon className="w-5 h-5" strokeWidth={1.8} />
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-white">{item.title}</h4>
                        <p className="text-[11px] text-slate-400">{item.sub}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-medium text-orange-300 bg-orange-950/60 border border-orange-800/40 px-2 py-0.5 rounded-full">
                      {item.tag}
                    </span>
                  </div>
                ))}
              </div>

              {/* Center Glowing AI Chip (Exact match from reference image) */}
              <div className="flex flex-col items-center justify-center py-6">
                <div className="relative">
                  {/* Outer Pulsing Glow */}
                  <div className="absolute -inset-4 bg-gcore-orange/30 rounded-3xl blur-2xl animate-glow-pulse" />
                  
                  {/* The Physical AI Chip Container */}
                  <div className="relative w-36 h-36 sm:w-40 sm:h-40 rounded-3xl gcore-ai-chip flex flex-col items-center justify-center text-center p-4 border-2 border-gcore-orange/60">
                    {/* Chip Top/Bottom Contact Pins */}
                    <div className="absolute -top-2 flex gap-1.5">
                      {[...Array(6)].map((_, i) => (
                        <div key={i} className="w-1.5 h-2 bg-gcore-orange/80 rounded-t" />
                      ))}
                    </div>
                    <div className="absolute -bottom-2 flex gap-1.5">
                      {[...Array(6)].map((_, i) => (
                        <div key={i} className="w-1.5 h-2 bg-gcore-orange/80 rounded-b" />
                      ))}
                    </div>

                    <span className="text-3xl font-extrabold text-white tracking-wider font-mono">
                      AI
                    </span>
                    <span className="text-[10px] text-orange-200 uppercase font-mono font-bold tracking-widest mt-1">
                      Neural Core
                    </span>
                    <span className="text-[9px] text-emerald-400 flex items-center gap-1 mt-1 font-mono">
                      <span className="status-dot bg-emerald-400" />
                      24/7 Edge Live
                    </span>
                  </div>
                </div>

                <div className="mt-4 text-center">
                  <span className="text-xs font-semibold text-slate-300">Autonomous Edge Orchestrator</span>
                  <p className="text-[11px] text-slate-500 font-mono">575ms Human-Parity Pipeline</p>
                </div>
              </div>

              {/* Right Satellite Nodes */}
              <div className="space-y-4">
                {capabilities.slice(3, 6).map((item) => (
                  <div
                    key={item.id}
                    className="gcore-card p-4 rounded-apple-lg flex items-center justify-between gap-3 text-left hover:border-gcore-orange/40 transition-apple group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-apple bg-white/[0.05] border border-white/10 flex items-center justify-center text-gcore-orange group-hover:scale-110 transition-apple">
                        <item.icon className="w-5 h-5" strokeWidth={1.8} />
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-white">{item.title}</h4>
                        <p className="text-[11px] text-slate-400">{item.sub}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-medium text-orange-300 bg-orange-950/60 border border-orange-800/40 px-2 py-0.5 rounded-full">
                      {item.tag}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive In-Browser Live Audio Playground */}
      <section id="demo" className="py-14 px-6 max-w-5xl mx-auto w-full relative z-10">
        <div className="gcore-card rounded-apple-2xl p-6 sm:p-10 border border-white/10 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-gcore-orange mb-1">
                <Volume2 className="w-4 h-4" />
                <span>Live Interactive Telephony Audio</span>
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                Test the Humanoid AI Receptionist Right Now
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Listen to real conversational turns in your preferred Indian language.
              </p>
            </div>

            {/* Language Switcher Tabs */}
            <div className="flex items-center bg-slate-900 border border-white/10 rounded-apple p-1 text-xs">
              <button
                onClick={() => setActiveTab('mr')}
                className={`px-3 py-1.5 rounded-lg transition-apple font-medium ${
                  activeTab === 'mr' ? 'bg-gcore-orange text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                मराठी (Marathi)
              </button>
              <button
                onClick={() => setActiveTab('hi')}
                className={`px-3 py-1.5 rounded-lg transition-apple font-medium ${
                  activeTab === 'hi' ? 'bg-gcore-orange text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                हिंदी (Hindi)
              </button>
              <button
                onClick={() => setActiveTab('en')}
                className={`px-3 py-1.5 rounded-lg transition-apple font-medium ${
                  activeTab === 'en' ? 'bg-gcore-orange text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                English
              </button>
            </div>
          </div>

          {/* Dialogue Player Card */}
          <div className="bg-slate-950/80 border border-white/[0.08] rounded-apple-xl p-5 space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-400 border-b border-white/5 pb-3">
              <span className="font-mono text-orange-300">Context: {sampleAudios[activeTab].doctor}</span>
              <span className="text-emerald-400 flex items-center gap-1.5">
                <span className="status-dot bg-emerald-400" />
                Latency: 215ms TTFT
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex gap-2.5 items-start">
                <span className="px-2 py-0.5 rounded bg-white/10 text-slate-200 border border-white/10 font-mono font-bold shrink-0">Caller</span>
                <p className="text-slate-200 leading-relaxed font-normal italic">&ldquo;{sampleAudios[activeTab].user}&rdquo;</p>
              </div>

              <div className="flex gap-2.5 items-start">
                <span className="px-2 py-0.5 rounded bg-orange-500/20 text-orange-300 border border-orange-500/30 font-mono font-bold shrink-0">AI Maya</span>
                <p className="text-slate-100 leading-relaxed font-medium">&ldquo;{sampleAudios[activeTab].ai}&rdquo;</p>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={() => setIsVoiceTesterOpen(true)}
                className="gcore-btn-orange px-5 py-2.5 text-xs font-semibold flex items-center gap-2"
              >
                <Mic className="w-3.5 h-3.5" />
                <span>Speak live in {activeTab === 'mr' ? 'मराठी' : activeTab === 'hi' ? 'हिंदी' : 'English'}</span>
              </button>

              <span className="text-[11px] text-slate-500 font-mono">
                Audio synthesized with native Indian speech tempo (1.06x)
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section id="features" className="py-14 px-6 max-w-6xl mx-auto w-full relative z-10 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Engineered for Modern Clinics &amp; Hospitals
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
            Everything your medical practice needs to automate incoming calls with zero double-bookings.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f) => (
            <div
              key={f.title}
              className="gcore-card p-6 rounded-apple-xl space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-apple bg-gcore-orange/10 border border-gcore-orange/30 flex items-center justify-center text-gcore-orange">
                  <f.icon className="w-5 h-5" strokeWidth={1.8} />
                </div>
                <span className="text-[10px] font-mono font-medium text-orange-300 bg-orange-950/60 border border-orange-800/40 px-2 py-0.5 rounded-full">
                  {f.tag}
                </span>
              </div>
              <h3 className="text-sm font-semibold text-white tracking-tight">{f.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16 px-6 max-w-5xl mx-auto w-full relative z-10 space-y-10 text-center">
        <div>
          <div className="inline-flex items-center gap-2 gcore-badge px-3 py-1 rounded-full text-xs font-medium mb-2">
            <span>Transparent Pricing</span>
          </div>
          <h2 className="text-3xl font-bold text-white tracking-tight">
            Predictable ROI from Day One
          </h2>
          <p className="text-xs text-slate-400 mt-1">Direct Telephony COGS ~₹3.23/min with 67%+ operating margins</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          {pricingTiers.map((tier) => (
            <div
              key={tier.name}
              className={`p-6 rounded-apple-xl space-y-5 relative transition-apple ${
                tier.highlight
                  ? 'gcore-card border-2 border-gcore-orange/70 shadow-gcore-glow'
                  : 'gcore-card'
              }`}
            >
              {tier.highlight && (
                <span className="absolute -top-3 right-6 gcore-btn-orange text-[10px] font-bold px-3 py-0.5 shadow-sm">
                  MOST POPULAR
                </span>
              )}
              <div>
                <span className="text-xs font-semibold text-orange-400 uppercase tracking-wider">{tier.name}</span>
                <div className="text-3xl font-bold text-white tracking-tight mt-1">
                  {tier.price} <span className="text-xs font-normal text-slate-400">{tier.unit}</span>
                </div>
                <p className="text-xs text-slate-400 mt-1.5">{tier.desc}</p>
              </div>

              <ul className="space-y-2.5 text-xs text-slate-300 pt-4 border-t border-white/10">
                {tier.features.map((feat) => (
                  <li key={feat} className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-gcore-orange shrink-0 mt-0.5" strokeWidth={2} />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/dashboard"
                className={`w-full py-2.5 text-xs font-semibold flex items-center justify-center gap-2 rounded-apple transition-apple ${
                  tier.highlight
                    ? 'gcore-btn-orange shadow-gcore-btn'
                    : 'gcore-btn-dark'
                }`}
              >
                <span>Get started</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-white/[0.07] bg-gcore-darker py-8 px-6 text-center text-xs text-slate-500 relative z-10">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gcore-orange/20 text-gcore-orange flex items-center justify-center">
              <Activity className="w-3.5 h-3.5" />
            </div>
            <span className="text-slate-300 font-semibold">Clinic AI Autonomous Telephony</span>
          </div>
          <p>© 2026 Clinic AI Technologies. All rights reserved.</p>
        </div>
      </footer>

      {/* Modals */}
      <VoiceTestModal />
      <PhoneSimulatorModal />
    </div>
  );
}

export default function HomePage() {
  return (
    <ClinicProvider>
      <HomeContent />
    </ClinicProvider>
  );
}

