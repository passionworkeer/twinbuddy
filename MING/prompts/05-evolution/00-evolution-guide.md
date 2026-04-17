# 进化总览 — MING Evolution System

## 三大进化机制

MING 的进化系统由三个相互协作的机制构成，它们共同确保 MING 对"我"的刻画随时间准确演化：

```
┌──────────────────────────────────────────────────┐
│              三大进化机制                         │
│                                                  │
│  ① 对话纠正 (Correction)                         │
│     用户说"不对/这不是我" → 双写纠正              │
│                                                  │
│  ② 漂移检测 (Drift Detection)                    │
│     每 20 条输出自动检查 → 预警+建议快照           │
│                                                  │
│  ③ 版本快照 (Snapshot)                           │
│     触发条件满足 → 创建版本存档                   │
│                                                  │
└──────────────────────────────────────────────────┘
```

---

## 进化周期详解

```
生成输出
    ↓
用户评价（显式或隐式）
    ↓
触发纠正？ ──是──→ 写入 corrections.md
    │                  + 标注原文
    │                  + 触发漂移检测
    ↓ 否
漂移阈值触发？ ──是──→ 警告 + 建议快照
    ↓ 否
5条纠正 或 用户主动请求？ ──是──→ 创建快照
    ↓ 否
下次对话 → 读取 corrections.md → 应用纠正规则
```

### 机制 1：对话纠正（Correction）

**触发方式：**
- 用户显式纠正："不对""不是这样""这不像我"
- 用户补充纠正："等等，刚才说的不对""补充一下"
- 用户隐式纠正：重复表达同一偏好、语气变化、回应变冷

**处理流程：**

```markdown
Step 1: 确认理解
  "明白了，你其实会这样表达：{corrected_behavior}"

Step 2: 分类纠正层级
  Layer 2（表达风格）  → 更新 expression.md
  Layer 3（情感模式）  → 更新 emotion.md
  Layer 4（社交行为）  → 更新 behavior.md
  Self Memory（事实/偏好）→ 更新 memory.md

Step 3: 写入纠正记录
  → data/correlations.md

Step 4: 标注原文
  在原文处标注：[已纠正，见 Correction #{n}]

Step 5: 下次响应应用纠正
  读取 corrections.md，生成前应用纠正规则
```

详见 `prompts/05-evolution/correction.md`

### 机制 2：漂移检测（Drift Detection）

**触发时机：** 每生成 20 条输出后自动运行（在后台静默执行）

**四大漂移指标：**

| 指标 | 含义 | 阈值 |
|------|------|------|
| `lexical_shift` | 词汇变化率（用词是否偏离基准） | > 0.35 = Warning |
| `sentence_rhythm_shift` | 句子节奏变化率（句长方差变化） | > 0.30 = Warning |
| `care_pattern_mismatch` | 关心模式不匹配次数（"语气不对"类纠正） | ≥ 3/20 = Warning |
| `boundary_violation` | 越界次数（违反 Layer 0 规则） | ≥ 1 = Critical |

详见 `prompts/05-evolution/drift.md`

### 机制 3：版本快照（Snapshot）

**触发条件（满足任一即创建快照）：**
- 累计 5 条新纠正（来自 corrections.md）
- 用户显式请求："帮我做一个快照"
- 检测到明显的风格漂移（drift.md 达到 Alert 级别）
- 触及新的边界类型（首次出现某种边界行为）

**快照内容：**
```markdown
## Snapshot #{n} — {timestamp}

**触发原因**: {reason}
**纠正数量**: {n} 条新纠正（自上次快照）
**漂移状态**: {OK | Warning | Alert | Critical}
**快照覆盖范围**:
  - soul.md 全文
  - memory.md 增量
  - expression.md 增量
  - emotion.md 增量
  - behavior.md 增量
  - corrections.md 自上次快照以来的新增

**变更摘要**: {what_changed}
**稳定性评估**: {stable | needs_monitoring | review_needed}
```

**存储位置：** `data/snapshots/snapshot-{YYYYMMDD}-{n}.md`

---

## 进化与记忆系统的协作

```
记忆系统（04-memory/）
  ├── working.md     → 提供当前会话上下文
  ├── longterm.md    → 提供稳定偏好事实
  └── emotional.md   → 提供情感锚点和安慰模式

         ↓ 共同为进化系统提供数据

进化系统（05-evolution/）
  ├── correction.md  → 处理用户纠正 → 更新对应记忆文件
  ├── drift.md       → 自动检测漂移 → 触发快照建议
  ├── snapshot.md    → 创建版本存档
  └── merge.md       → 合并新数据到 soul.md

         ↓ 输出

soul.md（权威文件）
  └── 接收来自 correction + merge 的更新建议
```

---

## 纠正的循环利用

每次生成响应前，必须执行以下读取步骤：

```
1. 读取 corrections.md（本次会话新纠正优先）
2. 检查是否有针对当前话题的待应用纠正
3. 应用纠正规则（在生成前修正行为）
4. 生成响应
5. 检查是否触发了新的纠正条件
```

**纠正的时效性：**
- 刚发生的纠正：立即应用，无需等待快照
- 历史纠正：在遇到相似场景时应用
- 已确认纠正：添加到 soul.md 的相关章节

---

## 进化系统的维护

### 定期维护任务

| 频率 | 任务 |
|------|------|
| 每会话结束 | 检查是否有新纠正需要写入 |
| 每 20 条输出 | 运行漂移检测 |
| 每 5 条纠正 | 评估是否需要快照 |
| 每月 | 审查 corrections.md，确认重复模式 |
| 每季度 | 审查 soul.md 更新，检查是否需要合并长期积累的纠正 |

### 快照保留策略

- 最近 3 个快照：完整保留
- 3-10 个快照：保留摘要 + diff
- 10 个以上：保留摘要，可删除最早快照

---

## 关键约束

```
1. 永远不删除纠正记录（可标记 resolved，不可删除）
2. 快照是增加操作，不修改历史快照内容
3. 漂移检测是观察机制，不自动修改行为（只提供建议）
4. 纠正立即生效，快照是存档机制
5. soul.md 拥有最终权威，进化系统的输出是建议而非命令
```

---

*参考：soul.md（权威）| corrections.md > drift.md > snapshot*
