# TwinBuddy 后端 API 文档

> 版本：v1.0.0
> 日期：2026-04-25
> 基础路径：`http://localhost:8008`
> 前端开发环境代理：`/api` → `http://localhost:8008`

---

## 概览

后端入口：`api/index.py`（FastAPI）

```
uvicorn api.index:app --host 0.0.0.0 --port 8008
```

所有端点均返回统一格式：

```json
{ "success": true, "data": {...} }
{ "success": false, "error": "错误信息" }
```

---

## 端点清单

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/health` | 健康检查 |
| GET | `/api/persona` | 获取/构建人格 |
| GET | `/api/buddies` | 获取推荐搭子 |
| POST | `/api/negotiate` | 双 Agent 协商 |
| WS | `/api/stt/ws` | 实时语音识别 |
| GET | `/api/stt/health` | 语音服务状态 |

---

## 详细接口

### GET /api/health

健康检查。

**响应：**
```json
{ "status": "healthy", "service": "twinbuddy-api" }
```

---

### GET /api/persona

获取或构建用户数字孪生人格。

**查询参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `user_id` | string | 二选一 | 用户 ID，从持久化数据读取 |
| `mbti` | string | 二选一 | MBTI 类型（如 `ENFP`），无 user_id 时根据参数构建 |
| `interests` | string | 否 | 兴趣标签，逗号分隔（如 `美食,摄影`） |
| `city` | string | 否 | 城市 ID（如 `chengdu`） |
| `voice_text` | string | 否 | 语音转文字内容 |

**响应（成功）：**
```json
{
  "success": true,
  "data": {
    "persona_id": "persona-enfp-07f34c23",
    "name": "热情开拓者",
    "avatar_emoji": "🌈",
    "avatar_prompt": "热情创意，热情开拓者，向往成都",
    "layer0_hard_rules": ["计划太紧的行程", "没有自由探索空间"],
    "mbti_influence": "MBTI=ENFP...",
    "travel_style": "热情开拓者的综合体验型",
    "soul_fingerprint": "twin-enfp-7a9df13d",
    "identity": { "background": [], "core_values": [], ... },
    "speaking_style": { "emoji_freq": "频繁", "language_markers": [], ... },
    "emotion_decision": { "decision_style": "fe-cautious", ... },
    "social_behavior": { "social_energy": "外向", "initiation_style": "主动", ... },
    "negotiation_style": { "approach": "温和协商", "hard_to_compromise": [], ... }
  }
}
```

**错误：**
- `400`：缺少 user_id 和 mbti
- `404`：user_id 未找到

---

### GET /api/buddies

获取按兼容性评分排序的推荐搭子。

**查询参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `user_id` | string | 否 | 用户 ID（从 onboarding_store 读取偏好） |
| `limit` | int | 否 | 返回数量，默认 10，最大 50 |
| `mbti` | string | 否 | MBTI 类型 |
| `interests` | string | 否 | 兴趣标签，逗号分隔 |
| `city` | string | 否 | 城市 ID |

**响应：**
```json
{
  "success": true,
  "buddies": [
    {
      "id": "buddy_01",
      "name": "小满",
      "mbti": "ENFP",
      "avatar_emoji": "😊",
      "travel_style": "随性探索型",
      "typical_phrases": ["说走就走才是浪漫啊！", "冲冲冲！"],
      "negotiation_style": "协商风格很软，用撒娇和情绪感染...",
      "compatibility_score": 85.0
    }
  ],
  "user_prefs": { "mbti": "ENFP", "likes": ["美食"], ... },
  "meta": { "user_id": "", "limit": 10, "total_buddies": 10, "mbti": "ENFP", "city": "" }
}
```

---

### POST /api/negotiate

双数字人协商，根据用户和搭子的人格生成协商对话和行程共识。

**请求体：**
```json
{
  "destination": "dali",
  "mbti": "ENFP",
  "interests": ["美食", "摄影"],
  "buddy_mbti": "INFP",
  "user_id": null,
  "user_persona_id": null,
  "voice_text": null
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `destination` | string | 是 | 目的地城市 ID |
| `mbti` | string | 否 | 用户 MBTI |
| `interests` | string[] | 否 | 用户兴趣标签 |
| `buddy_mbti` | string | 否 | 搭子 MBTI，默认 ENFP |
| `user_id` | string | 否 | 用户 ID |
| `user_persona_id` | string | 否 | persona ID |
| `voice_text` | string | 否 | 语音转文字内容 |

**响应：**
```json
{
  "success": true,
  "data": {
    "destination": "大理",
    "dates": "5月10日-5月15日",
    "budget": "人均3500元",
    "consensus": true,
    "plan": ["大理古城民宿2晚", "洱海边日落", "特色美食探索"],
    "matched_buddies": ["你", "小满"],
    "radar": [
      { "dimension": "行程节奏", "user_score": 85, "buddy_score": 80, "weight": 0.8 }
    ],
    "red_flags": [],
    "messages": [
      { "speaker": "user", "content": "我想去大理旅行！", "timestamp": 1700000000 },
      { "speaker": "buddy", "content": "好呀，大理一直是我想去的！", "timestamp": 1700000010 }
    ]
  },
  "meta": {
    "source": "llm" | "mock",
    "llm_error": null,
    "user_mbti": "ENFP",
    "buddy_mbti": "INFP",
    "overall_score": 0.75
  }
}
```

**降级说明：** 若 LLM 调用失败（超时/无 Key），自动降级到 Mock 协商数据，`meta.source` 为 `mock`。

---

### WebSocket /api/stt/ws

实时语音识别（iFlytek）。

**协议：**

客户端 → 服务端（binary）：
- PCM 音频块（16kHz / 16bit / mono，建议 1280 字节 = 40ms）
- 空 binary：标记音频结束

服务端 → 客户端（text/JSON）：
- `{"type": "text", "content": "识别片段"}`
- `{"type": "done", "text": "完整拼接文本"}`
- `{"type": "error", "message": "错误描述"}`

**环境变量（必须）：**
- `XFYUN_APP_ID`
- `XFYUN_API_KEY`
- `XFYUN_API_SECRET`

---

### GET /api/stt/health

检查语音服务配置状态。

**响应（已配置）：**
```json
{ "status": "configured", "has_app_id": true, "has_api_key": true, "has_api_secret": true }
```

**响应（未配置）：**
```json
{ "status": "missing_env", "has_app_id": false, "has_api_key": false, "has_api_secret": false, "required_env": ["XFYUN_APP_ID", "XFYUN_API_KEY", "XFYUN_API_SECRET"] }
```

---

## 目录结构

```
api/
├── __init__.py         # 导出 frontend_router + stt_router
├── index.py             # FastAPI 入口 /api/health
├── frontend_api.py     # 路由合并层（导入子 router）
├── buddies.py           GET /api/buddies
├── persona.py           GET /api/persona
├── negotiate.py        POST /api/negotiate + MING 人格构建
├── stt_api.py           WS /api/stt/ws + GET /api/stt/health
├── _models.py          Pydantic 请求/响应模型
├── _constants.py       城市/MBTI/视频 Mock 配置
├── _store.py           内存状态持久化
└── xfyun_stt.py        iFlytek STT 封装
```

---

*最后更新：2026-04-25*