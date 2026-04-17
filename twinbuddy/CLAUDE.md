# TwinBuddy 项目规范

> 版本：v1.0.0
> 日期：2026年4月17日
> 适用：抖音赛季黑客松（40小时，4人团队）
> 赛道：赛道三 · AI体验

---

## 一、项目背景

**产品定位：** 模拟抖音 Feed + 懂你卡片 + 双数字人协商

**一句话：** 不是找搭子的工具，而是刷到就懂你的瞬间。

**Slogan：** 你的另一个你，已经替你搞定了。

---

## 二、开发模式

### 2.1 必须使用 Agent Teams

**所有超过 200 行改动的任务，必须用 Agent Teams 开发：**

```
Agent Teams（孪生搭子项目）
│
├── Lead Agent（主控/项目经理）
│   └── 负责任务分解、协调、进度跟踪、最终交付
│
├── Frontend Agent（前端开发）
│   └── React + Tailwind + Rive + 组件开发
│
├── Backend Agent（后端开发）
│   └── FastAPI + LangGraph + Fusion 引擎
│
├── Content Agent（内容/Mock）
│   └── Mock 人格（20个）+ 视频（10个）+ 预生成对话
│
├── QA Agent（测试）
│   └── TDD + 单元测试 + 集成测试
│
├── E2E Agent（Playwright）
│   └── 浏览器自动化测试 + 关键流程覆盖
│
├── Code Review Agent（代码审查）
│   └── 代码质量 + 安全 + 最佳实践
│
├── Design Agent（UI/UX）
│   └── 视觉设计 + 组件规范 + 动效设计
│
└── DevOps Agent（部署）
    └── 打包 + 传服务器 + 验证
```

**注意：** 并非所有任务都需要全部角色。根据任务类型选择合适的 Agent 组合。

| 任务类型 | 所需 Agent |
|---------|-----------|
| 新功能（前后端） | Lead + Frontend + Backend + QA |
| UI/组件开发 | Design + Frontend + E2E |
| API 开发 | Backend + QA |
| 内容制作 | Content |
| 部署上线 | DevOps + QA |
| 代码审查 | Code Review |
| 完整 Phase | Lead + 全部角色 |

**启动方式：**
- 并行任务用 `Agent(..., run_in_background=True)`
- 团队协作用 `Team Orchestrator`
- 禁止单 agent 独占超过 2 小时

### 2.2 Task 划分原则

```
✅ 好：每个 Task < 300 行代码
✅ 好：Task 可独立测试
✅ 好：明确完成标准
❌ 差：一个 Task 包含前后端 + 测试
❌ 差：Task 超过 2 小时
```

**Task 必须包含：**
- subject（标题）
- description（详细描述）
- 完成标准（可验证）
- 依赖关系

---

## 三、TDD 开发流程

### 3.1 强制流程

```
┌─────────────────────────────────────────────────────────┐
│                    TDD 铁律                              │
├─────────────────────────────────────────────────────────┤
│  1. 写测试（RED）→ 测试必须先写，运行后失败              │
│  2. 写实现（GREEN）→ 只写通过测试的最小代码              │
│  3. 重构（IMPROVE）→ 改进代码质量                      │
│  4. 验证 → 测试全部通过，覆盖率 ≥ 80%                   │
└─────────────────────────────────────────────────────────┘
```

### 3.2 何时用 TDD

| 场景 | 必须 TDD | 说明 |
|------|---------|------|
| 雷达图组件 | ✅ | 核心可视化，必须有测试 |
| 卡片触发逻辑 | ✅ | 核心交互，必须有测试 |
| Fusion 融合 | ✅ | 核心算法，必须有测试 |
| LangGraph 协商 | ✅ | 核心逻辑，必须有测试 |
| UI 样式 | ❌ | 肉眼验收即可 |
| Mock 内容 | ❌ | 人工验收 |

### 3.3 TDD Skill

**必须使用 `tdd-guide` skill：**
```
在写任何核心功能测试前，先调用 tdd-guide skill
tdd-guide 会指导：
- 测试文件命名
- 测试结构
- 断言方式
- 覆盖率要求
```

---

## 四、Skill 使用规范

### 4.1 必须使用的 Skill

| Skill | 场景 | 作用 |
|-------|------|------|
| `tdd-guide` | 核心功能开发 | TDD 流程指导 |
| `playwright` | E2E 测试 | 浏览器自动化测试 |
| `ui-ux-pro-max` | UI/UX 开发 | 设计系统 + 组件规范 |
| `code-review` | 代码审查 | 完成后必须 review |

### 4.2 推荐使用的 Skill

| Skill | 场景 | 作用 |
|-------|------|------|
| `frontend-dev` | React 开发 | 前端专家指导 |
| `backend-dev` | FastAPI 开发 | 后端专家指导 |
| `architecture-patterns` | 架构设计 | Clean/Hexagonal/DDD |
| `api-design-principles` | API 设计 | REST/GraphQL 最佳实践 |
| `build-fix` | 修复错误 | TypeScript/构建错误修复 |
| `simplify` | 代码优化 | 简化重构 |

### 4.3 Skill 调用模板

