import { useCallback } from 'react';
import { negotiate, fetchBuddies } from '../api/client';
import { STORAGE_KEYS, type PrecomputedMatch, type Buddy, type NegotiationResult, type OnboardingData } from '../types';

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

const MOCK_NEGOTIATION: NegotiationResult = {
  destination: '大理',
  dates: '5月10日-5月15日',
  budget: '人均3500元',
  consensus: true,
  plan: ['风景优先', '轻徒步', '特色民宿'],
  matched_buddies: ['小雅', '小鱼'],
  radar: [
    { dimension: '行程节奏', user_score: 90, buddy_score: 85, weight: 0.8 },
    { dimension: '美食偏好', user_score: 85, buddy_score: 80, weight: 0.6 },
    { dimension: '拍照风格', user_score: 75, buddy_score: 95, weight: 0.5 },
    { dimension: '预算控制', user_score: 60, buddy_score: 70, weight: 0.7 },
    { dimension: '冒险精神', user_score: 95, buddy_score: 85, weight: 0.9 },
    { dimension: '随性程度', user_score: 80, buddy_score: 90, weight: 0.8 },
  ],
  red_flags: [],
  messages: [
    { speaker: 'user', content: '这次周末去走个线，风景不错，要不要一起？', timestamp: 1700000000 },
    { speaker: 'buddy', content: '听起来不错！难度大吗？我最近体力还可以，想挑战一下。', timestamp: 1700000010 },
    { speaker: 'user', content: '爬升有点，但竹海那段很舒服的，准备好越野鞋就行。', timestamp: 1700000020 },
    { speaker: 'buddy', content: '好！我这就去准备装备。', timestamp: 1700000030 },
  ],
};

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
    // 初始化状态为 pending
    const initialMatch: PrecomputedMatch = {
      topBuddy: null,
      negotiationResult: null,
      destination: obData.city || MATCH_SCENE_CARDS[3].location, // 默认大理
      computedAt: Date.now(),
      status: 'pending',
    };
    savePrecomputed(initialMatch);

    try {
      // 1. 获取 top1 搭子
      let topBuddy: Buddy | null = null;
      try {
        const buddies = await fetchBuddies(obData.user_id, 1);
        topBuddy = (buddies[0] || null) as unknown as Buddy | null;
      } catch (buddyErr) {
        console.error('预计算：获取搭子失败', buddyErr);
      }

      // 2. 确定目的地
      let destination = obData.city || MATCH_SCENE_CARDS[Math.floor(Math.random() * MATCH_SCENE_CARDS.length)].location;
      // 如果是 id，转换为 location
      const matchedCard = MATCH_SCENE_CARDS.find(c => c.id === destination);
      if (matchedCard) {
        destination = matchedCard.location;
      }

      // 3. 真实协商
      let negotiationResult: NegotiationResult | null = null;
      try {
        negotiationResult = await negotiate({
          user_id: obData.user_id || undefined,
          user_persona_id: obData.persona_id || undefined,
          buddy_mbti: topBuddy?.mbti || 'ENFP',
          mbti: obData.mbti || undefined,
          interests: obData.interests ?? [],
          voiceText: obData.voiceText || undefined,
          destination,
        });
      } catch (negErr) {
        console.error('预计算：协商失败，使用 mock', negErr);
        negotiationResult = { ...MOCK_NEGOTIATION, destination };
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
