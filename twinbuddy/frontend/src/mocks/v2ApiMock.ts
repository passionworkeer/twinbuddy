import type {
  TwinBuddyV2Profile,
  TwinBuddyConversationItem,
  TwinBuddySecurityStatus,
  TwinBuddyCommunityPost,
  TwinBuddyV2BuddyInboxItem,
  TwinBuddyV2BuddyCard,
} from '../types';

// ---------------------------------------------------------------------------
// Mock profile
// ---------------------------------------------------------------------------
export const mockProfile: TwinBuddyV2Profile = {
  user_id: 'user_77e92a9e',
  nickname: '旅行者',
  mbti: 'INTJ',
  city: '深圳',
  self_desc: '喜欢慢慢走，不赶行程，吃好住好最重要。',
  budget: '舒适',
  travel_range: ['周末短途', '周边城市'],
  style_vector: {
    '节奏偏好': ['慢节奏', '深度游'],
    '消费观': ['体验优先', '不省伙食'],
    '社交风格': ['有边界感', '喜欢安静'],
  },
  is_verified: true,
  verification_status: 'verified',
  updated_at: Date.now(),
  avatar_url: 'https://picsum.photos/seed/user77e92a9e/200/200',
};

// ---------------------------------------------------------------------------
// Mock conversations
// ---------------------------------------------------------------------------
export const mockConversations: TwinBuddyConversationItem[] = [
  {
    room_id: 'room_001',
    peer_user: { id: 'buddy_001', nickname: '小满', mbti: 'INFP' },
    last_message: '周末去顺德的话，我觉得清晖园可以安排在第一天上午，人少体验好。',
    unread_count: 2,
  },
  {
    room_id: 'room_002',
    peer_user: { id: 'buddy_002', nickname: '阿志', mbti: 'ENFP' },
    last_message: '特种兵也没那么可怕啦，我们走精简版就好！',
    unread_count: 0,
  },
  {
    room_id: 'room_003',
    peer_user: { id: 'buddy_003', nickname: '静静', mbti: 'ISFJ' },
    last_message: '好的，那我们约周六早上 9 点深圳北站见？',
    unread_count: 1,
  },
  {
    room_id: 'room_004',
    peer_user: { id: 'buddy_004', nickname: '阿丹', mbti: 'ESFP' },
    last_message: '那我们就定下周六早上 9 点了！',
    unread_count: 0,
  },
  {
    room_id: 'room_005',
    peer_user: { id: 'buddy_005', nickname: '小飞', mbti: 'INTJ' },
    last_message: '顺德鱼生推荐哪家？我来查查',
    unread_count: 1,
  },
  {
    room_id: 'room_006',
    peer_user: { id: 'buddy_006', nickname: '叶子', mbti: 'ISFP' },
    last_message: '好的，顺德见！',
    unread_count: 3,
  },
];

// ---------------------------------------------------------------------------
// Mock security status
// ---------------------------------------------------------------------------
export const mockSecurityStatus: TwinBuddySecurityStatus = {
  user_id: 'user_77e92a9e',
  is_verified: true,
  verification_status: 'verified',
  real_name_masked: '张*明',
  id_number_tail: '1234',
  verified_at: Date.now() - 86400000 * 7,
};

