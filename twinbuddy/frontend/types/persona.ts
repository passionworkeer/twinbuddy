// ========== API Request / Response Types ==========

export interface GenerateAvatarRequest {
  douyin_json?: File;
  mbti_txt?: File;
  chat_logs?: File;
  photo?: File;
}

export interface ParsedFileSummary {
  filename: string;
  size: number;
  summary: string;
  preview?: string;
}

export interface PersonaLayer {
  title: string;
  content: string;
  emoji: string;
}

export interface Persona {
  // 唯一标识
  persona_id: string;
  name: string;
  avatar_prompt: string; // 用于生成 avatar 的描述词

  // Layer 0: 硬规则（红色边框标识）
  layer0_hard_rules: string[];
  // Layer 1: Identity & Background
  identity: PersonaLayer;
  // Layer 2: Speaking Style
  speaking_style: PersonaLayer & {
    typical_phrases: string[];
    chat_tone: string;
  };
  // Layer 3: Emotion & Decision
  emotion_decision: PersonaLayer & {
    stress_response: string;
    decision_style: string;
  };
  // Layer 4: Social Behavior
  social_behavior: PersonaLayer & {
    social_style: string;
  };
  // Additional layers
  travel_style: string;
  mbti_influence: string;
  soul_fingerprint: string;
  confidence_score: number;
  data_sources_used: string[];
}

// ========== Upload Slot Types ==========

export type FileSlotType = 'douyin_json' | 'mbti_txt' | 'chat_logs' | 'photo';
export type UploadSlotStatus = 'idle' | 'dragover' | 'uploaded' | 'error';

export interface FileSlotConfig {
  type: FileSlotType;
  label: string;
  description: string;
  accepted: string;
  icon: string;
  optional: boolean;
}

// ========== Match / Negotiation Types ==========

export interface Buddy {
  name: string;
  mbti: string;
  avatar_prompt: string;
  typical_phrases: string[];
  travel_style: string;
  compatibility_score: number;
}

export interface NegotiationMessage {
  speaker: 'user' | 'buddy';
  buddy_name?: string;
  content: string;
  timestamp: number;
}

export interface MatchResult {
  destination: string;
  dates: string;
  budget: string;
  consensus: boolean;
  plan: string[];
  matched_buddies: string[];
}

export interface MatchState {
  persona: Persona;
  user_id?: string;
  session_key?: string;
}

// ========== Stepper Types ==========

export type StepStatus = 'pending' | 'active' | 'completed';

export interface Step {
  id: number;
  title: string;
  subtitle: string;
}
