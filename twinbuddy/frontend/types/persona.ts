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
  // Layer 0: 硬规则（红色边框标识）
  layer0_hard_rules: string[];
  // Layer 1: Identity & Background
  identity: PersonaLayer;
  // Layer 2: Speaking Style
  speaking_style: PersonaLayer;
  // Layer 3: Emotion & Decision
  emotion_decision: PersonaLayer;
  // Layer 4: Social Behavior
  social_behavior: PersonaLayer;
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

// ========== Stepper Types ==========

export type StepStatus = 'pending' | 'active' | 'completed';

export interface Step {
  id: number;
  title: string;
  subtitle: string;
}

// ========== Match / Buddy Types ==========

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

export interface Buddy {
  name: string;
  mbti: string;
  avatar_prompt: string;
  typical_phrases: string[];
  travel_style: string;
  compatibility_score: number;
}
