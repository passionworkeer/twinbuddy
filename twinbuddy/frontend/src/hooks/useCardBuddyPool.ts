import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchBuddies } from '../api/client';
import type { Buddy, OnboardingData } from '../types';

export const BUDDY_POOL_LOCAL_KEY = 'twinbuddy_card_buddy_pool';
export const BUDDY_POOL_SIZE = 10;

// ── Pure logic (testable without React) ─────────────────────────────────────

export function loadPoolFromStorage(): { pool: Buddy[]; index: number } | null {
  try {
    const raw = localStorage.getItem(BUDDY_POOL_LOCAL_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { pool: Buddy[]; index: number };
    if (!Array.isArray(parsed.pool) || parsed.pool.length === 0) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function persistPool(pool: Buddy[], index: number): void {
  try {
    localStorage.setItem(BUDDY_POOL_LOCAL_KEY, JSON.stringify({ pool, index }));
  } catch { /* ignore */ }
}

export function advanceBuddyIndex(pool: Buddy[], current: number): number {
  return (current + 1) % Math.max(pool.length, 1);
}

export function buildInitialPool(buddies: Buddy[]): Buddy[] {
  return buddies.filter(Boolean);
}

// ── Hook ───────────────────────────────────────────────────────────────────

export interface CardBuddyPoolState {
  pool: Buddy[];
  index: number;
  isLoading: boolean;
  poolError: string | null;
  currentBuddy: Buddy | null;
  advanceIndex: () => void;
  initPool: (onboardingData?: OnboardingData | null) => Promise<void>;
}

export function useCardBuddyPool(_INTERVAL = 5): CardBuddyPoolState {
  const [pool, setPool] = useState<Buddy[]>(() => {
    const restored = loadPoolFromStorage();
    return restored?.pool ?? [];
  });
  const [index, setIndex] = useState<number>(() => {
    const restored = loadPoolFromStorage();
    return restored?.index ?? 0;
  });
  const [isLoading, setIsLoading] = useState(() => loadPoolFromStorage() === null);
  const [poolError, setPoolError] = useState<string | null>(null);
  const initAttemptsRef = useRef(0);
  const maxInitAttempts = 3;

  // 初始化：从 API 加载搭子池
  const initPool = useCallback(async (onboardingData?: OnboardingData | null) => {
    // 如果已经有池子且加载完成，不需要重复初始化
    if (pool.length > 0 && !isLoading) return;

    // 限制重试次数
    if (initAttemptsRef.current >= maxInitAttempts) {
      console.warn('[CardBuddyPool] 已达到最大初始化尝试次数');
      setPoolError('初始化失败，请刷新页面');
      return;
    }

    initAttemptsRef.current++;
    setIsLoading(true);
    setPoolError(null);

    try {
      console.log('[CardBuddyPool] 正在初始化搭子池 (尝试 ' + initAttemptsRef.current + ')...', { mbti: onboardingData?.mbti, city: onboardingData?.city });
      const buddies = await fetchBuddies(
        undefined, BUDDY_POOL_SIZE,
        onboardingData?.mbti,
        onboardingData?.interests,
        onboardingData?.city,
      );
      const initialPool = buildInitialPool(buddies as unknown as Buddy[]);
      console.log('[CardBuddyPool] 搭子池初始化成功:', initialPool.length, '个搭子');
      setPool(initialPool);
      setIndex(0);
      persistPool(initialPool, 0);
      initAttemptsRef.current = 0; // 成功后重置计数
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[CardBuddyPool] 搭子池初始化失败:', msg);
      setPoolError(msg);
      // 失败时不设置 pool 为空，保留可能存在的旧数据
    } finally {
      setIsLoading(false);
    }
  }, [pool.length, isLoading]);

  // Always read the current pool via ref to avoid stale closures
  const poolRef = useRef(pool);
  useEffect(() => { poolRef.current = pool; }, [pool]);

  // 推进到下一个（环形）
  const advanceIndex = useCallback(() => {
    setIndex(prev => {
      const next = advanceBuddyIndex(poolRef.current, prev);
      persistPool(poolRef.current, next);
      return next;
    });
  }, []); // no deps — reads current pool via ref

  return {
    pool,
    index,
    isLoading,
    poolError,
    get currentBuddy() { return pool[index] ?? null; },
    advanceIndex,
    initPool,
  };
}
