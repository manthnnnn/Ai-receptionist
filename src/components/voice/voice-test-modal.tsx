'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useClinic } from '../layout/clinic-context';
import { Mic, MicOff, X, Zap, Volume2, Bot, User, CheckCircle2, Globe } from 'lucide-react';

interface DialogTurn {
  id: string;
  speaker: 'caller' | 'ai';
  text: string;
  latency_ms?: number;
  lang?: string;
}

// Clean text for natural speech synthesis (prevent TTS from reading "Indian rupee sign")
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

  // Clean phone numbers: remove +91- prefix so it reads naturally
  cleaned = cleaned.replace(/\+91[- ]?/g, '');

  // Strip parenthetical text like (RCT), (Scaling) that TTS reads awkwardly
  cleaned = cleaned.replace(/\(([^)]+)\)/g, '$1');

  // Strip formatting symbols
  cleaned = cleaned.replace(/[•*#~_]/g, ' ');

  return cleaned.trim();
}

export function VoiceTestModal() {
  const { isVoiceTesterOpen, setIsVoiceTesterOpen, activeClinicId, activeClinic, refreshData } = useClinic();
  const [isRecording, setIsRecording] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [selectedLang, setSelectedLang] = useState<'en' | 'hi' | 'mr'>('en');
  const [dialog, setDialog] = useState<DialogTurn[]>([
    {
      id: 'init',
      speaker: 'ai',
      text: `Hello! Thank you for calling ${activeClinic?.name || 'Apollo Dental Clinic'}. How can I assist you today?`,
    },
  ]);
  const [statusText, setStatusText] = useState('Ready');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const recognitionRef = useRef<any>(null);

  // Update initial greeting when language changes
  useEffect(() => {
    const clinicName = activeClinic?.name || 'Apollo Dental Clinic';
    let text = `Hello! Thank you for calling ${clinicName}. How can I assist you today?`;
    if (selectedLang === 'mr') {
      text = `नमस्कार! ${clinicName} मध्ये आपले स्वागत आहे. मी आपली काय मदत करू?`;
    } else if (selectedLang === 'hi') {
      text = `नमस्ते! ${clinicName} में आपका स्वागत है। मैं आपकी क्या सहायता कर सकता हूँ?`;
    }
    setDialog([
      {
        id: `init-${selectedLang}`,
        speaker: 'ai',
        text,
      },
    ]);
  }, [selectedLang, activeClinic]);

  // Waveform renderer
  useEffect(() => {
    let animationId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const bars = 40;
      const barWidth = canvas.width / bars - 2;

      for (let i = 0; i < bars; i++) {
        let height = 3;
        if (isRecording) {
          height = Math.sin(Date.now() / 150 + i * 0.4) * 16 + 20 + Math.random() * 6;
        } else if (isAiSpeaking) {
          height = Math.sin(Date.now() / 100 + i * 0.6) * 12 + 16 + Math.random() * 5;
        }

        const x = i * (barWidth + 2);
        const y = (canvas.height - height) / 2;
        const radius = barWidth / 2;

        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, height, radius);

        if (isRecording) {
          ctx.fillStyle = `rgba(59, 130, 246, ${0.4 + Math.sin(Date.now() / 200 + i) * 0.3})`;
        } else if (isAiSpeaking) {
          ctx.fillStyle = `rgba(34, 197, 94, ${0.4 + Math.sin(Date.now() / 200 + i) * 0.3})`;
        } else {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        }
        ctx.fill();
      }
      animationId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationId);
  }, [isRecording, isAiSpeaking]);

  const sendTurn = async (userText: string) => {
    if (!userText.trim()) return;

    const userTurn: DialogTurn = { id: `usr-${Date.now()}`, speaker: 'caller', text: userText };
    setDialog((prev) => [...prev, userTurn]);
    setStatusText('AI processing...');

    try {
      const groqKey = typeof window !== 'undefined' ? localStorage.getItem('CLINIC_GROQ_API_KEY') || undefined : undefined;
      const openaiKey = typeof window !== 'undefined' ? localStorage.getItem('CLINIC_OPENAI_API_KEY') || undefined : undefined;

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clinic_id: activeClinicId,
          message: userText,
          caller_phone: '+91 98765 43210',
          groq_api_key: groqKey,
          openai_api_key: openaiKey,
        }),
      });
      const data = await res.json();

      if (data.success) {
        const turnLang = data.language || selectedLang;
        const aiTurn: DialogTurn = {
          id: `ai-${Date.now()}`,
          speaker: 'ai',
          text: data.reply,
          latency_ms: data.latency_ms || 575,
          lang: turnLang,
        };
        setDialog((prev) => [...prev, aiTurn]);
        setStatusText('Ready');

        // Play synthetic speech with speech-cleaned text & native voice
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          setIsAiSpeaking(true);

          const spokenText = cleanSpeechText(data.reply, turnLang);
          const utter = new SpeechSynthesisUtterance(spokenText);
          utter.rate = 0.95;
          utter.pitch = 1.0;

          const voices = window.speechSynthesis.getVoices();
          let selectedVoice = null;

          if (turnLang === 'mr') {
            utter.lang = 'mr-IN';
            selectedVoice =
              voices.find((v) => v.lang.includes('mr') || v.name.toLowerCase().includes('marathi')) ||
              voices.find((v) => v.lang.includes('hi') || v.name.toLowerCase().includes('hindi') || v.name.includes('Heera')) ||
              voices.find((v) => v.lang.includes('en-IN') || v.name.includes('India') || v.name.includes('Neerja') || v.name.includes('Ravi'));
          } else if (turnLang === 'hi') {
            utter.lang = 'hi-IN';
            selectedVoice =
              voices.find((v) => v.lang.includes('hi') || v.name.toLowerCase().includes('hindi') || v.name.includes('Heera')) ||
              voices.find((v) => v.lang.includes('en-IN') || v.name.includes('India') || v.name.includes('Neerja'));
          } else {
            utter.lang = 'en-IN';
            selectedVoice =
              voices.find((v) => v.lang.includes('en-IN') || v.name.includes('India') || v.name.includes('Neerja') || v.name.includes('Ravi')) ||
              voices.find((v) => v.lang.startsWith('en'));
          }

          if (selectedVoice) {
            utter.voice = selectedVoice;
          }

          utter.onend = () => setIsAiSpeaking(false);
          utter.onerror = () => setIsAiSpeaking(false);
          window.speechSynthesis.speak(utter);
        }

        if (data.tool_called === 'book_appointment' || data.tool_called === 'cancel_appointment') {
          refreshData();
        }
      }
    } catch (err) {
      console.error('AI chat error:', err);
      setStatusText('Error');
    }
  };

  const handleToggleMic = () => {
    if (isRecording) {
      setIsRecording(false);
      setStatusText('Processing...');
      if (recognitionRef.current) recognitionRef.current.stop();
    } else {
      setIsRecording(true);
      setStatusText(selectedLang === 'mr' ? 'ऐकत आहे...' : selectedLang === 'hi' ? 'सुन रहा हूँ...' : 'Listening...');

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.lang = selectedLang === 'mr' ? 'mr-IN' : selectedLang === 'hi' ? 'hi-IN' : 'en-IN';
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setIsRecording(false);
          sendTurn(transcript);
        };
        recognition.onerror = () => { setIsRecording(false); setStatusText('Ready'); };
        recognition.onend = () => setIsRecording(false);
        recognition.start();
      } else {
        setTimeout(() => {
          setIsRecording(false);
          const fallback =
            selectedLang === 'mr'
              ? 'डॉक्टरांची फी किती आहे?'
              : selectedLang === 'hi'
              ? 'डॉक्टर की फीस कितनी है?'
              : 'What is the consultation fee for dental doctors?';
          sendTurn(fallback);
        }, 2000);
      }
    }
  };

  if (!isVoiceTesterOpen) return null;

  const quickPromptsByLang = {
    en: [
      'Check Dr. Verma tomorrow',
      'Book 4:30 PM slot',
      'What is the fee?',
      'Is parking available?',
      'Severe chest pain',
    ],
    hi: [
      'कल डॉक्टर का समय बताइए',
      'कल 4:30 बजे की अपॉइंटमेंट बुक करें',
      'डॉक्टर की फीस कितनी है?',
      'क्या क्लिनिक में पार्किंग है?',
      'सीने में बहुत दर्द है',
    ],
    mr: [
      'उद्या डॉक्टर वर्मांची वेळ आहे का?',
      'उद्या ४:३० वाजता भेट निश्चित करा',
      'क्लिनिकची फी किती आहे?',
      'पार्किंगची सोय आहे का?',
      'छातीत खूप दुखत आहे',
    ],
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-surface-900 w-full max-w-2xl rounded-apple-xl shadow-modal overflow-hidden flex flex-col max-h-[90vh] animate-scale-in">
        {/* Header */}
        <div className="px-6 py-4 bg-surface-950 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-apple bg-primary-500/15 border border-primary-500/20 flex items-center justify-center text-primary-400">
              <Mic className="w-4 h-4" strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="font-semibold text-white text-[15px] tracking-apple">Multilingual Voice Console</h3>
              <p className="text-xs text-surface-400">English · हिंदी · मराठी Clean Voice</p>
            </div>
          </div>

          {/* Language Selector */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-white/5 border border-white/10 rounded-lg p-0.5 text-xs">
              <button
                onClick={() => setSelectedLang('en')}
                className={`px-2.5 py-1 rounded-md transition-apple font-medium ${
                  selectedLang === 'en' ? 'bg-primary-500 text-white shadow-sm' : 'text-surface-400 hover:text-white'
                }`}
              >
                English
              </button>
              <button
                onClick={() => setSelectedLang('hi')}
                className={`px-2.5 py-1 rounded-md transition-apple font-medium ${
                  selectedLang === 'hi' ? 'bg-primary-500 text-white shadow-sm' : 'text-surface-400 hover:text-white'
                }`}
              >
                हिंदी
              </button>
              <button
                onClick={() => setSelectedLang('mr')}
                className={`px-2.5 py-1 rounded-md transition-apple font-medium ${
                  selectedLang === 'mr' ? 'bg-primary-500 text-white shadow-sm' : 'text-surface-400 hover:text-white'
                }`}
              >
                मराठी
              </button>
            </div>

            <button
              onClick={() => setIsVoiceTesterOpen(false)}
              className="text-surface-400 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-apple ml-2"
            >
              <X className="w-5 h-5" strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {/* Waveform */}
        <div className="p-4 bg-surface-950/60 border-b border-white/5">
          <div className="bg-surface-950 border border-white/5 rounded-apple-lg p-3 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-surface-400 font-medium">
                <Volume2 className="w-3.5 h-3.5 text-primary-400" strokeWidth={1.5} />
                Live Audio Stream ({selectedLang === 'mr' ? 'Marathi' : selectedLang === 'hi' ? 'Hindi' : 'English'})
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                isRecording ? 'bg-primary-500/15 text-primary-300 border border-primary-500/20' :
                isAiSpeaking ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20' :
                'bg-white/5 text-surface-400 border border-white/10'
              }`}>
                {isRecording ? '● Listening' : isAiSpeaking ? '● Speaking' : statusText}
              </span>
            </div>
            <canvas ref={canvasRef} width={560} height={44} className="w-full h-11 rounded" />
          </div>
        </div>

        {/* Latency Bar */}
        <div className="px-6 py-2 bg-surface-950/40 border-b border-white/5 flex items-center justify-between text-xs text-surface-400 font-medium">
          <span className="flex items-center gap-1.5">
            <Zap className="w-3 h-3 text-primary-400" strokeWidth={1.5} />
            Conversation Dialogue
          </span>
          <span className="text-[11px] font-mono text-surface-500">
            Auto-Detect: English · हिंदी · मराठी | Sub-600ms
          </span>
        </div>

        {/* Dialog */}
        <div className="p-5 flex-1 overflow-y-auto space-y-3 max-h-72">
          {dialog.map((turn) => (
            <div
              key={turn.id}
              className={`flex flex-col ${turn.speaker === 'caller' ? 'items-end' : 'items-start'} animate-slide-up`}
            >
              <div
                className={`max-w-[82%] rounded-[18px] px-4 py-2.5 text-[13px] ${
                  turn.speaker === 'caller'
                    ? 'bg-primary-500 text-white rounded-br-md'
                    : 'bg-surface-800 text-surface-100 rounded-bl-md'
                }`}
              >
                <p className="leading-relaxed">{turn.text}</p>
                {turn.latency_ms && (
                  <div className="mt-1 text-[10px] opacity-60 font-mono flex items-center gap-1">
                    <CheckCircle2 className="w-2.5 h-2.5" strokeWidth={1.5} />
                    {turn.latency_ms}ms
                  </div>
                )}
              </div>
              <span className="text-[10px] text-surface-500 mt-1 px-1">
                {turn.speaker === 'caller' ? 'Caller' : 'AI Receptionist'}
              </span>
            </div>
          ))}
        </div>

        {/* Quick Prompts by Language */}
        <div className="px-5 py-3 bg-surface-950/80 border-t border-white/5">
          <p className="text-[11px] text-surface-400 mb-1.5">Click or speak prompt in {selectedLang === 'mr' ? 'मराठी' : selectedLang === 'hi' ? 'हिंदी' : 'English'}:</p>
          <div className="flex flex-wrap gap-1.5">
            {quickPromptsByLang[selectedLang].map((prompt) => (
              <button
                key={prompt}
                onClick={() => sendTurn(prompt)}
                className="bg-white/5 hover:bg-primary-500/15 text-surface-300 hover:text-primary-300 border border-white/8 hover:border-primary-500/25 rounded-full px-3 py-1.5 text-[11px] font-medium transition-apple"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-surface-950 border-t border-white/5 flex items-center justify-between">
          <button
            onClick={() => setIsVoiceTesterOpen(false)}
            className="px-4 py-2 rounded-apple text-xs font-medium text-surface-400 hover:text-white hover:bg-white/5 transition-apple"
          >
            Close Console
          </button>
          <button
            onClick={handleToggleMic}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-apple text-xs font-medium transition-apple ${
              isRecording
                ? 'bg-rose-500 hover:bg-rose-600 text-white'
                : 'bg-primary-500 hover:bg-primary-600 text-white shadow-sm'
            }`}
          >
            {isRecording ? <MicOff className="w-4 h-4" strokeWidth={1.5} /> : <Mic className="w-4 h-4" strokeWidth={1.5} />}
            <span>{isRecording ? 'Stop' : `Speak in ${selectedLang === 'mr' ? 'मराठी' : selectedLang === 'hi' ? 'हिंदी' : 'English'}`}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
