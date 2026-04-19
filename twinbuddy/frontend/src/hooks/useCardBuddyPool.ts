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

  // 初始化：从 API 加载搭子池
  const initPool = useCallback(async (onboardingData?: OnboardingData | null) => {
    setIsLoading(true);
    try {
      const buddies = await fetchBuddies(
        undefined, BUDDY_POOL_SIZE,
        onboardingData?.mbti,
        onboardingData?.interests,
        onboardingData?.city,
      );
      const initialPool = buildInitialPool(buddies as unknown as Buddy[]);
      setPool(initialPool);
      setIndex(0);
      persistPool(initialPool, 0);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setPoolError(msg);
      /* silent — pool stays [], caller handles via poolError state */
    } finally {
      setIsLoading(false);
    }
  }, []);

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
