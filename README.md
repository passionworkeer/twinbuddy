# 孪生搭子 TwinBuddy

> **你的另一个你，已经替你搞定了。**

---

## 一句话

你在刷抖音，另一边的「你」已经在后台帮你把搭子聊好了。

---

## 这不是一个找搭子的工具

普通搭子工具：你填问卷、等消息、自己跟人聊。

**TwinBuddy 不是这样。**

你什么都不用做。你的数字孪生体——另一个你——在后台持续运行。它知道你是什么样的人：你是早起赶行程还是睡到自然醒，你是看见美食走不动道还是随便吃点就行，你是喜欢热闹还是需要独处空间。

然后它帮你去找，去谈，去吵出一套行程来。

等到你刷到那张懂你卡片的时候，两个数字人已经替你把所有事情搞定了。你只需要点一个「同意」。

---

## 为什么这件事有意义

### 每个现代人都在为「找人」付出巨大的隐性成本

发消息等回复、反复确认行程、行程不合吵起来——我们不是在发明一个新功能，是在解决一个真实摩擦。

### AI Agent 的真正价值，不是帮你回答问题

你的数字孪生体是一个分身——帮你分析，帮你决策，帮你替你说话。

---

## 数字孪生体是什么

我们用 **MING 人格蒸馏框架** 把一个人的数据，转化为一个「懂你」的数字人：

| 维度 | 问的问题是 |
|------|-----------|
| Cognition（认知） | 你怎么想事情？ |
| Expression（表达） | 你怎么说话？ |
| Behavior（行为） | 你怎么做事情？ |
| Emotion（情感） | 你怎么反应？ |

### 两个数字人怎么「谈」

**LangGraph 状态机** 控制协商流程：

```
提案 → 评估 → 让步/拒绝 → 共识/继续协商 → 输出结论
```

最多三轮，每一轮都是 MiniMax LLM 生成的真实对话，不是模板文本。

---

## 未来愿景：每个人都有一个数字分身

五年到十年后，每个人都会有一个自己的数字孪生体——在后台帮你处理一切「需要找人」的事：

- **帮你找人**：学习、健身、饭搭子、演唱会搭子……
- **帮你谈**：用你的方式说话，知道你的底线
- **帮你决策**：告诉你分歧在哪、折中方案是什么

因为抖音有最多的真实人格数据，这件事只有抖音能做。

---

## 评分体系：MING 六维度

| 维度 | 最高分 | 看什么 |
|------|--------|--------|
| 行程节奏 | 25 | 暴走派 vs. 慢悠派 |
| 社交能量 | 20 | 社交型 vs. 独处型 |
| 决策风格 | 20 | 理性派 vs. 感性派 |
| 兴趣对齐 | 25 | 共同喜好 / 厌恶 / 冲突 |
| 预算兼容 | 15 | 消费观念是否一致 |
| 人格互补 | -5~+10 | MBTI 四象限 + 互补对 |

总分 0-100，超过 80 算高度契合。

---

## 技术栈

| 层级 | 技术选型 |
|------|---------|
| 前端 | React 18 + Vite + Tailwind CSS + TypeScript + React Router |
| 后端 | FastAPI + Python |
| Agent | LangGraph 状态机 |
| LLM | MiniMax（MiniMax-M2）|
| 搭子数据 | 100 个完整 persona JSON |
| 评分引擎 | MING 六维度（`agents/scoring.py`）|

---

## 项目结构

```
twinbuddy/
├── frontend/                    # React + Vite + Tailwind
│   ├── src/
│   │   ├── pages/             # FeedPage / OnboardingPage / ResultPage / MatchReportDetailPage
│   │   ├── components/         # 可复用组件
│   │   ├── hooks/              # 自定义 Hooks
│   │   ├── mocks/              # Mock 数据
│   │   ├── types/              # TypeScript 类型
│   │   ├── api/                # API 客户端
│   │   └── __tests__/          # 单元测试
│   └── e2e/                    # Playwright E2E 测试
│
├── backend/                    # FastAPI
│   ├── main.py                 ← 入口
│   ├── fusion_engine.py        # 融合引擎
│   ├── card_engine.py          # 卡片引擎
│   ├── persona_engine.py       # Persona 引擎
│   ├── persona_distiller.py    # MING 人格蒸馏
│   ├── isolation.py            # 隔离决策
│   ├── agents/                 # Agent 逻辑（scoring / matching / persona_doc）
│   ├── negotiation/            # LangGraph 协商状态机
│   └── data/                   # Mock 数据
│
├── agents/                     # 根目录 Agent 逻辑（与 backend/agents 同步）
├── negotiation/                # 根目录协商模块
├── MING/                       # 人格蒸馏框架
└── docs/                       # 文档
```

---

## 快速开始

```bash
# 后端
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
# → http://localhost:8000/docs

# 前端
cd twinbuddy/frontend
pnpm install && pnpm dev
# → http://localhost:5173
```

---

## 核心模块说明

### card_engine.py
卡片生成引擎。根据两个用户的 MING 人格数据，生成"懂你卡片"的展示内容（兼容度、行程摘要、red_flags 等）。

### fusion_engine.py
融合引擎。将用户输入（问卷/行为数据）蒸馏为 MING 四维度 persona JSON。

### persona_engine.py
Persona 生命周期管理。创建、更新、查询用户数字孪生体。

### agents/scoring.py
MING 六维度评分引擎。对两个 persona 进行六维度打分，输出 0-100 兼容度。

### agents/matching_graph.py
LangGraph 匹配图。定义双 Agent 发现→评估→协商的状态转换逻辑。

### negotiation/
双 Agent 协商模块：
- `graph.py` — LangGraph 协商流程定义
- `llm_nodes.py` — LLM 驱动的协商节点（提案/评估/让步）
- `llm_client.py` — MiniMax LLM 客户端封装
- `state.py` — 协商状态数据结构

---

## 演示流程（5分钟）

```
00:00 - 00:30  开场
"你有没有这种感觉——找人一起旅游，比旅游本身还累。"
"我们做的是：让你不用找了，你的数字分身已经帮你搞定了。"

00:30 - 01:00  刷 Feed
[刷到第三条——懂你卡片弹出]

01:00 - 01:45  懂你卡片第一层
[地点 + 兼容度 + 两个数字人的对话截取]

01:45 - 02:30  展开第二层
[六维度雷达图] [协商对话记录] [red_flags]

02:30 - 03:00  同意流程
"点同意就行。"

03:00 - 04:30  技术讲解
"MING人格蒸馏 + LangGraph双Agent协商"

04:30 - 05:00  未来 + 收尾
"这不只是旅游搭子。"
```

---

*最后更新：2026-04-19*
