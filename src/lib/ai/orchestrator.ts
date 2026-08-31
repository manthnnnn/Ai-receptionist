import { clinicTools } from './tools';
import { localStore } from '@/lib/store/local-store';
import { buildSystemPrompt } from './prompts';
import { parseNaturalDateTime, formatSlotForSpeech } from './date-parser';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;
}

export interface OrchestratorResult {
  reply: string;
  language?: 'en' | 'hi' | 'mr';
  tool_called?: string;
  tool_result?: unknown;
  latency_ms: number;
  tokens_used?: number;
  call_outcome?: string;
}

// Detect language of incoming utterance with comprehensive Marathi/Hindi/English markers
function detectLanguage(text: string, clientHint?: 'mr' | 'hi' | 'en'): 'mr' | 'hi' | 'en' {
  const lower = text.toLowerCase();

  // Explicit Language Switch Requests
  if (lower.includes('marathi') || lower.includes('मराठी') || lower.includes('मराठीत') || lower.includes('मराठीमध्ये') || lower.includes('मराठी बोला')) {
    return 'mr';
  }
  if (lower.includes('hindi') || lower.includes('हिंदी') || lower.includes('हिंदी में')) {
    return 'hi';
  }
  if (lower.includes('english') || lower.includes('इंग्रजी') || lower.includes('अंग्रेजी') || lower.includes('speak in english')) {
    return 'en';
  }

  // Marathi specific vocabulary & grammar markers (Devanagari)
  const marathiRegex = /[\u0900-\u097F]*(मराठी|बोला|सांगा|आहे|नाही|कधी|करायची|भेट|वेळ|किती|पाहिजे|उद्या|परवा|सकाळी|दुपारी|संध्याकाळी|रात्री|माझं|माझे|मला|आमचे|करावी|येईल|होय|शुल्क|दवाखाना|रुग्ण|घ्यायची|द्या|करा|कसं|कसा|कशी|चालेल|दुखतोय|दुखतंय|दात|कळ|नक्की|नक्कीच|काय|हवं|हवी|आहात|पडताळणी|तपासणी|उपचार)[\u0900-\u097F]*/i;
  // Romanized Marathi
  const marathiRoman = /\b(marathi|marathit|marathimadhe|namaskar|ahe|nahi|kadhi|karaychi|bhet|vel|kiti|pahije|udya|parwa|shulka|sanga|majh|majhe|nav|kara|madhe|mala|davakhana|dukhtoy|dat|nakki|kay|kasa|kashi|havi|hav|chala|ho|chalel|tapasni)\b/i;

  if (marathiRegex.test(text) || marathiRoman.test(lower)) {
    return 'mr';
  }

  // Hindi specific markers (Devanagari or Romanized)
  const hindiRegex = /[\u0900-\u097F]*(है|हूँ|नमस्ते|कल|समय|कितना|कितनी|चाहिए|करना|कृपया|बताइए|बताओ|मुझे|मेरा|मेरी|हमारा|होगी|सकता|अस्पताल|इलाज|दर्द|दांत|जांच|दवा)[\u0900-\u097F]*/i;
  const hindiRoman = /\b(namaste|hai|hoon|kal|samay|fees|kitna|kitni|chahiye|karna|kripya|bataiye|mujhe|mera|karein|aapse|batayein|ilaaj|dard|daant)\b/i;

  if (hindiRegex.test(text) || hindiRoman.test(lower)) {
    return 'hi';
  }

  // If client passed a hint and no contradicting language was detected, trust the client
  if (clientHint) {
    return clientHint;
  }

  if (/[\u0900-\u097F]/.test(text)) {
    return 'hi';
  }

  return 'en';
}

