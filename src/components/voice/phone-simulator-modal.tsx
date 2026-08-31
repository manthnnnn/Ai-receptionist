'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useClinic } from '../layout/clinic-context';
import { Phone, PhoneOff, Mic, MicOff, X, Volume2, ShieldCheck, Radio, Send, Sparkles, AlertCircle } from 'lucide-react';

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
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [selectedLang, setSelectedLang] = useState<'en' | 'hi' | 'mr'>('en'); // Default English
  const [isHandsFree, setIsHandsFree] = useState(true);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [currentCallId, setCurrentCallId] = useState<string>('');

  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isHandsFreeRef = useRef(isHandsFree);
  const selectedLangRef = useRef(selectedLang);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  isHandsFreeRef.current = isHandsFree;
  selectedLangRef.current = selectedLang;

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load browser voices
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const updateVoices = () => {
        setAvailableVoices(window.speechSynthesis.getVoices());
      };
      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  // Voice playback engine (Neural TTS + Browser SpeechSynthesis fallback)
  const speakText = useCallback(async (text: string, lang: 'mr' | 'hi' | 'en') => {
    setIsAiSpeaking(true);

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    const spokenText = cleanSpeechText(text, lang);

    // 1. Try Neural TTS API first
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: spokenText, lang }),
      });

      if (res.ok && res.status === 200) {
        const blob = await res.blob();
        if (blob.size > 100) {
          const audioUrl = URL.createObjectURL(blob);
          const audio = new Audio(audioUrl);
          audioRef.current = audio;

          audio.onended = () => {
            setIsAiSpeaking(false);
            URL.revokeObjectURL(audioUrl);
            if (isHandsFreeRef.current) {
              setTimeout(() => startListening(), 400);
            }
          };

          audio.onerror = () => {
            setIsAiSpeaking(false);
            URL.revokeObjectURL(audioUrl);
            fallbackSpeechSynthesis(spokenText, lang);
          };

          await audio.play();
          return;
        }
      }
    } catch (e) {
      console.warn('Neural TTS failed, falling back to browser synthesis:', e);
    }

    // 2. Fallback to Browser SpeechSynthesis
    fallbackSpeechSynthesis(spokenText, lang);
  }, []);

  const fallbackSpeechSynthesis = (spokenText: string, lang: 'mr' | 'hi' | 'en') => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setIsAiSpeaking(false);
      return;
    }

    const utter = new SpeechSynthesisUtterance(spokenText);
    utter.rate = 1.02;
    utter.pitch = 1.02;

    const voices = availableVoices.length > 0 ? availableVoices : window.speechSynthesis.getVoices();
    let selectedVoice = null;

    if (lang === 'mr') {
      utter.lang = 'mr-IN';
      selectedVoice =
        voices.find((v) => v.name.toLowerCase().includes('marathi') || v.lang.includes('mr')) ||
        voices.find((v) => v.name.includes('Natural') && (v.lang.includes('hi') || v.name.includes('Swara'))) ||
        voices.find((v) => v.name.includes('hi') || v.lang.includes('hi')) ||
        voices.find((v) => v.name.includes('en-IN') || v.lang.includes('en-IN'));
    } else if (lang === 'hi') {
      utter.lang = 'hi-IN';
      selectedVoice =
        voices.find((v) => v.name.includes('Natural') && (v.lang.includes('hi') || v.name.includes('Swara'))) ||
        voices.find((v) => v.name.includes('hi') || v.name.toLowerCase().includes('hindi')) ||
        voices.find((v) => v.name.includes('en-IN') || v.lang.includes('en-IN'));
    } else {
      utter.lang = 'en-IN';
      selectedVoice =
        voices.find((v) => v.name.includes('Natural') && (v.lang.includes('en-IN') || v.name.includes('Neerja'))) ||
        voices.find((v) => v.name.includes('en-IN') || v.name.includes('India')) ||
        voices.find((v) => v.lang.startsWith('en'));
    }

    if (selectedVoice) utter.voice = selectedVoice;

    utter.onend = () => {
      setIsAiSpeaking(false);
      if (isHandsFreeRef.current) {
        setTimeout(() => startListening(), 400);
      }
    };

    utter.onerror = () => {
      setIsAiSpeaking(false);
    };

    window.speechSynthesis.speak(utter);
  };

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
        handleSendUtterance(transcript);
      };
      recognition.onerror = () => setIsRecording(false);
      recognition.onend = () => setIsRecording(false);

      recognition.start();
    } catch (err) {
      console.warn('Speech recognition error:', err);
      setIsRecording(false);
    }
  }, []);

  // When modal opens or language changes, trigger initial greeting
  useEffect(() => {
    if (isPhoneSimulatorOpen) {
      const callId = `sim-call-${Date.now()}`;
      setCurrentCallId(callId);

      const clinicName = activeClinic?.name || 'Apollo Dental Clinic';
      let greeting = `Hello! Thank you for calling ${clinicName}. My name is Maya, your AI receptionist. How can I assist you with your appointment or visit today?`;
      if (selectedLang === 'hi') {
        greeting = `नमस्ते! ${clinicName} में आपका स्वागत है। मैं आपकी क्या सहायता कर सकती हूँ?`;
      } else if (selectedLang === 'mr') {
        greeting = `नमस्कार! ${clinicName} मध्ये आपले स्वागत आहे. मी आपली काय मदत करू शकतो?`;
      }

      setMessages([{ speaker: 'ai', text: greeting, lang: selectedLang }]);
      speakText(greeting, selectedLang);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    }
  }, [isPhoneSimulatorOpen, selectedLang, activeClinic]);

  // Send Utterance to AI Orchestrator
  const handleSendUtterance = (text: string) => {
    if (!text.trim()) return;

    const userMessage = { speaker: 'user' as const, text, lang: selectedLangRef.current };
    setMessages((prev) => [...prev, userMessage]);
    setInputText('');

    const groqKey = typeof window !== 'undefined' ? localStorage.getItem('CLINIC_GROQ_API_KEY') || undefined : undefined;
    const openaiKey = typeof window !== 'undefined' ? localStorage.getItem('CLINIC_OPENAI_API_KEY') || undefined : undefined;

    // Convert history format
    const history = messages.map((m) => ({
      role: m.speaker === 'user' ? ('user' as const) : ('assistant' as const),
      content: m.text,
    }));

    fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clinic_id: activeClinicId,
        message: text,
        history,
        caller_phone: '+91 98765 43210',
        call_id: currentCallId,
        groq_api_key: groqKey,
        openai_api_key: openaiKey,
        language: selectedLangRef.current,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.reply) {
          const turnLang = data.language || selectedLangRef.current;
          setMessages((prev) => [...prev, { speaker: 'ai', text: data.reply, lang: turnLang }]);
          speakText(data.reply, turnLang);

          if (data.tool_called === 'book_appointment' || data.tool_called === 'cancel_appointment' || data.tool_called === 'reschedule_appointment') {
            refreshData();
          }
        }
      })
      .catch((err) => console.error('Chat error:', err));
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
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsPhoneSimulatorOpen(false);
  };

  if (!isPhoneSimulatorOpen) return null;

  const quickPromptsByLang = {
    en: [
      'What are your consultation fees?',
      'Check available slots tomorrow',
      'Book Dr. Verma tomorrow at 11:00 AM',
      'Are you open on Saturdays?',
    ],
    hi: [
      'डॉक्टर की फीस क्या है?',
      'कल के स्लॉट बताइए',
      'कल 11:00 बजे डॉक्टर वर्मा के साथ बुक करें',
      'क्या शनिवार को क्लिनिक खुला है?',
    ],
    mr: [
      'तपासणी शुल्क किती आहे?',
      'उद्याच्या वेळा सांगा',
      'उद्या ११:०० वाजता डॉक्टर वर्मांची भेट बुक करा',
      'शनिवारी दवाखाना चालू असतो का?',
    ],
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="gcore-card border border-white/15 w-full max-w-lg rounded-apple-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-scale-in bg-[#080808]">
        {/* Header */}
        <div className="px-6 py-4 bg-black/90 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-apple bg-gcore-orange/15 border border-gcore-orange/30 flex items-center justify-center text-gcore-orange shadow-gcore-chip">
              <Phone className="w-4 h-4" strokeWidth={2} />
            </div>
            <div>
              <h3 className="font-bold text-white text-[15px] tracking-tight">Live Inbound Phone Simulator</h3>
              <p className="text-xs text-neutral-400">PSTN &amp; Web Telephony · Real-Time Conversation</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Selector */}
            <div className="flex items-center bg-black border border-white/10 rounded-lg p-0.5 text-xs">
              <button
                onClick={() => setSelectedLang('en')}
                className={`px-2.5 py-1 rounded transition-apple text-[11px] font-semibold ${
                  selectedLang === 'en' ? 'bg-gcore-orange text-white shadow-xs' : 'text-neutral-400 hover:text-white'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setSelectedLang('hi')}
                className={`px-2.5 py-1 rounded transition-apple text-[11px] font-semibold ${
                  selectedLang === 'hi' ? 'bg-gcore-orange text-white shadow-xs' : 'text-neutral-400 hover:text-white'
                }`}
              >
                हिंदी
              </button>
              <button
                onClick={() => setSelectedLang('mr')}
                className={`px-2.5 py-1 rounded transition-apple text-[11px] font-semibold ${
                  selectedLang === 'mr' ? 'bg-gcore-orange text-white shadow-xs' : 'text-neutral-400 hover:text-white'
                }`}
              >
                मराठी
              </button>
            </div>

            <button
              onClick={handleClose}
              className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-apple ml-1"
            >
              <X className="w-5 h-5" strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {/* Call Active Display Card */}
        <div className="p-5 bg-black/60 flex flex-col items-center text-center border-b border-white/10 relative">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gcore-orange to-amber-600 flex items-center justify-center text-white shadow-gcore-btn mb-2.5">
            <Phone className="w-6 h-6 animate-pulse" strokeWidth={2} />
          </div>

          <h4 className="font-bold text-base text-white tracking-tight">{activeClinic?.name || 'Apollo Dental Clinic'}</h4>
          <p className="text-xs text-neutral-400 font-mono mt-0.5">
            {activeClinic?.phone_number || '+91-80-4567-8901'}
          </p>

          <div className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-mono font-medium text-emerald-300 bg-emerald-950/60 border border-emerald-800/40 px-3 py-1 rounded-full">
            <span className="status-dot bg-emerald-400 animate-pulse"></span>
            {isRecording ? '● Listening to Caller...' : isAiSpeaking ? '● AI Receptionist Speaking...' : 'Call Connected · Speak or Type'}
          </div>
        </div>

        {/* Conversation Dialogue Box */}
        <div className="p-4 flex-1 overflow-y-auto space-y-3 min-h-[220px] max-h-[300px] bg-black/40 text-xs">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${m.speaker === 'user' ? 'items-end' : 'items-start'} animate-slide-up`}
            >
              <div
                className={`max-w-[85%] rounded-[16px] px-4 py-2.5 text-[13px] leading-relaxed ${
                  m.speaker === 'user'
                    ? 'bg-gcore-orange text-white rounded-br-none shadow-sm'
                    : 'bg-[#121212] border border-white/10 text-neutral-100 rounded-bl-none shadow-sm'
                }`}
              >
                <p className="font-normal">{m.text}</p>
              </div>
              <span className="text-[10px] text-neutral-500 mt-1 px-1 font-mono">
                {m.speaker === 'user' ? 'Caller' : 'AI Receptionist Maya'}
              </span>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Click Prompts */}
        <div className="px-4 py-2.5 bg-black/80 border-t border-white/10">
          <div className="text-[11px] text-neutral-400 font-medium mb-1.5 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-gcore-orange" />
            <span>Suggested prompts for testing:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {quickPromptsByLang[selectedLang].map((chip) => (
              <button
                key={chip}
                onClick={() => handleSendUtterance(chip)}
                className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-gcore-orange/50 text-neutral-300 hover:text-white px-2.5 py-1 text-[11px] rounded-apple transition-apple"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>

        {/* Text Input + Mic Bar */}
        <div className="p-3.5 bg-black border-t border-white/10 flex flex-col gap-2.5">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendUtterance(inputText);
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder={isRecording ? 'Listening from your mic...' : `Type a question or speak in ${selectedLang === 'mr' ? 'Marathi' : selectedLang === 'hi' ? 'Hindi' : 'English'}...`}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 bg-[#111] border border-white/15 rounded-full px-4 py-2 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-gcore-orange"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="gcore-btn-orange p-2 rounded-full disabled:opacity-40 shadow-gcore-btn"
              title="Send text"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleMicClick}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full text-xs font-semibold transition-apple ${
                isRecording
                  ? 'bg-amber-500 text-white animate-pulse shadow-lg'
                  : 'gcore-btn-dark border-white/15 hover:border-gcore-orange/60 text-white'
              }`}
            >
              {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-gcore-orange" />}
              <span>{isRecording ? 'Stop Listening' : `Click to Speak (${selectedLang.toUpperCase()})`}</span>
            </button>

            <button
              onClick={handleClose}
              className="flex items-center justify-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white py-2.5 px-6 rounded-full text-xs font-semibold transition-apple shadow-sm"
            >
              <PhoneOff className="w-4 h-4" />
              <span>End Call</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
