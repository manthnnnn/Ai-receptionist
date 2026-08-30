'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Clinic, ClinicStats } from '@/types';

interface ClinicContextType {
  activeClinicId: string;
  setActiveClinicId: (id: string) => void;
  clinics: Clinic[];
  activeClinic: Clinic | undefined;
  stats: ClinicStats | null;
  refreshData: () => void;
  isVoiceTesterOpen: boolean;
  setIsVoiceTesterOpen: (open: boolean) => void;
  isPhoneSimulatorOpen: boolean;
  setIsPhoneSimulatorOpen: (open: boolean) => void;
  isManualBookingOpen: boolean;
  setIsManualBookingOpen: (open: boolean) => void;
  theme: 'dark' | 'light';
  setTheme: (t: 'dark' | 'light') => void;
  toggleTheme: () => void;
}

const ClinicContext = createContext<ClinicContextType | undefined>(undefined);

export function ClinicProvider({ children }: { children: React.ReactNode }) {
  const [activeClinicId, setActiveClinicId] = useState<string>('00000000-0000-0000-0000-000000000001');
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [stats, setStats] = useState<ClinicStats | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [isVoiceTesterOpen, setIsVoiceTesterOpen] = useState(false);
  const [isPhoneSimulatorOpen, setIsPhoneSimulatorOpen] = useState(false);
  const [isManualBookingOpen, setIsManualBookingOpen] = useState(false);
  
  // Theme state: dark (default) | light
  const [theme, setThemeState] = useState<'dark' | 'light'>('dark');

  // Load saved theme on client mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('clinic_theme') as 'dark' | 'light' | null;
      const initialTheme = saved === 'light' ? 'light' : 'dark';
      setThemeState(initialTheme);
      applyTheme(initialTheme);
    }
  }, []);

  const applyTheme = (t: 'dark' | 'light') => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      root.classList.remove('dark', 'light');
      root.classList.add(t);
      root.setAttribute('data-theme', t);
    }
  };

  const setTheme = (t: 'dark' | 'light') => {
    setThemeState(t);
    if (typeof window !== 'undefined') {
      localStorage.setItem('clinic_theme', t);
    }
    applyTheme(t);
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const refreshData = () => setRefreshKey((k) => k + 1);

  useEffect(() => {
    fetch(`/api/clinic?clinic_id=${activeClinicId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStats(data.stats);
          if (data.clinic) {
            setClinics((prev) => {
              if (!prev.some((c) => c.id === data.clinic.id)) {
                return [...prev, data.clinic];
              }
              return prev;
            });
          }
        }
      })
      .catch((err) => console.error('Error fetching clinic context:', err));
  }, [activeClinicId, refreshKey]);

  // Initial populate of known clinics
  useEffect(() => {
    setClinics([
      {
        id: '00000000-0000-0000-0000-000000000001',
        name: 'Apollo Dental Clinic',
        address: '45, 2nd Cross, Koramangala 4th Block, Bangalore - 560034',
        phone_number: '+91-80-4567-8901',
        timezone: 'Asia/Kolkata',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '00000000-0000-0000-0000-000000000002',
        name: 'Fortis Health Point',
        address: '14, Bannerghatta Main Rd, Bengaluru - 560076',
        phone_number: '+91-80-5678-9012',
        timezone: 'Asia/Kolkata',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '00000000-0000-0000-0000-000000000003',
        name: 'Max Care Multispeciality',
        address: '88, Linking Road, Bandra West, Mumbai - 400050',
        phone_number: '+91-22-6789-0123',
        timezone: 'Asia/Kolkata',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);
  }, []);

  const activeClinic = clinics.find((c) => c.id === activeClinicId) || clinics[0];

  return (
    <ClinicContext.Provider
      value={{
        activeClinicId,
        setActiveClinicId,
        clinics,
        activeClinic,
        stats,
        refreshData,
        isVoiceTesterOpen,
        setIsVoiceTesterOpen,
        isPhoneSimulatorOpen,
        setIsPhoneSimulatorOpen,
        isManualBookingOpen,
        setIsManualBookingOpen,
        theme,
        setTheme,
        toggleTheme,
      }}
    >
      {children}
    </ClinicContext.Provider>
  );
}

export function useClinic() {
  const context = useContext(ClinicContext);
  if (!context) {
    throw new Error('useClinic must be used within a ClinicProvider');
  }
  return context;
}
