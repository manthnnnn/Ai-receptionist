'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  CalendarCheck, 
  Users, 
  PhoneCall, 
  HelpCircle, 
  Cpu, 
  PhoneForwarded,
  Activity,
  Settings,
  Lock
} from 'lucide-react';

const navItems = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Appointments', href: '/dashboard/appointments', icon: CalendarCheck },
  { name: 'Doctors', href: '/dashboard/doctors', icon: Users },
  { name: 'Call Logs', href: '/dashboard/calls', icon: PhoneCall },
  { name: 'Knowledge Base', href: '/dashboard/faqs', icon: HelpCircle },
  { name: 'Voice Engine', href: '/dashboard/voice-engine', icon: Cpu },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-[240px] bg-slate-950/80 border-r border-white/[0.08] flex flex-col justify-between py-5 min-h-[calc(100vh-61px)]">
      {/* Navigation */}
      <nav className="px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-apple text-[13px] font-medium transition-apple ${
                isActive
                  ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30 shadow-glow-cyan'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
              }`}
            >
              <Icon className={`w-[17px] h-[17px] ${isActive ? 'text-sky-400' : 'text-slate-500'}`} strokeWidth={1.8} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Voice Pipeline Card */}
      <div className="mx-3 mt-6">
        <div className="glass-panel rounded-apple-xl p-3.5 text-xs space-y-2.5 border border-white/[0.08]">
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
            <div className="flex items-center gap-1.5 text-slate-200 font-semibold text-[11px]">
              <Activity className="w-3.5 h-3.5 text-sky-400" strokeWidth={2} />
              <span>Pipeline Status</span>
            </div>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <ul className="space-y-1.5 text-slate-400 font-mono text-[11px]">
            <li className="flex justify-between">
              <span className="text-slate-500">VAD</span>
              <span className="text-slate-200 font-medium">Silero (Local)</span>
            </li>
            <li className="flex justify-between">
              <span className="text-slate-500">STT</span>
              <span className="text-slate-200 font-medium">Deepgram Nova-2</span>
            </li>
            <li className="flex justify-between">
              <span className="text-slate-500">LLM</span>
              <span className="text-sky-300 font-medium">Groq LLaMA 3.1</span>
            </li>
            <li className="flex justify-between">
              <span className="text-slate-500">TTS</span>
              <span className="text-slate-200 font-medium">Cartesia Sonic</span>
            </li>
            <li className="flex justify-between items-center pt-1 border-t border-white/[0.05]">
              <span className="text-slate-500 flex items-center gap-1">
                <Lock className="w-2.5 h-2.5 text-emerald-400" />
                Concurrency
              </span>
              <span className="text-emerald-400 font-semibold text-[10px]">ADVISORY LOCK</span>
            </li>
          </ul>
        </div>
      </div>
    </aside>
  );
}
