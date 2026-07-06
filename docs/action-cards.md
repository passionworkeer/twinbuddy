# TwinBuddy 懂你行动卡文案库

> 依据：PRD1 §5.2（卡片 10 项结构）+ PRD2 §6 + PM 评审（截止感/信任锚/可推动时间）
> 用法：每张卡的字段对应前端 `ActionCard.vue` 的 10 个 props
> **拒绝品牌自指句**："路线可以按 TwinBuddy 这版走"是反模式，**不能出现**

---

## 0. 通用字段命名约定

| 字段 | 含义 | 写作要求 |
|---|---|---|
| `title` | 一句话标题 | ≤ 25 字，必须有"截止感"或"信任锚" |
| `trigger_reason` | 触发原因 | 引用最近观看的视频数量 + 时间 + 预算标签 |
| `intent` | 行动意图 | 动词开头（去/吃/练/买） |
| `plan` | 行动计划 | 时间 + 地点 + 预算 + 路线/动作 |
| `needs_buddy` | 是否需要搭子 | 'required' / 'optional' / 'none' |
| `candidates` | 推荐人选 | 3 个：A=最匹配 / B=最互补 / C=最有意思 |
| `negotiation_summary` | AI 协商摘要 | 已达成 / 待确认 / 风险 三段 |
| `risks` | 风险提示 | 2-3 个具体点 |
| `next_actions` | 下一步按钮数组 | 5-7 个，含"只要计划不要搭子"/"换一个"/"抑制这类" |
| `follow_up` | 后续承接 | 团购/票务/路线/工具 链接 |

---

## 1. A1 旅行行动卡（主 demo · 深闭环）

### 卡片 #1｜深圳周边游（大鹏半日游）

| 字段 | 内容 |
|---|---|
| `title` | 你最近好像想找个轻松的周末短途旅行 |
| `trigger_reason` | 基于你最近看的 4 条深圳周边游 + 周末空闲 + 预算 150-250 元 |
| `intent` | 去深圳周边度个轻松的周末 |
| `plan` | 周六 14:00 出发大鹏半日游，海边散步 + 咖啡 + 拍照，预算 150-200 元 |
| `needs_buddy` | 'optional' |
| `candidates` | A 路数互：同预算 + 同节奏（150-200 元，不赶景点） · B 互补：会做攻略，预算 200-250 · C 探索：兴趣相似但要早出发 |
| `negotiation_summary` | **已达成**：都接受大鹏、时间 14:00 后、不特种兵、首次见面地铁口见 · **待确认**：A 希望多拍照 / B 想先去咖啡 · **风险**：对方节奏略有差异，需要提前同步 |
| `risks` | ①对方偏拍照你偏散步，提前确认节奏 ②返程别太晚，建议 19:00 前 |
| `next_actions` | 一键生成邀约 · 换一个搭子 · 只要计划不要人 · 换一个方案 · 收藏行动 · 暂时不要 |
| `follow_up` | 查看路线 · 查看附近餐饮 · 查看住宿 · 查看攻略 · 复制邀约文案 |

### 卡片 #2｜短途城际（顺德/惠州）

| 字段 | 内容 |
|---|---|
| `title` | 收藏的 3 条顺德/惠州短途视频里，我替你筛了周末能去的 |
| `trigger_reason` | 基于你最近看的 2 条顺德美食 + 1 条惠州海边 |
| `intent` | 跟一个朋友去吃顿好的 |
| `plan` | 周日出发顺德一日游，老店 + 甜品 + 河畔，预算 250-350 元 |
| `needs_buddy` | 'required' |
| `candidates` | A 口味匹配：能吃辣 + 爱早茶 · B 节奏互：愿意早上 9 点出发 · C 安全敏：必须公开场所 |
| `negotiation_summary` | **已达成**：口味相近、AA 共识、地铁接驳 · **待确认**：对方对甜品兴趣一般 · **风险**：顺德当天太热，建议带水 |
| `risks` | ①对方想去新店你想去老店 ②周末自驾易堵 |
| `next_actions` | 一键生成邀约 · 换一个搭子 · 查看交通 · 收藏 · 暂时不要 |
| `follow_up` | 路线地图 · 老店点评 · 附近景点 · 复制邀约文案 |

