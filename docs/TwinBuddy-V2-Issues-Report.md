# TwinBuddy V2 问题报告

> 日期：2026-04-25
> 状态：已确认，待修复
> 优先顺序：🔴 P0（阻断）/ 🟡 P1（严重影响体验）/ 🟠 P2（设计/功能缺失）

---

## P0 — API 404：后端路由注册失败

### 问题描述

所有前端发起的 API 请求均返回 404，后端没有正常注册路由。错误日志：

```
POST /api/profiles                         → 404
GET  /api/posts/feed?page=1                 → 404
GET  /api/buddies/buddy-001/card?...       → 404
```

### 根本原因分析

1. **最可能原因 — `frontend_api.py` 的 Python 模块导入链存在静默失败**

   `frontend_api.py` 通过以下方式合并子路由：
   ```python
   from api.buddies_v2 import router as _buddies_v2_router
   from api.community import router as _community_router
   from api.profiles import router as _profiles_router
   # ... 共11个 router
   router = APIRouter(tags=["前端对接"])
   router.include_router(_buddies_v2_router)
   ```

   其中 `api.profiles` → `api.community` → `api._store` → `api._models` 构成一条导入链。如果链中任何 `.py` 文件在 `uvicorn` 启动时因语法错误、类型错误、依赖缺失而加载失败，`include_router()` 调用不会报错，但该 router 整体不会被注册。

   **验证方法：**
   ```bash
   curl http://localhost:8000/docs  # 查看 Swagger UI 有多少路由
   curl http://localhost:8000/openapi.json | python -c "import json,sys; d=json.load(sys.stdin); print([p for p in d['paths'].keys()])"
   ```

2. **次要可能 — `frontend_router` 被 `stt_router` 覆盖**

   `index.py` 中：
   ```python
   app.include_router(frontend_router)
   app.include_router(stt_router)
   ```
   如果 `stt_router` 也有 `prefix="/api"` 且定义了同名路由（如 `/api/health`），后者会覆盖前者（FastAPI 路由按注册顺序匹配，`app.include_router()` 后注册的优先）。

3. **Vite Proxy 端口曾指向错误（已修复）**

   `vite.config.ts` 原来 `proxy.target: 'http://localhost:8008'`，但后端实际运行在 `8000`。已在本次会话中修正为 `8000`。

### 需要检查的模块

| 文件 | 检查项 |
|------|--------|
| `api/profiles.py` | `TwinBuddyProfileRequest` / `extract_style_vector` 是否可导入 |
| `api/community.py` | `_DEFAULT_POSTS` 是否含语法错误 |
| `api/buddies_v2.py` | `_CANDIDATES` / `_build_radar` 是否可执行 |
| `api/_store.py` | `get_profile` / `save_profile` 函数是否存在 |
| `api/_models.py` | Pydantic model 是否正确定义 |
| `api/style_vector.py` | `jieba` 是否安装 |

---

## P1 — UI 设计不匹配：缺少 Hackathon 版 TwinCard 风格的卡片式交互

### 问题描述

当前 V2 所有页面都是**平铺列表卡片**（`glass-panel` div 直接排列），完全缺少 Hackathon 版本的核心设计语言：**弹出卡片（Modal）+ 多层展开交互**。

### 参考设计来源

1. **Git 历史（已删除但有 commit 记录）：**
   - `main:twinbuddy/frontend/src/components/twin-card/TwinCard.tsx` — 三层展开卡片（Layer1 预览 / Layer2 详情 / Layer3 协商）
   - `main:twinbuddy/frontend/src/components/immersive-feed/TwinMatchModal.tsx` — 全屏协商弹窗
   - `main:twinbuddy/frontend/src/components/twin-card/RadarChart.tsx` — 雷达图组件
   - CSS 类：`.twin-card-layer1` / `.twin-card-layer2` / `.twin-card-layer3`（已在 `index.css` 中保留，但组件已删除）

