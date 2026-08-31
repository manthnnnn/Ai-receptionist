'use client';

import React, { useState } from 'react';
import { useClinic } from './clinic-context';
import { Building2, X, Plus, Sparkles, Phone, MapPin, Globe, Shield, Mic, CheckCircle2 } from 'lucide-react';

export function AddClinicModal() {
  const { isAddClinicModalOpen, setIsAddClinicModalOpen, createNewClinic } = useClinic();

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [agentName, setAgentName] = useState('Maya');
  const [language, setLanguage] = useState<'mr' | 'hi' | 'en'>('mr');
  const [planTier, setPlanTier] = useState<'starter' | 'growth' | 'enterprise'>('growth');
  const [handoffNumber, setHandoffNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  if (!isAddClinicModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    const newClinic = await createNewClinic({
      name,
      address,
      phone_number: phone,
      agent_name: agentName,
      primary_language: language,
      plan_tier: planTier,
      primary_handoff_number: handoffNumber,
    });

    setLoading(false);
    if (newClinic) {
      setSuccessMsg(`Clinic "${newClinic.name}" provisioned successfully!`);
      setTimeout(() => {
        setSuccessMsg('');
        setIsAddClinicModalOpen(false);
        // Reset form
        setName('');
        setAddress('');
        setPhone('');
        setHandoffNumber('');
      }, 1400);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in text-white">
      <div className="gcore-card border border-white/15 w-full max-w-lg rounded-apple-xl shadow-2xl overflow-hidden animate-scale-in bg-black">
        {/* Header */}
        <div className="px-6 py-4 bg-black/90 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-apple bg-gcore-orange/15 border border-gcore-orange/30 flex items-center justify-center text-gcore-orange shadow-gcore-chip">
              <Building2 className="w-4 h-4" strokeWidth={2} />
            </div>
            <div>
              <h3 className="font-bold text-white text-[15px] tracking-tight">Onboard New Clinic Client</h3>
              <p className="text-xs text-slate-400">Multi-Tenant SaaS Provisioning · Auto-Seeded AI</p>
            </div>
          </div>

          <button
            onClick={() => setIsAddClinicModalOpen(false)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-apple"
          >
            <X className="w-5 h-5" strokeWidth={1.5} />
          </button>
        </div>

        {/* Success Alert */}
        {successMsg && (
          <div className="m-5 p-4 rounded-apple bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 font-medium animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form */}
        {!successMsg && (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
            {/* Clinic Name */}
            <div>
              <label className="block font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-gcore-orange" />
                <span>Clinic / Hospital Name *</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Sanjeevani Multi-Specialty Dental Clinic"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-black border border-white/10 rounded-apple px-3.5 py-2.5 text-white focus:outline-none focus:border-gcore-orange"
              />
            </div>

            {/* Address */}
            <div>
              <label className="block font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>Physical Address &amp; City</span>
              </label>
              <input
                type="text"
                placeholder="e.g. 102, FC Road, Shivaji Nagar, Pune - 411005"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-black border border-white/10 rounded-apple px-3.5 py-2.5 text-white focus:outline-none focus:border-gcore-orange"
              />
            </div>

            {/* Virtual DID & Handoff Number */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-gcore-orange" />
                  <span>Virtual DID (Twilio/Exotel)</span>
                </label>
                <input
                  type="text"
                  placeholder="+91-80-4567-XXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-apple px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-gcore-orange"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Emergency Human Handoff</span>
                </label>
                <input
                  type="text"
                  placeholder="+91-98765-XXXXX"
                  value={handoffNumber}
                  onChange={(e) => setHandoffNumber(e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-apple px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-gcore-orange"
                />
              </div>
            </div>

            {/* AI Agent Persona: Name & Primary Language */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Mic className="w-3.5 h-3.5 text-gcore-orange" />
                  <span>AI Agent Name</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Maya / Priya / Aryan"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-apple px-3.5 py-2.5 text-white focus:outline-none focus:border-gcore-orange"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-slate-400" />
                  <span>Primary Language</span>
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as any)}
                  className="w-full bg-black border border-white/10 rounded-apple px-3.5 py-2.5 text-white focus:outline-none focus:border-gcore-orange"
                >
                  <option value="mr">मराठी (Marathi)</option>
                  <option value="hi">हिंदी (Hindi)</option>
                  <option value="en">English (Indian Accent)</option>
                </select>
              </div>
            </div>

            {/* Plan Tier */}
            <div>
              <label className="block font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                <span>Commercial Plan Tier (Reselling)</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'starter', name: 'Starter', limit: '500 mins/mo' },
                  { id: 'growth', name: 'Growth Pro', limit: '1,000 mins/mo' },
                  { id: 'enterprise', name: 'Enterprise', limit: '2,500 mins/mo' },
                ].map((tier) => (
                  <button
                    key={tier.id}
                    type="button"
                    onClick={() => setPlanTier(tier.id as any)}
                    className={`p-2.5 rounded-apple border text-left transition-apple ${
                      planTier === tier.id
                        ? 'bg-gcore-orange/15 border-gcore-orange text-white'
                        : 'bg-black/50 border-white/10 text-slate-400 hover:border-white/20'
                    }`}
                  >
                    <p className="font-bold text-xs">{tier.name}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{tier.limit}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Submit & Cancel */}
            <div className="pt-3 flex justify-end gap-2.5 border-t border-white/10">
              <button
                type="button"
                onClick={() => setIsAddClinicModalOpen(false)}
                className="gcore-btn-dark px-4 py-2.5 text-xs font-medium text-slate-300"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="gcore-btn-orange px-6 py-2.5 text-xs font-semibold flex items-center gap-2 shadow-gcore-btn"
              >
                <Plus className="w-4 h-4" strokeWidth={2} />
                <span>{loading ? 'Provisioning...' : 'Provision Clinic Client'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
