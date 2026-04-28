# TwinBuddy 前端界面描述文档

> 版本：v2.0
> 平台：Web（React + TypeScript + Tailwind CSS）
> 最后更新：2026-04-27

---

## 一、项目概述

TwinBuddy（孪生搭子）是一款 AI 驱动的旅行搭子匹配应用。核心创新在于：用户无需主动搜索、谈判，系统通过"数字孪生"（AI Persona）自动完成旅行计划协商，用户只需"同意"即可。

---

## 二、页面清单与路由

| # | 页面名称 | 路由 | 描述 |
|---|---------|------|------|
| 1 | 引导页 | `/` | 应用入口，重定向至 onboarding |
| 2 | **Onboarding** | `/onboarding` | 用户注册/性格测试（MBTI + 兴趣 + 城市 + 预算） |
| 3 | **Home** | `/home` | 主页，AI 旅行顾问对话 + 推荐卡片轮播 |
| 4 | **Buddies** | `/buddies` | 搭子列表，匹配卡片展示 |
| 5 | **Blind Game** | `/blind-game/:buddyId/:negotiationId` | 6 轮盲猜偏好匹配游戏 |
| 6 | **Messages** | `/messages` | 与已匹配搭子的私信列表 |
| 7 | **Chat Room** | `/messages/:roomId` | 私信详情（嵌套在 Messages 内） |
| 8 | **Community** | `/community` | 旅行社区，动态信息流 |
| 9 | **Post Detail** | `/community/post/:postId` | 帖子详情 + 评论区（嵌套在 Community 内） |
| 10 | **Profile** | `/profile` | 个人主页，MBTI/兴趣/预算管理 |
| 11 | **404** | `*` | 未找到页面 |

---

## 三、页面详细说明

---

### 页面 2：Onboarding 引导页

**路由：** `/onboarding`

**用途：** 首次使用或未完善资料的用户完成性格画像

**内容区块：**

| # | 区块 | 组件 | 说明 |
|---|-----|------|------|
| 2.1 | 欢迎引导 | WelcomeStep | 介绍 TwinBuddy 价值主张，3 张介绍卡片轮播 |
| 2.2 | MBTI 输入 | MBTIStep | 16 型人格选择（E/I × S/N × T/F × J/P 4 步）或跳过 |
| 2.3 | 兴趣标签 | InterestStep | 多选标签（美食/摄影/徒步/历史/夜生活等），最多 10 个 |
| 2.4 | 城市选择 | CityStep | 出发城市搜索选择 |
| 2.5 | 旅行偏好 | TravelPrefStep | 旅行范围（周边/国内/国际）、预算区间（¥/¥¥/¥¥¥） |
| 2.6 | 语音介绍（可选） | VoiceIntroStep | 语音输入自我描述，生成更精准 Persona |
| 2.7 | 完成确认 | ProfileReviewStep | 汇总显示已填信息，可编辑，返回修改 |

**组件：**
- `WelcomeStep` — 介绍页
- `MBTIStep` — MBTI 4 轴选择器
- `InterestStep` — 标签多选器
- `CityStep` — 城市搜索下拉
- `TravelPrefStep` — 旅行偏好表单
- `VoiceInputButton` — 语音输入按钮
- `VoiceIntroStep` — 语音录制 + 回放 + 确认
- `ProfileReviewStep` — 信息汇总确认

**API 交互：**
- `GET /api/persona` — 获取当前用户 Persona
- `POST /api/profiles` — 创建/更新用户资料

**跳转逻辑：**
```
Onboarding → (完成) → Home
Onboarding → (未完成) → 可返回任意步骤编辑
```

---

### 页面 3：Home 主页

**路由：** `/home`

**用途：** 用户日常打开 App 的第一屏，展示 AI 顾问 + 个性化推荐

**内容区块：**

