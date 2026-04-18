# 孪生搭子 TwinBuddy

> 你的另一个你，已经替你搞定了。
>
> 你的数字孪生体，在后台为你找搭子。

---

## 产品介绍

**TwinBuddy** 是一个基于数字孪生体的智能搭子匹配产品，它重新定义了"找搭子"这件事。

### 产品定位

在旅行搭子场景中，人们面临一个根本性矛盾：筛选搭子需要大量时间和精力，而真正出门玩的时间反而被压缩。传统的匹配工具本质上只是一个"信息展示平台"——你需要自己聊、自己筛、自己协调。

TwinBuddy 想要解决的不是"信息流通"问题，而是"决策负担"问题。

### 核心差异

传统搭子平台 vs TwinBuddy：

| 维度 | 传统平台 | TwinBuddy |
|------|----------|-----------|
| 匹配方式 | 关键词/标签搜索 | 数字孪生体 AI 协商 |
| 协商过程 | 用户自己聊 | 两个 AI 替你谈 |
| 决策方式 | 对比 10 个候选人 | 看最终协商结果 |
| 时间成本 | 30 分钟+ | < 1 分钟 |
| 信息质量 | 文本描述 | 六维雷达图 |

### Slogan

> **你的另一个你，已经替你搞定了。**

它的核心体验不是"给你一个工具，你自己去找搭子"，而是——

> **你正常刷抖音，一张 AI 卡片弹出来：你的数字孪生体已经帮你和对方聊过了，行程排好了，搭子也筛出来了，你只需要点"同意"。**

### 核心功能

| 功能 | 说明 |
|------|------|
| MBTI 人格测试 | 16型人格测试，了解你的旅行偏好与沟通风格 |
| 兴趣标签 | 18个精选标签，多选匹配精确筛选 |
| 语音描述 | 支持语音输入，描述你理想的搭子模样 |
| 智能匹配 | 基于人格计算的搭子兼容性评分 |
| 双数字人协商 | 两个 AI 替你谈判行程细节，节省沟通成本 |
| 雷达图可视化 | 六维度展示兼容度，一眼看懂匹配质量 |
| 懂你卡片 | 协商完成后呈现最优方案，无需再看其他 |

---

## 技术架构

### 整体架构

```
用户操作（前端）
    │
    ▼
MBTI + 兴趣 → MING人格蒸馏 → 数字孪生体档案
                                    │
用户浏览Feed ──→ 兼容性评分 ──→ 候选搭子排序
                                    │
                              触发协商流程
                                    │
                    ┌───────────────┴───────────────┐
                    ▼                               ▼
            用户数字孪生体                    对方数字孪生体
              (Agent A)                          (Agent B)
                    │                               │
                    └────────── LangGraph ──────────┘
                                  │
                           协商状态机
                                  │
                           懂你卡片生成
                                  │
                              用户确认
```

### 核心技术模块

#### 1. MING 人格蒸馏

MING（MBTI-based Interaction Network Generator）是我们自研的人格蒸馏算法，它将用户的 MBTI 类型、兴趣标签和语音描述转化为一个结构化的数字孪生体档案。

```
输入：
  - MBTI 类型（16选1）
  - 兴趣标签（18选N）
  - 语音偏好描述（自然语言）

处理流程：
  1. MBTI 向量编码 → 16维向量空间映射
  2. 兴趣标签编码 → 标签权重向量
  3. LLM 理解语音描述 → 偏好特征提取
  4. 多模态融合 → 统一人格向量

输出：数字孪生体档案
  - 人格向量（512维隐向量）
  - 偏好权重（旅行节奏/预算/活动类型）
  - 沟通风格（直接型/委婉型/灵活型）
  - 协商策略（进攻型/保守型/平衡型）
```

**为什么用 MBTI 作为人格底座？**

MBTI 已经在大众市场得到了充分的教育成本，用户无需额外学习成本即可完成人格建模。相比 Big Five 等专业测评，MBTI 的 16 型分类足够粗糙但足够实用，配合兴趣标签的多层筛选，精度足以支撑搭子匹配场景。

