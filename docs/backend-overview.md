# TwinBuddy 后端架构概览

> 依据：`api/` 实际代码 + PRD1 §6 / PRD2 §8 + 评审建议
> 范围：FastAPI 入口 / 路由聚合 / LangGraph 协商 / STT / 数据流 / 部署

---

## 1. 总览

TwinBuddy 后端是一个**单进程 FastAPI 应用**：

- 入口：`api/index.py:app`（uvicorn 启动）
- 路由聚合：`api/frontend_api.py`（不写业务，只 import 子路由）
- 子路由：每个 feature 独立 `APIRouter(prefix='/api')`
- 数据：进程内字典 + `data/*.json` 镜像（dev）/ Postgres + Alembic（prod）
- 协商：`api/negotiation/graph.py` LangGraph 状态机
- STT：WebSocket `/api/stt/ws` 走讯飞

---

## 2. 进程启动链路

```
uvicorn api.index:app --reload --port 8000
        │
        ▼
api/index.py
  ├─ load_dotenv()  ← 仓库根 .env
  ├─ FastAPI(title=...)
  ├─ CORS(middleware)  ← 允许 dev 通配
  ├─ mount(frontend_router)  ← api.frontend_api
  ├─ mount(stt_router)       ← api.stt_api
  └─ /api/health (内置)
```

---

## 3. 路由清单

| 路由 | 文件 | 用途 |
|---|---|---|
| `/api/health` | index.py | 健康检查 |
| `/api/profiles` | profiles.py | V2 profile CRUD + style_vector |
| `/api/persona` | persona.py | V1 persona 蒸馏 |
| `/api/buddies` | buddies.py | V1 buddy 列表 |
| `/api/buddies/inbox` | buddies_v2.py | V2 inbox |
| `/api/buddies/{id}/card` | buddies_v2.py | V2 buddy card |
| `/api/buddies/{id}/accept\|skip\|decide` | buddies_v2.py | V2 行动 |
| `/api/negotiate` | negotiate.py | **核心** LangGraph 协商 |
| `/api/chat/send` | chat.py | Twin ↔ user 聊天 |
| `/api/conversations` | messages.py | 1:1 房间列表 |
| `/api/messages/{room_id}` | messages.py | 房间消息 |
| `/api/security/status\|verify` | security.py | 实名（mock）|
| `/api/games/blind/start\|answer` | blind_game.py | 6 轮 A/B 配对 |
| `/api/games/blind/{id}/report` | blind_game.py | 报告 |
| `/api/trips/report` | trips.py | 出行报告 |
| `/api/posts/feed\|/{id}` | community.py | 社区 |
| `/api/posts/{id}/comments\|like\|twin-chat` | community.py | 社区互动 |
| `/api/stt/ws` (WS) | stt_api.py | 讯飞 STT 代理 |
| `/api/stt/health` | stt_api.py | STT 健康 |

**新增**（评审要求但当前**还没写**，属 F2/F3/F4 后端契约）：

| 路由 | 用途 | 状态 |
|---|---|---|
| `POST /api/action-cards` | 推一张懂你行动卡 | **未实现** |
| `GET /api/action-cards/{id}` | 卡片详情 | **未实现** |
| `POST /api/action-cards/{id}/dampen` | 抑制本场景 | **未实现** |
| `POST /api/action-cards/{id}/negotiate` | 触发 AI 协商 | **未实现**（与 /api/negotiate 区别：单候选人） |
| `GET /api/action-cards/{id}/invite-template` | 一键邀约文案 | **未实现** |

> 实施顺序：F1 ActionCard → 卡片 API（用 mock 数据先跑通）→ 协商 API（复用 /api/negotiate 内核）→ 邀约模板 API（用 invite-templates.md 6 场景）

---

## 4. 协商 LangGraph 状态机

### 4.1 文件

- `api/negotiation/state.py` — `NegotiationPhase` enum + `NegotiationState` TypedDict
- `api/negotiation/nodes.py` — 纯算法节点（无 LLM）
- `api/negotiation/llm_nodes.py` — MiniMax LLM 节点
- `api/negotiation/graph.py` — 编译
- `api/negotiation/llm_client.py` — MiniMax HTTP 客户端