| # | 区块 | 组件 | 说明 |
|---|-----|------|------|
| 3.1 | 顶部导航栏 | TopNavBar | Logo + 消息入口（未读数 badge） + 头像入口 |
| 3.2 | AI 旅行顾问对话 | TravelAdvisorChat | 底部输入框发送消息，流式响应，展示对话历史 |
| 3.3 | 推荐搭子轮播 | ShowcaseCarousel | 水平滑动卡片，展示 3-5 个高匹配度搭子 |
| 3.4 | 快速操作入口 | QuickActions | "找搭子" / "发帖子" / "看社区" 三个快捷按钮 |
| 3.5 | 今日匹配提示 | MatchTipCard | 推送式卡片，如"3 位新搭子与你匹配！"点击跳转 Buddies |

**组件：**
- `TopNavBar` — 顶部导航
- `TravelAdvisorChat` — AI 对话界面（流式）
- `ShowcaseCarousel` — 推荐卡片轮播（使用 `TwinCard`）
- `QuickActions` — 快捷入口按钮组
- `MatchTipCard` — 匹配提示卡片

**API 交互：**
- `POST /api/chat/send` — AI 旅行顾问对话（流式）
- `GET /api/buddies/inbox` — 获取推荐搭子列表

**跳转逻辑：**
```
Home → (点击搭子卡片) → Buddies
Home → (点击消息图标) → Messages
Home → (点击头像) → Profile
Home → (点击"发帖子") → Community（新建帖子模式）
Home → (点击"看社区") → Community
Home → (点击 AI 顾问推荐) → Blind Game
```

---

### 页面 4：Buddies 搭子列表

**路由：** `/buddies`

**用途：** 展示所有已匹配/待匹配的搭子卡片

**内容区块：**

| # | 区块 | 组件 | 说明 |
|---|-----|------|------|
| 4.1 | 标签切换栏 | FilterTabs | 全部 / 已同意 / 待处理 / 已拒绝 |
| 4.2 | 搭子卡片列表 | BuddyCardList | 垂直滚动列表，每项一张 TwinCard |
| 4.3 | 空状态 | EmptyBuddiesState | 无匹配时显示插画 + "去探索"按钮 |

**TwinCard 单卡内容：**

| 字段 | 说明 |
|------|------|
| 头像 + 昵称 + MBTI | 基本信息 |
| 城市 | 所在城市 |
| 匹配分（0-100） | 大数字突出显示 |
| 共识亮点（1-3 条） | 绿色标签，如"都爱美食" |
| 冲突提醒（0-2 条） | 红色标签，如"节奏差异大" |
| 行动按钮 | "同意"/"再想想"/"开始盲猜" |

**组件：**
- `FilterTabs` — 状态筛选标签
- `BuddyCardList` — 搭子卡片列表（虚拟滚动）
- `TwinCard` — 搭子匹配卡片
- `RadarChart` — 6 维兼容性雷达图（点击卡片展开时显示）
- `BuddyDetailModal` — 搭子详情弹窗（雷达图 + 协商摘要 + RedFlags）
- `NegotiationThread` — AI 协商对话历史展示
- `RedFlagsPanel` — 潜在冲突警示面板
- `EmptyBuddiesState` — 空状态插画

**API 交互：**
- `GET /api/buddies/inbox` — 获取搭子卡片列表
- `GET /api/buddies/{id}/card` — 获取单个搭子详情（含协商摘要）
- `POST /api/buddies/{id}/accept` — 同意匹配
- `POST /api/negotiate` — 触发协商（按需）

**跳转逻辑：**
```
Buddies → (点击卡片) → BuddyDetailModal（弹窗）
Buddies → (点击"同意") → 刷新列表 + Toast 提示
Buddies → (点击"开始盲猜") → Blind Game
Buddies → (点击搭子头像) → Messages（进入私信）
```

---

### 页面 5：Blind Game 盲猜游戏

**路由：** `/blind-game/:buddyId/:negotiationId`

**用途：** 双方独立回答 6 轮 A/B 偏好问题，最后一次性揭晓答案

**内容区块：**

