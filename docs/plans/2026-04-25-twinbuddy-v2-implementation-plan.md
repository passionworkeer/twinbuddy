# TwinBuddy V2 实施计划

> 日期：2026-04-25
> 基于：docs/plans/2026-04-25-twinbuddy-v2-redesign.md
> 负责人：单人开发（你）
> 总工期：16 周（MVP）+ 4 周（V2 社区）

---

## 一、整体架构与部署拓扑

```
┌──────────────────────────────────────────────────────────┐
│                        前端                              │
│         React + Vite + Tailwind (H5 优先)               │
│              部署：Vercel (vercel.com)                   │
│         环境：Preview PR / Production                     │
└───────────────────────┬──────────────────────────────────┘
                        │ HTTPS (REST API + SSE)
┌───────────────────────▼──────────────────────────────────┐
│                       后端                               │
│         FastAPI + LangGraph + PostgreSQL                 │
│              部署：Railway (railway.app)                 │
│         环境：Review / Production                        │
└────┬────────────────┬──────────────────────┬───────────┘
     │                │                      │
┌────▼────┐   ┌───────▼─────┐   ┌──────────▼──────────┐
│PostgreSQL│   │    Qdrant   │   │    Claude API      │
│Railway   │   │ Railway容器 │   │  Anthropropic      │
│内置Postgres│  │  (向量检索)  │   │  (LLM推理)        │
└──────────┘   └─────────────┘   └───────────────────┘
```

### 环境隔离策略

| 环境 | 前端地址 | 后端地址 | 用途 |
|------|---------|---------|------|
| `review` | `https://<branch>.vercel.app` | `https://<branch>.up.railway.app` | PR 预览 |
| `production` | `https://twinbuddy.vercel.app` | `https://api.twinbuddy.railway.app` | 正式上线 |

---

## 二、API 契约（前端 × 后端）

### 认证

```
POST /api/auth/register     { nickname, phone, mbti }
POST /api/auth/login        { phone } → { token, user_id }
```

### Onboarding & 用户画像

```
GET  /api/profiles/{user_id}          → ProfileResponse
POST /api/profiles/                   { mbti, travel_range, budget, self_desc, city }
PATCH /api/profiles/{user_id}/style  { style_vector }
```

### AI 助手对话（Tab1）

```
POST /api/chat/send
  Body: { user_id, message, conversation_id? }
  Response (SSE): { type: 'message'|'preference_hint', content: string }
  → 后端同时触发 style_vector 更新（异步，不阻塞响应）

GET /api/chat/history/{conversation_id}
```

### 搭子动态（Tab2）

```
GET /api/buddies/inbox?user_id={uid}&page=1
  → { items: [{ buddy_id, avatar, mbti, city, match_score, negotiation_id, status }] }

GET /api/buddies/{buddy_id}/card?negotiation_id={nid}
  → { profile, negotiation_summary, radar_chart, actions }
```

### 盲选游戏

```
POST /api/games/blind/start
  Body: { user_id, negotiation_id }
  → { game_id, rounds: [ { id, dimension, option_a, option_b } ] }

POST /api/games/blind/answer
  Body: { game_id, round_id, choice: 'A'|'B' }
  → { done: bool, rounds_completed }

GET /api/games/blind/{game_id}/report
  → { user_choices, buddy_choices, per_round_result, match_score, analysis }
```

### 私信（Tab5）

```
GET /api/conversations?user_id={uid}
  → { items: [{ room_id, peer_user, last_message, unread_count }] }

GET /api/messages/{room_id}?page=1
  → { items: [{ id, sender_id, content, type, created_at }] }

POST /api/messages
  Body: { room_id, sender_id, content, type: 'text'|'trip_card' }
```

### 搭子确认

```
POST /api/buddies/{buddy_id}/accept
  Body: { user_id } → { room_id, peer_profile }

POST /api/buddies/{buddy_id}/skip
POST /api/buddies/{buddy_id}/decide
  Body: { user_id, decision: 'accept'|'decline' }
```

---

## 三、数据库迁移策略

### 工具：Alembic（Python）

**迁移文件命名规范：** `YYYYMMDD_<short_description>.py`

### 迁移文件清单

