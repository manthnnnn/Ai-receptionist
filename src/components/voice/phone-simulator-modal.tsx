'use client';

import React, { useState, useEffect } from 'react';
import { useClinic } from '../layout/clinic-context';
import { Phone, PhoneOff, Mic, MicOff, X, CheckCircle2 } from 'lucide-react';

function cleanSpeechText(text: string, lang: 'mr' | 'hi' | 'en'): string {
  let cleaned = text;
  cleaned = cleaned.replace(/₹\s*([0-9]+)/g, (_, amt) => {
    if (lang === 'mr') return `${amt} रुपये`;
    if (lang === 'hi') return `${amt} रुपये`;
    return `${amt} rupees`;
  });
  cleaned = cleaned.replace(/₹/g, lang === 'en' ? ' rupees ' : ' रुपये ');
  cleaned = cleaned.replace(/Dr\.\s*/gi, lang === 'en' ? 'Doctor ' : 'डॉक्टर ');
  cleaned = cleaned.replace(/\+91[- ]?/g, '');
  cleaned = cleaned.replace(/\(([^)]+)\)/g, '$1');
  cleaned = cleaned.replace(/[•*#~_]/g, ' ');
  return cleaned.trim();
}

export function PhoneSimulatorModal() {
  const { isPhoneSimulatorOpen, setIsPhoneSimulatorOpen, activeClinicId, activeClinic, refreshData } = useClinic();
  const [isRecording, setIsRecording] = useState(false);
  const [selectedLang, setSelectedLang] = useState<'en' | 'hi' | 'mr'>('en');
  const [messages, setMessages] = useState<Array<{ speaker: 'ai' | 'user'; text: string; lang?: string }>>([
    {
      speaker: 'ai',
      text: `Hello! Thank you for calling ${activeClinic?.name || 'Apollo Dental Clinic'}. How can I help you today?`,
    },
  ]);

  // Update initial greeting when language changes
  useEffect(() => {
    const clinicName = activeClinic?.name || 'Apollo Dental Clinic';
    let text = `Hello! Thank you for calling ${clinicName}. How can I help you today?`;
    if (selectedLang === 'mr') {
      text = `नमस्कार! ${clinicName} मध्ये आपले स्वागत आहे. मी आपली काय मदत करू?`;
    } else if (selectedLang === 'hi') {
      text = `नमस्ते! ${clinicName} में आपका स्वागत है। मैं आपकी क्या सहायता कर सकता हूँ?`;
    }
    setMessages([{ speaker: 'ai', text, lang: selectedLang }]);
  }, [selectedLang, activeClinic]);

  const handleSpeak = (text: string) => {
    if (!text.trim()) return;

    setMessages((prev) => [...prev, { speaker: 'user', text, lang: selectedLang }]);

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
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          const turnLang = data.language || selectedLang;
          setMessages((prev) => [...prev, { speaker: 'ai', text: data.reply, lang: turnLang }]);

          if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const spokenText = cleanSpeechText(data.reply, turnLang);
            const utter = new SpeechSynthesisUtterance(spokenText);
            utter.rate = 1.06;
            utter.pitch = 1.04;

            const voices = window.speechSynthesis.getVoices();
            let selectedVoice = null;

            if (turnLang === 'mr') {
              utter.lang = 'mr-IN';
              selectedVoice =
                voices.find((v) => v.name.toLowerCase().includes('marathi') || v.lang.includes('mr')) ||
                voices.find((v) => v.name.includes('Natural') && (v.lang.includes('hi') || v.name.includes('Swara') || v.name.includes('Madhur'))) ||
                voices.find((v) => v.name.includes('Natural') && (v.lang.includes('en-IN') || v.name.includes('Neerja'))) ||
                voices.find((v) => v.lang.includes('hi') || v.name.includes('Heera')) ||
                voices.find((v) => v.lang.includes('en-IN') || v.name.includes('India') || v.name.includes('Neerja'));
            } else if (turnLang === 'hi') {
              utter.lang = 'hi-IN';
              selectedVoice =
                voices.find((v) => v.name.includes('Natural') && (v.lang.includes('hi') || v.name.includes('Swara') || v.name.includes('Madhur'))) ||
                voices.find((v) => v.lang.includes('hi') || v.name.toLowerCase().includes('hindi') || v.name.includes('Heera')) ||
                voices.find((v) => v.name.includes('Natural') && v.lang.includes('en-IN')) ||
                voices.find((v) => v.lang.includes('en-IN') || v.name.includes('India') || v.name.includes('Neerja'));
            } else {
              utter.lang = 'en-IN';
              selectedVoice =
                voices.find((v) => v.name.includes('Natural') && (v.lang.includes('en-IN') || v.name.includes('Neerja') || v.name.includes('Prabhat'))) ||
                voices.find((v) => v.lang.includes('en-IN') || v.name.includes('India') || v.name.includes('Neerja') || v.name.includes('Ravi')) ||
                voices.find((v) => v.lang.startsWith('en'));
            }

            if (selectedVoice) {
              utter.voice = selectedVoice;
            }

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
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.lang = selectedLang === 'mr' ? 'mr-IN' : selectedLang === 'hi' ? 'hi-IN' : 'en-IN';
      rec.onstart = () => setIsRecording(true);
      rec.onresult = (e: any) => {
        setIsRecording(false);
        const transcript = e.results[0][0].transcript;
        handleSpeak(transcript);
      };
      rec.onerror = () => setIsRecording(false);
      rec.onend = () => setIsRecording(false);
      rec.start();
    } else {
      setIsRecording(true);
      setTimeout(() => {
        setIsRecording(false);
        const fallback =
          selectedLang === 'mr'
            ? 'उद्या ४:३० वाजता भेट निश्चित करा'
            : selectedLang === 'hi'
            ? 'कल 4:30 बजे का समय बुक करें'
            : 'I would like to confirm my 4:30 PM slot tomorrow';
        handleSpeak(fallback);
      }, 1500);
    }
  };

  if (!isPhoneSimulatorOpen) return null;

  const quickPromptsByLang = {
    en: ['Check slots tomorrow', 'Confirm 4:30 PM', 'What is the fee?', 'Parking available?'],
    hi: ['कल के स्लॉट बताइए', 'कल 4:30 बजे बुक करें', 'डॉक्टर की फीस क्या है?', 'पार्किंग उपलब्ध है?'],
    mr: ['उद्याच्या वेळा सांगा', 'उद्या ४:३० वाजता बुक करा', 'तपासणी शुल्क किती आहे?', 'गाडी पार्किंग आहे का?'],
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white border border-slate-200/90 w-full max-w-md rounded-apple-xl shadow-modal overflow-hidden flex flex-col max-h-[92vh] animate-scale-in">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50/90 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-apple bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-600 shadow-xs">
              <Phone className="w-4 h-4" strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-[15px] tracking-apple">Inbound Phone Call</h3>
              <p className="text-xs text-slate-500">PSTN · Multilingual AI</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Toggle */}
            <div className="flex items-center bg-slate-100 border border-slate-200 rounded-lg p-0.5 text-xs">
              <button
                onClick={() => setSelectedLang('en')}
                className={`px-2 py-0.5 rounded transition-apple text-[11px] font-medium ${
                  selectedLang === 'en' ? 'bg-white text-primary-600 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setSelectedLang('hi')}
                className={`px-2 py-0.5 rounded transition-apple text-[11px] font-medium ${
                  selectedLang === 'hi' ? 'bg-white text-primary-600 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                हिं
              </button>
              <button
                onClick={() => setSelectedLang('mr')}
                className={`px-2 py-0.5 rounded transition-apple text-[11px] font-medium ${
                  selectedLang === 'mr' ? 'bg-white text-primary-600 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                मरा
              </button>
            </div>

            <button
              onClick={() => setIsPhoneSimulatorOpen(false)}
              className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-apple ml-1"
            >
              <X className="w-5 h-5" strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {/* Call Card */}
        <div className="p-6 bg-slate-50/70 flex flex-col items-center text-center border-b border-slate-200">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white shadow-md live-pulse mb-3">
            <Phone className="w-7 h-7" strokeWidth={1.5} />
          </div>

          <h4 className="font-semibold text-base text-slate-900 tracking-apple">{activeClinic?.name || 'Apollo Dental Clinic'}</h4>
          <p className="text-xs text-slate-500 font-mono mt-0.5">
            {activeClinic?.phone_number || '+91-80-4567-8901'}
          </p>

          <div className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full shadow-xs">
            <span className="status-dot bg-emerald-500"></span>
            Connected · AI Speaking in {selectedLang === 'mr' ? 'मराठी' : selectedLang === 'hi' ? 'हिंदी' : 'English'}
          </div>
        </div>

        {/* Messages */}
        <div className="p-4 flex-1 overflow-y-auto space-y-2.5 max-h-56 bg-slate-50/30">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${m.speaker === 'user' ? 'items-end' : 'items-start'} animate-slide-up`}
            >
              <div
                className={`max-w-[85%] rounded-[18px] px-4 py-2.5 text-[13px] ${
                  m.speaker === 'user'
                    ? 'bg-primary-500 text-white rounded-br-md shadow-xs'
                    : 'bg-white text-slate-800 border border-slate-200/90 rounded-bl-md shadow-xs'
                }`}
              >
                <p className="leading-relaxed">{m.text}</p>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 px-1">
                {m.speaker === 'user' ? 'Caller' : 'AI Receptionist'}
              </span>
            </div>
          ))}
        </div>

        {/* Quick Replies */}
        <div className="px-4 py-3 bg-slate-50/80 border-t border-slate-200">
          <div className="flex flex-wrap gap-1.5">
            {quickPromptsByLang[selectedLang].map((chip) => (
              <button
                key={chip}
                onClick={() => handleSpeak(chip)}
                className="bg-white hover:bg-primary-50 text-slate-700 hover:text-primary-600 border border-slate-200 hover:border-primary-300 rounded-full px-3 py-1 text-[11px] font-medium transition-apple shadow-xs"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-2.5">
          <button
            onClick={handleMicClick}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-apple text-[13px] font-medium transition-apple shadow-sm ${
              isRecording
                ? 'bg-amber-500 text-white animate-pulse'
                : 'bg-primary-500 hover:bg-primary-600 text-white'
            }`}
          >
            {isRecording ? <MicOff className="w-4 h-4" strokeWidth={1.5} /> : <Mic className="w-4 h-4" strokeWidth={1.5} />}
            <span>{isRecording ? 'Listening...' : `Speak in ${selectedLang === 'mr' ? 'मराठी' : selectedLang === 'hi' ? 'हिंदी' : 'English'}`}</span>
          </button>

          <button
            onClick={() => setIsPhoneSimulatorOpen(false)}
            className="flex items-center justify-center gap-2 bg-rose-500 hover:bg-rose-600 text-white py-2.5 px-5 rounded-apple text-[13px] font-medium transition-apple shadow-sm"
          >
            <PhoneOff className="w-4 h-4" strokeWidth={1.5} />
            <span>End</span>
          </button>
        </div>
      </div>
    </div>
  );
}