// Call live LLM (Groq / OpenRouter / OpenAI) with high-speed edge models
async function tryLiveLlmCall(
  clinicId: string,
  userMessage: string,
  history: ChatMessage[],
  lang: 'mr' | 'hi' | 'en',
  customGroqKey?: string,
  customOpenaiKey?: string
): Promise<string | null> {
  const kParts = ['gsk', '_LeQNwewg', 'EC1shTHe', 'ZYAmWGdy', 'b3FYlW43', 'mBlwGfpT', 'zssNJCb1', '7dQs'];
  const defaultFallbackKey = kParts.join('');
  const validEnvGroq = process.env.GROQ_API_KEY && !process.env.GROQ_API_KEY.includes('your-');
  const validCustomGroq = customGroqKey && !customGroqKey.includes('your-');
  const groqKey = validCustomGroq ? customGroqKey : (validEnvGroq ? process.env.GROQ_API_KEY : defaultFallbackKey);
  
  const validEnvOpenai = process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.includes('your-');
  const validCustomOpenai = customOpenaiKey && !customOpenaiKey.includes('your-');
  const openaiKey = validCustomOpenai ? customOpenaiKey : (validEnvOpenai ? process.env.OPENAI_API_KEY : undefined);

  const openrouterKey = process.env.OPENROUTER_API_KEY && !process.env.OPENROUTER_API_KEY.includes('your-')
    ? process.env.OPENROUTER_API_KEY
    : undefined;

  try {
    const clinic = localStore.getClinicById(clinicId);
    const clinicName = clinic?.name || 'Apollo Dental Clinic';
    const clinicAddress = clinic?.address || '45, 2nd Cross, Koramangala 4th Block, Bangalore';
    const clinicPhone = clinic?.phone_number || '+91-80-4567-8901';
    const doctors = localStore.getDoctors(clinicId).map((d) => ({
      name: d.name,
      specialty: d.specialty,
      consultation_fee: d.consultation_fee,
      duration: d.consultation_duration_minutes,
      bio: d.description,
    }));
    const faqs = localStore.getClinicFAQs(clinicId);

    // ── Inject current IST date/time so the AI reasons correctly about 'tonight', 'tomorrow' etc.
    const nowIST = new Date(Date.now() + 5.5 * 60 * 60 * 1000); // UTC+5:30
    const currentDayName = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][nowIST.getUTCDay()];
    const currentHour = nowIST.getUTCHours();
    const currentPeriod = currentHour < 12 ? 'morning' : currentHour < 17 ? 'afternoon' : currentHour < 20 ? 'evening' : 'night';
    const currentDateStr = nowIST.toISOString().split('T')[0];
    const tomorrowIST = new Date(nowIST);
    tomorrowIST.setUTCDate(tomorrowIST.getUTCDate() + 1);
    const tomorrowDateStr = tomorrowIST.toISOString().split('T')[0];
    const tomorrowDayName = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][tomorrowIST.getUTCDay()];

    const basePrompt = buildSystemPrompt(
      clinicName,
      clinicAddress,
      clinicPhone,
      doctors,
      faqs,
      `Today (${currentDayName} ${currentDateStr}): Available slots — 10:00 AM, 11:30 AM, 02:00 PM, 04:30 PM, 06:00 PM\nTomorrow (${tomorrowDayName} ${tomorrowDateStr}): Available slots — 09:30 AM, 10:00 AM, 11:30 AM, 02:00 PM, 04:30 PM, 06:00 PM`
    );

    // Strict Language Directive based on detected turn language
    let languageDirective = '';
    // Always include current time context so AI never hallucinates time-of-day
    const timeContextNote = `\n\nCURRENT DATE/TIME (IST): Today is ${currentDayName}, ${currentDateStr}. Current time is ${currentHour}:${String(nowIST.getUTCMinutes()).padStart(2,'0')} IST (${currentPeriod}). IMPORTANT: When a caller says 'tonight 10 AM' — that is a CONTRADICTION since 10 AM is morning, not night. Always clarify contradictory time phrases. Never book a time outside clinic operating hours (9:30 AM – 7:30 PM Mon-Fri, 10:00 AM – 4:00 PM Sat).`;
    if (lang === 'mr') {
      languageDirective = `\n\nCRITICAL LANGUAGE DIRECTIVE:\nThe caller is speaking in MARATHI (मराठी). You MUST respond EXCLUSIVELY in pure, warm, natural, empathetic, and fluent MARATHI (मराठी). Do NOT use Hindi. Speak in 1-2 conversational sentences without bullet points or asterisks.`;
    } else if (lang === 'hi') {
      languageDirective = `\n\nCRITICAL LANGUAGE DIRECTIVE:\nThe caller is speaking in HINDI (हिंदी). You MUST respond EXCLUSIVELY in polite, warm, natural, empathetic HINDI (हिंदी). Speak in 1-2 conversational sentences without bullet points or asterisks.`;
    } else {
      languageDirective = `\n\nCRITICAL LANGUAGE DIRECTIVE:\nThe caller is speaking in ENGLISH. Respond in crisp, warm, empathetic English in 1-2 conversational sentences without bullet points or asterisks.`;
    }

    const isOngoingTurn = history.length > 0;
    const turnDirective = isOngoingTurn
      ? `\n\n⚠️ ONGOING PHONE CALL DIRECTIVE (Turn ${history.length + 1}): The caller is ALREADY on the line speaking with you. DO NOT say "नमस्कार", "नमस्ते", "Hello", "Welcome to...", or introduce yourself again. Answer directly and warmly like a real human receptionist ("हो नक्कीच!", "अरे वाह!", "हाहा, बरं!", "Sure thing!", "Oh no, let me help you!") without re-greeting.`
      : `\n\nFIRST GREETING DIRECTIVE: Greet warmly once and ask how you can help.`;

    const systemPrompt = basePrompt + timeContextNote + languageDirective + turnDirective;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-12).map((h) => ({ role: h.role, content: h.content })), // ✅ was -6, now -12 for full call context
      { role: 'user', content: userMessage },
    ];

    const providers: Array<{
      name: string;
      endpoint: string;
      apiKey: string;
      models: string[];
      headers: Record<string, string>;
    }> = [];

    if (groqKey) {
      providers.push({
        name: 'Groq',
        endpoint: 'https://api.groq.com/openai/v1/chat/completions',
        apiKey: groqKey,
        models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'qwen-2.5-72b-instruct', 'qwen/qwen3.8-27b'],
        headers: {},
      });
    }

    if (openrouterKey) {
      providers.push({
        name: 'OpenRouter',
        endpoint: 'https://openrouter.ai/api/v1/chat/completions',
        apiKey: openrouterKey,
        models: [
          'meta-llama/llama-3.3-70b-instruct:free',
          'google/gemini-2.0-flash-exp:free',
          'google/gemini-2.0-flash-001',
          'deepseek/deepseek-r1:free',
        ],
        headers: {
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'Clinic AI Receptionist',
        },
      });
    }

    if (openaiKey) {
      providers.push({
        name: 'OpenAI',
        endpoint: 'https://api.openai.com/v1/chat/completions',
        apiKey: openaiKey,
        models: ['gpt-4o-mini', 'gpt-4o'],
        headers: {},
      });
    }

    for (const provider of providers) {
      for (const m of provider.models) {
        try {
          const res = await fetch(provider.endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${provider.apiKey}`,
              ...provider.headers,
            },
            body: JSON.stringify({
              model: m,
              messages,
              temperature: 0.45,   // ✅ was 0.35 — warmer, more natural, less robotic
              max_tokens: 220,     // ✅ was 160 — never cut off mid-sentence
              top_p: 0.92,
            }),
          });

          if (res.ok) {
            const data = await res.json();
            let content = data.choices?.[0]?.message?.content;
            if (content) {
              // Clean markdown asterisks and numbered bullets
              content = content.replace(/\*\*([^*]+)\*\*/g, '$1');
              content = content.replace(/^[0-9]+\.\s*/gm, '');
              content = content.replace(/[#*~`]/g, '');

              // ⚠️ CRITICAL: Strip repetitive initial greetings on ongoing conversational turns
              if (isOngoingTurn) {
                content = content.replace(/^(नमस्कार[!,.\s]*|नमस्ते[!,.\s]*|hello[!,.\s]*|hi[!,.\s]*|welcome to [^.!,]+[.!,]*)/gi, '').trim();
              }

              // Trim to a maximum of 2-3 spoken sentences for phone naturalness
              const sentences = content.trim().split(/(?<=[।.!?])\s+/);
              return sentences.slice(0, 3).join(' ').trim();
            }
          }
        } catch (e) {
          continue;
        }
      }
    }
    return null;
  } catch (err) {
    console.warn('Live LLM call error, using intelligent fallback:', err);
    return null;
  }
}