| 文件 | 操作 | 内容 | 依赖 |
|------|------|------|------|
| `001_add_posts_table.py` | up | posts/comments/likes 基础表 | 无 |
| `002_add_blind_games_table.py` | up | blind_games 表 | 001 |
| `003_add_follows_table.py` | up | follows 表 | 无 |
| `004_add_messages_tables.py` | up | conversations + messages 表 | 无 |
| `005_add_style_vector.py` | up | user_profiles 新增 style_vector JSONB | 无 |

### 迁移流程

```bash
# 本地开发
alembic upgrade head

# CI（每次后端部署前自动运行）
alembic upgrade head

# 生产回滚（如需）
alembic downgrade -1
```

> Railway 部署时，在 `railway.toml` 的 `startCommand` 中加入 `alembic upgrade head`。

---

## 四、环境变量管理

### 前端（Vercel）

| 变量名 | 来源 | 说明 |
|--------|------|------|
| `VITE_API_BASE_URL` | Railway production URL | e.g. `https://api.twinbuddy.railway.app` |
| `VITE_WS_URL` | Railway WebSocket | 同 host，升级为 ws:// |
| `VITE_APP_ENV` | CI 自动注入 | `production` \| `preview` |

> Vercel 每个 PR preview 自动注入 `VITE_APP_ENV=preview`。

### 后端（Railway）

| 变量名 | 来源 | 说明 |
|--------|------|------|
| `DATABASE_URL` | Railway Postgres 内置 | PostgreSQL 连接串 |
| `REDIS_URL` | Railway Redis 插件 | 会话存储（盲选游戏状态） |
| `ANTHROPIC_API_KEY` | Railway Variables | Claude API Key |
| `QDRANT_URL` | Railway Variables | Qdrant 服务地址 |
| `QDRANT_API_KEY` | Railway Variables | Qdrant 认证 |
| `ALLOWED_ORIGINS` | Railway Variables | 逗号分隔的前端域名列表 |
| `JWT_SECRET` | Railway Variables | Token 签名密钥 |
| `LOG_LEVEL` | Railway Variables | `INFO` \| `DEBUG` |

### 本地开发 `.env` 文件

```bash
# api/.env（不上 git）
DATABASE_URL=postgresql://user:pass@localhost:5432/twinbuddy
REDIS_URL=redis://localhost:6379
ANTHROPIC_API_KEY=sk-...
QDRANT_URL=http://localhost:6333
JWT_SECRET=dev-secret-change-in-prod
ALLOWED_ORIGINS=http://localhost:5173,https://*.vercel.app

# twinbuddy/frontend/.env.local（不上 git）
VITE_API_BASE_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
```

---

## 五、TDD / SDD 开发规范

### 整体策略

每个模块的开发顺序：
**测试文件先写（RED）→ 业务代码通过（GREEN）→ 重构（IMPROVE）→ 集成测试**

### 后端 TDD

**测试框架：** `pytest` + `pytest-asyncio`

```
api/
├── tests/
│   ├── unit/
│   │   ├── test_style_vector.py
│   │   ├── test_matching.py
│   │   ├── test_blind_game_scoring.py
│   │   └── test_preference_extractor.py
│   ├── integration/
│   │   ├── test_auth_flow.py
│   │   ├── test_chat_flow.py
│   │   ├── test_negotiation_flow.py
│   │   └── test_blind_game_flow.py
│   └── conftest.py
```

**SDD（Schema-Driven Development）：**
每个 API endpoint 的请求/响应 schema 先写 Pydantic model → 再写 test → 最后写 handler。

### 前端 SDD

**测试框架：** `vitest` + `@testing-library/react` + `playwright`（E2E）

```
twinbuddy/frontend/
├── src/__tests__/
│   ├── unit/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── utils/
│   ├── integration/
│   │   └── onboarding.test.tsx
│   └── e2e/
│       ├── onboarding.spec.ts
│       ├── chat.spec.ts
│       ├── blind-game.spec.ts
│       └── messaging.spec.ts
```

**SDD 流程：**
先定义组件 props/types → 写 Playwright E2E 骨架 → 实现组件 → 所有 E2E 绿。

### 测试覆盖率要求

