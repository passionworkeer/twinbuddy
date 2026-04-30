# TwinBuddy 后端 API 文档（v2）

> 版本：v2.0.0
> 日期：2026-04-29
> 基础路径：`http://localhost:8008`
> 前端开发环境代理：`/api` → `http://localhost:8008`

---

## 一、路由结构

入口：`api/frontend_api.py`（FastAPI）

```
GET  /api/health                        # 健康检查
GET  /api/persona                       # 人格构建（v1）
GET  /api/buddies                       # 推荐搭子（v1）
POST /api/negotiate                     # 双 Agent 协商（v1）
WS   /api/stt/ws                        # 实时语音识别
GET  /api/stt/health                    # 语音服务状态

—— v2 路由（由 frontend_api.py 统一注册）——
POST /api/profiles                      # 创建用户画像
GET  /api/profiles/{user_id}            # 获取用户画像
PATCH /api/profiles/{user_id}           # 更新用户画像
PATCH /api/profiles/{user_id}/style     # 更新风格向量

GET  /api/buddies/inbox                 # 搭子动态（需实名认证）
GET  /api/buddies/{buddy_id}/card        # 搭子卡片详情
POST /api/buddies/{buddy_id}/accept      # 接受搭子
POST /api/buddies/{buddy_id}/skip        # 跳过搭子
POST /api/buddies/{buddy_id}/decide      # 决定搭子

POST /api/chat/send                     # 发送消息（SSE 流式）
GET  /api/chat/history/{conversation_id}# 获取对话历史

GET  /api/conversations                 # 私信会话列表
GET  /api/messages/{room_id}            # 获取房间消息
POST /api/messages                      # 发送私信消息

GET  /api/security/status/{user_id}     # 获取实名认证状态
POST /api/security/verify               # 提交实名认证

POST /api/games/blind/start             # 开启盲选游戏
POST /api/games/blind/answer            # 回答盲选问题
GET  /api/games/blind/{game_id}/report   # 获取盲选报告

POST /api/trips/report                  # 上报行程
GET  /api/trips/{trip_id}/status        # 获取行程状态

GET  /api/posts/feed                    # 社区动态列表
GET  /api/posts/{post_id}               # 获取动态详情
POST /api/posts                         # 发布社区动态
POST /api/posts/{post_id}/comments      # 评论动态
POST /api/posts/{post_id}/like           # 点赞/取消点赞
POST /api/posts/{post_id}/twin-chat      # 代聊
```

---

## 二、统一响应格式

```json
{ "success": true, "data": {...} }
{ "success": false, "error": "错误信息" }
```

---

## 三、详细接口

### 3.1 Profiles — 用户画像

#### POST /api/profiles

创建用户画像（Onboarding 完成后调用）。

**请求体：**

```json
{
  "user_id": "user_abc123",     // 可选，前端本地 ID
  "mbti": "INFP",
  "travel_range": ["华南", "周边城市"],
  "budget": "舒适",
  "self_desc": "能一起做攻略，也能给彼此留白",
  "city": "深圳"
}
```

**响应：**

```json
{
  "success": true,
  "data": {
    "user_id": "user_abc123",
    "nickname": "深圳INFP",
    "mbti": "INFP",
    "travel_range": ["华南", "周边城市"],
    "budget": "舒适",
    "self_desc": "能一起做攻略，也能给彼此留白",
    "city": "深圳",
    "style_vector": { "expression_style": "indirect", "keywords": ["慢节奏"] },
    "is_verified": false,
    "verification_status": "unverified",
    "updated_at": 1745904000000
  }
}
```

---

#### GET /api/profiles/{user_id}

获取用户画像详情。

**响应：** 同上 `data` 部分。

**错误：**
- `404`：`Profile not found`

---

#### PATCH /api/profiles/{user_id}

更新用户画像（个人摘要编辑）。

**请求体：**

```json
{
  "budget": "经济",
  "self_desc": "新的描述",
  "city": "广州",
  "travel_range": ["华东"],
  "style_vector": { "expression_style": "direct" }
}
```

所有字段可选，只更新提供的字段。

---

#### PATCH /api/profiles/{user_id}/style

