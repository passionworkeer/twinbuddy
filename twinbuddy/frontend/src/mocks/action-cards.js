/**
 * TwinBuddy ActionCard mock 数据
 * 依据：docs/action-cards.md §1-§6
 * 用途：演示 ActionCard.vue 4 态 + F3 协商页 + F4 邀约页
 */

export const tripCardA1 = {
  id: 'trip-a1-dapeng',
  scene: 'trip',
  variant: 'plan',
  state: 'plan',
  title: '你最近好像想找个轻松的周末短途旅行',
  trigger_reason: '基于你最近看的 4 条深圳周边游 + 周末空闲 + 预算 150-250 元',
  intent: '去深圳周边度个轻松的周末',
  plan: '周六 14:00 出发大鹏半日游，海边散步 + 咖啡 + 拍照，预算 150-200 元',
  needs_buddy: 'optional',
  candidates: [
    {
      id: 'twinbuddy-mock-001',
      nickname: '周末出逃型 ENFP',
      match_label: 'most_match',
      match_reason: '同预算 + 同节奏（150-200 元，不赶景点）',
      conflicts: ['爱拍照'],
      avatar_url: 'https://picsum.photos/seed/mock-001/96/96',
    },
    {
      id: 'twinbuddy-mock-002',
      nickname: '路线控 INTJ',
      match_label: 'most_complement',
      match_reason: '会做攻略，预算 200-250，节奏快一些',
      conflicts: ['要早起'],
      avatar_url: 'https://picsum.photos/seed/mock-002/96/96',
    },
    {
      id: 'twinbuddy-mock-005',
      nickname: '特种兵旅行 ESTP',
      match_label: 'most_interesting',
      match_reason: '兴趣相似但希望早出发',
      conflicts: ['节奏太快'],
      avatar_url: 'https://picsum.photos/seed/mock-005/96/96',
    },
  ],
  negotiation_summary: {
    agreed: [
      '都接受大鹏',
      '时间 14:00 后',
      '都不特种兵',
      '首次见面地铁口见',
    ],
    pending: [
      '对方希望多拍照 / 你偏散步',
      '返程时间需对齐',
    ],
    risks: [
      '对方偏早起（建议再约 14:30）',
      '周末大鹏交通可能堵',
    ],
    key_moment: {
      speaker: 'buddy_twin',
      text: '你接受临时改时间吗？',
      detected_conflict: '你不想早起，对方希望早出发',
      resolution: '都接受 14:00 后，留出早午餐时间',
      outcome: 'agreed',
    },
    progress: 79,
  },
  risks: [
    '对方偏拍照你偏散步，提前确认节奏',
    '返程别太晚，建议 19:00 前',
  ],
  next_actions: [],
  follow_up: [
    { type: 'route', label: '查看路线' },
    { type: 'food', label: '查看附近餐饮' },
    { type: 'hotel', label: '查看住宿' },
    { type: 'guide', label: '查看攻略' },
    { type: 'copy', label: '复制邀约文案' },
  ],
  meta: {
    deadline: '本周六出发',
    budget: { min: 150, max: 200, currency: 'CNY' },
    twins_maturity: 'intermediate',
  },
}

