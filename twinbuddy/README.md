# 孪生搭子 TwinBuddy

> 你的另一个你，已经替你搞定了。
>
> **赛道三 · AI体验：刷到懂你的瞬间**
> 抖音 AI 创变者计划 · 深圳大学城站 · Hackathon 2026

---

## 一、项目概述

### 产品定位

**TwinBuddy** 是一个基于数字孪生体的智能搭子匹配产品。

它的核心体验不是"给你一个工具，你自己去找搭子"，而是——

> **你正常刷抖音，一张 AI 卡片弹出来：你的数字孪生体已经帮你和对方聊过了，行程排好了，搭子也筛出来了，你只需要点"同意"。**

### 核心差异

| 传统搭子产品 | TwinBuddy |
|-------------|-----------|
| 你主动找、自己聊 | 数字孪生体在后台替你谈 |
| 靠问卷了解你 | 数字孪生体模仿你的真实人格 |
| 你承担沟通成本 | 你只需要旁观、点头 |
| 事后匹配 | 刷到即触发 |

### Slogan

```
每个人的数字孪生体，都在后台为你工作。
TwinBuddy — 你的另一个你，已经替你搞定了。
```

---

## 二、未来愿景

### 每个人都会有自己的数字人

我们相信，在不远的将来：

- **每个人都会拥有一个完整人格的数字孪生体**
- 它由你真实的浏览、互动、表达数据训练而成
- 它了解你的性格、习惯、说话方式、决策风格
- 它在后台持续运行，替你处理一切"需要找个伴"的事

### 数字人的能力

```
🧠 帮我思考 — 分析选项、推演后果
🤝 帮我找搭子 — 智能匹配、替你谈判
📝 帮我干活 — 行程规划、细节协商
⚡ 永不掉线 — 24小时后台运行
```

### 场景扩展

不只旅游搭子——所有"需要找个伴"的场景：

```
旅行搭子  →  美食搭子  →  赛事搭子
学习搭子  →  健身搭子  →  演唱会搭子
……
```

---

## 三、技术架构

### 整体架构

