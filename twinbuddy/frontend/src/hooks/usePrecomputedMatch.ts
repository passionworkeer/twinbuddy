import { useCallback } from 'react';
import { negotiate, fetchBuddies, fetchPersona } from '../api/client';
import { STORAGE_KEYS, type PrecomputedMatch, type Buddy, type NegotiationResult, type OnboardingData, type Persona } from '../types';
import fallbackNegotiations from '../mocks/negotiations.json';

type FallbackRecord = {
  pair_id: string;
  user_mbti: string;
  buddy_mbti: string;
  destination: string;
  radar: NegotiationResult['radar'];
  red_flags: NegotiationResult['red_flags'];
  messages: NegotiationResult['messages'];
  consensus: boolean;
  dates: string;
  budget: string;
  plan: NegotiationResult['plan'];
};

const MATCH_SCENE_CARDS = [
  { id: 'chengdu', location: '成都' },
  { id: 'chongqing', location: '重庆' },
  { id: 'chuanxi', location: '川西' },
  { id: 'dali', location: '大理' },
  { id: 'lijiang', location: '丽江' },
  { id: 'qingdao', location: '青岛' },
  { id: 'xiamen', location: '厦门' },
  { id: 'xian', location: '西安' },
];

// 根据用户 MBTI + 目的地查找降级对话，找不到则保留用户选择的目的地
function findFallbackNegotiation(userMbti: string, destination: string): NegotiationResult {
  const records = fallbackNegotiations as FallbackRecord[];
  // 精确匹配 user_mbti + destination
  const exact = records.find(r => r.user_mbti === userMbti && r.destination === destination);
  if (exact) return { ...exact, matched_buddies: [] } as NegotiationResult;
  // 按目的地匹配（同一目的地不同 MBTI 的对话）
  const byDest = records.filter(r => r.destination === destination);
  if (byDest.length > 0) return { ...byDest[Math.floor(Math.random() * byDest.length)], matched_buddies: [] } as NegotiationResult;
  // 没有匹配数据时，保留用户选择的 destination，只替换其他字段
  if (records.length > 0) {
    const fallback = records[Math.floor(Math.random() * records.length)];
    return {
      ...fallback,
      destination, // 保留用户选择的城市
      matched_buddies: [],
    } as NegotiationResult;
  }
  return {
    destination,
    dates: '5月10日-5月15日',
    budget: '人均3500元',
    consensus: true,
    plan: ['风景优先', '轻徒步', '特色民宿'],
    matched_buddies: [],
    radar: [
      { dimension: '行程节奏', user_score: 85, buddy_score: 80, weight: 0.8 },
      { dimension: '美食偏好', user_score: 80, buddy_score: 85, weight: 0.6 },
      { dimension: '拍照风格', user_score: 90, buddy_score: 75, weight: 0.5 },
      { dimension: '预算控制', user_score: 70, buddy_score: 75, weight: 0.7 },
      { dimension: '冒险精神', user_score: 85, buddy_score: 90, weight: 0.9 },
    ],
    red_flags: [],
    messages: [
      { speaker: 'user', content: '我们周末去旅行吧！', timestamp: 1700000000 },
      { speaker: 'buddy', content: '听起来不错！我也想出去走走。', timestamp: 1700000010 },
      { speaker: 'user', content: '那就说定了！', timestamp: 1700000020 },
      { speaker: 'buddy', content: '好的，期待这次旅行！', timestamp: 1700000030 },
    ],
  };
}

export function usePrecomputedMatch() {
  // 保存预计算结果到 localStorage
  const savePrecomputed = useCallback((match: PrecomputedMatch) => {
    try {
      localStorage.setItem(STORAGE_KEYS.precomputed_match, JSON.stringify(match));
    } catch (err) {
      console.error('保存预计算数据失败:', err);
    }
  }, []);

  // 从 localStorage 读取预计算结果
  const getPrecomputed = useCallback((): PrecomputedMatch | null => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.precomputed_match);
      if (!stored) return null;
      return JSON.parse(stored) as PrecomputedMatch;
    } catch {
      return null;
    }
  }, [])

  // 清除预计算数据
  const clearPrecomputed = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.precomputed_match);
  }, [])

  // 开始预计算
  const startPrecomputation = useCallback(async (obData: OnboardingData) => {
    // 1. 确定目的地（同时匹配 id 和 location）
    let destination = obData.city || MATCH_SCENE_CARDS[Math.floor(Math.random() * MATCH_SCENE_CARDS.length)].location;
    const matchedCard = MATCH_SCENE_CARDS.find(c => c.id === destination || c.location === destination);
    if (matchedCard) {
      destination = matchedCard.location;
    }

    // 初始化状态：先保存目的地和 pending 状态
    const initialMatch: PrecomputedMatch = {
      topBuddy: null,
      negotiationResult: null,
      destination,
      computedAt: Date.now(),
      status: 'pending',
    };
    savePrecomputed(initialMatch);

    try {
      // 2. LLM 分析用户人格（根据 MBTI + 兴趣 + 城市 + 语音）
      let userPersona: Persona | null = null;
      try {
        userPersona = await fetchPersona({
          mbti: obData.mbti,
          interests: obData.interests,
          city: obData.city,
          voiceText: obData.voiceText,
        });
        console.log('预计算：用户人格生成成功', userPersona?.persona_id);
      } catch (personaErr) {
        console.error('预计算：生成用户人格失败', personaErr);
      }

      // 3. 获取 top1 搭子（基于用户人格）
      let topBuddy: Buddy | null = null;
      try {
        const buddies = await fetchBuddies(
          undefined, // user_id (不需要)
          1,
          obData.mbti,
          obData.interests,
          obData.city
        );
        topBuddy = (buddies[0] || null) as unknown as Buddy | null;
        // 立即保存搭子信息，这样卡片可以立即显示搭子预览
        savePrecomputed({
          ...initialMatch,
          topBuddy,
        });
      } catch (buddyErr) {
        console.error('预计算：获取搭子失败', buddyErr);
      }

      // 4. 真实协商（使用 LLM 生成的人格）
      let negotiationResult: NegotiationResult | null = null;
      try {
        negotiationResult = await negotiate({
          user_id: obData.user_id || undefined,
          user_persona_id: userPersona?.persona_id || obData.persona_id || undefined,
          buddy_mbti: topBuddy?.mbti || 'ENFP',
          mbti: obData.mbti || undefined,
          interests: obData.interests ?? [],
          voiceText: obData.voiceText || undefined,
          destination,
        });
      } catch (negErr) {
        console.error('预计算：协商失败，使用 mock', negErr);
        negotiationResult = findFallbackNegotiation(obData.mbti || 'ENFP', destination);
      }

      // 保存结果
      const finalMatch: PrecomputedMatch = {
        topBuddy,
        negotiationResult,
        destination,
        computedAt: Date.now(),
        status: 'ready',
      };
      savePrecomputed(finalMatch);
      return finalMatch;

    } catch (err) {
      console.error('预计算失败:', err);
      const errorMatch: PrecomputedMatch = {
        ...initialMatch,
        status: 'error',
      };
      savePrecomputed(errorMatch);
      return errorMatch;
    }
  }, [savePrecomputed])

  return {
    getPrecomputed,
    clearPrecomputed,
    startPrecomputation,
  };
}