#### 2. LangGraph 协商

两个数字孪生体之间的协商基于 LangGraph 实现的状态机模型。每个协商轮次都是一个状态转换：

```
┌─────────┐     用户发起协商      ┌──────────┐
│  IDLE   │ ──────────────────→  │ PROPOSING │
└─────────┘                       └──────────┘
                                       │
                                       ▼
                              ┌──────────────┐
                              │ NEGOTIATING  │◄──┐
                              └──────────────┘   │
                                    │ │ │       │
                           ┌───────┘ │ └───┐   │
                           ▼         ▼     ▼   │
                    ┌─────────┐ ┌────────┐ ┌────▼───┐
                    │ACCEPTED │ │MODIFIED│ │REJECTED│
                    └─────────┘ └────────┘ └────────┘
                         │          │          │
                         └──────────┴──────────┘
                                    │
                                    ▼
                             ┌──────────┐
                             │FINALIZED │
                             └──────────┘
```

**协商状态说明：**

- `IDLE`：搭子双方尚未进入协商流程
- `PROPOSING`：发起方提出初始方案（时间/地点/预算/活动）
- `NEGOTIATING`：双方交换提案，进行多轮谈判
- `ACCEPTED`：一方接受对方方案
- `MODIFIED`：双方修改出中间方案
- `REJECTED`：无法达成一致
- `FINALIZED`：协商结果确认，生成懂你卡片

**协商策略层面：**

- 优先级排序：时间 > 地点 > 活动 > 预算
- 底线识别：识别各方不可退让的条件
- 妥协路径：寻找双方偏好交集
- 终止条件：超过 N 轮或双方底线冲突则终止

#### 3. 懂你卡片三层结构

懂你卡片是 TwinBuddy 的核心输出，它呈现协商的最终结果，包含三个层次：

**第一层：共识结果（一眼看懂）**
- 协商状态（成功/部分成功/未达成）
- 行程概要（时间 + 地点 + 活动）
- 兼容度评分（0-100）

**第二层：细节对比（深度理解）**

| 维度 | 你的初始偏好 | 对方初始偏好 | 协商结果 |
|------|------------|------------|---------|
| 出发日期 | 周六 | 周日 | 周六 |
| 目的地 | 厦门 | 泉州 | 厦门 + 泉州各一天 |
| 预算 | 800 | 1200 | 1000 |
| 活动 | 逛吃 | 看海 | 逛吃为主，看海点缀 |

**第三层：人格解读（为什么这样协商）**
- 对方人格画像（基于 MBTI 的行为解读）
- 协商亮点（你们在哪里一拍即合）
- 潜在摩擦点（下次相处可以注意的地方）

---

## 数据说明

### Demo 阶段说明

当前版本为 Hackathon Demo，数据均为模拟数据，仅用于验证核心产品逻辑。

| 数据类型 | Demo 来源 | 说明 |
|----------|----------|------|
| MBTI | 用户手动选择 | 16型人格，对应真实 MBTI 模型 |
| 兴趣标签 | 用户手动选择 | 18个预设标签 |
| 搭子候选 | 20个预设 Mock 人格 | 覆盖各 MBTI 类型组合 |
| 兼容性评分 | MING 算法计算 | 真实算法逻辑，假数据输入 |
| 协商过程 | LangGraph 状态机 | 真实协商流程，预设偏好池 |
| 懂你卡片 | LLM 生成 + 模板 | 真实生成逻辑 |

### 未来抖音数据接入对比

| 维度 | Demo 阶段 | 抖音数据接入后 |
|------|----------|--------------|
| 人格建模 | MBTI 测试 + 语音描述 | 行为数据直接推断人格 |
| 搭子发现 | 预设 Mock 人格 | 真实抖音用户画像 |
| 偏好验证 | 用户自述 | 真实浏览/点赞/收藏数据 |
| 协商锚点 | 预设偏好池 | 真实出行记录/历史偏好 |
| 信任体系 | 无 | 抖音信用评级 |

