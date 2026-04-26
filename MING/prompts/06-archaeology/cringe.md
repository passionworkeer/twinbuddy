# 社死考古报告 — {name}

> Hannah Arendt: the distinction between the public and the private self.
>
> 公共领域与私人领域之间，有一条你无意识划下的线。

社死考古不是让你羞耻，而是诚实地面对你在公共空间和私人空间之间的边界。边界是你的选择，但首先你需要看清它在哪里。

---

## 公共形象 vs 私人现实

| 维度 | 公共呈现 | 私人真实 | 差距有多大 |
|------|---------|---------|---------|
| 工作身份 | {how they present professionally} | {what's really like} | {gap_score}/10 |
| 社交媒体人设 | {curated persona} | {unguarded self} | {gap_score}/10 |
| 朋友圈形象 | {how they appear to friends} | {how they feel inside} | {gap_score}/10 |
| 亲密关系中的形象 | {what they show partner} | {what they hide} | {gap_score}/10 |

**整体差距评估**：{average_gap}/10
→ {interpretation: low gap = authentic, high gap = performed self}

---

## 最担心的曝光内容

> 如果你所有社交媒体内容明天被你的**父母/老板/前任**看到，你最担心哪一条？

**被父母看到**：
- 最担心：{post}
- 为什么：{reason}

**被老板看到**：
- 最担心：{post}
- 为什么：{reason}

**被前任看到**：
- 最担心：{post}
- 为什么：{reason}

---

## 数字足迹觉察度

| 问题 | 回答 |
|------|------|
| 你知道你有多少个账号吗？ | {approximate_count} |
| 你上一次检查隐私设置是什么时候？ | {when} |
| 你有没有发过然后后悔的内容？ | {yes/no + examples} |
| 你现在还会发那条内容吗？ | {why/why not} |
| 你会定期删除旧内容吗？ | {habit} |

**觉察度评级**：{low/medium/high}
→ {what this reveals about relationship with digital identity}

---

## 边界被跨越的时刻

**别人泄露了你的私人信息**：
- 事件：{what happened}
- 你的感受：{emotional response}
- 事后反应：{what you did}
- 这次事件改变了你的什么行为？

**你无意间跨越了别人的边界**：
- 事件：{what happened}
- 你怎么发现的：{how you found out}
- 你做了什么：{response}
- 这次事件教会了你什么？

---

## 公开的历史污点

> 每个人都有一个"过去的自己"想要埋葬。

**学生时代/早期互联网时代**：
- {old_post_or_behavior}
- 现在看来：{how you see it now}

**某个尴尬的决定被公开记录**：
- {decision_or_action}
- 你的解读：{how you frame it now}

**你曾经相信但现在不信的东西**：
- {old_belief}
- 转变点：{turning_point}

---

## 公开与私密的交易

| 你用公开换取的东西 | 你用私密保护的东西 |
|-----------------|-----------------|
| {what they share for validation} | {what they keep private} |
| {sacrifice} | {protection} |

**这个交易的代价是什么？**
{what the trade-off costs them over time}

---

## 存在追问

> 你的公共自我和私人自我，哪个更接近"真正的你"？
> 还是说，割裂本身就是你的一部分？

1. **你发朋友圈/帖子之前，会思考谁会看到吗？如果是，你脑内预设的"最苛刻的观众"是谁？**

   {answer}

2. **有没有一条内容你特别想删但删不掉（平台限制或其他原因）？它对你意味着什么？**

   {answer}

3. **如果你的数字身份（所有账号、内容、互动记录）明天消失，你会觉得失去了什么？**

   {answer}

4. **你见过的最让你不安的"公开边界被侵犯"的事是什么？那件事为什么特别让你不安？**

   {answer}

---

## 考古摘要（供整合用）

```json
{
  "tool": "cringe",
  "timestamp": "{ISO8601}",
  "subject": "{slug}",
  "public_private_gap": "{score}/10",
  "most_feared_exposure": "{what they'd fear most}",
  "digital_footprint_awareness": "{low/medium/high}",
  "boundary_violation_memory": "{key_memory}",
  "emotional_anchor": "{one sentence anchor}",
  "existential_question": "{user's answer to question 1}"
}
```
