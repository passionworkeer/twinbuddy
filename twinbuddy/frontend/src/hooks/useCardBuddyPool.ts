import { useState, useEffect, useCallback } from 'react';
import { fetchBuddies } from '../api/client';
import type { Buddy, OnboardingData } from '../types';

const BUDDY_POOL_LOCAL_KEY = 'twinbuddy_card_buddy_pool';
const BUDDY_POOL_SIZE = 10;

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
    try {
      const stored = localStorage.getItem(BUDDY_POOL_LOCAL_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as { pool: Buddy[]; index: number };
        if (Array.isArray(parsed.pool) && parsed.pool.length > 0) {
          setPool(parsed.pool);
          setIndex(parsed.index % parsed.pool.length);
        }
      }
    } catch { /* ignore */ }
    setIsLoading(false);
  }, []);

  // 持久化
  const persist = useCallback((updatedPool: Buddy[], updatedIndex: number) => {
    try {
      localStorage.setItem(BUDDY_POOL_LOCAL_KEY, JSON.stringify({ pool: updatedPool, index: updatedIndex }));
    } catch { /* ignore */ }
  }, []);

  // 初始化：从 API 加载搭子池
  const initPool = useCallback(async (onboardingData?: OnboardingData | null) => {
    setIsLoading(true);
    try {
      // 优先用预计算搭子（onboarding期间算好的）
      let initialPool: Buddy[] = [];

      const buddies = await fetchBuddies(
        onboardingData?.user_id, BUDDY_POOL_SIZE,
        onboardingData?.mbti,
        onboardingData?.interests,
        onboardingData?.city,
      );
      initialPool = (buddies as unknown as Buddy[]).filter(Boolean);

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
      const next = (prev + 1) % Math.max(pool.length, 1);
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