export const foodCardA2 = {
  id: 'food-a2-sushi',
  scene: 'food',
  variant: 'plan',
  state: 'plan',
  title: '你收藏了 3 家日料店，鮨·初今晚 19:30 不用排队',
  trigger_reason: '基于你最近看过 2 条日料 + 1 条日料探店 + 当前是工作日 18:00',
  intent: '今晚找个人一起去吃',
  plan: '19:30 到店，人均 110 元，预算 130 元（含小费）',
  needs_buddy: 'optional',
  candidates: [
    {
      id: 'twinbuddy-mock-003',
      nickname: '今晚吃点好的',
      match_label: 'most_match',
      match_reason: '预算匹配：人均 ≤ 130',
      conflicts: ['不能吃太辣'],
      avatar_url: 'https://picsum.photos/seed/mock-003/96/96',
    },
    {
      id: 'twinbuddy-mock-007',
      nickname: '口味挑剔 ISFP',
      match_label: 'most_complement',
      match_reason: '口味互：能吃生食',
      conflicts: ['不接受排队 ≥ 1 小时'],
      avatar_url: 'https://picsum.photos/seed/mock-007/96/96',
    },
    {
      id: 'twinbuddy-mock-010',
      nickname: 'AA 战士 ISTJ',
      match_label: 'most_interesting',
      match_reason: '时间对：今晚 19 点有空',
      conflicts: ['必须 AA'],
      avatar_url: 'https://picsum.photos/seed/mock-010/96/96',
    },
  ],
  negotiation_summary: {
    agreed: [
      '预算 ±20 元 AA',
      '口味（不辣+生食）',
      '时间 19:00-19:30',
    ],
    pending: [
      '对方从不带酒',
    ],
    risks: [
      '日料生食过敏需要备注',
    ],
    key_moment: {
      speaker: 'buddy_twin',
      text: '你介意对方喝点酒吗？',
      detected_conflict: '你不接受酒味，对方偶尔想喝',
      resolution: '对方答应今晚不点酒',
      outcome: 'agreed',
    },
    progress: 82,
  },
  risks: [
    '对方不能吃生食需改烤物',
    '周末排号翻倍',
  ],
  next_actions: [],
  follow_up: [
    { type: 'coupon', label: '团购券' },
    { type: 'queue', label: '在线排号' },
    { type: 'menu', label: '查看菜单' },
    { type: 'copy', label: '复制邀约' },
  ],
  meta: {
    deadline: '今晚 19:30',
    budget: { min: 100, max: 130, currency: 'CNY' },
    twins_maturity: 'intermediate',
  },
}

export const tripHintCard = {
  id: 'trip-hint-1',
  scene: 'trip',
  variant: 'hint',
  state: 'hint',
  title: '你最近好像想找个轻松的周末短途旅行',
  trigger_reason: '基于你最近看了 4 条深圳周边游 + 周末空闲',
  intent: '',
  plan: '',
  needs_buddy: 'optional',
  candidates: [],
  next_actions: [],
  follow_up: [],
  risks: [],
  meta: {
    twins_maturity: 'novice',
  },
}

export const tripCompleteCard = {
  id: 'trip-complete-1',
  scene: 'trip',
  variant: 'complete',
  state: 'complete',
  title: '邀约已生成',
  trigger_reason: '',
  intent: '去大鹏吹吹风',
  plan: '',
  needs_buddy: 'none',
  candidates: [],
  next_actions: [],
  follow_up: [
    { type: 'route', label: '查看路线' },
    { type: 'food', label: '查看附近餐饮' },
    { type: 'hotel', label: '查看住宿' },
    { type: 'guide', label: '查看攻略' },
  ],
  risks: [],
  invite_text: '我周六 14:00 也想去大鹏吹吹风，你那边刚好顺路吗？预算 180 我俩 AA 还行，到时微信约时间？',
  meta: {
    twins_maturity: 'intermediate',
  },
}

export const fitnessCardA3 = {
  id: 'fitness-a3-shoulder',
  scene: 'fitness',
  variant: 'plan',
  state: 'plan',
  title: '你最近看了很多肩背训练内容，14 天低门槛计划给你',
  trigger_reason: '基于你最近 3 条肩背训练视频 + 1 条瑜伽拉伸',
  intent: '启动一个 14 天训练计划',
  plan: '14 天 × 每次 30 分钟，强度低（无器械），隔天练',
  needs_buddy: 'optional',
  candidates: [
    {
      id: 'twinbuddy-mock-008',
      nickname: '减脂餐打卡 INTP',
      match_label: 'most_match',
      match_reason: '同水平打卡搭子',
      conflicts: ['晚上不吃饭'],
      avatar_url: 'https://picsum.photos/seed/mock-008/96/96',
    },
    {
      id: 'twinbuddy-mock-012',
      nickname: '撸铁 ESFJ',
      match_label: 'most_complement',
      match_reason: '同时间段，节奏稳',
      conflicts: ['不接受偷懒搭子'],
      avatar_url: 'https://picsum.photos/seed/mock-012/96/96',
    },
  ],
  next_actions: [],
  follow_up: [
    { type: 'calendar', label: '训练日历' },
    { type: 'video', label: '动作视频' },
    { type: 'review', label: '复盘模板' },
  ],
  risks: ['动作不规范可能伤肩'],
  meta: {
    deadline: '今天 19:00 出门',
    twins_maturity: 'intermediate',
  },
}

