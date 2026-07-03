# TwinBuddy 前端 API 文档（v2）

> 版本：v2.0.0
> 日期：2026-04-29
> 前端客户端：`src/api/client.ts`
> 前端开发环境代理：`/api` → `http://localhost:8008`

---

## 一、请求/响应约定

### 请求工具

```typescript
async function apiGet<T>(path: string, params?: Record<string, string>): Promise<T>
async function apiPost<T, B = unknown>(path: string, body: B, options?: { timeoutMs?: number }): Promise<T>
```

### 统一响应格式

```typescript
// 成功
{ success: true, data: T, meta?: Record<string, unknown> }

// 失败
{ success: false, error: string }
```

所有 API 客户端函数使用 `unwrap<T>` 解析，成功时返回 `data`，失败时抛出 `Error`。

### 错误处理

```typescript
try {
  const data = await fetchTwinBuddyProfile('user123');
} catch (err) {
  console.error(err.message); // HTTP 404 等
}
```

---

## 二、API 函数清单

| 函数 | 方法 | 路径 | 说明 |
|------|------|------|------|
| `fetchPersona` | GET | `/api/persona` | 获取/构建人格 |
| `fetchBuddies` | GET | `/api/buddies` | 获取推荐搭子（v1） |
| `negotiate` | POST | `/api/negotiate` | 双 Agent 协商（v1） |
| `createTwinBuddyProfile` | POST | `/api/profiles` | 创建用户画像 |
| `fetchTwinBuddyProfile` | GET | `/api/profiles/{userId}` | 获取用户画像详情 |
| `patchTwinBuddyProfile` | PATCH | `/api/profiles/{userId}` | 更新用户画像 |
| `fetchTwinBuddyBuddyInbox` | GET | `/api/buddies/inbox` | 获取搭子动态（待协商列表） |
| `fetchTwinBuddyBuddyCard` | GET | `/api/buddies/{buddyId}/card` | 获取搭子卡片详情 |
| `fetchTwinBuddyChatHistory` | GET | `/api/chat/history/{conversationId}` | 获取对话历史 |
| `streamTwinBuddyChat` | POST | `/api/chat/send` | 发送消息并流式接收回复（SSE） |
| `fetchTwinBuddyConversations` | GET | `/api/conversations` | 获取私信会话列表 |
| `fetchTwinBuddyRoomMessages` | GET | `/api/messages/{roomId}` | 获取房间消息列表 |
| `sendTwinBuddyRoomMessage` | POST | `/api/messages` | 发送私信消息 |
| `fetchTwinBuddySecurityStatus` | GET | `/api/security/status/{userId}` | 获取实名认证状态 |
| `submitTwinBuddyVerification` | POST | `/api/security/verify` | 提交实名认证 |
| `startBlindGame` | POST | `/api/games/blind/start` | 开启 6 轮盲选游戏 |
| `answerBlindGame` | POST | `/api/games/blind/answer` | 回答盲选问题 |
| `fetchBlindGameReport` | GET | `/api/games/blind/{gameId}/report` | 获取盲选报告 |
| `reportTwinBuddyTrip` | POST | `/api/trips/report` | 上报行程（需实名认证） |
| `fetchTwinBuddyCommunityFeed` | GET | `/api/posts/feed` | 获取社区动态 |
| `createTwinBuddyCommunityPost` | POST | `/api/posts` | 发布社区动态 |
| `likeTwinBuddyCommunityPost` | POST | `/api/posts/{postId}/like` | 点赞/取消点赞动态 |
| `commentTwinBuddyCommunityPost` | POST | `/api/posts/{postId}/comments` | 评论动态 |
| `triggerTwinBuddyCommunityTwinChat` | POST | `/api/posts/{postId}/twin-chat` | 代聊（数字分身代为评论） |

---

## 三、详细接口

### 3.1 createTwinBuddyProfile — 创建用户画像

**POST** `/api/profiles`

```typescript
const profile = await createTwinBuddyProfile({
  userId?: string,        // 前端本地 ID，可选
  mbti: 'ENFP',
  travelRange: ['华南', '周边城市'],
  budget: '舒适',
  selfDescription: '喜欢慢节奏、不赶景点',
  city: '深圳',
});
```

**返回：** `Promise<TwinBuddyV2Profile>`

```typescript
interface TwinBuddyV2Profile {
  user_id: string;
  nickname: string;
  mbti: string;
  travel_range: string[];
  budget: string;
  self_desc: string;
  city: string;
  style_vector: Record<string, unknown>;
  is_verified: boolean;
  verification_status: 'unverified' | 'pending' | 'verified';
  updated_at: number;
}
```

