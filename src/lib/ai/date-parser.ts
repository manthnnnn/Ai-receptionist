/**
 * Natural Language Date/Time Parser for Marathi, Hindi & English
 * 
 * Converts spoken phrases like:
 *   "उद्या संध्याकाळी ४ वाजता" → 2026-08-31T16:00:00.000Z
 *   "कल सुबह 10 बजे"           → 2026-08-31T10:00:00.000Z
 *   "tomorrow at 4:30 PM"       → 2026-08-31T16:30:00.000Z
 */

// Devanagari digit → ASCII digit
const DEVANAGARI_DIGITS: Record<string, string> = {
  '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
  '५': '5', '६': '6', '७': '7', '८': '8', '९': '9',
};

function devanagariToAscii(str: string): string {
  return str.replace(/[०-९]/g, (ch) => DEVANAGARI_DIGITS[ch] || ch);
}

// ── Day Offset Maps ─────────────────────────────────────────────
const DAY_OFFSETS_MR: Record<string, number> = {
  'आज': 0,
  'उद्या': 1,
  'परवा': 2,
  'उद्यापासून': 1,
};

const DAY_OFFSETS_HI: Record<string, number> = {
  'आज': 0,
  'कल': 1,
  'परसों': 2,
  'परसो': 2,
  'अगले': 1,
};

const DAY_OFFSETS_EN: Record<string, number> = {
  'today': 0,
  'tomorrow': 1,
  'day after tomorrow': 2,
  'day after': 2,
  'next': 1,
};

// ── Time-of-Day Period Maps ─────────────────────────────────────
// Maps period keywords to whether they imply PM (+12h offset)
interface PeriodInfo {
  isPM: boolean;
  defaultHour: number; // fallback hour if no digit found
}

const PERIOD_MR: Record<string, PeriodInfo> = {
  'सकाळी': { isPM: false, defaultHour: 10 },
  'सकाळ': { isPM: false, defaultHour: 10 },
  'दुपारी': { isPM: true, defaultHour: 14 },
  'दुपार': { isPM: true, defaultHour: 14 },
  'संध्याकाळी': { isPM: true, defaultHour: 17 },
  'संध्याकाळ': { isPM: true, defaultHour: 17 },
  'सायंकाळी': { isPM: true, defaultHour: 17 },
  'रात्री': { isPM: true, defaultHour: 20 },
};

const PERIOD_HI: Record<string, PeriodInfo> = {
  'सुबह': { isPM: false, defaultHour: 10 },
  'दोपहर': { isPM: true, defaultHour: 14 },
  'शाम': { isPM: true, defaultHour: 17 },
  'शाम को': { isPM: true, defaultHour: 17 },
  'रात': { isPM: true, defaultHour: 20 },
};

const PERIOD_EN: Record<string, PeriodInfo> = {
  'morning': { isPM: false, defaultHour: 10 },
  'afternoon': { isPM: true, defaultHour: 14 },
  'evening': { isPM: true, defaultHour: 17 },
  'night': { isPM: true, defaultHour: 20 },
};

// ── Day-of-Week Maps ────────────────────────────────────────────
const WEEKDAY_MR: Record<string, number> = {
  'सोमवार': 1, 'मंगळवार': 2, 'बुधवार': 3,
  'गुरुवार': 4, 'शुक्रवार': 5, 'शनिवार': 6, 'रविवार': 0,
};

const WEEKDAY_HI: Record<string, number> = {
  'सोमवार': 1, 'मंगलवार': 2, 'बुधवार': 3,
  'गुरुवार': 4, 'शुक्रवार': 5, 'शनिवार': 6, 'रविवार': 0,
};

const WEEKDAY_EN: Record<string, number> = {
  'monday': 1, 'tuesday': 2, 'wednesday': 3,
  'thursday': 4, 'friday': 5, 'saturday': 6, 'sunday': 0,
};

export interface ParsedDateTime {
  date: string;      // ISO date: "2026-08-31"
  time: string;      // "16:00"
  iso: string;       // full ISO: "2026-08-31T16:00:00.000Z"
  confidence: number; // 0-1
  parsed_day?: string;
  parsed_time?: string;
  is_contradiction?: boolean;
  contradiction_reason?: string;
  is_out_of_hours?: boolean;
}

/**
 * Main parser: extracts date + time from a natural language utterance.
 * Returns null if nothing meaningful could be extracted.
 */
