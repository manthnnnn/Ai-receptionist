'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useClinic } from '../layout/clinic-context';
import { Phone, PhoneOff, Mic, MicOff, X, Volume2, ShieldCheck, Radio, Send, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';

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
  const [selectedLang, setSelectedLang] = useState<'en' | 'hi' | 'mr'>('en');
  const [isHandsFree, setIsHandsFree] = useState(true); // Default true for continuous auto conversation
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [currentCallId, setCurrentCallId] = useState<string>('');
  const [callDuration, setCallDuration] = useState(0);

  const recognitionRef = useRef<any>(null);
  const isHandsFreeRef = useRef(isHandsFree);
  const selectedLangRef = useRef(selectedLang);
  const isAiSpeakingRef = useRef(isAiSpeaking);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  isHandsFreeRef.current = isHandsFree;
  selectedLangRef.current = selectedLang;
  isAiSpeakingRef.current = isAiSpeaking;

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Call timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPhoneSimulatorOpen) {
      setCallDuration(0);
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPhoneSimulatorOpen]);

  // Load browser voices
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const updateVoices = () => {
        const v = window.speechSynthesis.getVoices();
        setAvailableVoices(v);
      };
      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  // Direct, instant, unblockable speech engine
  const playSpeech = useCallback((text: string, lang: 'mr' | 'hi' | 'en', onDone?: () => void) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setIsAiSpeaking(false);
      if (onDone) onDone();
      return;
    }

    try {
      window.speechSynthesis.cancel();
      window.speechSynthesis.resume();

      setIsAiSpeaking(true);
      const clean = cleanSpeechText(text, lang);
      const utter = new SpeechSynthesisUtterance(clean);
      utter.rate = 1.0;
      utter.pitch = 1.02;
      utter.volume = 1.0;

      const voices = availableVoices.length > 0 ? availableVoices : window.speechSynthesis.getVoices();
      let selectedVoice: SpeechSynthesisVoice | null = null;

      if (lang === 'mr') {
        utter.lang = 'mr-IN';
        selectedVoice =
          voices.find((v) => v.lang === 'mr-IN' || v.name.toLowerCase().includes('marathi')) ||
          voices.find((v) => v.lang.includes('hi') || v.name.toLowerCase().includes('hindi')) ||
          voices.find((v) => v.name.includes('India') || v.lang === 'en-IN') ||
          voices.find((v) => v.lang.startsWith('en')) ||
          null;
      } else if (lang === 'hi') {
        utter.lang = 'hi-IN';
        selectedVoice =
          voices.find((v) => v.lang === 'hi-IN' || v.name.toLowerCase().includes('hindi') || v.name.includes('Swara')) ||
          voices.find((v) => v.lang.includes('hi')) ||
          voices.find((v) => v.name.includes('India') || v.lang === 'en-IN') ||
          voices.find((v) => v.lang.startsWith('en')) ||
          null;
      } else {
        utter.lang = 'en-IN';
        selectedVoice =
          voices.find((v) => v.lang === 'en-IN' || v.name.includes('Neerja') || v.name.includes('India')) ||
          voices.find((v) => v.name.includes('Google') && v.lang.startsWith('en')) ||
          voices.find((v) => v.lang.startsWith('en-US') || v.lang.startsWith('en-GB') || v.lang.startsWith('en')) ||
          null;
      }

      if (selectedVoice) utter.voice = selectedVoice;

      let finished = false;
      const finish = () => {
        if (finished) return;
        finished = true;
        setIsAiSpeaking(false);
        if (onDone) onDone();
      };

      utter.onend = finish;
      utter.onerror = finish;

      // Chrome speech un-pause watchdog
      const watchdog = setInterval(() => {
        if (!window.speechSynthesis.speaking) {
          clearInterval(watchdog);
        } else {
          window.speechSynthesis.pause();
          window.speechSynthesis.resume();
        }
      }, 4000);

      window.speechSynthesis.speak(utter);
      window.speechSynthesis.resume();
    } catch (e) {
      console.warn('SpeechSynthesis error:', e);
      setIsAiSpeaking(false);
      if (onDone) onDone();
    }
  }, [availableVoices]);

  // Automated Hands-Free Speech Recognition Loop
  const startListening = useCallback(() => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }

      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      const currentLang = selectedLangRef.current;
      recognition.lang = currentLang === 'mr' ? 'mr-IN' : currentLang === 'hi' ? 'hi-IN' : 'en-IN';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript;
        setIsRecording(false);
        if (transcript && transcript.trim()) {
          handleSendUtterance(transcript.trim());
        }
      };

      recognition.onerror = (e: any) => {
        setIsRecording(false);
        // If hands-free is enabled and no speech was detected, gracefully auto-restart listening
        if (isHandsFreeRef.current && !isAiSpeakingRef.current && e.error === 'no-speech') {
          setTimeout(() => {
            if (isHandsFreeRef.current && !isAiSpeakingRef.current) {
              startListening();
            }
          }, 600);
        }
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.start();
    } catch (err) {
      console.warn('Recognition start exception:', err);
      setIsRecording(false);
    }
  }, []);

  // When modal opens or language changes, trigger initial greeting and automated listening loop
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

      // Speak greeting, then AUTOMATICALLY start listening hands-free!
      playSpeech(greeting, selectedLang, () => {
        if (isHandsFreeRef.current) {
          setTimeout(() => startListening(), 400);
        }
      });
    } else {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
      setIsRecording(false);
      setIsAiSpeaking(false);
    }
  }, [isPhoneSimulatorOpen, selectedLang, activeClinic, playSpeech, startListening]);

  // Send Utterance to AI Orchestrator & continue hands-free voice loop
  const handleSendUtterance = (text: string) => {
    if (!text.trim()) return;

    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
    }
    setIsRecording(false);

    const userMessage = { speaker: 'user' as const, text, lang: selectedLangRef.current };
    setMessages((prev) => [...prev, userMessage]);
    setInputText('');

    const groqKey = typeof window !== 'undefined' ? localStorage.getItem('CLINIC_GROQ_API_KEY') || undefined : undefined;
    const openaiKey = typeof window !== 'undefined' ? localStorage.getItem('CLINIC_OPENAI_API_KEY') || undefined : undefined;

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

          // AI speaks, then automatically opens the mic for the caller's next turn!
          playSpeech(data.reply, turnLang, () => {
            if (isHandsFreeRef.current) {
              setTimeout(() => startListening(), 400);
            }
          });

          if (data.tool_called === 'book_appointment' || data.tool_called === 'cancel_appointment' || data.tool_called === 'reschedule_appointment') {
            refreshData();
          }
        }
      })
      .catch((err) => {
        console.error('Chat turn error:', err);
      });
  };

  const handleMicToggle = () => {
    if (isRecording) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
      setIsRecording(false);
    } else {
      startListening();
    }
  };

  const handleClose = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
    }
    setIsPhoneSimulatorOpen(false);
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
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
        <div className="px-5 py-3.5 bg-black/90 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-apple bg-gcore-orange/15 border border-gcore-orange/30 flex items-center justify-center text-gcore-orange shadow-gcore-chip">
              <Phone className="w-4 h-4" strokeWidth={2} />
            </div>
            <div>
              <h3 className="font-bold text-white text-[14px] tracking-tight">Live Inbound Phone Simulator</h3>
              <p className="text-[11px] text-neutral-400">Automated Hands-Free Conversation · Call Duration: <span className="font-mono text-white">{formatTimer(callDuration)}</span></p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Hands-Free Auto Mode Toggle */}
            <button
              onClick={() => setIsHandsFree(!isHandsFree)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition-apple flex items-center gap-1.5 ${
                isHandsFree 
                  ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300 shadow-sm' 
                  : 'bg-black border-white/10 text-neutral-400'
              }`}
              title="Automated Hands-Free Voice: AI speaks and automatically listens back without manual clicks"
            >
              <Radio className={`w-3 h-3 ${isHandsFree ? 'animate-pulse text-emerald-400' : 'text-neutral-500'}`} />
              <span>{isHandsFree ? 'Auto Hands-Free ON' : 'Manual Mic'}</span>
            </button>

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

        {/* Call Active Status Display Card */}
        <div className="p-4 bg-black/60 flex flex-col items-center text-center border-b border-white/10 relative">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gcore-orange to-amber-600 flex items-center justify-center text-white shadow-gcore-btn mb-2">
            <Phone className="w-5 h-5 animate-pulse" strokeWidth={2} />
          </div>

          <h4 className="font-bold text-sm text-white tracking-tight">{activeClinic?.name || 'Apollo Dental Clinic'}</h4>
          <p className="text-[11px] text-neutral-400 font-mono">
            {activeClinic?.phone_number || '+91-80-4567-8901'}
          </p>

          <div className="mt-2 inline-flex items-center gap-1.5 text-xs font-mono font-medium px-3 py-1 rounded-full border transition-all duration-300">
            {isAiSpeaking ? (
              <span className="text-amber-300 bg-amber-950/60 border-amber-800/40 px-3 py-0.5 rounded-full flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 animate-pulse text-amber-400" />
                <span>AI Speaking... (Listen)</span>
              </span>
            ) : isRecording ? (
              <span className="text-emerald-300 bg-emerald-950/60 border-emerald-800/40 px-3 py-0.5 rounded-full flex items-center gap-1.5 animate-pulse">
                <span className="status-dot bg-emerald-400"></span>
                <span>Auto-Listening... Speak now!</span>
              </span>
            ) : (
              <span className="text-neutral-400 bg-white/5 border-white/10 px-3 py-0.5 rounded-full flex items-center gap-1.5">
                <span className="status-dot bg-gcore-orange"></span>
                <span>Automated Call Connected</span>
              </span>
            )}
          </div>
        </div>

        {/* Dialogue turns */}
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
                {m.speaker === 'user' ? 'Caller (You)' : 'AI Receptionist Maya'}
              </span>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts */}
        <div className="px-4 py-2.5 bg-black/80 border-t border-white/10">
          <div className="text-[11px] text-neutral-400 font-medium mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-gcore-orange" />
              <span>Tap to ask or speak naturally:</span>
            </span>
            <button
              onClick={() => {
                const latestAiMsg = messages.filter(m => m.speaker === 'ai').pop();
                if (latestAiMsg) playSpeech(latestAiMsg.text, selectedLang);
              }}
              className="text-[10px] text-orange-300 hover:text-white flex items-center gap-1"
              title="Replay last response sound"
            >
              <Volume2 className="w-3 h-3" />
              <span>Replay Voice</span>
            </button>
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

        {/* Input Bar & Call Controls */}
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
              placeholder={isRecording ? 'Listening from your microphone...' : `Type a response or speak hands-free...`}
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

          {/* Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleMicToggle}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full text-xs font-semibold transition-apple ${
                isRecording
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white animate-pulse shadow-lg'
                  : 'gcore-btn-dark border-white/15 hover:border-gcore-orange/60 text-white'
              }`}
            >
              {isRecording ? <Mic className="w-4 h-4 text-white" /> : <MicOff className="w-4 h-4 text-neutral-400" />}
              <span>{isRecording ? '● Auto-Listening (Speak Now)' : 'Click to Enable Mic'}</span>
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