| 层 | 最低覆盖率 |
|----|-----------|
| 后端单元测试 | 80% |
| 后端集成测试 | 覆盖所有 API 端点 |
| 前端单元测试 | 组件级逻辑（hooks/utils）|
| 前端 E2E | 核心用户路径全覆盖 |

---

## 六、CI/CD 流水线

### GitHub Actions（统一入口）

```yaml
# .github/workflows/ci.yml
on: [push, pull_request]

jobs:
  backend-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
      - run: pip install -r api/requirements.txt
      - run: pytest api/tests/ -v --cov=api --cov-report=xml
      - run: alembic upgrade head  # 跑迁移
      env:
        DATABASE_URL: postgresql://test:test@localhost:5432/test_db
        ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}

  frontend-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci && npm run test:unit && npm run test:e2e
      env:
        VITE_API_BASE_URL: http://localhost:8000

  deploy-backend:
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: cmiles/railway@v1
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}
          service: twinbuddy-api
      - run: alembic upgrade head

  deploy-frontend:
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v25
        with:
          vercel_token: ${{ secrets.VERCEL_TOKEN }}
          vercel_org_id: ${{ secrets.VERCEL_ORG_ID }}
          vercel_project_id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel_args: '--prod'
```

### Vercel 自动预览

- 每个 PR 自动创建 `https://<branch>.twinbuddy.vercel.app`
- 自动注入 `VITE_API_BASE_URL` 指向对应后端 preview 环境
- PR 合并后 preview 自动删除

### Railway 自动部署

- `main` 分支推送 → 自动构建 + 部署
- `startCommand`: `alembic upgrade head && uvicorn api.main:app --host 0.0.0.0 --port $PORT`
- 环境变量在 Railway Dashboard 配置（不上代码库）

---

## 七、甘特图（16 周）

```
Week:   1   2   3   4   5   6   7   8   9   10  11  12  13  14  15  16
        ─────────────────────────────────────────────────────────────────>

基础设施
├─ Git分支策略           ██
├─ Docker本地环境         ██
├─ 数据库迁移(Alembic)    ████
├─ CI/CD 流水线           ████
└─ 环境变量规范           ██

后端 - 用户与画像
├─ 认证 API (注册/登录)    ██████
├─ 用户画像 CRUD           ████
├─ 偏好提取引擎 (TDD)     ████████
└─ StyleVector 注入        ████

后端 - AI 助手 (Tab1)
├─ SSE 对话接口           ██████████
├─ 对话历史存储            ████
└─ 主动探查逻辑            ████████

后端 - 搭子匹配 (Tab2)
├─ 向量检索集成 (Qdrant)   ████████
├─ 硬约束过滤              ████
├─ 搭子卡片 API            ████
└─ 协商引擎完善            ████████████

后端 - 盲选游戏
├─ 游戏状态管理 (Redis)   ██████
├─ 评分引擎               ██████████
└─ 报告生成 API            ██████

后端 - 私信 (Tab5)
├─ 会话管理 API            ██████
└─ 消息收发 (SSE 推送)     ████████

前端 - 基础
├─ 5-Tab 导航骨架          ████
├─ 主题系统                ████
└─ 全局状态管理             ████████

前端 - Onboarding
├─ 问卷组件                ██████
└─ AI 开场访谈              ████████

前端 - Tab1 AI助手
├─ 聊天界面                ████████████
├─ SSE 流式渲染            ████████████
└─ 消息气泡                ████

前端 - Tab2 搭子动态
├─ 搭子卡片列表             ██████████
└─ 卡片详情页               ████████

前端 - Tab4 我的
└─ 个人主页                 ████████

前端 - Tab5 私信
├─ 会话列表                 ████████
└─ 聊天界面                 ████████████

前端 - 盲选游戏
├─ 游戏入口                 ████
├─ 6轮答题流程              ████████████
└─ 匹配报告揭晓              ████████

集成
├─ API 联调                 ████████████
├─ E2E 测试                 ████████████
└─ Mock 数据迁移             ████████

部署上线
├─ Vercel 正式部署          ████
├─ Railway 正式部署         ████
├─ 域名 + HTTPS              ██
└─ Smoke Test                ████

V2 社区 (后续)
├─ Tab3 发帖/评论           ████████████████
├─ 点赞/关注                 ████████████
└─ 数字分身代聊              ████████████████
```

