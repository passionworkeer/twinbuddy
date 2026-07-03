# TwinBuddy 项目规范

> 版本：v2.0.0
> 日期：2026-04-29
> 赛道：赛道三 · AI体验（抖音赛季黑客松）

---

## 一、项目背景

**产品定位：** 模拟抖音 Feed + 懂你卡片 + 双数字人协商

**一句话：** 不是找搭子的工具，而是刷到就懂你的瞬间。

**Slogan：** 你的另一个你，已经替你搞定了。

**核心功能：**
1. MBTI Onboarding → MING 人格蒸馏 → 数字分身
2. Feed 流 + 懂你卡片（雷达图 + 协商对话）
3. 双数字人 LangGraph 协商，自动对齐旅行偏好
4. 6 轮 BlindGame 验证默契度
5. 社区 + 私信完整社交层

---

## 二、技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 18 + Vite + Tailwind CSS + TypeScript + React Router v7 |
| 后端 | FastAPI（Python 3.10+）+ LangGraph |
| LLM | MiniMax（MiniMax-M2） |
| 数据库 | PostgreSQL（Supabase）+ Alembic migrations + 内存 store（开发） |
| 部署 | Railway（后端）+ Vercel（前端） |

**本地开发端口：**
- 前端：`http://localhost:5173`（Vite dev server）
- 后端：`http://localhost:8000`（uvicorn）
- Vite 代理：`/api` → `http://localhost:8000`

---

## 三、开发者工作流

### 3.1 小改动（<50行）→ 主 agent 直接做
### 3.2 中等任务 → 并行 subagent
### 3.3 大型重构（>300行）→ 拆成多个 subagent 任务

**Subagent 类型路由：**

| 场景 | Agent |
|------|-------|
| 调研/探索 | `Explore` |
| 后端实现 | `backend-dev` |
| 前端实现 | `frontend-dev` |
| 安全/架构审核 | `senior-dev` |
| 小修小改/测试 | `junior-dev` |

**禁止使用 Agent Teams** —— 所有任务通过 subagent + 主 agent 直接完成。

---

## 四、TDD 开发流程

### 4.1 强制流程

```
RED  → 写测试（必须先写，运行后失败）
GREEN → 写最小实现（让测试通过）
IMPROVE → 重构代码质量
验证 → 测试全部通过，覆盖率 ≥ 80%
```

### 4.2 何时用 TDD

| 场景 | 必须 TDD |
|------|---------|
| 雷达图组件 | ✅ |
| 卡片触发逻辑 | ✅ |
| LangGraph 协商 | ✅ |
| API 端点 | ✅ |
| UI 样式 | ❌ 肉眼验收 |
| Mock 内容 | ❌ 人工验收 |

---

## 五、测试规范

### 5.1 测试文件位置

```
api/tests/                        ← 后端 pytest（14个文件，76个case）
twinbuddy/frontend/src/__tests__/ ← 前端 Vitest（17个文件，88个case）
twinbuddy/frontend/e2e/           ← Playwright E2E（2个文件，15个case）
```

### 5.2 E2E 测试清单

**必须在 `e2e/twinbuddy-e2e.spec.ts` 中覆盖：**
```
✅ Feed 滑动
✅ 懂你卡片弹出
✅ 卡片第一层展示
✅ 展开第二层（协商详情）
✅ 展开第三层（同意流程）
✅ Onboarding 数据持久化
✅ 雷达图渲染
✅ 协商对话展示
✅ 社区发布动态
✅ 底部导航切换
✅ BlindGame A/B 选择
```

**运行命令：**
```bash
npx playwright test e2e/twinbuddy-e2e.spec.ts
npx playwright test --ui  # 交互式调试
```

### 5.3 测试覆盖率要求

| 类型 | 要求 |
|------|------|
| 单元测试 | ≥ 80% |
| 集成测试（API） | ≥ 60% |
| E2E | 关键流程全覆盖 |

---

## 六、项目结构