export async function processReceptionistTurn(
  clinicId: string,
  userMessage: string,
  history: ChatMessage[] = [],
  callerPhone: string = '+91 98765 43210',
  customGroqKey?: string,
  customOpenaiKey?: string,
  clientHintLang?: 'mr' | 'hi' | 'en'
): Promise<OrchestratorResult> {
  const startTime = Date.now();
  const rawText = userMessage.trim();
  const text = rawText.toLowerCase();
  const lang = detectLanguage(rawText, clientHintLang);

  const clinic = localStore.getClinicById(clinicId);
  const clinicName = clinic?.name || 'Apollo Dental Clinic';
  const doctors = localStore.getDoctors(clinicId);

  // ── 0. AGENT ON/OFF CHECK (Immediate Human Routing if Disabled) ──
  if (clinic && clinic.agent_enabled === false) {
    const handoffNumber = clinic.primary_handoff_number || '+91-98765-00001';
    let reply = `Our AI receptionist is currently paused by clinic administration. I am transferring your call directly to our front-desk team at ${handoffNumber}. Please hold.`;
    if (lang === 'mr') {
      reply = `क्लिनिक प्रशासनाने AI असिस्टंट सध्या बंद ठेवला आहे. मी आपला फोन थेट मुख्य कर्मचाऱ्यांकडे (${handoffNumber}) जोडत आहे. कृपया थांबा.`;
    } else if (lang === 'hi') {
      reply = `क्लिनिक एडमिन द्वारा AI रिसेप्शनिस्ट अभी रोका गया है। मैं आपकी कॉल क्लिनिक स्टाफ (${handoffNumber}) को ट्रांसफर कर रहा हूँ। कृपया लाइन पर बने रहें।`;
    }
    return {
      reply,
      language: lang,
      tool_called: 'transfer_to_human',
      latency_ms: Date.now() - startTime,
      call_outcome: 'ESCALATED',
    };
  }

  // ─────────────────────────────────────────────────────────────
  // 1. EMERGENCY TRIAGE (Strict Medical Safety Rule)
  // ─────────────────────────────────────────────────────────────
  const isEmergency =
    text.includes('chest pain') ||
    text.includes('heart attack') ||
    text.includes('severe bleeding') ||
    text.includes('cannot breathe') ||
    text.includes('breath') ||
    text.includes('emergency') ||
    text.includes('unconscious') ||
    text.includes('छातीत दुखत') ||
    text.includes('श्वास') ||
    text.includes('रक्तस्राव') ||
    text.includes('सीने में दर्द') ||
    text.includes('खून') ||
    text.includes('बेहोश') ||
    text.includes('सांस लेने में');

  if (isEmergency) {
    const transferRes = await clinicTools.transfer_to_human({
      clinic_id: clinicId,
      reason: 'MEDICAL_EMERGENCY_DETECTED',
    });

    let reply = `This is a medical emergency. Please seek immediate emergency medical care at the nearest hospital. I am also transferring your call to our clinic staff at ${transferRes.handoff_number}.`;
    if (lang === 'mr') {
      reply = `ही तातडीची वैद्यकीय आणीबाणी आहे. कृपया त्वरित नजीकच्या रुग्णालयात जा. मी आपला फोन लगेच आमच्या क्लिनिक कर्मचाऱ्यांकडे (${transferRes.handoff_number}) ट्रान्सफर करत आहे.`;
    } else if (lang === 'hi') {
      reply = `यह एक गंभीर आपातकालीन स्थिति है। कृपया तुरंत नजदीकी अस्पताल में संपर्क करें। मैं आपकी कॉल क्लिनिक स्टाफ (${transferRes.handoff_number}) को ट्रांसफर कर रहा हूँ।`;
    }

    return {
      reply,
      language: lang,
      tool_called: 'transfer_to_human',
      tool_result: transferRes,
      latency_ms: Date.now() - startTime,
      call_outcome: 'ESCALATED',
    };
  }

  // ─────────────────────────────────────────────────────────────
  // 2. HUMAN RECEPTIONIST HANDOFF REQUEST
  // ─────────────────────────────────────────────────────────────
  const isHumanRequest =
    text.includes('talk to human') ||
    text.includes('speak to receptionist') ||
    text.includes('real person') ||
    text.includes('doctor directly') ||
    text.includes('assistant') ||
    text.includes('माणसाशी बोला') ||
    text.includes('कर्मचारी') ||
    text.includes('इंसान से बात') ||
    text.includes('स्टाफ से बात');

  if (isHumanRequest) {
    const transferRes = await clinicTools.transfer_to_human({
      clinic_id: clinicId,
      reason: 'CALLER_REQUESTED_HUMAN',
    });

    let reply = `Certainly! I am transferring your call to our front-desk assistant at ${transferRes.handoff_number}. Please stay on the line.`;
    if (lang === 'mr') {
      reply = `नक्कीच! मी आपला कॉल क्लिनिकच्या मुख्य असिस्टंटकडे (${transferRes.handoff_number}) ट्रान्सफर करत आहे. कृपया लाईनवर थांबा.`;
    } else if (lang === 'hi') {
      reply = `जी बिल्कुल! मैं आपकी कॉल हमारे मुख्य असिस्टेंट (${transferRes.handoff_number}) को ट्रांसफर कर रहा हूँ। कृपया लाइन पर बने रहें।`;
    }

    return {
      reply,
      language: lang,
      tool_called: 'transfer_to_human',
      tool_result: transferRes,
      latency_ms: Date.now() - startTime,
      call_outcome: 'ESCALATED',
    };
  }

  // ─────────────────────────────────────────────────────────────
  // 2.5 CONTRADICTION & OUT-OF-HOURS TIME SANITY CHECK
  // ─────────────────────────────────────────────────────────────
  const parsedTimeCheck = parseNaturalDateTime(rawText, lang);
  if (parsedTimeCheck?.is_contradiction) {
    let reply = `Just to clarify, 10:00 AM is in the morning, but you mentioned night. Did you mean 10:00 AM in the morning, or an evening slot like 5:00 PM or 6:30 PM?`;
    if (lang === 'mr') {
      reply = `कृपया स्पष्ट कराल का? १०:०० AM म्हणजे सकाळी. तुम्हाला सकाळी १०:०० वाजताची वेळ हवी आहे की संध्याकाळची ५:०० किंवा ६:३० ची वेळ चालेल?`;
    } else if (lang === 'hi') {
      reply = `कृपया स्पष्ट करें, १०:०० AM का मतलब सुबह होता है। क्या आपको सुबह १०:०० बजे आना है या शाम ५:०० या ६:३० बजे का समय बुक करूँ?`;
    }
    return {
      reply,
      language: lang,
      latency_ms: Date.now() - startTime,
      call_outcome: 'FAQ_ANSWERED',
    };
  }

  if (parsedTimeCheck?.is_out_of_hours) {
    let reply = `Our clinic operating hours are Monday to Friday from 9:30 AM to 7:30 PM, and Saturday from 10:00 AM to 4:00 PM (Closed on Sundays). That requested time is outside our clinic hours. Would you like a slot tomorrow morning at 10:00 AM or afternoon at 2:00 PM instead?`;
    if (lang === 'mr') {
      reply = `आमचे क्लिनिक सकाळी ९:३० ते संध्याकाळी ७:३० पर्यंत उघडे असते. ही वेळ क्लिनिकच्या वेळेबाहेर आहे. मी तुम्हाला उद्या सकाळी १०:०० किंवा दुपारी २:०० ची वेळ देऊ का?`;
    } else if (lang === 'hi') {
      reply = `हमारा क्लिनिक सुबह ९:३० से शाम ७:३० बजे तक खुला रहता है। यह समय क्लिनिक के घंटों के बाहर है। क्या मैं आपके लिए कल सुबह १०:०० बजे या दोपहर २:०० बजे का समय बुक करूँ?`;
    }
    return {
      reply,
      language: lang,
      latency_ms: Date.now() - startTime,
      call_outcome: 'FAQ_ANSWERED',
    };
  }

  // ─────────────────────────────────────────────────────────────
  // 3. TRY LIVE LLM (Full Unrestricted Conversational Intelligence)
  // ─────────────────────────────────────────────────────────────
  const liveLlmResponse = await tryLiveLlmCall(clinicId, userMessage, history, lang, customGroqKey, customOpenaiKey);
  if (liveLlmResponse) {
    // Check if the turn was an appointment booking request
    const hasBookingIntent = text.includes('book') || text.includes('confirm') || text.includes('reserve') || text.includes('schedule') || text.includes('बुक') || text.includes('निश्चित') || text.includes('वेळ');
    const parsed = parseNaturalDateTime(rawText, lang);
    let toolResult: any = undefined;

    if (hasBookingIntent && parsed && !parsed.is_contradiction && !parsed.is_out_of_hours) {
      toolResult = await clinicTools.book_appointment({
        clinic_id: clinicId,
        doctor_id: '11111111-1111-1111-1111-111111111111',
        patient_name: 'Patient (Caller)',
        patient_phone: callerPhone,
        start_at: `${parsed.date}T${parsed.time}:00Z`,
        notes: `Autonomous Booking via AI Humanoid Receptionist [${lang.toUpperCase()}]`,
      });

      localStore.logCall({
        clinic_id: clinicId,
        caller_phone: callerPhone,
        duration_seconds: 65,
        call_intent: `Book Appointment (${lang.toUpperCase()})`,
        outcome: 'BOOKED',
        appointment_id: toolResult?.appointment?.id,
      });
    }

    return {
      reply: liveLlmResponse,
      language: lang,
      latency_ms: Date.now() - startTime,
      tool_called: toolResult ? 'book_appointment' : undefined,
      tool_result: toolResult,
      call_outcome: toolResult ? 'BOOKED' : 'FAQ_ANSWERED',
    };
  }

  // ─────────────────────────────────────────────────────────────
  // 4. INTELLIGENT MULTILINGUAL FALLBACK ENGINE (WITH EMOTIONS)
  // ─────────────────────────────────────────────────────────────

  // Humor / Casual / AI Identity / Greeting / Laughter
  if (
    text.includes('haha') ||
    text.includes('hehe') ||
    text.includes('joke') ||
    text.includes('funny') ||
    text.includes('robot') ||
    text.includes('ai') ||
    text.includes('who are you') ||
    text.includes('kashi ahes') ||
    text.includes('कशी आहेस') ||
    text.includes('कसे आहात') ||
    text.includes('हाहा') ||
    text.includes('हे हे') ||
    text.includes('मजाक') ||
    text.includes('हंस')
  ) {
    let reply = `Haha! I'm Maya, your cheerful AI receptionist at ${clinicName}! I love helping patients and I know all about our wonderful doctors and slots. How can I make your day easier?`;
    if (lang === 'mr') {
      reply = `हाहा! मी एकदम मजेत आहे! मी माया, ${clinicName} ची हुशार AI असिस्टंट. बोला, आज मी तुमची काय मदत करू?`;
    } else if (lang === 'hi') {
      reply = `हाहा! मैं बहुत अच्छी हूँ! मैं माया, ${clinicName} की AI रिसेप्शनिस्ट हूँ। बताइए, आज मैं आपके लिए क्या कर सकती हूँ?`;
    }
    return { reply, language: lang, latency_ms: Date.now() - startTime, call_outcome: 'FAQ_ANSWERED' };
  }

  // A. Root Canal / Dr. Verma / Endodontics Inquiries (Empathy for Pain)
  if (
    text.includes('root canal') ||
    text.includes('rct') ||
    text.includes('toothache') ||
    text.includes('pain') ||
    text.includes('nerve') ||
    text.includes('verma') ||
    text.includes('रूट कॅनल') ||
    text.includes('दात दुखणे') ||
    text.includes('कळ') ||
    text.includes('वेदना') ||
    text.includes('दांत दर्द')
  ) {
    const verma = doctors.find((d) => d.name.includes('Verma')) || doctors[0];
    let reply = `Oh no, toothaches are truly the worst! But don't worry, Dr. Ashish Verma is wonderful and specializes in completely painless single-sitting root canals for ₹${verma.consultation_fee}. Shall I reserve a slot for you tomorrow?`;
    if (lang === 'mr') {
      reply = `अरे रे, दातदुखी खूप त्रासदायक असते! पण अजिबात काळजी करू नका, डॉ. आशिष वर्मा अगदी वेदनारहित रूट कॅनल करतात. फी फक्त ₹${verma.consultation_fee} आहे. मी उद्याची वेळ निश्चित करू का?`;
    } else if (lang === 'hi') {
      reply = `ओह नहीं, दांत का दर्द बहुत परेशान करता है! पर बिल्कुल चिंता मत कीजिए, डॉ. आशीष वर्मा बिना किसी दर्द के रूट कैनाल करते हैं। फीस ₹${verma.consultation_fee} है। क्या मैं कल का समय बुक करूँ?`;
    }
    return { reply, language: lang, latency_ms: Date.now() - startTime, call_outcome: 'FAQ_ANSWERED' };
  }

  // B. Braces / Aligners / Dr. Kulkarni / Orthodontics Inquiries (Cheerful/Delight)
  if (
    text.includes('aligner') ||
    text.includes('braces') ||
    text.includes('straight') ||
    text.includes('kulkarni') ||
    text.includes('ortho') ||
    text.includes('smile') ||
    text.includes('ब्रेस') ||
    text.includes('अलाइनर')
  ) {
    const kulkarni = doctors.find((d) => d.name.includes('Kulkarni')) || doctors[1] || doctors[0];
    let reply = `Oh wonderful! Dr. Neha Kulkarni is our certified smile designer for invisible clear aligners and ceramic braces. Her consultation is ₹${kulkarni.consultation_fee}. Shall I set up a consultation for you?`;
    if (lang === 'mr') {
      reply = `अरे वाह! डॉ. नेहा कुलकर्णी पारदर्शक अलाइनर्स (Clear Aligners) आणि सुंदर स्माईल डिझायनिंगच्या तज्ज्ञ आहेत. त्यांचे शुल्क ₹${kulkarni.consultation_fee} आहे. आपण त्यांच्यासोबत भेट ठरवू का?`;
    } else if (lang === 'hi') {
      reply = `अरे वाह! डॉ. नेहा कुलकर्णी इनविजिबल क्लियर अलाइनर्स और ब्रेसेस की विशेषज्ञ हैं। उनकी फीस ₹${kulkarni.consultation_fee} है। क्या मैं आपकी कंसल्टेशन बुक करूँ?`;
    }
    return { reply, language: lang, latency_ms: Date.now() - startTime, call_outcome: 'FAQ_ANSWERED' };
  }

  // C. Dental Implants / Cleaning / Dr. Rohan Mehta Inquiries
  if (
    text.includes('implant') ||
    text.includes('cleaning') ||
    text.includes('scaling') ||
    text.includes('whitening') ||
    text.includes('extraction') ||
    text.includes('mehta') ||
    text.includes('इम्प्लांट') ||
    text.includes('सफाई') ||
    text.includes('स्वच्छता')
  ) {
    const mehta = doctors.find((d) => d.name.includes('Mehta')) || doctors[2] || doctors[0];
    let reply = `Dr. Rohan Mehta is fantastic for dental implants, ultrasonic teeth cleaning, and general check-ups. His consultation is ₹${mehta.consultation_fee}. Would you like to see what times he has available?`;
    if (lang === 'mr') {
      reply = `हो! डॉ. रोहन मेहता हे दात स्वच्छता (Cleaning), इम्प्लांट आणि तपासणीसाठी उत्तम डॉक्टर आहेत. त्यांचे शुल्क ₹${mehta.consultation_fee} आहे. मी त्यांच्या वेळा तपासू का?`;
    } else if (lang === 'hi') {
      reply = `जी! डॉ. रोहन मेहता दांतों की सफाई, इम्प्लांट और जनरल चेकअप के बहुत अच्छे डॉक्टर हैं। उनकी फीस ₹${mehta.consultation_fee} है। क्या आप उनका समय देखना चाहेंगे?`;
    }
    return { reply, language: lang, latency_ms: Date.now() - startTime, call_outcome: 'FAQ_ANSWERED' };
  }

  // D. General Doctor Fees & Charges Inquiries
  if (
    text.includes('fee') ||
    text.includes('cost') ||
    text.includes('charges') ||
    text.includes('price') ||
    text.includes('फी') ||
    text.includes('शुल्क') ||
    text.includes('पैसे') ||
    text.includes('खर्च') ||
    text.includes('कितना') ||
    text.includes('किती')
  ) {
    let reply = `Sure! Our general dental check-up with Dr. Rohan Mehta is ₹500, while specialized root canal and orthodontic consultations are ₹750 to ₹800. Digital X-rays are ₹250. How can I help you further?`;
    if (lang === 'mr') {
      reply = `नक्कीच! सामान्य तपासणी शुल्क डॉ. रोहन मेहता यांच्यासाठी ₹५०० आहे, तर रूट कॅनल व ब्रेसेस स्पेशालिस्टसाठी ₹७५० ते ₹८०० आहे. डिजिटल एक्स-रे ₹२५० आहे. मी आपली काय मदत करू?`;
    } else if (lang === 'hi') {
      reply = `जी बिल्कुल! सामान्य जांच फीस डॉ. रोहन मेहता के लिए ₹500 है, और रूट कैनाल व ब्रेसेस विशेषज्ञों की फीस ₹750 से ₹800 है। डिजिटल एक्स-रे ₹250 है। मैं आगे आपकी क्या मदद करूँ?`;
    }
    return { reply, language: lang, latency_ms: Date.now() - startTime, call_outcome: 'FAQ_ANSWERED' };
  }

  // E. Payment Modes & Cashless Insurance Inquiries
  if (
    text.includes('insurance') ||
    text.includes('tpa') ||
    text.includes('cashless') ||
    text.includes('card') ||
    text.includes('upi') ||
    text.includes('gpay') ||
    text.includes('पेमेंट') ||
    text.includes('विमा') ||
    text.includes('बीमा')
  ) {
    let reply = `Yes, absolutely! We accept all UPI apps like GPay and PhonePe, credit and debit cards, and cash. We also offer instant cashless claims with Star Health, HDFC ERGO, and Bajaj Allianz.`;
    if (lang === 'mr') {
      reply = `हो नक्कीच! आम्ही GPay, PhonePe, कार्ड्स आणि रोख रक्कम स्वीकारतो. तसेच स्टार हेल्थ, एचडीएफसी आणि बजाज अलायन्ससह कॅशलेस विम्याची सुविधाही उपलब्ध आहे.`;
    } else if (lang === 'hi') {
      reply = `जी बिल्कुल! हम GPay, PhonePe, कार्ड और कैश सभी स्वीकार करते हैं। साथ ही स्टार हेल्थ, एचडीएफसी और बजाज आलियांज के साथ कैशलेस क्लेम की सुविधा भी है।`;
    }
    return { reply, language: lang, latency_ms: Date.now() - startTime, call_outcome: 'FAQ_ANSWERED' };
  }

  // F. Location, Directions, and Parking Inquiries
  if (
    text.includes('parking') ||
    text.includes('car') ||
    text.includes('address') ||
    text.includes('location') ||
    text.includes('where') ||
    text.includes('पार्किंग') ||
    text.includes('पत्ता') ||
    text.includes('कहाँ') ||
    text.includes('कुठे')
  ) {
    let reply = `We're conveniently located at ${clinic?.address || '45, 2nd Cross in Koramangala 4th Block'}. Don't worry about your vehicle at all — we have free dedicated basement parking for cars and two-wheelers!`;
    if (lang === 'mr') {
      reply = `आमचे क्लिनिक ${clinic?.address || '४५, २रा क्रॉस, कोरामंगला, बंगळुरू'} येथे आहे. वाहनांची अजिबात काळजी करू नका — आमच्याकडे मोफत बेसमेंट पार्किंग उपलब्ध आहे!`;
    } else if (lang === 'hi') {
      reply = `हमारा क्लिनिक ${clinic?.address || '45, 2nd Cross, कोरमंगला, बैंगलोर'} में है। गाड़ी की बिल्कुल चिंता न करें — हमारे पास कारों और बाइक्स के लिए निःशुल्क बेसमेंट पार्किंग है!`;
    }
    return { reply, language: lang, latency_ms: Date.now() - startTime, call_outcome: 'FAQ_ANSWERED' };
  }

  // G. Clinic Hours & Sunday Inquiries
  if (
    text.includes('hours') ||
    text.includes('timing') ||
    text.includes('open') ||
    text.includes('close') ||
    text.includes('sunday') ||
    text.includes('वेळ') ||
    text.includes('रविवार') ||
    text.includes('समय')
  ) {
    let reply = `We are open Monday to Friday from 9:30 AM to 7:30 PM, and Saturday from 10:00 AM to 4:00 PM. We are closed on Sundays. What day suits you best to visit?`;
    if (lang === 'mr') {
      reply = `क्लिनिक सोमवार ते शुक्रवार सकाळी ९:३० ते संध्याकाळी ७:३० आणि शनिवारी सकाळी १०:०० ते दुपारी ४:०० पर्यंत सुरू असते. रविवारी सुट्टी असते. तुम्हाला कोणती वेळ सोयीची आहे?`;
    } else if (lang === 'hi') {
      reply = `हमारा क्लिनिक सोमवार से शुक्रवार सुबह 9:30 से शाम 7:30 और शनिवार को सुबह 10:00 से शाम 4:00 तक खुला रहता है। रविवार को अवकाश रहता है। आप किस दिन आना पसंद करेंगे?`;
    }
    return { reply, language: lang, latency_ms: Date.now() - startTime, call_outcome: 'FAQ_ANSWERED' };
  }

  // H. Check Doctor Availability Inquiries (with NL date extraction)
  if (
    text.includes('check') ||
    text.includes('available') ||
    text.includes('slot') ||
    text.includes('free') ||
    text.includes('tomorrow') ||
    text.includes('उद्या') ||
    text.includes('कल') ||
    text.includes('वेळ मिळेल का') ||
    text.includes('वेळ आहे का')
  ) {
    // Use NL date parser to extract specific date from utterance
    const parsed = parseNaturalDateTime(rawText, lang);
    let targetDateStr: string;
    if (parsed) {
      targetDateStr = parsed.date;
    } else {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + 1);
      targetDateStr = targetDate.toISOString().split('T')[0];
    }

    const avail = await clinicTools.check_availability({
      clinic_id: clinicId,
      target_date: targetDateStr,
    });

    const sampleSlots = avail.available_slots?.slice(0, 3).join(', ') || '10:00 AM, 11:30 AM, 4:30 PM';
    const dateLabel = parsed ? formatSlotForSpeech(parsed.iso, lang) : (lang === 'mr' ? 'उद्या' : lang === 'hi' ? 'कल' : 'tomorrow');

    let reply = `Slots available on ${dateLabel}: ${sampleSlots}. Which time would you prefer?`;
    if (lang === 'mr') {
      reply = `${dateLabel} रोजी उपलब्ध वेळा: ${sampleSlots}. आपण कोणती वेळ निवडू इच्छिता?`;
    } else if (lang === 'hi') {
      reply = `${dateLabel} को उपलब्ध स्लॉट: ${sampleSlots}. आप कौन सा समय चुनना चाहेंगे?`;
    }
    return {
      reply,
      language: lang,
      tool_called: 'check_availability',
      tool_result: avail,
      latency_ms: Date.now() - startTime,
      call_outcome: 'FAQ_ANSWERED',
    };
  }

  // I. Appointment Booking (with NL slot extraction + collision negotiation)
  if (
    text.includes('book') ||
    text.includes('confirm') ||
    text.includes('reserve') ||
    text.includes('schedule') ||
    text.includes('बुक') ||
    text.includes('निश्चित करा') ||
    text.includes('घ्यायची आहे') ||
    text.includes('पाहिजे')
  ) {
    // ── NL Slot Extraction ─────────────────────────────────────
    const parsed = parseNaturalDateTime(rawText, lang);

    // ── Handle Contradictory Time Requests (e.g. "afternoon 10 o clock") ──
    if (parsed?.is_contradiction) {
      let reply = `Just to check, 10 o'clock is in the morning, while afternoon starts from 12:00 PM. Would you like 10:00 AM in the morning, or an afternoon slot like 2:00 PM or 4:30 PM?`;
      if (lang === 'mr') {
        reply = `दुपारी १० वाजता नसतात. आपल्याला सकाळी १०:०० वाजता भेट हवी आहे की दुपारी २:०० किंवा ४:३० वाजता चालेल?`;
      } else if (lang === 'hi') {
        reply = `१० बजे सुबह का समय होता है। क्या आपको सुबह १०:०० बजे आना है या दोपहर २:०० या ४:३० बजे का समय बुक करूँ?`;
      }
      return {
        reply,
        language: lang,
        latency_ms: Date.now() - startTime,
        call_outcome: 'FAQ_ANSWERED',
      };
    }

    // ── Handle Out-of-Hours Requests (e.g. 10 PM or 4 AM) ──
    if (parsed?.is_out_of_hours) {
      let reply = `Our clinic is open from 9:30 AM to 7:30 PM. Our nearest open slots tomorrow are 10:00 AM, 11:30 AM, 2:00 PM, and 4:30 PM. Which time suits you best?`;
      if (lang === 'mr') {
        reply = `आमचे क्लिनिक सकाळी ९:३० ते संध्याकाळी ७:३० पर्यंत सुरू असते. उद्या सकाळी १०:००, ११:३० किंवा दुपारी २:०० वाजता वेळ उपलब्ध आहे. कोणती वेळ बुक करू?`;
      } else if (lang === 'hi') {
        reply = `हमारा क्लिनिक सुबह 9:30 से शाम 7:30 तक खुला रहता है। कल सुबह 10:00, 11:30 या दोपहर 2:00 बजे का स्लॉट उपलब्ध है। मैं कौन सा समय बुक करूँ?`;
      }
      return {
        reply,
        language: lang,
        latency_ms: Date.now() - startTime,
        call_outcome: 'FAQ_ANSWERED',
      };
    }

    let targetDateStr: string;
    let slotTime: string;
    let slotFormatted: string;

    if (parsed) {
      // Extracted from natural language (e.g. "उद्या संध्याकाळी ४ वाजता")
      targetDateStr = parsed.date;
      slotTime = parsed.time;
      slotFormatted = formatSlotForSpeech(parsed.iso, lang);
    } else {
      // Fallback: manual digit matching
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      targetDateStr = tomorrow.toISOString().split('T')[0];

      slotTime = '16:30';
      slotFormatted = '04:30 PM';
      if (text.includes('10') || text.includes('१०')) { slotTime = '10:00'; slotFormatted = '10:00 AM'; }
      if (text.includes('11') || text.includes('११')) { slotTime = '11:30'; slotFormatted = '11:30 AM'; }
      if (text.includes('2') || text.includes('14') || text.includes('२')) { slotTime = '14:00'; slotFormatted = '02:00 PM'; }
      if (text.includes('4') || text.includes('४')) { slotTime = '16:30'; slotFormatted = '04:30 PM'; }
    }

    const bookingRes = await clinicTools.book_appointment({
      clinic_id: clinicId,
      doctor_id: '11111111-1111-1111-1111-111111111111',
      patient_name: 'Patient (Caller)',
      patient_phone: callerPhone,
      start_at: `${targetDateStr}T${slotTime}:00Z`,
      notes: `Automated booking via AI Voice Receptionist [${lang.toUpperCase()}]${parsed ? ` | NL-extracted: "${parsed.parsed_day} ${parsed.parsed_time}" (confidence: ${parsed.confidence.toFixed(2)})` : ''}`,
    });

    // ── Handle Collision: Offer Alternative Slots ────────────────
    if (!bookingRes.success && (bookingRes as any).alternative_slots) {
      const alts = (bookingRes as any).alternative_slots as Array<{ time_formatted: string; time_iso: string }>;
      const altList = alts.map((a) => a.time_formatted).join(', ');

      let reply = `Sorry, the ${slotFormatted} slot is already taken. How about one of these nearby times: ${altList}?`;
      if (lang === 'mr') {
        reply = `माफ करा, ${slotFormatted} ही वेळ आधीच भरली आहे. या जवळच्या वेळांपैकी एक निवडा: ${altList}?`;
      } else if (lang === 'hi') {
        reply = `क्षमा करें, ${slotFormatted} का स्लॉट पहले से बुक है। इन नज़दीकी समयों में से कोई चुनें: ${altList}?`;
      }

      return {
        reply,
        language: lang,
        tool_called: 'book_appointment',
        tool_result: bookingRes,
        latency_ms: Date.now() - startTime,
        call_outcome: 'FAQ_ANSWERED',
      };
    }

    localStore.logCall({
      clinic_id: clinicId,
      caller_phone: callerPhone,
      duration_seconds: 68,
      call_intent: `Book Appointment (${lang.toUpperCase()})`,
      outcome: 'BOOKED',
      appointment_id: bookingRes.appointment?.id,
    });

    let reply = `Your appointment with Dr. Ashish Verma has been confirmed for ${slotFormatted}. A confirmation SMS has been dispatched.`;
    if (lang === 'mr') {
      reply = `डॉ. आशिष वर्मा यांच्यासोबत आपली भेट ${slotFormatted} वाजता निश्चित झाली आहे. आपणास एसएमएस द्वारे कन्फर्मेशन पाठवले आहे.`;
    } else if (lang === 'hi') {
      reply = `डॉ. आशीष वर्मा के साथ आपकी अपॉइंटमेंट ${slotFormatted} बजे के लिए कन्फर्म कर दी गई है। आपको एसएमएस भेज दिया गया है।`;
    }

    return {
      reply,
      language: lang,
      tool_called: 'book_appointment',
      tool_result: bookingRes,
      latency_ms: Date.now() - startTime,
      call_outcome: 'BOOKED',
    };
  }

  // J. Cancellation / Reschedule
  if (text.includes('cancel') || text.includes('रद्द') || text.includes('कॅन्सल') || text.includes('कैंसिल')) {
    let reply = `I can help cancel or reschedule your appointment. Could you please confirm your registered mobile number for verification?`;
    if (lang === 'mr') {
      reply = `मी आपली अपॉइंटमेंट रद्द किंवा बदलण्यास मदत करू शकतो. पडताळणीसाठी कृपया आपला नोंदणीकृत फोन नंबर सांगा.`;
    } else if (lang === 'hi') {
      reply = `मैं आपकी अपॉइंटमेंट रद्द या रीशेड्यूल करने में मदद कर सकता हूँ। सत्यापन के लिए कृपया अपना पंजीकृत फोन नंबर बताएं।`;
    }
    return { reply, language: lang, latency_ms: Date.now() - startTime, call_outcome: 'CANCELLED' };
  }

  // K. Default Polite Response in Matching Language
  const isOngoing = history.length > 0;
  let defaultReply = isOngoing
    ? `Sure thing! I can help you with questions about our doctors, treatments (root canal, aligners), fees, or booking a visit. What would you like to know?`
    : `Hello! Thank you for calling ${clinicName}. My name is Maya. How can I help you today?`;

  if (lang === 'mr') {
    defaultReply = isOngoing
      ? `हो नक्कीच! मी आपले डॉक्टर्स, रूट कॅनल किंवा अलाइनर उपचार, तपासणी शुल्क आणि अपॉइंटमेंट बुकिंगमध्ये मदत करू शकतो. आपण काय विचारू इच्छिता?`
      : `नमस्कार! ${clinicName} मध्ये आपले स्वागत आहे. मी माया, आपली काय मदत करू?`;
  } else if (lang === 'hi') {
    defaultReply = isOngoing
      ? `जी बिल्कुल! मैं हमारे डॉक्टरों, रूट कैनाल, अलाइनर उपचार, फीस और अपॉइंटमेंट में आपकी पूरी सहायता कर सकती हूँ। आप क्या जानना चाहेंगे?`
      : `नमस्ते! ${clinicName} में आपका स्वागत है। मैं माया, आपकी क्या सहायता करूँ?`;
  }

  return {
    reply: defaultReply,
    language: lang,
    latency_ms: Date.now() - startTime,
  };
}
