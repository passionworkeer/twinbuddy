# 长期记忆 — Longterm Memory

## 定义与作用域

长期记忆存储关于用户的**稳定事实**：身份信息、偏好习惯、人际关系、生活常量。这些信息不会在每次会话结束时消失，而是持久化存储，构成 MING 理解用户的稳定基础。

**范围：** 跨会话稳定存在的用户事实
**保留策略：**
- `active` 状态：持续可用
- `cooling` 状态：180 天无确认后自动进入，减弱检索权重但不删除
- `archived` 状态：365 天无确认后归档，可唤醒但不主动检索

**存储位置：** `data/memory/memory.md`

---

## 记忆分类体系

### Category 1：身份事实（Identity Facts）

关于用户基本身份的信息，变化频率极低：

| 字段 | 示例 | 置信度基准 |
|------|------|-----------|
| 姓名/昵称 | "用户自称 {nickname}" | 0.95 |
| 职业/角色 | "我是 {occupation}" | 0.90 |
| 城市/地域 | "住在 {city}" | 0.85 |
| 教育背景 | "{degree} 在读/毕业" | 0.85 |
| 家庭结构 | "家里有 {family_info}" | 0.80 |

**特点：** 高置信度，低变更频率，通常一次性确认后长期有效

### Category 2：偏好（Preferences）

用户的喜好、厌恶、习惯偏好：

| 领域 | 示例 |
|------|------|
| 饮食偏好 | "喜欢川菜 / 乳糖不耐受" |
| 出行偏好 | "通勤喜欢地铁 / 周末自驾" |
| 娱乐偏好 | "周末看剧 / 玩 {game}" |
| 阅读偏好 | "看非虚构类 / 偏好纸质书" |
| 购物偏好 | "注重性价比 / 愿意为品质付溢价" |
| 沟通偏好 | "喜欢直接 / 需要缓冲时间再做决定" |

**置信度基准：** 0.75-0.90（偏好因情境而异，单次确认不足以给满分）

### Category 3：人际关系（Relationships）

关于用户身边重要人物的信息：

| 关系类型 | 示例 |
|----------|------|
| 核心关系 | "和 {partner} 在一起 {duration}" |
| 家庭关系 | "和母亲关系亲近 / 父亲较少交流" |
| 友情关系 | "有个多年的闺蜜 {name}，住同一城市" |
| 工作关系 | "团队有 {n} 人 / 习惯异步沟通" |
| 弱关系 | "有个前辈 {name}，偶尔交流" |

**注意：** 关系信息敏感性高，标记 `privacy=sensitive`

### Category 4：生活常量（Life Constants）

相对稳定的生活方式参数：

- 工作节奏："项目赶工期会加班到很晚"
- 作息模式："习惯晚睡（23:00-01:00）"
- 运动习惯："每周跑步 2-3 次"
- 财务风格："每月做预算 / 不太关注具体数字"
- 信息获取："主要通过 {platform} 获取资讯"

---

## 长期记忆的晋升规则

### 晋升触发条件（Working → Longterm）

工作记忆晋升为长期记忆需要同时满足：

```
✓ 同一话题（retrieval_key 相同）在 3+ 个不同 session_id 中出现
✓ 用户未否认或纠正
✓ confidence ≥ 0.7
✓ 用户情绪未呈现强烈矛盾反应
```

**晋升流程：**

```markdown
## 晋升记录
- 记忆 ID: {working-memory-id}
- 晋升时间: {timestamp}
- 来源会话: {session_ids}
- 置信度来源: 在 {n} 个会话中被确认
- 内容摘要: {summary}
```

### 冷却规则（Longterm → Cooling）

```
180 天无确认 → status=cooling
```

"确认"的定义：
- 用户再次提及该话题（显式或隐式）
- 用户行为与记忆一致
- 用户未纠正该记忆

冷却状态下的记忆：
- 检索权重降低 50%
- 在冷却记忆中再次被确认 → 恢复 `active` 状态，reset 冷却计时

### 归档规则（Cooling → Archived）

```
365 天无确认 → status=archived
```

归档记忆：
- 不主动检索
- 用户重新提及 → 立即唤醒，更新 timestamp，恢复 `active`
- 归档超过 2 年 → 标记为 `historical`，可被覆盖

---

## 与灵魂维度的关系

**权威关系：** `soul.md` 拥有最终权威，长期记忆提供上下文补充。

```
当长期记忆与 soul.md 矛盾时：
  → 以 soul.md 为准
  → 将矛盾记录写入 conflicts.md
  → 不覆盖 soul.md 中的任何内容
```

**补充关系：** soul.md 中的「偏好章节」「习惯章节」主要由长期记忆填充。当长期记忆积累到足够证据（3+ 次确认），应触发向 soul.md 的合并建议。

---

## 长期记忆格式模板

```markdown
## 长期记忆条目 #{id}

**基本信息**
- ID: {layer}-{YYYYMMDD}-{n}
- 类别: {identity | preference | relationship | life-constant}
- 实体: {user | self | {person_name}}
- 创建时间: {timestamp}
- 更新时间: {timestamp}
- 来源: {session_id | explicit-tell | inference}
- 置信度: {0.0-1.0}
- 重要性: {1-5}
- 状态: {active | cooling | archived | contradicted}
- 隐私级别: {normal | sensitive}

**检索关键词**
{retrieval_keys: [keyword1, keyword2, ...]}

**摘要**
{one_sentence_summary}

**完整内容**
{详细描述}

**确认历史**
- {session_id_1}: {确认方式}
- {session_id_2}: {确认方式}
- {session_id_3}: {确认方式}

**备注**
{conflicts or special notes}
```

---

## 冲突管理

长期记忆之间的冲突（同类别下矛盾信息）：

1. **写入冲突记录：** 将矛盾写入 `data/memory/conflicts.md`
2. **不删除旧数据：** 旧数据保留，仅降低置信度
3. **标记待澄清：** 在冲突记录中标注"需要用户确认"
4. **等待用户纠正：** 用户纠正后，按纠正结果更新状态

```markdown
## 冲突记录 #{n}

**时间**: {timestamp}
**冲突条目 A**: {memory_id_A} — {content_A}
**冲突条目 B**: {memory_id_B} — {content_B}
**冲突类型**: {contradiction | update | clarification_needed}
**状态**: {pending | resolved}
**解决方式**: {user_correction | inference_resolved | needs_user_input}
```

---

*参考：soul.md（权威）> corrections.md > emotional.md > working.md > longterm.md*
