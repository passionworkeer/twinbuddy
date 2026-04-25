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