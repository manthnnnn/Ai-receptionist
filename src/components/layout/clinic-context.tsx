'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Clinic, ClinicStats } from '@/types';

interface ClinicContextType {
  activeClinicId: string;
  setActiveClinicId: (id: string) => void;
  clinics: Clinic[];
  activeClinic: Clinic | undefined;
  stats: ClinicStats | null;
  refreshData: () => void;
  toggleAgentActive: (enabled: boolean) => Promise<void>;
  createNewClinic: (data: {
    name: string;
    address?: string;
    phone_number?: string;
    agent_name?: string;
    primary_language?: 'mr' | 'hi' | 'en';
    voice_id?: string;
    plan_tier?: 'starter' | 'growth' | 'enterprise';
    primary_handoff_number?: string;
    ai_greeting?: string;
  }) => Promise<Clinic | null>;
  deleteClinic: (id: string) => Promise<boolean>;
  isVoiceTesterOpen: boolean;
  setIsVoiceTesterOpen: (open: boolean) => void;
  isPhoneSimulatorOpen: boolean;
  setIsPhoneSimulatorOpen: (open: boolean) => void;
  isManualBookingOpen: boolean;
  setIsManualBookingOpen: (open: boolean) => void;
  isAddClinicModalOpen: boolean;
  setIsAddClinicModalOpen: (open: boolean) => void;
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
  const [isAddClinicModalOpen, setIsAddClinicModalOpen] = useState(false);
  
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

  // Fetch all clinics
  const fetchAllClinics = useCallback(() => {
    fetch('/api/clinic?all=true')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.clinics) {
          setClinics(data.clinics);
        }
      })
      .catch((err) => console.error('Error fetching all clinics:', err));
  }, []);

  // Fetch active clinic & stats
  useEffect(() => {
    fetch(`/api/clinic?clinic_id=${activeClinicId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStats(data.stats);
          if (data.clinic) {
            setClinics((prev) => {
              const idx = prev.findIndex((c) => c.id === data.clinic.id);
              if (idx >= 0) {
                const next = [...prev];
                next[idx] = { ...next[idx], ...data.clinic };
                return next;
              }
              return [...prev, data.clinic];
            });
          }
        }
      })
      .catch((err) => console.error('Error fetching clinic context:', err));
    
    fetchAllClinics();
  }, [activeClinicId, refreshKey, fetchAllClinics]);

  // Master Agent ON/OFF Switch
  const toggleAgentActive = async (enabled: boolean) => {
    try {
      // Optimistic update
      setClinics((prev) =>
        prev.map((c) => (c.id === activeClinicId ? { ...c, agent_enabled: enabled } : c))
      );

      const res = await fetch('/api/clinic', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clinic_id: activeClinicId,
          agent_enabled: enabled,
          ai_enabled: enabled,
        }),
      });

      if (res.ok) {
        refreshData();
      }
    } catch (err) {
      console.error('Error toggling agent:', err);
    }
  };

  // Create New Clinic Client
  const createNewClinic = async (clinicData: {
    name: string;
    address?: string;
    phone_number?: string;
    agent_name?: string;
    primary_language?: 'mr' | 'hi' | 'en';
    voice_id?: string;
    plan_tier?: 'starter' | 'growth' | 'enterprise';
    primary_handoff_number?: string;
    ai_greeting?: string;
  }): Promise<Clinic | null> => {
    try {
      const res = await fetch('/api/clinic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clinicData),
      });

      const data = await res.json();
      if (data.success && data.clinic) {
        setClinics((prev) => [...prev, data.clinic]);
        setActiveClinicId(data.clinic.id);
        refreshData();
        return data.clinic;
      }
      return null;
    } catch (err) {
      console.error('Error creating clinic:', err);
      return null;
    }
  };

  // Delete Clinic
  const deleteClinic = async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/clinic?clinic_id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setClinics((prev) => prev.filter((c) => c.id !== id));
        if (activeClinicId === id) {
          const remaining = clinics.filter((c) => c.id !== id);
          if (remaining.length > 0) {
            setActiveClinicId(remaining[0].id);
          }
        }
        refreshData();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error deleting clinic:', err);
      return false;
    }
  };

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
        toggleAgentActive,
        createNewClinic,
        deleteClinic,
        isVoiceTesterOpen,
        setIsVoiceTesterOpen,
        isPhoneSimulatorOpen,
        setIsPhoneSimulatorOpen,
        isManualBookingOpen,
        setIsManualBookingOpen,
        isAddClinicModalOpen,
        setIsAddClinicModalOpen,
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
