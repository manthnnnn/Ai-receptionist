'use client';

import React from 'react';
import { useClinic } from './clinic-context';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggleTheme } = useClinic();

  return (
    <button
      onClick={toggleTheme}
      type="button"
      aria-label={`Switch to ${theme === 'dark' ? 'Soft Light' : 'Pitch Dark'} Mode`}
      title={`Switch to ${theme === 'dark' ? 'Soft Light' : 'Pitch Dark'} Mode`}
      className={`p-2 rounded-full border transition-all duration-300 flex items-center justify-center ${
        theme === 'dark'
          ? 'bg-[#111111] border-white/15 text-orange-300 hover:text-white hover:border-orange-500/50 shadow-sm'
          : 'bg-white border-black/10 text-amber-600 hover:text-amber-800 hover:border-orange-500/50 shadow-sm'
      } ${className}`}
    >
      {theme === 'dark' ? (
        <Sun className="w-4 h-4 transition-transform duration-300 hover:rotate-45" strokeWidth={1.8} />
      ) : (
        <Moon className="w-4 h-4 transition-transform duration-300 hover:-rotate-12" strokeWidth={1.8} />
      )}
    </button>
  );
}
