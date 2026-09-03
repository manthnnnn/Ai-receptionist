'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Shield, Sparkles, Building2, UserCheck, Stethoscope, ArrowRight, Lock, Mail, Wand2, Check } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorParam = searchParams.get('error');
  const redirectParam = searchParams.get('redirect');

  const [email, setEmail] = useState('admin@clinicai.com');
  const [password, setPassword] = useState('••••••••••••');
  const [useMagicLink, setUseMagicLink] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleRoleLogin = async (role: 'SUPER_ADMIN' | 'CLINIC_ADMIN' | 'DOCTOR' | 'RECEPTIONIST', targetPath?: string) => {
    try {
      setLoading(true);
      setMessage(null);
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role,
          email: `${role.toLowerCase()}@clinicai.com`,
          clinic_id: '00000000-0000-0000-0000-000000000001',
        }),
      });
      const data = await res.json();
      if (data.success) {
        const dest = targetPath || data.redirect_url || (role === 'SUPER_ADMIN' ? '/admin' : '/clinic/dashboard');
        router.push(dest);
      }
    } catch (err) {
      console.error('Role login error:', err);
      // Fallback direct navigation
      document.cookie = `demo_role=${role}; path=/; max-age=86400`;
      router.push(targetPath || (role === 'SUPER_ADMIN' ? '/admin' : '/clinic/dashboard'));
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    try {
      setLoading(true);
      setMessage(null);
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password: useMagicLink ? undefined : password,
          magic_link: useMagicLink,
          role: email.includes('admin') ? 'SUPER_ADMIN' : 'CLINIC_ADMIN',
        }),
      });

      const data = await res.json();
      if (data.success) {
        if (data.magic_link_sent) {
          setMessage(data.message || 'Magic login link sent to your inbox!');
        } else {
          const dest = redirectParam || data.redirect_url || '/clinic/dashboard';
          router.push(dest);
        }
      } else {
        setMessage(data.error || 'Login failed. Please check credentials.');
      }
    } catch (err: any) {
      setMessage('Network error during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 sm:p-8 shadow-2xl relative z-10">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-500 to-teal-400 text-white shadow-lg mb-3">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">AI Clinic Receptionist</h1>
          <p className="text-xs text-slate-400 mt-1">Multi-Tenant Telephony & Autonomous Booking Platform</p>
        </div>

        {errorParam && (
          <div className="mb-5 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <Shield className="w-4 h-4 shrink-0 text-rose-400" />
            <span>
              {errorParam === 'unauthorized_super_admin'
                ? 'Access denied. The requested platform view requires SUPER_ADMIN credentials.'
                : 'Session expired or authentication required. Please select a role to proceed.'}
            </span>
          </div>
        )}

        {message && (
          <div className="mb-5 p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0 text-indigo-400" />
            <span>{message}</span>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Work Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-800/80 border border-slate-700/70 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                placeholder="doctor@clinic.com"
                required
              />
            </div>
          </div>

          {!useMagicLink && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-800/80 border border-slate-700/70 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  required
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-slate-400 pt-0.5">
            <button
              type="button"
              onClick={() => setUseMagicLink(!useMagicLink)}
              className="hover:text-indigo-400 flex items-center gap-1 transition-colors"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>{useMagicLink ? 'Use Password Login' : 'Send Passwordless Magic Link'}</span>
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white text-sm font-semibold rounded-lg shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all mt-2 disabled:opacity-50"
          >
            <span>{loading ? 'Authenticating...' : useMagicLink ? 'Send Magic Link' : 'Sign In to Workspace'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase">
            <span className="bg-slate-900 px-3 text-slate-400 font-medium tracking-wider">
              Instant Demo Role Switcher
            </span>
          </div>
        </div>

        {/* Quick Demo Switcher Buttons */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => handleRoleLogin('SUPER_ADMIN')}
            disabled={loading}
            className="p-3 text-left rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-indigo-500/60 transition-all group"
          >
            <div className="flex items-center gap-2 text-indigo-400 mb-1">
              <Shield className="w-4 h-4" />
              <span className="text-xs font-semibold">Super Admin</span>
            </div>
            <p className="text-[10px] text-slate-400">Global SaaS & Multi-Tenant Control (/admin)</p>
          </button>

          <button
            type="button"
            onClick={() => handleRoleLogin('CLINIC_ADMIN')}
            disabled={loading}
            className="p-3 text-left rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-teal-500/60 transition-all group"
          >
            <div className="flex items-center gap-2 text-teal-400 mb-1">
              <Building2 className="w-4 h-4" />
              <span className="text-xs font-semibold">Clinic Admin</span>
            </div>
            <p className="text-[10px] text-slate-400">Apollo Dental Settings & Rosters (/clinic)</p>
          </button>

          <button
            type="button"
            onClick={() => handleRoleLogin('DOCTOR')}
            disabled={loading}
            className="p-3 text-left rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-sky-500/60 transition-all group"
          >
            <div className="flex items-center gap-2 text-sky-400 mb-1">
              <Stethoscope className="w-4 h-4" />
              <span className="text-xs font-semibold">Doctor View</span>
            </div>
            <p className="text-[10px] text-slate-400">Dr. Ashish Verma (Schedule & Patients)</p>
          </button>

          <button
            type="button"
            onClick={() => handleRoleLogin('RECEPTIONIST')}
            disabled={loading}
            className="p-3 text-left rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-amber-500/60 transition-all group"
          >
            <div className="flex items-center gap-2 text-amber-400 mb-1">
              <UserCheck className="w-4 h-4" />
              <span className="text-xs font-semibold">Receptionist</span>
            </div>
            <p className="text-[10px] text-slate-400">Front Desk Roster & Inbound Calls</p>
          </button>
        </div>
      </div>
    </div>
  );
}