```
┌──────────────────────────────────────────────────────┐
│                    前端（React + Vite）               │
│   Onboarding / 模拟抖音Feed / 懂你卡片 / 雷达图       │
│   localStorage 持久化 / Web Speech API               │
└──────────────────────────┬───────────────────────────┘
                           │ HTTP API
┌──────────────────────────▼───────────────────────────┐
│                    后端（FastAPI）                    │
│                                                     │
│  ┌─────────────┐   ┌────────────────────────────┐  │
│  │  数据解析层  │   │     Fusion 蒸馏引擎          │  │
│  │  - MBTI解析 │   │  - 四维蒸馏                  │  │
│  │  - 标签融合  │   │  - 固定权重融合              │  │
│  │  - 风格提取  │   │  - confidence 标记          │  │
│  └─────────────┘   └────────────────────────────┘  │
│                                                     │
│  ┌─────────────────┐   ┌────────────────────────┐  │
│  │ LangGraph 状态机  │   │    多 Agent 协商模块     │  │
│  │ - 协商状态流转   │   │  - 你的数字人 Agent      │  │
│  │ - 对话历史管理   │   │  - 对方数字人 Agent      │  │
│  └─────────────────┘   └────────────────────────┘  │
│                                                     │
│  ┌─────────────────┐   ┌────────────────────────┐  │
│  │  搭子数据层       │   │     卡片触发引擎         │  │
│  │  - 100个预设人格 │   │  - Feed 位置匹配         │  │
│  │  - 评分引擎      │   │  - 协商结果注入卡片      │  │
│  └─────────────────┘   └────────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

### 核心技术模块

#### 1. MING 人格蒸馏引擎

基于 MING Skill 构建的数字孪生体核心：

| 模块 | 说明 |
|------|------|
| 9步灵魂锻造 | identity → values → reasoning → boundaries → voice → relationships → growth |
| 四维蒸馏 | cognition（认知）/ expression（表达）/ behavior（行为）/ emotion（情感）|
| 固定权重融合 | MBTI 0.9 > 说话风格示例 0.8 > 兴趣标签 0.7 |
| 证据驱动进化 | 数据越丰富，数字人越像你 |

#### 2. LangGraph 双 Agent 协商

使用 LangGraph 状态机控制两个数字人的协商流程：

```
IDLE → PERSONA_INIT → CHAT_ROUND → CONFLICT_DETECTED →
NEGOTIATION → CONSENSUS_FOUND → REPORT_GENERATED → CARD_TRIGGERED
```

协商过程：
- 提案 / 评估 / 让步 / 拒绝 多种 Agent 角色
- 最多 3 轮协商
- 预生成结果兜底

#### 3. 懂你卡片三层结构

**第一层（刷到即见）：**
- 旅游地点 + 兼容度分数
- 两个数字人的对话截取
- 一句话总结协商结论

**第二层（点击展开）：**
- 完整协商对话记录
- 六维度雷达图可视化（MING 评分）
- red_flags 精简预警

**第三层（点击同意）：**
- 搭子邀请发送成功
- 等待对方确认

### 技术栈

| 层级 | 技术选型 |
|------|---------|
| 前端 | React + Vite + Tailwind CSS + TypeScript |
| 后端 | FastAPI + Python |
| Agent 框架 | LangGraph |
| LLM | 通义千问 / Kimi（JSON Mode）|
| 数据存储 | 前端 localStorage |
| 测试 | pytest + Playwright E2E |

---

## 四、数据说明

### 当前 Demo 阶段

> **本产品目前为黑客松 Demo 阶段，使用的是模拟数据，而非抖音真实数据。**

#### 数据来源

| 数据源 | 说明 |
|--------|------|
| MBTI | 用户手动选择（16型）|
| 兴趣标签 | 用户手动选择（旅游专用标签）|
| 说话风格 | 用户手动输入或语音输入 |
| 对方人格 | **100个预设搭子人格**（`agents/buddies/`） |
| 旅游地点 | 视频 Feed 中的地点标签 |

#### 评分引擎

`agents/scoring.py` 实现 MING 六维度兼容性评分：

| 维度 | 最高分 | 说明 |
|------|--------|------|
| pace（行程节奏）| 25 | J/P 轴 + pace 文字匹配 |
| social_energy（社交能量）| 20 | E/I 轴 + travel_style 匹配 |
| decision_style（决策风格）| 20 | T/F 轴 + negotiation_style 匹配 |
| interest_alignment（兴趣对齐）| 25 | N/S 轴 + likes/dislikes 语义归一 |
| budget（预算兼容）| 15 | 预算区间重叠度 |
| personality_completion（人格互补）| -5~+10 | MING 四象限 + 互补对 |

#### 未来接入抖音真实数据后

| 数据维度 | Demo 阶段 | 抖音真实数据接入后 |
|---------|-----------|-------------------|
| 用户画像 | 手动选择 | **抖音已有**的完整用户画像 |
| 兴趣偏好 | 手动标签 | **点赞/收藏/评论/观看时长**多维分析 |
| 说话风格 | 用户自述 | **评论/弹幕/私信**真实语料 |
| 决策风格 | MBTI 推断 | **浏览行为/购买决策**真实反映 |

---

## 五、项目结构

```
twinbuddy/
├── README.md                    ← 本文件
├── CLAUDE.md                    ← 开发规范
│
├── agents/                      ← 核心算法 + 搭子数据
│   ├── scoring.py               ← MING 六维度评分引擎
│   ├── matching_graph.py       ← LangGraph 协商图
│   ├── buddy_agent.py           ← 搭子 Agent
│   ├── buddies/                ← 100个搭子人格 JSON
│   │   ├── buddy_01.json
│   │   ├── buddy_01_prompt.md
│   │   └── ...
│   └── _archived/              ← 废弃文件（已归档）
│       └── mock_database.py
│
├── frontend/                    ← React + Vite + Tailwind
│   ├── src/
│   │   ├── pages/              ← 页面组件
│   │   │   ├── OnboardingPage.tsx
│   │   │   ├── FeedPage.tsx
│   │   │   └── ResultPage.tsx
│   │   ├── components/         ← 可复用组件
│   │   │   ├── TwinCard/
│   │   │   ├── RadarChart/
│   │   │   ├── immersive-feed/
│   │   │   └── feed/
│   │   ├── hooks/              ← 自定义 Hooks
│   │   ├── api/                ← API 客户端
│   │   ├── types/              ← TypeScript 类型
│   │   └── mocks/_archived/    ← 废弃 Mock 数据（已归档）
│   ├── e2e/                    ← Playwright E2E
│   └── package.json
│
├── backend/                     ← FastAPI
│   ├── main.py                 ← 入口
│   ├── api/
│   │   └── frontend_api.py     ← 前端对接 API
│   ├── fusion_engine.py        ← 融合蒸馏引擎
│   ├── persona_engine.py      ← Persona 生成
│   ├── card_engine.py          ← 卡片触发引擎
│   └── langgraph/             ← 协商状态机
│
├── docs/                       ← 文档
│   └── QNA.md                  ← 评委 Q&A 手册
│
└── MING/                       ← 人格蒸馏框架
```

---

## 六、快速开始

### 前置要求

- Node.js 18+
- Python 3.10+
- pnpm（推荐）或 npm

### 1. 启动后端

```bash
cd twinbuddy/backend
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

