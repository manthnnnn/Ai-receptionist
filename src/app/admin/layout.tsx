import React from 'react';
import Link from 'next/link';
import { Shield, LayoutDashboard, Building2, Activity, ArrowLeft, LogOut } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Super Admin Navigation Bar */}
      <header className="h-16 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-6">
          <Link href="/admin" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-rose-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight text-white block">SaaS Super Admin</span>
              <span className="text-[10px] text-slate-400 block -mt-0.5">Clinic AI Multi-Tenant Core</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1 pl-4 border-l border-slate-800">
            <Link
              href="/admin"
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-200 hover:text-white hover:bg-slate-800/80 transition-colors flex items-center gap-1.5"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-indigo-400" />
              <span>Platform Overview</span>
            </Link>
            <Link
              href="/admin/clinics"
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-200 hover:text-white hover:bg-slate-800/80 transition-colors flex items-center gap-1.5"
            >
              <Building2 className="w-3.5 h-3.5 text-teal-400" />
              <span>Clinics Directory</span>
            </Link>
            <Link
              href="/admin/calls"
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-200 hover:text-white hover:bg-slate-800/80 transition-colors flex items-center gap-1.5"
            >
              <Activity className="w-3.5 h-3.5 text-indigo-400" />
              <span>Global Call Telemetry</span>
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/clinic/dashboard"
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Switch to</span> Clinic View
          </Link>
          <Link
            href="/login"
            className="p-2 rounded-lg bg-slate-800/60 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-slate-700/60 transition-colors"
            title="Switch User / Logout"
          >
            <LogOut className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Admin Content Area */}
      <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
        {children}
      </main>
    </div>
  );
}
