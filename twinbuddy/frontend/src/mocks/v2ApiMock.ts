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
    likes_count: 24,
    comments_count: 5,
    comments: [
      { id: 'c1', user_id: 'buddy_002', author_nickname: '阿志', content: '我也想去顺德！可以一起做攻略吗？', created_at: Date.now() - 7200000 },
      { id: 'c2', user_id: 'buddy_003', author_nickname: '静静', content: '推荐清晖园附近那家鱼生，很地道。', created_at: Date.now() - 3600000 },
    ],
    tags: ['顺德', '美食', '慢节奏'],
    images: [],
    created_at: Date.now() - 3600000 * 3,
  },
  {
    id: 'post_002',
    author: { nickname: '阿志', mbti: 'ENFP' },
    content: '有没有人想这周末去梧桐山？打算走泰山涧那条线，大概 5-6 小时。想找体力差不多的人一起。',
    location: '深圳',
    likes_count: 18,
    comments_count: 3,
    comments: [
      { id: 'c3', user_id: 'buddy_001', author_nickname: '小满', content: '体力一般般，但我可以慢慢走！', created_at: Date.now() - 3600000 },
    ],
    tags: ['梧桐山', '徒步', '周末'],
    images: [],
    created_at: Date.now() - 3600000 * 8,
  },
  {
    id: 'post_003',
    author: { nickname: '静静', mbti: 'ISFJ' },
    content: '刚从潮州回来，牌坊街真的太好逛了。推荐住古城里面的民宿，老板超热情，早上还会送工夫茶。',
    location: '潮州',
    likes_count: 45,
    comments_count: 8,
    comments: [],
    tags: ['潮州', '美食', '人文'],
    images: [],
    created_at: Date.now() - 86400000,
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
    avatar: '',
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
    avatar: '',
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
    avatar: '',
    city: '深圳',
    match_score: 88,
    negotiation_id: 'neg_003',
    status: 'pending',
    preview: 'ISFJ 型搭子，细心体贴，计划周全，适合安静型旅行风格。',
    highlights: ['计划周全', '安静', '细心'],
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
    avatar: '',
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
    { dimension: '行程节奏', user_score: 30, buddy_score: 35, weight: 0.25 },
    { dimension: '社交能量', user_score: 40, buddy_score: 60, weight: 0.2 },
    { dimension: '决策风格', user_score: 70, buddy_score: 50, weight: 0.2 },
    { dimension: '兴趣对齐', user_score: 85, buddy_score: 85, weight: 0.25 },
    { dimension: '预算兼容', user_score: 90, buddy_score: 90, weight: 0.15 },
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
  ],
};
