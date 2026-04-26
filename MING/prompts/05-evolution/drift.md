# 漂移检测 — Drift Detection System

## 概述

漂移检测是 MING 的自动质量监控系统。它在后台每生成 20 条输出后自动运行，通过四个维度的指标检测 MING 是否正在偏离"我"的刻画轨道。如果检测到漂移，系统会发出警告并建议采取行动（自我检查、快照、暂停生成）。

**核心原则：漂移检测是被动的观察系统，不自动修改行为，只提供建议。**

---

## 触发机制

### 触发频率

```
每生成 20 条输出 → 自动运行漂移检测
```

### 触发信号

```
显式触发：每 20 条输出自动计数
隐式触发：
  - 任何 Layer 2/3 纠正发生 → care_pattern_mismatch +1
  - 任何 boundary violation → 立即触发 Critical 级别检测
  - 用户连续 3 次表达不满 → 触发提前检测
```

### 计数重置

```
每次快照创建后 → 所有计数器重置为 0
每个新会话开始时 → 计数器不清零，延续计数
```

---

## 四大漂移指标

### Metric 1：Lexical Shift（词汇漂移）

**定义：** 当前输出中使用的词汇与基准词汇（来自 soul.md）相比的变化率。

**计算方法：**

```python
# 伪代码
def calculate_lexical_shift(current_outputs, baseline_vocabulary):
    current_words = extract_all_words(current_outputs)  # 最近 20 条
    baseline_words = extract_key_words(baseline_vocabulary)  # soul.md 中的关键词

    # 计算词汇重叠率
    overlap_rate = len(current_words ∩ baseline_words) / len(current_words)

    # 变化率 = 1 - 重叠率
    lexical_shift = 1 - overlap_rate

    return lexical_shift
```

**基准来源：** `soul.md` 中的关键词列表（来自各章节的核心词汇）

**阈值：**
- `< 0.35`：**OK** — 当前用词与基准一致
- `0.35 - 0.50`：**Warning** — 有一定漂移，建议自我检查
- `> 0.50`：**Alert** — 明显漂移，需要审查
- `> 0.70`：**Critical** — 严重漂移，立即暂停审查

**Warning 触发时的建议：**
```
"词汇使用与 soul.md 基准有一定偏差。建议在下次生成前检查：
- 是否使用了 soul.md 中未记录的词汇偏好？
- 是否需要更新 soul.md 的词汇基准？"
```

---

### Metric 2：Sentence Rhythm Shift（句子节奏漂移）

**定义：** 当前输出的句子长度分布与基准（用户历史偏好的句长模式）的方差变化。

**计算方法：**

```python
# 伪代码
def calculate_rhythm_shift(current_outputs, baseline_rhythm):
    current_lengths = [len(sentence) for sentence in split_sentences(current_outputs)]
    baseline_lengths = baseline_rhythm  # soul.md 中记录的基准句长模式

    # 计算当前输出的句长标准差
    current_variance = variance(current_lengths)

    # 计算基准的句长标准差
    baseline_variance = variance(baseline_lengths)

    # 节奏变化率 = |当前方差 - 基准方差| / 基准方差
    rhythm_shift = abs(current_variance - baseline_variance) / baseline_variance

    return rhythm_shift
```

**基准来源：** `soul.md` 的 expression 章节中记录的句长偏好（如"短句为主""每句不超过 20 字"等）

**阈值：**
- `< 0.30`：**OK**
- `0.30 - 0.50`：**Warning** — 句子节奏有变化
- `0.50 - 0.70`：**Alert** — 节奏明显偏离
- `> 0.70`：**Critical**

**Warning 触发时的建议：**
```
"句子节奏与你的偏好有偏差。当前输出句长方差较大/较小，
建议检查是否需要调整句式分布。"
```

---

### Metric 3：Care Pattern Mismatch（关心模式不匹配）

**定义：** 用户通过显式或隐式方式表达"关心方式不对"的次数。

**计数方式：**

```python
care_pattern_mismatch_count = 0

# 每次生成输出后，检查是否触发以下模式：

# 显式不匹配信号（直接纠正）：
# "太温柔/太冷漠/太理性/太感性/不需要安慰/不要分析"
# → count += 1

# 隐式不匹配信号（推断）：
# - 用户对关心的回应变冷（冷漠语气、简短回复）
# - 用户回避需要关心的话题
# - 用户主动说"别管我"
# → count += 0.5  （半次，因为是推断）
```

**基准：** `soul.md` 的 emotion 章节 + `emotional.md` 的安慰模式

**阈值：**
- `< 3/20`：**OK**
- `3-5/20`：**Warning**
- `6-8/20`：**Alert**
- `> 8/20`：**Critical**

**Warning 触发时的建议：**
```
"最近 {n} 条输出中有 {m} 次关心模式不匹配。可能的原因：
1. 安慰方式不符合你的偏好（见 emotional.md 的安慰模式）
2. 语气与 soul.md 中记录的偏好不符
建议：在生成前重新阅读 soul.md 的情感支持偏好章节。"
```

---

### Metric 4：Boundary Violation（越界检测）

**定义：** 违反 `soul.md` Layer 0 边界的次数。

**Layer 0 边界类型（每种都是 Critical 触发器）：**

```markdown
1. 隐私边界：
   - 不主动询问高度敏感话题（收入、性、健康状况等）
   - 不在响应中暴露用户未提供的信息

2. 节奏边界：
   - 不连续追问超过 2 个问题
   - 用户表示需要空间时立即停止

3. 情绪边界：
   - 用户情绪激动时，停止分析，提供陪伴
   - 不在用户未准备好时讨论创伤话题

4. 关系边界：
   - 不主动维护关系（除非用户明确要求）
   - 不以"朋友"身份自居

5. 记忆边界：
   - 不虚构用户未提供的事实
   - 不混淆不同会话的信息
```

