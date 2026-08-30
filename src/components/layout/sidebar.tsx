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
    <aside
      className="w-[240px] flex flex-col justify-between py-5 min-h-[calc(100vh-61px)] border-r transition-colors duration-300"
      style={{ background: 'var(--sidebar-bg)', borderColor: 'var(--border)' }}
    >
      {/* Navigation */}
      <nav className="px-3 space-y-0.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-apple text-[13px] font-medium transition-apple ${
                isActive
                  ? 'bg-gcore-orange/12 text-gcore-orange border border-gcore-orange/25'
                  : 'hover:bg-black/[0.04]'
              }`}
              style={!isActive ? { color: 'var(--text-secondary)' } : undefined}
            >
              <Icon
                className={`w-[17px] h-[17px] ${isActive ? 'text-gcore-orange' : ''}`}
                style={!isActive ? { color: 'var(--text-muted)' } : undefined}
                strokeWidth={1.8}
              />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Voice Pipeline Status Card */}
      <div className="mx-3 mt-6">
        <div
          className="gcore-card rounded-apple-xl p-3.5 text-xs space-y-2.5"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="flex items-center justify-between pb-2" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="flex items-center gap-1.5 font-semibold text-[11px]" style={{ color: 'var(--text-primary)' }}>
              <Activity className="w-3.5 h-3.5 text-gcore-orange" strokeWidth={2} />
              <span>Pipeline Status</span>
            </div>
            <span className="w-1.5 h-1.5 rounded-full bg-gcore-orange animate-pulse" />
          </div>
          <ul className="space-y-1.5 font-mono text-[11px]">
            {[
              { label: 'VAD', value: 'Silero Neural', highlight: false },
              { label: 'STT', value: 'Deepgram Nova-2', highlight: false },
              { label: 'LLM', value: 'Groq Qwen 3.8', highlight: true },
              { label: 'TTS', value: 'MS Edge Neural', highlight: false },
            ].map(row => (
              <li key={row.label} className="flex justify-between">
                <span style={{ color: 'var(--text-muted)' }}>{row.label}</span>
                <span
                  className={row.highlight ? 'text-orange-400 font-medium' : 'font-medium'}
                  style={!row.highlight ? { color: 'var(--text-secondary)' } : undefined}
                >
                  {row.value}
                </span>
              </li>
            ))}
            <li className="flex justify-between items-center pt-1" style={{ borderTop: '1px solid var(--border)' }}>
              <span className="flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
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