---

## 八、任务分解与依赖

### Phase 0：基础设施（第 1-2 周）

#### TASK-001：Git 分支策略与项目初始化
- **文件：** `twinbuddy/frontend/` + `api/`
- **操作：**
  - 建立分支模型：`main` / `feat/*` / `fix/*` / `chore/*`
  - 为 `api/` 和 `twinbuddy/frontend` 各自初始化 git（如未 init）
  - 清理 Hackathon 遗留代码（`feed`, `video` 相关）
- **依赖：** 无
- **验收：** `git branch -a` 显示正确分支；无多余遗留代码
- **测试：** CI 流水线绿色

#### TASK-002：本地 Docker 开发环境
- **文件：** `docker-compose.yml`
- **操作：** 编写 `docker-compose.yml` 包含 PostgreSQL + Redis + Qdrant
- **依赖：** TASK-001
- **验收：** `docker-compose up` 后 `psql $DATABASE_URL` 连接成功；`curl localhost:6333/collections` 返回 Qdrant 健康状态
- **测试：** 新工程师克隆后一条命令起服务

#### TASK-003：数据库迁移基础设施
- **文件：** `api/alembic.ini` + `api/migrations/`
- **操作：** Alembic init，编写所有 migration 文件（001-005）
- **依赖：** TASK-002
- **验收：** `alembic upgrade head` 成功；`alembic history` 显示所有迁移；`alembic downgrade -1` 可回滚
- **测试：** CI 中 `pytest api/tests/integration/test_migrations.py`

#### TASK-004：CI/CD 流水线
- **文件：** `.github/workflows/ci.yml` + Vercel/Railway 配置
- **操作：**
  - 配置 GitHub Actions（lint + test + build）
  - 配置 Vercel project（连接 GitHub repo）
  - 配置 Railway project（连接 GitHub repo）
  - 在 Railway 设置环境变量
- **依赖：** TASK-001, TASK-003
- **验收：** `main` 分支合并后，Vercel 和 Railway 自动部署完成；PR 自动创建 preview
- **测试：** 合并一个 chore PR 验证自动部署

---

### Phase 1：后端 - 用户画像与 AI 助手（第 2-5 周）

#### TASK-005：认证 API
- **文件：** `api/auth.py` + `api/_models.py`
- **TDD：**
  - 先写：`test_auth_flow.py::test_register_success`
  - 再写：`test_auth_flow.py::test_login_with_jwt`
- **API：** `POST /api/auth/register`, `POST /api/auth/login`
- **依赖：** TASK-003
- **验收：** 注册后能 login；JWT token 可访问受保护端点；重复注册返回 409
- **测试：** `pytest api/tests/integration/test_auth_flow.py -v`

#### TASK-006：用户画像 CRUD
- **文件：** `api/profiles.py`
- **API：** `GET/POST /api/profiles/{user_id}`, `PATCH .../style`
- **依赖：** TASK-005
- **验收：** 画像创建后可读取；style_vector 更新后持久化
- **测试：** `pytest api/tests/unit/test_profiles.py -v`

#### TASK-007：偏好提取引擎（StyleVector）
- **文件：** `api/style_vector.py`
- **TDD：** 先写 10 个测试用例覆盖各种句式
  ```python
  # test_style_vector.py
  def test_extracts_emoji_rate():
      text = "太棒了！👍 哇，真的很开心🎉"
      sv = extract_style_vector([text])
      assert sv['emoji_rate'] > 0
  ```
- **逻辑：**
  - 句式长度分布（jieba 分词 + 统计）
  - 表情符号频率（正则）
  - 疑问句占比（正则：`吗|呢|?`）
  - 感叹词频率（`哇|啊|呀|!`）
  - 决策词倾向（`必须|一定|随便|都可以`）
  - 偏好关键词抽取（目的地/美食/活动标签）
- **依赖：** TASK-006
- **验收：** `pytest api/tests/unit/test_style_vector.py --cov=api/style_vector` 覆盖率 ≥ 80%
- **测试：** `pytest api/tests/unit/test_style_vector.py -v --cov`

