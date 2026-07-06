# TwinBuddy 分支整理文档

> 用途：项目分支众多，新人/协作者/未来回看时能立刻知道每个分支是什么、是否还需要、什么时候删。
> 最近整理：2026-07-06（在 codex/project-structure-cleanup 分支上 7 个 commit 之后）

---

## 1. 当前状态

### 本地分支（2 个）

| 分支 | HEAD | 用途 | 状态 |
|---|---|---|---|
| **`codex/project-structure-cleanup`** | `dafc869` | 当前开发分支，包含 7 个新 commit（PLAN v2 + 6 场景数据 + 30 mock user + 真实后端 API + ActionCard 组件 + 路由 + mock + 测试） | **活跃** |
| **`main`** | `bcf8a99` | 主分支，远端 origin/main 的本地引用 | 稳定 |

### 远程分支（10 个）— 离线状态（无法 fetch）

| 分支 | 远端 HEAD | 用途 / 判断 |
|---|---|---|
| `origin/main` | `bcf8a99` | 主分支，PR 目标 | ✅ 保留 |
| `origin/codex/project-structure-cleanup` | `4cc9be7` (7/3 拉取) | **本地有 7 个新 commit ahead 远端**（offline 7/6 待 push） | ✅ 保留，等网络通 push |
| `origin/develop` | `921596c` (5/24) | 上一个开发线，已被 codex 取代 | ⚠ 可清理（等网络通） |
| `origin/feature/v2-frontend` | (旧) | React 端，已 frozen（CLAUDE.md 明确"本次不再维护"） | ❌ 可清理 |
| `origin/feature/e2e-test` | (旧) | E2E 测试 | ❌ 可清理 |
| `origin/feature/matching-graph` | (旧) | 配图功能 | ❌ 可清理 |
| `origin/feature/negotiation-api` | (旧) | 协商 API | ❌ 可清理 |
| `origin/feature/replace-v2-mocks` | (5/24) | 替换 v2 mock | ❌ 可清理 |
| `origin/hotfix/template` | (旧) | 紧急修复 | ❌ 可清理 |
| `origin/release/v0.1.0` | (旧) | v0.1.0 发布分支 | ✅ 保留（版本归档） |

---

## 2. 整理计划

### 离线已完成

- [x] 删本地 `feature/v2-frontend`（CLAUDE.md 明确不再维护，2026-07-06）
- [x] 写 BRANCHES.md（本文档）

### 网络通后做（待 `git fetch --all`）

- [ ] `git push origin codex/project-structure-cleanup` — 推 7 个新 commit 上去
- [ ] `git push origin --delete feature/v2-frontend` — 删远端 React 分支
- [ ] `git push origin --delete feature/e2e-test` — 删远端旧 feature
- [ ] `git push origin --delete feature/matching-graph`
- [ ] `git push origin --delete feature/negotiation-api`
- [ ] `git push origin --delete feature/replace-v2-mocks`
- [ ] `git push origin --delete hotfix/template`
- [ ] `git push origin --delete develop`（如果 develop 已被 codex 取代）

**风险评估**：删远程分支**影响其他人拉取**。建议：
- 先 `git fetch --all` 确认哪些分支已合并到 main（`git branch --merged main`）
- 只删 `--merged` 的
- 保留 `release/v0.1.0`（版本归档）

---

## 3. 7 个新 commit（在 codex/project-structure-cleanup）

```
dafc869 feat(backend):      真实懂你行动卡 API + Pydantic + 邀约模板
88d509f test(frontend):     Playwright E2E spec + config (6 demo 流程)
67d06c6 test(frontend):     ActionCard 数据契约自检 (10 用例)
569743f feat(routing+mock):  6 路由 + mock 拦截 + 鉴权白名单
640d642 feat(frontend):     ActionCard + 8 个 F3-F8 组件
9131abf feat(data):         6 场景 + 30 user + 黄金顺序
64abc66 docs(plan+design):  PLAN v2 + 7 份文档
```

每条都是可独立回滚的小任务。**任何一条 `git revert <sha>` 都能干净回退。**

---

## 4. 命名约定（建议未来遵循）

| 用途 | 命名格式 | 示例 |
|---|---|---|
| 主分支 | `main` | `main` |
| 长期开发线 | `develop` | `develop` |
| 短期 feature | `feature/<scope>` | `feature/action-card-v2` |
| 紧急修复 | `hotfix/<scope>` | `hotfix/login-crash` |
| 版本发布 | `release/v<version>` | `release/v0.1.0` |
| 实验探索 | `codex/<scope>` | `codex/project-structure-cleanup` |

---

## 5. 注意事项

- **当前远端不可达**（DNS 解析失败/网络限制）—— 所有 push/fetch 操作均 timeout
- 整理计划需要网络通后执行，**不能强行 push**（会卡 21 秒 timeout）
- `mock_personas/` 目录在 .gitignore 里（作为 "embedded git repos" 忽略）—— 强 add 后才能进 commit
