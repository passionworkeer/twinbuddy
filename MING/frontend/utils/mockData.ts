import type { Persona } from '../types/persona';

/** Mock persona — used when USE_MOCK=true or API is unavailable */
export const MOCK_PERSONA: Persona = {
  layer0_hard_rules: ['不接受封闭式行程规划', '每天必须有 1 小时独处时间'],
  identity: {
    emoji: '🎨',
    title: '内向型创意探索者',
    content:
      '23岁视觉设计师，习惯用图像而非文字记录生活。对陌生城市有强烈好奇，但倾向于独自深度游而非走马观花。对噪音密集型景点有天然排斥，偏好有在地文化的小众目的地。',
  },
  speaking_style: {
    emoji: '💬',
    title: '沉默型表达者',
    content:
      '文字简洁有力，极少使用感叹号或表情包。线上聊天回复间隔较长（平均 2–4 小时），但每次回复内容完整有逻辑。偏好异步沟通，对即时回复要求低。',
  },
  emotion_decision: {
    emoji: '🧭',
    title: '理性-感受混合型',
    content:
      '做旅行决策时先收集大量信息（Pinterest/小红书/孤独星球），再凭直觉挑选。情绪波动时倾向独处消化，极少向外倾诉。对同伴的情绪变化感知敏锐，会默默调整节奏。',
  },
  social_behavior: {
    emoji: '🤝',
    title: '选择性社交',
    content:
      '在陌生社交场合中通常观察 10–15 分钟后再融入。对"一起去呗"类邀约响应率低，但对有明确主题的活动（CityWalk、摄影之旅）参与意愿高。关系建立后忠诚度高。',
  },
  travel_style:
    '策展人模式——提前 2 周做攻略，每天安排 1–2 个核心体验，其余时间随意漫游。不喜欢被时间表束缚，但讨厌没有方向感的"随便逛逛"。',
  mbti_influence:
    'INFP 的内倾感知（Si-Te）使其在陌生城市能快速建立个人化探索路径，但对同伴的逻辑性行程规划有本能尊重——前提是留有独处空间。',
  soul_fingerprint: '在混乱中寻找美，在独处中获得能量，在深度连接中被治愈。',
  confidence_score: 0.87,
  data_sources_used: ['mbti_txt', 'chat_logs'],
};