#### TASK-008：AI 助手对话服务（SSE 流式）
- **文件：** `api/chat.py`
- **API：** `POST /api/chat/send`（SSE 响应）
- **TDD：** 先写 `test_chat_flow.py`
  - Mock Claude API 响应
  - 验证 SSE 格式正确（`data: {...}\n\n`）
  - 验证历史消息正确传入
- **关键逻辑：**
  - 前 5 条消息内，AI 主动发起探查问题
  - 探查问题由规则引擎触发（不走 LLM）
  - 所有消息异步写入对话历史
  - 每条消息后触发 `extract_style_vector` 更新 `style_vector`
- **依赖：** TASK-007
- **验收：** SSE 流式输出；探查问题自然插入；`GET /api/chat/history` 正常返回
- **测试：** `pytest api/tests/integration/test_chat_flow.py -v`

---

### Phase 2：后端 - 搭子匹配与协商（第 4-7 周）

#### TASK-009：Qdrant 向量检索集成
- **文件：** `api/matching.py`
- **逻辑：**
  - 用户注册时生成 embedding → 写入 Qdrant
  - 画像更新时同步更新 Qdrant
  - 检索时：硬约束过滤（SQL）→ 向量相似度（Qdrant）→ 六维评分
- **依赖：** TASK-006
- **验收：** 给定用户可返回 top-10 候选搭子；饮食禁忌 100% 被过滤
- **测试：** `pytest api/tests/unit/test_matching.py -v`

#### TASK-010：搭子卡片 API
- **文件：** `api/buddies.py`
- **API：** `GET /api/buddies/inbox`, `GET /api/buddies/{id}/card`
- **依赖：** TASK-009
- **验收：** inbox 返回当前用户的所有协商结果；card 详情包含协商报告摘要
- **测试：** `pytest api/tests/integration/test_buddies_flow.py -v`

#### TASK-011：数字人协商引擎（完善）
- **文件：** `api/negotiate.py`, `agents/`
- **完善项：**
  - 状态持久化（langgraph-checkpoint-postgres）—支持中断恢复
  - 让步记录写入 `negotiation_events` 表
  - 报告输出结构化（Pydantic model）
  - 拒绝原因收集
- **依赖：** TASK-010（card API 调用了协商结果）
- **验收：** 完整协商（成功/失败）可重复运行；报告包含所有必需字段
- **测试：** `pytest api/tests/integration/test_negotiation_flow.py -v`

---

### Phase 3：后端 - 盲选游戏 + 私信（第 6-9 周）

#### TASK-012：盲选游戏状态管理
- **文件：** `api/blind_game.py`
- **状态存储：** Redis（TTL = 30 分钟）
- **逻辑：**
  - 游戏开始 → 双方独立 session → 双方都答完 → 解锁报告
  - Redis key: `game:{game_id}:{user_id}:choice` → `'A'|'B'`
  - Redis key: `game:{game_id}:rounds` → `{ round_id: {status, user_a_choice, user_b_choice} }`
- **API：** `POST /api/games/blind/start`, `POST /api/games/blind/answer`, `GET .../report`
- **依赖：** TASK-011
- **验收：** 双方同时答题；双方都完成时自动生成报告；超时自动清理
- **测试：** `pytest api/tests/integration/test_blind_game_flow.py -v`

#### TASK-013：盲选评分引擎
- **文件：** `api/blind_game_scoring.py`
- **逻辑：**
  - 同选项 → 100% 得分；不同选项 → 0%（题目本身即偏好冲突）
  - 综合得分 = 一致轮次数 / 6 × 100
  - LLM 辅助生成分析文本（1-2 句话）
- **依赖：** TASK-012
- **验收：** 6/6 一致 → 100%；0/6 一致 → 0%；LLM 分析可读
- **测试：** `pytest api/tests/unit/test_blind_game_scoring.py -v`

#### TASK-014：私信会话管理
- **文件：** `api/messages.py`
- **API：** `GET /api/conversations`, `GET /api/messages/{room_id}`, `POST /api/messages`
- **逻辑：**
  - 搭子确认后自动创建 conversation
  - 新消息通过轮询返回（SSE 推送可选 V2）
  - 未读计数
