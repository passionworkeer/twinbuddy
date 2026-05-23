import { useState, useEffect, useCallback } from 'react';
import { fetchBuddies } from '../api/client';
import type { Buddy, OnboardingData } from '../types';

export const BUDDY_POOL_LOCAL_KEY = 'twinbuddy_card_buddy_pool';
const BUDDY_POOL_SIZE = 10;

// ── Standalone utility functions (exported for testing) ─────────────────────

export function advanceBuddyIndex(buddies: Buddy[], index: number): number {
  if (buddies.length === 0) return 0;
  return (index + 1) % buddies.length;
}

export function buildInitialPool(buddies: (Buddy | null | undefined)[]): Buddy[] {
  return buddies.filter((b): b is Buddy => b != null);
}

export function persistPool(buddies: Buddy[], index: number): void {
  try {
    localStorage.setItem(BUDDY_POOL_LOCAL_KEY, JSON.stringify({ pool: buddies, index }));
  } catch (error) {
    console.warn('Failed to persist buddy pool.', error);
  }
}

export interface StoredPool {
  pool: Buddy[];
  index: number;
}

function _clampIndex(index: unknown, poolLength: number): number {
  if (typeof index !== 'number' || !Number.isFinite(index)) {
    return 0;
  }
  if (poolLength === 0) return 0;
  const normalized = ((index % poolLength) + poolLength) % poolLength;
  return normalized;
}

export function loadPoolFromStorage(): StoredPool | null {
  try {
    const raw = localStorage.getItem(BUDDY_POOL_LOCAL_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return null;

    const { pool, index } = parsed as { pool: unknown; index: unknown };

    if (!Array.isArray(pool) || pool.length === 0) return null;
    const safeIndex = _clampIndex(index, pool.length);
    return { pool: pool as Buddy[], index: safeIndex };
  } catch (error) {
    console.warn('Failed to load buddy pool from storage.', error);
    return null;
  }
}

interface CardBuddyPoolState {
  pool: Buddy[];
  index: number;
  isLoading: boolean;
  currentBuddy: Buddy | null;
  advanceIndex: () => void;
  initPool: (onboardingData?: OnboardingData | null) => Promise<void>;
}

export function useCardBuddyPool(INTERVAL = 5): CardBuddyPoolState {
  const [pool, setPool] = useState<Buddy[]>([]);
  const [index, setIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // 从 localStorage 恢复（刷新页面后继续轮播）
  useEffect(() => {
    const stored = loadPoolFromStorage();
    if (stored) {
      setPool(stored.pool);
      setIndex(stored.index);
    }
    setIsLoading(false);
  }, []);

  // 持久化
  const persist = useCallback((updatedPool: Buddy[], updatedIndex: number) => {
    persistPool(updatedPool, updatedIndex);
  }, []);

  // 初始化：从 API 加载搭子池
  const initPool = useCallback(async (onboardingData?: OnboardingData | null) => {
    setIsLoading(true);
    try {
      const buddies = await fetchBuddies(
        onboardingData?.user_id, BUDDY_POOL_SIZE,
        onboardingData?.mbti,
        onboardingData?.interests,
        onboardingData?.city,
      );
      const initialPool = (buddies as unknown as Buddy[]).filter(Boolean);

      setPool(initialPool);
      setIndex(0);
      persist(initialPool, 0);
    } catch (err) {
      console.error('加载搭子池失败:', err);
    } finally {
      setIsLoading(false);
    }
  }, [persist]);

  // 推进到下一个（环形）
  const advanceIndex = useCallback(() => {
    setIndex(prev => {
      const next = advanceBuddyIndex(pool, prev);
      persist(pool, next);
      return next;
    });
  }, [pool, persist]);

  return {
    pool,
    index,
    isLoading,
    get currentBuddy() { return pool[index] ?? null; },
    advanceIndex,
    initPool,
  };
}
