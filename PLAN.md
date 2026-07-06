# TwinBuddy 大区赛实施计划 v2

> v2 修订依据：三位 subagent 评审（黑客松评委 / 最强 PM / 商业化专家）的批判。
> v1 关键错误：三套基座（React 22 页 + Vue 抖音开源 + PRD 范式）未冻结、行动卡 PRD §5.2 10 项未实现、6 场景平铺导致 demo 浅、商业化故事不清晰。
> v2 重构原则：**A1 + B1 + C2** —— Vue 抖音基座 / 图片+大字幕 / 旅行+美食双深+4 卡片。

---

## 0. 当前分支与基座（已冻结）

- 当前分支：`codex/project-structure-cleanup`
- **基座**：Vue 抖音开源前端基座（`twinbuddy/frontend/` 下的 Vue 代码）
  - 视频格式基线：`twinbuddy/frontend/node/post/*.json` 中单文件结构
  - 视频最小字段：`aweme_id / desc / create_time / music{title,author,play_url} / video{play_addr{url_list},cover{url_list},duration,width,height} / share_url / statistics{...} / duration`
  - 用户最小字段：`uid / nickname / signature / avatar_168x168{url_list[0]} / avatar_300x300{url_list[0]} / follower_count / following_count / total_favorited / aweme_count / gender / province / city`
- 处理脚本：`node/post/process-post.js` + `node/process-post-list.js`
- **冻结 React 端**：twinbuddy/frontend 的 React 22 个 v2 页面（HomePage/BuddiesPage/BlindGamePage/CommunityPage/MessagesPage/ProfilePage/OnboardingV2Page）**本次不再维护**。代码保留，但不写新功能。

---

## 1. 三大基线决策（已敲定）

### A. 基座 = Vue 抖音开源（**冻结 A1**）
- 全部前端用 Vue（Vue 3 + Vite + Less + Vant）写
- 不再新增 React 组件
- 第一屏必须是全屏纵向 Feed（`Slide0.vue` 改造为黄金顺序）

### B. 视频素材 = 图片+大字幕卡片（**冻结 B1**）
- 评审指出：13 条 sample MP4（BigBuckBunny/Sintel…）一眼出戏
- PRD §10.5 明确允许"图片封面+标题模拟"
- 数据字段保留 `video.play_addr.url_list`，但 URL 指向一张静态大字幕图
- 缩略图继续用 picsum.photos 公开 CDN

### C. 场景策略 = 1.5 深 + 4 卡片（**冻结 C2**）
- **旅行**：完整闭环（路线+预算+搭子+协商+邀约+承接）
- **美食**：半深闭环（店铺+预算+搭子+邀约），第二 demo 演示点
- **健身 / 学习 / 活动 / 购物**：只做行动卡形态 + 文案变体

---

## 2. 任务重排（评审反馈整合后）

### 2.1 视频采集（每场景 ≥50 条，但质量优先）

| ID | 场景 | 类型 | 状态 |
|---|---|---|---|
| V1 | 旅行 | **重做**：30 UGC 情绪型 + 20 攻略型 + 3 反 AI 干扰 | [ ] |
| V2 | 美食 | 探店 + 决策型（半深场景，重视频） | [ ] |
| V3 | 健身 | 训练 + 计划型 | [ ] |
| V4 | 学习 | AI/编程 + 路线型 | [ ] |
| V5 | 活动 | 演唱会/展览/漫展型 | [ ] |
| V6 | 购物 | 穿搭/数码 + 决策型 | [ ] |
| V7 | 普通干扰内容 | 搞笑/生活/宠物/情绪文案（评审说**干扰项必须够多**） | [ ] |

每个场景产出：
- `node/post/<scene>-seed.json` ≥50 条
- `node/data/video-catalog.ts` 导出场景→视频映射
- `node/post/<scene>-verify.mjs` 验证脚本

### 2.2 mock 用户（评审：30 够用，不要 100）

| ID | 内容 |
|---|---|
| P1 | **30 个 mock 用户**（覆盖 6 场景，故意设计冲突点） |
| P2 | ~~扩到 100 个~~ **砍掉** |
| P3 | ~~30 个真实问卷人设~~ **砍掉**（现场做 1 张占位即可） |