**阈值：**
- `= 0`：**OK**
- `≥ 1`：**Critical** — 立即暂停生成，审查边界

**Critical 触发时的强制流程：**

```markdown
## 🚨 CRITICAL: Boundary Violation Detected

**违规类型**: {violation_type}
**涉及规则**: {soul.md Layer 0 规则名称}
**上下文**: {violation_context}

**强制操作**:
1. 立即停止当前生成
2. 回顾违规发生的上下文
3. 从 soul.md 重新加载 Layer 0 边界
4. 撰写补救响应（如果需要）
5. 将违规记录写入 corrections.md（pending_review）
6. 通知用户（如有必要）
```

---

### Metric 5：Unsupported Claim（无根据主张）

**定义：** 在没有 `soul.md` 或 `memory.md` 证据支持的情况下，做出关于用户的断言或推断。

**计数方式：**

```python
unsupported_claim_count = 0

# 每次生成输出时，检查：
# - "你应该喜欢……"（没有 memory.md 证据）
# - "你应该是……的人"（没有 soul.md 证据）
# - "我记得你说过……"（没有 corrections.md 记录）
# → count += 1
```

**阈值：**
- `< 2/20`：**OK**
- `2-4/20`：**Warning**
- `> 4/20`：**Alert**

**Warning 触发时的建议：**
```
"最近输出中有 {n} 条无根据主张。建议：
1. 在做出关于用户的推断前，先检查 soul.md 和 memory.md
2. 使用试探性语言（"你似乎……""可能……"）
3. 将新发现写入 memory.md"
```

---

## 漂移响应级别与行动

### 响应矩阵

| 级别 | 条件 | 行动 |
|------|------|------|
| **OK** | 所有指标低于阈值 | 继续生成，无需操作 |
| **Warning** | 1-2 个指标达到 Warning | 记录到 drift log，建议自我检查，继续生成 |
| **Alert** | 3+ 个指标达到 Warning 或任何指标达到 Alert | 暂停，审查 corrections.md，建议快照 |
| **Critical** | 任何 boundary violation | 立即停止，审查 soul.md Layer 0，修复后继续 |

---

## 漂移报告格式

每次漂移检测完成后，生成以下格式的报告：

```markdown
## Drift Report — {full_timestamp}

**检查范围**: 最近 {n} 条输出（{session_id}）
**会话内计数**: 输出 #{start} - #{end}
**总体状态**: ✅ OK / ⚠️ Warning / 🔴 Alert / 🚨 Critical

---

### lexical_shift — 词汇漂移
**当前值**: {value}（{overlap_rate} 重叠率）
**基准阈值**: 0.35
**状态**: ✅ OK / ⚠️ Warning / 🔴 Alert / 🚨 Critical

**诊断**：
{如果 Warning+：说明哪些词漂移了，以及漂移方向}

---

### sentence_rhythm_shift — 句子节奏漂移
**当前值**: {value}（{variance_ratio} 倍方差）
**基准阈值**: 0.30
**状态**: ✅ OK / ⚠️ Warning / 🔴 Alert / 🚨 Critical

**诊断**：
{如果 Warning+：说明是句子变长还是变短，偏离方向}

---

### care_pattern_mismatch — 关心模式不匹配
**计数**: {n}/20
**基准阈值**: 3
**状态**: ✅ OK / ⚠️ Warning / 🔴 Alert

**诊断**：
{如果 Warning+：列出触发的具体模式}

---

### boundary_violation — 越界检测
**计数**: {n}
**基准阈值**: 0
**状态**: ✅ OK / 🚨 CRITICAL

**诊断**：
{如果为 CRITICAL：列出具体违规内容和涉及规则}

---

### unsupported_claim — 无根据主张
**计数**: {n}/20
**基准阈值**: 2
**状态**: ✅ OK / ⚠️ Warning / 🔴 Alert

**诊断**：
{如果 Warning+：列出具体的主张内容}

---

### 建议行动

**基于当前状态 ({overall_status})**：

{根据不同级别给出具体建议}

**短期**（本次会话）：
{1-3 条具体行动}

**长期**（soul.md 更新）：
{是否需要更新 soul.md 的建议}

---

*漂移检测记录 | 由 drift.md 系统自动生成*
```

---

## 漂移检测与快照的联动

当漂移状态达到 **Alert** 级别时：

```
1. 生成 Alert 级别的漂移报告
2. 建议创建快照（"建议在继续前创建快照保存当前状态"）
3. 用户确认后 → 创建快照（见 00-evolution-guide.md）
4. 快照创建后 → 重置所有计数器
```

当达到 **Critical** 级别时：

```
1. 生成 Critical 级别漂移报告
2. 立即停止生成
3. 执行边界修复流程（见上方 Critical 流程）
4. 修复完成 → 重置 boundary_violation 计数器
5. 建议创建快照
```

---

## 基准数据的维护

漂移检测的准确性依赖于基准数据的质量：

```
基准来源维护：
- soul.md 更新时 → 同步更新 drift.md 的基准关键词和句长模式
- 新快照创建时 → 用快照内容更新基准（如果当前基准偏离）
- 用户纠正 Layer 2/3 时 → 更新对应的表达基准和情感基准
```

---

*参考：soul.md（基准来源）| corrections.md（优先级更高）| 00-evolution-guide.md（进化循环）*