后端运行在 `http://localhost:8000`，API 文档在 `http://localhost:8000/docs`

### 2. 启动前端

```bash
cd twinbuddy/frontend
pnpm install
pnpm dev
```

前端运行在 `http://localhost:5173`

### 3. 访问产品

1. 打开 `http://localhost:5173`
2. 完成 Onboarding（MBTI + 兴趣标签 + 说话风格）
3. 开始刷 Feed
4. 等卡片弹出，体验双数字人协商

### 4. 运行测试

```bash
# 后端测试
cd twinbuddy/backend
python -m pytest

# 前端 E2E 测试
cd twinbuddy/frontend
npx playwright test
```

---

## 七、API 接口

### POST /api/onboarding

保存用户开局数据，生成数字孪生体。

### GET /api/persona

获取当前用户的数字孪生体。

### GET /api/buddies

获取搭子列表（`user_id` 可选，无则为公开列表）。

### POST /api/negotiate

双数字人协商，返回预生成协商结果。

### GET /health

健康检查。

---

## 八、演示流程（5分钟）

```
0:00-0:30  对比冷开场
"普通搭子匹配 = 填问卷、等人、靠运气。
 我们的做法不一样——你刷抖音，搭子已经给你找好了。"

0:30-1:00  模拟刷 Feed
[前两条是常规视频，营造正常体验]
[刷到第三条——懂你卡片弹出]

1:00-1:45  懂你卡片第一层
[地点 + 两个数字人对话截取]

1:45-2:30  点击展开第二层
[雷达图：六维度兼容度]
[协商对话记录]
[red_flags 预警]

2:30-3:00  点击同意第三层
"点个头，搭子就找到了。"

3:00-4:30  技术架构讲解
"MING人格蒸馏引擎 + LangGraph双Agent协商"

4:30-5:00  未来愿景 + 收尾
"未来接入抖音数据后，数字人会更像你。"
```

---

## 九、获奖亮点

| 评委关注点 | 我们的优势 |
|-----------|-----------|
| 赛道匹配度 | 直接对应赛道三——"刷到懂你的瞬间" |
| Agent 技术深度 | MING 人格蒸馏 + LangGraph 双 Agent 协商 |
| 现场 Demo 冲击力 | 评委亲手刷 Feed，卡片当场弹出，数字人当场互怼 |
| 差异化定位 | "不是找搭子的工具，是刷到就懂你的瞬间" |
| 抖音护城河 | 未来接入抖音真实数据后，数字人更真实 |
| 情感共鸣 | "另一个我在帮我做事"的体验感 |

---

## 十、团队

| 角色 | 职责 |
|------|------|
| 产品设计 | 产品定位、用户体验、演示流程 |
| 前端开发 | React、Feed组件、懂你卡片、雷达图 |
| 后端开发 | FastAPI、LangGraph协商、Fusion引擎 |
| 内容制作 | 搭子人格池、视频素材、预生成对话 |

---

*最后更新：2026-04-18*