更新风格向量（由聊天内容自动提取）。

**请求体：**

```json
{ "style_vector": { "expression_style": "direct", "keywords": ["慢节奏"] } }
```

---

### 3.2 Buddies v2 — 搭子动态

#### GET /api/buddies/inbox

获取待协商搭子列表（基于匹配分数）。

**查询参数：**
- `user_id`（必填）：用户 ID
- `page`（可选，默认 1）：页码

**前置条件：** 用户必须已完成实名认证（`is_verified=true`）。

**响应：**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "buddy_id": "buddy-001",
        "nickname": "小满",
        "mbti": "ENFJ",
        "avatar": "🌟",
        "city": "深圳",
        "status": "等待你决定",
        "match_score": 82,
        "negotiation_id": "neg-001",
        "preview": "数字分身已经帮你们对齐了舒适预算和深圳出发节奏。",
        "highlights": ["周末短途", "会做攻略", "吃饭不纠结"],
        "conflicts": ["拍照诉求略高"]
      }
    ],
    "page": 1,
    "has_more": false
  }
}
```

**错误：**
- `403`：`请先完成实名认证后再查看搭子动态`
- `404`：`Profile not found`

---

#### GET /api/buddies/{buddy_id}/card

获取搭子卡片详情（含雷达图）。

**查询参数：**
- `negotiation_id`（可选）：协商 ID

**响应：**

```json
{
  "success": true,
  "data": {
    "profile": {
      "buddy_id": "buddy-001",
      "nickname": "小满",
      "mbti": "ENFJ",
      "avatar": "🌟",
      "city": "深圳",
      "summary": "小满更偏向周末短途，在协商里表现出较高的稳定度。"
    },
    "negotiation_summary": {
      "negotiation_id": "neg-001",
      "match_score": 82,
      "consensus": ["周末短途", "会做攻略", "吃饭不纠结"],
      "conflicts": ["拍照诉求略高"],
      "report_intro": "预算与目的地选择已经初步对齐，适合进入下一步了解。"
    },
    "radar_chart": [
      { "dimension": "行程节奏", "user_score": 74, "buddy_score": 80, "weight": 0.25 },
      { "dimension": "消费态度", "user_score": 78, "buddy_score": 76, "weight": 0.25 }
    ],
    "actions": [
      { "id": "blind-game", "label": "开始 6 轮盲选" },
      { "id": "skip", "label": "先跳过" },
      { "id": "wechat", "label": "进一步认识" }
    ]
  }
}
```

---

#### POST /api/buddies/{buddy_id}/accept

接受搭子，开启私信房间。

**请求体：** `{ "user_id": "xxx" }`

**响应：**

```json
{
  "success": true,
  "data": {
    "room_id": "room-buddy-001",
    "peer_profile": { "buddy_id": "buddy-001" }
  }
}
```

---

### 3.3 Chat — 流式对话（AI 助手）

#### POST /api/chat/send

发送消息，流式接收 AI 回复（SSE）。

**请求体：**

```json
{
  "user_id": "user_abc123",
  "message": "适合第一次见面的路线？",
  "conversation_id": "conv_001"  // 可选，新建会话时不传
}
```

**SSE 事件流：**

```
data: {"type": "meta", "conversation_id": "conv_001"}

data: {"type": "message", "conversation_id": "conv_001", "content": "收到"}
data: {"type": "message", "conversation_id": "conv_001", "content": "。你"}
data: {"type": "message", "conversation_id": "conv_001", "content": "提到"}
...

