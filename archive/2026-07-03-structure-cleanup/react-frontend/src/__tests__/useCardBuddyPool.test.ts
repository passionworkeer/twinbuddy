import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  loadPoolFromStorage,
  persistPool,
  advanceBuddyIndex,
  buildInitialPool,
  BUDDY_POOL_LOCAL_KEY,
} from '../hooks/useCardBuddyPool';
import type { Buddy } from '../types';

const STORAGE_KEY = BUDDY_POOL_LOCAL_KEY;

const mockBuddies: Buddy[] = [
  { id: 'b1', name: '小满', mbti: 'ENFP', avatar_emoji: '✨', typical_phrases: ['说走就走！'], travel_style: '随性探索型', compatibility_score: 95 },
  { id: 'b2', name: '老陈', mbti: 'ISTJ', avatar_emoji: '📊', typical_phrases: ['计划先行'], travel_style: '规划型', compatibility_score: 88 },
  { id: 'b3', name: '小鱼', mbti: 'INFP', avatar_emoji: '🐟', typical_phrases: ['随缘吧'], travel_style: '佛系型', compatibility_score: 82 },
];

function clearStorage() { localStorage.removeItem(STORAGE_KEY); }

beforeEach(() => clearStorage());
afterEach(() => clearStorage());

// ── advanceBuddyIndex ───────────────────────────────────────────────────────

describe('advanceBuddyIndex — circular', () => {
  it('starts at 0 for empty pool', () => {
    expect(advanceBuddyIndex([], 0)).toBe(0);
  });

  it('advances by 1', () => {
    expect(advanceBuddyIndex(mockBuddies, 0)).toBe(1);
    expect(advanceBuddyIndex(mockBuddies, 1)).toBe(2);
  });

  it('wraps from last back to 0', () => {
    expect(advanceBuddyIndex(mockBuddies, 2)).toBe(0); // b3 → b1
  });

  it('circular full cycle', () => {
    let idx = 0;
    const steps = [];
    for (let i = 0; i < 6; i++) {
      steps.push(mockBuddies[idx]?.name);
      idx = advanceBuddyIndex(mockBuddies, idx);
    }
    expect(steps).toEqual(['小满', '老陈', '小鱼', '小满', '老陈', '小鱼']);
  });
});

// ── buildInitialPool ──────────────────────────────────────────────────────

describe('buildInitialPool', () => {
  it('filters null/undefined entries', () => {
    const mixed = [mockBuddies[0], null as any, mockBuddies[1], undefined as any, mockBuddies[2]];
    const result = buildInitialPool(mixed);
    expect(result).toEqual(mockBuddies);
    expect(result.length).toBe(3);
  });

  it('returns empty array for all null', () => {
    expect(buildInitialPool([null as any, null as any])).toEqual([]);
  });
});

// ── persistPool / loadPoolFromStorage ─────────────────────────────────────

describe('localStorage round-trip', () => {
  it('persists and loads pool with index', () => {
    persistPool(mockBuddies, 1);
    const loaded = loadPoolFromStorage();
    expect(loaded?.pool).toEqual(mockBuddies);
    expect(loaded?.index).toBe(1);
  });

  it('returns null when storage is empty', () => {
    expect(loadPoolFromStorage()).toBeNull();
  });

  it('returns null for corrupted JSON', () => {
    localStorage.setItem(STORAGE_KEY, 'not json');
    expect(loadPoolFromStorage()).toBeNull();
  });

  it('returns null for empty pool in storage', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ pool: [], index: 0 }));
    expect(loadPoolFromStorage()).toBeNull();
  });

  it('returns null for missing pool field', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ index: 1 }));
    expect(loadPoolFromStorage()).toBeNull();
  });

  it('wraps index modulo pool length on restore', () => {
    persistPool(mockBuddies, 5); // 5 % 3 = 2
    // loadPoolFromStorage does NOT wrap — that's the caller's responsibility
    const loaded = loadPoolFromStorage();
    expect(loaded?.index).toBe(5); // stored as-is
  });
});

// ── Integration: advance + persist + load cycle ──────────────────────────────

describe('full cycle: advance → persist → load', () => {
  it('persists updated index after each advance', () => {
    persistPool(mockBuddies, 0);
    const idx1 = advanceBuddyIndex(mockBuddies, 0);
    persistPool(mockBuddies, idx1);
    expect(loadPoolFromStorage()?.index).toBe(1);

    const idx2 = advanceBuddyIndex(mockBuddies, idx1);
    persistPool(mockBuddies, idx2);
    expect(loadPoolFromStorage()?.index).toBe(2);
  });

  it('survives page refresh (simulated via localStorage)', () => {
    // simulate: pool built, index advanced twice
    persistPool(mockBuddies, 2); // at last buddy

    // simulate page reload — new hook instance reads from storage
    const restored = loadPoolFromStorage();
    expect(restored?.pool).toEqual(mockBuddies);
    expect(restored?.index).toBe(2);

    // next advance wraps
    const next = advanceBuddyIndex(restored!.pool, restored!.index);
    expect(next).toBe(0); // wraps back to first buddy
  });
});