// ---------------------------------------------------------------------------
// Mock community posts
// ---------------------------------------------------------------------------
export const mockCommunityPosts: TwinBuddyCommunityPost[] = [
  {
    id: 'post_001',
    author: { nickname: '小满', mbti: 'INFP' },
    content: '五一想去顺德慢慢吃，找一个不赶行程的搭子。喜欢早上睡到自然醒，下午逛古村，晚上找家私房菜。',
    location: '深圳',
    likes_count: 42,
    comments_count: 8,
    comments: [
      { id: 'c1', user_id: 'buddy_002', author_nickname: '阿志', content: '我也想去顺德！可以一起做攻略吗？', created_at: Date.now() - 7200000 },
      { id: 'c2', user_id: 'buddy_003', author_nickname: '静静', content: '推荐清晖园附近那家鱼生，很地道。', created_at: Date.now() - 3600000 },
    ],
    tags: ['顺德', '美食', '慢节奏'],
    images: [
      'https://picsum.photos/seed/shunde-food/600/400',
      'https://picsum.photos/seed/shunde-garden/600/400',
    ],
    created_at: Date.now() - 3600000 * 3,
  },
  {
    id: 'post_002',
    author: { nickname: '阿志', mbti: 'ENFP' },
    content: '梧桐山特种兵招募，走泰山涧环线，预计 5-6 小时。想找体力差不多的人一起，互相有个照应。',
    location: '深圳',
    likes_count: 28,
    comments_count: 5,
    comments: [
      { id: 'c3', user_id: 'buddy_001', author_nickname: '小满', content: '体力一般般，但我可以慢慢走！', created_at: Date.now() - 3600000 },
    ],
    tags: ['梧桐山', '徒步', '周末'],
    images: [
      'https://picsum.photos/seed/wutong-mountain/600/400',
      'https://picsum.photos/seed/hiking/600/400',
    ],
    created_at: Date.now() - 3600000 * 8,
  },
  {
    id: 'post_003',
    author: { nickname: '静静', mbti: 'ISFJ' },
    content: '刚从潮州回来，牌坊街真的太好逛了。推荐住古城里面的民宿，老板超热情，早上还会送工夫茶。',
    location: '潮州',
    likes_count: 67,
    comments_count: 12,
    comments: [],
    tags: ['潮州', '美食', '人文'],
    images: [
      'https://picsum.photos/seed/chaozhou-arch/600/400',
      'https://picsum.photos/seed/chaozhou-food/600/400',
    ],
    created_at: Date.now() - 86400000,
  },
  {
    id: 'post_004',
    author: { nickname: '阿丹', mbti: 'ESFP' },
    content: '周末两天一夜从深圳出发去广州，暴走版路线分享：第一天广州塔 + 珠江夜游，第二天早起喝早茶逛沙面，时间紧凑但很充实。',
    location: '广州',
    likes_count: 35,
    comments_count: 6,
    comments: [],
    tags: ['广州', '暴走', '城市'],
    images: [
      'https://picsum.photos/seed/canton-tower/600/400',
      'https://picsum.photos/seed/guangzhou-food/600/400',
    ],
    created_at: Date.now() - 86400000 * 2,
  },
  {
    id: 'post_005',
    author: { nickname: '小飞', mbti: 'INTJ' },
    content: '求推荐深圳周边不累的路线，不要爬山。适合周末躺平放松的那种，有吗？',
    location: '深圳',
    likes_count: 19,
    comments_count: 14,
    comments: [],
    tags: ['深圳', '周边', '轻松'],
    images: [
      'https://picsum.photos/seed/daping/600/400',
      'https://picsum.photos/seed/coast/600/400',
    ],
    created_at: Date.now() - 86400000 * 3,
  },
  {
    id: 'post_006',
    author: { nickname: '叶子', mbti: 'ISFP' },
    content: '顺德清晖园下午人少体验好，阳光透过窗棂洒进来，拍照也很好看。建议下午三四点去，光线最美。',
    location: '顺德',
    likes_count: 51,
    comments_count: 9,
    comments: [],
    tags: ['顺德', '清晖园', '慢节奏'],
    images: [
      'https://picsum.photos/seed/qinghui-garden/600/400',
      'https://picsum.photos/seed/shunde-night/600/400',
    ],
    created_at: Date.now() - 86400000 * 4,
  },
  {
    id: 'post_007',
    author: { nickname: '大宇', mbti: 'ENTP' },
    content: '从广州南站出发，顺德两日游攻略：Day1 顺峰山 + 清晖园 + 鱼生，Day2 逢简水乡早茶 + 返程。适合不想赶的人。',
    location: '顺德',
    likes_count: 44,
    comments_count: 7,
    comments: [],
    tags: ['顺德', '攻略', '两天'],
    images: [
      'https://picsum.photos/seed/shunde-water/600/400',
      'https://picsum.photos/seed/fish-dish/600/400',
    ],
    created_at: Date.now() - 86400000 * 5,
  },
  {
    id: 'post_008',
    author: { nickname: '静宜', mbti: 'ISFJ' },
    content: '一个人的旅行，也可以很舒服。不需要配合别人的时间，不用迁就喜好，走到哪算哪，累了就休息。',
    location: '深圳',
    likes_count: 22,
    comments_count: 3,
    comments: [],
    tags: ['独行', '自在', '慢游'],
    images: [
      'https://picsum.photos/seed/solo-travel/600/400',
      'https://picsum.photos/seed/cafe/600/400',
    ],
    created_at: Date.now() - 86400000 * 6,
  },
];