| # | 区块 | 组件 | 说明 |
|---|-----|------|------|
| 5.1 | 游戏进度条 | GameProgressBar | 显示当前第几轮（1-6），进度指示器 |
| 5.2 | 搭子头像 + 昵称 | OpponentHeader | 显示对方基本信息 |
| 5.3 | 问题展示区 | QuestionCard | 显示当前 A/B 偏好问题 |
| 5.4 | 选项 A/B | AnswerOptions | 两个选项卡片，点击选择 |
| 5.5 | 等待对方 | WaitingOverlay | 本轮提交后等待对方回答的遮罩 |
| 5.6 | 结果揭晓 | RevealScreen | 6 轮结束后一次性展示双方所有答案 + 匹配率 |
| 5.7 | 旅行报告 | TripReportModal | 可选：提交旅行安全报告 |

**QuestionCard 问题示例：**
- "旅行节奏：A. 暴走打卡 / B. 慢旅行"
- "预算风格：A. 穷游体验 / B. 舒适优先"
- "住宿偏好：A. 青旅社交 / B. 酒店隐私"

**组件：**
- `GameProgressBar` — 进度条
- `OpponentHeader` — 对手信息
- `QuestionCard` — 问题展示卡
- `AnswerOptions` — A/B 选项
- `WaitingOverlay` — 等待遮罩
- `RevealScreen` — 结果揭晓大屏（双方头像 + 对比图 + 匹配率）
- `TripReportModal` — 旅行报告表单

**API 交互：**
- `POST /api/games/blind/start` — 开始游戏
- `POST /api/games/blind/answer` — 提交每轮答案
- `POST /api/trips/report` — 提交旅行报告

**跳转逻辑：**
```
Blind Game → (6 轮完成) → RevealScreen（结果揭晓）
Blind Game → (点击"继续聊天") → Messages
Blind Game → (点击"再找一个") → Buddies
```

---

### 页面 6：Messages 私信列表

**路由：** `/messages`

**用途：** 与已同意的搭子的私信会话列表

**内容区块：**

| # | 区块 | 组件 | 说明 |
|---|-----|------|------|
| 6.1 | 顶部导航栏 | TopNavBar | "消息" 标题 + 新建聊天按钮 |
| 6.2 | 会话列表 | ConversationList | 按最近消息排序，每项显示头像/昵称/最后消息/时间 |
| 6.3 | 空状态 | EmptyMessagesState | 无私信时显示引导文案 |
| 6.4 | 未读 Badge | UnreadBadge | 每条会话未读消息计数 |

**Chat Room 私信详情（子路由 `/messages/:roomId`）：**

| # | 区块 | 组件 | 说明 |
|---|-----|------|------|
| 6.5 | 聊天导航栏 | ChatNavBar | 对方头像/昵称 + 更多操作 |
| 6.6 | 消息列表 | MessageBubbleList | 气泡式消息流，时间分割线 |
| 6.7 | 输入区 | ChatInputArea | 文本输入框 + 发送按钮 |

**消息类型：**
- 文字消息（气泡）
- 图片消息
- 位置分享（旅行地点）
- 旅行计划卡片（系统消息，格式化的行程摘要）

**组件：**
- `ConversationList` — 会话列表
- `ConversationItem` — 单条会话项
- `ChatNavBar` — 聊天导航
- `MessageBubbleList` — 消息流
- `MessageBubble` — 单条消息气泡
- `ChatInputArea` — 输入区
- `LocationShareCard` — 位置分享卡片
- `TripPlanCard` — 旅行计划卡片（系统消息）
- `EmptyMessagesState` — 空状态

**API 交互：**
- `GET /api/conversations` — 获取会话列表
- `GET /api/messages/{room_id}` — 获取历史消息
- `POST /api/messages/{room_id}` — 发送消息（WebSocket 实时推送）

**跳转逻辑：**
```
Messages → (点击会话) → Chat Room
Chat Room → (点击头像) → 对方 Profile（弹窗或新标签）
Chat Room → (点击旅行计划卡片) → 展开详情
```

---

### 页面 8：Community 社区

**路由：** `/community`

**用途：** 旅行动态信息流，用户发布旅行计划/游记

**内容区块：**

| # | 区块 | 组件 | 说明 |
|---|-----|------|------|
| 8.1 | 顶部 Tab 栏 | CommunityTabs | 关注 / 推荐 / 附近 |
| 8.2 | 帖子列表 | PostFeed | 无限滚动信息流 |
| 8.3 | 发帖 FAB | FloatingActionButton | 右下角"+"按钮，点击展开发帖 |
| 8.4 | 顶部搜索栏 | SearchBar | 搜索帖子/用户 |