2. **参考设计文件夹：**
   - `D:\...\stitch_chromatic_travel_buddy\...travel_guide_full_width_glass_cards\` — Material 3 玻璃卡片风格
   - `D:\...\stitch_remix_of_mbti_travel_ui_design\` — 深色户外主题设计

3. **Hackathon 版本 TwinCard 核心设计元素（当前缺失）：**

   ```
   TwinCard 三层展开结构：
   ┌─────────────────────────────────────┐
   │  Layer 1：搭子卡片预览              │  ← 点击"了解更多"展开
   │  · 头像 + MBTI + 昵称              │
   │  · 匹配度 + 协商状态                │
   │  · "了解更多" 按钮                  │
   └─────────────────────────────────────┘
               ↓ 点击展开
   ┌─────────────────────────────────────┐
   │  Layer 2：协商详情                  │
   │  · 雷达图（六维契合度）            │
   │  · 共识点 / 冲突点                 │
   │  · 数字人协商对话记录               │
   │  · "开始盲选" / "跳过" 按钮         │
   └─────────────────────────────────────┘
               ↓ 点击"开始盲选"
   ┌─────────────────────────────────────┐
   │  Layer 3：6轮盲选游戏               │
   │  · 双方同时作答，互不知晓           │
   │  · 6轮结束后揭晓匹配报告            │
   └─────────────────────────────────────┘
   ```

   **关键 CSS 类（在 `index.css` 中存在但无对应组件）：**
   - `.twin-card-layer1` — 深海军蓝渐变 + 左侧霓虹条
   - `.twin-card-layer2` — 更强渐变 + 层叠阴影 + 双层光晕
   - `.twin-card-layer3` — 最强视觉效果

### 当前 V2 的 BuddiesPage 问题

- `BuddyDetailModal` 组件存在（已引入 `RadarChart`），但：
  - **`RadarChart` 组件文件缺失**：从 `'../twin-card/RadarChart'` 导入失败，该文件已被删除
  - Modal 不是弹出卡片风格，只是固定定位的底部弹窗
  - 缺少 Hackathon 版本的三层展开体验（Layer1→2→3）

### 需要恢复/重做的组件

| 组件 | 状态 | 说明 |
|------|------|------|
| `TwinCard.tsx`（三层展开版）| ❌ 删除 | 需要重新实现 Layer1/2/3 |
| `RadarChart.tsx` | ❌ 删除 | 需要从 git 历史恢复 |
| `TwinMatchModal.tsx` | ❌ 删除 | 全屏协商弹窗 |
| `BuddyDetailModal.tsx` | ⚠️ 存在但导入错误 | 需修复 RadarChart 路径 + 升级设计 |
| `.twin-card-layer1/2/3` CSS | ✅ 保留 | 可复用 |

---

## P1 — 移动端适配：H5 响应式设计几乎缺失

### 问题描述

当前所有页面在大屏上使用**双列 Grid 布局**（`lg:grid-cols-[1.3fr_0.9fr]` 等），在移动端（H5）上：
- 布局没有正确折叠为单列
- `AppShell` 的 `main` 区域高度固定 `h-[calc(100vh-5rem)]`，但子页面内容溢出不滚动
- `BottomTabBar` 在部分页面（如 CommunityPage 双列）视觉上被截断
- `OnboardingV2Page` 使用 `max-w-2xl mx-auto`，在手机上偏窄
- `BuddyDetailModal` 虽然用了 `items-end sm:items-center`（底部弹出），但整体设计未按手机屏幕优化

### 需要适配的关键页面

| 页面 | 当前布局 | 移动端问题 |
|------|---------|-----------|
| CommunityPage | `lg:grid-cols-[1.08fr_0.92fr]` | 侧边栏在小屏应隐藏或折叠 |
| HomePage | `lg:grid-cols-[1.3fr_0.9fr]` | 聊天区应全宽 |
| MessagesPage | `grid-cols-[0.95fr_1.05fr]` | 会话列表/聊天应切换显示 |
| BuddiesPage | 单列（基本 OK） | Modal 需优化 |
| OnboardingV2Page | `max-w-2xl mx-auto` | 基本 OK，可微调 |

### 设计参考

参考设计文件中 `travel_guide_full_width_glass_cards/code.html` 的 H5 设计要点：
- `viewport` 设置：`maximum-scale=1.0, user-scalable=no`
- Bottom Nav：`fixed bottom-0 z-50 bg-black`，带 `pb-safe` iPhone 安全区
- 内容区：`h-full w-full overflow-y-auto`
- 玻璃卡片：`glass-card rounded-[12px] p-5 backdrop-blur-xl`

---

## P1 — 组件交互无响应：事件未绑定

### 问题描述

用户反映"组件基本上全部点击都没反应"，已验证的问题：

#### 1. `BuddyDetailModal` 中的按钮（最关键）

`BuddyDetailModal.tsx` 中三个 action 按钮：
```tsx
<button ... onClick={() => handleAction(action.id)}>
  {action.label}
