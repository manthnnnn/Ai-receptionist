'use client';

import React, { useState, useEffect } from 'react';
import { Building2, Plus, Phone, Globe, Shield, Check, Trash2, Edit3, X } from 'lucide-react';

export default function AdminClinicsPage() {
  const [clinics, setClinics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('+91-80-4567-9900');
  const [address, setAddress] = useState('');
  const [language, setLanguage] = useState<'mr' | 'hi' | 'en'>('mr');
  const [planTier, setPlanTier] = useState<'starter' | 'growth' | 'enterprise'>('growth');
  const [handoffNumber, setHandoffNumber] = useState('+91-98765-00099');

  const fetchClinics = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/clinic?all=true');
      const data = await res.json();
      if (data.success) {
        setClinics(data.clinics);
      }
    } catch (err) {
      console.error('Error loading clinics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClinics();
  }, []);

  const handleCreateClinic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      const res = await fetch('/api/clinic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone_number: phoneNumber.trim(),
          address: address.trim() || 'Pune, Maharashtra',
          primary_language: language,
          plan_tier: planTier,
          primary_handoff_number: handoffNumber.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        setName('');
        fetchClinics();
      }
    } catch (err) {
      console.error('Create clinic error:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Clinics Directory & Provisioning</h1>
          <p className="text-xs text-slate-400 mt-1">
            Global clinic directory, PSTN phone allocations, and plan tier limits.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-lg shadow-indigo-600/20 flex items-center gap-2 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Provision New Clinic</span>
        </button>
      </div>

      {/* Clinics Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 text-xs">Loading clinics catalog...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clinics.map((c) => (
            <div key={c.id} className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-sm text-white">{c.name}</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{c.address}</p>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  {c.plan_tier}
                </span>
              </div>

              <div className="space-y-2 text-xs text-slate-300 border-t border-slate-800/80 pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    PSTN Number:
                  </span>
                  <span className="font-mono text-white">{c.phone_number}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-slate-400" />
                    Primary Lang:
                  </span>
                  <span className="uppercase font-medium text-teal-400">{c.primary_language}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Doctors Active:</span>
                  <span className="text-white font-medium">{c.doctors_count || 0}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Telephony Minutes:</span>
                  <span className="font-mono text-slate-300">
                    {c.monthly_minutes_used || 0} / {c.monthly_minute_limit || 1000}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between">
                <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  Live in Production
                </span>
                <button
                  onClick={() => {
                    document.cookie = `demo_clinic_id=${c.id}; path=/; max-age=86400`;
                    window.location.href = '/clinic/dashboard';
                  }}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                >
                  Manage Tenant &rarr;
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Provisioning Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white">Provision New Clinic Tenant</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateClinic} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Clinic Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Pune Orthodontics Center"
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">PSTN Phone Number</label>
                  <input
                    type="text"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs font-mono focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Emergency Handoff Phone</label>
                  <input
                    type="text"
                    value={handoffNumber}
                    onChange={(e) => setHandoffNumber(e.target.value)}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs font-mono focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Primary Voice Language</label>
                  <select
                    value={language}
                    onChange={(e: any) => setLanguage(e.target.value)}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-indigo-500"
                  >
                    <option value="mr">Marathi (मराठी)</option>
                    <option value="hi">Hindi (हिंदी)</option>
                    <option value="en">Indian English</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">SaaS Plan Tier</label>
                  <select
                    value={planTier}
                    onChange={(e: any) => setPlanTier(e.target.value)}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-indigo-500"
                  >
                    <option value="starter">Starter (500 mins)</option>
                    <option value="growth">Growth (1,000 mins)</option>
                    <option value="enterprise">Enterprise (2,500 mins)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Clinic Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="FC Road, Shivajinagar, Pune"
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md"
                >
                  Provision Clinic
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