export function parseNaturalDateTime(
  text: string,
  lang: 'mr' | 'hi' | 'en' = 'en'
): ParsedDateTime | null {
  const normalized = devanagariToAscii(text.toLowerCase().trim());
  const now = new Date();
  let targetDate: Date | null = null;
  let targetHour: number | null = null;
  let targetMinute = 0;
  let confidence = 0;
  let parsedDay = '';
  let parsedTime = '';

  // ── 1. Extract Day Offset ───────────────────────────────────────
  const dayMaps = lang === 'mr' ? DAY_OFFSETS_MR : lang === 'hi' ? DAY_OFFSETS_HI : DAY_OFFSETS_EN;
  for (const [keyword, offset] of Object.entries(dayMaps)) {
    if (normalized.includes(keyword) || text.includes(keyword)) {
      targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() + offset);
      parsedDay = keyword;
      confidence += 0.4;
      break;
    }
  }

  // ── 2. Extract Weekday ──────────────────────────────────────────
  if (!targetDate) {
    const weekdayMaps = lang === 'mr' ? WEEKDAY_MR : lang === 'hi' ? WEEKDAY_HI : WEEKDAY_EN;
    for (const [keyword, dayNum] of Object.entries(weekdayMaps)) {
      if (normalized.includes(keyword.toLowerCase()) || text.includes(keyword)) {
        targetDate = new Date(now);
        const currentDay = now.getDay();
        let daysAhead = dayNum - currentDay;
        if (daysAhead <= 0) daysAhead += 7;
        targetDate.setDate(targetDate.getDate() + daysAhead);
        parsedDay = keyword;
        confidence += 0.35;
        break;
      }
    }
  }

  // ── 3. Extract Time Period ──────────────────────────────────────
  const periodMaps = lang === 'mr' ? PERIOD_MR : lang === 'hi' ? PERIOD_HI : PERIOD_EN;
  let periodInfo: PeriodInfo | null = null;

  for (const [keyword, info] of Object.entries(periodMaps)) {
    if (normalized.includes(keyword.toLowerCase()) || text.includes(keyword)) {
      periodInfo = info;
      parsedTime = keyword;
      confidence += 0.2;
      break;
    }
  }

  // Check for AM/PM in English text
  const ampmMatch = normalized.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
  if (ampmMatch) {
    targetHour = parseInt(ampmMatch[1]);
    targetMinute = ampmMatch[2] ? parseInt(ampmMatch[2]) : 0;
    if (ampmMatch[3].toLowerCase() === 'pm' && targetHour < 12) targetHour += 12;
    if (ampmMatch[3].toLowerCase() === 'am' && targetHour === 12) targetHour = 0;
    parsedTime = ampmMatch[0];
    confidence += 0.4;
  }

  // ── 4. Extract Hour Digit ───────────────────────────────────────
  if (targetHour === null) {
    // Match patterns like "4 वाजता", "10 बजे", "4:30", standalone digits near time words
    const hourPatterns = [
      /(\d{1,2})(?::(\d{2}))?\s*(?:वाजता|वाज|बजे|बज|o'?clock)/i,
      /(\d{1,2})(?::(\d{2}))/,
      /(?:at\s+)(\d{1,2})(?::(\d{2}))?/i,
    ];

    for (const pattern of hourPatterns) {
      const match = normalized.match(pattern);
      if (match) {
        targetHour = parseInt(match[1]);
        targetMinute = match[2] ? parseInt(match[2]) : 0;
        if (!parsedTime) parsedTime = match[0];
        confidence += 0.35;
        break;
      }
    }

    // If still no hour, try standalone number near a period keyword
    if (targetHour === null) {
      const standaloneNum = normalized.match(/(\d{1,2})/);
      if (standaloneNum && periodInfo) {
        const num = parseInt(standaloneNum[1]);
        if (num >= 1 && num <= 12) {
          targetHour = num;
          confidence += 0.2;
        }
      }
    }
  }

  // ── 5. Detect Contradictions & Apply Period Offset ─────────────
  let isContradiction = false;
  let contradictionReason = '';

  // Case A: explicit AM/PM conflicts with the period word
  if (ampmMatch && periodInfo) {
    const isExplicitAM = ampmMatch[3].toLowerCase() === 'am';
    const isExplicitPM = ampmMatch[3].toLowerCase() === 'pm';
    if (isExplicitAM && periodInfo.isPM) {
      // e.g. "night 10 AM", "रात्री 10 AM", "afternoon 10 AM"
      isContradiction = true;
      contradictionReason = 'explicit_am_with_pm_period';
    } else if (isExplicitPM && !periodInfo.isPM) {
      // e.g. "morning 8 PM", "सकाळी 8 PM"
      isContradiction = true;
      contradictionReason = 'explicit_pm_with_am_period';
    }
  }

  // Case B: digit contradicts period (e.g. "afternoon 10" where 10 < 12 → morning)
  if (!isContradiction && targetHour !== null && periodInfo && !ampmMatch) {
    if (periodInfo.isPM && targetHour >= 8 && targetHour <= 11) {
      isContradiction = true;
      contradictionReason = `contradiction_morning_in_afternoon`;
    } else if (!periodInfo.isPM && targetHour >= 1 && targetHour <= 7) {
      isContradiction = true;
      contradictionReason = `contradiction_afternoon_in_morning`;
    }

    // Apply offset only if not contradictory
    if (!isContradiction) {
      if (periodInfo.isPM && targetHour >= 1 && targetHour <= 7) {
        targetHour += 12;
      } else if (!periodInfo.isPM && targetHour === 12) {
        targetHour = 0;
      }
    }
  } else if (targetHour !== null && !ampmMatch && !periodInfo) {
    // No period info and no AM/PM — guess based on clinic hours (9:30-19:30)
    if (targetHour >= 1 && targetHour <= 7) {
      targetHour += 12; // 1-7 → 13:00-19:00 (afternoon/evening)
    }
  } else if (targetHour === null && periodInfo) {
    // Period but no digit — use default hour
    targetHour = periodInfo.defaultHour;
    confidence += 0.1;
  }

  // ── 6. Fallback: default to tomorrow if only time was given ─────
  if (!targetDate && (targetHour !== null)) {
    targetDate = new Date(now);
    targetDate.setDate(targetDate.getDate() + 1); // default tomorrow
    parsedDay = lang === 'mr' ? 'उद्या' : lang === 'hi' ? 'कल' : 'tomorrow';
    confidence += 0.1;
  }

  // ── 7. Build ISO String ─────────────────────────────────────────
  if (!targetDate || targetHour === null) {
    return null;
  }

  // Clamp hour to valid range
  targetHour = Math.max(0, Math.min(23, targetHour));
  targetMinute = Math.max(0, Math.min(59, targetMinute));

  const isOutOfHours = (targetHour < 9 || (targetHour === 9 && targetMinute < 30) || targetHour >= 20);

  const year = targetDate.getFullYear();
  const month = String(targetDate.getMonth() + 1).padStart(2, '0');
  const day = String(targetDate.getDate()).padStart(2, '0');
  const hour = String(targetHour).padStart(2, '0');
  const minute = String(targetMinute).padStart(2, '0');

  const dateStr = `${year}-${month}-${day}`;
  const timeStr = `${hour}:${minute}`;
  const isoStr = `${dateStr}T${timeStr}:00.000Z`;

  return {
    date: dateStr,
    time: timeStr,
    iso: isoStr,
    confidence: Math.min(1, confidence),
    parsed_day: parsedDay,
    parsed_time: parsedTime,
    is_contradiction: isContradiction,
    contradiction_reason: contradictionReason,
    is_out_of_hours: isOutOfHours,
  };
}