落地：
- `mock_personas/users.json`（30 个）
- `mock_personas/scene-mapping.json`（人设 → 适合场景 + 冲突点）

### 2.3 行动卡文案（按 PM 评审要求加截止感/信任锚）

| ID | 场景 | 深度 | 状态 |
|---|---|---|---|
| A1 | 旅行行动卡 | **深** | [ ] |
| A2 | 美食行动卡 | **半深** | [ ] |
| A3 | 健身行动卡 | 卡片 | [ ] |
| A4 | 学习行动卡 | 卡片 | [ ] |
| A5 | 演唱会/活动行动卡 | 卡片 | [ ] |
| A6 | 购物行动卡 | 卡片 | [ ] |

落地：`docs/action-cards.md`，每张卡 10 项（PRD §5.2）：
1. 标题（带**截止感**：本周六、还剩 2 个名额）
2. 触发原因（带**信任锚**：距离 800 米、不用排队）
3. 行动意图
4. 行动方案（时间/地点/预算/路线）
5. 是否需要搭子
6. 推荐人选（A/B/C 三种倾向）
7. AI 分身协商结果（**结构化摘要**，非聊天记录）
8. 风险提示
9. 下一步按钮（含 **"只要计划，不要搭子"**、"换一个人"、"抑制这类"）
10. 后续承接（路线/团购/票务/课程）

### 2.4 Frontend 组件（Vue 基座，按评审 CRITICAL 排序）

| ID | 组件 | 优先级 | 状态 |
|---|---|---|---|
| **F0** | 重构 Home Feed（黄金 8+轻提示+2+卡+4+卡+邀约） | **P0** | [ ] |
| **F1** | `ActionCard.vue` 通用行动卡（10 项齐全 + 4 种状态：轻提示/行动方案/搭子协商/推进完成） | **P0** | [ ] |
| **F2** | `ActionCardDetail.vue` 卡片详情页 | P0 | [ ] |
| **F3** | `AiTwinNegotiation.vue` 协商页（**1 个关键瞬间 + 三段结构化**，非聊天记录） | P0 | [ ] |
| **F4** | `OneClickInvite.vue` 一键邀约（**真人语气 + AA 信任锚**） | P0 | [ ] |
| F5 | `RiskAlerts.vue` 风险提示 | P1 | [ ] |
| F6 | `ActionBox.vue` 行动箱 | P1 | [ ] |
| F7 | `OnboardingSurvey.vue` 30 秒问卷 | P2（**首次打开不弹**，刷 10 条后才触发） | [ ] |
| F8 | `TwinMaturity.vue` Twin 成熟度角标 | P2（**轻量**放卡片右上角） | [ ] |
| ~~F9~~ | ~~场景人格卡~~ | **砍掉**（PM 评审判伪需求） | - |

### 2.5 行动卡降权机制（PM 评审新增）

| ID | 内容 |
|---|---|
| D1 | `feed-dampener.ts`：用户连续 N 次不点行动卡 → 触发原因软化 / 标题改疑问式 / 本场景冻结 24h |

### 2.6 时间感知（PM 评审新增）

| ID | 内容 |
|---|---|
| T1 | `time-aware-card.ts`：行动卡标题根据当前时间切换（午/晚/周末），美食卡永远 "今晚 7 点附近" |

### 2.7 安全 / 收尾（路演口播，不上 UI）

| ID | 内容 |
|---|---|
| S1 | `docs/safety.md` 安全原则 + 上线 checklist |

---

## 3. 总执行顺序（每次做完一次 commit + 一次对抗性审查）

> 评审说要**先做行动卡，再做视频**。视频不是 demo 翻车的根因。

```
[1] PLAN.md v2（本文件）                            → commit V0
[2] V1 重做旅行视频（30+20+3）                      → commit V1
[3] A1 旅行行动卡文案（深闭环）                     → commit V2
[4] F1 ActionCard.vue 通用组件                      → commit V3
[5] F0 重构 Home Feed 黄金顺序                      → commit V4
[6] F2 ActionCardDetail.vue                         → commit V5
[7] F3 AiTwinNegotiation.vue（1 关键瞬间 + 三段）    → commit V6
[8] F4 OneClickInvite.vue（真人语气）               → commit V7
[9] P1 30 个 mock 用户                              → commit V8
[10] V2 美食视频 + A2 美食行动卡（半深）            → commit V9
[11] V3-V6 其他 4 场景视频（每场景 ≥50）             → commit V10-V13
[12] A3-A6 其他 4 张行动卡文案                       → commit V14
[13] F5-F6 风险提示 + 行动箱                         → commit V15
[14] F7 30 秒问卷（前置条件：刷 10 条）              → commit V16
[15] F8 Twin 成熟度角标（轻量放右上）                → commit V17
[16] D1 行动卡降权机制                                → commit V18
[17] T1 时间感知                                       → commit V19
[18] S1 安全 checklist（路演口播）                    → commit V20
```