---

### 3.2 fetchTwinBuddyProfile — 获取用户画像详情

**GET** `/api/profiles/{userId}`

```typescript
const profile = await fetchTwinBuddyProfile('user123');
```

---

### 3.3 patchTwinBuddyProfile — 更新用户画像

**PATCH** `/api/profiles/{userId}`

```typescript
const updated = await patchTwinBuddyProfile('user123', {
  budget: '经济',
  selfDescription: '新的自我描述',
  city: '广州',
  travelRange: ['华东'],
  styleVector: { expression_style: 'direct', keywords: ['慢节奏'] },
});
```

---

### 3.4 fetchTwinBuddyBuddyInbox — 搭子动态（待协商列表）

**GET** `/api/buddies/inbox?user_id=xxx&page=1`

需完成实名认证（`is_verified=true`）才返回真实数据，否则 403。

```typescript
const items = await fetchTwinBuddyBuddyInbox('user123');
// items: TwinBuddyV2BuddyInboxItem[]
```

```typescript
interface TwinBuddyV2BuddyInboxItem {
  buddy_id: string;
  nickname: string;
  mbti: string;
  avatar: string;        // emoji 或图片 URL
  city: string;
  match_score: number;   // 0-100
  negotiation_id: string;
  status: string;
  preview: string;       // 数字分身预协商摘要
  highlights: string[];
  conflicts: string[];
}
```

---

### 3.5 fetchTwinBuddyBuddyCard — 搭子卡片详情

**GET** `/api/buddies/{buddyId}/card?negotiation_id=xxx`

```typescript
const card = await fetchTwinBuddyBuddyCard('buddy-001', 'neg-001');
// card: TwinBuddyV2BuddyCard
```

```typescript
interface TwinBuddyV2BuddyCard {
  profile: {
    buddy_id: string;
    nickname: string;
    mbti: string;
    avatar: string;
    city: string;
    summary: string;
  };
  negotiation_summary: {
    negotiation_id: string;
    match_score: number;
    consensus: string[];
    conflicts: string[];
    report_intro: string;
  };
  radar_chart: RadarData[];
  actions: { id: string; label: string }[];
}
```

---

### 3.6 streamTwinBuddyChat — 流式聊天（SSE）

**POST** `/api/chat/send`

```typescript
const result = await streamTwinBuddyChat(
  { userId: 'user123', message: '适合第一次见面的路线？', conversationId: 'conv-001' },
  {
    onMeta: (conversationId) => { /* 新的 conversation ID */ },
    onMessage: (chunk) => { /* 增量回复文本 */ },
    onPreferenceHint: (hint) => { /* 偏好更新提示 */ },
  },
);
// 返回 { conversationId: string }
```

**SSE 事件类型：**

| type | 字段 | 说明 |
|------|------|------|
| `meta` | `conversation_id` | 新建或已有会话 ID |
| `message` | `content` | 增量回复文本片段 |
| `preference_hint` | `content` | 偏好更新提示 |
| `done` | — | 流式结束标记 |

---

### 3.7 fetchTwinBuddyChatHistory — 获取对话历史

**GET** `/api/chat/history/{conversationId}`

```typescript
const history = await fetchTwinBuddyChatHistory('conv-001');
// history: { conversation_id, user_id, items: TwinBuddyV2ChatMessage[] }
```

```typescript
interface TwinBuddyV2ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: number;
}
```

---

### 3.8 fetchTwinBuddyConversations — 私信会话列表

**GET** `/api/conversations?user_id=xxx`

```typescript
const items = await fetchTwinBuddyConversations('user123');
// items: TwinBuddyConversationItem[]
```

```typescript
interface TwinBuddyConversationItem {
  room_id: string;
  peer_user: { id: string; nickname: string; mbti: string };
  last_message: string;
  unread_count: number;
}
```

---

### 3.9 fetchTwinBuddyRoomMessages — 获取房间消息

**GET** `/api/messages/{roomId}?page=1`

```typescript
const messages = await fetchTwinBuddyRoomMessages('room-01');
// messages: TwinBuddyRoomMessage[]
```

---

### 3.10 sendTwinBuddyRoomMessage — 发送私信

**POST** `/api/messages`

```typescript
await sendTwinBuddyRoomMessage({
  roomId: 'room-01',
  senderId: 'user123',
  content: '我同意周末去顺德！',
  type: 'text',  // 'text' | 'trip_card'
});
```

---

### 3.11 fetchTwinBuddySecurityStatus — 获取实名认证状态

**GET** `/api/security/status/{userId}`

