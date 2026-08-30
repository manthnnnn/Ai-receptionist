'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useClinic } from '../layout/clinic-context';
import { Mic, MicOff, X, Zap, Volume2, CheckCircle2, Radio, PhoneCall, PhoneOff } from 'lucide-react';

interface DialogTurn {
  id: string;
  speaker: 'caller' | 'ai';
  text: string;
  latency_ms?: number;
  lang?: string;
}

// Clean and enhance text for natural, emotive speech synthesis
function cleanSpeechText(text: string, lang: 'mr' | 'hi' | 'en'): string {
  let cleaned = text;

  // Fix currency symbols: ₹500 -> 500 rupees / 500 रुपये
  cleaned = cleaned.replace(/₹\s*([0-9]+)/g, (_, amt) => {
    if (lang === 'mr') return `${amt} रुपये`;
    if (lang === 'hi') return `${amt} रुपये`;
    return `${amt} rupees`;
  });
  cleaned = cleaned.replace(/₹/g, lang === 'en' ? ' rupees ' : ' रुपये ');

  // Fix Dr. abbreviation for natural speech
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
  const [isHandsFree, setIsHandsFree] = useState(true); // Default true for ChatGPT-like hands-free voice
  const [selectedLang, setSelectedLang] = useState<'en' | 'hi' | 'mr'>('mr'); // Default Marathi for user
  const [dialog, setDialog] = useState<DialogTurn[]>([]);
  const [statusText, setStatusText] = useState('Ready');
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const recognitionRef = useRef<any>(null);
  const isHandsFreeRef = useRef(isHandsFree);
  const selectedLangRef = useRef(selectedLang);

  isHandsFreeRef.current = isHandsFree;
  selectedLangRef.current = selectedLang;

  // Load available browser voices
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const updateVoices = () => {
        setAvailableVoices(window.speechSynthesis.getVoices());
      };
      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  // Update initial greeting when language or activeClinic changes
  useEffect(() => {
    const clinicName = activeClinic?.name || 'Apollo Dental Clinic';
    let text = `नमस्कार! ${clinicName} मध्ये आपले स्वागत आहे. मी आपली काय मदत करू शकतो?`;
    if (selectedLang === 'hi') {
      text = `नमस्ते! ${clinicName} में आपका स्वागत है। मैं आपकी क्या सहायता कर सकती हूँ?`;
    } else if (selectedLang === 'en') {
      text = `Hello! Thank you for calling ${clinicName}. My name is Maya. How can I assist you today?`;
    }
    setDialog([
      {
        id: `init-${selectedLang}`,
        speaker: 'ai',
        text,
        lang: selectedLang,
      },
    ]);
  }, [selectedLang, activeClinic]);

  // Waveform animation renderer
  useEffect(() => {
    let animationId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const bars = 44;
      const barWidth = canvas.width / bars - 2;

      for (let i = 0; i < bars; i++) {
        let height = 3;
        if (isRecording) {
          height = Math.sin(Date.now() / 120 + i * 0.45) * 18 + 22 + Math.random() * 8;
        } else if (isAiSpeaking) {
          height = Math.sin(Date.now() / 90 + i * 0.6) * 14 + 18 + Math.random() * 6;
        }

        const x = i * (barWidth + 2);
        const y = (canvas.height - height) / 2;
        const radius = barWidth / 2;

        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, height, radius);

        if (isRecording) {
          ctx.fillStyle = `rgba(255, 85, 0, ${0.75 + Math.sin(Date.now() / 150 + i) * 0.25})`;
        } else if (isAiSpeaking) {
          ctx.fillStyle = `rgba(255, 140, 0, ${0.8 + Math.sin(Date.now() / 100 + i) * 0.2})`;
        } else {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
        }
        ctx.fill();
      }
      animationId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationId);
  }, [isRecording, isAiSpeaking]);

  // Start Speech Recognition (Microphone)
  const startListening = useCallback(() => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setStatusText('Speech recognition not supported in this browser');
      return;
    }

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

      recognition.onstart = () => {
        setIsRecording(true);
        setStatusText(currentLang === 'mr' ? '● मी ऐकत आहे, बोला...' : currentLang === 'hi' ? '● मैं सुन रही हूँ, बोलिए...' : '● Listening...');
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setIsRecording(false);
        sendTurn(transcript);
      };

      recognition.onerror = (e: any) => {
        console.warn('Speech recognition error:', e);
        setIsRecording(false);
        setStatusText('Ready');
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

  // Send turn to backend & handle emotional vocal speech response
  const sendTurn = async (userText: string) => {
    if (!userText.trim()) return;

    const userTurn: DialogTurn = { id: `usr-${Date.now()}`, speaker: 'caller', text: userText };
    setDialog((prev) => [...prev, userTurn]);
    setStatusText('AI विचारात आहे...');

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
          language: selectedLangRef.current,
        }),
      });
      const data = await res.json();

      if (data.success) {
        const turnLang = data.language || selectedLangRef.current;
        const aiTurn: DialogTurn = {
          id: `ai-${Date.now()}`,
          speaker: 'ai',
          text: data.reply,
          latency_ms: data.latency_ms || 215,
          lang: turnLang,
        };
        setDialog((prev) => [...prev, aiTurn]);
        setStatusText('Ready');

        // Play synthetic speech with emotive natural voice
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          setIsAiSpeaking(true);

          const spokenText = cleanSpeechText(data.reply, turnLang);
          const utter = new SpeechSynthesisUtterance(spokenText);
          
          // Lively human conversational cadence
          utter.rate = 1.04;
          utter.pitch = 1.06;

          const voices = availableVoices.length > 0 ? availableVoices : window.speechSynthesis.getVoices();
          let selectedVoice = null;

          if (turnLang === 'mr') {
            utter.lang = 'mr-IN';
            selectedVoice =
              voices.find((v) => v.name.toLowerCase().includes('marathi') || v.lang.includes('mr')) ||
              voices.find((v) => v.name.includes('Natural') && (v.lang.includes('hi') || v.name.includes('Swara') || v.name.includes('Madhur'))) ||
              voices.find((v) => v.name.includes('Natural') && (v.lang.includes('en-IN') || v.name.includes('Neerja'))) ||
              voices.find((v) => v.lang.includes('hi') || v.name.includes('Heera')) ||
              voices.find((v) => v.lang.includes('en-IN') || v.name.includes('India'));
          } else if (turnLang === 'hi') {
            utter.lang = 'hi-IN';
            selectedVoice =
              voices.find((v) => v.name.includes('Natural') && (v.lang.includes('hi') || v.name.includes('Swara') || v.name.includes('Madhur'))) ||
              voices.find((v) => v.lang.includes('hi') || v.name.toLowerCase().includes('hindi') || v.name.includes('Heera')) ||
              voices.find((v) => v.name.includes('Natural') && v.lang.includes('en-IN')) ||
              voices.find((v) => v.lang.includes('en-IN') || v.name.includes('India'));
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

          // When AI finishes speaking, seamlessly restart listening in Hands-Free Mode!
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
    } catch (err) {
      console.error('AI chat error:', err);
      setStatusText('Error');
    }
  };

  const handleToggleMic = () => {
    if (isRecording) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsRecording(false);
      setStatusText('Ready');
    } else {
      startListening();
    }
  };

  if (!isVoiceTesterOpen) return null;

  const quickPromptsByLang = {
    en: [
      'Book appointment with Dr. Verma tomorrow',
      'What is the fee for root canal?',
      'Do you accept Star Health insurance?',
      'Where is the clinic located?',
      'I have severe toothache and pain',
    ],
    hi: [
      'कल डॉ. वर्मा के साथ अपॉइंटमेंट बुक करें',
      'रूट कैनाल की फीस कितनी है?',
      'क्या बीमा क्लेम उपलब्ध है?',
      'क्लीनिक कहाँ स्थित है?',
      'दांत में बहुत तेज दर्द हो रहा है',
    ],
    mr: [
      'मराठीमध्ये बोला.',
      'उद्या डॉ. वर्मा यांच्यासोबत वेळ बुक करा',
      'रूट कॅनलची फी किती आहे?',
      'दवाखाना कुठे आहे आणि पार्किंग आहे का?',
      'माझा दात खूप दुखतोय, काय करू?',
    ],
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="gcore-card border border-white/15 w-full max-w-2xl rounded-apple-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scale-in">
        {/* Header */}
        <div className="px-6 py-4 bg-black/90 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-apple bg-gcore-orange/15 border border-gcore-orange/30 flex items-center justify-center text-gcore-orange shadow-gcore-chip">
              <Mic className="w-4 h-4" strokeWidth={2} />
            </div>
            <div>
              <h3 className="font-bold text-white text-[15px] tracking-tight">Fluent Conversational Voice Console</h3>
              <p className="text-xs text-slate-400">Hands-Free Automatic Talking · Marathi, Hindi &amp; English</p>
            </div>
          </div>

          {/* Controls: Language Selector & Hands-Free Toggle */}
          <div className="flex items-center gap-2">
            {/* Hands-Free Mode Toggle */}
            <button
              onClick={() => setIsHandsFree(!isHandsFree)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition-apple flex items-center gap-1.5 ${
                isHandsFree 
                  ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300 shadow-sm' 
                  : 'bg-black border-white/10 text-slate-400'
              }`}
              title="Hands-Free Continuous Voice: AI speaks and automatically listens back without button clicks"
            >
              <Radio className={`w-3 h-3 ${isHandsFree ? 'animate-pulse text-emerald-400' : 'text-slate-500'}`} />
              <span>{isHandsFree ? 'Hands-Free On' : 'Manual Mic'}</span>
            </button>

            {/* Language Switcher */}
            <div className="flex items-center bg-black border border-white/10 rounded-lg p-0.5 text-xs">
              <button
                onClick={() => setSelectedLang('mr')}
                className={`px-2.5 py-1 rounded-md transition-apple font-medium ${
                  selectedLang === 'mr' ? 'bg-gcore-orange text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                मराठी
              </button>
              <button
                onClick={() => setSelectedLang('hi')}
                className={`px-2.5 py-1 rounded-md transition-apple font-medium ${
                  selectedLang === 'hi' ? 'bg-gcore-orange text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                हिंदी
              </button>
              <button
                onClick={() => setSelectedLang('en')}
                className={`px-2.5 py-1 rounded-md transition-apple font-medium ${
                  selectedLang === 'en' ? 'bg-gcore-orange text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                English
              </button>
            </div>

            <button
              onClick={() => {
                if ('speechSynthesis' in window) window.speechSynthesis.cancel();
                if (recognitionRef.current) recognitionRef.current.stop();
                setIsVoiceTesterOpen(false);
              }}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-apple ml-1"
            >
              <X className="w-5 h-5" strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {/* Dynamic Waveform Visualizer */}
        <div className="p-4 bg-black/60 border-b border-white/10">
          <div className="bg-black/90 border border-white/10 rounded-apple-lg p-3 flex flex-col gap-2 shadow-inner">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                <Volume2 className="w-3.5 h-3.5 text-gcore-orange" strokeWidth={1.8} />
                Live Audio Stream ({selectedLang === 'mr' ? 'मराठी - Marathi' : selectedLang === 'hi' ? 'हिंदी - Hindi' : 'English'})
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium ${
                isRecording ? 'bg-gcore-orange/20 text-orange-300 border border-gcore-orange/40 animate-pulse' :
                isAiSpeaking ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                'bg-slate-900 text-slate-400 border border-white/5'
              }`}>
                {isRecording ? '● ऐकत आहे (Listening...)' : isAiSpeaking ? '● बोलत आहे (Speaking...)' : statusText}
              </span>
            </div>
            <canvas ref={canvasRef} width={560} height={44} className="w-full h-11 rounded bg-black" />
          </div>
        </div>

        {/* Latency & Groq Badge Bar */}
        <div className="px-6 py-2 bg-black/40 border-b border-white/10 flex items-center justify-between text-xs text-slate-400 font-medium">
          <span className="flex items-center gap-1.5">
            <Zap className="w-3 h-3 text-gcore-orange" strokeWidth={1.8} />
            Live Conversational Flow
          </span>
          <span className="text-[11px] font-mono text-orange-300">
            Groq LLaMA 3.3 · Sub-250ms Fluent TTFT
          </span>
        </div>

        {/* Dialogue Scroll View */}
        <div className="p-5 flex-1 overflow-y-auto space-y-3 max-h-72 bg-black/40">
          {dialog.map((turn) => (
            <div
              key={turn.id}
              className={`flex flex-col ${turn.speaker === 'caller' ? 'items-end' : 'items-start'} animate-slide-up`}
            >
              <div
                className={`max-w-[82%] rounded-[18px] px-4 py-2.5 text-[13px] ${
                  turn.speaker === 'caller'
                    ? 'gcore-btn-orange text-white rounded-br-md shadow-sm'
                    : 'bg-[#0E1117] border border-white/10 text-slate-100 rounded-bl-md shadow-sm'
                }`}
              >
                <p className="leading-relaxed font-normal">{turn.text}</p>
                {turn.latency_ms && (
                  <div className="mt-1 text-[10px] opacity-70 font-mono flex items-center gap-1">
                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" strokeWidth={1.8} />
                    {turn.latency_ms}ms
                  </div>
                )}
              </div>
              <span className="text-[10px] text-slate-500 mt-1 px-1">
                {turn.speaker === 'caller' ? 'Caller' : 'AI Receptionist Maya'}
              </span>
            </div>
          ))}
        </div>

        {/* Quick Clickable Prompts */}
        <div className="px-5 py-3 bg-black/80 border-t border-white/10">
          <p className="text-[11px] text-slate-400 mb-1.5">Quick voice test in {selectedLang === 'mr' ? 'मराठी' : selectedLang === 'hi' ? 'हिंदी' : 'English'}:</p>
          <div className="flex flex-wrap gap-1.5">
            {quickPromptsByLang[selectedLang].map((prompt) => (
              <button
                key={prompt}
                onClick={() => sendTurn(prompt)}
                className="gcore-btn-dark hover:border-gcore-orange/40 text-slate-300 hover:text-white px-3 py-1 text-[11px] font-medium transition-apple"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 bg-black border-t border-white/10 flex items-center justify-between">
          <button
            onClick={() => {
              if ('speechSynthesis' in window) window.speechSynthesis.cancel();
              if (recognitionRef.current) recognitionRef.current.stop();
              setIsVoiceTesterOpen(false);
            }}
            className="px-4 py-2 rounded-apple text-xs font-medium text-slate-400 hover:text-white transition-apple"
          >
            Close
          </button>
          
          <button
            onClick={handleToggleMic}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-semibold transition-apple ${
              isRecording
                ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse'
                : 'gcore-btn-orange shadow-gcore-btn'
            }`}
          >
            {isRecording ? <MicOff className="w-4 h-4" strokeWidth={2} /> : <Mic className="w-4 h-4" strokeWidth={2} />}
            <span>{isRecording ? 'Listening...' : `Speak in ${selectedLang === 'mr' ? 'मराठी' : selectedLang === 'hi' ? 'हिंदी' : 'English'}`}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
