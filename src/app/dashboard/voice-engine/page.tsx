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
  Globe,
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
      desc: 'Instant human barge-in & noise filtering',
      color: 'accent-border-green',
      iconColor: 'text-emerald-500 bg-emerald-50',
    },
    {
      label: 'Streaming STT',
      engine: 'Deepgram Nova-2',
      latency: '~178ms',
      desc: 'Real-time Indian English, Hindi & Marathi',
      color: 'accent-border-blue',
      iconColor: 'text-blue-500 bg-blue-50',
    },
    {
      label: 'LLM & Tool Calling',
      engine: 'Groq LLaMA 3.3 70B',
      latency: '~215ms TTFT',
      desc: 'Sub-250ms reasoning & atomic slot booking',
      color: 'accent-border-purple',
      iconColor: 'text-purple-500 bg-purple-50',
    },
    {
      label: 'Streaming TTS',
      engine: 'Cartesia Sonic',
      latency: '~182ms TTFB',
      desc: 'Natural conversational Indian vocal cadence',
      color: 'accent-border-cyan',
      iconColor: 'text-cyan-500 bg-cyan-50',
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
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Header Banner */}
      <div className="bg-white rounded-apple-lg shadow-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-primary-50 text-primary-700 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-primary-200/70 mb-2">
            <Radio className="w-3 h-3 text-primary-500 animate-pulse" />
            <span>Active Pipeline Telemetry</span>
          </div>
          <h1 className="text-xl font-semibold text-slate-900 tracking-apple">Voice Engine &amp; Telephony</h1>
          <p className="text-xs text-slate-500 mt-1 font-normal max-w-xl">
            Real-time latency breakdown, direct telephony COGS calculations, and carrier webhook endpoints.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsPhoneSimulatorOpen(true)}
            className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200 hover:border-slate-300 font-medium text-xs px-4 py-2.5 rounded-apple transition-apple shadow-xs"
          >
            <PhoneCall className="w-4 h-4 text-amber-500" strokeWidth={1.5} />
            <span>Simulate Call</span>
          </button>

          <button
            onClick={() => setIsVoiceTesterOpen(true)}
            className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white font-medium text-xs px-4 py-2.5 rounded-apple transition-apple shadow-sm"
          >
            <Mic className="w-4 h-4" strokeWidth={1.5} />
            <span>Voice Console</span>
          </button>
        </div>
      </div>

      {/* Latency Pipeline Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {pipelineStages.map((stage) => (
          <div
            key={stage.label}
            className={`bg-white rounded-apple-lg shadow-card card-hover p-5 space-y-3 ${stage.color}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{stage.label}</span>
              <span className="text-xs font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                {stage.latency}
              </span>
            </div>
            <p className="text-[15px] font-semibold text-slate-900 tracking-apple">{stage.engine}</p>
            <p className="text-xs text-slate-500 leading-relaxed">{stage.desc}</p>
          </div>
        ))}
      </div>

      {/* End-to-End Latency & Telemetry Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Latency Meter */}
        <div className="bg-white rounded-apple-lg shadow-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[15px] font-semibold text-slate-900 tracking-apple flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary-500" strokeWidth={1.5} />
              Turnaround Latency
            </h3>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
              Sub-800ms Human Parity
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-medium text-slate-600">
              <span>Average Turnaround</span>
              <span className="font-mono font-bold text-slate-900">{stats?.avg_turn_latency_ms || 579} ms</span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
              <div style={{ width: '4%' }} className="bg-emerald-400" title="VAD: 15ms" />
              <div style={{ width: '31%' }} className="bg-blue-400" title="STT: 178ms" />
              <div style={{ width: '35%' }} className="bg-purple-400" title="LLM: 215ms" />
              <div style={{ width: '30%' }} className="bg-cyan-400" title="TTS: 182ms" />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 pt-1 font-mono">
              <span className="text-emerald-600 font-semibold">• VAD 15ms</span>
              <span className="text-blue-600 font-semibold">• STT 178ms</span>
              <span className="text-purple-600 font-semibold">• LLM 215ms</span>
              <span className="text-cyan-600 font-semibold">• TTS 182ms</span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-3 text-xs">
            <div className="p-2.5 bg-slate-50 rounded-apple">
              <span className="text-slate-400 text-[11px] block">Streaming Protocol</span>
              <span className="font-medium text-slate-800 font-mono text-[11px]">HTTP/2 + WebRTC</span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-apple">
              <span className="text-slate-400 text-[11px] block">Language Detection</span>
              <span className="font-medium text-slate-800 font-mono text-[11px]">Auto (mr / hi / en)</span>
            </div>
          </div>
        </div>

        {/* COGS Counter (₹/min) */}
        <div className="lg:col-span-2 bg-white rounded-apple-lg shadow-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[15px] font-semibold text-slate-900 tracking-apple flex items-center gap-2">
              <Coins className="w-4 h-4 text-amber-500" strokeWidth={1.5} />
              Direct Telephony COGS Breakdown
            </h3>
            <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
              ₹3.23 / min Total Blended
            </span>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {cogsBreakdown.map((item) => (
              <div key={item.component} className="py-2.5 flex items-center justify-between">
                <span className="font-medium text-slate-700">{item.component}</span>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-slate-400">{item.share}</span>
                  <span className="font-mono font-semibold text-slate-900">{item.rate}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" strokeWidth={1.5} />
              Gross Margin at ₹2,999/mo Starter Plan (300 mins)
            </span>
            <span className="font-bold text-emerald-600 text-sm">67.7% Margin</span>
          </div>
        </div>
      </div>

      {/* Telephony Endpoints */}
      <div className="bg-white rounded-apple-lg shadow-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[15px] font-semibold text-slate-900 tracking-apple flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary-500" strokeWidth={1.5} />
              Telephony Webhook Integration
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              Copy these public webhook URLs into your Twilio Console under <span className="font-mono text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">Phone Numbers &gt; Voice &amp; Fax</span>.
            </p>
          </div>
        </div>

        <div className="space-y-3 font-mono text-xs">
          {endpoints.map((ep) => (
            <div
              key={ep.path}
              className="bg-slate-50 border border-slate-200 rounded-apple-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <span className="text-slate-500 text-[11px] font-sans font-medium">{ep.label}</span>
                <div className="font-semibold text-slate-900 flex items-center gap-2">
                  <span className="text-primary-600 font-bold">{ep.method}</span>
                  <span>{origin ? `${origin}${ep.path}` : ep.path}</span>
                </div>
                <p className="text-[11px] font-sans text-slate-400">{ep.description}</p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => copyToClipboard(ep.path)}
                  className="flex items-center gap-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-apple text-xs font-sans font-medium transition-apple shadow-xs"
                >
                  {copiedPath === ep.path ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" strokeWidth={2} />
                      <span className="text-emerald-600">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.5} />
                      <span>Copy URL</span>
                    </>
                  )}
                </button>

                <span className="inline-flex items-center gap-1.5 text-[11px] font-sans font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                  <span className="status-dot bg-emerald-400"></span>
                  Active
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