```typescript
const status = await fetchTwinBuddySecurityStatus('user123');
// status: TwinBuddySecurityStatus
```

```typescript
interface TwinBuddySecurityStatus {
  user_id: string;
  is_verified: boolean;
  verification_status: 'unverified' | 'pending' | 'verified';
  real_name_masked: string;   // 如 "张*"
  id_number_tail: string;    // 身份证后四位
  verified_at: number | null;
}
```

---

### 3.12 submitTwinBuddyVerification — 提交实名认证

**POST** `/api/security/verify`

```typescript
const status = await submitTwinBuddyVerification({
  userId: 'user123',
  legalName: '张三',
  idNumberTail: '1234',
});
```

---

### 3.13 startBlindGame / answerBlindGame / fetchBlindGameReport — 盲选游戏

**POST** `/api/games/blind/start`

```typescript
const { game_id, rounds } = await startBlindGame({
  userId: 'user123',
  negotiationId: 'neg-001',
});
// rounds: BlindGameRound[]，6 题
```

**POST** `/api/games/blind/answer`

```typescript
const result = await answerBlindGame({
  gameId: game_id,
  roundId: 'round_1',
  choice: 'A',
});
// { done: boolean, rounds_completed: number, game_id: string }
```

**GET** `/api/games/blind/{gameId}/report`

```typescript
const report = await fetchBlindGameReport(game_id);
// { user_choices, buddy_choices, per_round_result, match_score, analysis }
```

---

### 3.14 reportTwinBuddyTrip — 上报行程

**POST** `/api/trips/report`

需完成实名认证。

```typescript
const trip = await reportTwinBuddyTrip({
  userAId: 'user123',
  userBId: 'buddy-001',
  destination: '顺德',
  departDate: '2026-05-01',
  returnDate: '2026-05-03',
  emergencyContactName: '李四',
  emergencyContactPhone: '13800138000',
});
```

---

### 3.15 fetchTwinBuddyCommunityFeed — 社区动态

**GET** `/api/posts/feed?user_id=xxx&page=1`

```typescript
const posts = await fetchTwinBuddyCommunityFeed('user123');
// posts: TwinBuddyCommunityPost[]
```

```typescript
interface TwinBuddyCommunityPost {
  id: string;
  user_id: string;
  author: { nickname: string; mbti: string };
  content: string;
  images: string[];
  tags: string[];
  location: string;
  is_travel_plan: boolean;
  trip_date?: string;
  trip_days?: number;
  trip_budget?: string;
  likes_count: number;
  comments_count: number;
  liked_user_ids: string[];
  comments: TwinBuddyCommunityComment[];
  created_at: number;
}
```

---

### 3.16 createTwinBuddyCommunityPost — 发布动态

**POST** `/api/posts`

```typescript
const post = await createTwinBuddyCommunityPost({
  userId: 'user123',
  content: '周末想去顺德找搭子',
  location: '深圳',
  tags: ['顺德', '周末', '美食'],
});
```

---

### 3.17 likeTwinBuddyCommunityPost — 点赞

**POST** `/api/posts/{postId}/like`

```typescript
const { liked, likes_count } = await likeTwinBuddyCommunityPost(postId, 'user123');
```

---

### 3.18 commentTwinBuddyCommunityPost — 评论

**POST** `/api/posts/{postId}/comments`

```typescript
const comment = await commentTwinBuddyCommunityPost(postId, {
  userId: 'user123',
  content: '这个节奏挺舒服的！',
});
```

---

### 3.19 triggerTwinBuddyCommunityTwinChat — 代聊

**POST** `/api/posts/{postId}/twin-chat`

```typescript
const { status, summary } = await triggerTwinBuddyCommunityTwinChat(postId, 'user123');
// 数字分身代为评论帖子，并返回摘要
```

---

## 四、文件结构

```
frontend/src/
├── api/
│   └── client.ts          # 23 个 API 函数
├── hooks/
│   ├── useLocalStorage.ts
│   └── useTwinbuddyOnboarding.ts
├── pages/v2/
│   ├── HomePage.tsx
│   ├── BuddiesPage.tsx
│   ├── CommunityPage.tsx
│   ├── MessagesPage.tsx
│   ├── ProfilePage.tsx
│   └── OnboardingV2Page.tsx   # 不在 AppLayout 内，独立滚动
└── components/
    ├── layout/
    │   ├── AppLayout.tsx     # h-screen flex-col，固定 TopNav/BottomNav
    │   ├── TopNav.tsx        # fixed h-16
    │   └── BottomNav.tsx     # fixed bottom-0
    └── v2/
```

---

*最后更新：2026-04-29*