data: {"type": "preference_hint", "conversation_id": "conv_001", "content": "出行时长偏好已记录"}
data: {"type": "done", "conversation_id": "conv_001"}
```

**响应头：** `Cache-Control: no-cache`, `X-Accel-Buffering: no`

**回复生成策略（Mock）：**
- 包含"预算"：返回预算拆解 + 偏好提示
- 包含"周末/假期"：返回短途推荐 + 偏好提示
- 其他：返回确认 + 风格提示

---

#### GET /api/chat/history/{conversation_id}

获取对话历史。

**响应：**

```json
{
  "success": true,
  "data": {
    "conversation_id": "conv_001",
    "user_id": "user_abc123",
    "items": [
      { "id": "msg_xxx", "role": "user", "content": "...", "created_at": 1745904000000 },
      { "id": "msg_yyy", "role": "assistant", "content": "...", "created_at": 1745904000001 }
    ]
  }
}
```

---

### 3.4 Messages — 私信

#### GET /api/conversations

获取用户所有私信会话列表（自动播种 4 个默认房间）。

**查询参数：** `user_id`（必填）

**响应：**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "room_id": "room-01",
        "peer_user": { "id": "buddy-001", "nickname": "小满", "mbti": "ENFJ" },
        "last_message": "这周末如果去顺德，你更想吃还是拍？",
        "unread_count": 0
      }
    ]
  }
}
```

---

#### GET /api/messages/{room_id}

获取房间消息列表。

**查询参数：** `page`（可选，默认 1）

**响应：**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "msg-room01-1",
        "sender_id": "buddy-001",
        "content": "这周末如果去顺德，你更想吃还是拍？",
        "type": "text",
        "created_at": 1745904000000
      }
    ],
    "page": 1
  }
}
```

---

#### POST /api/messages

发送私信消息。

**请求体：**

```json
{
  "room_id": "room-01",
  "sender_id": "user_abc123",
  "content": "我更想吃！",
  "type": "text"
}
```

**响应：**

```json
{
  "success": true,
  "data": {
    "id": "msg_abc123",
    "sender_id": "user_abc123",
    "content": "我更想吃！",
    "type": "text",
    "created_at": 1745904000000
  }
}
```

---

### 3.5 Security — 实名认证

#### GET /api/security/status/{user_id}

获取用户实名认证状态。

**响应：**

```json
{
  "success": true,
  "data": {
    "user_id": "user_abc123",
    "is_verified": false,
    "verification_status": "unverified",
    "real_name_masked": "",
    "id_number_tail": "",
    "verified_at": null
  }
}
```

---

#### POST /api/security/verify

提交实名认证。

**请求体：**

```json
{
  "user_id": "user_abc123",
  "legal_name": "张三",
  "id_number_tail": "1234",
  "face_checked": true
}
```

**响应：**

```json
{
  "success": true,
  "data": {
    "user_id": "user_abc123",
    "is_verified": true,
    "verification_status": "verified",
    "real_name_masked": "张*",
    "id_number_tail": "1234",
    "verified_at": 1745904000000
  }
}
```

**错误：**
- `400`：`Face verification required`
- `404`：`Profile not found`

---

### 3.6 BlindGame — 盲选游戏

6 轮 A/B 选择题，通过 MD5 确定搭子答案，计算匹配分数。

#### POST /api/games/blind/start

开启游戏。

**请求体：** `{ "user_id": "xxx", "negotiation_id": "neg-001" }`

**响应：**

```json
{
  "success": true,
  "data": {
    "game_id": "game_abc123",
    "rounds": [
      { "id": "round_1", "dimension": "作息节奏", "option_a": "早睡早起", "option_b": "晚睡晚起" },
      { "id": "round_2", "dimension": "行程风格", "option_a": "计划周全", "option_b": "随性自由" }
    ]
  }
}
```

---

#### POST /api/games/blind/answer

回答一轮。

**请求体：** `{ "game_id": "game_abc123", "round_id": "round_1", "choice": "A" }`

**响应：**

```json
{
  "success": true,
  "data": {
    "done": false,
    "rounds_completed": 1,
    "game_id": "game_abc123"
  }
}
```

---

#### GET /api/games/blind/{game_id}/report

获取盲选报告（需完成全部 6 轮）。

**响应：**

```json
{
  "success": true,
  "data": {
    "user_choices": { "round_1": "A", "round_2": "B" },
    "buddy_choices": { "round_1": "A", "round_2": "A" },
    "per_round_result": [
      { "round_id": "round_1", "dimension": "作息节奏", "user_choice": "A", "buddy_choice": "A", "matched": true },
      { "round_id": "round_2", "dimension": "行程风格", "user_choice": "B", "buddy_choice": "A", "matched": false }
    ],
    "match_score": 80.5,
    "analysis": "你们有明确共识，也有需要协商的点，适合看完报告后再决定。"
  }
}
```

**错误：**
- `409`：`Game not complete`（未完成 6 轮）

---

### 3.7 Trips — 行程

#### POST /api/trips/report

上报行程（需实名认证）。

**请求体：**

```json
{
  "user_a_id": "user_abc123",
  "user_b_id": "buddy-001",
  "destination": "顺德",
  "depart_date": "2026-05-01",
  "return_date": "2026-05-03",
  "emergency_contact_name": "李四",
  "emergency_contact_phone": "13800138000"
}
```

**错误：**
- `403`：`请先完成实名认证后再上报行程`
- `404`：`Profile not found`

---

#### GET /api/trips/{trip_id}/status

获取行程状态。

---

### 3.8 Community — 社区

#### GET /api/posts/feed

获取社区动态。

**查询参数：**
- `user_id`（可选）：用于同城排序
- `page`（可选，默认 1）

**响应：**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "post_seed_shenzhen",
        "user_id": "seed_user_1",
        "author": { "nickname": "Momo", "mbti": "ISFP" },
        "content": "周末想在深圳周边找个能一起慢慢逛、顺便吃点好吃的搭子。",
        "images": [],
        "tags": ["深圳", "周末", "美食"],
        "location": "深圳",
        "likes_count": 3,
        "comments_count": 1,
        "comments": [
          { "id": "comment_seed_1", "author_nickname": "阿杰", "content": "...", "created_at": 1745903940000 }
        ],
        "created_at": 1745903880000
      }
    ],
    "page": 1,
    "has_more": false
  }
}
```

