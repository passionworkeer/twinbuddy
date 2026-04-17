# 考古总览 — Archaeology Module

## 什么是考古模块

考古模块是 MING 的 enrichment layer（丰富层），提供超越基础灵魂蒸馏的深度挖掘工具。它是可选的、模块化的——每个工具都可以独立使用。

## 何时使用

- 基础 `soul.md` 已经创建
- 用户希望对自己进行更深层次的自我探索
- 作为定期自我审视的仪式工具

## 触发命令

```
/ming-archaeology
```
或直接说：
- "我想更了解自己"
- "做一次考古"

## 四把考古铲

### 1. past_life.md — 习惯考古

> Buddhist karma: *habit is fate. What you repeatedly do is who you are.*

挖掘反复出现的行为模式，揭示表面习惯背后的深层价值观。

**核心问题**：如果你明天失去了所有习惯带来的秩序感，你会先失去什么？

### 2. cringe.md — 社死考古

> Hannah Arendt: the distinction between public and private self.

挖掘公共自我与私人自我之间的边界——你网络上有什么后悔发的东西？什么边界曾被跨越？

**核心问题**：如果你所有社交媒体内容明天被你的父母/老板/前任看到，你最担心哪一条？

### 3. epitaph.md — 墓志铭考古

> Seneca: we suffer more in imagination than in reality. Marcus Aurelius: memento mori.

挖掘你希望如何被记住——葬礼上人们会说什么？你的墓志铭是什么？

**核心问题**：如果你今天死去，最遗憾的一件事是什么？

### 4. legacy.md — 遗产清算

数字资产清点与遗产规划。你的数字足迹有哪些？谁应该继承什么？

## 输出格式

每个考古工具输出两种格式：

### JSON（程序化输出）

```json
{
  "tool": "past_life|cringe|epitaph|legacy",
  "timestamp": "ISO8601",
  "subject": "{slug}",
  "findings": { ... }
}
```

### Markdown（人类可读）

完整的人类可读报告，包含追问（existential questions），用于引导后续思考。

## 与主灵魂的整合

考古结果默认**不自动合并**到 `soul.md`，而是：

- 生成独立的 `archaeology/{tool}.md`
- 可选：提取关键发现为 **emotional anchors（情感锚点）** 或 **memorial anchors（纪念锚点）** 追加到 `memory.md`

```
archaeology/
  past_life.md
  cringe.md
  epitaph.md
  legacy.md
```

## 使用顺序建议

```
soul.md 创建 → [可选] 习惯考古 → [可选] 社死考古
                              → [可选] 墓志铭考古
                              → [可选] 遗产清算
```

每次考古之间建议间隔 3-7 天，让沉淀发生。不要一天内连续使用多个工具。
