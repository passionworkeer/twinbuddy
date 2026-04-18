// ═══════════════════════════════════════════════════════
// TwinBuddy v3 — TypeScript Type Definitions
// ═══════════════════════════════════════════════════════

// ── Onboarding ────────────────────────────────────────

export interface OnboardingData {
  mbti: string;
  interests: string[];
  voiceText: string;
  city: string;
  completed: boolean;
  timestamp: number;
  user_id?: string;
  persona_id?: string;
}

// ── Persona ──────────────────────────────────────────

export interface PersonaLayer {
  title: string;
  content: string;
  emoji: string;
}

export interface Persona {
  persona_id: string;
  name: string;
  avatar_prompt: string;
  avatar_emoji: string;
  layer0_hard_rules: string[];
  identity: PersonaLayer;
  speaking_style: PersonaLayer & {
    typical_phrases: string[];
    chat_tone: string;
  };
  emotion_decision: PersonaLayer & {
    stress_response: string;
    decision_style: string;
  };
  social_behavior: PersonaLayer & {
    social_style: string;
  };
  travel_style: string;
  mbti_influence: string;
  soul_fingerprint: string;
  confidence_score: number;
  data_sources_used: string[];
}

// ── Feed Response ────────────────────────────────────

export interface FeedResponse {
  videos: VideoItem[];
  buddies: Buddy[];
  user_prefs: {
    city: string;
    mbti: string;
    interests: string[];
  };
}

// ── Feed / Video ─────────────────────────────────────

export interface VideoItem {
  id: string;
  type: 'video' | 'twin_card';
  cover_url: string;
  video_url: string;
  location: string;
  title: string;
  description?: string;
  buddy?: Buddy;
}

export interface VideoStats {
  likes: number;
  comments: number;
  shares: number;
  liked: boolean;
}

// ── Buddy / Match ────────────────────────────────────

export interface Buddy {
  name: string;
  mbti: string;
  avatar_emoji: string;
  typical_phrases: string[];
  travel_style: string;
  compatibility_score: number;
}

// ── Compatibility Breakdown ───────────────────────────

export interface CompatibilityBreakdown {
  total: number;
  pace: { score: number; reason: string };
  social_energy: { score: number; reason: string };
  decision_style: { score: number; reason: string };
  interest: { score: number; reason: string };
  budget: { score: number; reason: string };
  personality: { score: number; reason: string };
  red_flags: string[];
  strengths: string[];
}

// ── Negotiation ──────────────────────────────────────

export interface NegotiationMessage {
  speaker: 'user' | 'buddy';
  buddy_name?: string;
  content: string;
  timestamp: number;
}

export interface RadarData {
  dimension: string;
  user_score: number;  // 0–100
  buddy_score: number; // 0–100
  weight: number;      // 0–1
}

export interface NegotiationResult {
  destination: string;
  dates: string;
  budget: string;
  consensus: boolean;
  plan: string[];
  matched_buddies: string[];
  radar: RadarData[];
  red_flags: string[];
  messages: NegotiationMessage[];
  analysis_report?: string;
  analysis_basis?: {
    input_tags?: string[];
    strengths?: string[];
    conflicts?: string[];
  };
}

// ── TwinCard ─────────────────────────────────────────

export type TwinCardLayer = 1 | 2 | 3;

export interface TwinCardState {
  layer: TwinCardLayer;
  expanded: boolean;
  result?: NegotiationResult;
  userPersona?: Persona;
  buddy?: Buddy;
}

// ── Storage Keys ─────────────────────────────────────

export const STORAGE_KEYS = {
  onboarding: 'twinbuddy_onboarding_v3',
  feed_index: 'twinbuddy_feed_index_v3',
  twin_cards_seen: 'twinbuddy_cards_seen',
  video_likes: 'twinbuddy_video_likes_v3',
  matched_personas: 'twinbuddy_matched',
  negotiation_result: 'twinbuddy_negotiation_result_v3',
} as const;

// ── MBTI Constants ───────────────────────────────────

export const MBTI_TYPES = [
  'ENFP', 'ENFJ', 'ENTP', 'ENTJ',
  'ESFP', 'ESFJ', 'ESTP', 'ESTJ',
  'INFP', 'INFJ', 'INTP', 'INTJ',
  'ISFP', 'ISFJ', 'ISTP', 'ISTJ',
] as const;

export type MBTIType = typeof MBTI_TYPES[number];

export const MBTI_LABELS: Record<string, string> = {
  ENFP: '热情开拓者', ENFJ: '理想领袖', ENTP: '智多星',    ENTJ: '指挥官',
  ESFP: '舞台明星',  ESFJ: '主人',     ESTP: '创业者',     ESTJ: '总经理',
  INFP: '诗意漫游者',INFJ: '引路人',   INTP: '学者',        INTJ: '战略家',
  ISFP: '艺术家',    ISFJ: '守护者',   ISTP: '工匠',        ISTJ: '审计师',
};

// ── Interest Tags ────────────────────────────────────
// 第1组（旅行节奏）：说走就走、慢节奏旅行、详细打卡、深度慢游、自驾自由、夜猫子旅行
// 第2组（风景活动）：爱看山川湖海、古镇人文、摄影打卡、徒步登山、露营野趣、城市夜游
// 第3组（美食社交）：重度火锅党、街边小吃探店、预算控制党、各自行动派、爱拍照分享、早起党

export const INTEREST_TAGS = [
  // 第1组：旅行节奏
  '说走就走', '慢节奏旅行', '详细打卡', '深度慢游', '自驾自由', '夜猫子旅行',
  // 第2组：风景活动
  '爱看山川湖海', '古镇人文', '摄影打卡', '徒步登山', '露营野趣', '城市夜游',
  // 第3组：美食社交
  '重度火锅党', '街边小吃探店', '预算控制党', '各自行动派', '爱拍照分享', '早起党',
] as const;

export type InterestTag = typeof INTEREST_TAGS[number];

// ── Cities ────────────────────────────────────────────

export const CITIES = [
  { id: 'chengdu',   name: '成都',   emoji: '🐼', gradient: 'from-orange-600 to-red-500' },
  { id: 'chongqing', name: '重庆',   emoji: '🌶️', gradient: 'from-red-600 to-orange-500' },
  { id: 'dali',      name: '大理',   emoji: '🌊', gradient: 'from-cyan-500 to-blue-500' },
  { id: 'lijiang',   name: '丽江',   emoji: '🏔️', gradient: 'from-purple-500 to-indigo-500' },
  { id: 'huangguoshu',name:'黄果树', emoji: '💧', gradient: 'from-teal-500 to-green-500' },
  { id: 'xian',      name: '西安',   emoji: '🏯', gradient: 'from-amber-600 to-yellow-500' },
  { id: 'qingdao',   name: '青岛',   emoji: '🍺', gradient: 'from-blue-500 to-cyan-400' },
  { id: 'guilin',    name: '桂林',   emoji: '🎋', gradient: 'from-green-500 to-emerald-500' },
  { id: 'harbin',    name: '哈尔滨', emoji: '❄️', gradient: 'from-sky-400 to-blue-500' },
  { id: 'xiamen',    name: '厦门',   emoji: '🌴', gradient: 'from-teal-400 to-cyan-500' },
] as const;

export type City = typeof CITIES[number];

// ── API Params ────────────────────────────────────────

export interface NegotiateParams {
  user_id?: string;
  user_persona_id?: string;
  buddy_mbti?: string;
  mbti?: string;
  interests?: string[];
  voiceText?: string;
  travel_style?: string;
  destination: string;
}