/**
 * Formats a parsed date/time back into a human-readable string
 * in the given language.
 */
export function formatSlotForSpeech(
  iso: string,
  lang: 'mr' | 'hi' | 'en' = 'en'
): string {
  const d = new Date(iso);
  const hour = d.getUTCHours();
  const minute = d.getUTCMinutes();
  const minuteStr = minute > 0 ? `:${String(minute).padStart(2, '0')}` : '';

  const hour12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  const ampm = hour >= 12 ? 'PM' : 'AM';

  const dayNames_mr = ['रविवार', 'सोमवार', 'मंगळवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'];
  const dayNames_hi = ['रविवार', 'सोमवार', 'मंगलवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'];

  if (lang === 'mr') {
    const period = hour < 12 ? 'सकाळी' : hour < 17 ? 'दुपारी' : 'संध्याकाळी';
    return `${dayNames_mr[d.getUTCDay()]} ${period} ${hour12}${minuteStr} वाजता`;
  }

  if (lang === 'hi') {
    const period = hour < 12 ? 'सुबह' : hour < 17 ? 'दोपहर' : 'शाम';
    return `${dayNames_hi[d.getUTCDay()]} ${period} ${hour12}${minuteStr} बजे`;
  }

  return `${hour12}${minuteStr} ${ampm}`;
}
