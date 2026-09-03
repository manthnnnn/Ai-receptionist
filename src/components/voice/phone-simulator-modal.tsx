'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useClinic } from '../layout/clinic-context';
import { 
  PhoneOff, Mic, MicOff, Volume2, VolumeX, Sparkles, 
  Grid, Globe, Info, Clock, CheckCircle2, ChevronDown, Zap
} from 'lucide-react';
import { detectEmotion, DetectedEmotion } from '@/lib/ai/emotions';

interface Message {
  id: string;
  speaker: 'ai' | 'user';
  text: string;
  lang?: string;
  emotion?: DetectedEmotion;
  timestamp: string;
}

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

// Acoustic Echo Detection: Detects if microphone caught laptop speaker sound
function isAcousticEcho(userInput: string, lastAiSpeech: string): boolean {
  if (!userInput || !lastAiSpeech) return false;
  const cleanUser = userInput.toLowerCase().replace(/[^a-z0-9\u0900-\u097F]/g, '');
  const cleanAi = lastAiSpeech.toLowerCase().replace(/[^a-z0-9\u0900-\u097F]/g, '');

  if (cleanUser.length < 3) return false;

  // Substring match
  if (cleanAi.includes(cleanUser) || cleanUser.includes(cleanAi)) return true;

  // Word overlap match
  const userWords = userInput.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
  const aiWords = new Set(lastAiSpeech.toLowerCase().split(/\s+/).filter((w) => w.length > 2));

  if (userWords.length > 0) {
    const matchCount = userWords.filter((w) => aiWords.has(w)).length;
    if (matchCount / userWords.length >= 0.5) return true;
  }

  return false;
}