**PostCard 帖子卡片：**

| 字段 | 说明 |
|------|------|
| 用户头像 + 昵称 + MBTI | 发布者信息 |
| 发布时间 | 相对时间 |
| 正文 | 最多 3 行折叠 |
| 图片网格 | 1/2/3/4/6/9 格布局 |
| 点赞/评论/分享按钮 | 互动栏 |
| 旅行标签 | 如 #东京 #美食 #独自旅行 |

**Post Detail 帖子详情（子路由 `/community/post/:postId`）：**

| # | 区块 | 组件 | 说明 |
|---|-----|------|------|
| 8.5 | 返回导航 | BackNavBar | 返回按钮 + 分享按钮 |
| 8.6 | 帖子正文 | PostDetailContent | 完整正文 + 图片画廊（可放大） |
| 8.7 | 评论列表 | CommentList | 嵌套评论流 |
| 8.8 | 评论输入 | CommentInput | 回复输入框 |

**发帖弹窗（新建帖子）：**

| 字段 | 说明 |
|------|------|
| 图片上传 | 最多 9 张 |
| 正文输入 | 限 500 字 |
| 旅行标签 | 快速选择或自定义 |
| 可见性 | 公开/仅搭子 |

**组件：**
- `CommunityTabs` — Tab 切换
- `PostFeed` — 帖子信息流（无限滚动）
- `PostCard` — 帖子卡片
- `ImageGrid` — 图片网格（懒加载）
- `LikeButton` — 点赞按钮（动画）
- `FloatingActionButton` — 发帖按钮
- `NewPostModal` — 新建帖子弹窗
- `SearchBar` — 搜索栏
- `PostDetailContent` — 帖子详情正文
- `ImageGallery` — 图片画廊（Lightbox）
- `CommentList` — 评论列表
- `CommentItem` — 单条评论（支持嵌套）
- `CommentInput` — 评论输入框
- `EmptyFeedState` — 空信息流

**API 交互：**
- `GET /api/posts/feed` — 获取帖子流
- `GET /api/posts` — 获取全部帖子
- `POST /api/posts` — 发布帖子
- `GET /api/posts/{id}/comments` — 获取评论
- `POST /api/posts/{id}/comments` — 发表评论

**跳转逻辑：**
```
Community → (点击帖子) → Post Detail
Community → (点击用户头像) → 用户 Profile（弹窗）
Community → (点击 FAB) → NewPostModal
Post Detail → (点击评论) → 回复输入框聚焦
Post Detail → (点击图片) → ImageGallery（Lightbox）
```

---

### 页面 10：Profile 个人主页

**路由：** `/profile`

**用途：** 管理个人资料、性格设置、账号安全

**内容区块：**

| # | 区块 | 组件 | 说明 |
|---|-----|------|------|
| 10.1 | 头像 + 基本信息 | ProfileHeader | 头像/昵称/MBTI/城市，可编辑 |
| 10.2 | MING 四维雷达图 | MINGRadarChart | 认知/表达/行为/情感 四维雷达图 |
| 10.3 | 兴趣标签展示 | InterestTags | 当前已选兴趣标签，可增删 |
| 10.4 | 旅行偏好卡片 | TravelPreferenceCard | 旅行范围/预算/风格 |
| 10.5 | 隐私/安全设置 | SecuritySettings | 账号安全、隐私设置 |
| 10.6 | AI Persona 预览 | PersonaPreviewCard | 当前 AI 生成的 Persona 摘要 |
| 10.7 | 退出登录 | LogoutButton | 退出当前账号 |

**编辑个人资料：**
- 点击各区块右上角"编辑"按钮，弹出编辑弹窗
- MBTI 重新测试：跳转 Onboarding 指定步骤