---

## 项目结构

```
twinbuddy/
├── frontend/                 # React 前端应用
│   ├── src/
│   │   ├── pages/            # 页面组件
│   │   │   ├── Onboarding.tsx    # MBTI + 兴趣 + 语音引导页
│   │   │   ├── Feed.tsx         # 搭子浏览 Feed 流
│   │   │   └── Result.tsx        # 懂你卡片 + 协商结果
│   │   ├── components/          # 可复用组件
│   │   │   ├── MBTISelector.tsx  # MBTI 类型选择器
│   │   │   ├── InterestTags.tsx  # 兴趣标签选择
│   │   │   ├── BuddyCard.tsx     # 搭子卡片
│   │   │   ├── RadarChart.tsx    # 六维雷达图
│   │   │   ├── NegotiationView.tsx  # 协商过程展示
│   │   │   └── UnderstandCard.tsx   # 懂你卡片
│   │   ├── api/                  # API 客户端
│   │   │   └── client.ts         # Axios 封装
│   │   ├── store/                # 状态管理
│   │   │   └── onboarding.ts     # Zustand store
│   │   ├── types/                # TypeScript 类型定义
│   │   └── utils/                # 工具函数
│   ├── public/
│   └── package.json
│
├── backend/                  # FastAPI 后端
│   ├── main.py               # 应用入口
│   ├── api/
│   │   ├── __init__.py
│   │   └── routes/
│   │       ├── onboarding.py    # 引导流程 API
│   │       ├── matching.py       # 匹配 API
│   │       └── negotiation.py    # 协商 API
│   ├── agents/
│   │   ├── __init__.py
│   │   ├── ming.py              # MING 人格蒸馏
│   │   └── twin.py              # 数字孪生体模型
│   ├── negotiation/
│   │   ├── __init__.py
│   │   ├── state_machine.py     # LangGraph 状态机
│   │   ├── strategies.py         # 协商策略
│   │   └── card_generator.py    # 懂你卡片生成
│   ├── models/
│   │   ├── __init__.py
│   │   ├── persona.py           # 人格模型
│   │   └── negotiation.py        # 协商数据模型
│   └── requirements.txt
│
└── docs/                     # 产品文档
```

---

## 快速开始

### 环境要求

| 依赖 | 版本要求 | 说明 |
|------|---------|------|
| Node.js | 18+ | 前端运行时 |
| Python | 3.10+ | 后端运行时 |
| pip | 最新版 | Python 包管理 |

### 启动后端

