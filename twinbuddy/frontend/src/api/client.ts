/**
 * TwinBuddy v3 — 前端 API 客户端
 *
 * 环境配置：
 *   开发环境 (npm run dev): VITE_API_BASE = "/api"（Vite 代理）
 *   生产环境 (nginx 部署):  同源，无需代理
 *
 * 启动后端:
 *   cd twinbuddy/backend
 *   python -m uvicorn main:app --host 0.0.0.0 --port 8000
 */

import type {
  OnboardingData,
  Persona,
  VideoItem,
  NegotiationResult,
  NegotiateParams,
} from '../types';

// ── 环境配置 ─────────────────────────────────────────

const API_BASE = import.meta.env.VITE_API_BASE || '/api';
const ONBOARDING_TIMEOUT_MS = 10_000;
const NEGOTIATION_TIMEOUT_MS = 15_000;

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
    throw error;
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
 * POST /api/onboarding
 * 保存用户引导数据（MBTI + 兴趣 + 语音 + 城市）
 */
export async function saveOnboarding(
  data: OnboardingData,
): Promise<{ user_id: string; persona_id: string }> {
  const res = await apiPost<ApiResponse<{ user_id: string; persona_id: string }>, OnboardingData>(
    '/onboarding',
    data,
    { timeoutMs: ONBOARDING_TIMEOUT_MS },
  );
  const d = unwrap(res);
  return { user_id: d.user_id, persona_id: d.persona_id };
}

/**
 * GET /api/persona?user_id=xxx
 * 获取当前用户的数字孪生人格
 */
export async function fetchPersona(userId: string): Promise<Persona> {
  const res = await apiGet<ApiResponse<Persona>>('/persona', { user_id: userId });
  return unwrap(res);
}

/**
 * GET /api/feed?city=xxx&user_id=xxx
 * 获取视频 Feed 列表
 * 第3条开始触发懂你卡片（type: "twin_card"）
 */
export async function fetchFeed(city?: string, userId?: string): Promise<VideoItem[]> {
  const params: Record<string, string> = {};
  if (city) params.city = city;
  if (userId) params.user_id = userId;
  const res = await apiGet<ApiResponse<VideoItem[]>>('/feed', params);
  return unwrap(res);
}

/**
 * GET /api/buddies?limit=10
 * 获取搭子列表（无 user_id 时返回全部搭子，无评分）
 * GET /api/buddies?user_id=xxx&limit=10
 * 获取按兼容性评分排序的推荐搭子
 */
export async function fetchBuddies(userId?: string, limit = 10) {
  const params: Record<string, string> = { limit: String(limit) };
  if (userId) params.user_id = userId;
  const res = await apiGet<ApiResponse<unknown[]>>('/buddies', params);
  return unwrap(res) as Record<string, unknown>[];
}

/**
 * POST /api/negotiate
 * 双数字人协商，返回预生成协商结果
 */
export async function negotiate(options: NegotiateParams): Promise<NegotiationResult> {
  const res = await apiPost<ApiResponse<NegotiationResult>, NegotiateParams>(
    '/negotiate',
    options,
    { timeoutMs: NEGOTIATION_TIMEOUT_MS },
  );
  return unwrap(res);
}

/**
 * GET /health
 * 健康检查
 */
export async function healthCheck(): Promise<{ status: string; version: string }> {
  const res = await fetch(apiUrl('/health').replace('/api', ''));
  if (!res.ok) throw new Error(`Health check failed: ${res.status}`);
  return res.json() as Promise<{ status: string; version: string }>;
}
