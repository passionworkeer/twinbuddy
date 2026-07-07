# TwinBuddy 分支整理文档

> 用途：项目分支众多，新人/协作者/未来回看时能立刻知道每个分支是什么、是否还需要、什么时候删。
> 最近整理：2026-07-06/07（在 codex/project-structure-cleanup 分支上 8 个 commit 之后）

---

## 1. 当前状态（2026-07-07 整理后）

### 本地分支（2 个）

| 分支 | HEAD | 用途 | 状态 |
|---|---|---|---|
| **`codex/project-structure-cleanup`** | `f568730` | 当前开发分支，含 8 个新 commit（PLAN v2 + 6 场景数据 + 30 mock user + 真实后端 API + ActionCard 组件 + 路由 + mock + 测试 + 分支整理文档） | **活跃 · 已 push 远端** ✅ |
| **`main`** | `bcf8a99` | 主分支，跟远端 origin/main 一致 | 稳定 |

### 远端分支（6 个 — 已清理 4 个）

| 分支 | 远端 HEAD | 用途 / 判断 |
|---|---|---|
| `origin/main` | `bcf8a99` | 主分支，PR 目标 | ✅ 保留 |
| `origin/codex/project-structure-cleanup` | `f568730` (7/7) | 当前开发分支，跟本地同步 | ✅ 保留 |
| `origin/develop` | `921596c` (5/24) | 上一个开发线，未合并到 main | ✅ 保留（独立 dev 线） |
| `origin/feature/replace-v2-mocks` | (5/24) | 替换 v2 mock，未合并到 main | ✅ 保留（5/24 还有更新） |
| `origin/hotfix/template` | (旧) | 紧急修复模板，未合并 | ✅ 保留（hotfix 不能直接删） |
| `origin/release/v0.1.0` | (旧) | v0.1.0 发布分支 | ✅ 保留（版本归档） |

### 已删除（4 个，2026-07-07）

- ❌ `origin/feature/e2e-test`（已合并到 main）
- ❌ `origin/feature/matching-graph`（已合并到 main）
- ❌ `origin/feature/negotiation-api`（已合并到 main）
- ❌ `origin/feature/v2-frontend`（已合并到 main，CLAUDE.md 明确不再维护）

### 本地已删除

- ❌ `feature/v2-frontend`（离线阶段已删，2026-07-06）

---

## 2. 整理时间线

- [x] **2026-07-06** 删本地 `feature/v2-frontend` + 写 BRANCHES.md（离线）
- [x] **2026-07-07** 走 SSH 推 8 个 commit 到 `origin/codex/project-structure-cleanup`
- [x] **2026-07-07** SSH 删 4 个已合并到 main 的远端 feature 分支

---

## 3. 8 个新 commit（在 codex/project-structure-cleanup）

```
f568730 docs: 整理分支 - BRANCHES.md + 删本地 feature/v2-frontend
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

## 5. SSH 通道配置（2026-07-07 启用）

git remote 已从 HTTPS 切到 SSH：

```
git@github.com-passionworkeer:passionworkeer/twinbuddy.git
```

走 `~/.ssh/config` 里的 `github.com-passionworkeer` alias（`ssh.github.com:443` + `id_ed25519_passionworkeer`），绕开 21s HTTPS timeout。**如果换机器开发，记得同步 `.ssh/config` 和 `id_ed25519_passionworkeer` 私钥。**

---

## 6. 注意事项

- **所有 push/fetch 都走 SSH**（`github.com-passionworkeer` alias）
- 只删 `--merged main` 的分支；`develop` / `hotfix/*` / `release/*` 保留
- 8 个新 commit 全部 push 成功，远端与本地 `f568730` 同步
