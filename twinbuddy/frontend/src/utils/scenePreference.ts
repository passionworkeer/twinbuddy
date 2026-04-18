import type { GuidePreference } from '../types';

const INDOOR_TAG_WEIGHTS: Record<string, number> = {
  古镇人文: 3,
  街边小吃探店: 2,
  各自行动派: 2,
  预算控制党: 1,
  夜猫子旅行: 1,
};

const OUTDOOR_TAG_WEIGHTS: Record<string, number> = {
  爱看山川湖海: 3,
  徒步登山: 3,
  露营野趣: 3,
  摄影打卡: 2,
  自驾自由: 2,
  说走就走: 1,
};

export function inferGuidePreference(interests: string[]): GuidePreference {
  if (!Array.isArray(interests) || interests.length === 0) {
    return 'outdoor';
  }

  const scores = interests.reduce(
    (acc, tag) => {
      const indoorWeight = INDOOR_TAG_WEIGHTS[tag] ?? 0;
      const outdoorWeight = OUTDOOR_TAG_WEIGHTS[tag] ?? 0;
      return {
        indoor: acc.indoor + indoorWeight,
        outdoor: acc.outdoor + outdoorWeight,
      };
    },
    { indoor: 0, outdoor: 0 },
  );

  if (scores.indoor > scores.outdoor) {
    return 'indoor';
  }

  return 'outdoor';
}

export function guidePreferenceLabel(preference: GuidePreference): string {
  return preference === 'indoor' ? '室内向推荐' : '户外向推荐';
}