- **依赖：** TASK-010
- **验收：** 搭子确认后可在私信中看到对方；消息持久化
- **测试：** `pytest api/tests/integration/test_messaging_flow.py -v`

---

### Phase 4：前端 - 基础结构（第 3-5 周）

#### TASK-015：5-Tab 导航骨架
- **文件：** `twinbuddy/frontend/src/App.tsx` + `Layout.tsx`
- **实现：**
  - 底部 TabBar（5 个图标 + 标签）
  - React Router v7 路由：`/onboarding` / `/home` (Tab1) / `/buddies` / `/community` / `/profile` / `/chat/:roomId`
  - Tab 切换保留 scroll 位置
- **依赖：** TASK-001（清理旧路由）
- **验收：** 5 个 Tab 均可切换；刷新后保持 Tab 状态
- **测试：** Playwright `tabs.spec.ts`

#### TASK-016：Onboarding 问卷
- **文件：** `twinbuddy/frontend/src/pages/Onboarding/`
- **组件：** `StepMBTI.tsx`, `StepTravelRange.tsx`, `StepBudget.tsx`, `StepSelfDesc.tsx`, `StepCity.tsx`
- **逻辑：**
  - 进度条（5 步）
  - 每步数据存入 localStorage（或立即 POST）
  - 完成后跳转到 Tab1，触发 AI 开场访谈
- **依赖：** TASK-015
- **验收：** 5 步问卷完整填写后跳转到 AI 助手；数据正确 POST 到后端
- **测试：** Playwright `onboarding.spec.ts`

#### TASK-017：主题系统与全局状态
- **文件：** `twinbuddy/frontend/src/theme/` + `twinbuddy/frontend/src/store/`
- **实现：**
  - 延续 V1 Neon Pulse 主题（深海军蓝 + 粉 + 青 + 金）
  - Zustand store：`useAuthStore`, `useProfileStore`, `useGameStore`
  - CSS 变量统一管理颜色
- **依赖：** TASK-015
- **验收：** 主题变量在所有组件中一致；store 持久化到 localStorage

---

### Phase 5：前端 - Tab1 AI 助手（第 5-7 周）

#### TASK-018：聊天界面
- **文件：** `twinbuddy/frontend/src/components/ChatBubble.tsx` + `pages/Tab1AI/`
- **实现：**
  - 消息气泡（左对齐 AI / 右对齐用户）
  - SSE 流式渲染（逐字追加）
  - 探查问题特殊样式（带"快速了解"标签）
  - 发送按钮 + Enter 发送
  - 底部输入框自适应高度
- **依赖：** TASK-016
- **验收：** AI 回答流式显示；探查问题有特殊样式；对话历史可滚动
- **测试：** Playwright `chat.spec.ts`

#### TASK-019：对话历史与数据持久化
- **文件：** `twinbuddy/frontend/src/hooks/useChat.ts`
- **逻辑：**
  - `useChat` hook 管理当前对话状态
  - 每次发送后追加消息（乐观更新）
  - 首次加载时拉取历史
- **依赖：** TASK-018
- **验收：** 刷新页面后对话历史保留；新消息正确追加
- **测试：** `vitest src/hooks/useChat.test.ts`

---

### Phase 6：前端 - Tab2/Tab4/Tab5（第 7-9 周）

#### TASK-020：Tab2 搭子动态
- **文件：** `twinbuddy/frontend/src/pages/Tab2Buddies/`
- **组件：** `BuddyCard.tsx`, `BuddyList.tsx`, `BuddyDetailModal.tsx`
- **逻辑：** 仿照 Hackathon 版本 TwinCard，改造成全页面而非弹窗
- **依赖：** TASK-018（部分 UI 复用）
- **验收：** 搭子卡片列表展示；点击进入详情；操作按钮（接受/跳过/加微信）工作
- **测试：** Playwright `buddies.spec.ts`

#### TASK-021：Tab4 我的
- **文件：** `twinbuddy/frontend/src/pages/Tab4Profile/`
- **组件：** `ProfileHeader.tsx`, `TravelStats.tsx`, `SettingsPanel.tsx`
- **逻辑：** 展示个人信息 + 数字分身主动程度设置
- **依赖：** TASK-015
- **验收：** 页面展示所有信息；设置修改可保存