### 卡片 #3｜咖啡探店 citywalk（弱搭子 / 可单人）

| 字段 | 内容 |
|---|---|
| `title` | 华强北 + 蛇口 3 家独立咖啡，我给你排了路线 |
| `trigger_reason` | 基于你最近看的 2 条城市漫游 + 1 条咖啡探店 |
| `intent` | 自己慢悠悠喝 3 杯咖啡 |
| `plan` | 周六下午 13:00-18:00，3 家咖啡，单杯 25-40 元，预算 120 元 |
| `needs_buddy` | 'none' |
| `negotiation_summary` | **N/A**（单人场景，无协商）|
| `risks` | ①周末热门店排队 ②中途需要换乘 |
| `next_actions` | 收藏路线 · 查看具体店铺 · 修改路线 · 找搭子一起 · 暂时不要 |
| `follow_up` | 店铺地图 · 营业时间 · 评价 · 复制到日历 |

---

## 2. A2 美食行动卡（半深 · 第二 demo）

### 卡片 #1｜今晚饭局

| 字段 | 内容 |
|---|---|
| `title` | 你收藏了 3 家日料店，鮨·初今晚 19:30 不用排队 |
| `trigger_reason` | 基于你最近看过 2 条日料 + 1 条日料探店 + 当前是工作日 18:00 |
| `intent` | 今晚找个人一起去吃 |
| `plan` | 19:30 到店，人均 110 元，预算 130 元（含小费） |
| `needs_buddy` | 'optional' |
| `candidates` | A 预算匹配：人均 ≤ 130 · B 口味互：能吃生食 · C 时间对：今晚 19 点有空 |
| `negotiation_summary` | **已达成**：预算 ±20 元 AA、口味（不辣+生食）、时间 19:00-19:30 · **待确认**：对方从不带酒 · **风险**：日料生食过敏需要备注 |
| `risks` | ①对方不能吃生食需改烤物 ②周末排号翻倍 |
| `next_actions` | 一键生成邀约 · 换一个搭子 · 只收藏店铺 · 换一家 · 抑制此类 |
| `follow_up` | 团购券 · 在线排号 · 查看菜单 · 复制邀约 |

### 卡片 #2｜早茶周末

| 字段 | 内容 |
|---|---|
| `title` | 周末早茶｜罗湖这 3 家本地人都去 |
| `trigger_reason` | 基于你最近 1 条早茶视频 + 周末空闲 |
| `intent` | 周六/周日早茶轻松约一顿 |
| `plan` | 周六 9:30 出发，自带虾饺/凤爪，人均 80 元 |
| `needs_buddy` | 'optional' |
| `candidates` | A 早茶档：能 9 点准时到 · B 口味档：能吃虾/凤爪 · C 距离档：罗湖本地 |
| `negotiation_summary` | 早茶口味达成、AA；待确认搭子档期 |
| `risks` | 周末 9:30 前排队人多 |
| `next_actions` | 一键邀约 · 换搭子 · 查看菜单 · 抑制 |
| `follow_up` | 团购 · 点评 · 路线 · 复制邀约 |

### 卡片 #3｜工作日午餐（弱搭子 / 单人）

| 字段 | 内容 |
|---|---|
| `title` | 你公司楼下 5 家适合一人吃的店 |
| `trigger_reason` | 基于当前位置 + 工作日中午 12:00 |
| `intent` | 自己快速吃好 |
| `plan` | 12:00-12:40，人均 30-50 元 |
| `needs_buddy` | 'none' |
| `negotiation_summary` | N/A |
| `risks` | 午餐高峰排队 |
| `next_actions` | 查看店铺 · 收藏 · 找搭子 · 抑制 |
| `follow_up` | 高德地图 · 团购券 · 菜单 |

---

## 3. A3 健身行动卡（卡片形态）

### 卡片 #1｜肩背训练计划

