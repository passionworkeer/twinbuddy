# TwinBuddy 前端结构概览

> 依据：`twinbuddy/frontend/src/` 实际代码 + zyronon/douyin 基座 + 评审 F0-F8 切片
> 范围：Vue 3 / Vite / Pinia / 路由 / 黄金顺序 Feed / 行动卡组件树 / Mock 数据流

---

## 1. 技术栈

| 类别 | 选型 | 版本 |
|---|---|---|
| 框架 | Vue | 3.4+ |
| 构建 | Vite | 5+ |
| 路由 | vue-router | 4 |
| 状态 | Pinia | 2 |
| HTTP | axios | 1.x（mock-adapter 拦截）|
| UI | Less + 自定义 | — |
| 工具 | vue-demi / vConsole（mobile） | — |
| 测试 | Vitest + Playwright | — |

---

## 2. 目录结构（实际）

```
twinbuddy/frontend/
├── public/
│   ├── favicon.ico
│   ├── images/                    ← 静态图标
│   ├── videos/                    ← 我们新增：6 场景视频素材占位
│   └── libarchive.wasm            ← 7z 解压
├── src/
│   ├── api/
│   │   ├── videos.ts              ← 视频 API 端点
│   │   ├── user.ts                ← 用户 API
│   │   └── ...
│   ├── assets/
│   │   ├── img/                   ← 抖音 UI 图标
│   │   ├── data/
│   │   │   ├── posts6.json        ← 6 条首屏视频
│   │   │   └── resource.js        ← 音乐 / 表情等资源
│   │   └── less/                  ← 全局样式
│   ├── components/
│   │   ├── slide/                 ← Feed 滚动组件
│   │   │   ├── SlideHorizontal.vue
│   │   │   ├── SlideItem.vue
│   │   │   ├── SlideList.vue      ← 视频列表（核心）
│   │   │   ├── SlideUser.vue
│   │   │   ├── SlideVertical.vue
│   │   │   ├── SlideVerticalInfinite.vue
│   │   │   └── SlideRowList.vue
│   │   ├── BaseVideo.vue          ← 单个视频
│   │   ├── ItemDesc.vue
│   │   ├── ItemToolbar.vue
│   │   ├── Indicator.vue
│   │   ├── IndicatorLight.vue
│   │   ├── Comment.vue
│   │   ├── Share.vue
│   │   ├── DouyinCode.vue
│   │   ├── UserPanel.vue
│   │   ├── Posters.vue
│   │   ├── Search.vue
│   │   └── dialog/ConfirmDialog.vue
│   ├── config/index.ts            ← BASE_URL / FILE_URL / 环境变量
│   ├── mock/index.ts              ← axios-mock-adapter 拦截所有 API
│   ├── pages/
│   │   ├── home/
│   │   │   ├── index.vue          ← Home 主页面（4 个 tab）
│   │   │   ├── components/        ← VideoShare / FollowSetting / PlayFeedback / ShareTo
│   │   │   └── slide/
│   │   │       ├── Slide0.vue     ← 附近 tab
│   │   │       ├── Slide2.vue     ← 关注 tab
│   │   │       ├── Slide4.vue     ← 推荐 tab（核心）
│   │   │       ├── Community.vue
│   │   │       ├── LongVideo.vue
│   │   │       └── SlideList.vue
│   │   ├── other/VideoDetail.vue
│   │   ├── message/components/    ← 评论区 / BlockDialog
│   │   ├── me/                    ← 我的页（收藏 / 资料 / 设置）
│   │   ├── home/live/             ← 扫一扫
│   │   └── home/search/
│   ├── store/pinia.ts             ← 全局 store（userinfo / users / routeData）
│   ├── router/                    ← 路由
│   ├── utils/
│   │   ├── bus.ts                 ← 事件总线
│   │   ├── const_var.ts           ← DefaultUser
│   │   ├── enums.ts
│   │   ├── request.ts             ← axios 实例
│   │   ├── slide.ts
│   │   ├── hooks/useNav.ts
│   │   └── mixin.ts
│   ├── App.vue
│   └── main.ts
├── node/                          ← 数据处理脚本
│   ├── post/                      ← 抖音视频数据处理
│   │   ├── make-scene-data.mjs    ← 我们新增：场景视频数据生成
│   │   └── scene-config/          ← 我们新增：6 场景 config
│   │       ├── trip.mjs
│   │       ├── food.mjs
│   │       ├── fitness.mjs
│   │       ├── study.mjs
│   │       ├── event.mjs
│   │       ├── shopping.mjs
│   │       └── noise.mjs
│   ├── user/                      ← 抖音用户数据
│   ├── xhs/                       ← 小红书数据
│   └── comment/                   ← 评论数据
└── package.json
```