```markdown
## [Task 名称]

**执行步骤：**

1. **设计阶段** → `ui-ux-pro-max` / `architecture-patterns`
2. **实现阶段** → `frontend-dev` / `backend-dev`
3. **测试阶段** → `tdd-guide` + `playwright`
4. **审查阶段** → `code-review`

**调用示例：**
```
Agent(frontend-dev, "实现雷达图组件...")
Agent(tdd-guide, "编写雷达图测试...")
Agent(playwright, "E2E 测试 Feed 流程...")
```
```

---

## 五、测试规范

### 5.1 测试覆盖率要求

| 类型 | 覆盖率 | 说明 |
|------|--------|------|
| 单元测试 | ≥ 80% | 函数、工具类 |
| 集成测试 | ≥ 60% | API 端点 |
| E2E 测试 | 关键流程 | Feed + 卡片 + 协商 |

### 5.2 Playwright E2E 测试清单

**必须覆盖的场景：**

```
✅ Feed 滑动
✅ 懂你卡片弹出
✅ 卡片第一层展示
✅ 展开第二层（协商详情）
✅ 展开第三层（同意流程）
✅ Onboarding 数据持久
✅ 雷达图渲染
✅ 协商对话展示
```

**Playwright 调用：**
```bash
# 启动
npx playwright test

# 交互式调试
npx playwright test --ui

# 单个测试
npx playwright test tests/twin-card.spec.ts
```

### 5.3 测试文件位置

```
frontend/src/__tests__/
├── components/
│   ├── RadarChart.test.tsx
│   ├── TwinCard.test.tsx
│   └── RiveAvatar.test.tsx
├── pages/
│   ├── OnboardingPage.test.tsx
│   └── FeedPage.test.tsx
└── e2e/
    └── feed-flow.spec.ts
```

---

## 六、代码质量规范

### 6.1 提交前检查清单

```
□ 代码可读，命名良好
□ 函数小（< 50 行）
□ 文件聚焦（< 800 行）
□ 无深层嵌套（> 4 层）
□ 适当错误处理
□ 无硬编码值
□ 无 console.log
□ 测试覆盖率 ≥ 80%（核心功能）
□ Playwright E2E 通过
```

### 6.2 Code Review 流程

```
1. 开发者完成实现 + 测试
2. 调用 code-review skill 进行审查
3. 修复 CR 指出的问题
4. 合并到主分支
```

### 6.3 代码规范

**不可变性（CRITICAL）：**
```typescript
// ❌ 错误：原地修改
function updateUser(user, name) {
  user.name = name
  return user
}

// ✅ 正确：返回新副本
function updateUser(user, name) {
  return { ...user, name }
}
```

**错误处理：**
```typescript
// ✅ 所有 API 调用必须有 try-catch
try {
  const result = await api.getData()
  return result
} catch (error) {
  console.error('Failed to get data:', error)
  throw new Error('获取数据失败')
}
```

---

## 七、项目结构

```
twinbuddy/
├── frontend/                    ← React + Vite + Tailwind
│   ├── src/
│   │   ├── pages/             ← 页面组件
│   │   ├── components/         ← 可复用组件
│   │   ├── hooks/              ← 自定义 Hooks
│   │   ├── mocks/              ← Mock 数据
│   │   ├── types/              ← TypeScript 类型
│   │   ├── api/                ← API 客户端
│   │   └── __tests__/          ← 测试文件
│   └── e2e/                    ← Playwright E2E
│
├── backend/                    ← FastAPI
│   ├── main.py                 ← 入口
│   ├── fusion_engine.py        ← 融合引擎
│   ├── card_engine.py          ← 卡片引擎
│   ├── langgraph/              ← 协商状态机
│   └── mocks/                  ← Mock 数据
│
├── MING/                       ← 人格蒸馏框架（复用）
│
└── docs/                       ← 文档
```

---

## 八、部署规范

### 8.1 部署流程

```
前端：npm run build → scp 到服务器 → nginx 托管
后端：scp 到服务器 → pip install → nohup uvicorn
```

### 8.2 部署检查清单

```
□ 前端 build 成功
□ API 健康检查通过
□ CORS 配置正确
□ localStorage 功能正常
□ 二维码可访问
□ E2E 测试通过
```

---

## 九、风险与应对

| 风险 | 应对 |
|------|------|
| LLM 调用超时 | 预生成 Mock 降级 |
| Feed 滑动卡顿 | CSS transform 优化 |
| Demo 翻车 | 预录备用视频 |
| 代码质量差 | TDD + code-review |

---

## 十、常用命令

```bash
# 前端
cd frontend
npm run dev          # 开发
npm run build        # 打包
npm test             # 单元测试
npx playwright test  # E2E 测试

# 后端
cd backend
python -m uvicorn main:app --reload  # 开发
python -m pytest                     # 测试

# Git
git add . && git commit -m "feat: xxx"  # 提交
```

---

## 附录：参考文档

| 文档 | 位置 | 说明 |
|------|------|------|
| PRD v3 | `../prdv3.md` | 产品需求 |
| 开发计划 | `./plan.md` | 详细开发计划 |
| MING Skill | `../MING/SKILL.md` | 人格蒸馏框架 |

---

*Last updated: 2026-04-17*