---

#### POST /api/posts

发布社区动态。

**请求体：**

```json
{
  "user_id": "user_abc123",
  "content": "周末想去顺德找搭子",
  "location": "深圳",
  "tags": ["顺德", "周末", "美食"],
  "images": [],
  "is_travel_plan": true
}
```

---

#### POST /api/posts/{post_id}/comments

评论动态。

**请求体：** `{ "user_id": "xxx", "content": "这个节奏挺舒服的！" }`

---

#### POST /api/posts/{post_id}/like

点赞/取消点赞（切换）。

**请求体：** `{ "user_id": "xxx" }`

**响应：**

```json
{
  "success": true,
  "data": { "post_id": "xxx", "liked": true, "likes_count": 4 }
}
```

---

#### POST /api/posts/{post_id}/twin-chat

代聊（数字分身代为评论帖子）。

**请求体：** `{ "user_id": "xxx" }`

**响应：**

```json
{
  "success": true,
  "data": {
    "post_id": "xxx",
    "status": "queued",
    "summary": "数字分身已为你向帖子作者发起代聊，重点围绕顺德、慢节奏。"
  }
}
```

---

## 四、目录结构

```
api/
├── frontend_api.py   # 路由合并层
├── _models.py        # Pydantic 模型定义
├── _constants.py     # 常量（城市/MBTI/视频）
├── _store.py         # 内存状态持久化（in-memory）
├── style_vector.py  # 风格向量提取
│
├── persona.py        GET /api/persona
├── buddies.py        GET /api/buddies
├── negotiate.py      POST /api/negotiate
├── profiles.py       Profiles v2 路由
├── buddies_v2.py     Buddies v2 路由
├── chat.py           Chat v2 路由（SSE）
├── messages.py       Messages v2 路由
├── security.py       Security v2 路由
├── blind_game.py     BlindGame v2 路由
├── trips.py          Trips v2 路由
├── community.py      Community v2 路由
├── stt_api.py        语音识别 API
└── xfyun_stt.py      讯飞 STT 封装
```

---

## 五、数据存储

**注意：** 当前后端使用内存存储（`_store.py`），不适用于多进程部署。生产环境需替换为 Redis 或数据库。

存储模块：
- `get_profile / save_profile`
- `get_security_status / save_security_status`
- `get_post / list_posts / save_post`
- `get_room / list_rooms / save_room`
- `get_blind_game / save_blind_game`
- `get_trip / save_trip`
- `get_chat_conversation / append_chat_message / save_chat_conversation`

---

*最后更新：2026-04-29*
