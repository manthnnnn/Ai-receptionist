export type SupportedLanguage = 'mr' | 'hi' | 'en';

export interface LanguageDetectionResult {
  language: SupportedLanguage;
  confidence: number;
  voice_id: string;
  language_name: string;
  is_code_switch: boolean;
}

// Marathi vocabulary markers (Devanagari)
const MARATHI_DEVANAGARI = [
  'मराठी', 'बोला', 'सांगा', 'आहे', 'नाही', 'कधी', 'करायची', 'भेट', 'वेळ',
  'किती', 'पाहिजे', 'उद्या', 'परवा', 'सकाळी', 'दुपारी', 'संध्याकाळी', 'रात्री',
  'माझं', 'माझे', 'मला', 'आमचे', 'करावी', 'येईल', 'होय', 'शुल्क', 'दवाखाना',
  'रुग्ण', 'घ्यायची', 'द्या', 'करा', 'कसं', 'कसा', 'कशी', 'चालेल', 'दुखतोय',
  'दुखतंय', 'दात', 'कळ', 'नक्की', 'नक्कीच', 'काय', 'हवं', 'हवी', 'आहात',
  'पडताळणी', 'तपासणी', 'उपचार', 'नको', 'ठिक', 'बरं', 'नमस्कार'
];

// Romanized Marathi words (Hinglish/Marathish)
const MARATHI_ROMAN = [
  'marathi', 'marathit', 'marathimadhe', 'namaskar', 'ahe', 'nahi', 'kadhi',
  'karaychi', 'bhet', 'vel', 'kiti', 'pahije', 'udya', 'parwa', 'shulka',
  'sanga', 'majh', 'majhe', 'nav', 'kara', 'madhe', 'mala', 'davakhana',
  'dukhtoy', 'dat', 'nakki', 'kay', 'kasa', 'kashi', 'havi', 'hav',
  'chala', 'ho', 'chalel', 'tapasni', 'dakhva', 'shodhav'
];

// Hindi vocabulary markers (Devanagari)
const HINDI_DEVANAGARI = [
  'हिंदी', 'है', 'हूँ', 'नमस्ते', 'कल', 'समय', 'कितना', 'कितनी', 'चाहिए',
  'करना', 'कृपया', 'बताइए', 'बताओ', 'मुझे', 'मेरा', 'मेरी', 'हमारा', 'होगी',
  'सकता', 'अस्पताल', 'इलाज', 'दर्द', 'दांत', 'जांच', 'दवा', 'मिलना', 'दीजिए',
  'धन्यवाद', 'शुक्रिया', 'कब', 'बुकिंग', 'रखना'
];

// Romanized Hindi words
const HINDI_ROMAN = [
  'hindi', 'hindime', 'namaste', 'hai', 'hoon', 'kal', 'samay', 'fees',
  'kitna', 'kitni', 'chahiye', 'karna', 'kripya', 'bataiye', 'mujhe',
  'mera', 'karein', 'aapse', 'batayein', 'ilaaj', 'dard', 'daant',
  'milna', 'hogi', 'dhanyawad', 'shukriya', 'karo'
];

/**
 * Robust runtime spoken language detector supporting mid-call code switching
 * between English, Hindi, and Marathi.
 */
export function detectSpokenLanguage(
  text: string,
  previousLanguage: SupportedLanguage = 'en'
): LanguageDetectionResult {
  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();

  // 1. Explicit language request detection
  if (
    lower.includes('marathi') ||
    lower.includes('मराठी') ||
    lower.includes('मराठीत') ||
    lower.includes('मराठीमध्ये') ||
    lower.includes('मराठी बोला') ||
    lower.includes('speak in marathi')
  ) {
    return {
      language: 'mr',
      confidence: 1.0,
      voice_id: 'mr-IN-AarohiNeural',
      language_name: 'Marathi (मराठी)',
      is_code_switch: previousLanguage !== 'mr',
    };
  }

  if (
    lower.includes('hindi') ||
    lower.includes('हिंदी') ||
    lower.includes('हिंदी में') ||
    lower.includes('हिंदी बोलो') ||
    lower.includes('speak in hindi')
  ) {
    return {
      language: 'hi',
      confidence: 1.0,
      voice_id: 'hi-IN-SwaraNeural',
      language_name: 'Hindi (हिंदी)',
      is_code_switch: previousLanguage !== 'hi',
    };
  }

  if (
    lower.includes('english') ||
    lower.includes('इंग्रजी') ||
    lower.includes('अंग्रेजी') ||
    lower.includes('speak in english')
  ) {
    return {
      language: 'en',
      confidence: 1.0,
      voice_id: 'en-IN-NeerjaNeural',
      language_name: 'Indian English',
      is_code_switch: previousLanguage !== 'en',
    };
  }

  // 2. Vocabulary scoring
  let marathiScore = 0;
  let hindiScore = 0;

  // Check Marathi markers
  for (const word of MARATHI_DEVANAGARI) {
    if (text.includes(word)) marathiScore += 2.5;
  }
  for (const word of MARATHI_ROMAN) {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    if (regex.test(lower)) marathiScore += 2.0;
  }

  // Check Hindi markers
  for (const word of HINDI_DEVANAGARI) {
    if (text.includes(word)) hindiScore += 2.5;
  }
  for (const word of HINDI_ROMAN) {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    if (regex.test(lower)) hindiScore += 2.0;
  }

  // Evaluate scores
  if (marathiScore > 0 && marathiScore >= hindiScore) {
    return {
      language: 'mr',
      confidence: Math.min(1.0, 0.6 + marathiScore * 0.1),
      voice_id: 'mr-IN-AarohiNeural',
      language_name: 'Marathi (मराठी)',
      is_code_switch: previousLanguage !== 'mr',
    };
  }

  if (hindiScore > 0 && hindiScore > marathiScore) {
    return {
      language: 'hi',
      confidence: Math.min(1.0, 0.6 + hindiScore * 0.1),
      voice_id: 'hi-IN-SwaraNeural',
      language_name: 'Hindi (हिंदी)',
      is_code_switch: previousLanguage !== 'hi',
    };
  }

  // 3. Devanagari script presence fallback
  if (/[\u0900-\u097F]/.test(text)) {
    // If Devanagari is present without specific markers, maintain previous Indic lang or default to Hindi
    const targetLang = previousLanguage === 'mr' ? 'mr' : 'hi';
    return {
      language: targetLang,
      confidence: 0.75,
      voice_id: targetLang === 'mr' ? 'mr-IN-AarohiNeural' : 'hi-IN-SwaraNeural',
      language_name: targetLang === 'mr' ? 'Marathi (मराठी)' : 'Hindi (हिंदी)',
      is_code_switch: previousLanguage !== targetLang,
    };
  }

  // 4. Default to English
  return {
    language: 'en',
    confidence: 0.9,
    voice_id: 'en-IN-NeerjaNeural',
    language_name: 'Indian English',
    is_code_switch: previousLanguage !== 'en',
  };
}

/**
 * Detects if a mid-call language shift has occurred relative to current language
 */
export function detectLanguageShift(
  text: string,
  currentLanguage: SupportedLanguage
): { shifted: boolean; targetLanguage: SupportedLanguage } {
  const result = detectSpokenLanguage(text, currentLanguage);
  return {
    shifted: result.is_code_switch,
    targetLanguage: result.language,
  };
}
