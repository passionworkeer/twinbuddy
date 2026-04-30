/**
 * TwinBuddy v3 — 前端 API 客户端
 *
 * 环境配置：
 *   开发环境 (npm run dev): VITE_API_BASE = "/api"（Vite 代理）
 *   生产环境 (nginx 部署):  同源，无需代理
 */

import type {
  Persona,
  NegotiationResult,
  NegotiateParams,
  TwinBuddyV2BuddyCard,
  TwinBuddyV2BuddyInboxItem,
  TwinBuddyV2ChatMessage,
  TwinBuddyConversationItem,
  BlindGameReport,
  BlindGameRound,
  TwinBuddyV2Profile,
  TwinBuddyRoomMessage,
  TwinBuddySecurityStatus,
  TwinBuddyTripStatus,
  TwinBuddyCommunityPost,
  TwinBuddyCommunityComment,
} from '../types';

// ── 环境配置 ─────────────────────────────────────────

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

function apiUrl(path: string): string {
  return `${API_BASE}${path}`;
}

// ── 请求工具 ─────────────────────────────────────────

async function apiGet<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(apiUrl(path), window.location.origin);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  const res = await fetch(url.toString(), {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

async function apiPost<T, B = unknown>(
  path: string,
  body: B,
  options?: { timeoutMs?: number },
): Promise<T> {
  const timeoutMs = options?.timeoutMs;
  const controller = new AbortController();
  const timeoutId = timeoutMs
    ? window.setTimeout(() => controller.abort(), timeoutMs)
    : null;

  try {
    const res = await fetch(apiUrl(path), {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || `HTTP ${res.status}`);
    }
    return res.json() as Promise<T>;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeoutMs}ms`);
    }
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(String(error));
  } finally {
    if (timeoutId) {
      window.clearTimeout(timeoutId);
    }
  }
}

// ── API 响应结构 ────────────────────────────────────

interface ApiSuccess<T> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}

interface ApiError {
  success: false;
  error: string;
}

type ApiResponse<T> = ApiSuccess<T> | ApiError;

function unwrap<T>(res: ApiResponse<T>): T {
  if (!res.success) {
    throw new Error((res as ApiError).error);
  }
  return (res as ApiSuccess<T>).data;
}

// ── API 接口 ────────────────────────────────────────

/**
 * GET /api/persona
 * 无 user_id 时根据参数构建人格（预计算场景）
 * 有 user_id 时从后端持久化数据读取
 */
export async function fetchPersona(params: {
  userId?: string;
  mbti?: string;
  interests?: string[];
  city?: string;
  voiceText?: string;
}): Promise<Persona> {
  const queryParams: Record<string, string> = {};
  if (params.userId) queryParams.user_id = params.userId;
  if (params.mbti) queryParams.mbti = params.mbti;
  if (params.interests && params.interests.length > 0) queryParams.interests = params.interests.join(',');
  if (params.city) queryParams.city = params.city;
  if (params.voiceText) queryParams.voice_text = params.voiceText;
  const res = await apiGet<ApiResponse<Persona>>('/persona', queryParams);
  return unwrap(res);
}

/**
 * GET /api/buddies
 * 获取按兼容性评分排序的推荐搭子
 */
export async function fetchBuddies(
  userId?: string,
  limit = 10,
  mbti?: string,
  interests?: string[],
  city?: string,
) {
  const params: Record<string, string> = { limit: String(limit) };
  if (userId) params.user_id = userId;
  if (mbti) params.mbti = mbti;
  if (interests && interests.length > 0) params.interests = interests.join(',');
  if (city) params.city = city;
  const res = await apiGet<ApiResponse<unknown[]> & { buddies?: unknown[] }>('/buddies', params);
  if (Array.isArray((res as any).buddies)) {
    return (res as any).buddies as Record<string, unknown>[];
  }
  return unwrap(res) as Record<string, unknown>[];
}

/**
 * POST /api/negotiate
 * 双数字人协商，返回协商结果
 */
const NEGOTIATION_TIMEOUT_MS = 30_000;

export async function negotiate(options: NegotiateParams): Promise<NegotiationResult> {
  const res = await apiPost<ApiResponse<NegotiationResult>, NegotiateParams>(
    '/negotiate',
    options,
    { timeoutMs: NEGOTIATION_TIMEOUT_MS },
  );
  return unwrap(res);
}

export async function createTwinBuddyProfile(payload: {
  userId?: string;
  mbti: string;
  travelRange: string[];
  budget: string;
  selfDescription: string;
  city: string;
}): Promise<TwinBuddyV2Profile> {
  const res = await apiPost<ApiResponse<TwinBuddyV2Profile>, Record<string, unknown>>('/profiles', {
    user_id: payload.userId,
    mbti: payload.mbti,
    travel_range: payload.travelRange,
    budget: payload.budget,
    self_desc: payload.selfDescription,
    city: payload.city,
  });
  return unwrap(res);
}

export async function fetchTwinBuddyProfile(userId: string): Promise<TwinBuddyV2Profile> {
  const res = await apiGet<ApiResponse<TwinBuddyV2Profile>>(`/profiles/${userId}`);
  return unwrap(res);
}

export async function fetchTwinBuddyBuddyInbox(userId: string): Promise<TwinBuddyV2BuddyInboxItem[]> {
  const res = await apiGet<ApiResponse<{ items: TwinBuddyV2BuddyInboxItem[] }>>('/buddies/inbox', {
    user_id: userId,
    page: '1',
  });
  return unwrap(res).items;
}

export async function fetchTwinBuddyBuddyCard(
  buddyId: string,
  negotiationId: string,
): Promise<TwinBuddyV2BuddyCard> {
  const res = await apiGet<ApiResponse<TwinBuddyV2BuddyCard>>(`/buddies/${buddyId}/card`, {
    negotiation_id: negotiationId,
  });
  return unwrap(res);
}

export async function fetchTwinBuddyChatHistory(
  conversationId: string,
): Promise<{ conversation_id: string; user_id: string; items: TwinBuddyV2ChatMessage[] }> {
  const res = await apiGet<
    ApiResponse<{ conversation_id: string; user_id: string; items: TwinBuddyV2ChatMessage[] }>
  >(`/chat/history/${conversationId}`);
  return unwrap(res);
}

export async function streamTwinBuddyChat(
  body: { userId: string; message: string; conversationId?: string },
  handlers: {
    onMeta?: (conversationId: string) => void;
    onMessage?: (chunk: string) => void;
    onPreferenceHint?: (hint: string) => void;
  },
): Promise<{ conversationId: string }> {
  const response = await fetch(apiUrl('/chat/send'), {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: body.userId,
      message: body.message,
      conversation_id: body.conversationId,
    }),
  });

  if (!response.ok || !response.body) {
    throw new Error(`HTTP ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  let conversationId = body.conversationId ?? '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const events = buffer.split('\n\n');
    buffer = events.pop() ?? '';

    for (const rawEvent of events) {
      const line = rawEvent
        .split('\n')
        .find((item) => item.startsWith('data: '));
      if (!line) continue;

      const payload = JSON.parse(line.slice(6)) as {
        type: string;
        conversation_id?: string;
        content?: string;
      };
      if (payload.conversation_id) {
        conversationId = payload.conversation_id;
      }

      if (payload.type === 'meta' && payload.conversation_id) {
        handlers.onMeta?.(payload.conversation_id);
      }
      if (payload.type === 'message' && payload.content) {
        handlers.onMessage?.(payload.content);
      }
      if (payload.type === 'preference_hint' && payload.content) {
        handlers.onPreferenceHint?.(payload.content);
      }
    }
  }

  return { conversationId };
}

export async function fetchTwinBuddyConversations(userId: string): Promise<TwinBuddyConversationItem[]> {
  const res = await apiGet<ApiResponse<{ items: TwinBuddyConversationItem[] }>>('/conversations', {
    user_id: userId,
  });
  return unwrap(res).items;
}

export async function fetchTwinBuddyRoomMessages(roomId: string): Promise<TwinBuddyRoomMessage[]> {
  const res = await apiGet<ApiResponse<{ items: TwinBuddyRoomMessage[] }>>(`/messages/${roomId}`, {
    page: '1',
  });
  return unwrap(res).items;
}

export async function sendTwinBuddyRoomMessage(body: {
  roomId: string;
  senderId: string;
  content: string;
  type?: string;
}): Promise<TwinBuddyRoomMessage> {
  const res = await apiPost<ApiResponse<TwinBuddyRoomMessage>, Record<string, unknown>>('/messages', {
    room_id: body.roomId,
    sender_id: body.senderId,
    content: body.content,
    type: body.type ?? 'text',
  });
  return unwrap(res);
}

export async function patchTwinBuddyProfile(
  userId: string,
  body: {
    budget?: string;
    selfDescription?: string;
    city?: string;
    travelRange?: string[];
    styleVector?: Record<string, unknown>;
  },
): Promise<TwinBuddyV2Profile> {
  const res = await fetch(apiUrl(`/profiles/${userId}`), {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      budget: body.budget,
      self_desc: body.selfDescription,
      city: body.city,
      travel_range: body.travelRange,
      style_vector: body.styleVector,
    }),
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return unwrap(await res.json() as ApiResponse<TwinBuddyV2Profile>);
}

export async function fetchTwinBuddySecurityStatus(userId: string): Promise<TwinBuddySecurityStatus> {
  const res = await apiGet<ApiResponse<TwinBuddySecurityStatus>>(`/security/status/${userId}`);
  return unwrap(res);
}

export async function submitTwinBuddyVerification(body: {
  userId: string;
  legalName: string;
  idNumberTail: string;
}): Promise<TwinBuddySecurityStatus> {
  const res = await apiPost<ApiResponse<TwinBuddySecurityStatus>, Record<string, unknown>>('/security/verify', {
    user_id: body.userId,
    legal_name: body.legalName,
    id_number_tail: body.idNumberTail,
    face_checked: true,
  });
  return unwrap(res);
}

export async function startBlindGame(body: {
  userId: string;
  negotiationId: string;
}): Promise<{ game_id: string; rounds: BlindGameRound[] }> {
  const res = await apiPost<ApiResponse<{ game_id: string; rounds: BlindGameRound[] }>, Record<string, string>>(
    '/games/blind/start',
    { user_id: body.userId, negotiation_id: body.negotiationId },
  );
  return unwrap(res);
}

export async function answerBlindGame(body: {
  gameId: string;
  roundId: string;
  choice: 'A' | 'B';
}): Promise<{ done: boolean; rounds_completed: number; game_id: string }> {
  const res = await apiPost<
    ApiResponse<{ done: boolean; rounds_completed: number; game_id: string }>,
    Record<string, string>
  >('/games/blind/answer', {
    game_id: body.gameId,
    round_id: body.roundId,
    choice: body.choice,
  });
  return unwrap(res);
}

export async function fetchBlindGameReport(gameId: string): Promise<BlindGameReport> {
  const res = await apiGet<ApiResponse<BlindGameReport>>(`/games/blind/${gameId}/report`);
  return unwrap(res);
}

export async function reportTwinBuddyTrip(body: {
  userAId: string;
  userBId: string;
  destination: string;
  departDate: string;
  returnDate: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
}): Promise<TwinBuddyTripStatus> {
  const res = await apiPost<ApiResponse<TwinBuddyTripStatus>, Record<string, string>>('/trips/report', {
    user_a_id: body.userAId,
    user_b_id: body.userBId,
    destination: body.destination,
    depart_date: body.departDate,
    return_date: body.returnDate,
    emergency_contact_name: body.emergencyContactName,
    emergency_contact_phone: body.emergencyContactPhone,
  });
  return unwrap(res);
}

export async function fetchTwinBuddyCommunityFeed(userId?: string): Promise<TwinBuddyCommunityPost[]> {
  const params: Record<string, string> = { page: '1' };
  if (userId) {
    params.user_id = userId;
  }
  const res = await apiGet<ApiResponse<{ items: TwinBuddyCommunityPost[] }>>('/posts/feed', params);
  return unwrap(res).items;
}

export async function createTwinBuddyCommunityPost(body: {
  userId: string;
  content: string;
  location: string;
  tags: string[];
}): Promise<TwinBuddyCommunityPost> {
  const res = await apiPost<ApiResponse<TwinBuddyCommunityPost>, Record<string, unknown>>('/posts', {
    user_id: body.userId,
    content: body.content,
    images: [],
    tags: body.tags,
    location: body.location,
    is_travel_plan: true,
  });
  return unwrap(res);
}

export async function likeTwinBuddyCommunityPost(postId: string, userId: string): Promise<{ liked: boolean; likes_count: number }> {
  const res = await apiPost<ApiResponse<{ liked: boolean; likes_count: number }>, Record<string, string>>(
    `/posts/${postId}/like`,
    { user_id: userId },
  );
  return unwrap(res);
}

export async function commentTwinBuddyCommunityPost(
  postId: string,
  body: { userId: string; content: string },
): Promise<TwinBuddyCommunityComment> {
  const res = await apiPost<ApiResponse<TwinBuddyCommunityComment>, Record<string, string>>(
    `/posts/${postId}/comments`,
    { user_id: body.userId, content: body.content },
  );
  return unwrap(res);
}

export async function triggerTwinBuddyCommunityTwinChat(
  postId: string,
  userId: string,
): Promise<{ status: string; summary: string }> {
  const res = await apiPost<ApiResponse<{ status: string; summary: string }>, Record<string, string>>(
    `/posts/${postId}/twin-chat`,
    { user_id: userId },
  );
  return unwrap(res);
}
