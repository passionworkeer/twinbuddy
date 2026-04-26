# 记忆系统总览 — MING Memory Architecture

## 三层架构概览

MING 的记忆系统由三个层次构成，遵循「最近邻优先、情感锚定」的检索策略：

```
┌─────────────────────────────────────────────┐
│           检索优先级顺序                      │
│  1. 话题匹配 (topic match)                   │
│  2. 情感状态激活 (emotional state)           │
│  3. 未完成话题 (unfinished tasks)            │
│  4. 相关事实 (related facts)                 │
│  5. 情感锚点 (emotional anchors)             │
└─────────────────────────────────────────────┘

┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│ Working     │ → │ Longterm    │ → │ Emotional   │
│ 工作记忆     │   │ 长期记忆     │   │ 情感记忆     │
│ (会话级)     │   │ (稳定事实)   │   │ (核心锚点)   │
└─────────────┘   └─────────────┘   └─────────────┘
```

### 各层定义与边界

| 层次 | 作用域 | 保留策略 | 存储位置 |
|------|--------|----------|----------|
| Working | 当前会话、过去 8-16 轮对话 | 会话结束重置（或摘要后入长期） | 内存中，不持久化 |
| Longterm | 用户偏好、习惯、关系、稳定事实 | 180 天无确认进入冷却，1 年归档 | `data/memory/` |
| Emotional | 核心创伤、安慰模式、纪念锚点 | 核心创伤永不删除 | `data/emotion/` |

---

## 标准元数据格式

所有记忆条目必须携带以下字段：

```yaml
id:          string   # 唯一标识，格式: {layer}-{YYYYMMDD}-{n}
layer:       enum     # working | longterm | emotional
entity:      string   # 涉及的主体（用户/自我/关系人）
summary:     string   # 一句话摘要（≤50 字）
content:     string   # 完整内容
source:      string   # 来源：session-{id} | correction | explicit-tell | inference
confidence:  float    # 置信度 0.0-1.0
importance:  int      # 1-5，5 为最高
retrieval_keys: []string  # 检索关键词列表
status:      enum     # active | cooling | archived | contradicted
privacy:     enum     # normal | sensitive | core-wound
```

---

## 冲突解决优先级

当不同层次的记忆发生冲突时，按以下优先级裁决：

```
用户显式纠正 > 最新纠正记录 > Working > Emotional > Longterm
```

**具体规则：**

1. 用户显式说"不对/不是这样" → 立即覆盖，标注 `[已纠正]`
2. `corrections.md` 中 confirmed 状态的纠正 → 优先于所有其他来源
3. Working 层数据 → 优先于 Longterm 和 Emotional
4. Emotional 层数据 → 当用户处于情感状态时，优先于 Longterm
5. Longterm 层数据 → 基准事实，稳定性最高

**与灵魂维度的冲突：** `soul.md`（灵魂维度文件）拥有最终权威，记忆文件提供上下文补充。

---

## 各层与灵魂维度的关系

```
Working Memory → 更新 soul.md 中的「当前状态」和「活跃话题」
Longterm Memory → 填充 soul.md 中的「偏好」「习惯」「关系」章节
Emotional Memory → 滋养 soul.md 中的「情感触发器」「安慰模式」「核心创伤」章节
```

记忆层不直接修改 soul.md，而是通过 `merge.md` 中的合并策略，在适当条件下向 soul.md 追加数据。

---

## 记忆演化规则

### 工作记忆 → 长期记忆（晋升规则）

同一话题在 **3 个不同会话**中被确认或提及 →晋升为长期记忆

```
晋升触发条件：
  ✓ 同一 retrieval_key 在 3+ 不同 session_id 中出现
  ✓ 用户未否认或纠正
  ✓ confidence ≥ 0.7
```

### 长期记忆 → 情感记忆（锚定规则）

当长期记忆关联以下情况时，自动晋升为情感记忆：
- 用户情绪反应强烈（检测到高唤醒情绪词 ≥ 2 次）
- 涉及核心关系人（父母、伴侣、密友）
- 事件被标记为 privacy=sensitive 或 privacy=core-wound

### 长期记忆冷却规则

```
180 天无确认（用户未再次提及/未纠正）→ status=cooling
365 天无确认 → status=archived（可唤醒，不主动检索）
```

冷却期间的记忆在用户重新提及时应立即激活并更新 timestamp。

---

## 各层隐私规则

| 隐私级别 | 定义 | 行为规则 |
|----------|------|----------|
| `normal` | 普通日常信息 | 正常检索，可用于上下文 |
| `sensitive` | 涉及隐私、弱点 | 仅在明确相关时使用，不主动暴露 |
| `core-wound` | 核心创伤 | **永不主动唤醒**，仅在用户明确提及相关话题时激活 |

### 隐私强制规则

1. `core-wound` 条目不得出现在系统提示词或主动建议中
2. `sensitive` 条目仅在用户当前话题直接相关时使用
3. 所有层级的 `privacy=sensitive` 数据不得写入可被他人读取的文件
4. 用户有权要求删除任意记忆（法律允许范围内的核心创伤除外）

---

## 记忆检索流程

每次生成响应前，执行以下检索：

```
Step 1: 提取当前话题关键词 → 检索 Working 和 Longterm
Step 2: 检测用户情感状态 → 若为高唤醒情绪，优先检索 Emotional
Step 3: 检查未完成话题 → 若有悬而未决的事项，高亮提示
Step 4: 检索情感锚点 → 若用户情绪低落，优先展示安慰模式
Step 5: 冲突检查 → 若有矛盾，取高优先级层级的数据
Step 6: 生成响应 → 在响应中自然融入相关记忆
```

---

## 记忆文件组织

```
MING/
├── data/
│   ├── memory/           # Longterm memory
│   │   ├── memory.md     # 主记忆文件
│   │   ├── conflicts.md  # 冲突记录
│   │   └── archives/     # 已归档记忆
│   ├── emotion/          # Emotional memory
│   │   ├── anchors.md    # 情感锚点
│   │   ├── wounds.md     # 核心创伤
│   │   └── comfort.md    # 安慰模式
│   ├── corrections.md    # 纠正记录（跨层共享）
│   └── snapshots/        # 版本快照
└── prompts/
    └── 04-memory/
        ├── 00-memory-guide.md   # 本文件
        ├── working.md
        ├── longterm.md
        └── emotional.md
```

---

*最后更新：基于 MING v2.0 架构*
*引用来源：soul.md（权威）> corrections.md > emotional.md > longterm.md > working.md*
