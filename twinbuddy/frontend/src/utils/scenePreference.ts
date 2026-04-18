import type { GuidePreference } from '../types';

const TAG_WEIGHTS: Record<string, Record<GuidePreference, number>> = {
  // 室内放松
  古镇人文:        { indoorRelaxed: 1, indoorCultural: 3, outdoorNormal: 1, outdoorAdventure: 0 },
  街边小吃探店:    { indoorRelaxed: 3, indoorCultural: 1, outdoorNormal: 0, outdoorAdventure: 0 },
  各自行动派:      { indoorRelaxed: 2, indoorCultural: 1, outdoorNormal: 2, outdoorAdventure: 2 },
  预算控制党:      { indoorRelaxed: 3, indoorCultural: 0, outdoorNormal: 1, outdoorAdventure: 0 },
  夜猫子旅行:      { indoorRelaxed: 2, indoorCultural: 1, outdoorNormal: 1, outdoorAdventure: 0 },
  // 室内文化
  摄影打卡:        { indoorRelaxed: 1, indoorCultural: 3, outdoorNormal: 2, outdoorAdventure: 1 },
  详细打卡:        { indoorRelaxed: 1, indoorCultural: 2, outdoorNormal: 3, outdoorAdventure: 1 },
  慢节奏旅行:      { indoorRelaxed: 3, indoorCultural: 2, outdoorNormal: 1, outdoorAdventure: 0 },
  城市夜游:        { indoorRelaxed: 2, indoorCultural: 1, outdoorNormal: 2, outdoorAdventure: 1 },
  爱拍照分享:      { indoorRelaxed: 2, indoorCultural: 2, outdoorNormal: 2, outdoorAdventure: 1 },
  // 户外常规
  爱看山川湖海:    { indoorRelaxed: 0, indoorCultural: 1, outdoorNormal: 3, outdoorAdventure: 3 },
  自驾自由:        { indoorRelaxed: 0, indoorCultural: 1, outdoorNormal: 3, outdoorAdventure: 2 },
  说走就走:        { indoorRelaxed: 1, indoorCultural: 1, outdoorNormal: 2, outdoorAdventure: 3 },
  早起党:          { indoorRelaxed: 1, indoorCultural: 1, outdoorNormal: 2, outdoorAdventure: 2 },
  // 户外冒险
  徒步登山:        { indoorRelaxed: 0, indoorCultural: 0, outdoorNormal: 1, outdoorAdventure: 3 },
  露营野趣:        { indoorRelaxed: 0, indoorCultural: 0, outdoorNormal: 1, outdoorAdventure: 3 },
  深度慢游:        { indoorRelaxed: 1, indoorCultural: 2, outdoorNormal: 2, outdoorAdventure: 2 },
  重度火锅党:      { indoorRelaxed: 1, indoorCultural: 0, outdoorNormal: 0, outdoorAdventure: 0 },
};

export function inferGuidePreference(interests: string[]): GuidePreference {
  if (!Array.isArray(interests) || interests.length === 0) {
    return 'outdoorNormal';
  }

  const allPrefs: GuidePreference[] = ['indoorRelaxed', 'indoorCultural', 'outdoorNormal', 'outdoorAdventure'];
  const scores = Object.fromEntries(
    allPrefs.map(p => [p, 0])
  ) as Record<GuidePreference, number>;

  for (const tag of interests) {
    const weights = TAG_WEIGHTS[tag];
    if (weights) {
      for (const p of allPrefs) {
        scores[p] += weights[p];
      }
    }
  }

  const max = Math.max(...allPrefs.map(p => scores[p]));
  const candidates = allPrefs.filter(p => scores[p] === max);

  // 平分时优先按室内/外来区分
  const indoorCandidates = candidates.filter(p => p.startsWith('indoor'));
  const outdoorCandidates = candidates.filter(p => p.startsWith('outdoor'));
  if (indoorCandidates.length === 1) return indoorCandidates[0];
  if (outdoorCandidates.length === 1) return outdoorCandidates[0];

  // 仍有平分：先看户外常规是否能从冒险中区分出来
  if (scores.outdoorNormal >= scores.outdoorAdventure) return 'outdoorNormal';
  if (scores.outdoorAdventure > scores.outdoorNormal) return 'outdoorAdventure';

  // 最终保底
  return 'outdoorNormal';
}

const PREFERENCE_LABELS: Record<GuidePreference, string> = {
  indoorRelaxed:    '室内治愈线',
  indoorCultural:   '室内文化线',
  outdoorNormal:    '户外轻度线',
  outdoorAdventure: '户外冒险线',
};

export function guidePreferenceLabel(preference: GuidePreference): string {
  return PREFERENCE_LABELS[preference] ?? '未知偏好';
}
