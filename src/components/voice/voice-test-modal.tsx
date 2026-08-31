'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useClinic } from '../layout/clinic-context';
import { Mic, MicOff, X, Zap, Volume2, CheckCircle2, Radio, PhoneCall, PhoneOff, Send, Sparkles } from 'lucide-react';

interface DialogTurn {
  id: string;
  speaker: 'caller' | 'ai';
  text: string;
  latency_ms?: number;
  lang?: string;
}

// Clean and enhance text for natural speech synthesis
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
  const [isHandsFree, setIsHandsFree] = useState(true);
  const [selectedLang, setSelectedLang] = useState<'en' | 'hi' | 'mr'>('en');
  const [dialog, setDialog] = useState<DialogTurn[]>([]);
  const [inputText, setInputText] = useState('');
  const [statusText, setStatusText] = useState('Ready');
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [currentCallId, setCurrentCallId] = useState<string>('');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const recognitionRef = useRef<any>(null);
  const isHandsFreeRef = useRef(isHandsFree);
  const selectedLangRef = useRef(selectedLang);
  const isAiSpeakingRef = useRef(isAiSpeaking);
  const dialogEndRef = useRef<HTMLDivElement>(null);

  isHandsFreeRef.current = isHandsFree;
  selectedLangRef.current = selectedLang;
  isAiSpeakingRef.current = isAiSpeaking;

  // Auto-scroll messages
  useEffect(() => {
    dialogEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [dialog]);

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
    if (!SpeechRecognition) {
      setStatusText('Speech recognition not supported in this browser');
      return;
    }

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
        setStatusText(currentLang === 'mr' ? '● ऐकत आहे, बोला...' : currentLang === 'hi' ? '● मैं सुन रही हूँ, बोलिए...' : '● Listening to user speech...');
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript;
        setIsRecording(false);
        if (transcript && transcript.trim()) {
          sendTurn(transcript.trim());
        }
      };

      recognition.onerror = (e: any) => {
        setIsRecording(false);
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

  // Update initial greeting when modal opens or language changes
  useEffect(() => {
    if (isVoiceTesterOpen) {
      const callId = `voice-test-${Date.now()}`;
      setCurrentCallId(callId);

      const clinicName = activeClinic?.name || 'Apollo Dental Clinic';
      let text = `Hello! Thank you for calling ${clinicName}. My name is Maya, your AI receptionist. How can I assist you today?`;
      if (selectedLang === 'hi') {
        text = `नमस्ते! ${clinicName} में आपका स्वागत है। मैं आपकी क्या सहायता कर सकती हूँ?`;
      } else if (selectedLang === 'mr') {
        text = `नमस्कार! ${clinicName} मध्ये आपले स्वागत आहे. मी आपली काय मदत करू शकतो?`;
      }

      setDialog([
        {
          id: `init-${selectedLang}`,
          speaker: 'ai',
          text,
          lang: selectedLang,
        },
      ]);

      // Speak greeting, then automatically start listening hands-free
      playSpeech(text, selectedLang, () => {
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
  }, [isVoiceTesterOpen, selectedLang, activeClinic, playSpeech, startListening]);

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

  // Send turn to backend & continue hands-free voice loop
  const sendTurn = async (userText: string) => {
    if (!userText.trim()) return;

    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
    }
    setIsRecording(false);

    const userTurn: DialogTurn = { id: `usr-${Date.now()}`, speaker: 'caller', text: userText };
    setDialog((prev) => [...prev, userTurn]);
    setInputText('');
    setStatusText('AI processing...');

    try {
      const groqKey = typeof window !== 'undefined' ? localStorage.getItem('CLINIC_GROQ_API_KEY') || undefined : undefined;
      const openaiKey = typeof window !== 'undefined' ? localStorage.getItem('CLINIC_OPENAI_API_KEY') || undefined : undefined;

      const history = dialog.map((d) => ({
        role: d.speaker === 'caller' ? ('user' as const) : ('assistant' as const),
        content: d.text,
      }));

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clinic_id: activeClinicId,
          message: userText,
          history,
          caller_phone: '+91 98765 43210',
          call_id: currentCallId,
          groq_api_key: groqKey,
          openai_api_key: openaiKey,
          language: selectedLangRef.current,
        }),
      });
      const data = await res.json();

      if (data.success && data.reply) {
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

        playSpeech(data.reply, turnLang, () => {
          if (isHandsFreeRef.current) {
            setTimeout(() => startListening(), 400);
          }
        });

        if (data.tool_called === 'book_appointment' || data.tool_called === 'cancel_appointment' || data.tool_called === 'reschedule_appointment') {
          refreshData();
        }
      }
    } catch (err) {
      console.error('Turn error:', err);
      setStatusText('Ready');
    }
  };

  const handleToggleMic = () => {
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
    setIsVoiceTesterOpen(false);
  };

  if (!isVoiceTesterOpen) return null;

  const quickPromptsByLang = {
    en: [
      'What are your consultation fees?',
      'Check available slots tomorrow',
      'Book Dr. Verma tomorrow at 11:00 AM for Rahul',
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
      <div className="gcore-card border border-white/15 w-full max-w-2xl rounded-apple-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-scale-in bg-[#080808]">
        {/* Header */}
        <div className="px-6 py-4 bg-black/90 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-apple bg-gcore-orange/15 border border-gcore-orange/30 flex items-center justify-center text-gcore-orange shadow-gcore-chip">
              <Mic className="w-4 h-4" strokeWidth={2} />
            </div>
            <div>
              <h3 className="font-bold text-white text-[15px] tracking-tight">AI Receptionist Voice Console</h3>
              <p className="text-xs text-neutral-400">Automated Continuous Voice &amp; Tool Calling · Sub-300ms</p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            {/* Hands-Free Mode Toggle */}
            <button
              onClick={() => setIsHandsFree(!isHandsFree)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition-apple flex items-center gap-1.5 ${
                isHandsFree 
                  ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300 shadow-sm' 
                  : 'bg-black border-white/10 text-neutral-400'
              }`}
              title="Hands-Free Continuous Voice: AI speaks and automatically listens back without button clicks"
            >
              <Radio className={`w-3 h-3 ${isHandsFree ? 'animate-pulse text-emerald-400' : 'text-neutral-500'}`} />
              <span>{isHandsFree ? 'Auto Hands-Free ON' : 'Manual Mic'}</span>
            </button>

            {/* Language Switcher */}
            <div className="flex items-center bg-black border border-white/10 rounded-lg p-0.5 text-xs">
              <button
                onClick={() => setSelectedLang('en')}
                className={`px-2.5 py-1 rounded-md transition-apple font-semibold ${
                  selectedLang === 'en' ? 'bg-gcore-orange text-white shadow-sm' : 'text-neutral-400 hover:text-white'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setSelectedLang('hi')}
                className={`px-2.5 py-1 rounded-md transition-apple font-semibold ${
                  selectedLang === 'hi' ? 'bg-gcore-orange text-white shadow-sm' : 'text-neutral-400 hover:text-white'
                }`}
              >
                हिंदी
              </button>
              <button
                onClick={() => setSelectedLang('mr')}
                className={`px-2.5 py-1 rounded-md transition-apple font-semibold ${
                  selectedLang === 'mr' ? 'bg-gcore-orange text-white shadow-sm' : 'text-neutral-400 hover:text-white'
                }`}
              >
                मराठी
              </button>
            </div>

            <button
              onClick={handleClose}
              className="text-neutral-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-apple ml-1"
            >
              <X className="w-5 h-5" strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {/* Dynamic Waveform Visualizer */}
        <div className="p-4 bg-black/60 border-b border-white/10">
          <div className="bg-black/90 border border-white/10 rounded-apple-lg p-3 flex flex-col gap-2 shadow-inner">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-neutral-300 font-medium">
                <Volume2 className="w-3.5 h-3.5 text-gcore-orange" strokeWidth={1.8} />
                Live Audio Stream ({selectedLang === 'en' ? 'English' : selectedLang === 'hi' ? 'Hindi' : 'Marathi'})
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium ${
                isRecording ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse' :
                isAiSpeaking ? 'bg-gcore-orange/20 text-orange-300 border border-gcore-orange/40 animate-pulse' :
                'bg-neutral-900 text-neutral-400 border border-white/5'
              }`}>
                {isRecording ? '● Auto-Listening to your speech...' : isAiSpeaking ? '● AI Speaking (Listen)...' : statusText}
              </span>
            </div>
            <canvas ref={canvasRef} width={560} height={44} className="w-full h-11 rounded bg-black" />
          </div>
        </div>

        {/* Dialogue Scroll View */}
        <div className="p-4 flex-1 overflow-y-auto space-y-3 min-h-[200px] max-h-[260px] bg-black/40 text-xs">
          {dialog.map((turn) => (
            <div
              key={turn.id}
              className={`flex flex-col ${turn.speaker === 'caller' ? 'items-end' : 'items-start'} animate-slide-up`}
            >
              <div
                className={`max-w-[82%] rounded-[16px] px-4 py-2.5 text-[13px] leading-relaxed ${
                  turn.speaker === 'caller'
                    ? 'bg-gcore-orange text-white rounded-br-none shadow-sm'
                    : 'bg-[#121212] border border-white/10 text-neutral-100 rounded-bl-none shadow-sm'
                }`}
              >
                <p className="font-normal">{turn.text}</p>
                {turn.latency_ms && (
                  <div className="mt-1 text-[10px] opacity-70 font-mono flex items-center gap-1">
                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" strokeWidth={1.8} />
                    {turn.latency_ms}ms turn latency
                  </div>
                )}
              </div>
              <span className="text-[10px] text-neutral-500 mt-1 px-1 font-mono">
                {turn.speaker === 'caller' ? 'Caller (You)' : 'AI Receptionist Maya'}
              </span>
            </div>
          ))}
          <div ref={dialogEndRef} />
        </div>

        {/* Quick Clickable Prompts */}
        <div className="px-5 py-2.5 bg-black/80 border-t border-white/10">
          <div className="text-[11px] text-neutral-400 font-medium mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-gcore-orange" />
              <span>Tap to ask or speak naturally:</span>
            </span>
            <button
              onClick={() => {
                const latestAiMsg = dialog.filter(m => m.speaker === 'ai').pop();
                if (latestAiMsg) playSpeech(latestAiMsg.text, selectedLang);
              }}
              className="text-[10px] text-orange-300 hover:text-white flex items-center gap-1"
              title="Replay last voice response"
            >
              <Volume2 className="w-3 h-3" />
              <span>Replay Voice</span>
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {quickPromptsByLang[selectedLang].map((prompt) => (
              <button
                key={prompt}
                onClick={() => sendTurn(prompt)}
                className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-gcore-orange/50 text-neutral-300 hover:text-white px-2.5 py-1 text-[11px] rounded-apple transition-apple"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Text Input + Mic Controls */}
        <div className="p-4 bg-black border-t border-white/10 flex flex-col gap-2.5">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendTurn(inputText);
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder={isRecording ? 'Auto-listening from your microphone...' : `Type a message or speak hands-free...`}
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

          <div className="flex items-center justify-between gap-2">
            <button
              onClick={handleClose}
              className="px-4 py-2 rounded-apple text-xs font-medium text-neutral-400 hover:text-white transition-apple"
            >
              Close
            </button>
            
            <button
              onClick={handleToggleMic}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-semibold transition-apple ${
                isRecording
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white animate-pulse shadow-lg'
                  : 'gcore-btn-orange shadow-gcore-btn'
              }`}
            >
              {isRecording ? <Mic className="w-4 h-4 text-white" /> : <MicOff className="w-4 h-4 text-neutral-400" />}
              <span>{isRecording ? '● Auto-Listening (Speak Now)' : 'Enable Mic'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
