/**
 * Emotion & Vocal Tone Engine
 * Analyzes conversational turns and modulates synthesis pitch, speech rate,
 * and emotional badges (laughter, sympathy, joy, thinking).
 */

export interface DetectedEmotion {
  type: 'laugh' | 'empathy' | 'delight' | 'thinking' | 'reassuring';
  label: string;
  emoji: string;
  pitch: number;
  rate: number;
  badgeClass: string;
}

export function detectEmotion(text: string): DetectedEmotion {
  const lower = text.toLowerCase();

  // 1. Sudden Laugh / Chuckle / Giggles / Humor
  if (
    lower.includes('haha') ||
    lower.includes('hehe') ||
    lower.includes('ha-ha') ||
    lower.includes('हाहा') ||
    lower.includes('हे हे') ||
    lower.includes('हंस') ||
    lower.includes('joke') ||
    lower.includes('funny') ||
    lower.includes('मजाक') ||
    lower.includes('laugh') ||
    lower.includes('good one')
  ) {
    return {
      type: 'laugh',
      label: 'Laughs warmly',
      emoji: '😄',
      pitch: 1.18,
      rate: 1.12,
      badgeClass: 'bg-amber-500/20 text-amber-300 border border-amber-500/40',
    };
  }

  // 2. Deep Sympathy / Empathy for Pain & Discomfort
  if (
    lower.includes('oh no') ||
    lower.includes('sorry to hear') ||
    lower.includes('so sorry') ||
    lower.includes('pain') ||
    lower.includes('toothache') ||
    lower.includes('uncomfortable') ||
    lower.includes('अरे रे') ||
    lower.includes('खूप वाईट') ||
    lower.includes('त्रास') ||
    lower.includes('तकलीफ') ||
    lower.includes('दर्द') ||
    lower.includes('दुख') ||
    lower.includes('वेदना') ||
    lower.includes('कळ')
  ) {
    return {
      type: 'empathy',
      label: 'Empathetic & Caring',
      emoji: '🥺',
      pitch: 0.95,
      rate: 0.94,
      badgeClass: 'bg-rose-500/20 text-rose-300 border border-rose-500/40',
    };
  }

  // 3. Delight / Cheerful / Excitement / Compliment
  if (
    lower.includes('wonderful') ||
    lower.includes('perfect') ||
    lower.includes('great') ||
    lower.includes('love that') ||
    lower.includes('great timing') ||
    lower.includes('oh wow') ||
    lower.includes('अरे वाह') ||
    lower.includes('छान') ||
    lower.includes('मस्त') ||
    lower.includes('सुंदर') ||
    lower.includes('बढ़िया') ||
    lower.includes('वाह') ||
    lower.includes('शाब्बास')
  ) {
    return {
      type: 'delight',
      label: 'Delighted & Cheerful',
      emoji: '✨',
      pitch: 1.12,
      rate: 1.08,
      badgeClass: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40',
    };
  }

  // 4. Thinking Out Loud / Checking
  if (
    lower.includes('hmm') ||
    lower.includes('let me check') ||
    lower.includes('let me see') ||
    lower.includes('हं') ||
    lower.includes('हम्म') ||
    lower.includes('बघतो') ||
    lower.includes('तपासतो') ||
    lower.includes('देखती हूँ') ||
    lower.includes('एक मिनिट') ||
    lower.includes('एक सेकंड')
  ) {
    return {
      type: 'thinking',
      label: 'Thinking out loud',
      emoji: '🤔',
      pitch: 1.02,
      rate: 0.98,
      badgeClass: 'bg-blue-500/20 text-blue-300 border border-blue-500/40',
    };
  }

  // 5. Default Reassuring / Warm Receptionist
  return {
    type: 'reassuring',
    label: 'Warm & Friendly',
    emoji: '😌',
    pitch: 1.06,
    rate: 1.04,
    badgeClass: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40',
  };
}
