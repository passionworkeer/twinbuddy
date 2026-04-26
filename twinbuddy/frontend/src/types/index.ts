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

export type GuidePreference = 'indoorRelaxed' | 'indoorCultural' | 'outdoorNormal' | 'outdoorAdventure';

export interface LocationGuideVersion {
  heading: string;
  summary: string;
  highlights: string[];
  strategies: string[];
}

export interface LocationGuide {
  locationId: string;
  headline: string;
  description: string;
  preference: GuidePreference;
  preferenceLabel: string;
  version: LocationGuideVersion;
}

export interface VideoItem {
  id: string;
  type: 'video' | 'twin_card' | 'location_card';
  cover_url: string;
  video_url: string;
  location: string;
  title: string;
  description?: string;
  buddy?: Buddy;
  locationGuide?: LocationGuide;
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

export type NegotiationReportSnapshots = Record<string, NegotiationResult>;

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
  negotiation_reports: 'twinbuddy_negotiation_reports_v3',
  latest_report_id: 'twinbuddy_latest_report_id_v3',
  precomputed_match: 'twinbuddy_precomputed_match_v3', // 预计算的懂你卡片数据
} as const;

// ── Precomputed Match ────────────────────────────────

export interface PrecomputedMatch {
  topBuddy: Buddy | null;
  negotiationResult: NegotiationResult | null;
  destination: string;
  computedAt: number; // 时间戳
  status: 'pending' | 'ready' | 'error';
}

// ── MBTI Constants ───────────────────────────────────

export const MBTI_TYPES = [
  'ENFP', 'ENFJ', 'ENTP', 'ENTJ',
  'ESFP', 'ESFJ', 'ESTP', 'ESTJ',
  'INFP', 'INFJ', 'INTP', 'INTJ',
  'ISFP', 'ISFJ', 'ISTP', 'ISTJ',
] as const;

export type MBTIType = typeof MBTI_TYPES[number];

export const MBTI_LABELS: Record<string, string> = {
  ENFP: '热情探索者 · 点子多、喜欢新鲜感',
ENFJ: '理想领袖 · 善于协调、重视他人感受',
ENTP: '智多星 · 爱辩论、思路跳脱、点子达人',
ENTJ: '指挥官 · 决策果断、喜欢掌控节奏',
ESFP: '舞台明星 · 爱热闹、自来熟、气氛组',
ESFJ: '主人 · 热情好客、喜欢照顾同伴',
ESTP: '创业者 · 爱冒险、行动派、不喜欢拖沓',
ESTJ: '总经理 · 靠谱务实、喜欢有计划',
INFP: '诗意漫游者 · 内心丰富、追求意义感',
INFJ: '引路人 · 有洞察力、安静但有温度',
INTP: '学者 · 逻辑强、爱研究、喜欢独处思考',
INTJ: '战略家 · 规划清晰、追求卓越',
ISFP: '艺术家 · 审美在线、活在当下',
ISFJ: '守护者 · 细腻贴心、稳定可靠',
ISTP: '工匠 · 手艺好、动手能力强',
ISTJ: '审计师 · 靠谱细心、有责任感',
};

// ── Interest Tags ────────────────────────────────────
// 第1组（旅行节奏）：说走就走、慢节奏旅行、详细打卡、深度慢游、自驾自由、夜猫子旅行
// 第2组（风景活动）：爱看山川湖海、古镇人文、摄影打卡、徒步登山、露营野趣、城市夜游
// 第3组（美食社交）：重度火锅党、街边小吃探店、预算控制党、各自行动派、爱拍照分享、早起党

