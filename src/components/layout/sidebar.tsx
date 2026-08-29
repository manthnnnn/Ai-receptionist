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
  Settings
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
    <aside className="w-[240px] bg-white border-r border-surface-200/80 flex flex-col justify-between py-4 min-h-[calc(100vh-57px)]">
      {/* Navigation */}
      <nav className="px-3 space-y-0.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-apple text-[13px] font-medium transition-apple ${
                isActive
                  ? 'bg-primary-50 text-primary-600'
                  : 'text-surface-500 hover:text-surface-800 hover:bg-surface-50'
              }`}
            >
              <Icon className={`w-[18px] h-[18px] ${isActive ? 'text-primary-500' : 'text-surface-400'}`} strokeWidth={1.5} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Voice Pipeline Card */}
      <div className="mx-3 mt-6">
        <div className="bg-surface-50 border border-surface-200 rounded-apple-lg p-3.5 text-xs space-y-2.5">
          <div className="flex items-center gap-2 text-surface-700 font-semibold pb-2 border-b border-surface-200">
            <Activity className="w-3.5 h-3.5 text-primary-500" strokeWidth={1.5} />
            <span>Voice Pipeline</span>
          </div>
          <ul className="space-y-1.5 text-surface-500 font-mono text-[11px]">
            <li className="flex justify-between">
              <span>VAD</span>
              <span className="text-surface-700 font-medium">Silero (Local)</span>
            </li>
            <li className="flex justify-between">
              <span>STT</span>
              <span className="text-surface-700 font-medium">Deepgram Nova-2</span>
            </li>
            <li className="flex justify-between">
              <span>LLM</span>
              <span className="text-surface-700 font-medium">Groq LLaMA 3.1</span>
            </li>
            <li className="flex justify-between">
              <span>TTS</span>
              <span className="text-surface-700 font-medium">Cartesia Sonic</span>
            </li>
            <li className="flex justify-between">
              <span>Lock</span>
              <span className="text-emerald-600 font-semibold">SELECT FOR UPDATE</span>
            </li>
          </ul>
        </div>
      </div>
    </aside>
  );
}
