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

// Call live LLM (Groq / OpenAI / Gemini) if API keys are set in environment or passed
async function tryLiveLlmCall(
  clinicId: string,
  userMessage: string,
  history: ChatMessage[],
  lang: 'mr' | 'hi' | 'en',
  customGroqKey?: string,
  customOpenaiKey?: string
): Promise<string | null> {
  const groqKey = customGroqKey || process.env.GROQ_API_KEY;
  const openaiKey = customOpenaiKey || process.env.OPENAI_API_KEY;
  const apiKey = groqKey || openaiKey;
  const isGroq = !!groqKey;
  const endpoint = isGroq
    ? 'https://api.groq.com/openai/v1/chat/completions'
    : 'https://api.openai.com/v1/chat/completions';

  if (!apiKey) return null;

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

    const basePrompt = buildSystemPrompt(
      clinicName,
      clinicAddress,
      clinicPhone,
      doctors,
      faqs,
      'Tomorrow: 10:00 AM, 11:30 AM, 02:00 PM, 04:30 PM'
    );

    // Strict Language Directive based on detected turn language
    let languageDirective = '';
    if (lang === 'mr') {
      languageDirective = `\n\nCRITICAL LANGUAGE DIRECTIVE:\nThe caller is speaking in MARATHI (मराठी). You MUST respond EXCLUSIVELY in pure, warm, natural, and fluent MARATHI (मराठी). Do NOT use Hindi. Speak like a real human Marathi hospital receptionist (e.g. "नमस्कार! हो नक्कीच, मी आपली मदत करतो...").`;
    } else if (lang === 'hi') {
      languageDirective = `\n\nCRITICAL LANGUAGE DIRECTIVE:\nThe caller is speaking in HINDI (हिंदी). You MUST respond EXCLUSIVELY in polite, warm, natural HINDI (हिंदी). (e.g. "नमस्ते! जी बिल्कुल, मैं आपकी पूरी सहायता करूँगी...").`;
    } else {
      languageDirective = `\n\nCRITICAL LANGUAGE DIRECTIVE:\nThe caller is speaking in ENGLISH. Respond in crisp, warm, natural English with conversational empathy.`;
    }

    const systemPrompt = basePrompt + languageDirective;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-6).map((h) => ({ role: h.role, content: h.content })),
      { role: 'user', content: userMessage },
    ];

    const modelsToTry = isGroq
      ? ['openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'qwen/qwen3.8-27b', 'groq/compound']
      : ['gpt-4o-mini', 'gpt-4o'];

    for (const m of modelsToTry) {
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: m,
            messages,
            temperature: 0.35,
            max_tokens: 160,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const content = data.choices?.[0]?.message?.content;
          if (content) return content;
        }
      } catch (e) {
        continue;
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
  // 3. TRY LIVE LLM (Full Unrestricted Conversational Intelligence)
  // ─────────────────────────────────────────────────────────────
  const liveLlmResponse = await tryLiveLlmCall(clinicId, userMessage, history, lang, customGroqKey, customOpenaiKey);
  if (liveLlmResponse) {
    return {
      reply: liveLlmResponse,
      language: lang,
      latency_ms: Date.now() - startTime,
    };
  }

  // ─────────────────────────────────────────────────────────────
  // 4. INTELLIGENT MULTILINGUAL FALLBACK ENGINE
  // ─────────────────────────────────────────────────────────────

  // A. Root Canal / Dr. Verma / Endodontics Inquiries
  if (
    text.includes('root canal') ||
    text.includes('rct') ||
    text.includes('toothache') ||
    text.includes('nerve') ||
    text.includes('verma') ||
    text.includes('रूट कॅनल') ||
    text.includes('दात दुखणे') ||
    text.includes('दांत दर्द')
  ) {
    const verma = doctors.find((d) => d.name.includes('Verma')) || doctors[0];
    let reply = `Oh, Dr. Ashish Verma is wonderful with root canals! He specializes in completely painless single-sitting treatments, and his consultation is ₹${verma.consultation_fee}. Would you like me to book a comfortable slot for you tomorrow?`;
    if (lang === 'mr') {
      reply = `हो नक्कीच! डॉ. आशिष वर्मा रूट कॅनल आणि दातदुखीच्या वेदनारहित उपचारात खूप अनुभवी आहेत. त्यांचे तपासणी शुल्क ₹${verma.consultation_fee} आहे. मी उद्याची तुमची वेळ निश्चित करू का?`;
    } else if (lang === 'hi') {
      reply = `जी बिल्कुल! डॉ. आशीष वर्मा रूट कैनाल बहुत ही आराम से और बिना किसी दर्द के करते हैं। उनकी फीस ₹${verma.consultation_fee} है। क्या मैं आपके लिए कल का कोई समय बुक कर दूँ?`;
    }
    return { reply, language: lang, latency_ms: Date.now() - startTime, call_outcome: 'FAQ_ANSWERED' };
  }

  // B. Braces / Aligners / Dr. Kulkarni / Orthodontics Inquiries
  if (
    text.includes('aligner') ||
    text.includes('braces') ||
    text.includes('straight') ||
    text.includes('kulkarni') ||
    text.includes('ortho') ||
    text.includes('ब्रेस') ||
    text.includes('अलाइनर')
  ) {
    const kulkarni = doctors.find((d) => d.name.includes('Kulkarni')) || doctors[1] || doctors[0];
    let reply = `Yes, certainly! Dr. Neha Kulkarni is our certified Orthodontist for invisible clear aligners, ceramic braces, and smile design. Her consultation is ₹${kulkarni.consultation_fee}. Shall I set up a smile consultation for you?`;
    if (lang === 'mr') {
      reply = `हो नक्कीच! डॉ. नेहा कुलकर्णी पारदर्शक अलाइनर्स (Clear Aligners) आणि ब्रेसेसच्या तज्ज्ञ आहेत. त्यांचे शुल्क ₹${kulkarni.consultation_fee} आहे. आपण त्यांच्यासोबत भेट ठरवू इच्छिता का?`;
    } else if (lang === 'hi') {
      reply = `जी बिल्कुल! डॉ. नेहा कुलकर्णी इनविजिबल क्लियर अलाइनर्स और ब्रेसेस की विशेषज्ञ हैं। उनकी फीस ₹${kulkarni.consultation_fee} है। क्या मैं आपकी कंसल्टेशन बुक करूँ?`;
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
  let defaultReply = `Hello! Thank you for calling ${clinicName}. I can assist you with any questions about our doctors, treatments (Root canals, Aligners, Implants), fees, or booking an appointment. How can I help you today?`;
  if (lang === 'mr') {
    defaultReply = `नमस्कार! ${clinicName} मध्ये आपले स्वागत आहे. मी आपले डॉक्टर्स, उपचार (रूट कॅनल, अलाइनर्स, इम्प्लांट), तपासणी शुल्क आणि अपॉइंटमेंट बुकिंग संबंधित सर्व प्रश्नांची उत्तरे देऊ शकतो. मी आपली काय मदत करू?`;
  } else if (lang === 'hi') {
    defaultReply = `नमस्ते! ${clinicName} में आपका स्वागत है। मैं हमारे डॉक्टरों, उपचारों (रूट कैनाल, अलाइनर, इम्प्लांट), फीस और अपॉइंटमेंट से जुड़े आपके सभी सवालों का उत्तर दे सकता हूँ। मैं आपकी क्या मदद करूँ?`;
  }

  return {
    reply: defaultReply,
    language: lang,
    latency_ms: Date.now() - startTime,
  };
}
