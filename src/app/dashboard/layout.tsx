'use client';

import React from 'react';
import { ClinicProvider } from '@/components/layout/clinic-context';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { VoiceTestModal } from '@/components/voice/voice-test-modal';
import { PhoneSimulatorModal } from '@/components/voice/phone-simulator-modal';
import { BookingModal } from '@/components/appointments/booking-modal';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClinicProvider>
      <div className="min-h-screen flex flex-col bg-mesh-dark text-slate-100">
        {/* Top Header */}
        <Header />

        {/* Body Container */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          <Sidebar />

          {/* Main Content View */}
          <main className="flex-1 overflow-y-auto p-6 md:p-8 relative">
            <div className="absolute top-0 right-1/4 w-96 h-96 bg-sky-500/5 rounded-full blur-3xl pointer-events-none -z-10" />
            {children}
          </main>
        </div>

        {/* Global Modals */}
        <VoiceTestModal />
        <PhoneSimulatorModal />
        <BookingModal />
      </div>
    </ClinicProvider>
  );
}
