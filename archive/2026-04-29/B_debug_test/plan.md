# TwinBuddy 前端重构计划：适配 Synapse Kinetic 设计系统

## Context

当前 TwinBuddy 前端（`twinbuddy/frontend/`）已部分迁移到 MD3 Tailwind 主题，通过详细对比分析（参考 `zip/src/` vs 现有生产代码）发现：

- `TopNav`、`BottomNav`、`AppLayout` — **已完全对齐**，无需修改
- `index.css`、`tailwind.config.ts` — 基础层基本对齐，少数 token 差异
- `HomePage` — BuddyCard border/shadow/badges 样式不一致
- `CommunityPage` — 缺少图片网格、FAB、PostCard 样式不一致
- `MessagesPage` — 缺少搜索栏、在线状态指示器
- `ProfilePage`、`OnboardingV2Page` — **完全不同的设计系统**（暗色玻璃态 vs 白色 Neo-Brutalist）
- `BlindGamePage` — 布局方式不同（参考是全屏 Modal，当前是页面布局）

目标：逐页面改造，对齐 `zip` 参考的 Synapse Kinetic 设计风格。

---

## 设计系统：Synapse Kinetic

**核心风格**：Neo-Brutalism + Clean-Tech
- 高对比度黑白 + 薄荷绿 `#24695c` + 粉色 `#ffd8e6`
- 硬阴影：`4px 4px 0 0 #000`（选中态）
- 软阴影：`0 8px 30px rgba(0,0,0,0.04)`（卡片默认态）
- 圆角：`1rem`（DEFAULT）、`0.5rem`（sm）
- 字体：Space Grotesk（标题）/ Inter（正文）/ Newsreader（问题展示）

---

## Skill 使用计划

| 阶段 | Skill | 用途 |
|------|-------|------|
| 开始前 | `tdd-guide` | 建立 TDD + 视觉回归工作流 |
| 阶段 1 | `playwright` | 为每个页面建立视觉回归测试基线（截图对比） |
| 阶段 1 | `build-fix` | 每次修改后运行 TypeScript 检查 |
| 阶段 2 | `frontend-dev` | 逐组件改造 Tailwind className |
| 阶段 3 | `frontend-ui-ux` | 复杂页面（Profile/Onboarding/BlindGame）重设计 |
| 阶段 4 | `code-review` | 全部完成后统一 code review |
| 收尾 | `simplify` | 代码简化，检查重复和可复用性 |

---

## TDD + 视觉回归工作流

```
┌─────────────────────────────────────────────────────────────┐
│                  TDD + 视觉回归流程                          │
├─────────────────────────────────────────────────────────────┤
│  1. RED  → Playwright 截参考图（zip dev server）作为基线   │
│  2. 改写 → 修改 Tailwind className 对齐参考                │
│  3. GREEN → Playwright 截图 + diff，自动化对比              │
│  4. 人工 → 确认视觉效果无误                                │
│  5. 提交 → git commit + diff 说明                         │
└─────────────────────────────────────────────────────────────┘
```

**说明**：UI 重构无法用传统 TDD 函数测试，用 Playwright 视觉回归替代。

---

## 详细 Gap 分析

### ✅ 已对齐（无需修改）

| 组件/文件 | 状态 |
|-----------|------|
| `TopNav.tsx` | pixel-perfect 一致 |
| `BottomNav.tsx` | pixel-perfect 一致 |
| `AppLayout.tsx` | pixel-perfect 一致 |
| `index.css` 工具类 | 完全一致 |
| 基础颜色 token | 完全一致 |

### 🔧 需微调（P1）

| 文件 | Gap | 修复方式 |
|------|-----|---------|
| `frontend/index.html` | Material Symbols 字体缺少 `GRAD` 轴和完整 `opsz` 范围 | 修改 Google Fonts link |
| `tailwind.config.ts` | `fontSize` 缺少 `letterSpacing`/`fontWeight`（h1/h2/label-caps） | 补全 token |
| `HomePage.tsx` | BuddyCard 用 `border-primary shadow-[4px_4px_0px_0px_#000]`，参考用 `border-outline-variant shadow-[0_8px_30px...]` | 改 className |
| `HomePage.tsx` | Match badge 用 `bg-tertiary-container`，参考用 `bg-primary-container` | 改 className |
| `HomePage.tsx` | 缺少 tags（secondary-container pill） | 添加 |
| `HomePage.tsx` | AI chat 输入框用 hard shadow，参考用 soft shadow | 改 className |

### 🔨 需重构（P2）

