'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useClinic } from '../layout/clinic-context';
import { Phone, PhoneOff, Mic, MicOff, X, Volume2, ShieldCheck, Radio, Sparkles } from 'lucide-react';
import { detectEmotion, DetectedEmotion } from '@/lib/ai/emotions';

interface Message {
  speaker: 'ai' | 'user';
  text: string;
  lang?: string;
  emotion?: DetectedEmotion;
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

export function PhoneSimulatorModal() {
  const { isPhoneSimulatorOpen, setIsPhoneSimulatorOpen, activeClinicId, activeClinic, refreshData } = useClinic();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState<DetectedEmotion | null>(null);
  const [selectedLang, setSelectedLang] = useState<'en' | 'hi' | 'mr'>('mr'); // Default Marathi
  const [isHandsFree, setIsHandsFree] = useState(true); // Default true for phone call realism
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  const recognitionRef = useRef<any>(null);
  const isHandsFreeRef = useRef(isHandsFree);
  const selectedLangRef = useRef(selectedLang);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

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

  // Neural TTS Audio Player with Browser SpeechSynthesis Fallback
  const speakWithNeuralVoice = useCallback(async (
    text: string,
    lang: 'mr' | 'hi' | 'en',
    emotion: DetectedEmotion,
    onDone: () => void
  ) => {
    if (typeof window === 'undefined') {
      onDone();
      return;
    }

    const cleanText = cleanSpeechText(text, lang);

    // Stop any previously playing audio or speech
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    setIsAiSpeaking(true);

    // TIER 1: Neural Edge TTS Audio from /api/tts (Crystal clear, natural human voice)
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: cleanText, lang }),
      });

      if (res.ok && res.status === 200) {
        const blob = await res.blob();
        if (blob.size > 500) {
          const url = URL.createObjectURL(blob);
          const audio = new Audio(url);
          audioRef.current = audio;

          audio.onended = () => {
            URL.revokeObjectURL(url);
            setIsAiSpeaking(false);
            audioRef.current = null;
            onDone();
          };

          audio.onerror = () => {
            URL.revokeObjectURL(url);
            setIsAiSpeaking(false);
            audioRef.current = null;
            onDone();
          };

          await audio.play();
          return;
        }
      }
    } catch (err) {
      console.warn('Neural TTS API fallback to browser synthesis:', err);
    }

    // TIER 2: Browser SpeechSynthesis with garbage collection fix and wake-up
    if ('speechSynthesis' in window) {
      window.speechSynthesis.resume();
      window.speechSynthesis.cancel();
      await new Promise((r) => setTimeout(r, 60));

      const utter = new SpeechSynthesisUtterance(cleanText);
      utteranceRef.current = utter;
      utter.rate = emotion?.rate || 1.0;
      utter.pitch = emotion?.pitch || 1.0;

      const voices = availableVoices.length > 0 ? availableVoices : window.speechSynthesis.getVoices();
      let selectedVoice = null;

      if (lang === 'mr') {
        utter.lang = 'mr-IN';
        selectedVoice =
          voices.find((v) => v.lang === 'mr-IN' || v.name.toLowerCase().includes('marathi')) ||
          voices.find((v) => v.name.includes('Natural') && (v.lang.includes('hi') || v.name.includes('Swara') || v.name.includes('Madhur'))) ||
          voices.find((v) => v.name.includes('hi') || v.name.includes('Heera')) ||
          voices.find((v) => v.name.includes('en-IN'));
      } else if (lang === 'hi') {
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
        utteranceRef.current = null;
        onDone();
      };

      utter.onerror = () => {
        setIsAiSpeaking(false);
        utteranceRef.current = null;
        onDone();
      };

      window.speechSynthesis.speak(utter);
    } else {
      setIsAiSpeaking(false);
      onDone();
    }
  }, [availableVoices]);

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
      setMessages([{ speaker: 'ai', text: greeting, lang: selectedLang, emotion }]);

      // Speak initial greeting
      speakWithNeuralVoice(greeting, selectedLang, emotion, () => {
        if (isHandsFreeRef.current) {
          setTimeout(() => {
            startListening();
          }, 350);
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
        recognitionRef.current.stop();
      }
      setIsRecording(false);
      setIsAiSpeaking(false);
    }
  }, [isPhoneSimulatorOpen, selectedLang, activeClinic, speakWithNeuralVoice]);

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
          const turnLang = data.language || selectedLangRef.current;
          const emotion = detectEmotion(data.reply);
          setCurrentEmotion(emotion);
          setMessages((prev) => [...prev, { speaker: 'ai', text: data.reply, lang: turnLang, emotion }]);

          // Play AI voice response with neural engine
          speakWithNeuralVoice(data.reply, turnLang, emotion, () => {
            if (isHandsFreeRef.current) {
              setTimeout(() => {
                startListening();
              }, 350);
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
      recognitionRef.current.stop();
    }
    setIsPhoneSimulatorOpen(false);
    setMessages([]);
    setIsRecording(false);
    setIsAiSpeaking(false);
  };

  if (!isPhoneSimulatorOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in text-white">
      <div className="w-full max-w-sm rounded-[36px] bg-[#0A0D14] border border-white/15 shadow-2xl overflow-hidden flex flex-col h-[650px] relative animate-scale-in">
        {/* Dynamic Island / Earpiece Top */}
        <div className="pt-4 pb-2 px-6 flex flex-col items-center bg-black/40 border-b border-white/10 shrink-0">
          <div className="w-20 h-4 bg-black rounded-full mb-3 flex items-center justify-center gap-1.5 border border-white/10">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[8px] font-mono text-emerald-300 font-bold">LIVE CALL</span>
          </div>

          <h3 className="font-bold text-sm tracking-tight text-white">{activeClinic?.name || 'Apollo Dental Clinic'}</h3>
          <p className="text-[11px] font-mono text-orange-300 mt-0.5">{activeClinic?.phone_number || '+91 80 4567 8901'}</p>

          {/* Language Selector in Call */}
          <div className="flex items-center gap-1.5 mt-2.5 bg-black/60 p-1 rounded-full border border-white/10">
            {[
              { id: 'mr', label: 'मराठी' },
              { id: 'hi', label: 'हिंदी' },
              { id: 'en', label: 'English' },
            ].map((l) => (
              <button
                key={l.id}
                onClick={() => setSelectedLang(l.id as any)}
                className={`px-3 py-0.5 text-[10px] font-bold rounded-full transition-apple ${
                  selectedLang === l.id
                    ? 'bg-gcore-orange text-white shadow-xs'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        {/* Emotion Prosody Banner */}
        {currentEmotion && (
          <div className="px-4 py-1.5 bg-orange-500/10 border-b border-orange-500/20 flex items-center justify-center gap-2 text-[11px] text-orange-300 font-medium">
            <Sparkles className="w-3 h-3 text-gcore-orange animate-spin-slow" />
            <span>{currentEmotion.emoji} {currentEmotion.label} ({currentEmotion.pitch}x pitch)</span>
          </div>
        )}

        {/* Live Call Messages Stream */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${m.speaker === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${
                  m.speaker === 'user'
                    ? 'gcore-btn-orange text-white rounded-br-xs'
                    : 'bg-white/10 text-white border border-white/10 rounded-bl-xs'
                }`}
              >
                {m.text}
              </div>
              <span className="text-[9px] text-neutral-400 font-mono mt-0.5 px-1">
                {m.speaker === 'user' ? 'You' : 'Maya (AI Receptionist)'}
              </span>
            </div>
          ))}

          {isAiSpeaking && (
            <div className="flex items-center gap-2 text-xs text-orange-400 font-medium py-1">
              <span className="w-2 h-2 rounded-full bg-gcore-orange animate-ping" />
              <span>Maya is speaking...</span>
            </div>
          )}

          {isRecording && (
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium py-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Listening to you...</span>
            </div>
          )}
        </div>

        {/* Call Controls Footer */}
        <div className="p-4 bg-black/60 border-t border-white/10 shrink-0 space-y-3">
          {/* Hands-Free Toggle */}
          <div className="flex items-center justify-between px-2 text-[11px]">
            <span className="text-neutral-400">Continuous Phone Mode</span>
            <button
              onClick={() => setIsHandsFree(!isHandsFree)}
              className={`px-2 py-0.5 rounded-full font-bold text-[10px] border transition-apple ${
                isHandsFree
                  ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300'
                  : 'bg-neutral-800 border-white/10 text-neutral-400'
              }`}
            >
              {isHandsFree ? 'AUTO SPEECH ON' : 'MANUAL MIC'}
            </button>
          </div>

          {/* Quick Voice Prompt Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-[11px]">
            <button
              onClick={() => handleSpeak(selectedLang === 'mr' ? 'माझा दात खूप दुखतोय, काय करू?' : selectedLang === 'hi' ? 'मेरे दांत में बहुत दर्द है' : 'I have a terrible toothache')}
              className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-300 whitespace-nowrap text-[10px]"
            >
              🦷 {selectedLang === 'mr' ? 'दात दुखतोय' : 'Toothache'}
            </button>
            <button
              onClick={() => handleSpeak(selectedLang === 'mr' ? 'रूट कॅनलची फी किती आहे?' : selectedLang === 'hi' ? 'रूट कैनाल की फीस कितनी है?' : 'What is the root canal cost?')}
              className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-300 whitespace-nowrap text-[10px]"
            >
              💰 {selectedLang === 'mr' ? 'रूट कॅनल फी' : 'Fees'}
            </button>
            <button
              onClick={() => handleSpeak(selectedLang === 'mr' ? 'उद्या दुपारी २ वाजता वेळ मिळेल का?' : selectedLang === 'hi' ? 'कल दोपहर 2 बजे समय मिलेगा?' : 'Book for tomorrow 2 PM')}
              className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-300 whitespace-nowrap text-[10px]"
            >
              📅 {selectedLang === 'mr' ? 'उद्या २ वाजता' : 'Book 2PM'}
            </button>
          </div>

          {/* Action Buttons: Mic & Hang Up */}
          <div className="flex items-center justify-center gap-6 pt-1">
            <button
              onClick={isRecording ? () => recognitionRef.current?.stop() : startListening}
              className={`w-13 h-13 rounded-full flex items-center justify-center transition-apple shadow-lg ${
                isRecording
                  ? 'bg-emerald-500 text-white animate-pulse ring-4 ring-emerald-500/30'
                  : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
              }`}
              title="Push to Speak"
            >
              {isRecording ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6 text-neutral-400" />}
            </button>

            <button
              onClick={handleEndCall}
              className="w-13 h-13 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center transition-apple shadow-lg ring-4 ring-rose-500/30"
              title="End Call"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