每次 commit message 模板：
```
<type>(scope): <中文简述，最多 40 字>

- 改动 1
- 改动 2
- 验证：...
```

类型：`feat` `fix` `chore` `docs` `refactor` `test`。

---

## 4. 对抗性审查模板（每个 commit 前必跑）

`senior-dev` agent 跑：
1. 改动是否在 slice 边界内（**Surgical Changes**）
2. 无 console.log / 硬编码 / 静默 catch
3. 无新增大文件（< 800 行）
4. 视频数据完整性（每场景 ≥ 50 条，UGC 占比 ≥ 60%，反 AI 干扰 ≥ 3 条）
5. 行动卡 PRD §5.2 10 项齐全
6. mock 用户冲突点是否足够（早起 vs 不早起、高预算 vs 低预算、爱拍照 vs 不爱拍照、计划型 vs 随性型、社牛 vs 慢热）
7. 没有动冻结的 React 端代码
8. 没有动比赛无关的代码（**never refactor not broken**）

发现 1 个以上 CRITICAL/HIGH → 暂停用户确认。

---

## 5. 反向决策记录（被砍掉的需求）

| 功能 | 砍掉理由 | 出处 |
|---|---|---|
| 100 个 mock 用户 | 30 够用，再多拖慢 demo 节奏 | PM |
| Twin 成熟度分级 | 用户感知不到，反像会员等级 | PM |
| 30 秒问卷首开触发 | 用户没建立信任前推问卷会穿帮 | PM |
| 好友匹配度分享卡 | 小红书式裂变，跟"行动推进"无关 | PM |
| 场景人格卡 | MBTI 套皮，路演秒变"又一个小测试" | PM |
| 情绪陪伴/生活整理场景 | 跟核心"行动推进"调性冲突 | PM |
| 行动箱（独立页） | 不算功能亮点，只放 tab | PM |
| 安全 UI 模块 | 路演口播，不上 UI | PM |
| 13 条 sample MP4 凑数 | BigBuckBunny/Sintel 一眼穿帮 | 评委 |
| 6 场景平均做深 | 1 深 + 5 宽 > 6 浅 | 评委 |

---

## 6. 商业化叙事（路演时备用，**不写进 demo UI**）

评委结束前抛的钩子（一句话商业故事）：
> "抖音把'看见'做到了 1.0——让你刷到喜欢的内容。我们做的是 2.0——**让内容变成行动**。如果抖音是让用户多停留 30 秒，那我们是**让用户多消费 30 块钱**；这条'消费增量'，是任何平台、任何商家都愿意付费分润的。"

非显然商业化思路：
> "TwinBuddy 真正的对手不是 Soulmate AI，**是 ChatGPT + 美团 + 携程 + 浏览器收藏夹**。你今天从'想去看周杰伦演唱会'推进到'我已经坐到第 5 排了'，要打开 6 个 App。我们让这件事在 1 个动作、1 次 AI 对话里完成——这是 20 亿月活的内容平台早晚要自建的能力，而我们要做的是第一个中立、可嵌入、不被任何平台消灭的版本。"

核心引擎排序（商业化评分）：
1. **美食** 9（本地生活 CPS 5–10% 返佣，决策 30 分钟）
2. **演唱会/活动** 8（大麦/票星球 5–8% 返佣，决策 1–7 天）
3. **旅行** 8（携程返佣 3–6%，决策 3–15 天；demo 主但不是变现主力）
4. **健身** 5（场馆 CPS 8–15%，归因不清）
5. **学习** 4（B2B 教育 SaaS 是真钱，PRD 没写）
6. **购物** 3（抖音已经把商品卡做到极致，弱化）