</button>
```

`handleAction` 逻辑：
```tsx
const handleAction = (actionId: string) => {
  if (actionId === 'blind-game') {
    navigate(`/blind-game/${card.profile.buddy_id}/...`);
    return;
  }
  if (actionId === 'wechat') {
    navigate('/messages');
    return;
  }
  onClose();
};
```

→ **问题 1：`navigate` 需要 React Router 支持**，但 Modal 组件中引入了 `useNavigate`，可能因为 `BrowserRouter` 上下文问题在 Modal 中失效。

→ **问题 2：导航到 `/blind-game/:buddyId/:negotiationId` 依赖 `BlindGamePage`**，需确认该页面是否可访问。

#### 2. `BuddiesPage` 中"查看协商摘要"按钮

```tsx
<button ... onClick={() => openCard(buddy.buddy_id, buddy.negotiation_id)}>
```

`openCard` 函数调用 `fetchTwinBuddyBuddyCard`，在 API 404 的情况下会 `.catch()` 并 `setSelectedCard(null)`，所以按钮"无反应"实际上是 API 报错被静默吞掉了。

#### 3. `CommunityPage` 中所有交互按钮

- `handlePublish`：依赖 `createTwinBuddyCommunityPost` → API 404
- `handleLike`：依赖 `likeTwinBuddyCommunityPost` → API 404
- `handleComment`：依赖 `commentTwinBuddyCommunityPost` → API 404
- `handleTwinChat`：依赖 `triggerTwinBuddyCommunityTwinChat` → API 404

**所有按钮事件绑定是正确的**，但因为后端路由 404，前端所有操作静默失败（`catch(() => {})`）。

#### 4. `HomePage` 中建议提问按钮

```tsx
<button onClick={() => setInput(prompt)}>
```

→ 事件绑定正确，但点击后仅填充输入框，不发送。需确认"发送"按钮是否在 API 正常后可用。

### 根因

**P0 的 API 404 是导致"点击无反应"的根本原因**，修复后端路由注册后，大部分按钮应恢复正常。剩余需关注：
- Modal 中 `navigate` 在弹窗上下文中是否正常工作
- `BlindGamePage` 路由参数传递是否正确

---

## P2 — 功能缺失：语音转文字（STT）未集成

### 问题描述

PRD 中要求在用户输入长文本时（尤其是 Tab1 AI 助手聊天框），提供语音输入按钮。参考设计中也包含此功能。

### 当前状态

- 后端 `api/stt_api.py` 存在（讯飞 STT）
- `api/index.py` 中 `app.include_router(stt_router)` 已注册
- 前端目前**没有语音输入 UI 组件**
- `client.ts` 中没有 STT 调用的封装

### 需要实现

| 位置 | 功能 |
|------|------|
| HomePage（Tab1 AI助手） | 聊天输入框旁添加 🎤 按钮 |
| 社区发帖 textarea | 添加语音输入 |
| 私信聊天输入框 | 添加语音输入 |
| 前端 STT 封装 | 调用 `/api/stt/recognize` |

### 集成设计（参考）

```tsx
// HomePage.tsx 聊天输入框区域
<div className="flex items-center gap-3">
  <textarea ... />
  <button
    onClick={() => startVoiceInput((text) => setInput(text))}
    className="btn-icon"
    aria-label="语音输入"
  >
    <Mic className="h-4 w-4" />
  </button>
  <button onClick={handleSend} disabled={...}>
    发送
  </button>
