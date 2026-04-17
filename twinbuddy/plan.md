# TwinBuddy v3 开发计划

> 版本：v3.0
> 日期：2026年4月17日
> 适用：抖音赛季黑客松（40小时，4人团队）
> 赛道：赛道三 · AI体验：刷到懂你的瞬间

**Slogan：** 你的另一个你，已经替你搞定了。

---

## 一、项目概览

### 1.1 一句话定位

不是主动找搭子的工具，而是刷抖音时自然出现的一张懂你卡片——两个数字孪生体已经替你协商完毕，结果直接端到你面前。

### 1.2 技术栈

| 层级 | 技术选型 | 说明 |
|------|---------|------|
| 前端 | React + Vite + Tailwind | Feed + 卡片组件 |
| 数字人形象 | Rive 2D | 卡通头像，带眨眼/点头动画 |
| 后端 | FastAPI | Python 生态，LLM 集成方便 |
| Agent框架 | LangGraph | 状态机 + 多Agent协作 |
| LLM | 通义千问 / Kimi（JSON Mode） | 中文能力强的模型 |
| 数据存储 | localStorage | 前端本地，刷新可见 |
| 部署 | 直接打包 | npm build + scp 到服务器 |

### 1.3 核心差异

复用 MING Skill 的四维蒸馏引擎（cognition / expression / behavior / emotion），固定权重融合，固定权重：MBTI 0.9 > 说话风格 0.8 > 兴趣标签 0.7。

---

## 二、现有资源盘点

### 2.1 已完成

```
twinbuddy/
├── MING/                          ✅ 完整人格蒸馏框架
│   ├── prompts/                   ✅ 9步灵魂锻造 Prompt
│   └── tools/                     ✅ 数据解析工具
├── backend/
│   ├── persona_distiller.py       ✅ 四维蒸馏函数
│   ├── isolation.py               ✅ 数据隔离层
│   └── main.py                    ✅ FastAPI 骨架
└── frontend/
    ├── components/
    │   ├── BuddyCard.tsx          ✅ 搭子卡片组件
    │   ├── NegotiationLog.tsx     ✅ 协商记录组件
    │   └── ...
    └── pages/
        ├── MatchPage.tsx          ✅ 匹配页面
        └── ...
```

### 2.2 需新建/完成

| 模块 | 文件 | 说明 |
|------|------|------|
| 前端 | `OnboardingPage.tsx` | 简化4字段版 |
| 前端 | `FeedPage.tsx` | 模拟抖音 Feed |
| 前端 | `TwinCard.tsx` | 懂你卡片三层 |
| 前端 | `RadarChart.tsx` | 雷达图可视化 |
| 前端 | `RiveAvatar.tsx` | Rive 2D 动画 |
| 前端 | `useLocalStorage.ts` | 持久化 Hook |
| 后端 | `fusion_engine.py` | 固定权重融合 |
| 后端 | `langgraph/negotiation_graph.py` | 协商状态机 |
| 后端 | `card_engine.py` | 卡片触发引擎 |
| 内容 | `mocks/personas.json` | 20个 Mock 人格 |
| 内容 | `mocks/videos.json` | 10个 Mock 视频 |
| 内容 | `mocks/negotiations.json` | 预生成对话 |

---

## 三、开发阶段

### Phase 1: 项目骨架（0-8h）

#### 前端（4h）

```
├─ ui-ux-pro-max
│   设计整体视觉风格
│   ├── 配色方案（抖音风格 + 搭子主题）
│   ├── 字体规范
│   └── 组件设计规范
│
├─ frontend-dev
│   ├── React + Vite 项目结构
│   ├── 路由配置（/ → /onboarding → /feed → /result）
│   └── useLocalStorage Hook
│
└─ OnboardingPage.tsx
    ├── MBTI 下拉选择（16型）
    ├── 兴趣标签多选（15个旅游标签）
    ├── 说话风格示例（文本框 + 麦克风按钮）
    └── 目标城市选择（可选）
```

#### 后端（4h）

```
├─ backend-dev + api-design-principles
│   ├── /onboarding     POST  保存开局数据
│   ├── /feed/{id}      GET   获取 Feed 内容
│   ├── /negotiate       POST  双数字人协商
│   └── /agree           POST  用户同意搭子
│
├─ Mock 人格（5个起步）
│   └── personas.json
│
└─ 前端 Feed 页面骨架
    └── 全屏滑动容器占位
```

#### 内容（同时进行）