```
hecker/                           ← 项目根目录
├── twinbuddy/frontend/           ← React 前端
│   ├── src/
│   │   ├── api/client.ts        ← 23个 API 函数
│   │   ├── pages/v2/            ← 7个页面（Home/Buddies/BlindGame/
│   │   │                          Community/Messages/Profile/Onboarding）
│   │   ├── components/          ← TwinCard/RadarChart/NegotiationThread/
│   │   │                          RedFlagsPanel/BuddyDetailModal 等
│   │   ├── hooks/               ← useLocalStorage / useTwinbuddyOnboarding
│   │   ├── mocks/               ← v2ApiMock / v2Showcase / personaMock
│   │   ├── types/               ← 全量 TypeScript 类型定义
│   │   └── __tests__/           ← Vitest 单元测试
│   ├── e2e/                    ← Playwright E2E
│   │   ├── twinbuddy-e2e.spec.ts
│   │   └── scroll-diagnostic.spec.ts
│   └── vite.config.ts          ← Vite 代理配置
│
├── api/                         ← FastAPI 后端
│   ├── frontend_api.py          ← 路由合并层
│   ├── _models.py               ← Pydantic 模型
│   ├── _constants.py            ← MBTI/城市/视频常量
│   ├── _store.py                ← 内存状态存储
│   ├── negotiate.py             ← 协商端点 + MING 人格生成
│   ├── mock_database.py         ← Mock profiles
│   ├── tests/                   ← pytest 测试（14个文件）
│   ├── test_negotiate_endpoint.py  ← 协商端到端测试（14个端到端case）
│   └── negotiation/             ← LangGraph 状态机
│       ├── state.py             ← NegotiationPhase 枚举
│       ├── nodes.py             ← proposer / evaluator / report nodes
│       ├── graph.py             ← 协商图定义
│       ├── llm_nodes.py         ← LLM 节点（MiniMax）
│       └── llm_client.py        ← MiniMax LLM 封装
│
├── mock_personas/               ← MBTI 人格 JSON 预制文件
│   ├── enfp/persona.json
│   ├── infp/persona.json
│   └── ...
│
├── data/                        ← JSON 持久化 store（开发用）
├── database/schema/            ← PostgreSQL Schema
├── docs/                        ← API 文档/测试报告
└── MING/                        ← MING 人格蒸馏框架
```

---

## 七、API 文档

- 前端对接：`docs/api-frontend.md`（API 函数清单 + TypeScript 类型）
- 后端路由：`docs/api-backend.md`（端点详情 + 响应格式）
- 部署说明：`docs/DEPLOY.md`

---

## 八、提交前检查清单

```
□ 代码可读，命名良好
□ 函数小（< 50 行），文件聚焦（< 800 行）
□ 无深层嵌套（> 4 层）
□ 无硬编码值
□ 测试覆盖率 ≥ 80%
□ pytest 通过（api/tests/）
□ Vitest 通过（frontend/src/__tests__/）
□ Playwright E2E 通过（frontend/e2e/）
□ 无 console.log
```

---

## 九、不可变性原则

```typescript
// ❌ 错误：原地修改
function updateUser(user, name) {
  user.name = name; return user;
}

// ✅ 正确：返回新副本
function updateUser(user, name) {
  return { ...user, name };
}
```

---

## 十、常用命令

```bash
# 前端开发
cd twinbuddy/frontend
npm run dev          # 启动开发服务器
npm run build        # 生产构建
npm test             # Vitest 单元测试
npx playwright test # E2E 测试

# 后端开发
python -m uvicorn api.index:app --reload --port 8000
python -m pytest api/tests/ -v

# 全量测试
python -m pytest api/tests/ -v && npm test
```

---

## 十一、Skill 速查

| Skill | 场景 |
|-------|------|
| `tdd-guide` | 核心功能 TDD |
| `playwright` | E2E 测试 |
| `frontend-ui-ux` | UI/UX 设计 |
| `code-review` | 代码审查 |
| `build-fix` | TS/构建错误修复 |
| `simplify` | 代码简化 |

---

*Last updated: 2026-04-29*