#### TASK-022：Tab5 私信
- **文件：** `twinbuddy/frontend/src/pages/Tab5Messages/`
- **组件：** `ConversationList.tsx`, `ChatRoom.tsx`, `MessageBubble.tsx`, `TripPlanCard.tsx`
- **逻辑：** 会话列表 + 聊天界面；行程卡片（V1 可用假数据）
- **依赖：** TASK-020（进入私信的入口在搭子详情页）
- **验收：** 私信列表展示；消息发送和接收；进入搭子主页按钮
- **测试：** Playwright `messaging.spec.ts`

---

### Phase 7：前端 - 盲选游戏（第 8-10 周）

#### TASK-023：盲选游戏 UI
- **文件：** `twinbuddy/frontend/src/pages/BlindGame/`
- **组件：** `GameLauncher.tsx`, `RoundQuestion.tsx`, `WaitingOverlay.tsx`, `GameReport.tsx`
- **逻辑：**
  - 游戏入口：搭子详情页点击「开始了解TA」
  - 每轮展示维度 + 选项 A/B（选项不暴露对方）
  - 选完后显示"等待对方..."
  - 6 轮全部完成 → 揭晓报告（动画）
  - 报告页：显示双方所有选择 + 匹配度 + 分析 + 决策按钮
- **依赖：** TASK-020（游戏入口）
- **验收：** 完整 6 轮游戏可跑通；报告生成正确；双方决策按钮工作
- **测试：** Playwright `blind-game.spec.ts`

---

### Phase 8：集成与部署（第 10-12 周）

#### TASK-024：API 联调
- **操作：** 连接真实后端 API（替换 mock 数据）
- **验收：** 所有 API 调用正常返回；SSE 流式稳定；错误提示友好

#### TASK-025：E2E 核心路径测试
- **Playwright 测试用例：**
  ```
  onboarding.spec.ts     → 新用户注册 → 填写问卷 → AI 对话
  chat.spec.ts          → AI 对话 → 偏好探查
  buddies.spec.ts       → 搭子卡片 → 接受搭子 → 进入私信
  blind-game.spec.ts    → 6 轮盲选 → 揭晓报告 → 决策
  messaging.spec.ts     → 私信收发
  ```
- **依赖：** TASK-018, TASK-020, TASK-022, TASK-023
- **验收：** 所有 Playwright 测试通过

#### TASK-026：Mock 数据迁移
- **文件：** `api/mock_data.py`
- **操作：** 将 Hackathon 版本 mock 数据迁移到新 schema
- **验收：** 后端启动后有 10+ mock 用户可测试匹配

#### TASK-027：Vercel 正式部署
- **操作：** 配置 production 环境变量；绑定域名；配置 DNS
- **验收：** `twinbuddy.cn` 可访问；HTTPS 正常

#### TASK-028：Railway 正式部署
- **操作：** 配置 production 环境变量；验证数据库迁移；监控启动日志
- **验收：** API 正常响应；数据库连接成功

#### TASK-029：Smoke Test
- **操作：** 部署完成后执行完整 E2E 流程（Playwright against production）
- **验收：** 核心功能全部可用

---

### Phase 9：V2 社区（第 13-16 周）

#### TASK-030：Tab3 发帖 / 评论
- **文件：** `api/posts.py` + `twinbuddy/frontend/src/pages/Tab3Community/`
- **API：** `GET/POST /api/posts/feed`, `POST .../comments`
- **依赖：** TASK-024
- **验收：** 可发帖；帖子列表展示；可评论

#### TASK-031：点赞 / 关注
- **文件：** `api/social.py`
- **API：** `POST /api/posts/{id}/like`, `POST /api/users/{id}/follow`
- **依赖：** TASK-030
- **验收：** 点赞 / 取消点赞；关注 / 取消关注

#### TASK-032：数字分身代聊
- **文件：** `api/twin_chat.py`
- **逻辑：** 用户手动触发 → 后端发起两个数字人协商 → 结果通知用户
- **依赖：** TASK-031
- **验收：** 触发后可在 Tab2 看到协商结果