```
├─ Mock 人格（5个）
│   ├── ENFP 随性型
│   ├── ISTJ 计划型
│   ├── INFP 文艺型
│   ├── ENTJ 主导型
│   └── ESFJ 社交型
│
└─ 预生成协商结果
    └── 每个组合的对话 + 报告
```

**Phase 1 产出：**
- [x] 简化 Onboarding 页面（4字段）
- [x] Feed 页面骨架（可滑动）
- [x] 后端 API 完整
- [x] 5个 Mock 人格 + 预生成对话

---

### Phase 2: 核心功能（8-20h）

#### 前端（10h）

```
├─ ui-ux-pro-max
│   懂你卡片三层视觉设计
│   ├── 第一层：地点 + 数字人对话 + 头像
│   ├── 第二层：完整协商 + 雷达图 + red_flags
│   └── 第三层：成功提示
│
├─ frontend-dev
│   ├── TwinCard.tsx
│   │   ├── 卡片弹窗组件
│   │   ├── 动画过渡
│   │   └── 展开/收起
│   │
│   ├── FeedPage.tsx
│   │   ├── 全屏滑动
│   │   ├── 视频播放
│   │   └── 卡片触发位置
│   │
│   └── RadarChart.tsx
│       ├── SVG 渲染
│       └── 数据可视化
│
└─ RiveAvatar.tsx
    ├── 眨眼动画
    ├── 点头动画
    └── 说话气泡
```

#### 后端（6h）

```
├─ backend-dev
│   fusion_engine.py
│   ├── MBTI 0.9 → 认知/行为/情感维度
│   ├── 说话风格 0.8 → 表达维度
│   └── 兴趣标签 0.7 → 偏好维度
│
├─ architecture-patterns
│   langgraph/negotiation_graph.py
│   ├── 状态机
│   │   └── IDLE → INIT → CHAT → CONFLICT → NEGOTIATE → CONSENSUS → DONE
│   ├── Agent 1: 提案 Agent
│   ├── Agent 2: 评估 Agent
│   └── Agent 3: 让步/拒绝 Agent
│
└─ card_engine.py
    ├── Feed 位置判断
    ├── 协商结果注入
    └── 降级到预生成 Mock
```

**Phase 2 产出：**
- [x] 懂你卡片三层完整
- [x] Rive 2D 动画
- [x] 雷达图可视化
- [x] LangGraph 协商逻辑
- [x] 卡片触发引擎

---

### Phase 3: 内容 + 联调（20-30h）

#### 内容制作（6h）

```
├─ Mock 人格扩展（20个）
│   ├── 覆盖所有 MBTI 类型
│   ├── 覆盖不同旅行风格
│   └── 完整 persona JSON
│
├─ Mock 视频（10个）
│   ├── 预下载到服务器
│   ├── 封面图
│   └── 具体地点（川西/成都/丽江/厦门/大理/青岛/重庆/西安/桂林/哈尔滨）
│
├─ mermaid-diagrams
│   └── 架构图（用于演示）
│
└─ 预生成对话扩展
    └── 20人格 × 常见目的地 × 协商结果
```

#### 集成测试（4h）

```
├─ tdd-guide
│   雷达图组件测试
│   卡片交互测试
│   localStorage 持久测试
│
├─ playwright
│   E2E 测试
│   ├── Feed 滑动
│   ├── 卡片弹出
│   ├── 展开协商详情
│   └── 同意流程
│
└─ frontend-dev
    API 联调
    localStorage 同步
```

**Phase 3 产出：**
- [x] 20个 Mock 人格
- [x] 10个 Mock 视频
- [x] 完整协商对话记录
- [x] E2E 测试通过

---

### Phase 4: 部署 + 彩排（30-40h）

#### 部署（4h）

```
├─ 前端打包
│   npm run build
│   └── 生成静态文件
│
├─ 传服务器
│   scp -r dist/ user@server:/var/www/twinbuddy/
│   └── 或 rsync
│
├─ 后端部署
│   scp backend/ user@server:/opt/twinbuddy/
│   pip install -r requirements.txt
│   nohup python -m uvicorn main:app --host 0.0.0.0 --port 8000 &
│
└─ 验证
    ├── 前端可访问
    ├── 后端 API 可调用
    └── CORS 配置正确
```

#### 彩排（6h）

```
├─ 5分钟 Demo 流程
│   ├── 0:00-0:30  对比冷开场
│   ├── 0:30-1:00  模拟刷 Feed
│   ├── 1:00-1:45  懂你卡片第一层
│   ├── 1:45-2:30  点击展开第二层
│   ├── 2:30-3:00  点击同意第三层
│   ├── 3:00-4:30  技术架构讲解
│   └── 4:30-5:00  扩展场景 + 收尾
│
├─ 团队分工
│   ├── 主持：节奏 + 讲解
│   ├── 操作：控制大屏
│   ├── 观察：监控后端
│   └── 备用：故障切换
│
└─ 预录备用视频
    └── 全流程录屏
```