| 字段 | 内容 |
|---|---|
| `title` | 你最近看了很多肩背训练内容，14 天低门槛计划给你 |
| `trigger_reason` | 基于你最近 3 条肩背训练视频 + 1 条瑜伽拉伸 |
| `intent` | 启动一个 14 天训练计划 |
| `plan` | 14 天 × 每次 30 分钟，强度低（无器械），隔天练 |
| `needs_buddy` | 'optional' |
| `candidates` | A 同水平打卡搭子 · B 同时间段 · C 不需要，纯自己来 |
| `negotiation_summary` | **已达成**：每日 30 分钟 · **待确认**：器械 vs 无器械 · **风险**：动作不规范可能伤肩 |
| `risks` | ①强度差异 ②器械 vs 无器械 ③坚持不下来概率高 |
| `next_actions` | 开始计划 · 找打卡搭子 · 调整强度 · 抑制此类 |
| `follow_up` | 训练日历 · 动作视频 · 复盘模板 |

### 卡片 #2｜周末跑步

| 字段 | 内容 |
|---|---|
| `title` | 深圳湾夜跑路线 + 1 个跑步搭子 |
| `trigger_reason` | 基于你最近 2 条跑步视频 + 周末空闲 |
| `intent` | 跑 5 公里 |
| `plan` | 周六 19:00 深圳湾，5 公里，预算 0 |
| `needs_buddy` | 'optional' |
| `negotiation_summary` | 配速 ±30 秒 / 公里、夜跑安全 |
| `risks` | ①夜跑返程 ②配速差异 |
| `next_actions` | 找搭子 · 自己跑 · 收藏路线 |
| `follow_up` | 路线地图 · 配速记录 · 跑团加入 |

---

## 4. A4 学习行动卡（卡片形态）

### 卡片 #1｜AI Agent 7 天计划

| 字段 | 内容 |
|---|---|
| `title` | 你最近在看 AI Agent，我给你生成了 7 天路线 |
| `trigger_reason` | 基于你最近 2 条 AI Agent 视频 + 1 条 prompt engineering |
| `intent` | 7 天入门 AI Agent |
| `plan` | 7 天 × 每天 1 小时，含读论文 + 写代码 + 复盘 |
| `needs_buddy` | 'optional' |
| `candidates` | A 同方向学习 · B 论文阅读搭子 · C 编程讨论 |
| `negotiation_summary` | **已达成**：每日 1 小时 · **待确认**：是否要求输出项目 |
| `risks` | ①基础差异大 ②打卡坚持度 |
| `next_actions` | 开始 7 天 · 找学习搭子 · 查看资料 · 调整难度 |
| `follow_up` | 学习日历 · 资料包 · 笔记模板 |

### 卡片 #2｜考研复习 90 天

| 字段 | 内容 |
|---|---|
| `title` | 考研还剩 X 天，每天 3 小时计划 |
| `trigger_reason` | 基于你收藏的 2 条考研视频 |
| `intent` | 系统化复习 |
| `plan` | 90 天 × 每日 3 小时，分公共课/专业课 |
| `needs_buddy` | 'optional' |
| `negotiation_summary` | 早 8 点打卡 / 晚复盘 |
| `risks` | ①时间不足 ②注意力分散 |
| `next_actions` | 开始计划 · 加入打卡群 · 调整 |
| `follow_up` | 复习进度表 · 自习室地图 · 资料包 |

---

## 5. A5 演唱会/活动行动卡（卡片形态）

### 卡片 #1｜周杰伦演唱会同城同行人

| 字段 | 内容 |
|---|---|
| `title` | 你看了 8 条周杰伦视频，8 月深圳站还剩少量票 |
| `trigger_reason` | 基于你最近 8 条周杰伦视频 + 8 月空闲 |
| `intent` | 抢票 + 找个同行人 |
| `plan` | 大麦 8/15 12:00 抢票，找一个同城同预算同行人 |
| `needs_buddy` | 'required' |
| `candidates` | A 同购票区段 · B 同返程安排 · C 同好但预算略高 |
| `negotiation_summary` | **已达成**：都接受 18 排以后、愿意地铁返程 · **待确认**：是否一起吃饭 · **风险**：8 月返程可能晚 |
| `risks` | ①票被黄牛炒 ②散场打车难 |
| `next_actions` | 抢票 · 找同行人 · 查看交通 · 抑制 |
| `follow_up` | 大麦 · 高德 · 美食推荐 · 复制同行邀约 |