// ---------------------------------------------------------------------------
// Mock buddy inbox
// ---------------------------------------------------------------------------
export const mockBuddyInbox: TwinBuddyV2BuddyInboxItem[] = [
  {
    buddy_id: 'buddy_001',
    nickname: '小满',
    mbti: 'INFP',
    avatar: 'https://picsum.photos/seed/buddy-xiaoman/200/200',
    city: '深圳',
    match_score: 91,
    negotiation_id: 'neg_001',
    status: 'awaiting_user_confirm',
    preview: '你们在行程节奏和美食偏好上高度一致，适合一起探索顺德两天一夜慢吃线。',
    highlights: ['慢节奏', '美食导向', '周末短途'],
    conflicts: ['社交能量：偏低 vs 中等'],
  },
  {
    buddy_id: 'buddy_002',
    nickname: '阿志',
    mbti: 'ENFP',
    avatar: 'https://picsum.photos/seed/buddy-azhi/200/200',
    city: '广州',
    match_score: 76,
    negotiation_id: 'neg_002',
    status: 'pending',
    preview: 'ENFP 型搭子，性格外向热情，喜欢探索新地方，适合互补型行程搭配。',
    highlights: ['外向', '探索型', '广州'],
    conflicts: ['暴走 vs 慢游节奏差异'],
  },
  {
    buddy_id: 'buddy_003',
    nickname: '静静',
    mbti: 'ISFJ',
    avatar: 'https://picsum.photos/seed/buddy-jingjing/200/200',
    city: '深圳',
    match_score: 88,
    negotiation_id: 'neg_003',
    status: 'pending',
    preview: 'ISFJ 型搭子，细心体贴，计划周全，适合安静型旅行风格。',
    highlights: ['计划周全', '安静', '细心'],
    conflicts: [],
  },
  {
    buddy_id: 'buddy_004',
    nickname: '阿丹',
    mbti: 'ESFP',
    avatar: 'https://picsum.photos/seed/buddy-adan/200/200',
    city: '广州',
    match_score: 89,
    negotiation_id: 'neg_004',
    status: 'awaiting_user_confirm',
    preview: 'ESFP 型搭子，天生的气氛组队长，爱热闹、自来熟，很会调动旅行中的欢乐气氛。',
    highlights: ['气氛组', '外向', '广州'],
    conflicts: ['暴走 vs 慢游节奏差异'],
  },
  {
    buddy_id: 'buddy_005',
    nickname: '大宇',
    mbti: 'ENTP',
    avatar: 'https://picsum.photos/seed/buddy-dayu/200/200',
    city: '深圳',
    match_score: 71,
    negotiation_id: 'neg_005',
    status: 'pending',
    preview: 'ENTP 型搭子，智多星，爱辩论、思路跳脱、点子达人，能让旅行充满意外惊喜。',
    highlights: ['智多星', '高能量', '点子多'],
    conflicts: ['暴走 vs 慢游节奏差异', '决策风格差异较大'],
  },
  {
    buddy_id: 'buddy_006',
    nickname: '静宜',
    mbti: 'ISFJ',
    avatar: 'https://picsum.photos/seed/buddy-jingyi/200/200',
    city: '深圳',
    match_score: 95,
    negotiation_id: 'neg_006',
    status: 'pending',
    preview: 'ISFJ 型搭子，守护者，细腻贴心、稳定可靠，兴趣标签高度重合，旅行节奏非常匹配。',
    highlights: ['计划周全', '细腻贴心', '兴趣高度重合'],
    conflicts: [],
  },
];