---

## 3. 路由（草案 + 已存在）

```ts
// src/router/index.ts
const routes = [
  // 已存在
  { path: '/', redirect: '/home' },
  { path: '/home', component: () => import('@/pages/home/index.vue') },
  { path: '/video-detail', component: () => import('@/pages/other/VideoDetail.vue') },
  { path: '/home/search', component: () => import('@/pages/home/search/...') },
  { path: '/me', component: () => import('@/pages/me/...') },
  { path: '/home/live', component: () => import('@/pages/home/live/...') },
  // 我们新增
  { path: '/feed', component: HomeFeed },                    // 黄金顺序 Feed
  { path: '/card/:id', component: ActionCardDetail },        // F2
  { path: '/negotiate/:cardId', component: AiTwinNegotiation }, // F3
  { path: '/invite/:cardId/:candidateId', component: OneClickInvite }, // F4
  { path: '/survey', component: OnboardingSurvey },           // F7
  { path: '/twin', component: TwinMaturity },                // F8
  { path: '/archive', component: ActionBox },                // F6
]
```

---

## 4. 黄金顺序 Feed（F0 改造）

### 4.1 现状

`pages/home/index.vue` 用 `SlideHorizontal` + 4 个 tab（Slide0/2/4/LongVideo/Community），每个 tab 调 `recommendedVideo` 拉数据。

**问题**：4 tab 平铺，没有"行动卡插入视频流"的语义。

### 4.2 目标

按 PRD §10.4 黄金顺序：

```
[1-8]  普通内容
[9]    轻提示卡
[10-11] 普通内容
[12]   旅行行动卡（主 demo）
[13-16] 普通内容
[17]   第 2 张行动卡（场景切换：美食/健身/...）
[18]   邀约文案
```

### 4.3 实现

新建 `pages/feed/index.vue` + 复用 `SlideList`：

```ts
// pages/feed/index.vue
const GOLDEN_ORDER = [
  { type: 'video', count: 8 },
  { type: 'hint', scene: 'trip' },
  { type: 'video', count: 2 },
  { type: 'action-card', scene: 'trip', variant: 'plan' },
  { type: 'video', count: 4 },
  { type: 'action-card', scene: 'food', variant: 'plan' },
  { type: 'invite-complete', cardId: 'trip' },
]
```

`SlideList` 检测到 `type === 'action-card'` 时，渲染 `ActionCard.vue` 替代视频。

### 4.4 触发条件

- 第一次打开：8 普通 + 轻提示（**第 9 个**）
- 第二次及之后：完整黄金顺序

---

## 5. ActionCard 组件树（F1）

```
ActionCard.vue                       ← 通用（4 态）
├── HintVariant.vue                  ← 轻提示
├── PlanVariant.vue                  ← 行动方案
├── BuddyVariant.vue                 ← 搭子协商
│   ├── CandidateCard.vue            ← 候选人 A/B/C
│   └── KeyMoment.vue                ← 1 个关键瞬间
└── CompleteVariant.vue              ← 推进完成
    ├── InviteTemplate.vue           ← 邀约文案渲染
    └── FollowUpButtons.vue          ← 路线/团购/票务
```

`ActionCardDetail.vue`（F2）= 卡片详情页 = `ActionCard variant=buddy` + 协商入口

---

## 6. Pinia Store

### 6.1 现状

`store/pinia.ts` 暴露：
- `userinfo` — 当前用户
- `users` — mock 用户池
- `routeData` — 路由间传递的数据
- `loading` — 全局 loading