export function PhoneSimulatorModal() {
  const { isPhoneSimulatorOpen, setIsPhoneSimulatorOpen, activeClinicId, activeClinic, refreshData } = useClinic();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState<DetectedEmotion | null>(null);
  const [selectedLang, setSelectedLang] = useState<'en' | 'hi' | 'mr'>('en'); // Default English
  const [isHandsFree, setIsHandsFree] = useState(true); // Default true: hands-free continuous voice loop
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [showKeypad, setShowKeypad] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  const recognitionRef = useRef<any>(null);
  const isHandsFreeRef = useRef(isHandsFree);
  const selectedLangRef = useRef(selectedLang);
  const isAiSpeakingRef = useRef(isAiSpeaking);
  const lastAiSpeechRef = useRef<string>('');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  isHandsFreeRef.current = isHandsFree;
  selectedLangRef.current = selectedLang;
  isAiSpeakingRef.current = isAiSpeaking;

  // Call duration counter
  useEffect(() => {
    let interval: any;
    if (isPhoneSimulatorOpen) {
      setCallDuration(0);
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPhoneSimulatorOpen]);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAiSpeaking, isRecording]);

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

  // Format call duration MM:SS
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Neural TTS Audio Player with Browser SpeechSynthesis Fallback
  const speakWithNeuralVoice = useCallback(async (
    text: string,
    lang: 'mr' | 'hi' | 'en',
    emotion: DetectedEmotion,
    onDone: () => void
  ) => {
    if (typeof window === 'undefined' || !isSpeakerOn) {
      onDone();
      return;
    }

    const cleanText = cleanSpeechText(text, lang);
    lastAiSpeechRef.current = cleanText;

    // Immediately stop microphone to prevent acoustic loop
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (_) {}
    }
    setIsRecording(false);

    // Stop any previously playing audio or speech
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    setIsAiSpeaking(true);
    isAiSpeakingRef.current = true;

    // TIER 1: Neural Edge TTS Audio from /api/tts with 2s Abort timeout
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: cleanText, lang }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok && res.status === 200) {
        const blob = await res.blob();
        if (blob.size > 500) {
          const url = URL.createObjectURL(blob);
          const audio = new Audio(url);
          audioRef.current = audio;

          audio.onended = () => {
            URL.revokeObjectURL(url);
            setIsAiSpeaking(false);
            isAiSpeakingRef.current = false;
            audioRef.current = null;
            setTimeout(onDone, 600);
          };

          audio.onerror = () => {
            URL.revokeObjectURL(url);
            setIsAiSpeaking(false);
            isAiSpeakingRef.current = false;
            audioRef.current = null;
            onDone();
          };

          try {
            await audio.play();
            return;
          } catch (playErr) {
            console.warn('[TTS] Audio element play rejected by browser autoplay policy, continuing to SpeechSynthesis:', playErr);
          }
        }
      }
    } catch (err) {
      // Fast fallback to browser speech synthesis
    }

    // TIER 2: Browser SpeechSynthesis with accurate Devanagari voice routing
    if ('speechSynthesis' in window) {
      window.speechSynthesis.resume();
      window.speechSynthesis.cancel();
      await new Promise((r) => setTimeout(r, 60));

      const utter = new SpeechSynthesisUtterance(cleanText);
      utteranceRef.current = utter;
      utter.rate = emotion?.rate || 1.0;
      utter.pitch = emotion?.pitch || 1.0;

      const voices = availableVoices.length > 0 ? availableVoices : window.speechSynthesis.getVoices();
      let selectedVoice: SpeechSynthesisVoice | null = null;

      if (lang === 'mr') {
        utter.lang = 'mr-IN';
        selectedVoice =
          voices.find((v) => v.lang === 'mr-IN' || v.lang === 'mr' || v.name.toLowerCase().includes('marathi')) ||
          voices.find((v) => v.name.includes('Natural') && (v.lang.includes('hi') || v.name.includes('Swara') || v.name.includes('Madhur') || v.name.includes('Aarohi'))) ||
          voices.find((v) => v.lang.includes('hi') || v.name.toLowerCase().includes('hindi') || v.name.includes('Heera')) ||
          null;
      } else if (lang === 'hi') {
        utter.lang = 'hi-IN';
        selectedVoice =
          voices.find((v) => v.name.includes('Natural') && (v.lang.includes('hi') || v.name.includes('Swara') || v.name.includes('Madhur'))) ||
          voices.find((v) => v.lang.includes('hi') || v.lang === 'hi-IN' || v.name.toLowerCase().includes('hindi') || v.name.includes('Heera')) ||
          null;
      } else {
        utter.lang = 'en-IN';
        selectedVoice =
          voices.find((v) => v.name.includes('Natural') && (v.lang.includes('en-IN') || v.name.includes('Neerja'))) ||
          voices.find((v) => v.name.includes('en-IN') || v.name.includes('India')) ||
          voices.find((v) => v.lang.startsWith('en')) ||
          null;
      }

      if (selectedVoice) {
        utter.voice = selectedVoice;
      }

      utter.onend = () => {
        setIsAiSpeaking(false);
        isAiSpeakingRef.current = false;
        utteranceRef.current = null;
        setTimeout(onDone, 600);
      };

      utter.onerror = () => {
        setIsAiSpeaking(false);
        isAiSpeakingRef.current = false;
        utteranceRef.current = null;
        onDone();
      };

      window.speechSynthesis.speak(utter);
    } else {
      setIsAiSpeaking(false);
      isAiSpeakingRef.current = false;
      onDone();
    }
  }, [availableVoices, isSpeakerOn]);

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

      const emotion = detectEmotion(greeting);
      setCurrentEmotion(emotion);
      setMessages([
        {
          id: `msg-${Date.now()}`,
          speaker: 'ai',
          text: greeting,
          lang: selectedLang,
          emotion,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);

      // Speak initial greeting
      speakWithNeuralVoice(greeting, selectedLang, emotion, () => {
        if (isHandsFreeRef.current && !isMuted) {
          startListening();
        }
      });
    } else {
      // Clean up audio on modal close
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (_) {}
      }
      setIsRecording(false);
      setIsAiSpeaking(false);
      isAiSpeakingRef.current = false;
    }
  }, [isPhoneSimulatorOpen, selectedLang, activeClinic, speakWithNeuralVoice]);

  // Start Speech Recognition with Acoustic Echo Cancellation
  const startListening = useCallback(() => {
    if (typeof window === 'undefined' || isMuted) return;
    if (isAiSpeakingRef.current) return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (_) {}
      }

      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      const currentLang = selectedLangRef.current;
      recognition.lang = currentLang === 'mr' ? 'mr-IN' : currentLang === 'hi' ? 'hi-IN' : 'en-IN';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsRecording(true);
      recognition.onresult = (event: any) => {
        setIsRecording(false);
        const transcript = event.results[0][0].transcript;

        // ECHO SUPPRESSION: Discard if AI was speaking or transcript matched AI's own words!
        if (isAiSpeakingRef.current || isAcousticEcho(transcript, lastAiSpeechRef.current)) {
          console.warn('[Echo Cancelled] Discarded speaker self-echo transcript:', transcript);
          return;
        }

        handleSpeak(transcript);
      };
      recognition.onerror = () => setIsRecording(false);
      recognition.onend = () => setIsRecording(false);

      recognition.start();
    } catch (err) {
      console.warn('Phone recognition error:', err);
      setIsRecording(false);
    }
  }, [isMuted]);

  const handleSpeak = (text: string) => {
    if (!text.trim()) return;

    // Reject echo
    if (isAcousticEcho(text, lastAiSpeechRef.current)) {
      console.warn('[Echo Cancelled] Ignored prompt matching recent AI speech:', text);
      return;
    }

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      speaker: 'user',
      text,
      lang: selectedLangRef.current,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, userMessage]);

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
        groq_api_key: groqKey,
        openai_api_key: openaiKey,
        language: selectedLangRef.current,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          const turnLang = (data.detected_language || data.language || selectedLangRef.current) as 'en' | 'hi' | 'mr';
          if (turnLang && turnLang !== selectedLangRef.current) {
            console.log(`[Multilingual Voice] Auto mid-call code-switched: ${selectedLangRef.current} -> ${turnLang}`);
            setSelectedLang(turnLang);
            selectedLangRef.current = turnLang;
          }

          const emotion = detectEmotion(data.reply);
          setCurrentEmotion(emotion);
          
          const aiMessage: Message = {
            id: `msg-${Date.now()}-ai`,
            speaker: 'ai',
            text: data.reply,
            lang: turnLang,
            emotion,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
          setMessages((prev) => [...prev, aiMessage]);

          // Play AI voice response with neural engine
          speakWithNeuralVoice(data.reply, turnLang, emotion, () => {
            if (isHandsFreeRef.current && !isMuted) {
              startListening();
            }
          });

          // Refresh appointments if booked
          if (data.call_outcome === 'BOOKED' || data.tool_called === 'book_appointment') {
            refreshData();
          }
        }
      })
      .catch((err) => {
        console.error('Chat error:', err);
        setIsAiSpeaking(false);
        isAiSpeakingRef.current = false;
      });
  };

  const handleEndCall = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (_) {}
    }
    setIsPhoneSimulatorOpen(false);
    setMessages([]);
    setIsRecording(false);
    setIsAiSpeaking(false);
    isAiSpeakingRef.current = false;
  };

  // Cycle language: MR -> HI -> EN -> MR
  const cycleLanguage = () => {
    const nextLang = selectedLang === 'mr' ? 'hi' : selectedLang === 'hi' ? 'en' : 'mr';
    setSelectedLang(nextLang);
  };

  if (!isPhoneSimulatorOpen) return null;

  const clinicInitial = (activeClinic?.name || 'A').charAt(0).toUpperCase();

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-2xl flex items-center justify-center p-3 sm:p-4 animate-fade-in text-white selection:bg-orange-500/30">
      {/* ── iPhone 16 Pro Chassis ── */}
      <div className="w-full max-w-[390px] h-[780px] max-h-[94vh] rounded-[52px] bg-[#07090E] border-[4px] border-[#222733] shadow-[0_25px_70px_rgba(0,0,0,0.9),0_0_50px_rgba(249,115,22,0.15)] overflow-hidden flex flex-col relative animate-scale-in ring-1 ring-white/10">
        
        {/* Top Antenna Bar & Status */}
        <div className="pt-3 px-7 flex items-center justify-between text-[11px] font-medium text-neutral-400 shrink-0 select-none">
          <span className="font-semibold tracking-tight">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          
          {/* Dynamic Island */}
          <div className="h-6 bg-black rounded-full px-3.5 flex items-center gap-2 border border-white/10 shadow-inner">
            <span className={`w-2 h-2 rounded-full ${isAiSpeaking ? 'bg-orange-400 animate-ping' : isRecording ? 'bg-emerald-400 animate-pulse' : 'bg-emerald-500'}`} />
            
            {/* Realtime Waveform in Dynamic Island */}
            {isAiSpeaking ? (
              <div className="flex items-center gap-0.5 h-3">
                <span className="w-0.5 h-3 bg-gcore-orange rounded-full animate-pulse" />
                <span className="w-0.5 h-2 bg-amber-400 rounded-full animate-pulse delay-75" />
                <span className="w-0.5 h-3 bg-gcore-orange rounded-full animate-pulse delay-150" />
              </div>
            ) : isRecording ? (
              <span className="text-[9px] font-mono text-emerald-300 font-bold tracking-wider">LISTENING</span>
            ) : (
              <span className="text-[9px] font-mono text-neutral-300 font-bold">{formatTimer(callDuration)}</span>
            )}
          </div>

          <div className="flex items-center gap-1 text-[10px] font-bold text-neutral-300">
            <span>5G</span>
            <div className="w-4 h-2.5 border border-white/60 rounded-xs p-0.5 flex items-center">
              <div className="h-full w-full bg-white rounded-2xs" />
            </div>
          </div>
        </div>

        {/* ── Caller Profile Header ── */}
        <div className="pt-4 pb-2 px-6 flex flex-col items-center text-center shrink-0">
          <div className="relative mb-2">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-neutral-800 via-[#1A1F2C] to-neutral-900 border-2 border-gcore-orange/60 flex items-center justify-center text-2xl font-black text-white shadow-[0_0_25px_rgba(249,115,22,0.35)]">
              {clinicInitial}
            </div>
            <span className="absolute -bottom-1 -right-1 bg-gcore-orange text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-black uppercase tracking-wider">
              AI
            </span>
          </div>

          <h2 className="text-base font-extrabold text-white tracking-tight leading-tight">
            {activeClinic?.name || 'Apollo Dental Clinic'}
          </h2>
          <p className="text-xs text-orange-300/90 font-mono mt-0.5 flex items-center gap-1">
            <span>Maya Receptionist</span>
            <span>•</span>
            <span className="text-emerald-400 font-bold">{formatTimer(callDuration)}</span>
          </p>

          {/* Emotion Badge Pill */}
          {currentEmotion && (
            <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/5 border border-white/10 text-[11px] font-medium text-orange-200">
              <span className="text-sm">{currentEmotion.emoji}</span>
              <span>{currentEmotion.label}</span>
            </div>
          )}
        </div>

        {/* ── Live In-Call Dialogue Feed (Frosted Glass) ── */}
        <div className="flex-1 px-4 py-2 overflow-y-auto space-y-2.5 no-scrollbar">
          {messages.map((m) => {
            const isUser = m.speaker === 'user';
            return (
              <div
                key={m.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} animate-fade-in`}
              >
                <div
                  className={`max-w-[84%] rounded-[20px] px-3.5 py-2.5 text-[12.5px] leading-relaxed shadow-md backdrop-blur-md ${
                    isUser
                      ? 'bg-gradient-to-r from-gcore-orange to-orange-600 text-white rounded-br-xs font-medium'
                      : 'bg-[#151923]/90 text-slate-100 border border-white/10 rounded-bl-xs'
                  }`}
                >
                  {m.text}
                </div>
                <span className="text-[9px] text-neutral-500 font-mono mt-1 px-1.5">
                  {isUser ? 'You' : 'Maya'} • {m.timestamp}
                </span>
              </div>
            );
          })}

          {isAiSpeaking && (
            <div className="flex items-center gap-2 text-xs text-orange-400 font-medium py-1 px-1">
              <span className="w-2 h-2 rounded-full bg-gcore-orange animate-ping" />
              <span>Maya speaking...</span>
            </div>
          )}

          {isRecording && (
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium py-1 px-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Listening to your voice...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ── Quick Prompt Sliding Sheet (If Toggled) ── */}
        {showKeypad && (
          <div className="px-4 py-2.5 bg-[#0D111A]/95 border-t border-white/10 shrink-0 space-y-2 animate-slide-up">
            <div className="flex items-center justify-between text-[11px] text-neutral-400 font-bold uppercase tracking-wider">
              <span>Quick Voice Queries</span>
              <button onClick={() => setShowKeypad(false)} className="text-neutral-400 hover:text-white">
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              <button
                onClick={() => {
                  handleSpeak(selectedLang === 'mr' ? 'माझा दात खूप दुखतोय, काय करू?' : selectedLang === 'hi' ? 'मेरे दांत में बहुत दर्द है' : 'I have a severe toothache');
                  setShowKeypad(false);
                }}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left text-neutral-200 text-[11px]"
              >
                🦷 {selectedLang === 'mr' ? 'दातदुखी (Toothache)' : selectedLang === 'hi' ? 'दांत दर्द' : 'Toothache Help'}
              </button>
              <button
                onClick={() => {
                  handleSpeak(selectedLang === 'mr' ? 'रूट कॅनलची फी किती आहे?' : selectedLang === 'hi' ? 'रूट कैनाल की फीस कितनी है?' : 'What is the root canal cost?');
                  setShowKeypad(false);
                }}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left text-neutral-200 text-[11px]"
              >
                💰 {selectedLang === 'mr' ? 'रूट कॅनल फी' : selectedLang === 'hi' ? 'रूट कैनाल फीस' : 'Treatment Fees'}
              </button>
              <button
                onClick={() => {
                  handleSpeak(selectedLang === 'mr' ? 'उद्या दुपारी २ वाजता वेळ मिळेल का?' : selectedLang === 'hi' ? 'कल दोपहर 2 बजे समय मिलेगा?' : 'Book appointment tomorrow 2 PM');
                  setShowKeypad(false);
                }}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left text-neutral-200 text-[11px]"
              >
                📅 {selectedLang === 'mr' ? 'उद्या २ वाजता' : selectedLang === 'hi' ? 'कल 2 बजे बुक' : 'Book 2:00 PM'}
              </button>
              <button
                onClick={() => {
                  handleSpeak(selectedLang === 'mr' ? 'क्लिनिकचा पत्ता आणि पार्किंग आहे का?' : selectedLang === 'hi' ? 'क्लिनिक का पता और पार्किंग है?' : 'Clinic address and parking?');
                  setShowKeypad(false);
                }}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left text-neutral-200 text-[11px]"
              >
                📍 {selectedLang === 'mr' ? 'पत्ता व पार्किंग' : selectedLang === 'hi' ? 'पता व पार्किंग' : 'Address & Parking'}
              </button>
            </div>
          </div>
        )}

        {/* ── iOS 18 In-Call Grid Actions (6 Frosted Circles) ── */}
        <div className="pt-2 pb-6 px-6 bg-gradient-to-t from-black via-black/80 to-transparent shrink-0 space-y-4">
          <div className="grid grid-cols-3 gap-y-3 gap-x-4 max-w-[280px] mx-auto text-center">
            
            {/* 1. Mute */}
            <div className="flex flex-col items-center gap-1">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                  isMuted
                    ? 'bg-white text-black shadow-lg ring-2 ring-white/50'
                    : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
                }`}
              >
                {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </button>
              <span className="text-[10px] font-medium text-neutral-400">{isMuted ? 'Unmute' : 'Mute'}</span>
            </div>

            {/* 2. Keypad / Quick Queries */}
            <div className="flex flex-col items-center gap-1">
              <button
                onClick={() => setShowKeypad(!showKeypad)}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                  showKeypad
                    ? 'bg-white text-black shadow-lg ring-2 ring-white/50'
                    : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
                }`}
              >
                <Grid className="w-6 h-6" />
              </button>
              <span className="text-[10px] font-medium text-neutral-400">Keypad</span>
            </div>

            {/* 3. Speaker */}
            <div className="flex flex-col items-center gap-1">
              <button
                onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                  isSpeakerOn
                    ? 'bg-white text-black shadow-lg ring-2 ring-white/50'
                    : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
                }`}
              >
                {isSpeakerOn ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
              </button>
              <span className="text-[10px] font-medium text-neutral-400">Speaker</span>
            </div>

            {/* 4. Language Switcher (MR / HI / EN) */}
            <div className="flex flex-col items-center gap-1">
              <button
                onClick={cycleLanguage}
                className="w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-white flex flex-col items-center justify-center transition-all font-bold text-xs"
              >
                <Globe className="w-5 h-5 mb-0.5 text-gcore-orange" />
                <span className="text-[10px] font-mono uppercase">{selectedLang}</span>
              </button>
              <span className="text-[10px] font-medium text-neutral-400">
                {selectedLang === 'mr' ? 'मराठी' : selectedLang === 'hi' ? 'हिंदी' : 'English'}
              </span>
            </div>

            {/* 5. Auto Speech / Push-to-Talk Toggle */}
            <div className="flex flex-col items-center gap-1">
              <button
                onClick={() => setIsHandsFree(!isHandsFree)}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                  isHandsFree
                    ? 'bg-emerald-500 text-white shadow-lg ring-2 ring-emerald-400/50'
                    : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
                }`}
              >
                <Zap className="w-6 h-6" />
              </button>
              <span className="text-[10px] font-medium text-neutral-400">
                {isHandsFree ? 'Auto-Voice' : 'Manual Mic'}
              </span>
            </div>

            {/* 6. Push-To-Speak Mic Trigger */}
            <div className="flex flex-col items-center gap-1">
              <button
                onClick={isRecording ? () => { try { recognitionRef.current?.abort(); } catch(_) {}; setIsRecording(false); } : startListening}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                  isRecording
                    ? 'bg-emerald-500 text-white animate-pulse ring-4 ring-emerald-500/40 shadow-lg'
                    : 'bg-gcore-orange text-white hover:bg-orange-600 shadow-md shadow-orange-500/20'
                }`}
                title="Click to Speak"
              >
                <Mic className="w-6 h-6" />
              </button>
              <span className="text-[10px] font-bold text-orange-300">
                {isRecording ? 'Listening...' : 'Push to Talk'}
              </span>
            </div>
          </div>

          {/* ── Big Red Circular iOS "End Call" Button ── */}
          <div className="flex justify-center pt-1">
            <button
              onClick={handleEndCall}
              className="w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-700 active:scale-95 text-white flex items-center justify-center shadow-[0_10px_25px_rgba(225,29,72,0.5)] transition-all ring-4 ring-rose-500/30"
              title="End Call"
            >
              <PhoneOff className="w-7 h-7" />
            </button>
          </div>

          {/* Home Bar Indicator */}
          <div className="w-32 h-1 bg-white/20 rounded-full mx-auto" />
        </div>
      </div>
    </div>
  );
}
