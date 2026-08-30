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
    <aside className="w-[240px] bg-black [html.light_&]:bg-white border-r border-white/10 [html.light_&]:border-black/10 flex flex-col justify-between py-5 min-h-[calc(100vh-61px)] transition-colors duration-300">
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
                  ? 'bg-gcore-orange/15 text-gcore-orange border border-gcore-orange/30 shadow-gcore-btn'
                  : 'text-neutral-400 [html.light_&]:text-slate-600 hover:text-white [html.light_&]:hover:text-black hover:bg-white/[0.04] [html.light_&]:hover:bg-black/[0.04]'
              }`}
            >
              <Icon className={`w-[17px] h-[17px] ${isActive ? 'text-gcore-orange' : 'text-neutral-500 [html.light_&]:text-slate-400'}`} strokeWidth={1.8} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Voice Pipeline Card */}
      <div className="mx-3 mt-6">
        <div className="gcore-card rounded-apple-xl p-3.5 text-xs space-y-2.5 border border-white/10 [html.light_&]:border-black/10 bg-[#080808] [html.light_&]:bg-slate-50">
          <div className="flex items-center justify-between pb-2 border-b border-white/10 [html.light_&]:border-black/10">
            <div className="flex items-center gap-1.5 text-white [html.light_&]:text-slate-900 font-semibold text-[11px]">
              <Activity className="w-3.5 h-3.5 text-gcore-orange" strokeWidth={2} />
              <span>Pipeline Status</span>
            </div>
            <span className="w-1.5 h-1.5 rounded-full bg-gcore-orange animate-pulse" />
          </div>
          <ul className="space-y-1.5 text-neutral-400 [html.light_&]:text-slate-600 font-mono text-[11px]">
            <li className="flex justify-between">
              <span className="text-neutral-500 [html.light_&]:text-slate-400">VAD</span>
              <span className="text-neutral-200 [html.light_&]:text-slate-800 font-medium">Silero Neural</span>
            </li>
            <li className="flex justify-between">
              <span className="text-neutral-500 [html.light_&]:text-slate-400">STT</span>
              <span className="text-neutral-200 [html.light_&]:text-slate-800 font-medium">Deepgram Nova-2</span>
            </li>
            <li className="flex justify-between">
              <span className="text-neutral-500 [html.light_&]:text-slate-400">LLM</span>
              <span className="text-orange-400 font-medium">Groq LLaMA 3.3</span>
            </li>
            <li className="flex justify-between">
              <span className="text-neutral-500 [html.light_&]:text-slate-400">TTS</span>
              <span className="text-neutral-200 [html.light_&]:text-slate-800 font-medium">Cartesia Sonic</span>
            </li>
            <li className="flex justify-between items-center pt-1 border-t border-white/[0.05] [html.light_&]:border-black/[0.06]">
              <span className="text-neutral-500 [html.light_&]:text-slate-400 flex items-center gap-1">
                <Lock className="w-2.5 h-2.5 text-gcore-orange" />
                Concurrency
              </span>
              <span className="text-gcore-orange font-semibold text-[10px]">ATOMIC LOCK</span>
            </li>
          </ul>
        </div>
      </div>
    </aside>
  );
}
