'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useClinic } from '../layout/clinic-context';
import { Phone, PhoneOff, Mic, MicOff, X, Volume2, ShieldCheck, Radio } from 'lucide-react';

function cleanSpeechText(text: string, lang: 'mr' | 'hi' | 'en'): string {
  let cleaned = text;

  // Fix currency symbols: ₹500 -> 500 rupees / 500 रुपये
  cleaned = cleaned.replace(/₹\s*([0-9]+)/g, (_, amt) => {
    if (lang === 'mr') return `${amt} रुपये`;
    if (lang === 'hi') return `${amt} रुपये`;
    return `${amt} rupees`;
  });
  cleaned = cleaned.replace(/₹/g, lang === 'en' ? ' rupees ' : ' रुपये ');

  // Fix Dr. abbreviation
  cleaned = cleaned.replace(/Dr\.\s*/gi, lang === 'en' ? 'Doctor ' : 'डॉक्टर ');

  // Clean phone numbers
  cleaned = cleaned.replace(/\+91[- ]?/g, '');

  // Strip parenthetical text
  cleaned = cleaned.replace(/\(([^)]+)\)/g, '$1');

  // Strip formatting symbols
  cleaned = cleaned.replace(/[•*#~_]/g, ' ');

  return cleaned.trim();
}

export function PhoneSimulatorModal() {
  const { isPhoneSimulatorOpen, setIsPhoneSimulatorOpen, activeClinicId, activeClinic, refreshData } = useClinic();
  const [messages, setMessages] = useState<Array<{ speaker: 'ai' | 'user'; text: string; lang?: string }>>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [selectedLang, setSelectedLang] = useState<'en' | 'hi' | 'mr'>('mr'); // Default Marathi
  const [isHandsFree, setIsHandsFree] = useState(true); // Default true for phone call realism
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  const recognitionRef = useRef<any>(null);
  const isHandsFreeRef = useRef(isHandsFree);
  const selectedLangRef = useRef(selectedLang);

  isHandsFreeRef.current = isHandsFree;
  selectedLangRef.current = selectedLang;

  // Load voices
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const updateVoices = () => {
        setAvailableVoices(window.speechSynthesis.getVoices());
      };
      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  // When modal opens or language changes, trigger initial greeting
  useEffect(() => {
    if (isPhoneSimulatorOpen) {
      const clinicName = activeClinic?.name || 'Apollo Dental Clinic';
      let greeting = `नमस्कार! ${clinicName} मध्ये आपले स्वागत आहे. मी आपली काय मदत करू शकतो?`;
      if (selectedLang === 'hi') {
        greeting = `नमस्ते! ${clinicName} में आपका स्वागत है। मैं आपकी क्या सहायता कर सकती हूँ?`;
      } else if (selectedLang === 'en') {
        greeting = `Hello! Thank you for calling ${clinicName}. My name is Maya. How can I assist you today?`;
      }

      setMessages([{ speaker: 'ai', text: greeting, lang: selectedLang }]);

      // Speak greeting and auto-open mic when finished
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        setIsAiSpeaking(true);

        const spokenGreeting = cleanSpeechText(greeting, selectedLang);
        const utter = new SpeechSynthesisUtterance(spokenGreeting);
        utter.rate = 1.04;
        utter.pitch = 1.06;

        const voices = availableVoices.length > 0 ? availableVoices : window.speechSynthesis.getVoices();
        let selectedVoice = null;

        if (selectedLang === 'mr') {
          utter.lang = 'mr-IN';
          selectedVoice =
            voices.find((v) => v.name.toLowerCase().includes('marathi') || v.lang.includes('mr')) ||
            voices.find((v) => v.name.includes('Natural') && (v.lang.includes('hi') || v.name.includes('Swara') || v.name.includes('Madhur'))) ||
            voices.find((v) => v.name.includes('hi') || v.name.includes('Heera')) ||
            voices.find((v) => v.name.includes('en-IN'));
        } else if (selectedLang === 'hi') {
          utter.lang = 'hi-IN';
          selectedVoice =
            voices.find((v) => v.name.includes('Natural') && (v.lang.includes('hi') || v.name.includes('Swara') || v.name.includes('Madhur'))) ||
            voices.find((v) => v.name.includes('hi') || v.name.toLowerCase().includes('hindi') || v.name.includes('Heera')) ||
            voices.find((v) => v.name.includes('en-IN'));
        } else {
          utter.lang = 'en-IN';
          selectedVoice =
            voices.find((v) => v.name.includes('Natural') && (v.lang.includes('en-IN') || v.name.includes('Neerja'))) ||
            voices.find((v) => v.name.includes('en-IN') || v.name.includes('India')) ||
            voices.find((v) => v.lang.startsWith('en'));
        }

        if (selectedVoice) {
          utter.voice = selectedVoice;
        }

        utter.onend = () => {
          setIsAiSpeaking(false);
          if (isHandsFreeRef.current) {
            setTimeout(() => {
              startListening();
            }, 400);
          }
        };

        utter.onerror = () => {
          setIsAiSpeaking(false);
          if (isHandsFreeRef.current) {
            setTimeout(() => {
              startListening();
            }, 400);
          }
        };

        window.speechSynthesis.speak(utter);
      }
    }
  }, [isPhoneSimulatorOpen, selectedLang, activeClinic]);

  // Start Speech Recognition
  const startListening = useCallback(() => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    try {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }

      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      const currentLang = selectedLangRef.current;
      recognition.lang = currentLang === 'mr' ? 'mr-IN' : currentLang === 'hi' ? 'hi-IN' : 'en-IN';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsRecording(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setIsRecording(false);
        handleSpeak(transcript);
      };
      recognition.onerror = () => setIsRecording(false);
      recognition.onend = () => setIsRecording(false);

      recognition.start();
    } catch (err) {
      console.warn('Phone recognition error:', err);
      setIsRecording(false);
    }
  }, []);

  const handleSpeak = (text: string) => {
    if (!text.trim()) return;

    const userMessage = { speaker: 'user' as const, text, lang: selectedLangRef.current };
    setMessages((prev) => [...prev, userMessage]);

    const groqKey = typeof window !== 'undefined' ? localStorage.getItem('CLINIC_GROQ_API_KEY') || undefined : undefined;
    const openaiKey = typeof window !== 'undefined' ? localStorage.getItem('CLINIC_OPENAI_API_KEY') || undefined : undefined;

    fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clinic_id: activeClinicId,
        message: text,
        caller_phone: '+91 98765 43210',
        groq_api_key: groqKey,
        openai_api_key: openaiKey,
        language: selectedLangRef.current,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          const turnLang = data.language || selectedLangRef.current;
          setMessages((prev) => [...prev, { speaker: 'ai', text: data.reply, lang: turnLang }]);

          if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            setIsAiSpeaking(true);

            const spokenText = cleanSpeechText(data.reply, turnLang);
            const utter = new SpeechSynthesisUtterance(spokenText);
            utter.rate = 1.04;
            utter.pitch = 1.06;

            const voices = availableVoices.length > 0 ? availableVoices : window.speechSynthesis.getVoices();
            let selectedVoice = null;

            if (turnLang === 'mr') {
              utter.lang = 'mr-IN';
              selectedVoice =
                voices.find((v) => v.name.toLowerCase().includes('marathi') || v.lang.includes('mr')) ||
                voices.find((v) => v.name.includes('Natural') && (v.lang.includes('hi') || v.name.includes('Swara') || v.name.includes('Madhur'))) ||
                voices.find((v) => v.name.includes('hi') || v.name.includes('Heera')) ||
                voices.find((v) => v.name.includes('en-IN'));
            } else if (turnLang === 'hi') {
              utter.lang = 'hi-IN';
              selectedVoice =
                voices.find((v) => v.name.includes('Natural') && (v.lang.includes('hi') || v.name.includes('Swara') || v.name.includes('Madhur'))) ||
                voices.find((v) => v.name.includes('hi') || v.name.toLowerCase().includes('hindi') || v.name.includes('Heera')) ||
                voices.find((v) => v.name.includes('en-IN'));
            } else {
              utter.lang = 'en-IN';
              selectedVoice =
                voices.find((v) => v.name.includes('Natural') && (v.lang.includes('en-IN') || v.name.includes('Neerja'))) ||
                voices.find((v) => v.name.includes('en-IN') || v.name.includes('India')) ||
                voices.find((v) => v.lang.startsWith('en'));
            }

            if (selectedVoice) {
              utter.voice = selectedVoice;
            }

            // Auto loop back to listening in hands-free mode!
            utter.onend = () => {
              setIsAiSpeaking(false);
              if (isHandsFreeRef.current) {
                setTimeout(() => {
                  startListening();
                }, 400);
              }
            };

            utter.onerror = () => {
              setIsAiSpeaking(false);
              if (isHandsFreeRef.current) {
                setTimeout(() => {
                  startListening();
                }, 400);
              }
            };

            window.speechSynthesis.speak(utter);
          }

          if (data.tool_called === 'book_appointment' || data.tool_called === 'cancel_appointment') {
            refreshData();
          }
        }
      })
      .catch((err) => console.error(err));
  };

  const handleMicClick = () => {
    if (isRecording) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      startListening();
    }
  };

  const handleClose = () => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    if (recognitionRef.current) recognitionRef.current.stop();
    setIsPhoneSimulatorOpen(false);
  };

  if (!isPhoneSimulatorOpen) return null;

  const quickPromptsByLang = {
    en: ['Check slots tomorrow', 'Confirm 4:30 PM', 'What is the fee?', 'Parking available?'],
    hi: ['कल के स्लॉट बताइए', 'कल 4:30 बजे बुक करें', 'डॉक्टर की फीस क्या है?', 'पार्किंग उपलब्ध है?'],
    mr: ['मराठीमध्ये बोला', 'उद्याच्या वेळा सांगा', 'उद्या ४:३० वाजता बुक करा', 'तपासणी शुल्क किती आहे?'],
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="gcore-card border border-white/15 w-full max-w-md rounded-apple-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-scale-in">
        {/* Header */}
        <div className="px-6 py-4 bg-black/90 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-apple bg-gcore-orange/15 border border-gcore-orange/30 flex items-center justify-center text-gcore-orange shadow-gcore-chip">
              <Phone className="w-4 h-4" strokeWidth={2} />
            </div>
            <div>
              <h3 className="font-bold text-white text-[15px] tracking-tight">Live Inbound Phone Simulator</h3>
              <p className="text-xs text-slate-400">Hands-Free Telephony · Sub-250ms</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Toggle */}
            <div className="flex items-center bg-black border border-white/10 rounded-lg p-0.5 text-xs">
              <button
                onClick={() => setSelectedLang('mr')}
                className={`px-2 py-0.5 rounded transition-apple text-[11px] font-medium ${
                  selectedLang === 'mr' ? 'bg-gcore-orange text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                मरा
              </button>
              <button
                onClick={() => setSelectedLang('hi')}
                className={`px-2 py-0.5 rounded transition-apple text-[11px] font-medium ${
                  selectedLang === 'hi' ? 'bg-gcore-orange text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                हिं
              </button>
              <button
                onClick={() => setSelectedLang('en')}
                className={`px-2 py-0.5 rounded transition-apple text-[11px] font-medium ${
                  selectedLang === 'en' ? 'bg-gcore-orange text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                EN
              </button>
            </div>

            <button
              onClick={handleClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-apple ml-1"
            >
              <X className="w-5 h-5" strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {/* Call Active Display Card */}
        <div className="p-6 bg-black/60 flex flex-col items-center text-center border-b border-white/10 relative">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gcore-orange to-amber-600 flex items-center justify-center text-white shadow-gcore-btn live-pulse mb-3">
            <Phone className="w-7 h-7" strokeWidth={2} />
          </div>

          <h4 className="font-bold text-base text-white tracking-tight">{activeClinic?.name || 'Apollo Dental Clinic'}</h4>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            {activeClinic?.phone_number || '+91-80-4567-8901'}
          </p>

          <div className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-mono font-medium text-emerald-300 bg-emerald-950/60 border border-emerald-800/40 px-3 py-1 rounded-full">
            <span className="status-dot bg-emerald-400 animate-pulse"></span>
            {isRecording ? '● Caller Speaking...' : isAiSpeaking ? '● Maya Speaking...' : 'Call Active · Hands-Free'}
          </div>
        </div>

        {/* Messages */}
        <div className="p-4 flex-1 overflow-y-auto space-y-2.5 max-h-56 bg-black/40">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${m.speaker === 'user' ? 'items-end' : 'items-start'} animate-slide-up`}
            >
              <div
                className={`max-w-[85%] rounded-[18px] px-4 py-2.5 text-[13px] ${
                  m.speaker === 'user'
                    ? 'gcore-btn-orange text-white rounded-br-md shadow-sm'
                    : 'bg-[#0E1117] border border-white/10 text-slate-100 rounded-bl-md shadow-sm'
                }`}
              >
                <p className="leading-relaxed font-normal">{m.text}</p>
              </div>
              <span className="text-[10px] text-slate-500 mt-1 px-1">
                {m.speaker === 'user' ? 'Caller' : 'AI Receptionist Maya'}
              </span>
            </div>
          ))}
        </div>

        {/* Quick Click Prompts */}
        <div className="px-4 py-3 bg-black/80 border-t border-white/10">
          <div className="flex flex-wrap gap-1.5">
            {quickPromptsByLang[selectedLang].map((chip) => (
              <button
                key={chip}
                onClick={() => handleSpeak(chip)}
                className="gcore-btn-dark hover:border-gcore-orange/40 text-slate-300 hover:text-white px-3 py-1 text-[11px] font-medium transition-apple"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-black border-t border-white/10 flex gap-2.5">
          <button
            onClick={handleMicClick}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full text-[13px] font-semibold transition-apple ${
              isRecording
                ? 'bg-amber-500 text-white animate-pulse shadow-lg'
                : 'gcore-btn-orange shadow-gcore-btn'
            }`}
          >
            {isRecording ? <MicOff className="w-4 h-4" strokeWidth={2} /> : <Mic className="w-4 h-4" strokeWidth={2} />}
            <span>{isRecording ? 'Listening...' : `Speak in ${selectedLang === 'mr' ? 'मराठी' : selectedLang === 'hi' ? 'हिंदी' : 'English'}`}</span>
          </button>

          <button
            onClick={handleClose}
            className="flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white py-2.5 px-5 rounded-full text-[13px] font-medium transition-apple shadow-sm"
          >
            <PhoneOff className="w-4 h-4" strokeWidth={1.5} />
            <span>End</span>
          </button>
        </div>
      </div>
    </div>
  );
}