---

## 九、测试策略详细说明

### 后端测试矩阵

| 模块 | 单元测试 | 集成测试 | 覆盖率目标 |
|------|---------|---------|-----------|
| 偏好提取引擎 | ✅ 函数级测试（jieba/正则） | ✅ 对话流测试 | ≥ 85% |
| 匹配算法 | ✅ 六维评分逻辑 | ✅ 端到端候选返回 | ≥ 80% |
| 盲选评分 | ✅ 所有轮次组合 | ✅ 完整游戏流程 | ≥ 90% |
| 协商引擎 | ✅ 单节点逻辑 | ✅ 多轮协商 | ≥ 75% |
| 私信 | ✅ 业务逻辑 | ✅ 消息收发 | ≥ 80% |
| 画像 CRUD | ✅ Pydantic 验证 | ✅ API 响应码 | 100% |

### 前端 E2E 路径（Playwright）

```
[注册/登录]
  ↓
[Onboarding 问卷（5步）]
  ↓
[Tab1 AI 助手 - 对话]
  ↓
[Tab2 搭子动态 - 查看卡片]
  ↓
[接受搭子 - 跳转私信]
  ↓
[Tab5 私信 - 收发消息]
  ↓
[返回 Tab2 - 进入盲选游戏]
  ↓
[完成6轮 - 查看报告]
  ↓
[决策 - 查看对方主页]
```

### 性能基准

| 指标 | 目标 |
|------|------|
| API p50 响应时间 | < 200ms |
| API p99 响应时间 | < 2s（LLM 调用 < 45s） |
| 前端首屏加载 | < 3s（3G） |
| SSE 连接建立 | < 500ms |
| CI 完整流水线 | < 10min |

---

## 十、风险与缓解

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| Claude API 成本超预期 | 高 | 设置每日配额；接入豆包作为降级方案 |
| Qdrant 自托管运维成本 | 中 | 先用 Qdrant Cloud（免费层）；量上来后迁移 |
| Railway PostgreSQL 冷启动慢 | 低 | Railway 插件预置 postgres；连接池复用 |
| Vercel + Railway CORS 问题 | 中 | `ALLOWED_ORIGINS` 环境变量统一管理 |
| 数字人协商质量差 | 高 | 早期大量人工评估；满意度 < 6 分触发告警 |
| 单人开发进度延期 | 中 | 优先保 MVP；V2 社区大幅后移 |
| 盲选游戏 Redis 超时丢状态 | 低 | 游戏结果写 PostgreSQL；Redis 仅做会话缓存 |

---

## 十一、验收标准检查清单

### 后端
- [ ] `pytest api/tests/ -v --cov=api` 覆盖率 ≥ 80%
- [ ] `alembic upgrade head` 成功；可回滚
- [ ] 所有 API 端点有集成测试覆盖
- [ ] `git push main` 后 Railway 自动部署成功

### 前端
- [ ] `npm run test:e2e` 所有测试通过
- [ ] Lighthouse Performance Score ≥ 80
- [ ] 响应式适配（H5 为主，PC 兼容）
- [ ] `git push main` 后 Vercel 自动部署成功

### 集成
- [ ] Smoke Test E2E 全部通过
- [ ] 域名 `twinbuddy.cn` 解析正确
- [ ] HTTPS 证书有效
- [ ] 用户可完整走完注册 → AI对话 → 搭子匹配 → 盲选 → 私信 全流程

---

## 十二、技术债务清理（与开发并行）

以下 Hackathon 遗留代码需清理：

| 文件/目录 | 处理方式 |
|---------|---------|
| `twinbuddy/frontend/src/pages/FeedPage.tsx` | 删除 |
| `twinbuddy/frontend/src/components/VideoCard.tsx` | 删除 |
| `api/negotiate.py` 中的 TikTok 视频相关字段 | 清理 |
| `twinbuddy/frontend/src/pages/OnboardingPage.tsx` | 重写（5步新问卷） |
| `twinbuddy/frontend/src/pages/ResultPage.tsx` | 重写（6轮游戏替代） |
| `api/negotiate.py` 中的视频相关参数 | 清理 |

> 这些清理任务包含在 Phase 0（TASK-001）中。
