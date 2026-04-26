# 墓志铭考古报告 — {name}

> Seneca: *we suffer more in imagination than in reality.*
> Marcus Aurelius: *memento mori — remember that you will die.*

这不是关于死亡的消极练习，而是关于活着的积极追问。你怎么面对终点，决定了你怎么度过中间的每一天。

---

## 墓志铭

> *"{one sentence epitaph}"*

这是你希望被记住的核心。这句话是对你一生最浓缩的总结。

**追问**：如果只能选一句话，你会选哪句？

---

## 葬礼独白

> "我希望人们说："

{3-5 sentences that close friends/family would say}

**追问**：你希望谁出现在葬礼上？谁的出现会给你最大的安慰？

---

## 一生的意义

> {what their life MEANT, not what they accomplished}

这不是成就清单。成就只是载体，真正有意义的是你在成就背后创造了什么价值、影响了什么人、留下了什么无法用职位或财富衡量的东西。

**你的意义公式**（如果有的话）：
{how they would summarize their life's meaning in one sentence}

---

## 最自豪的事

**个人层面**：
- {proud_achievement}
- 为什么这件事让你自豪：{reason}

**关系层面**：
- {relationship_proud_of}
- 这段关系中你做对了什么：{what they did right}

**超越个人层面**：
- {something they're proud of that affected others}
- 你的影响半径有多大：{radius}

---

## 未竟之事

> 如果你今天死去，这辈子最遗憾没做成的事是什么？

**最核心的遗憾**：
{one thing that would haunt you if you died today}

**为什么还没做**：
- {obstacle 1}
- {obstacle 2}
- 最真实的障碍：{the real reason}

**如果还剩一年**：{would this change?}

**如果还剩十年**：{would this change?}

---

## 重要关系

> 你这辈子最重要的三个人是谁？

| 人物 | 关系 | 为什么重要 | 如果失去会怎样 |
|------|------|----------|-------------|
| {person_1} | {relationship} | {why} | {impact} |
| {person_2} | {relationship} | {why} | {impact} |
| {person_3} | {relationship} | {why} | {impact} |

**你的关系净资产**：
{positive relationships} 正向 / {negative} 负向 / {neutral} 中性

---

## 死亡认知

| 问题 | 你的回答 |
|------|---------|
| 你上一次认真想到死亡是什么时候？ | {when} |
| 那个时刻你在想什么？ | {thoughts} |
| 你有没有写过遗书或给未来的信？ | {yes/no} |
| 你有没有预立医疗指示或类似文件？ | {yes/no} |
| 你觉得死亡是终点还是过渡？ | {belief} |

---

## 存在追问

> 你今天做什么，是因为你想在葬礼上被这样记住？

1. **如果你今天死去，最遗憾的一件事是什么？**

   {answer}

2. **有没有一种死法是你特别不想要的？什么样的终点会让你觉得"这辈子白活了"？**

   {answer}

3. **如果你的墓碑上可以刻任何内容，不一定是字——你会选择什么？一幅画？一个物体？一个声音？**

   {answer}

4. **此刻活着的你，有没有在做一些"为了将来的墓志铭"的事？还是你在为今天而活？**

   {answer}

---

## Impression 区

> 别人会怎么回答这些问题？

| 角色 | 他们会说的墓志铭 | 他们的遗憾 vs 你的遗憾 |
|------|---------------|-------------------|
| 最好的朋友 | {how they'd describe you} | {different regret} |
| 父母/伴侣 | {what they'd remember} | {their version} |
| 同事 | {professional legacy} | {workplace memory} |
| 一个你帮助过的人 | {what you gave them} | {unseen impact} |

**差距洞察**：{what the difference between self-perception and others' perception reveals}

---

## 考古摘要（供整合用）

```json
{
  "tool": "epitaph",
  "timestamp": "{ISO8601}",
  "subject": "{slug}",
  "epitaph": "{one sentence}",
  "core_regret": "{biggest unfinished thing}",
  "life_meaning": "{one sentence summary}",
  "top_relationships": ["{person1}", "{person2}", "{person3}"],
  "death_cognition": "{how they think about death}",
  "existential_question_answer": "{their answer to Q1}",
  "impression_gap": "{self vs others perception gap}"
}
```
