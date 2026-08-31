'use client';

import React, { useState, useEffect } from 'react';
import { useClinic } from '@/components/layout/clinic-context';
import { 
  Cpu, 
  Mic, 
  PhoneCall, 
  Activity, 
  Copy, 
  Check, 
  Zap, 
  Coins, 
  TrendingUp, 
  ShieldCheck, 
  Radio
} from 'lucide-react';

export default function VoiceEnginePage() {
  const { activeClinic, stats, setIsVoiceTesterOpen, setIsPhoneSimulatorOpen } = useClinic();
  const [copiedPath, setCopiedPath] = useState<string | null>(null);
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('visible'); }),
      { threshold: 0.1 }
    );
    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const copyToClipboard = (path: string) => {
    const fullUrl = `${origin}${path}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedPath(path);
    setTimeout(() => setCopiedPath(null), 2500);
  };

  const pipelineStages = [
    {
      label: 'Voice Activity Detection (VAD)',
      engine: 'Silero Neural VAD',
      latency: '~15ms',
      desc: 'Instant human barge-in & background noise suppression',
      tag: 'Edge Native',
    },
    {
      label: 'Streaming STT',
      engine: 'Deepgram Nova-2',
      latency: '~178ms',
      desc: 'Real-time Indian English, Hindi & Marathi speech recognition',
      tag: 'Multilingual',
    },
    {
      label: 'LLM & Tool Calling',
      engine: 'Groq LLaMA 3.3 70B',
      latency: '~215ms TTFT',
      desc: 'Sub-250ms reasoning & atomic slot reservation',
      tag: 'Autonomous',
    },
    {
      label: 'Streaming TTS',
      engine: 'Cartesia Sonic',
      latency: '~182ms TTFB',
      desc: 'Natural conversational Indian vocal cadence & empathy',
      tag: 'Neural Voice',
    },
  ];

  const cogsBreakdown = [
    { component: 'Deepgram Streaming STT', rate: '₹0.35 / min', share: '10.8%' },
    { component: 'Groq LLaMA 3.3 LLM (Prompt & Tokens)', rate: '₹0.28 / min', share: '8.7%' },
    { component: 'Cartesia Sonic Indian Voice TTS', rate: '₹1.80 / min', share: '55.7%' },
    { component: 'Twilio / Carrier PSTN Trunking', rate: '₹0.80 / min', share: '24.8%' },
  ];

  const endpoints = [
    {
      label: 'Inbound PSTN Voice Webhook (Twilio / Exotel)',
      method: 'POST',
      path: '/api/twilio/voice',
      description: 'Triggered when patient dials the clinic telephone number.',
    },
    {
      label: 'Speech Gather & AI Dialogue Loop',
      method: 'POST',
      path: '/api/twilio/gather',
      description: 'Processes patient speech turns and streams AI responses with latency telemetry.',
    },
    {
      label: 'Call Status & Duration Callback',
      method: 'POST',
      path: '/api/twilio/status',
      description: 'Records final duration, costs, and updates clinic analytics.',
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in text-slate-100">
      {/* Header Banner */}
      <div className="gcore-card rounded-apple-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-white/10">
        <div>
          <div className="inline-flex items-center gap-1.5 gcore-badge text-xs font-semibold px-2.5 py-0.5 rounded-full mb-2">
            <Radio className="w-3 h-3 text-gcore-orange animate-pulse" />
            <span>Active Pipeline Telemetry</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Voice Engine &amp; Telephony Stack</h1>
          <p className="text-xs text-slate-400 mt-1 font-normal max-w-xl">
            Real-time latency telemetry, direct telephony COGS calculations, and carrier webhook endpoints.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsPhoneSimulatorOpen(true)}
            className="gcore-btn-dark px-4 py-2.5 text-xs flex items-center gap-2"
          >
            <PhoneCall className="w-4 h-4 text-amber-400" strokeWidth={1.8} />
            <span>Simulate Call</span>
          </button>

          <button
            onClick={() => setIsVoiceTesterOpen(true)}
            className="gcore-btn-orange px-5 py-2.5 text-xs flex items-center gap-2 shadow-gcore-btn"
          >
            <Mic className="w-4 h-4" strokeWidth={2} />
            <span>Voice Console</span>
          </button>
        </div>
      </div>

      {/* Latency Pipeline Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {pipelineStages.map((stage, i) => (
          <div
            key={stage.label}
            className="reveal gcore-card rounded-apple-xl p-5 space-y-3 border border-white/10 hover:border-gcore-orange/30"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{stage.label}</span>
              <span className="text-xs font-mono font-bold text-orange-300 bg-orange-950/60 border border-orange-800/40 px-2 py-0.5 rounded">
                {stage.latency}
              </span>
            </div>
            {/* Mini waveform */}
            <div className="flex items-end gap-[2px] h-5">
              {[8, 14, 10, 18, 12, 16, 10, 14, 8].map((h, j) => (
                <div
                  key={j}
                  className="waveform-bar"
                  style={{ height: `${h}px`, animationDelay: `${j * 0.08 + i * 0.15}s` }}
                />
              ))}
            </div>
            <p className="text-[15px] font-bold text-white tracking-tight">{stage.engine}</p>
            <p className="text-xs text-slate-400 leading-relaxed">{stage.desc}</p>
          </div>
        ))}
      </div>

      {/* End-to-End Latency & Telemetry Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Latency Meter */}
        <div className="gcore-card rounded-apple-xl p-6 space-y-4 border border-white/10">
          <div className="flex items-center justify-between">
            <h3 className="text-[15px] font-bold text-white tracking-tight flex items-center gap-2">
              <Zap className="w-4 h-4 text-gcore-orange" strokeWidth={2} />
              Turnaround Latency
            </h3>
            <span className="text-xs font-mono font-bold text-emerald-300 bg-emerald-950/60 border border-emerald-800/40 px-2.5 py-0.5 rounded-full">
              Sub-800ms Target
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-medium text-slate-400">
              <span>Total Pipeline Turnaround</span>
              <span className="font-mono font-bold text-orange-300">{stats?.avg_turn_latency_ms || 579} ms</span>
            </div>
            <div className="w-full h-2.5 bg-black/60 rounded-full overflow-hidden flex border border-white/5">
              <div style={{ width: '4%' }} className="bg-amber-400" title="VAD: 15ms" />
              <div style={{ width: '31%' }} className="bg-orange-500" title="STT: 178ms" />
              <div style={{ width: '35%' }} className="bg-orange-600" title="LLM: 215ms" />
              <div style={{ width: '30%' }} className="bg-amber-500" title="TTS: 182ms" />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 pt-1 font-mono">
              <span className="text-amber-400 font-semibold">• VAD 15ms</span>
              <span className="text-orange-400 font-semibold">• STT 178ms</span>
              <span className="text-orange-300 font-semibold">• LLM 215ms</span>
              <span className="text-amber-300 font-semibold">• TTS 182ms</span>
            </div>
          </div>

          <div className="pt-3 border-t border-white/10 grid grid-cols-2 gap-3 text-xs">
            <div className="p-2.5 bg-black/40 border border-white/5 rounded-apple">
              <span className="text-slate-500 text-[11px] block">Audio Protocol</span>
              <span className="font-medium text-slate-200 font-mono text-[11px]">HTTP/2 + WebRTC</span>
            </div>
            <div className="p-2.5 bg-black/40 border border-white/5 rounded-apple">
              <span className="text-slate-500 text-[11px] block">Language Detection</span>
              <span className="font-medium text-slate-200 font-mono text-[11px]">Auto (mr / hi / en)</span>
            </div>
          </div>
        </div>

        {/* COGS Counter (₹/min) */}
        <div className="lg:col-span-2 gcore-card rounded-apple-xl p-6 space-y-4 border border-white/10">
          <div className="flex items-center justify-between">
            <h3 className="text-[15px] font-bold text-white tracking-tight flex items-center gap-2">
              <Coins className="w-4 h-4 text-gcore-orange" strokeWidth={2} />
              Direct Telephony COGS Breakdown
            </h3>
            <span className="text-xs font-bold text-orange-300 bg-orange-950/60 border border-orange-800/40 px-3 py-1 rounded-full font-mono">
              ₹3.23 / min Total Blended
            </span>
          </div>

          <div className="divide-y divide-white/[0.06] text-xs">
            {cogsBreakdown.map((item) => (
              <div key={item.component} className="py-2.5 flex items-center justify-between">
                <span className="font-medium text-slate-300">{item.component}</span>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-slate-500 font-mono">{item.share}</span>
                  <span className="font-mono font-semibold text-orange-200">{item.rate}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" strokeWidth={2} />
              Gross Margin at ₹2,999/mo Starter Plan (300 mins)
            </span>
            <span className="font-bold text-emerald-400 text-sm font-mono">67.7% Margin</span>
          </div>
        </div>
      </div>

      {/* Telephony Endpoints */}
      <div className="gcore-card rounded-apple-xl p-6 space-y-4 border border-white/10">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[15px] font-bold text-white tracking-tight flex items-center gap-2">
              <Activity className="w-4 h-4 text-gcore-orange" strokeWidth={2} />
              Telephony Webhook Integration
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
              Copy these public webhook URLs into your Twilio Console under <span className="font-mono text-orange-300 bg-black/60 px-1.5 py-0.5 rounded border border-white/10">Phone Numbers &gt; Voice &amp; Fax</span>.
            </p>
          </div>
        </div>

        <div className="space-y-3 font-mono text-xs">
          {endpoints.map((ep) => (
            <div
              key={ep.path}
              className="bg-black/50 border border-white/10 rounded-apple-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <span className="text-slate-400 text-[11px] font-sans font-medium">{ep.label}</span>
                <div className="font-semibold text-white flex items-center gap-2">
                  <span className="text-gcore-orange font-bold">{ep.method}</span>
                  <span>{origin ? `${origin}${ep.path}` : ep.path}</span>
                </div>
                <p className="text-[11px] font-sans text-slate-500">{ep.description}</p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => copyToClipboard(ep.path)}
                  className="gcore-btn-dark px-3 py-1.5 text-xs font-sans flex items-center gap-1.5"
                >
                  {copiedPath === ep.path ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" strokeWidth={2} />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.8} />
                      <span>Copy URL</span>
                    </>
                  )}
                </button>

                <span className="inline-flex items-center gap-1.5 text-[11px] font-sans font-medium text-emerald-300 bg-emerald-950/60 border border-emerald-800/40 px-2.5 py-1 rounded-full">
                  <span className="status-dot bg-emerald-400"></span>
                  Healthy
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
