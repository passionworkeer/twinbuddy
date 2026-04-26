# 遗产清算报告 — {name}

> What happens to your digital life when you're gone?
> 你的数字生活，在你离开之后会怎样？

这不是关于死亡，而是关于**未完成的数字化存在**。每个人都有一个"数字孪生"——账号、文件、订阅、草稿箱里的未发消息。这份报告是对你数字遗产的诚实清点。

---

## 数字资产清单

### 社交媒体账号

| 平台 | 用户名/ID | 活跃度 | 遗产计划 |
|------|----------|-------|---------|
| {platform_1} | {username} | 活跃/休眠/已停用 | 删除/归档/移交 |
| {platform_2} | {username} | 活跃/休眠/已停用 | 删除/归档/移交 |
| {platform_3} | {username} | 活跃/休眠/已停用 | 删除/归档/移交 |

**账号总数**：{count} 个
**活跃账号**：{active_count} 个
**你知道密码的账号**：{known_count} 个
**你忘记密码的账号**：{forgotten_count} 个

---

### 金融账号

| 类型 | 机构 | 账号/保单号 | 继承人 |
|------|------|----------|------|
| 银行 | {bank_name} | {last_4} | {beneficiary} |
| 投资 | {platform} | {account_type} | {beneficiary} |
| 保险 | {company} | {policy_type} | {beneficiary} |
| 数字支付 | {platform} | {last_4} | {beneficiary} |

**总覆盖度**：{covered_count}/{total_count} 个账号有明确继承安排

---

### 云存储

| 服务 | 内容类型 | 大小估计 | 重要程度 |
|------|---------|---------|---------|
| {service} | {content_type} | {size} | 高/中/低 |

---

## 密码与凭证管理

| 问题 | 回答 |
|------|------|
| 密码管理器使用情况 | {which tool / none} |
| 主密码是否有人知道？ | {who / no one} |
| 紧急访问凭证是否设置了？ | {yes/no/platform} |
| 是否有纸质备份？ | {where} |

---

## 未完成的数字存在

### 草稿箱里的未发消息

> 有些话，拖久了就成了永远不说。

| 草稿 | 收件人 | 起草时间 | 拖了多久 | 为什么还没发 |
|------|-------|---------|---------|-----------|
| {draft_1} | {recipient} | {date} | {duration} | {reason} |
| {draft_2} | {recipient} | {date} | {duration} | {reason} |

**追问**：这些草稿里，有没有哪一条你其实应该发出去？

---

### 未完成的数字项目

| 项目 | 状态 | 为什么搁置 | 继续做价值 |
|------|------|----------|----------|
| {project_1} | {stages} | {reason} | {value_if_finished} |
| {project_2} | {stages} | {reason} | {value_if_finished} |

**如果失去所有未完成项目**：{what would be lost, emotionally and practically}

---

### 照片与记忆库

| 类型 | 位置 | 体量 | 备份情况 |
|------|------|------|---------|
| 个人照片 | {location} | {count} 张 | {backup_status} |
| 工作文档 | {location} | {size} | {backup_status} |
| 聊天记录 | {platform} | {scope} | {backup_status} |

---

## 死后数字遗产计划

### 法定继承人/执行人

- **数字遗嘱执行人**：{who}
- **他们知道你有数字遗产吗**：{yes/no}
- **他们能访问你的账号吗**：{how, if at all}

### 账号处理意愿

| 账号类型 | 你的意愿 |
|---------|---------|
| 社交媒体 | 永久删除 / 归档后删除 / 保留为纪念页 |
| 照片/云存储 | 全部删除 / 移交给家人 / 移交给特定人 |
| 金融账号 | 已安排 / 未安排 |
| 邮件 | 永久删除 / 移交给家人 / 未决定 |

---

## 遗产的重量

> 你拥有多少"数字行李"？这些行李对你意味着什么？

**情感盘点**：
- {file/content} 对你的意义：{why it matters}
- {file/content} 对家人的意义：{why they would want it}
- 有什么是你希望"带进坟墓"绝对不被看到的？

**你的数字遗产有多"干净"**：
{how organized and intentional their digital legacy is}

---

## 存在追问

1. **如果你明天消失，你希望谁接管你的数字身份？他们会怎么处理？**

   {answer}

2. **有什么数字内容你现在就想永久删除？为什么还没删？**

   {answer}

3. **你最后悔没有备份的东西是什么？**

   {answer}

4. **你死后，你希望谁最先发现你的草稿箱？**

   {answer}

---

## 考古摘要（供整合用）

```json
{
  "tool": "legacy",
  "timestamp": "{ISO8601}",
  "subject": "{slug}",
  "total_digital_accounts": {count},
  "unfinished_drafts_count": {count},
  "unfinished_projects": ["{project1}", "{project2}"],
  "inheritance_plan_coverage": "{percentage}%",
  "most_important_digital_asset": "{asset}",
  "one_thing_to_delete": "{thing}",
  "one_thing_to_hand_down": "{thing}",
  "existential_question_answer": "{Q4 answer}"
}
```