### 6.2 新增

```ts
// store/action-card.ts
export const useActionCardStore = defineStore('action-card', {
  state: () => ({
    dampenStates: {} as Record<SceneType, DampenState>,  // 降权状态
    currentCard: null as ActionCard | null,
    candidates: [] as Candidate[],
    negotiationResult: null as NegotiationSummary | null,
  }),
  actions: {
    dampen(scene: SceneType) { ... },
    isDampened(scene: SceneType): boolean { ... },
    loadCard(id: string) { ... },
  }
})
```

---

## 7. Mock 数据流

### 7.1 现有

`src/mock/index.ts` 用 axios-mock-adapter 拦截：

- `/video/recommended` → 返回 `posts6.json` + 异步 `videos.md`
- `/video/comments` → 返回 `comments/<id>.md`
- `/post/recommended` → 返回 `posts.md`
- `/user/panel` `/user/friends` → 返回 `users.md`

### 7.2 新增拦截

```ts
// src/mock/index.ts
mock.onGet(/action-cards\/trip\/featured/).reply(200, {
  data: tripCardA1,  // 从 docs/action-cards.md A1 #1
  code: 200,
})

mock.onPost(/action-cards\/dampen/).reply((config) => {
  const { scene } = JSON.parse(config.data)
  // 写 localStorage
  return [200, { data: { success: true }, code: 200 }]
})
```

### 7.3 真实视频源（**未解决**，等用户通道）

- `zyronon/douyin` 部署在 `https://dy.ttentau.top/data/videos.md`（DNS 黑洞 198.18.0.186，无法拉）
- `node/ouput.json` 18 条真实抖音 CDN URL（带签名，可能过期）
- `node/post/data/*.json` 拉过数据的本地缓存

**当前实现**：URL 走 picsum 图片 + 静态 cover，视频 mp4 占位指向 `public/videos/`，等用户通道解决后替换。

---

## 8. 关键路径

| 路径 | 步骤 |
|---|---|
| 用户打开 App | `/` → 检查 onboarding → `/feed`（黄金顺序）|
| 用户点行动卡 | `/card/:id` → 4 态展开 |
| 用户选搭子 | `/card/:id#buddy` → `/negotiate/:id` |
| 协商完成 | `/negotiate/:id` → `/invite/:id/:candidateId` |
| 用户继续 | `/invite/...` → 调 `/api/stt/ws` 发邀约 |

---

## 9. 与 zyronon/douyin 的关系

- **保留**：slide 组件、video 播放、comment、share、user panel、Pinia、router、mock-adapter 拦截方式
- **冻结**：React 端 22 个 v2 页面（CLAUDE.md 明确"本次不再维护"）
- **改造**：`/home` → `/feed`（黄金顺序） + ActionCard 组件树

---

## 10. 性能

- **首屏**：`<Suspense>` 包裹 action-card 异步加载
- **滚动**：`<RecycleScroller>` 复用 DOM（`vue-virtual-scroller`）
- **图片**：`<img loading="lazy">` + 缩略图
- **路由**：`defineAsyncComponent` 懒加载
- **Pinia**：`pinia-plugin-persistedstate` localStorage 持久化降权状态

---

## 11. 测试

### 11.1 Vitest 单测

- `SlideList` 黄金顺序逻辑
- `ActionCard` 4 态切换
- `useActionCardStore` 降权/恢复
- `timeAwareTitle` 时段切换

### 11.2 Playwright E2E（已有 `e2e/twinbuddy-e2e.spec.ts`）

新增 11 个流程（PRD §5.2 覆盖）：

1. 打开 App → Feed 黄金顺序
2. 第 9 卡片 = 轻提示卡
3. 点轻提示 → 行动方案卡
4. 点"看搭子" → 3 个候选人
5. 选 A → 协商页
6. 协商完成 → 邀约页
7. 邀约渲染真人语气
8. 抑制本场景 → 第 2 张行动卡不出
9. 时间感知：21 点后美食标题变化
10. 30 秒问卷（刷 10 条后触发）
11. Twin 成熟度角标显示
