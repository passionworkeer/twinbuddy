import type { Persona } from '../types';

// ========== ENFP ==========
const MANNI: Persona = {
  persona_id: 'manni-enfp-001',
  name: 'MANNI',
  avatar_emoji: '🌈',
  avatar_prompt: 'enthusiastic woman, short curly hair, warm smile',
  layer0_hard_rules: ['never decide for me', 'no public criticism'],
  identity: {
    emoji: '🧭',
    title: 'Identity',
    content: 'Former advertising creative, now freelance writer and diarist.',
  },
  speaking_style: {
    emoji: '💬',
    title: 'Style',
    content: 'Fast talker, lots of exclamation marks!',
    typical_phrases: ['Lets do this!', 'This is amazing!', 'Wait let me feel it first'],
    chat_tone: 'high energy, emotionally expressive',
  },
  emotion_decision: {
    emoji: '🧠',
    title: 'Decision',
    content: 'I need to feel it first before I want to go somewhere.',
    stress_response: 'needs to vent and be understood',
    decision_style: 'intuition-driven, easily moved by sensory experiences',
  },
  social_behavior: {
    emoji: '🤝',
    title: 'Social',
    content: 'Slow to warm up, but very affectionate once close.',
    social_style: 'empathetic, relationship-oriented, needs independence',
  },
  travel_style: 'spontaneous, resists strict schedules',
  mbti_influence: 'ENFP: curious, values authenticity over efficiency',
  soul_fingerprint: 'seeking the surprise moment of discovery',
  confidence_score: 0.87,
  data_sources_used: ['mbti'],
};

// ========== ISTJ ==========
const LAOJIANG: Persona = {
  persona_id: 'laojiang-istj-002',
  name: 'LAOJIANG',
  avatar_emoji: '📐',
  avatar_prompt: 'steady man, glasses, business casual',
  layer0_hard_rules: ['need plan B', 'no last-minute changes'],
  identity: {
    emoji: '🧭',
    title: 'Identity',
    content: 'Experienced project manager, 8 years in operations.',
  },
  speaking_style: {
    emoji: '💬',
    title: 'Style',
    content: 'Economical with words, data-driven communicator.',
    typical_phrases: ['I already checked', 'Follow the plan', 'Confirm first'],
    chat_tone: 'precise, information-dense, efficient',
  },
  emotion_decision: {
    emoji: '🧠',
    title: 'Decision',
    content: 'I need to see enough information before deciding.',
    stress_response: 'needs more time to think, seeks internal certainty',
    decision_style: 'risk-aware, longer decision cycle, firm once decided',
  },
  social_behavior: {
    emoji: '🤝',
    title: 'Social',
    content: 'Not great at small talk, but always keeps promises.',
    social_style: 'promise-keeper, trust built on action, detail-oriented',
  },
  travel_style: 'minute-by-minute planning, always has backup plans',
  mbti_influence: 'ISTJ: relies on past experience, pursues efficiency',
  soul_fingerprint: 'a good trip means being able to clearly describe each day',
  confidence_score: 0.91,
  data_sources_used: ['mbti'],
};

// ========== INFP ==========
const SUWAN: Persona = {
  persona_id: 'suwan-infp-003',
  name: 'SUWAN',
  avatar_emoji: '🌙',
  avatar_prompt: 'gentle quiet woman, soft eyes, linen clothing',
  layer0_hard_rules: ['do not rush my decisions', 'do not compare me to others'],
  identity: {
    emoji: '🧭',
    title: 'Identity',
    content: 'Lifestyle magazine editor who loves places with stories.',
  },
  speaking_style: {
    emoji: '💬',
    title: 'Style',
    content: 'Speaks slowly, uses metaphors, rarely gives black-and-white judgments.',
    typical_phrases: ['I have a strange feeling', 'Can you understand', 'This is hard to describe'],
    chat_tone: 'poetic expression, rich in metaphor,细腻情感',
  },
  emotion_decision: {
    emoji: '🧠',
    title: 'Decision',
    content: 'I make decisions slowly, imagining myself in different scenarios.',
    stress_response: 'needs solitude and quiet space for reflection',
    decision_style: 'introverted reflection, value-driven',
  },
  social_behavior: {
    emoji: '🤝',
    title: 'Social',
    content: 'Prefers 2-3 person trips, needs comfort period with new people.',
    social_style: 'deep connection type, needs solitude time',
  },
  travel_style: 'slow wandering, only goes to places that feel right',
  mbti_influence: 'INFP: inner values drive all judgments, open to possibilities',
  soul_fingerprint: 'go to a place, be still, wait for it to tell me who it is',
  confidence_score: 0.84,
  data_sources_used: ['mbti'],
};

export const PERSONA_MOCK_DATA = MANNI;
export const PERSONA_EXAMPLES: Persona[] = [MANNI, LAOJIANG, SUWAN];