**Phase 4 产出：**
- [x] 可扫码访问的 Web App
- [x] 完整 5 分钟 Demo
- [x] 备用视频

---

## 四、Skill 使用清单

### 4.1 Skill 组合

| 阶段 | Skill | 作用 |
|------|-------|------|
| **Phase 1** | `ui-ux-pro-max` | 设计整体视觉风格（配色/字体/组件规范） |
| **Phase 1** | `frontend-dev` | React 项目 + Onboarding 页面 |
| **Phase 1** | `backend-dev` | FastAPI 路由 + API 设计 |
| **Phase 1** | `api-design-principles` | REST API 最佳实践 |
| **Phase 2** | `ui-ux-pro-max` | 懂你卡片视觉设计 |
| **Phase 2** | `frontend-dev` | Feed 页面 + TwinCard 组件 |
| **Phase 2** | `backend-dev` | Fusion 引擎 + LangGraph |
| **Phase 2** | `architecture-patterns` | Agent 架构设计 |
| **Phase 3** | `tdd-guide` | 组件测试 |
| **Phase 3** | `playwright` | E2E 测试 |
| **Phase 3** | `mermaid-diagrams` | 架构图 |
| **随时** | `code-review` | 代码审查 |
| **随时** | `build-fix` | 修复构建错误 |
| **随时** | `simplify` | 代码简化 |

### 4.2 Skill 调用时机

```
Phase 1 前端：
  → ui-ux-pro-max（第1步：设计系统）
  → frontend-dev（第2步：实现页面）
  → code-review（完成后：代码审查）

Phase 1 后端：
  → api-design-principles（第1步：设计 API）
  → backend-dev（第2步：实现路由）

Phase 2 前端：
  → ui-ux-pro-max（第1步：卡片设计）
  → frontend-dev（第2步：实现组件）
  → build-fix（如有报错）

Phase 2 后端：
  → architecture-patterns（第1步：架构设计）
  → backend-dev（第2步：实现代码）

Phase 3 测试：
  → tdd-guide（第1步：编写测试）
  → playwright（第2步：E2E 测试）

Phase 3 内容：
  → mermaid-diagrams（架构图）
```

---

## 五、文件结构

```
twinbuddy/
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── HomePage.tsx          ← 首页入口
│   │   │   ├── OnboardingPage.tsx    ← 新建：简化4字段
│   │   │   ├── FeedPage.tsx          ← 新建：模拟抖音Feed
│   │   │   ├── TwinCard.tsx          ← 新建：懂你卡片
│   │   │   └── ResultPage.tsx        ← 已存在：调整
│   │   ├── components/
│   │   │   ├── BuddyCard.tsx         ← 已存在
│   │   │   ├── NegotiationLog.tsx    ← 已存在
│   │   │   ├── RadarChart.tsx        ← 新建：雷达图
│   │   │   └── RiveAvatar.tsx        ← 新建：Rive 2D
│   │   ├── hooks/
│   │   │   └── useLocalStorage.ts    ← 新建
│   │   ├── mocks/
│   │   │   ├── videos.json           ← 新建：10个视频
│   │   │   └── personas.json         ← 新建：20个人格
│   │   ├── types/
│   │   │   └── index.ts             ← 类型定义
│   │   ├── api/
│   │   │   └── client.ts            ← API 调用
│   │   └── App.tsx                  ← 路由配置
│   └── package.json
│
├── backend/
│   ├── main.py                       ← 已有：补充 API
│   ├── persona_distiller.py          ← 已有：四维蒸馏
│   ├── fusion_engine.py             ← 新建：固定权重融合
│   ├── isolation.py                  ← 已有
│   ├── card_engine.py               ← 新建：卡片触发
│   ├── langgraph/
│   │   ├── __init__.py
│   │   ├── negotiation_graph.py     ← 新建
│   │   └── agents/
│   │       ├── __init__.py
│   │       ├── proposer.py          ← 新建
│   │       ├── evaluator.py         ← 新建
│   │       └── negotiator.py        ← 新建
│   └── mocks/
│       ├── personas.json            ← 新建：20个人格
│       ├── negotiations.json        ← 新建：预生成对话
│       └── videos.json              ← 新建：10个视频
│
├── MING/                            ← 已存在：人格蒸馏框架
│   └── ...
│
└── docs/
    ├── mock-data-guide.md           ← 新建：内容制作指南
    └── deployment-guide.md          ← 新建：部署指南
```

