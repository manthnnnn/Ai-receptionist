'use client';

import React, { useState, useEffect } from 'react';
import { useClinic } from '@/components/layout/clinic-context';
import { 
  Building, PhoneForwarded, CheckCircle2, Save, Cpu, Key, 
  PhoneCall, ShieldAlert, Copy, ExternalLink, RefreshCw, Radio, 
  Power, Shield, Mic, Globe, Zap, AlertTriangle
} from 'lucide-react';

export default function SettingsPage() {
  const { activeClinic, activeClinicId, refreshData, toggleAgentActive } = useClinic();
  
  // Clinic Profile State
  const [clinicName, setClinicName] = useState('Apollo Dental Clinic');
  const [virtualPhone, setVirtualPhone] = useState('+91-80-4567-8901');
  const [clinicAddress, setClinicAddress] = useState('45, 2nd Cross, Koramangala 4th Block, Bangalore');

  // Agent State & Persona
  const [agentEnabled, setAgentEnabled] = useState(true);
  const [agentName, setAgentName] = useState('Maya');
  const [primaryLang, setPrimaryLang] = useState<'mr' | 'hi' | 'en'>('mr');
  const [planTier, setPlanTier] = useState<'starter' | 'growth' | 'enterprise'>('growth');
  const [minuteLimit, setMinuteLimit] = useState(1000);

  // Telephony & Forwarding State
  const [primaryHandoff, setPrimaryHandoff] = useState('+91-98765-00001');
  const [backupHandoff, setBackupHandoff] = useState('+91-98765-00009');
  const [greeting, setGreeting] = useState(
    'Hello! Thank you for calling Apollo Dental Clinic. How can I assist you with your appointment or visit today?'
  );
  
  // API Keys
  const [groqKey, setGroqKey] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  
  // UI status
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState<string | null>(null);

  // Load clinic data & settings on mount / clinic switch
  useEffect(() => {
    if (activeClinic) {
      setClinicName(activeClinic.name);
      setVirtualPhone(activeClinic.phone_number);
      setClinicAddress(activeClinic.address);
      setAgentEnabled(activeClinic.agent_enabled !== false);
      if (activeClinic.agent_name) setAgentName(activeClinic.agent_name);
      if (activeClinic.primary_language) setPrimaryLang(activeClinic.primary_language);
      if (activeClinic.plan_tier) setPlanTier(activeClinic.plan_tier);
      if (activeClinic.monthly_minute_limit) setMinuteLimit(activeClinic.monthly_minute_limit);
    }

    fetch(`/api/clinic?clinic_id=${activeClinicId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.settings) {
          if (data.settings.ai_greeting) setGreeting(data.settings.ai_greeting);
          if (data.settings.primary_handoff_number) setPrimaryHandoff(data.settings.primary_handoff_number);
          if (data.settings.backup_handoff_number) setBackupHandoff(data.settings.backup_handoff_number);
          if (data.settings.ai_enabled !== undefined) setAgentEnabled(data.settings.ai_enabled);
        }
      })
      .catch((err) => console.error('Failed loading clinic settings:', err));

    const savedGroq = localStorage.getItem('CLINIC_GROQ_API_KEY') || '';
    const savedOpenAI = localStorage.getItem('CLINIC_OPENAI_API_KEY') || '';
    setGroqKey(savedGroq);
    setOpenaiKey(savedOpenAI);
  }, [activeClinic, activeClinicId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (groqKey) localStorage.setItem('CLINIC_GROQ_API_KEY', groqKey);
      if (openaiKey) localStorage.setItem('CLINIC_OPENAI_API_KEY', openaiKey);

      // Persist to backend API
      const res = await fetch('/api/clinic', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clinic_id: activeClinicId,
          name: clinicName,
          phone_number: virtualPhone,
          address: clinicAddress,
          agent_enabled: agentEnabled,
          ai_enabled: agentEnabled,
          agent_name: agentName,
          primary_language: primaryLang,
          plan_tier: planTier,
          monthly_minute_limit: minuteLimit,
          ai_greeting: greeting,
          primary_handoff_number: primaryHandoff,
          backup_handoff_number: backupHandoff,
        }),
      });

      if (res.ok) {
        refreshData();
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err) {
      console.error('Error saving settings:', err);
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedWebhook(label);
    setTimeout(() => setCopiedWebhook(null), 2000);
  };

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com';
  const voiceWebhookUrl = `${baseUrl}/api/twilio/voice`;
  const statusWebhookUrl = `${baseUrl}/api/twilio/status`;

  const inputClass = "w-full bg-black border border-white/10 rounded-apple px-3.5 py-2.5 text-[13px] text-white focus:outline-none focus:border-gcore-orange transition-apple placeholder:text-neutral-600";

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in pb-12 text-white [html.light_&]:text-slate-900 transition-colors duration-300">
      {/* Header */}
      <div className="gcore-card rounded-apple-xl p-5 flex items-center justify-between border border-white/10 [html.light_&]:border-slate-200 bg-[#080808] [html.light_&]:bg-white [html.light_&]:shadow-light-card">
        <div>
          <h1 className="text-xl font-bold text-white [html.light_&]:text-slate-900 tracking-tight">Clinic Phone &amp; Agent Controls</h1>
          <p className="text-xs text-neutral-400 [html.light_&]:text-slate-600 mt-0.5 font-medium">
            Turn agent ON/OFF, manage custom persona, Twilio/Exotel virtual DID numbers, and emergency forwarding
          </p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-950/60 text-emerald-300 text-xs px-3 py-1.5 rounded-full border border-emerald-800/40 font-mono">
          <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
          <span className="font-semibold">{activeClinic?.name}</span>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* ── 1. MASTER AI AGENT ON/OFF CONTROL CARD ── */}
        <div className="gcore-card rounded-apple-xl p-6 space-y-5 border border-white/10 [html.light_&]:border-slate-200 bg-[#080808] [html.light_&]:bg-white [html.light_&]:shadow-light-card">
          <div className="flex items-center justify-between">
            <h3 className="text-[15px] font-bold text-white [html.light_&]:text-slate-900 tracking-tight flex items-center gap-2">
              <Power className="w-4 h-4 text-gcore-orange" strokeWidth={2} />
              Autonomous AI Receptionist Status
            </h3>
            <span className="text-[11px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-full gcore-badge font-bold">
              Master Toggle
            </span>
          </div>

          <div className="p-4 rounded-apple-lg border border-white/10 [html.light_&]:border-slate-200 bg-black/50 [html.light_&]:bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${agentEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
                <h4 className="font-bold text-sm text-white [html.light_&]:text-slate-900">
                  {agentEnabled ? 'AI Receptionist is Active & Answering' : 'AI Receptionist is Paused (Off)'}
                </h4>
              </div>
              <p className="text-xs text-neutral-400 [html.light_&]:text-slate-600 mt-1 max-w-lg leading-relaxed">
                {agentEnabled
                  ? 'The humanoid AI answers all incoming live phone calls, books appointments, answers FAQs, and triages emergencies.'
                  : 'When paused, all incoming calls immediately bypass the AI and ring your front-desk/emergency PSTN phone directly.'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setAgentEnabled(!agentEnabled)}
              className={`px-5 py-2.5 rounded-full text-xs font-bold transition-apple flex items-center gap-2 shrink-0 ${
                agentEnabled
                  ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
              }`}
            >
              <Power className="w-4 h-4" />
              <span>{agentEnabled ? 'Turn OFF Agent' : 'Turn ON Agent'}</span>
            </button>
          </div>

          {/* AI Persona & Language Customization */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2">
            <div>
              <label className="block font-medium text-neutral-300 [html.light_&]:text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Mic className="w-3.5 h-3.5 text-gcore-orange" />
                <span>AI Agent Persona Name</span>
              </label>
              <input
                type="text"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                className={inputClass}
                placeholder="e.g. Maya / Priya / Aryan"
              />
            </div>

            <div>
              <label className="block font-medium text-neutral-300 [html.light_&]:text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-gcore-orange" />
                <span>Default Spoken Language</span>
              </label>
              <select
                value={primaryLang}
                onChange={(e) => setPrimaryLang(e.target.value as any)}
                className={inputClass}
              >
                <option value="mr">मराठी (Marathi)</option>
                <option value="hi">हिंदी (Hindi)</option>
                <option value="en">English (Indian Accent)</option>
              </select>
            </div>
          </div>
        </div>

        {/* ── 2. VIRTUAL DID & CLINIC DETAILS ── */}
        <div className="gcore-card rounded-apple-xl p-6 space-y-5 border border-white/10 [html.light_&]:border-slate-200 bg-[#080808] [html.light_&]:bg-white [html.light_&]:shadow-light-card">
          <div className="flex items-center justify-between">
            <h3 className="text-[15px] font-bold text-white [html.light_&]:text-slate-900 tracking-tight flex items-center gap-2">
              <PhoneCall className="w-4 h-4 text-gcore-orange" strokeWidth={1.8} />
              Virtual DID Phone Number (Twilio / Exotel)
            </h3>
            <span className="text-[11px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-full gcore-badge">
              Inbound Phone Routing
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-medium text-neutral-300 [html.light_&]:text-slate-700 mb-1.5">Clinic Name</label>
              <input
                type="text"
                value={clinicName}
                onChange={(e) => setClinicName(e.target.value)}
                className={inputClass}
                required
              />
            </div>

            <div>
              <label className="block font-medium text-neutral-300 [html.light_&]:text-slate-700 mb-1.5">Virtual DID Phone Number</label>
              <input
                type="text"
                value={virtualPhone}
                onChange={(e) => setVirtualPhone(e.target.value)}
                className={`${inputClass} font-mono font-medium text-orange-300`}
                placeholder="+91-80-4567-8901"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-medium text-neutral-300 [html.light_&]:text-slate-700 mb-1.5">Clinic Physical Address</label>
              <input
                type="text"
                value={clinicAddress}
                onChange={(e) => setClinicAddress(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* ── 3. HUMAN ESCALATION & EMERGENCY FORWARDING ── */}
        <div className="gcore-card rounded-apple-xl p-6 space-y-4 border border-white/10 [html.light_&]:border-slate-200 bg-[#080808] [html.light_&]:bg-white [html.light_&]:shadow-light-card">
          <div className="flex items-center justify-between">
            <h3 className="text-[15px] font-bold text-white [html.light_&]:text-slate-900 tracking-tight flex items-center gap-2">
              <PhoneForwarded className="w-4 h-4 text-gcore-orange" strokeWidth={1.8} />
              Human Escalation &amp; PSTN Forwarding Numbers
            </h3>
            <span className="text-[11px] font-mono text-neutral-400 [html.light_&]:text-slate-500">Failover Protocol</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-medium text-neutral-300 [html.light_&]:text-slate-700 mb-1.5">Primary Receptionist Mobile (PSTN)</label>
              <input
                type="text"
                value={primaryHandoff}
                onChange={(e) => setPrimaryHandoff(e.target.value)}
                className={`${inputClass} font-mono`}
                placeholder="+91-98765-00001"
              />
            </div>

            <div>
              <label className="block font-medium text-neutral-300 [html.light_&]:text-slate-700 mb-1.5">Emergency Doctor Mobile</label>
              <input
                type="text"
                value={backupHandoff}
                onChange={(e) => setBackupHandoff(e.target.value)}
                className={`${inputClass} font-mono`}
                placeholder="+91-98765-00009"
              />
            </div>
          </div>
        </div>

        {/* ── 4. INITIAL SPOKEN GREETING ── */}
        <div className="gcore-card rounded-apple-xl p-6 space-y-4 border border-white/10 [html.light_&]:border-slate-200 bg-[#080808] [html.light_&]:bg-white [html.light_&]:shadow-light-card">
          <div className="flex items-center justify-between">
            <h3 className="text-[15px] font-bold text-white [html.light_&]:text-slate-900 tracking-tight flex items-center gap-2">
              <Cpu className="w-4 h-4 text-gcore-orange" strokeWidth={1.8} />
              Spoken Neural Voice Greeting
            </h3>
            <span className="text-[11px] font-mono text-orange-300 font-bold">First 2 Seconds</span>
          </div>

          <div className="text-xs space-y-2">
            <textarea
              value={greeting}
              onChange={(e) => setGreeting(e.target.value)}
              rows={3}
              className={inputClass}
              placeholder="नमस्कार! Apollo Dental Clinic मध्ये आपले स्वागत आहे..."
            />
          </div>
        </div>

        {/* ── 5. RESELLING & BILLING PLAN ── */}
        <div className="gcore-card rounded-apple-xl p-6 space-y-4 border border-white/10 [html.light_&]:border-slate-200 bg-[#080808] [html.light_&]:bg-white [html.light_&]:shadow-light-card">
          <div className="flex items-center justify-between">
            <h3 className="text-[15px] font-bold text-white [html.light_&]:text-slate-900 tracking-tight flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-400" strokeWidth={1.8} />
              Subscription &amp; Reselling Plan Tier
            </h3>
            <span className="text-[11px] font-mono text-neutral-400 [html.light_&]:text-slate-500">Commercial Limits</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            {[
              { id: 'starter', name: 'Starter Tier', limit: 500, price: '₹4,999/mo' },
              { id: 'growth', name: 'Growth Pro', limit: 1000, price: '₹8,999/mo' },
              { id: 'enterprise', name: 'Enterprise', limit: 2500, price: '₹14,999/mo' },
            ].map((tier) => (
              <button
                key={tier.id}
                type="button"
                onClick={() => {
                  setPlanTier(tier.id as any);
                  setMinuteLimit(tier.limit);
                }}
                className={`p-3.5 rounded-apple-lg border text-left transition-apple ${
                  planTier === tier.id
                    ? 'bg-gcore-orange/15 border-gcore-orange text-white [html.light_&]:text-slate-900 shadow-xs'
                    : 'bg-black/40 [html.light_&]:bg-slate-50 border-white/10 [html.light_&]:border-slate-200 text-neutral-400 [html.light_&]:text-slate-600'
                }`}
              >
                <p className="font-bold text-xs">{tier.name}</p>
                <p className="text-[11px] text-gcore-orange font-mono font-semibold mt-0.5">{tier.price}</p>
                <p className="text-[10px] text-neutral-500 mt-1">{tier.limit} voice mins/month</p>
              </button>
            ))}
          </div>
        </div>

        {/* ── 6. WEBHOOKS ── */}
        <div className="gcore-card rounded-apple-xl p-6 space-y-4 border border-white/10 [html.light_&]:border-slate-200 bg-[#080808] [html.light_&]:bg-white [html.light_&]:shadow-light-card">
          <div className="flex items-center justify-between">
            <h3 className="text-[15px] font-bold text-white [html.light_&]:text-slate-900 tracking-tight flex items-center gap-2">
              <ExternalLink className="w-4 h-4 text-gcore-orange" strokeWidth={1.8} />
              Telephony Webhook Endpoints
            </h3>
            <span className="text-[11px] font-mono text-neutral-400">HTTP POST</span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-medium text-neutral-300 [html.light_&]:text-slate-700 mb-1">Primary Voice Webhook URL</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={voiceWebhookUrl}
                  className="w-full bg-black border border-white/10 rounded-apple px-3.5 py-2 text-orange-300 font-mono text-xs focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => copyToClipboard(voiceWebhookUrl, 'voice')}
                  className="gcore-btn-dark px-3.5 py-2 text-xs flex items-center gap-1.5 font-medium shrink-0"
                >
                  {copiedWebhook === 'voice' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedWebhook === 'voice' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="gcore-btn-orange px-8 py-3 text-xs font-bold flex items-center gap-2 shadow-gcore-btn"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving Changes...' : 'Save & Deploy Settings'}</span>
          </button>
        </div>
      </form>

      {/* Toast Notification */}
      {saved && (
        <div className="toast toast-success">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>Clinic settings and agent controls saved successfully!</span>
        </div>
      )}
    </div>
  );
}