```bash
cd twinbuddy/backend
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

### 启动前端

```bash
cd twinbuddy/frontend
npm install
npm run dev
```

### 访问地址

- 前端：http://localhost:5173
- 后端 API：http://localhost:8000/docs（Swagger 文档）

---

## API 接口说明

### 1. 创建数字孪生体

```
POST /api/onboarding
```

接收用户的 MBTI、兴趣标签和语音描述，返回数字孪生体档案。

**请求体：**

```json
{
  "user_id": "user_001",
  "mbti": "ENFP",
  "interests": ["美食", "摄影", "户外"],
  "voice_description": "我想要一个随性一点的搭子，不要太计划控"
}
```

**响应：**

```json
{
  "success": true,
  "data": {
    "persona_id": "persona_enfp_001",
    "personality_vector": [0.82, 0.45, ...],
    "preference_weights": {
      "travel_rhythm": 0.9,
      "budget": 0.6,
      "activity_type": 0.8
    },
    "communication_style": "flexible",
    "negotiation_strategy": "balanced"
  }
}
```

### 2. 获取搭子候选

```
POST /api/matching/buddies
```

基于数字孪生体档案，返回匹配的搭子候选列表。

**请求体：**

```json
{
  "persona_id": "persona_enfp_001",
  "limit": 10
}
```

**响应：**

```json
{
  "success": true,
  "data": {
    "buddies": [
      {
        "buddy_id": "buddy_infp_003",
        "mbti": "INFP",
        "name": "小鱼",
        "interests": ["美食", "摄影", "艺术"],
        "compatibility_score": 87,
        "radar": {
          "value_match": 90,
          "energy_level": 75,
          "social_style": 82,
          "planning_pref": 68,
          "budget_align": 85,
          "activity_overlap": 92
        }
      }
    ]
  }
}
```

### 3. 发起协商

```
POST /api/negotiation/start
```

对指定搭子发起协商流程，返回协商状态和懂你卡片。

**请求体：**

```json
{
  "user_persona_id": "persona_enfp_001",
  "buddy_id": "buddy_infp_003",
  "user_preferences": {
    "date": "这周六",
    "destination": "厦门",
    "budget": 800,
    "activities": ["逛吃", "拍照"]
  }
}
```

**响应：**

```json
{
  "success": true,
  "data": {
    "negotiation_id": "neg_20260418_001",
    "status": "finalized",
    "result": {
      "agreed_date": "这周六",
      "agreed_destination": "厦门（+鼓浪屿半天）",
      "agreed_budget": 900,
      "agreed_activities": ["逛吃", "拍照", "海边日落"]
    },
    "card": {
      "title": "你们一拍即合的厦门之旅",
      "summary": "ENFP 和 INFP 的组合在旅行节奏上天然互补……",
      "highlights": ["双方都对美食有极高热情", "摄影偏好一致"],
      "friction_points": ["INFP 需要独处时间，ENFP 注意给空间"]
    }
  }
}
```

### 4. 获取协商历史

```
GET /api/negotiation/history/{user_id}
```

返回用户所有协商历史记录。

---

## 获奖亮点

### Hackathon 奖项

> 2026 深圳大学城站 Hackathon 获奖作品

### 核心创新点

**1. 从"搜索"到"代理"的范式转移**

传统的搭子匹配产品解决的是信息流通问题，而 TwinBuddy 解决的是决策负担问题。通过数字孪生体代理用户的偏好和利益，用户从"自己聊、自己比"变成"看结果、点同意"。

**2. 人格驱动的协商智能**

MING 人格蒸馏算法不只做匹配，还驱动协商策略的选择。同样是"行程冲突"，ISTJ 型的人会坚守时间底线，ESFP 型的人更愿意妥协活动内容——这种人格驱动的协商差异化是传统标签匹配无法实现的。

**3. 协商结果的可解释性**

懂你卡片的三层结构让用户不只看到"你们去哪玩"，还能理解"为什么会这样协商"、对方是什么样的人、你们之间天然的互补和潜在摩擦点。这种可解释性是建立搭子信任的关键。

**4. 从匹配工具到关系预热**

TwinBuddy 的协商过程本身就是一种关系预热。在正式出发前，双方的数字孪生体已经完成了第一次"见面"和"谈判"，这让真实的线下见面不再是陌生人社交，而更像是老朋友重逢。

---

## 技术栈说明

| 层级 | 技术选型 | 理由 |
|------|---------|------|
| **前端框架** | React 18 + TypeScript | 组件化开发，类型安全，生态成熟 |
| **构建工具** | Vite | 极速 HMR，适合快速迭代 |
| **样式方案** | Tailwind CSS | 原子化 CSS，开发效率高，一致性好 |
| **状态管理** | Zustand | 轻量级，比 Redux 更适合中小型状态 |
| **图表** | Recharts | React 原生，支持雷达图，API 友好 |
| **后端框架** | FastAPI | 异步高性能，自动 OpenAPI 文档，类型提示完善 |
| **Agent 框架** | LangGraph | 基于 LangChain，状态机设计器清晰，适合多 Agent 协商 |
| **人格建模** | MING（自研）| 基于 MBTI + 兴趣 + LLM 偏好理解的多模态蒸馏 |
| **LLM 调用** | OpenAI GPT | Demo 阶段使用，可替换为本地模型 |
| **存储** | localStorage（前端）| Demo 阶段无状态，后端无持久化需求 |

---

*2026 深圳大学城站 Hackathon*
