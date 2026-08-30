'use client';

import React, { useState, useEffect } from 'react';
import { useClinic } from '@/components/layout/clinic-context';
import { 
  Building, PhoneForwarded, CheckCircle2, Save, Cpu, Key, 
  PhoneCall, ShieldAlert, Copy, ExternalLink, RefreshCw, Radio
} from 'lucide-react';

export default function SettingsPage() {
  const { activeClinic, activeClinicId, refreshData } = useClinic();
  
  // Clinic Profile State
  const [clinicName, setClinicName] = useState('Apollo Dental Clinic');
  const [virtualPhone, setVirtualPhone] = useState('+91-80-4567-8901');
  const [clinicAddress, setClinicAddress] = useState('45, 2nd Cross, Koramangala 4th Block, Bangalore');

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
    }

    fetch(`/api/clinic?clinic_id=${activeClinicId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.settings) {
          if (data.settings.ai_greeting) setGreeting(data.settings.ai_greeting);
          if (data.settings.primary_handoff_number) setPrimaryHandoff(data.settings.primary_handoff_number);
          if (data.settings.backup_handoff_number) setBackupHandoff(data.settings.backup_handoff_number);
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
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in pb-12 text-white">
      {/* Header */}
      <div className="gcore-card rounded-apple-xl p-5 flex items-center justify-between border border-white/10 bg-[#080808]">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Clinic Phone &amp; Telephony Settings</h1>
          <p className="text-xs text-neutral-400 mt-0.5 font-medium">
            Configure Twilio/Exotel virtual DID numbers, emergency PSTN forwarding, AI greetings, and webhooks
          </p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-950/60 text-emerald-300 text-xs px-3 py-1.5 rounded-full border border-emerald-800/40 font-mono">
          <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
          <span className="font-semibold">Telephony Engine Live</span>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Virtual DID Management Card */}
        <div className="gcore-card rounded-apple-xl p-6 space-y-5 border border-white/10 bg-[#080808]">
          <div className="flex items-center justify-between">
            <h3 className="text-[15px] font-bold text-white tracking-tight flex items-center gap-2">
              <PhoneCall className="w-4 h-4 text-gcore-orange" strokeWidth={1.8} />
              Virtual DID Phone Number (Twilio / Exotel)
            </h3>
            <span className="text-[11px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-full gcore-badge">
              Inbound Phone Routing
            </span>
          </div>

          <p className="text-xs text-neutral-400 leading-relaxed">
            The dedicated virtual phone number assigned to this clinic. Incoming calls from patients to this number will trigger the automated AI receptionist with neural voice greeting.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-medium text-neutral-300 mb-1.5">Clinic Name</label>
              <input
                type="text"
                value={clinicName}
                onChange={(e) => setClinicName(e.target.value)}
                className={inputClass}
                required
              />
            </div>

            <div>
              <label className="block font-medium text-neutral-300 mb-1.5">Virtual DID Phone Number</label>
              <input
                type="text"
                value={virtualPhone}
                onChange={(e) => setVirtualPhone(e.target.value)}
                className={`${inputClass} font-mono font-medium text-orange-300`}
                placeholder="+91-80-4567-8901 or +1 (555) 019-2834"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-medium text-neutral-300 mb-1.5">Clinic Physical Address</label>
              <input
                type="text"
                value={clinicAddress}
                onChange={(e) => setClinicAddress(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* Webhook Endpoints Integration Card */}
        <div className="gcore-card rounded-apple-xl p-6 space-y-4 border border-white/10 bg-[#080808]">
          <div className="flex items-center justify-between">
            <h3 className="text-[15px] font-bold text-white tracking-tight flex items-center gap-2">
              <ExternalLink className="w-4 h-4 text-gcore-orange" strokeWidth={1.8} />
              Telephony Webhook Endpoints (Twilio Console Config)
            </h3>
            <span className="text-[11px] font-mono text-neutral-400">HTTP POST</span>
          </div>

          <p className="text-xs text-neutral-400 leading-relaxed">
            Copy these production webhook URLs and paste them into your Twilio Phone Number configuration page under &quot;A Call Comes In&quot;.
          </p>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-medium text-neutral-300 mb-1">Primary Voice Webhook URL</label>
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

            <div>
              <label className="block font-medium text-neutral-300 mb-1">Call Status Callback Webhook</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={statusWebhookUrl}
                  className="w-full bg-black border border-white/10 rounded-apple px-3.5 py-2 text-neutral-400 font-mono text-xs focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => copyToClipboard(statusWebhookUrl, 'status')}
                  className="gcore-btn-dark px-3.5 py-2 text-xs flex items-center gap-1.5 font-medium shrink-0"
                >
                  {copiedWebhook === 'status' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedWebhook === 'status' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Human Escalation PSTN Forwarding Card */}
        <div className="gcore-card rounded-apple-xl p-6 space-y-4 border border-white/10 bg-[#080808]">
          <div className="flex items-center justify-between">
            <h3 className="text-[15px] font-bold text-white tracking-tight flex items-center gap-2">
              <PhoneForwarded className="w-4 h-4 text-gcore-orange" strokeWidth={1.8} />
              Human Escalation &amp; PSTN Forwarding
            </h3>
            <span className="text-[11px] font-mono text-neutral-400">Failover Protocol</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-medium text-neutral-300 mb-1.5">Primary Receptionist Phone</label>
              <input
                type="text"
                value={primaryHandoff}
                onChange={(e) => setPrimaryHandoff(e.target.value)}
                className={`${inputClass} font-mono`}
                placeholder="+91-98765-00001"
              />
            </div>

            <div>
              <label className="block font-medium text-neutral-300 mb-1.5">Emergency Doctor Mobile</label>
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

        {/* AI Prompt & Neural Voice Greeting Configuration */}
        <div className="gcore-card rounded-apple-xl p-6 space-y-4 border border-white/10 bg-[#080808]">
          <div className="flex items-center justify-between">
            <h3 className="text-[15px] font-bold text-white tracking-tight flex items-center gap-2">
              <Cpu className="w-4 h-4 text-gcore-orange" strokeWidth={1.8} />
              AI Prompt &amp; Neural Voice Greeting
            </h3>
            <span className="text-[11px] font-mono text-orange-300">LLaMA 3.3 Persona</span>
          </div>

          <div className="text-xs space-y-4">
            <div>
              <label className="block font-medium text-neutral-300 mb-1.5">Initial Inbound Spoken Greeting</label>
              <textarea
                value={greeting}
                onChange={(e) => setGreeting(e.target.value)}
                rows={3}
                className={inputClass}
                placeholder="Welcome to Apollo Dental Clinic..."
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-between pt-2">
          {saved && (
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
              <CheckCircle2 className="w-4 h-4" />
              <span>Telephony settings saved successfully!</span>
            </div>
          )}
          {!saved && <div />}

          <button
            type="submit"
            disabled={saving}
            className="gcore-btn-orange px-6 py-2.5 text-xs font-semibold flex items-center gap-2 shadow-gcore-btn"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
