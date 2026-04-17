
# TwinBuddy v2.1 实施计划

> 日期：2026年4月17日  
> 目标：40小时黑客松 MVP  
> 参考：prd-孪生搭子-v2.md

---

## 需求摘要

独立 Web App（扫码即用）。  
**流程**：用户开局填写 MBTI + Bio + 聊天记录 → 生成自己的数字孪生体 → 进入模拟抖音 Feed → 刷到懂你卡片（地点随机或来自用户输入）→ 点击展开 → 查看协商详情 → 同意进真人聊天。  
核心技术：MING 人格蒸馏 + LangGraph 双 Agent 协商 + 大量 Mock 人格池 + 预生成结果（减少幻觉）。

---

## 验收标准

| 功能 | 验收条件 |
|------|---------|
| 开局 Onboarding | 用户必须填写 MBTI/Bio/聊天记录后才能进入 Feed |
| 模拟抖音 Feed | 可上下滑动，至少 5 条内容，第 3-5 条触发懂你卡片 |
| 懂你卡片第一层 | 刷到即弹出，显示地点 + 2个数字人对话截取 + 头像简单动画 |
| 卡片第二层展开 | 点击后展示完整协商对话 + 4-6维度兼容度雷达图 + red_flags |
| 卡片第三层 | 点击"同意"后显示成功提示 |
| 数字孪生体生成 | 输入数据 → MING 蒸馏（带幻觉防护）→ persona JSON + 可爱头像 |
| 双 Agent 协商 | 两个数字人对话，LangGraph 状态机控制，可检测冲突 |
| Mock 人格池 | 4 个预设人格完整配置，全部预生成对话和报告 |
| Demo 稳定 | 预录视频备用，任何故障立即切换 |

---

## 实施步骤

### Phase 1：项目骨架（0-8h）

#### 步骤 1.1：前端项目初始化
- 初始化 React + Vite + Tailwind 项目
- 配置项目结构：`/components/feed` `/components/card` `/pages` `/components/onboarding`
- 安装依赖：recharts（雷达图）、framer-motion（动画）、rive-react（头像动画）
- 验证：项目可运行，`npm run dev` 无报错

#### 步骤 1.2：后端项目初始化
- 初始化 FastAPI 项目
- 配置 LLM 调用（通义千问/Kimi，JSON Mode）
- 配置 CORS、静态文件服务
- 验证：API 启动，`/docs` 可访问

#### 步骤 1.3：Mock Feed & 人格池
- 定义 Mock 视频数据结构（id、type、title、trigger_twin_card、suggested_place）
- 创建 5 条 Mock feed 内容（位置 1-2 常规视频，位置 3-5 懂你卡片触发）
- 创建 4 个 Mock 人格完整配置文件（ENFP/ISTJ/INFP/ENTJ），全部预生成对话和报告

#### 步骤 1.4：Onboarding 数据结构（新增）
- 定义输入 schema：MBTI、bio、chat_history、可选地点
- 定义输出 persona JSON schema（含 confidence 字段）
- 准备幻觉防护 Prompt（数据不足时标记 low confidence，不凭空编造）

---

### Phase 2：前端核心 UI（8-20h）

#### 步骤 2.1：Onboarding 页面（主要流程，新加强）
- 表单：MBTI 输入、多选旅行偏好、Bio 文本框、聊天记录粘贴框、可选地点
- 点击“生成我的数字孪生体” → 调用 `/generate_twin` → 显示进度 + 生成可爱头像（Rive 动画）
- 生成成功后自动跳转 Feed，并把 persona 保存到 session
- 验收：用户不填完无法进入 Feed

#### 步骤 2.2：模拟抖音 Feed 组件
- 全屏滑动界面（上下 swipe）
- 视频封面 + 标题展示
- Feed 数据驱动，Mock 数据内联
- 验收：上下滑动流畅，内容依次出现

#### 步骤 2.3：懂你卡片第一层组件
- 卡片弹出动画（从底部滑入）
- 显示：地点 + “你的孪生体已帮你谈好了”文案
- 两个数字人对话气泡（你的蓝色 / 对方橙色）+ Rive 头像（眨眼、点头、说话气泡动画）
- “查看协商详情”按钮
- 验收：刷到第 3 条视频时自动弹出，内容与 Mock 配置一致

#### 步骤 2.4：懂你卡片第二层展开
- 完整协商对话记录（可折叠列表）
- 4-6维度兼容度雷达图（recharts）
- red_flags 预警行
- “同意 → 进群找真人”按钮
- 验收：点击后内容正确展示，雷达图渲染无误

#### 步骤 2.5：懂你卡片第三层
- 成功提示界面（固定在卡片内）
- “返回继续刷” / “查看我的数字孪生体”按钮
- 验收：点击同意后状态正确切换

---

### Phase 3：后端核心逻辑（8-20h）