export const INTEREST_TAGS = [
  // 节奏偏好
  '说走就走', '慢节奏旅行', '详细打卡', '深度慢游', '自驾自由', '特种兵式', '早起看日出',
  // 风景活动
  '山川湖海', '古镇人文', '摄影打卡', '徒步登山', '露营野趣', '城市夜游', '海岛度假', '滑雪潜水',
  // 美食偏好
  '重度火锅党', '街边小吃探店', '美食优先', '自己做饭', '预算控制', '品质餐厅',
  // 旅行风格
  '爱做攻略', '随性漫游', '社交搭子', '独自旅行', '拍照分享', '不带手机放空',
  // 住宿偏好
  '酒店舒适', '青旅社交', '民宿体验', '露营野外',
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

// ── TwinBuddy V2 Onboarding ─────────────────────────

export const TRAVEL_RANGE_OPTIONS = [
  { value: '同城', label: '同城周边' },
  { value: '周边城市', label: '周边城市' },
  { value: '周末短途', label: '周末短途' },
  { value: '小长假', label: '小长假出行' },
  { value: '国内', label: '国内长途' },
  { value: '出境短线', label: '出境短线（日韩/东南亚）' },
  { value: '出境长线', label: '出境长线（欧美澳新）' },
  { value: '说走就走', label: '说走就走' },
] as const;

export const TRAVEL_BUDGET_OPTIONS = [
  { value: '穷游', label: '穷游', description: '更看重性价比和低成本路线。' },
  { value: '经济', label: '经济', description: '预算明确，希望舒服但不浪费。' },
  { value: '舒适', label: '舒适', description: '愿意为节奏和体验支付更多。' },
  { value: '品质', label: '品质', description: '优先选择确定性和高质量体验。' },
] as const;

export type TravelRangeOption = typeof TRAVEL_RANGE_OPTIONS[number]['value'];
export type TravelBudgetOption = typeof TRAVEL_BUDGET_OPTIONS[number]['value'];

export interface TwinBuddyV2OnboardingData {
  mbti: string;
  travelRange: TravelRangeOption[];
  interests: string[];
  budget: TravelBudgetOption | '';
  selfDescription: string;
  city: string;
  completed: boolean;
  timestamp: number;
  userId?: string;
  styleVector?: Record<string, unknown>;
}

export const V2_STORAGE_KEYS = {
  onboarding: 'twinbuddy_v2_onboarding',
  chatConversation: 'twinbuddy_v2_chat_conversation',
} as const;

export interface TwinBuddyV2Profile {
  user_id: string;
  nickname: string;
  mbti: string;
  travel_range: string[];
  budget: string;
  self_desc: string;
  city: string;
  style_vector: Record<string, unknown>;
  is_verified: boolean;
  verification_status: string;
  verified_at?: number | null;
  updated_at: number;
}

export interface TwinBuddySecurityStatus {
  user_id: string;
  is_verified: boolean;
  verification_status: string;
  real_name_masked: string;
  id_number_tail: string;
  verified_at?: number | null;
}

export interface TwinBuddyV2BuddyInboxItem {
  buddy_id: string;
  nickname: string;
  mbti: string;
  avatar: string;
  city: string;
  match_score: number;
  negotiation_id: string;
  status: string;
  preview: string;
  highlights: string[];
  conflicts: string[];
}

export interface TwinBuddyV2BuddyCard {
  profile: {
    buddy_id: string;
    nickname: string;
    mbti: string;
    avatar: string;
    city: string;
    summary: string;
  };
  negotiation_summary: {
    negotiation_id: string;
    match_score: number;
    consensus: string[];
    conflicts: string[];
    report_intro: string;
  };
  radar_chart: RadarData[];
  actions: Array<{ id: string; label: string }>;
}

export interface TwinBuddyV2ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: number;
}

export interface TwinBuddyConversationItem {
  room_id: string;
  peer_user: {
    id: string;
    nickname: string;
    mbti: string;
  };
  last_message: string;
  unread_count: number;
}

export interface TwinBuddyRoomMessage {
  id: string;
  sender_id: string;
  content: string;
  type: string;
  created_at: number;
}

export interface BlindGameRound {
  id: string;
  dimension: string;
  option_a: string;
  option_b: string;
}

export interface BlindGameReport {
  user_choices: Record<string, 'A' | 'B'>;
  buddy_choices: Record<string, 'A' | 'B'>;
  per_round_result: Array<{
    round_id: string;
    dimension: string;
    user_choice: 'A' | 'B';
    buddy_choice: 'A' | 'B';
    user_label: string;
    buddy_label: string;
    matched: boolean;
  }>;
  match_score: number;
  analysis: string;
}

export interface TwinBuddyTripStatus {
  trip_id: string;
  status: string;
  destination: string;
  depart_date: string;
  return_date: string;
  emergency_contact_masked: string;
  emergency_notification_sent: boolean;
  created_at: number;
}

export interface TwinBuddyCommunityComment {
  id: string;
  user_id: string;
  author_nickname: string;
  content: string;
  created_at: number;
}

export interface TwinBuddyCommunityPost {
  id: string;
  user_id?: string;
  author: {
    nickname: string;
    mbti: string;
  };
  content: string;
  images: string[];
  tags: string[];
  location: string;
  is_travel_plan?: boolean;
  trip_date?: string | null;
  trip_days?: number | null;
  trip_budget?: string | null;
  likes_count: number;
  comments_count: number;
  comments: TwinBuddyCommunityComment[];
  created_at: number;
}