### 卡片 #2｜周末展览

| 字段 | 内容 |
|---|---|
| `title` | 深圳这个周末 5 个免费展览，3 个适合你 |
| `trigger_reason` | 基于你最近 1 条展览视频 |
| `intent` | 周六/日看个展 |
| `plan` | 周六下午 14:00，单个展 1.5-2 小时，预算 ≤ 50 元 |
| `needs_buddy` | 'none' |
| `risks` | 周末热门展厅人多 |
| `next_actions` | 选 1 个 · 收藏 · 找搭子 · 抑制 |
| `follow_up` | 展厅地图 · 票价 · 营业时间 |

---

## 6. A6 购物行动卡（卡片形态 · 弱化）

### 卡片 #1｜通勤背包决策

| 字段 | 内容 |
|---|---|
| `title` | 你最近收藏了 3 个通勤背包，我帮你按预算筛了 3 个 |
| `trigger_reason` | 基于你最近 4 条通勤/穿搭/背包视频 |
| `intent` | 决定买哪个包 |
| `plan` | 本周内选 1 个，预算 200-500 元 |
| `needs_buddy` | 'none' |
| `negotiation_summary` | N/A |
| `risks` | ①冲动消费 ②尺码/容量不合适 |
| `next_actions` | 看 3 个对比 · 收藏 · 让朋友帮看 · 抑制 |
| `follow_up` | 商品详情 · 评价 · 比价 · 购买入口 |

### 卡片 #2｜降噪耳机

| 字段 | 内容 |
|---|---|
| `title` | 通勤用降噪耳机，3 个价位各 1 款 |
| `trigger_reason` | 基于你最近 2 条降噪耳机视频 |
| `intent` | 决策买哪款 |
| `plan` | 500/1000/2000 元各一档，对比降噪深度 + 续航 + 重量 |
| `needs_buddy` | 'none' |
| `risks` | ①价格波动 ②评价争议 |
| `next_actions` | 看对比 · 收藏 · 抑制 |
| `follow_up` | 商品详情 · 评测 · 购买 |

---

## 7. 反文案原则（路演时被评委翻车的常见句式）

❌ "AI 已经帮你看完了"
❌ "路线可以按 TwinBuddy 这版走"
❌ "一键帮你搞定"
❌ "AI 比你更懂自己"

✅ "我们替你们聊过了"
✅ "我看了下情况挺合适"
✅ "挺对方 AI 觉得差不多"
✅ "你看合不合适，不合适换人"

**原则**：AI 永远是**你跟对方之间的牵线人**，不是**替你做决定的代理人**。

---

## 8. 数据契约（前端 props）

```ts
interface ActionCard {
  id: string                          // unique-id for analytics
  scene: 'trip' | 'food' | 'fitness' | 'study' | 'event' | 'shopping'
  state: 'hint' | 'plan' | 'buddy' | 'complete'  // PRD §18 四态
  title: string                       // 卡片标题
  trigger_reason: string              // 触发原因
  intent: string                      // 行动意图
  plan: string                        // 行动计划
  needs_buddy: 'required' | 'optional' | 'none'
  candidates: Candidate[]             // 推荐人选
  negotiation_summary?: NegotiationSummary
  risks: string[]
  next_actions: NextAction[]
  follow_up: FollowUp[]
  meta: {
    deadline?: string                 // ISO8601，截止感
    budget?: { min: number; max: number; currency: 'CNY' }
    twins_maturity?: 'novice' | 'intermediate' | 'advanced'
    dampened?: boolean                // 降权状态
  }
}

interface Candidate {
  id: string
  avatar_url: string
  nickname: string
  match_label: 'most_match' | 'most_complement' | 'most_interesting'
  match_reason: string
  conflicts: string[]
}

interface NegotiationSummary {
  agreed: string[]
  pending: string[]
  risks: string[]
  key_moment?: string                 // PM 评审要的"1 个关键瞬间"
}

interface NextAction {
  type: 'invite' | 'switch_buddy' | 'switch_plan' | 'plan_only' | 'dampen' | 'save' | 'cancel'
  label: string
  payload?: any
}
```