### 4.2 状态机

```
IDLE
  ↓ POST /api/negotiate
PROPOSE              ← Twin A 出价
  ↓
PERSONA_INIT         ← 双方画像加载
  ↓
CHAT_ROUND           ← LLM 生成对话轮次（≤ 3 轮）
  ↓
[CONFLICT_DETECTED]  ← 冲突识别
  ↓
[NEGOTIATION]        ← 重新协商
  ↓ (循环 ≤ 3 轮)
CONSENSUS_FOUND      ← 达成共识
  ↓
REPORT_GENERATED     ← 输出结构化报告
```

### 4.3 关键改进（评审要求）

- **结构化摘要**：不返回聊天记录，返回 `{agreed[], pending[], risks[], key_moment, progress}`
- **进度永远 < 100%**：避免 AI 替用户做决定（PRD §16）
- **LLM fallback**：如果 MiniMax 不可用 → 走 `nodes.py` 纯算法，metadata 说明 fallback source

### 4.4 输出契约（与 docs/action-cards.md §2.4 对齐）

```python
class NegotiationSummary(BaseModel):
    agreed: list[str]              # 已达成共识（≤ 4）
    pending: list[str]             # 待确认（1-3）
    risks: list[str]               # 风险（1-2）
    key_moment: KeyMoment | None   # 1 个关键瞬间
    progress: int                  # 0-100，**永远 < 100**
```

---

## 5. 持久化（dev/prod 双轨）

### 5.1 dev 模式（默认）

- 进程内：`api/_store.py` 模块级字典
- 镜像：`data/<name>_store.json`（gitignored，async 写）
- **不**支持多进程

### 5.2 prod 模式（部署到 Railway）

- PostgreSQL（`docker-compose.yml`）
- Alembic 迁移：`api/migrations/versions/*.py`
- DDL：`database/schema/*.sql`（按编号分文件）
- UUID 用 `gen_random_uuid()`，时间戳 `timestamptz`

### 5.3 数据契约注意

- dev `_store.py` 加新实体 → 同步加 prod 迁移
- 任何持久化字段变更 → `_models.py` Pydantic 模型同步

---

## 6. STT 链路（WebSocket）

```
浏览器 MediaRecorder
  ↓ WebSocket /api/stt/ws
api/stt_api.py (WebSocket endpoint)
  ↓
api/xfyun_stt.py (讯飞 WebSocket 客户端)
  ↓ HTTPS WSS
讯飞 STT 服务
  ↓
回传 JSON 文字结果
  ↓
前端 chunks → 拼成完整 transcript
```

**反模式**：不在前端做 VAD，直接给到后端让讯飞处理。

---

## 7. 错误处理与可观测

### 7.1 错误格式

- 应用层：`{"success": true, "data": ...}` / `{"success": false, "error": "msg"}`
- 验证层：FastAPI 422（保留）

### 7.2 日志

- 路由层：`logger.info(...)` 记录关键事件
- 错误层：catch → log 全栈 → 返回用户友好 message
- **禁止** `print()` / `console.log`

### 7.3 监控（roadmap，未实施）

- Prometheus 指标：`/metrics` 端点
- Sentry 错误上报
- LangSmith trace 协商节点

---

## 8. 部署

| 平台 | 命令 | 备注 |
|---|---|---|
| 本地 | `python -m uvicorn api.index:app --reload --port 8000` | 调试用 |
| Railway | `railway up`（railway.toml） | 读 `Procfile` |
| Docker | `docker compose up api` | 待写 Dockerfile |

详细见 `docs/DEPLOY.md`。

---

## 9. 性能与 LLM 成本

### 9.1 单次协商成本（粗算）

- 4-6 次 LLM 调用 × ~10K tokens 输出
- 按 MiniMax 公开定价：~¥0.05-¥0.15 / 次

### 9.2 缓存策略（roadmap）

- 协商模板缓存（`@lru_cache`）
- 模板化 fallback（90% 不调 LLM）
- persona 蒸馏结果缓存

### 9.3 详见

- `docs/api-backend.md`（每个端点的请求/响应）
- `docs/api-frontend.md`（前端调用示例）
