# TwinBuddy 前端接入文档

> 版本：v1.0.0
> 日期：2026-04-25

---

## 概览

前端 API 客户端：`src/api/client.ts`

**开发环境（`npm run dev`）：** Vite 代理 `/api` → `http://localhost:8008`
**生产环境：** 同源部署，无需代理

---

## API 客户端使用

```typescript
import { fetchPersona, fetchBuddies, negotiate } from '../api/client';
```

### fetchPersona — 获取/构建人格

```typescript
// 预计算场景（无 user_id）：根据参数构建人格
const persona = await fetchPersona({
  mbti: 'ENFP',
  interests: ['美食', '摄影'],
  city: 'chengdu',
  voiceText: '我是一个喜欢探索的人',
});

// 已有 user_id：从持久化数据读取
const persona = await fetchPersona({ userId: 'xxx' });
```

**返回类型：** `Promise<Persona>`

```typescript
interface Persona {
  persona_id: string;
  name: string;           // MBTI 标签（如 "热情开拓者"）
  avatar_emoji: string;   // emoji（如 "🌈"）
  avatar_prompt: string; // 生成 avatar 的 prompt
  layer0_hard_rules: string[];  // 绝不妥协的规则
  mbti_influence: string;
  travel_style: string;
  identity: PersonaLayer;
  speaking_style: PersonaLayer & { typical_phrases: string[]; chat_tone: string };
  emotion_decision: PersonaLayer & { stress_response: string; decision_style: string };
  social_behavior: PersonaLayer & { social_style: string };
  negotiation_style: { approach: string; hard_to_compromise: string[]; easy_to_compromise: string[] };
}

interface PersonaLayer {
  title: string;
  content: string;
  emoji: string;
}
```

---

### fetchBuddies — 获取推荐搭子

```typescript
const buddies = await fetchBuddies(
  undefined,    // userId（可选）
  10,           // limit，默认 10
  'ENFP',       // mbti
  ['美食', '摄影'], // interests
  'chengdu'     // city
);
// 返回: Record<string, unknown>[]
```

**返回类型：** `Promise<Record<string, unknown>[]>`

每个 Buddy 对象字段：

```typescript
interface Buddy {
  id: string;
  name: string;              // 搭子名称（如 "小满"）
  mbti: string;              // MBTI（如 "ENFP"）
  avatar_emoji: string;     // emoji
  travel_style: string;      // 旅行风格描述
  typical_phrases: string[]; // 口头禅
  negotiation_style: string; // 协商风格
  preferences: {
    likes: string[];
    dislikes: string[];
    budget: string;
    pace: string;
  };
  compatibility_score: number; // 0–100
}
```

---

### negotiate — 双 Agent 协商

```typescript
import type { NegotiateParams } from '../types';

const result = await negotiate({
  destination: 'dali',
  mbti: 'ENFP',
  interests: ['美食'],
  buddy_mbti: 'INFP',
  // 以下可选：
  user_id: 'xxx',
  user_persona_id: 'persona-enfp-xxx',
  voice_text: '...',
});
```

**返回类型：** `Promise<NegotiationResult>`

```typescript
interface NegotiationResult {
  destination: string;     // 目的地名称（如 "大理"）
  dates: string;           // 日期（如 "5月10日-5月15日"）
  budget: string;           // 预算（如 "人均3500元"）
  consensus: boolean;       // 是否达成共识
  plan: string[];          // 行程安排
  matched_buddies: string[]; // 双方名字
  radar: RadarData[];       // 六维度雷达
  red_flags: string[];      // 风险提示
  messages: NegotiationMessage[]; // 协商对话
}

interface RadarData {
  dimension: string;       // 维度名称
  user_score: number;      // 0–100
  buddy_score: number;     // 0–100
  weight: number;          // 0–1
}

interface NegotiationMessage {
  speaker: 'user' | 'buddy';
  content: string;
  timestamp: number;
}
```

---

## 页面/组件接入方式

### FeedPage（首页）

- 视频数据来源：`src/mocks/videos.json`（本地 Mock，**不走后端**）
- 懂你卡片数据：`usePrecomputedMatch` hook 从 localStorage 读取预计算结果
- 卡片展开时调用 `negotiate()` 触发协商

### OnboardingPage（引导页）

- 完成引导后 `completeOnboarding()` 在本地生成 `user_id` 和 `persona_id`
- 同步调用 `startPrecomputation()` 预计算搭子和协商结果（存储到 localStorage）
- 语音输入通过 WebSocket 直连 `/api/stt/ws`

```typescript
// WebSocket 连接示例
const ws = new WebSocket('ws://localhost:8008/api/stt/ws');
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'text') console.log('识别:', data.content);
  if (data.type === 'done') console.log('最终:', data.text);
};
// 发送音频帧
ws.send(audioChunk);
// 结束
ws.send(new Uint8Array(0));
```

### ResultPage / MatchReportDetailPage

- 仅读取 localStorage，不调用 API

---

## 状态管理

所有持久化数据存储在 `localStorage`，key 定义在 `STORAGE_KEYS`：

```typescript
export const STORAGE_KEYS = {
  onboarding: 'twinbuddy_onboarding_v3',         // 用户引导数据
  precomputed_match: 'twinbuddy_precomputed_match_v3', // 预计算结果
  negotiation_result: 'twinbuddy_negotiation_result_v3', // 最新协商结果
};
```

---

## API 错误处理

所有 API 函数在失败时抛出 `Error`，调用方需要 try-catch：

```typescript
try {
  const persona = await fetchPersona({ mbti: 'ENFP', city: 'chengdu' });
} catch (err) {
  console.error('获取人格失败:', err.message);
}
```

---

## 文件结构

```
src/
├── api/
│   └── client.ts          # API 客户端（fetchPersona / fetchBuddies / negotiate）
├── hooks/
│   ├── usePrecomputedMatch.ts  # 预计算 hook（调用 3 个 API）
│   ├── useCardBuddyPool.ts     # 搭子池 hook（调用 fetchBuddies）
│   └── useOnboarding.ts        # 引导状态（本地，无 API 调用）
├── pages/
│   ├── OnboardingPage.tsx      # 引导页（WebSocket STT）
│   ├── FeedPage.tsx             # Feed + 懂你卡片（negotiate）
│   ├── ResultPage.tsx           # 结果页（localStorage）
│   └── MatchReportDetailPage.tsx # 协商详情（localStorage）
├── mocks/
│   ├── videos.json               # 本地视频 Mock 数据
│   └── negotiations.json        # 降级用协商 Mock
└── types/
    └── index.ts                  # 所有 TypeScript 类型定义
```

---

*最后更新：2026-04-25*