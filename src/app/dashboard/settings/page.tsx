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

  const inputClass = "w-full bg-surface-50 border border-surface-200 rounded-apple px-3.5 py-2.5 text-[13px] text-surface-800 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-apple placeholder:text-surface-300";

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in pb-12">
      {/* Header */}
      <div className="bg-white rounded-apple-lg shadow-card p-5 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-surface-900 tracking-apple">Clinic Phone & Telephony Management</h1>
          <p className="text-xs text-surface-400 mt-0.5 font-medium">
            Configure Twilio/Exotel virtual DID numbers, emergency PSTN forwarding, AI greetings, and webhooks
          </p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 text-xs px-3 py-1.5 rounded-full border border-emerald-200">
          <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-500" />
          <span className="font-semibold">Telephony Engine Live</span>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Deliverable 3: Clinic Phone & Virtual DID Management Card */}
        <div className="bg-white rounded-apple-lg shadow-card p-6 space-y-5 border-l-4 border-l-primary-500">
          <div className="flex items-center justify-between">
            <h3 className="text-[15px] font-semibold text-surface-900 tracking-apple flex items-center gap-2">
              <PhoneCall className="w-4 h-4 text-primary-500" strokeWidth={1.5} />
              Virtual DID Phone Number (Twilio / Exotel)
            </h3>
            <span className="text-[11px] font-medium bg-primary-50 text-primary-700 px-2.5 py-0.5 rounded-full border border-primary-200">
              Inbound Phone Routing
            </span>
          </div>

          <p className="text-xs text-surface-500 leading-relaxed">
            The dedicated virtual phone number assigned to this clinic. Incoming calls from patients to this number will trigger the automated AI receptionist with Polly voice greeting.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-medium text-surface-700 mb-1.5">Clinic Name</label>
              <input
                type="text"
                value={clinicName}
                onChange={(e) => setClinicName(e.target.value)}
                className={inputClass}
                required
              />
            </div>

            <div>
              <label className="block font-medium text-surface-700 mb-1.5">Virtual DID Phone Number</label>
              <input
                type="text"
                value={virtualPhone}
                onChange={(e) => setVirtualPhone(e.target.value)}
                className={`${inputClass} font-mono font-medium`}
                placeholder="+91-80-4567-8901 or +1 (555) 019-2834"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-medium text-surface-700 mb-1.5">Clinic Physical Address</label>
              <input
                type="text"
                value={clinicAddress}
                onChange={(e) => setClinicAddress(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* Deliverable 1 & 2 Helper: Webhook Endpoints Integration Card */}
        <div className="bg-white rounded-apple-lg shadow-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[15px] font-semibold text-surface-900 tracking-apple flex items-center gap-2">
              <ExternalLink className="w-4 h-4 text-primary-500" strokeWidth={1.5} />
              Telephony Webhook Endpoints (Twilio Console Config)
            </h3>
            <span className="text-[11px] font-mono text-surface-400 bg-surface-100 px-2 py-0.5 rounded">
              Person 1 & 2 Bridge
            </span>
          </div>

          <p className="text-xs text-surface-500 leading-relaxed">
            Configure these webhook endpoints in the Twilio Phone Numbers Console under <strong>Voice & Fax Configuration</strong>:
          </p>

          <div className="space-y-3">
            <div className="bg-surface-50 border border-surface-200 rounded-apple p-3.5 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <span className="text-[11px] font-semibold text-surface-600 block uppercase tracking-wider">
                  A Call Comes In (Inbound Voice Webhook)
                </span>
                <span className="text-xs font-mono text-surface-800 break-all">{voiceWebhookUrl}</span>
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard(voiceWebhookUrl, 'voice')}
                className="flex items-center gap-1.5 bg-white border border-surface-200 hover:bg-surface-50 text-surface-700 px-3 py-1.5 rounded-apple text-xs font-medium shrink-0 transition-apple shadow-sm"
              >
                {copiedWebhook === 'voice' ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-surface-400" />
                )}
                <span>{copiedWebhook === 'voice' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <div className="bg-surface-50 border border-surface-200 rounded-apple p-3.5 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <span className="text-[11px] font-semibold text-surface-600 block uppercase tracking-wider">
                  Call Status Changes (Status Callback URL)
                </span>
                <span className="text-xs font-mono text-surface-800 break-all">{statusWebhookUrl}</span>
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard(statusWebhookUrl, 'status')}
                className="flex items-center gap-1.5 bg-white border border-surface-200 hover:bg-surface-50 text-surface-700 px-3 py-1.5 rounded-apple text-xs font-medium shrink-0 transition-apple shadow-sm"
              >
                {copiedWebhook === 'status' ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-surface-400" />
                )}
                <span>{copiedWebhook === 'status' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Deliverable 3: Emergency Fallback Routing & Front-Desk Handoff */}
        <div className="bg-white rounded-apple-lg shadow-card p-6 space-y-5 border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between">
            <h3 className="text-[15px] font-semibold text-surface-900 tracking-apple flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-500" strokeWidth={1.5} />
              Emergency Fallback Routing & Front-Desk Contacts
            </h3>
            <span className="text-[11px] font-medium bg-amber-50 text-amber-700 px-2.5 py-0.5 rounded-full border border-amber-200">
              PSTN Fallback Active
            </span>
          </div>

          <p className="text-xs text-surface-500 leading-relaxed">
            If a caller experiences an acute medical emergency, asks to speak to human staff, or if the voice engine needs human escalation, calls are seamlessly transferred via PSTN to these numbers.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-medium text-surface-700 mb-1.5">Primary Front-Desk Mobile Number</label>
              <input
                type="tel"
                value={primaryHandoff}
                onChange={(e) => setPrimaryHandoff(e.target.value)}
                className={`${inputClass} font-mono font-medium`}
                placeholder="+91-98765-00001"
                required
              />
              <p className="text-[11px] text-surface-400 mt-1">Main receptionist mobile or reception desk phone.</p>
            </div>

            <div>
              <label className="block font-medium text-surface-700 mb-1.5">Backup / Doctor Mobile Number (Optional)</label>
              <input
                type="tel"
                value={backupHandoff}
                onChange={(e) => setBackupHandoff(e.target.value)}
                className={`${inputClass} font-mono`}
                placeholder="+91-98765-00009"
              />
              <p className="text-[11px] text-surface-400 mt-1">Secondary escalation contact if primary line is busy.</p>
            </div>
          </div>
        </div>

        {/* AI Voice Greeting Customization */}
        <div className="bg-white rounded-apple-lg shadow-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[15px] font-semibold text-surface-900 tracking-apple flex items-center gap-2">
              <PhoneForwarded className="w-4 h-4 text-primary-500" strokeWidth={1.5} />
              Inbound AI Greeting & Voice Prompt
            </h3>
            <span className="text-[11px] font-medium bg-surface-100 text-surface-700 px-2.5 py-0.5 rounded-full">
              Polly.Aditi (en-IN)
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-medium text-surface-700 mb-1.5">Dynamic Welcome Greeting Message</label>
              <textarea
                rows={3}
                value={greeting}
                onChange={(e) => setGreeting(e.target.value)}
                className={inputClass}
                placeholder="Hello! Thank you for calling Apollo Dental Clinic. How can I assist you with your appointment today?"
                required
              />
              <p className="text-[11px] text-surface-400 mt-1.5">
                This exact text is converted to natural Indian-accent speech when any patient dials the virtual DID number.
              </p>
            </div>
          </div>
        </div>

        {/* Groq / OpenAI LLM Intelligence Keys */}
        <div className="bg-white rounded-apple-lg shadow-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[15px] font-semibold text-surface-900 tracking-apple flex items-center gap-2">
              <Cpu className="w-4 h-4 text-primary-500" strokeWidth={1.5} />
              LLM API Configuration
            </h3>
            <span className="text-[11px] font-medium bg-surface-100 text-surface-700 px-2.5 py-0.5 rounded-full">
              Groq LLaMA 3.3 70B & OpenAI
            </span>
          </div>

          <div className="space-y-3.5 text-xs">
            <div>
              <label className="block font-medium text-surface-700 mb-1.5 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-primary-500" />
                <span>Groq API Key (Free, sub-250ms LLaMA 3.3 70B)</span>
              </label>
              <input
                type="password"
                placeholder="gsk_..."
                value={groqKey}
                onChange={(e) => setGroqKey(e.target.value)}
                className={`${inputClass} font-mono`}
              />
              <span className="text-[11px] text-surface-400 mt-1 block">
                Get a free key from <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer" className="text-primary-500 underline">console.groq.com</a>
              </span>
            </div>

            <div>
              <label className="block font-medium text-surface-700 mb-1.5 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-surface-400" />
                <span>OpenAI API Key (Optional Fallback)</span>
              </label>
              <input
                type="password"
                placeholder="sk-..."
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
                className={`${inputClass} font-mono`}
              />
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div className="bg-white rounded-apple-lg shadow-card p-4 flex items-center justify-between sticky bottom-4 z-20 border border-surface-200">
          <div>
            {saved ? (
              <span className="text-emerald-600 font-medium text-xs flex items-center gap-1.5 animate-fade-in">
                <CheckCircle2 className="w-4 h-4" strokeWidth={1.5} />
                Clinic phone settings and routing saved successfully!
              </span>
            ) : (
              <span className="text-xs text-surface-400">Ensure all numbers are entered in E.164 / standard format</span>
            )}
          </div>

          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 active:scale-[0.98] text-white font-medium text-xs px-6 py-2.5 rounded-apple transition-apple shadow-sm disabled:opacity-50"
          >
            {saving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" strokeWidth={1.5} />
            )}
            <span>{saving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