**组件：**
- `ProfileHeader` — 头部信息（可编辑头像）
- `MINGRadarChart` — 四维雷达图
- `InterestTags` — 兴趣标签管理
- `TravelPreferenceCard` — 旅行偏好卡片
- `SecuritySettings` — 安全设置面板
- `PersonaPreviewCard` — AI Persona 预览
- `EditProfileModal` — 编辑资料弹窗
- `LogoutButton` — 退出登录

**API 交互：**
- `GET /api/profiles` — 获取个人资料
- `PATCH /api/profiles` — 更新个人资料
- `GET /api/persona` — 获取 AI Persona
- `GET /api/security/status/{user_id}` — 获取安全状态

**跳转逻辑：**
```
Profile → (点击编辑) → EditProfileModal
Profile → (点击重新测试 MBTI) → Onboarding（MBTI 步骤）
Profile → (点击安全设置) → SecuritySettings（展开）
Profile → (点击退出) → 确认弹窗 → 跳转 /
```

---

## 四、公共组件（全局可用）

| 组件 | 说明 | 使用页面 |
|------|------|---------|
| `TopNavBar` | 顶部导航栏（Logo + 操作按钮） | Home, Messages, Community |
| `BottomNavBar` | 底部 Tab 导航 | Home, Buddies, Messages, Community, Profile |
| `Toast` | 操作反馈提示（成功/失败/加载中） | 全局 |
| `LoadingSpinner` | 全屏/局部加载态 | 全局 |
| `Modal` | 通用弹窗容器 | 全局 |
| `Drawer` | 侧边抽屉 | 全局 |
| `Avatar` | 用户头像（支持 fallback） | 全局 |
| `Badge` | 数字角标（未读数等） | 全局 |
| `Tag` | 标签（共识亮点/冲突警示/旅行标签） | Buddies, Community |
| `Skeleton` | 内容加载骨架屏 | 全局 |
| `EmptyState` | 空状态插画（各场景独立文案） | Buddies, Messages, Community |

---

## 五、底部 Tab 导航（BottomNavBar）

```
┌─────────┬─────────┬─────────┬─────────┬─────────┐
│  Home   │ Buddies │ Messages │Community│ Profile │
│  🏠     │   🤝    │    💬    │    🌍   │   👤    │
└─────────┴─────────┴─────────┴─────────┴─────────┘
```

- 固定底部，5 个 Tab
- 选中态：图标高亮 + 文字加粗
- Messages Tab：叠加未读数 Badge
- 切换 Tab 保留页面状态（keep-alive）

---

## 六、认证与路由守卫

| 场景 | 行为 |
|------|------|
| 未登录访问受保护页 | 跳转 `/onboarding` |
| 登录后访问 onboarding | 跳转 `/home` |
| 404 路由 | 渲染 404 页面，显示返回首页按钮 |
| 网络错误 | 全局 Toast 提示 + 重试按钮 |

---

## 七、数据流总览

```
用户操作
   ↓
React 组件（UI 事件）
   ↓
API Client (src/api/client.ts)
   ↓
FastAPI Backend (api/frontend_api.py)
   ↓
PostgreSQL / Redis / Qdrant
   ↓
响应数据 → 更新 React 状态 → 重新渲染 UI
```

关键 Hooks：
- `useOnboarding` — 管理引导流程状态
- `useBuddies` — 管理搭子列表数据
- `useMessages` — 管理私信数据（含 WebSocket 实时）
- `useCommunity` — 管理社区帖子数据
- `useProfile` — 管理个人资料

---

## 八、样式与主题

- **CSS 框架：** Tailwind CSS v3
- **主题色：** 品牌蓝 `#4F46E5`（可配置）
- **暗色模式：** 支持（跟随系统）
- **字体：** 系统默认字体栈
- **图标：** Heroicons 或 Lucide React
- **圆角：** 统一 `rounded-xl`（16px）
- **阴影：** `shadow-md` 统一卡片阴影

---

## 九、响应式策略

| 断点 | 设备 | 布局 |
|------|------|------|
| `< 640px` | 手机 | 单列布局，BottomNav |
| `640px - 1024px` | 平板 | 双列卡片，SideNav 可选 |
| `> 1024px` | 桌面 | 三列布局，侧边导航栏 |

---

*文档结束*