export const studyCardA4 = {
  id: 'study-a4-ai-agent',
  scene: 'study',
  variant: 'plan',
  state: 'plan',
  title: '你最近在看 AI Agent，我给你生成了 7 天路线',
  trigger_reason: '基于你最近 2 条 AI Agent 视频 + 1 条 prompt engineering',
  intent: '7 天入门 AI Agent',
  plan: '7 天 × 每天 1 小时，含读论文 + 写代码 + 复盘',
  needs_buddy: 'optional',
  candidates: [
    {
      id: 'twinbuddy-mock-016',
      nickname: 'AI Agent 入门 INTP',
      match_label: 'most_match',
      match_reason: '同方向学习',
      conflicts: ['无法坚持早 8 点起床'],
      avatar_url: 'https://picsum.photos/seed/mock-016/96/96',
    },
  ],
  next_actions: [],
  follow_up: [
    { type: 'calendar', label: '学习日历' },
    { type: 'package', label: '资料包' },
    { type: 'note', label: '笔记模板' },
  ],
  risks: ['基础差异大', '打卡坚持度'],
  meta: {
    deadline: '本周一开始',
    twins_maturity: 'intermediate',
  },
}

export const eventCardA5 = {
  id: 'event-a5-jay-chou',
  scene: 'event',
  variant: 'plan',
  state: 'plan',
  title: '你看了 8 条周杰伦视频，8 月深圳站还剩少量票',
  trigger_reason: '基于你最近 8 条周杰伦视频 + 8 月空闲',
  intent: '抢票 + 找个同行人',
  plan: '大麦 8/15 12:00 抢票，找一个同城同预算同行人',
  needs_buddy: 'required',
  candidates: [
    {
      id: 'twinbuddy-mock-021',
      nickname: '演唱会追星 ESFJ',
      match_label: 'most_match',
      match_reason: '同购票区段 + 必接受拍照 2 小时',
      conflicts: [],
      avatar_url: 'https://picsum.photos/seed/mock-021/96/96',
    },
  ],
  next_actions: [],
  follow_up: [
    { type: 'damai', label: '大麦' },
    { type: 'route', label: '高德' },
    { type: 'food', label: '美食推荐' },
  ],
  risks: ['票被黄牛炒', '散场打车难'],
  meta: {
    deadline: '8/15 12:00 抢票',
    budget: { min: 480, max: 680, currency: 'CNY' },
    twins_maturity: 'intermediate',
  },
}

export const shoppingCardA6 = {
  id: 'shopping-a6-backpack',
  scene: 'shopping',
  variant: 'plan',
  state: 'plan',
  title: '你最近收藏了 3 个通勤背包，我帮你按预算筛了 3 个',
  trigger_reason: '基于你最近 4 条通勤/穿搭/背包视频',
  intent: '决定买哪个包',
  plan: '本周内选 1 个，预算 200-500 元',
  needs_buddy: 'none',
  candidates: [],
  next_actions: [],
  follow_up: [
    { type: 'detail', label: '商品详情' },
    { type: 'review', label: '评价' },
    { type: 'compare', label: '比价' },
    { type: 'buy', label: '购买入口' },
  ],
  risks: ['冲动消费', '尺码/容量不合适'],
  meta: {
    deadline: '本周内',
    budget: { min: 200, max: 500, currency: 'CNY' },
    twins_maturity: 'advanced',
  },
}

export const allMockCards = [
  tripHintCard,
  tripCardA1,
  foodCardA2,
  fitnessCardA3,
  studyCardA4,
  eventCardA5,
  shoppingCardA6,
  tripCompleteCard,
]

export default allMockCards