---

## 六、风险与应对

| 风险 | 概率 | 影响 | 应对 |
|------|------|------|------|
| LLM 调用超时 | 高 | 中 | 预生成 Mock 降级，< 2s 切换 |
| Feed 滑动卡顿 | 中 | 高 | 提前测试，CSS transform 优化 |
| Rive 动画兼容 | 低 | 中 | 降级为静态图片 |
| 评委质疑"不是抖音" | 中 | 低 | 明确 Demo 定位，解释落地路径 |
| 数据不足幻觉 | 高 | 中 | 固定权重 + confidence 标记 |

---

## 七、验收标准

| 功能 | 验收条件 |
|------|----------|
| Onboarding | 25秒内完成，数据持久化到 localStorage |
| Feed | 全屏滑动，2个视频后触发卡片 |
| 懂你卡片 | 三层可展开，动画流畅 |
| Rive 头像 | 眨眼 + 点头 + 说话气泡 |
| 雷达图 | 正确渲染维度数据 |
| 协商 | 对话实时展示，3轮内达成共识 |
| 稳定性 | 连续 10 次 Demo 无故障 |
| 部署 | 扫码可访问，加载 < 3s |

---

## 八、团队分工

| 角色 | 主要任务 | 次要任务 |
|------|---------|---------|
| **前端主** | Onboarding + Feed + TwinCard | RadarChart + Rive |
| **前端辅** | UI 设计 + 动效 | E2E 测试 |
| **后端主** | LangGraph + Fusion + 部署 | API 联调 |
| **内容** | Mock 人格 + 视频 | 彩排 + 备用视频 |

---

## 九、部署流程

### 9.1 前端部署

```bash
# 1. 打包
cd twinbuddy/frontend
npm run build

# 2. 传到服务器
scp -r dist/* user@your-server:/var/www/twinbuddy/

# 3. 服务器配置 nginx
```

### 9.2 后端部署

```bash
# 1. 传到服务器
scp -r twinbuddy/backend/* user@your-server:/opt/twinbuddy/

# 2. 安装依赖
pip install -r requirements.txt

# 3. 启动
cd /opt/twinbuddy
nohup python -m uvicorn main:app --host 0.0.0.0 --port 8000 &

# 4. 验证
curl http://localhost:8000/health
```

### 9.3 生成二维码

```
https://your-domain.com → 二维码生成
```

---

## 十、演示流程（5分钟）

```
0:00-0:30  对比冷开场
"普通搭子匹配 = 填问卷、等人、靠运气。
 我们的做法不一样——你刷抖音，搭子已经给你找好了。"

0:30-1:00  模拟刷 Feed
[前两条是常规视频，营造正常体验]
[刷到第三条——懂你卡片弹出]
"等等，这是……？"

1:00-1:45  懂你卡片第一层
[地点 + 两个数字人对话截取]
[Rive 2D 头像动画]
"看，你的数字人已经和对方聊过了，行程都排好了。"

1:45-2:30  点击展开第二层
[雷达图：兼容度分数]
[协商对话记录]
[red_flags 预警]
"你们看，这两个数字人是这样协商的——"

2:30-3:00  点击同意第三层
[成功提示]
"点个头，搭子就找到了。整个过程你不需要做任何事。"

3:00-4:30  技术架构讲解
"MING人格蒸馏引擎 + LangGraph双Agent协商"

4:30-5:00  扩展场景 + 收尾
"不只旅行搭子——所有需要找个伴的场景"
```

---

## 十一、为什么能拿奖

| 评委关注点 | 我们的优势 |
|-----------|-----------|
| 赛道匹配度 | 直接对应赛道三——"刷到懂你的瞬间" |
| Agent技术深度 | MING人格蒸馏 + LangGraph双Agent协商 |
| 现场Demo冲击力 | 亲手刷feed，卡片当场弹出 |
| 差异化定位 | "不是找搭子的工具，是刷到就懂你的瞬间" |
| 情感共鸣 | "另一个我在帮我做事" |
| 商业想象空间 | 场景无限扩展 |

---

## 附录：相关文件

| 文件 | 说明 |
|------|------|
| `prdv3.md` | 产品需求文档 |
| `MING/SKILL.md` | MING 人格蒸馏框架 |
| `MING/FOR_AI.md` | MING AI 使用指南 |

---

*Last updated: 2026-04-17*
