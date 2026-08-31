'use client';

import React, { useState, useEffect } from 'react';
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
import { ThemeToggle } from '@/components/layout/theme-toggle';

function HomeContent() {
  const { setIsVoiceTesterOpen, setIsPhoneSimulatorOpen } = useClinic();
  const [activeTab, setActiveTab] = useState<'mr' | 'hi' | 'en'>('mr');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Scroll-triggered section reveal
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('visible'); }),
      { threshold: 0.1 }
    );
    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const capabilities = [
    {
      id: 'marathi-voice',
      title: 'Marathi, Hindi & English',
      sub: 'Devanagari & Romanized NLP',
      icon: Globe,
      tag: 'Edge Native',
    },
    {
      id: 'pstn-webhooks',
      title: 'PSTN & SIP Webhooks',
      sub: 'Twilio & Exotel Integration',
      icon: PhoneCall,
      tag: '24/7 Uptime',
    },
    {
      id: 'low-latency',
      title: 'Sub-250ms TTFT',
      sub: 'Groq Edge Neural Acceleration',
      icon: Zap,
      tag: 'Humanoid',
    },
    {
      id: 'concurrency',
      title: 'Zero Collision Booking',
      sub: 'Atomic Schedule Lockouts',
      icon: ShieldCheck,
      tag: 'ACID Safe',
    },
    {
      id: 'doctors-roster',
      title: 'Live Fees & Schedules',
      sub: 'Specialist Roster Grounding',
      icon: Stethoscope,
      tag: 'Real-time',
    },
    {
      id: 'emergency-handoff',
      title: 'Instant Human Transfer',
      sub: 'Critical Triage Escalation',
      icon: AlertTriangle,
      tag: 'Medical Safety',
    },
  ];

  const sampleAudios = {
    mr: {
      user: 'मला उद्या संध्याकाळी ४ वाजता डॉ. वर्मा यांच्याकडे वेळ मिळेल का?',
      ai: 'हो नक्कीच! उद्या संध्याकाळी ४:३० वाजता डॉ. आशिष वर्मा यांच्याकडे स्लॉट उपलब्ध आहे. मी ही वेळ आपल्यासाठी बुक करू का?',
      doctor: 'Dr. Ashish Verma (Root Canal Specialist)',
    },
    hi: {
      user: 'कल सुबह 10 बजे डॉक्टर वर्मा से अपॉइंटमेंट मिल सकती है क्या?',
      ai: 'जी बिल्कुल! कल सुबह 10:00 बजे डॉ. आशीष वर्मा का समय उपलब्ध है। क्या मैं आपका नाम और नंबर नोट कर लूँ?',
      doctor: 'Dr. Ashish Verma (Endodontics)',
    },
    en: {
      user: 'What is the consultation fee for dental root canal treatment?',
      ai: 'Dr. Ashish Verma specializes in painless root canals and his consultation fee is ₹500. Would you like me to book a slot for tomorrow?',
      doctor: 'Apollo Dental Clinic',
    },
  };

  const features = [
    {
      icon: Headphones,
      title: '24/7 Autonomous Pickup',
      description: 'Never miss an emergency patient call or appointment inquiry, even after hours.',
      tag: 'Zero Missed Calls',
    },
    {
      icon: Zap,
      title: 'Sub-250ms Live Voice',
      description: 'Ultra-fast speech response with natural pauses, emotional cadence, and no robotic delays.',
      tag: 'Groq LLaMA 3.3',
    },
    {
      icon: ShieldCheck,
      title: 'Atomic Collision Locking',
      description: 'Strict concurrency guarantees prevent two callers from ever booking the same slot.',
      tag: '100% Guaranteed',
    },
    {
      icon: Users,
      title: 'Multi-Tenant Clinics',
      description: 'Manage distinct clinics, specialized doctors, fee structures, and ground-truth FAQs.',
      tag: 'Scale Ready',
    },
  ];

  const pricingTiers = [
    {
      name: 'Starter Clinic',
      price: '₹2,499',
      unit: '/month',
      desc: 'Ideal for solo practitioners & dental clinics starting with AI reception.',
      features: ['Up to 500 call minutes / mo', '1 Virtual DID Phone Number', 'Marathi, Hindi & English', 'Collision-free booking lock', 'Email & SMS Notifications'],
      highlight: false,
    },
    {
      name: 'Pro Medical Center',
      price: '₹5,999',
      unit: '/month',
      desc: 'For busy clinics with multiple doctors requiring high concurrency.',
      features: ['Up to 2,000 call minutes / mo', '3 Virtual DID Phone Numbers', 'Up to 10 Doctor Rosters', 'Instant Human PSTN Failover', 'Priority Groq Edge Inference', 'Dedicated WhatsApp Support'],
      highlight: true,
    },
    {
      name: 'Hospital Network',
      price: '₹14,999',
      unit: '/month',
      desc: 'For multi-location hospital chains and large healthcare centers.',
      features: ['Unlimited call minutes', 'Dedicated Custom SIP Trunks', 'Unlimited Doctor Rosters', 'Custom Voice Fine-Tuning', 'Custom EHR / EMR Integration', '24/7 SLA & Account Manager'],
      highlight: false,
    },
  ];

  return (
    <div className="min-h-screen bg-gcore-canvas text-white [html.light_&]:text-slate-900 flex flex-col relative overflow-hidden transition-colors duration-300">
      {/* Ambient Lighting Ray */}
      <div className="gcore-electric-ray" />
      <div className="gcore-electric-streak" />

      {/* Top Navbar */}
      <nav className="border-b border-white/[0.08] [html.light_&]:border-black/10 backdrop-blur-xl bg-black/60 [html.light_&]:bg-white/80 sticky top-0 z-50 transition-colors duration-300">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gcore-orange to-amber-600 flex items-center justify-center text-white shadow-gcore-btn">
              <Activity className="w-4 h-4" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-lg tracking-tight text-white [html.light_&]:text-slate-900 flex items-center gap-1.5">
              Clinic<span className="text-gcore-orange">AI</span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full gcore-badge">
                Edge 2.0
              </span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-xs font-medium text-slate-300 [html.light_&]:text-slate-700">
            <a href="#features" className="hover:text-gcore-orange transition-colors">Features</a>
            <a href="#architecture" className="hover:text-gcore-orange transition-colors">Architecture</a>
            <a href="#demo" className="hover:text-gcore-orange transition-colors">Live Demo</a>
            <a href="#pricing" className="hover:text-gcore-orange transition-colors">Pricing</a>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            {/* Desktop buttons */}
            <Link href="/dashboard" className="gcore-btn-dark px-4 py-2 text-xs hidden sm:block">
              Sign in
            </Link>
            <Link href="/dashboard" className="gcore-btn-orange px-5 py-2 text-xs shadow-gcore-btn hidden sm:block">
              Launch Console
            </Link>
            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="sm:hidden w-9 h-9 flex items-center justify-center rounded-apple hover:bg-white/5 transition-apple"
              aria-label="Open menu"
              style={{ color: 'var(--text-secondary)' }}
            >
              <svg width="18" height="14" viewBox="0 0 18 14" fill="none">
                <path d="M1 1h16M1 7h16M1 13h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Nav Drawer */}
      {mobileMenuOpen && (
        <>
          <div className="sidebar-overlay" onClick={() => setMobileMenuOpen(false)} />
          <div className="sidebar-drawer flex flex-col p-6 gap-5" style={{ background: 'var(--sidebar-bg)', borderRight: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between">
              <span className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>Clinic<span className="text-gcore-orange">AI</span></span>
              <button onClick={() => setMobileMenuOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/5" style={{ color: 'var(--text-secondary)' }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
              </button>
            </div>
            {['#features', '#architecture', '#demo', '#pricing'].map((href, i) => (
              <a key={href} href={href} onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-medium py-2 border-b transition-apple hover:text-gcore-orange"
                style={{ color: 'var(--text-secondary)', borderColor: 'var(--border)' }}
              >
                {['Features', 'Architecture', 'Live Demo', 'Pricing'][i]}
              </a>
            ))}
            <Link href="/dashboard" className="gcore-btn-orange px-5 py-3 text-sm font-semibold text-center shadow-gcore-btn mt-2">
              Launch Console
            </Link>
          </div>
        </>
      )}

      {/* Hero Section */}
      <section className="pt-20 pb-16 px-6 max-w-6xl mx-auto text-center relative z-10 space-y-7">
        {/* Beta Release Pill */}
        <div className="inline-flex items-center gap-2 gcore-badge px-4 py-1.5 rounded-full text-xs font-medium animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-gcore-orange animate-pulse" />
          <span className="text-orange-300 [html.light_&]:text-orange-700 font-semibold">✨ Powered by Groq LLaMA 3.3 · Sub-250ms Edge Inference</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold text-white [html.light_&]:text-slate-900 tracking-tightest leading-[1.08] max-w-5xl mx-auto animate-slide-up">
          Inference at the Edge <br />
          <span className="bg-gradient-to-r from-white via-orange-100 to-gcore-orange [html.light_&]:from-slate-950 [html.light_&]:via-orange-600 [html.light_&]:to-gcore-orange bg-clip-text text-transparent">
            Humanoid AI Receptionist
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-slate-400 [html.light_&]:text-slate-600 text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed font-normal">
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

        {/* Gcore Interactive Neural Chip & Circuit Diagram */}
        <div id="architecture" className="pt-14 pb-8 max-w-5xl mx-auto relative">
          <div className="gcore-card rounded-apple-2xl p-8 sm:p-12 relative overflow-hidden border border-white/[0.09] [html.light_&]:border-slate-200">
            {/* Ambient Background Glow */}
            <div className="absolute inset-0 bg-gradient-to-b from-gcore-orange/[0.07] via-transparent to-transparent pointer-events-none" />

            <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-8 relative z-10">
              {/* Left Satellite Nodes */}
              <div className="space-y-4">
                {capabilities.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    className="gcore-card p-4 rounded-apple-lg flex items-center justify-between gap-3 text-left hover:border-gcore-orange/40 transition-apple group bg-[#0A0A0A] [html.light_&]:bg-white border border-white/10 [html.light_&]:border-slate-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-apple bg-white/[0.05] [html.light_&]:bg-orange-50 border border-white/10 [html.light_&]:border-orange-200 flex items-center justify-center text-gcore-orange group-hover:scale-110 transition-apple">
                        <item.icon className="w-5 h-5" strokeWidth={1.8} />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white [html.light_&]:text-slate-900">{item.title}</h4>
                        <p className="text-[11px] text-slate-400 [html.light_&]:text-slate-500">{item.sub}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-medium text-orange-300 [html.light_&]:text-orange-700 bg-orange-950/60 [html.light_&]:bg-orange-50 border border-orange-800/40 [html.light_&]:border-orange-200 px-2 py-0.5 rounded-full">
                      {item.tag}
                    </span>
                  </div>
                ))}
              </div>

              {/* Center Glowing AI Chip */}
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

                    <span className="text-3xl font-extrabold text-white [html.light_&]:text-slate-900 tracking-wider font-mono">
                      AI
                    </span>
                    <span className="text-[10px] text-orange-200 [html.light_&]:text-orange-700 uppercase font-mono font-bold tracking-widest mt-1">
                      Neural Core
                    </span>
                    <span className="text-[9px] text-emerald-400 [html.light_&]:text-emerald-600 flex items-center gap-1 mt-1 font-mono">
                      <span className="status-dot bg-emerald-400 [html.light_&]:bg-emerald-500" />
                      24/7 Edge Live
                    </span>
                  </div>
                </div>

                <div className="mt-4 text-center">
                  <span className="text-xs font-bold text-slate-300 [html.light_&]:text-slate-900">Autonomous Edge Orchestrator</span>
                  <p className="text-[11px] text-slate-500 [html.light_&]:text-slate-500 font-mono">575ms Human-Parity Pipeline</p>
                </div>
              </div>

              {/* Right Satellite Nodes */}
              <div className="space-y-4">
                {capabilities.slice(3, 6).map((item) => (
                  <div
                    key={item.id}
                    className="gcore-card p-4 rounded-apple-lg flex items-center justify-between gap-3 text-left hover:border-gcore-orange/40 transition-apple group bg-[#0A0A0A] [html.light_&]:bg-white border border-white/10 [html.light_&]:border-slate-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-apple bg-white/[0.05] [html.light_&]:bg-orange-50 border border-white/10 [html.light_&]:border-orange-200 flex items-center justify-center text-gcore-orange group-hover:scale-110 transition-apple">
                        <item.icon className="w-5 h-5" strokeWidth={1.8} />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white [html.light_&]:text-slate-900">{item.title}</h4>
                        <p className="text-[11px] text-slate-400 [html.light_&]:text-slate-500">{item.sub}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-medium text-orange-300 [html.light_&]:text-orange-700 bg-orange-950/60 [html.light_&]:bg-orange-50 border border-orange-800/40 [html.light_&]:border-orange-200 px-2 py-0.5 rounded-full">
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
        <div className="gcore-card rounded-apple-2xl p-6 sm:p-10 border border-white/10 [html.light_&]:border-slate-200 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 [html.light_&]:border-slate-200 pb-6">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-gcore-orange mb-1">
                <Volume2 className="w-4 h-4" />
                <span>Live Interactive Telephony Audio</span>
              </div>
              <h2 className="text-2xl font-bold text-white [html.light_&]:text-slate-900 tracking-tight">
                Test the Humanoid AI Receptionist Right Now
              </h2>
              <p className="text-xs text-slate-400 [html.light_&]:text-slate-600 mt-1">
                Listen to real conversational turns in your preferred Indian language.
              </p>
            </div>

            {/* Language Switcher Tabs */}
            <div className="flex items-center bg-slate-900 [html.light_&]:bg-slate-100 border border-white/10 [html.light_&]:border-slate-200 rounded-apple p-1 text-xs">
              <button
                onClick={() => setActiveTab('mr')}
                className={`px-3 py-1.5 rounded-lg transition-apple font-medium ${
                  activeTab === 'mr' ? 'bg-gcore-orange text-white shadow-sm' : 'text-slate-400 [html.light_&]:text-slate-600 hover:text-white [html.light_&]:hover:text-slate-900'
                }`}
              >
                मराठी (Marathi)
              </button>
              <button
                onClick={() => setActiveTab('hi')}
                className={`px-3 py-1.5 rounded-lg transition-apple font-medium ${
                  activeTab === 'hi' ? 'bg-gcore-orange text-white shadow-sm' : 'text-slate-400 [html.light_&]:text-slate-600 hover:text-white [html.light_&]:hover:text-slate-900'
                }`}
              >
                हिंदी (Hindi)
              </button>
              <button
                onClick={() => setActiveTab('en')}
                className={`px-3 py-1.5 rounded-lg transition-apple font-medium ${
                  activeTab === 'en' ? 'bg-gcore-orange text-white shadow-sm' : 'text-slate-400 [html.light_&]:text-slate-600 hover:text-white [html.light_&]:hover:text-slate-900'
                }`}
              >
                English
              </button>
            </div>
          </div>

          {/* Dialogue Player Card */}
          <div className="bg-slate-950/80 [html.light_&]:bg-slate-50 border border-white/[0.08] [html.light_&]:border-slate-200 rounded-apple-xl p-5 space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-400 [html.light_&]:text-slate-600 border-b border-white/5 [html.light_&]:border-slate-200 pb-3">
              <span className="font-mono text-orange-400 [html.light_&]:text-orange-700 font-semibold">Context: {sampleAudios[activeTab].doctor}</span>
              <span className="text-emerald-400 [html.light_&]:text-emerald-700 flex items-center gap-1.5 font-medium">
                <span className="status-dot bg-emerald-400 [html.light_&]:bg-emerald-600" />
                Latency: 215ms TTFT
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex gap-2.5 items-start">
                <span className="px-2 py-0.5 rounded bg-white/10 [html.light_&]:bg-slate-200 text-slate-200 [html.light_&]:text-slate-800 border border-white/10 [html.light_&]:border-slate-300 font-mono font-bold shrink-0">Caller</span>
                <p className="text-slate-200 [html.light_&]:text-slate-800 leading-relaxed font-normal italic">&ldquo;{sampleAudios[activeTab].user}&rdquo;</p>
              </div>

              <div className="flex gap-2.5 items-start">
                <span className="px-2 py-0.5 rounded bg-orange-500/20 [html.light_&]:bg-orange-100 text-orange-300 [html.light_&]:text-orange-800 border border-orange-500/30 [html.light_&]:border-orange-300 font-mono font-bold shrink-0">AI Maya</span>
                <p className="text-slate-100 [html.light_&]:text-slate-900 leading-relaxed font-medium">&ldquo;{sampleAudios[activeTab].ai}&rdquo;</p>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={() => setIsVoiceTesterOpen(true)}
                className="gcore-btn-orange px-5 py-2.5 text-xs font-semibold flex items-center gap-2 shadow-gcore-btn"
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
          <h2 className="text-3xl sm:text-4xl font-bold text-white [html.light_&]:text-slate-900 tracking-tight">
            Engineered for Modern Clinics &amp; Hospitals
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 [html.light_&]:text-slate-600 max-w-xl mx-auto">
            Everything your medical practice needs to automate incoming calls with zero double-bookings.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f, i) => (
            <div
              key={f.title}
              className={`reveal reveal-delay-${Math.min(i + 1, 6)} gcore-card p-6 rounded-apple-xl space-y-3 bg-[#0A0A0A] [html.light_&]:bg-white border border-white/10 [html.light_&]:border-slate-200`}
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-apple bg-gcore-orange/10 [html.light_&]:bg-orange-50 border border-gcore-orange/30 [html.light_&]:border-orange-200 flex items-center justify-center text-gcore-orange">
                  <f.icon className="w-5 h-5" strokeWidth={1.8} />
                </div>
                <span className="text-[10px] font-mono font-medium text-orange-300 [html.light_&]:text-orange-700 bg-orange-950/60 [html.light_&]:bg-orange-50 border border-orange-800/40 [html.light_&]:border-orange-200 px-2 py-0.5 rounded-full">
                  {f.tag}
                </span>
              </div>
              <h3 className="text-sm font-bold text-white [html.light_&]:text-slate-900 tracking-tight">{f.title}</h3>
              <p className="text-xs text-slate-400 [html.light_&]:text-slate-600 leading-relaxed">{f.description}</p>
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
          <h2 className="text-3xl font-bold text-white [html.light_&]:text-slate-900 tracking-tight">
            Predictable ROI from Day One
          </h2>
          <p className="text-xs text-slate-400 [html.light_&]:text-slate-600 mt-1">Direct Telephony COGS ~₹3.23/min with 67%+ operating margins</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          {pricingTiers.map((tier) => (
            <div
              key={tier.name}
              className={`p-6 rounded-apple-xl space-y-5 relative transition-apple bg-[#0A0A0A] [html.light_&]:bg-white ${
                tier.highlight
                  ? 'gcore-card border-2 border-gcore-orange/70 [html.light_&]:border-gcore-orange shadow-gcore-glow'
                  : 'gcore-card border border-white/10 [html.light_&]:border-slate-200'
              }`}
            >
              {tier.highlight && (
                <span className="absolute -top-3 right-6 gcore-btn-orange text-[10px] font-bold px-3 py-0.5 shadow-sm">
                  MOST POPULAR
                </span>
              )}
              <div>
                <span className="text-xs font-bold text-orange-400 [html.light_&]:text-orange-600 uppercase tracking-wider">{tier.name}</span>
                <div className="text-3xl font-extrabold text-white [html.light_&]:text-slate-900 tracking-tight mt-1">
                  {tier.price} <span className="text-xs font-normal text-slate-400 [html.light_&]:text-slate-500">{tier.unit}</span>
                </div>
                <p className="text-xs text-slate-400 [html.light_&]:text-slate-600 mt-1.5">{tier.desc}</p>
              </div>

              <ul className="space-y-2.5 text-xs text-slate-300 [html.light_&]:text-slate-700 pt-4 border-t border-white/10 [html.light_&]:border-slate-200">
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
      <footer className="mt-auto border-t border-white/[0.07] [html.light_&]:border-black/10 bg-gcore-darker [html.light_&]:bg-slate-100 py-8 px-6 text-center text-xs text-slate-500 relative z-10">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gcore-orange/20 text-gcore-orange flex items-center justify-center">
              <Activity className="w-3.5 h-3.5" />
            </div>
            <span className="text-slate-300 [html.light_&]:text-slate-800 font-semibold">Clinic AI Autonomous Telephony</span>
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
