# TwinBuddy 邀约文案模板（真实数据）
# 依据：docs/invite-templates.md §3 模板规范
# 格式：scene.tone:<index>: <text>
# <index> 是同 scene+tone 下的多模板变体（1=主推,2=次推）;
#   端点会按 scene+tone 拉全部变体,前端展示让用户选。
# 变量：{partner_name} {deadline} {weekday} {time} {place} {action} {adj} {budget} {aa_or_buy} {contact} {pace}
# 拒绝品牌自指（无"TwinBuddy" / "路线可以按这版走"）

# ===== 旅行 trip =====
trip.casual:1: 我{weekday}{time}也想去{place}{action}，你{adj}顺路吗？预算 {budget}{aa_or_buy}，到时 {contact} 约时间？
trip.casual:2: 这{weekday}想去{place}逛逛，{time}出发，{budget} {aa_or_buy}。你凑巧有空吗？
trip.direct:1: {weekday} {time} {place}，预算 {budget} {aa_or_buy}，地铁口见。
trip.direct:2: {weekday} {time} 在{place}见，{budget} {aa_or_buy}，到位就发定位。
trip.warm:1: 哇好巧我也想去{place}！{weekday} {time} 地铁口见？预算 {budget} {aa_or_buy}～
trip.warm:2: 看到{place}好心动，要一起去吗？{weekday} {time} 碰头,预算 {budget} 我俩{aa_or_buy}。

# ===== 美食 food =====
food.casual:1: 你收藏的 3 家里，鮨·初今晚 {time} 不用排队（人均 {budget}），约个人一起去？我 {pace} 出行，{aa_or_buy} 就行。
food.casual:2: 今晚 {time} 有家 {action} 不用等位（人均 {budget}），要找个人搭伙，{aa_or_buy} 简单点。
food.direct:1: 鮨·初今晚 {time}，人均 {budget}，{aa_or_buy}。要一起吗？
food.direct:2: {time} 在 {place}，人均 {budget}，{aa_or_buy}，能到就回我。
food.warm:1: 鮨·初 {time} 不用排队哎！约个人一起？人均 {budget} {aa_or_buy} 就行～
food.warm:2: {time} 那家 {action}，我们去吗？人均 {budget} 都不贵，{aa_or_buy} 起步～

# ===== 健身 fitness =====
fitness.casual:1: 我 14 天每周 3 次肩背训练，要不要搭个伙一起？{time} 出门，楼下健身房见？
fitness.casual:2: {weekday}{time} 健身房一起去？想找个搭子监督打卡。
fitness.direct:1: 14 天肩背训练，每周一三五 {time} 楼下健身房，加一个？
fitness.direct:2: {weekday}{time} 健身房，加一个人，节奏一样就行。
fitness.warm:1: 我准备 14 天肩背训练，你一起吗？互相督促效果好～
fitness.warm:2: {weekday}{time} 一起去健身房吧，互相督促效果翻倍～

# ===== 学习 study =====
study.casual:1: 我周一开始 AI Agent 7 天计划，每天 1 小时。要不要搭伙学？{time} 家里视频会议？
study.casual:2: {weekday}{time} 想组织一个 {action} 搭伙群，每周三晚 1 小时。
study.direct:1: AI Agent 7 天计划，周一开始每天 {time} 一小时，加入？
study.direct:2: {weekday}{time} 学习 group，约一次，节奏固定。
study.warm:1: AI Agent 7 天计划，要搭伙吗？学完了说不定还能一起做项目！
study.warm:2: 一起 {action} 吗？{weekday}{time} 同步开聊，一起坚持比较好～

# ===== 活动 event =====
event.casual:1: 你最近看了 8 条周杰伦视频，8/15 深圳站 480-680 票，一起抢吗？{time} 在深圳湾体育中心门口见？
event.casual:2: {weekday}{time} 一场 {action}，还有票，要搭伙一起吗？{aa_or_buy} 简单。
event.direct:1: 8/15 周杰伦深圳站，一起抢票。{time} 体育中心门口见。
event.direct:2: {weekday}{time} {place}，准时碰头，预算 {budget} {aa_or_buy}。
event.warm:1: 周杰伦 8/15 深圳站！一起抢票吧！{time} 门口见～
event.warm:2: {weekday}{time} 一场 {action}，一起一起去吗？开心就好～

# ===== 购物 shopping =====
shopping.casual:1: 我想买通勤背包，300-500 上下，目前看到 3 款（JanSport / Herschel / Mystery Ranch），你帮看？
shopping.casual:2: 在挑一件 {action}，预算 {budget}，你能帮忙参谋一下吗？
shopping.direct:1: 通勤包 300-500，3 款候选。
shopping.direct:2: 买个 {action}，预算 {budget}，能到就一起看。
shopping.warm:1: 我也在挑通勤包，要不一起看看？
shopping.warm:2: 我最近在挑 {action}，来帮我参谋？顺便交个朋友～

