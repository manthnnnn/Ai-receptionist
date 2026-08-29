'use client';

import React from 'react';
import { useClinic } from '@/components/layout/clinic-context';
import { Cpu, Mic, PhoneCall, Activity, Copy, Check } from 'lucide-react';

const pipelineStages = [
  {
    label: 'Voice Activity Detection',
    engine: 'Silero VAD (Local)',
    metric: 'Instant barge-in',
    color: 'accent-border-green',
  },
  {
    label: 'Streaming STT',
    engine: 'Deepgram Nova-2',
    metric: '~178ms latency',
    color: 'accent-border-blue',
  },
  {
    label: 'LLM & Tool Calling',
    engine: 'Groq LLaMA 3.1 8B',
    metric: '~215ms TTFT',
    color: 'accent-border-purple',
  },
  {
    label: 'Streaming TTS',
    engine: 'Cartesia Sonic',
    metric: '~182ms TTFB',
    color: 'accent-border-cyan',
  },
];

const endpoints = [
  {
    label: 'Inbound Call Webhook',
    method: 'POST',
    path: '/api/twilio/voice',
  },
  {
    label: 'Call Status Callback',
    method: 'POST',
    path: '/api/twilio/status',
  },
];

export default function VoiceEnginePage() {
  const { activeClinic, setIsVoiceTesterOpen, setIsPhoneSimulatorOpen } = useClinic();

  return (
    <div className="space-y-5 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="bg-white rounded-apple-lg shadow-card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-surface-900 tracking-apple">Voice Engine</h1>
          <p className="text-xs text-surface-400 mt-0.5 font-medium">
            Ultra-low latency voice stack, telephony endpoints, and speech tools
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsPhoneSimulatorOpen(true)}
            className="flex items-center gap-2 bg-white hover:bg-surface-50 text-surface-600 hover:text-surface-900 border border-surface-200 hover:border-surface-300 font-medium text-xs px-4 py-2 rounded-apple transition-apple"
          >
            <PhoneCall className="w-3.5 h-3.5 text-amber-500" strokeWidth={1.5} />
            <span>Simulate Call</span>
          </button>

          <button
            onClick={() => setIsVoiceTesterOpen(true)}
            className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white font-medium text-xs px-4 py-2 rounded-apple transition-apple shadow-sm"
          >
            <Mic className="w-3.5 h-3.5" strokeWidth={1.5} />
            <span>Voice Console</span>
          </button>
        </div>
      </div>

      {/* Pipeline Stages */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {pipelineStages.map((stage) => (
          <div
            key={stage.label}
            className={`bg-white rounded-apple-lg shadow-card card-hover p-5 space-y-2 ${stage.color}`}
          >
            <span className="text-[11px] font-semibold text-surface-400 uppercase tracking-wider">{stage.label}</span>
            <p className="text-[15px] font-semibold text-surface-900 tracking-apple">{stage.engine}</p>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600">
              <span className="status-dot bg-emerald-400"></span>
              {stage.metric}
            </span>
          </div>
        ))}
      </div>

      {/* Telephony Endpoints */}
      <div className="bg-white rounded-apple-lg shadow-card p-6 space-y-4">
        <h3 className="text-[15px] font-semibold text-surface-900 tracking-apple flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary-500" strokeWidth={1.5} />
          Telephony Webhook Integration
        </h3>
        <p className="text-xs text-surface-400 leading-relaxed">
          Configure your Twilio / Telnyx phone number to POST to these endpoints. The AI receptionist operates 24/7 in the cloud.
        </p>

        <div className="space-y-3 font-mono text-xs">
          {endpoints.map((ep) => (
            <div
              key={ep.path}
              className="bg-surface-50 border border-surface-100 rounded-apple-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
            >
              <div>
                <span className="text-surface-400 text-[11px] font-sans">{ep.label}</span>
                <div className="font-semibold text-surface-800 mt-0.5">
                  <span className="text-primary-500">{ep.method}</span> {ep.path}
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-sans font-medium text-emerald-600">
                <span className="status-dot bg-emerald-400"></span>
                Healthy
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