#### 步骤 3.1：MING 人格蒸馏接口（重点加强幻觉防护）
- `POST /generate_twin`：接收 MBTI/bio/chat_history/可选地点
- 调用 MING 融合 Prompt（严格规则：数据不足时使用 MBTI 默认值 + confidence: "low"，绝不凭空编造维度）
- Mock 人格池直接返回预配置 persona
- 验收：用真实输入调用，输出符合 JSON schema 且无明显幻觉

#### 步骤 3.2：LangGraph 协商状态机
- 状态：`IDLE → PERSONA_INIT → CHAT_ROUND → CONFLICT_DETECTED → NEGOTIATION → CONSENSUS_FOUND → REPORT_GENERATED`
- 每个 CHAT_ROUND：两个 Agent 各输出一个对话
- CONFLICT_DETECTED：检测旅行节奏/美食/预算/社交/边界等冲突
- CONSENSUS_FOUND：生成共识摘要
- 验收：给定两个 persona，输出至少 3 轮对话 + 兼容度报告 JSON

#### 步骤 3.3：卡片触发引擎
- `GET /feed/{video_id}`：返回视频数据 + 是否触发卡片
- 触发时返回预生成协商结果（地点来自用户输入或随机）
- 预生成结果直接读 Mock 配置，实时生成走 LangGraph
- 验收：video_id=3 返回 card_triggered=true + 完整 card_content

#### 步骤 3.4：兼容度报告生成
- 基于协商结果，生成 4-6 维度评分（旅行节奏、美食体验、预算风格、社交模式、硬边界、作息习惯）
- 输出 overall_compatibility + dimensions + red_flags + consensus_summary
- 验收：报告 JSON 符合 schema，所有分数有明确数据来源

---

### Phase 4：内容与文案（20-30h）

#### 步骤 4.1：Mock 视频内容制作
- 5 条视频封面图 + 标题文案（贴合旅行场景）
- 视频描述文本（营造“刷到了这条视频”的感觉）

#### 步骤 4.2：Mock 人格完整配置
- 4 个人格的完整 persona JSON
- 4 组预生成的协商对话（体现 4-6 维度冲突与协商）
- 4 个兼容度报告（对应不同协商结果）

#### 步骤 4.3：卡片文案优化
- 第一层文案突出“懂你感”
- 对话截取选最有戏剧性的 2-3 句
- red_flags 文案精简有力

---

### Phase 5：集成与彩排（30-40h）

#### 步骤 5.1：前后端联调
- Onboarding → 生成数字人 → Feed → 卡片完整链路
- 上传流程调用 `/generate_twin`
- 验收：完整链路跑通，无 404/500

#### 步骤 5.2：打包与二维码
- `npm run build` 打包前端
- 部署到指定服务器
- 生成访问二维码
- 验收：扫码即用

#### 步骤 5.3：预录视频备用
- 录制完整 5 分钟 Demo（包含 onboarding → 生成 → Feed → 卡片全流程）

#### 步骤 5.4：全流程彩排
- 团队 4 人按流程完整跑一遍
- 计时 5 分钟内讲完

---

## 风险与缓解（更新）

| 风险 | 缓解 |
|------|------|
| 输入数据不足导致幻觉 | MING Prompt 严格规则 + confidence 标记 + 大量 Mock 兜底 |
| LLM 调用超时 | 全部核心路径使用预生成结果 |
| Feed 滑动不流畅 | 自动播放 + 卡片自动弹出可选 |
| 评委现场输入 | Onboarding 作为必经流程，预设快速填充按钮 |
| 大屏显示异常 | 提前调试 Chrome 全屏 |

---

## 技术栈（无变化）

| 层级 | 选型 |
|------|------|
| 前端框架 | React + Vite |
| CSS | Tailwind CSS |
| 动画 | framer-motion + rive-react（头像） |
| 图表 | recharts |
| 后端框架 | FastAPI |
| Agent | LangGraph |
| LLM | 通义千问 / Kimi（JSON Mode） |
| 存储 | 内存/Session |

---

## 文件结构（微调）

```
E:\desktop\hecker\twinbuddy\
├── frontend/                  # React 前端
│   ├── src/
│   │   ├── components/
│   │   │   ├── onboarding/   # 新增开局表单
│   │   │   ├── feed/         # 模拟抖音Feed
│   │   │   ├── twin-card/    # 懂你卡片
│   │   │   └── radar-chart/  # 雷达图
│   │   ├── pages/
│   │   └── App.tsx
│   └── index.html
├── backend/                   # FastAPI 后端
│   ├── api/
│   │   ├── twin.py           # /generate_twin（带幻觉防护）
│   │   ├── negotiate.py      # /negotiate
│   │   └── feed.py           # /feed/{video_id}
│   ├── ming/                  # MING 人格蒸馏
│   ├── negotiation/           # LangGraph 状态机
│   ├── mock_personas/         # Mock 人格池 JSON（预生成）
│   └── main.py
└── README.md
```