| 页面 | Gap | 修复方式 |
|------|-----|---------|
| `CommunityPage.tsx` | PostCard 用 `brutalist-card-inactive`，参考用 `border-2 border-outline shadow-[0_8px_30px...]` | 改 className |
| `CommunityPage.tsx` | 缺少 2 列 `aspect-square` 图片网格 | 添加 ImageGrid |
| `CommunityPage.tsx` | 缺少 FAB（右下角固定按钮） | 添加 FAB |
| `CommunityPage.tsx` | 缺少 loading spinner（refresh icon animate-spin） | 添加 |
| `CommunityPage.tsx` | Avatar `rounded-2xl`，参考 `rounded-full border-2 border-outline` | 改 className |
| `CommunityPage.tsx` | MBTI badge 用 inline CSS variable，参考用 `bg-tertiary-fixed` | 改 className |
| `MessagesPage.tsx` | 缺少 neo-brutalist 搜索栏 | 添加 |
| `MessagesPage.tsx` | 缺少在线状态指示器 | 添加 |
| `MessagesPage.tsx` | 卡片阴影/边框与参考不一致 | 改 className |
| `MessagesPage.tsx` | 缺少 unread badge 样式（secondary 背景） | 改 className |

### 🔥 需重写设计语言（P3）

| 页面 | 当前风格 | 参考风格 | 说明 |
|------|---------|---------|------|
| `ProfilePage.tsx` | 暗色玻璃态（glass-panel-strong, rgba 绿, text-white） | 白色 Neo-Brutalist | 完全重写 |
| `OnboardingV2Page.tsx` | 暗色霓虹风（neon green border, dark bg） | 白色 Neo-Brutalist | 完全重写 |
| `BlindGamePage.tsx` | 页面布局 + Lucide 图标 + Space Grotesk | 全屏 Modal + Material Symbols + Newsreader | 布局 + 样式重写 |

---

## 实施计划（5 阶段）

### 阶段 1：配置对齐 + 视觉回归基线

**TDD RED — 建立视觉基线**
- 用 `playwright` skill 为 7 个页面截图（截取 `zip` dev server 作为参考基线）
- 保存到 `frontend/e2e/screenshots/baseline/`

**1.1 修复 `frontend/index.html`**
```
修改前：FILL@100..700,0..1
修改后：FILL,GRAD,opsz@100..700,0..1,-50..200,20..48
```

**1.2 修复 `tailwind.config.ts`**
- `fontSize.h1`：补 `letterSpacing: -0.04em`、`fontWeight: 700`
- `fontSize.h2`：补 `letterSpacing: -0.02em`、`fontWeight: 600`
- `fontSize.label-caps`：补 `letterSpacing: 0.1em`、`fontWeight: 700`

**验证**：`npm run build` 无错误 → commit

---

### 阶段 2：HomePage + CommunityPage

**TDD GREEN — 逐 className 对齐**

**HomePage.tsx 关键修改**
- BuddyCard：`border-primary shadow-[4px_4px...]` → `border-outline-variant shadow-[0_8px_30px...]`
- Match badge：`bg-tertiary-container` → `bg-primary-container`
- 添加 secondary-container pill tags
- AI 输入框：hard shadow → soft shadow

**CommunityPage.tsx 关键修改**
- PostCard：去掉 `brutalist-card-inactive`，改用 `border-2 border-outline shadow-[0_8px_30px...]`
- Avatar：`rounded-2xl` → `rounded-full border-2 border-outline`
- MBTI badge：inline CSS → `bg-tertiary-fixed text-on-tertiary-fixed border-2 border-outline-variant`
- 添加 2 列 `aspect-square` ImageGrid
- 添加右下角 FAB：`fixed bottom-[100px] right-6`
- 添加 loading spinner（refresh icon + animate-spin）

**参考文件**
- `ui_reference/stitch_pixel_perfect_ui_replicator/home/code.html`
- `ui_reference/stitch_pixel_perfect_ui_replicator/community/code.html`
- `ui_reference/zip/src/pages/Home.tsx`
- `ui_reference/zip/src/pages/Community.tsx`

**验证**：截图对比 → commit

---

### 阶段 3：MessagesPage

**关键修改**
- 添加 Neo-Brutalist 搜索栏：`border-2 border-primary rounded-full shadow-[0_4px_0_0_#000]`
- 添加在线状态指示器：`w-4 h-4 bg-secondary rounded-full border-2 border-surface-container-lowest`
- 未读卡片：`bg-surface-container-lowest border-2 border-primary shadow-[0_4px_0_0_#000]`
- 已读卡片：`bg-surface-container-low border-2 border-transparent`
- Unread badge：`bg-secondary text-on-secondary rounded-full border-2 border-primary`