</div>
```

---

## P2 — 设计不完整：缺少 TwinMatchModal 和沉浸式协商流程

### 问题描述

Hackathon 版本中，点击搭子卡片后有完整的**三层展开体验**（Layer1→Layer2→Layer3），包括：
- 数字人协商对话气泡展示
- 红色警告标识（Red Flags Panel）
- 完整的 6 轮盲选游戏入口

当前 V2 的 `BuddyDetailModal` 只是平面展示，缺少：
1. **协商对话气泡展示**（NegotiationThread 组件）
2. **Red Flags / 注意事项面板**
3. **从 Modal → 盲选游戏 → 报告揭晓的完整流程**

### 缺失组件（从 git 历史删除，需重建）

| 组件 | 路径 | 功能 |
|------|------|------|
| `TwinCard.tsx` | `components/twin-card/` | 三层展开主卡片 |
| `NegotiationThread.tsx` | `components/twin-card/` | 协商对话气泡 |
| `RedFlagsPanel.tsx` | `components/twin-card/` | 注意事项面板 |
| `RadarChart.tsx` | `components/twin-card/` | 雷达图 |

---

## 问题汇总优先级矩阵

| 优先级 | 问题 | 预计修复工作量 |
|--------|------|--------------|
| 🔴 P0 | 后端 API 路由 404 | ~2h（排查 + 修复导入链）|
| 🔴 P0 | `RadarChart.tsx` 组件缺失导致编译错误 | ~1h（从 git 恢复 + 修复导入路径）|
| 🟡 P1 | BuddyDetailModal 设计不符合 Hackathon 风格 | ~4h |
| 🟡 P1 | 移动端 H5 适配 | ~4h |
| 🟡 P1 | 组件交互（Modal navigate / 盲选流程）| ~2h |
| 🟠 P2 | 语音转文字（STT）功能缺失 | ~6h |
| 🟠 P2 | TwinCard 三层展开体验缺失 | ~8h |

---

## 快速验证清单

修复前请依次验证：

```bash
# 1. 检查后端路由注册
curl http://localhost:8000/docs
# 确认 Swagger UI 中能看到 /api/profiles、/api/buddies/inbox、/api/posts/feed 等路由

# 2. 测试单个 API
curl -X POST http://localhost:8000/api/profiles \
  -H "Content-Type: application/json" \
  -d '{"mbti":"INFP","travel_range":["同城"],"budget":"经济","self_desc":"测试","city":"深圳"}'

# 3. 检查前端编译
cd twinbuddy/frontend && npm run build 2>&1 | grep -i error

# 4. 检查 RadarChart 导入
grep -r "RadarChart" twinbuddy/frontend/src/
```

---

## 附录：参考设计关键文件

| 文件路径 | 内容说明 |
|---------|---------|
| `D:\...\stitch_chromatic_travel_buddy\...\travel_guide_full_width_glass_cards\code.html` | 玻璃态 Material 3 设计，H5 移动端完整布局 |
| `D:\...\stitch_chromatic_travel_buddy\...\travel_guide_annotations_applied_final\` | 带标注的设计细节 |
| `D:\...\stitch_remix_of_mbti_travel_ui_design\` | 深色户外主题 UI |
| `git main:twinbuddy/frontend/src/components/twin-card/TwinCard.tsx` | 三层展开卡片完整实现 |
| `git main:twinbuddy/frontend/src/components/immersive-feed/TwinMatchModal.tsx` | 全屏协商弹窗 |
| `twinbuddy/frontend/src/index.css` | 已有 `.twin-card-layer1/2/3` CSS，可直接使用 |