// ---------------------------------------------------------------------------
// Mock buddy card
// ---------------------------------------------------------------------------
export const mockBuddyCard: TwinBuddyV2BuddyCard = {
  profile: {
    buddy_id: 'buddy_001',
    nickname: '小满',
    mbti: 'INFP',
    avatar: 'https://picsum.photos/seed/buddy-xiaoman/200/200',
    city: '深圳',
    summary: '喜欢慢节奏旅行的 INFP，美食导向，不赶行程。',
  },
  negotiation_summary: {
    negotiation_id: 'neg_001',
    match_score: 91,
    consensus: [
      '都偏好慢节奏旅行，不赶行程',
      '都喜欢美食，愿意为好东西多花钱',
      '周末短途，广东省内为主',
    ],
    conflicts: [
      '社交能量：偏低 vs 中等，可能在行程互动频率上有差异',
    ],
    report_intro: '你们在行程节奏和美食偏好上高度一致，适合一起探索顺德两天一夜慢吃线。',
  },
  radar_chart: [
    { dimension: '行程节奏', user_score: 28, buddy_score: 32, weight: 0.25 },
    { dimension: '社交能量', user_score: 42, buddy_score: 58, weight: 0.2 },
    { dimension: '决策风格', user_score: 72, buddy_score: 52, weight: 0.2 },
    { dimension: '兴趣对齐', user_score: 88, buddy_score: 86, weight: 0.25 },
    { dimension: '预算兼容', user_score: 90, buddy_score: 88, weight: 0.15 },
    { dimension: '人格互补', user_score: 75, buddy_score: 75, weight: 0.1 },
  ],
  actions: [
    { id: 'blind-game', label: '进入盲选' },
    { id: 'wechat', label: '私信 TA' },
    { id: 'pass', label: '跳过' },
  ],
};

// ---------------------------------------------------------------------------
// Mock chat history
// ---------------------------------------------------------------------------
export const mockChatHistory = {
  conversation_id: 'conv_001',
  items: [
    {
      id: 'msg_001',
      role: 'assistant' as const,
      content: '你好呀，我是你的专属探索助手。你可以把你的周末计划抛给我，或者告诉我你不想干嘛，我们会自动更新匹配条件。',
      created_at: Date.now() - 3600000,
    },
    {
      id: 'msg_002',
      role: 'user' as const,
      content: '我想这周末去顺德吃吃喝喝，有没有好路线？',
      created_at: Date.now() - 3500000,
    },
    {
      id: 'msg_003',
      role: 'assistant' as const,
      content: '顺德两天一夜慢吃路线推荐：\n\nDay1：深圳出发 → 顺峰山公园（上午人少）→ 午餐鱼生 → 清晖园下午逛 → 晚餐私房菜 → 住宿顺德大良\n\nDay2：早起到逢简水乡 → 中午寻味顺德私房菜 → 回程\n\n你们两位都是慢节奏风格，这个路线强度刚好，不用赶。',
      created_at: Date.now() - 3400000,
    },
    {
      id: 'msg_004',
      role: 'user' as const,
      content: '有什么必吃的店推荐吗？',
      created_at: Date.now() - 3300000,
    },
    {
      id: 'msg_005',
      role: 'assistant' as const,
      content: '顺德鱼生认准「肥光鱼生」，人均 150 左右，但要提前订位。清晖园附近有家私房菜「大门公」也不错，隐藏在小巷里，本地人都知道。',
      created_at: Date.now() - 3200000,
    },
    {
      id: 'msg_006',
      role: 'user' as const,
      content: '好，那我就把这几个点串起来',
      created_at: Date.now() - 3100000,
    },
    {
      id: 'msg_007',
      role: 'assistant' as const,
      content: '我帮你把这条路线同步给数字分身了。如果后续要调整，直接告诉我，我会同步更新搭子协商里的行程偏好。',
      created_at: Date.now() - 3000000,
    },
  ],
};