**参考文件**
- `ui_reference/stitch_pixel_perfect_ui_replicator/messages/code.html`
- `ui_reference/zip/src/pages/Messages.tsx`

**验证**：截图对比 → commit

---

### 阶段 4：重设计语言（Profile + Onboarding + BlindGame）

> 三个最大工作量页面，调用 `frontend-ui-ux` skill 辅助设计决策

**ProfilePage.tsx**
- 背景：`bg-[var(--color-bg-base)]` → `bg-background`
- 头像：`rounded-3xl bg-[rgba(74,222,128,0.12)]` → `rounded-full border-4 border-primary shadow-[4px_4px_0_0_#000]`
- 姓名：`text-white text-2xl` → `text-on-background font-h1 text-[48px]`
- MBTI badge：`mbti-badge` CSS variable → `bg-secondary text-on-secondary border-2 border-primary`
- MING 区块：`glass-panel-strong` → `brutalist-card-inactive border-2 border-primary`
- 进度条：添加 `border border-outline`
- 退出按钮：`btn-primary` → `bg-primary text-on-primary rounded-full w-full`
- 所有文字：`text-white` → `text-on-background`

**OnboardingV2Page.tsx**
- 背景：`bg-[var(--color-bg-base)]` → `bg-background`
- Option cards：neon green border → `brutalist-card-active/inactive`
- 图标：Lucide → Material Symbols
- 底部区域：`bg-background/90 backdrop-blur-xl border-t-2 border-outline-variant/30`

**BlindGamePage.tsx**
- 外层：页面布局 → 全屏 Modal：`fixed inset-0 z-50 bg-background`
- 问题文字：`font-h1 text-[32px]` → `font-question-serif text-[36px]`
- 图标：Lucide → Material Symbols
- 添加装饰 blobs：`bg-primary/5 bg-secondary/5 blur-2xl`
- 选项卡片：改为 Neo-Brutalist 风格

**验证**：截图对比 → commit

---

### 阶段 5：Code Review + Simplify

- 调用 `code-review` skill 审查所有改动
- 调用 `simplify` skill 检查重复 className，提取为公共组件
- 最终 `npm run build` + Playwright 全量测试
- 清理无用代码，提交最终 commit

---

## 关键参考文件

### 参考实现（只读）
| 文件 | 用途 |
|------|------|
| `ui_reference/zip/src/index.css` | 最完整 CSS token 参考 |
| `ui_reference/zip/src/pages/*.tsx` | React 实现参考 |
| `ui_reference/stitch_pixel_perfect_ui_replicator/*/code.html` | HTML 视觉原型（可直接浏览器打开）|

### 需要修改
| 文件 | 修改内容 |
|------|---------|
| `twinbuddy/frontend/index.html` | Material Symbols 字体 |
| `twinbuddy/frontend/tailwind.config.ts` | fontSize token |
| `twinbuddy/frontend/src/pages/v2/HomePage.tsx` | BuddyCard、match badge、chat input |
| `twinbuddy/frontend/src/pages/v2/CommunityPage.tsx` | PostCard、FAB、ImageGrid |
| `twinbuddy/frontend/src/pages/v2/MessagesPage.tsx` | 搜索栏、在线状态、卡片样式 |
| `twinbuddy/frontend/src/pages/v2/ProfilePage.tsx` | 全重写设计语言 |
| `twinbuddy/frontend/src/pages/v2/OnboardingV2Page.tsx` | 全重写设计语言 |
| `twinbuddy/frontend/src/pages/v2/BlindGamePage.tsx` | 全屏 Modal + 样式重写 |

---

## 验证方式

1. **视觉基线对比**：Playwright 截图 `zip` dev server → 保存为基线 → 对比重构后页面
2. **类型检查**：`npx tsc --noEmit` 无错误
3. **构建验证**：`npm run build` 无错误
4. **Playwright E2E**：运行 `npx playwright test` 确保功能正常
5. **人工验收**：逐页面截图与参考 `code.html` 对比

---

## 建议实施顺序

```
阶段1（配置对齐 + 建立基线）
  ↓
阶段2（HomePage + CommunityPage）  ← 先做高频页面，积累经验
  ↓
阶段3（MessagesPage）
  ↓
阶段4（Profile + Onboarding + BlindGame）  ← 设计语言重写，用 frontend-ui-ux skill
  ↓
阶段5（Code Review + Simplify）
```
