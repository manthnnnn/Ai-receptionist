import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
      },
      letterSpacing: {
        'apple': '-0.03em',
        'tightest': '-0.04em',
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Gcore Electric Amber/Orange Palette
        gcore: {
          50: '#FFF7ED',
          100: '#FFEDD5',
          200: '#FED7AA',
          300: '#FDBA74',
          400: '#FB923C',
          500: '#FF5500', // Gcore signature bright orange
          600: '#EA580C',
          700: '#C2410C',
          800: '#9A3412',
          900: '#7C2D12',
          orange: '#FF5500',
          amber: '#FF8800',
          glow: 'rgba(255, 85, 0, 0.25)',
          glowStrong: 'rgba(255, 120, 0, 0.45)',
          dark: '#07080B',
          darker: '#040507',
          surface: '#0E1117',
          card: 'rgba(14, 17, 23, 0.85)',
          border: 'rgba(255, 255, 255, 0.08)',
          borderHover: 'rgba(255, 120, 0, 0.35)',
        },
        primary: {
          50:  "#FFF7ED",
          100: "#FFEDD5",
          200: "#FED7AA",
          300: "#FDBA74",
          400: "#FB923C",
          500: "#FF5500",
          600: "#EA580C",
          700: "#C2410C",
          800: "#9A3412",
          900: "#7C2D12",
          950: "#431407",
        },
        surface: {
          50:  "#F8FAFC",
          100: "#F1F5F9",
          200: "#E2E8F0",
          300: "#CBD5E1",
          400: "#94A3B8",
          500: "#64748B",
          600: "#475569",
          700: "#334155",
          800: "#1E293B",
          900: "#0E1117",
          950: "#07080B",
        },
      },
      boxShadow: {
        'gcore-btn': '0 0 25px rgba(255, 85, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
        'gcore-card': '0 10px 30px -10px rgba(0, 0, 0, 0.7), 0 0 1px 1px rgba(255, 255, 255, 0.08)',
        'gcore-glow': '0 0 50px -10px rgba(255, 85, 0, 0.35)',
        'gcore-chip': '0 0 30px rgba(255, 100, 0, 0.35), inset 0 0 15px rgba(255, 85, 0, 0.15)',
      },
      borderRadius: {
        'apple': '14px',
        'apple-lg': '20px',
        'apple-xl': '28px',
        'apple-2xl': '36px',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-up': 'slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-in': 'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'wave': 'wave 1.2s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'photon': 'photonTravel 3s linear infinite',
        'glow-pulse': 'glowPulse 3s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.97)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        wave: {
          '0%, 100%': { transform: 'scaleY(0.4)' },
          '50%': { transform: 'scaleY(1.0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        photonTravel: {
          '0%': { strokeDashoffset: '100%' },
          '100%': { strokeDashoffset: '0%' },
        },
        glowPulse: {
          '0%': { opacity: '0.4', filter: 'blur(30px)' },
          '100%': { opacity: '0.85', filter: 'blur(50px)' },
        },
      },
    },
  },
  plugins: [],
};
export default config;
