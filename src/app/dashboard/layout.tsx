'use client';

import React, { useState, useCallback } from 'react';
import { ClinicProvider } from '@/components/layout/clinic-context';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { VoiceTestModal } from '@/components/voice/voice-test-modal';
import { PhoneSimulatorModal } from '@/components/voice/phone-simulator-modal';
import { BookingModal } from '@/components/appointments/booking-modal';
import { AddClinicModal } from '@/components/layout/add-clinic-modal';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const openSidebar = useCallback(() => setIsSidebarOpen(true), []);
  const closeSidebar = useCallback(() => setIsSidebarOpen(false), []);

  return (
    <ClinicProvider>
      <div className="min-h-screen flex flex-col bg-black [html.light_&]:bg-[#F8F9FA] text-white [html.light_&]:text-slate-900 relative transition-colors duration-300">
        {/* Ambient Top-Right Flare */}
        <div className="gcore-electric-ray" />

        {/* Top Header */}
        <Header onMenuToggle={openSidebar} />

        {/* Body Container */}
        <div className="flex-1 flex overflow-hidden relative z-10 bg-black [html.light_&]:bg-[#F8F9FA] transition-colors duration-300">

          {/* Desktop Sidebar — always visible on lg+ */}
          <div className="hidden lg:block">
            <Sidebar />
          </div>

          {/* Mobile Sidebar Drawer */}
          {isSidebarOpen && (
            <>
              {/* Backdrop */}
              <div
                className="sidebar-overlay lg:hidden"
                onClick={closeSidebar}
                aria-hidden="true"
              />
              {/* Drawer */}
              <div
                className="sidebar-drawer lg:hidden flex flex-col justify-between py-5"
                style={{ background: 'var(--sidebar-bg)', borderRight: '1px solid var(--border)' }}
              >
                {/* Close Button */}
                <div className="px-4 mb-3 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Navigation</span>
                  <button
                    onClick={closeSidebar}
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/5 transition-apple"
                    aria-label="Close menu"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>
                <Sidebar onNavClick={closeSidebar} className="flex-1" />
              </div>
            </>
          )}

          {/* Main Content View */}
          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 relative">
            <div className="absolute top-0 right-1/4 w-96 h-96 bg-gcore-orange/5 rounded-full blur-3xl pointer-events-none -z-10" />
            {children}
          </main>
        </div>

        {/* Global Modals */}
        <VoiceTestModal />
        <PhoneSimulatorModal />
        <BookingModal />
        <AddClinicModal />
      </div>
    </ClinicProvider>
  );
}
