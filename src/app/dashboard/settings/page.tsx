'use client';

import React, { useState, useEffect } from 'react';
import { useClinic } from '@/components/layout/clinic-context';
import { Building, PhoneForwarded, CheckCircle2, Save, Cpu, Key } from 'lucide-react';

export default function SettingsPage() {
  const { activeClinic } = useClinic();
  const [handoffNumber, setHandoffNumber] = useState('+91-98765-00001');
  const [greeting, setGreeting] = useState(
    'Hello! Thank you for calling Apollo Dental Clinic. How can I help you today?'
  );
  const [groqKey, setGroqKey] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Load existing keys from localStorage if any
    const savedGroq = localStorage.getItem('CLINIC_GROQ_API_KEY') || '';
    const savedOpenAI = localStorage.getItem('CLINIC_OPENAI_API_KEY') || '';
    setGroqKey(savedGroq);
    setOpenaiKey(savedOpenAI);
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (groqKey) localStorage.setItem('CLINIC_GROQ_API_KEY', groqKey);
    if (openaiKey) localStorage.setItem('CLINIC_OPENAI_API_KEY', openaiKey);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const inputClass = "w-full bg-surface-50 border border-surface-200 rounded-apple px-3.5 py-2.5 text-[13px] text-surface-800 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-apple placeholder:text-surface-300";

  return (
    <div className="space-y-5 max-w-3xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="bg-white rounded-apple-lg shadow-card p-5">
        <h1 className="text-lg font-semibold text-surface-900 tracking-apple">Settings & AI Configuration</h1>
        <p className="text-xs text-surface-400 mt-0.5 font-medium">
          Telephony, AI greeting, Groq/OpenAI keys, and clinic configuration
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* Groq / OpenAI LLM Integration Card */}
        <div className="bg-white rounded-apple-lg shadow-card p-6 space-y-5 border-l-4 border-l-primary-500">
          <div className="flex items-center justify-between">
            <h3 className="text-[15px] font-semibold text-surface-900 tracking-apple flex items-center gap-2">
              <Cpu className="w-4 h-4 text-primary-500" strokeWidth={1.5} />
              AI Voice Engine & LLM Intelligence
            </h3>
            <span className="text-[11px] font-medium bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Groq LLaMA 3.3 70B & OpenAI Ready
            </span>
          </div>

          <p className="text-xs text-surface-500 leading-relaxed">
            Add a free <strong>Groq API Key</strong> or <strong>OpenAI API Key</strong> for unlimited conversational intelligence in any language (Marathi, Hindi, English, Gujarati, Tamil, etc.).
          </p>

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
                <span>OpenAI API Key (Optional fallback)</span>
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

        {/* Clinic Profile */}
        <div className="bg-white rounded-apple-lg shadow-card p-6 space-y-5">
          <h3 className="text-[15px] font-semibold text-surface-900 tracking-apple flex items-center gap-2">
            <Building className="w-4 h-4 text-primary-500" strokeWidth={1.5} />
            Clinic Profile
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-medium text-surface-600 mb-1.5">Clinic Name</label>
              <input
                type="text"
                defaultValue={activeClinic?.name || 'Apollo Dental Clinic'}
                className={inputClass}
              />
            </div>

            <div>
              <label className="block font-medium text-surface-600 mb-1.5">Phone Number</label>
              <input
                type="text"
                defaultValue={activeClinic?.phone_number || '+91-80-4567-8901'}
                className={`${inputClass} font-mono`}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-medium text-surface-600 mb-1.5">Address</label>
              <input
                type="text"
                defaultValue={activeClinic?.address || '45, 2nd Cross, Koramangala 4th Block, Bangalore'}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* AI Voice Settings */}
        <div className="bg-white rounded-apple-lg shadow-card p-6 space-y-5">
          <h3 className="text-[15px] font-semibold text-surface-900 tracking-apple flex items-center gap-2">
            <PhoneForwarded className="w-4 h-4 text-primary-500" strokeWidth={1.5} />
            AI Voice & Handoff
          </h3>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-medium text-surface-600 mb-1.5">AI Welcome Greeting</label>
              <textarea
                rows={2}
                value={greeting}
                onChange={(e) => setGreeting(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className="block font-medium text-surface-600 mb-1.5">Human Handoff Number</label>
              <input
                type="tel"
                value={handoffNumber}
                onChange={(e) => setHandoffNumber(e.target.value)}
                className={`${inputClass} font-mono`}
              />
              <p className="text-[11px] text-surface-400 mt-1.5 leading-relaxed">
                Emergency or complex calls are automatically routed to this number.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-surface-100">
            {saved ? (
              <span className="text-emerald-600 font-medium text-xs flex items-center gap-1.5 animate-fade-in">
                <CheckCircle2 className="w-4 h-4" strokeWidth={1.5} />
                Settings & API keys saved successfully!
              </span>
            ) : (
              <span></span>
            )}

            <button
              type="submit"
              className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white font-medium text-xs px-5 py-2.5 rounded-apple transition-apple shadow-sm"
            >
              <Save className="w-4 h-4" strokeWidth={1.5} />
              <span>Save Settings</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
