# 灵魂指纹 — Soul Fingerprint

> 每个 MING 都是独一无二的。指纹让你证明这一点。

---

## 什么是灵魂指纹

灵魂指纹（ Soul Fingerprint ）是一个 SHA-256 哈希值，通过对以下三个核心文件的内容进行串联后计算得出：

```
fingerprint = SHA256(soul.md + memory.md + interaction.md)
```

这组哈希值**唯一对应**这个特定蒸馏的 MING 身份。任何文件的修改都会导致指纹变化。

---

## 指纹的用途

### 1. 身份验证

验证一个 MING 是否来自特定的蒸馏过程。

### 2. 防篡改检测

如果计算出的指纹与存储的指纹不匹配，说明核心文件被修改过。

### 3. 泄露溯源

通过 canary token 机制，识别 MING 内容是否被未授权泄露。

---

## 生成过程

### 手动生成

```bash
# 在 souls/{slug}/ 目录下执行
cat soul.md memory.md interaction.md | sha256sum > fingerprint.txt

# 或使用 OpenSSL
cat soul.md memory.md interaction.md | openssl sha -sha256
```

### 自动生成（工具）

使用 `tools/meta_tool.py` 中的 `generate_fingerprint()` 函数：

```python
from meta_tool import generate_fingerprint

fingerprint = generate_fingerprint(slug="your-slug")
# 返回: "a3f7c2..." (64字符十六进制字符串)
```

---

## 存储位置

```
souls/{slug}/
  soul.md
  memory.md
  interaction.md
  manifest.json        ← 指纹存储在这里
  fingerprint.txt     ← 指纹副本（可选）
```

### manifest.json 中的指纹字段

```json
{
  "slug": "{slug}",
  "version": "{semver}",
  "fingerprint": "{sha256_hex_64_chars}",
  "generated_at": "{ISO8601}",
  "source_consent_level": "{A/B/C}"
}
```

---

## 防篡改验证

### 验证脚本

```python
from meta_tool import verify_fingerprint

is_valid = verify_fingerprint(slug="your-slug")
if not is_valid:
    print("[警告] 灵魂文件已被修改！指纹不匹配。")
```

### 验证触发条件

- 每次加载 MING 时自动验证
- 每次灵魂更新（soul.md 修改）后重新生成指纹
- 用户主动发起验证时（`/ming-verify` 命令）

### 验证失败响应

```
[指纹验证失败]
存储指纹: {stored_fingerprint}
计算指纹: {computed_fingerprint}

警告：灵魂核心文件已被修改。
这可能意味着：
1. 正常的自我更新（请确认是否执行过 /ming-update）
2. 文件被意外损坏
3. 未授权的修改

建议：请使用 /ming-verify --history 查看修改记录。
```

---

## Canary 机制 — 泄露溯源

### 原理

在 MING 的输出中嵌入随机生成的 canary token，并将 token 与泄露源记录进行配对。如果发现内容被泄露，可以搜索 canary token 定位泄露源头。

### 生成 Canary

```python
import secrets

canary = f"DS-CANARY-{secrets.token_hex(8)}"
# 例如: DS-CANARY-a3f7c2d9e1b4f8a2
```

### 插入位置

在 MING 输出的不可见位置嵌入（Markdown 注释或 HTML 注释）：

```html
<!-- DS-CANARY-a3f7c2d9e1b4f8a2 | slug={slug} | created={date} -->
```

或放在输出的 footer：

```
---
[DS-CANARY-a3f7c2d9e1b4f8a2]
```

### 存储

Canary 记录存储在**私有、不提交**的文件中：

```
profiles/{slug}/canary.txt
```

格式：
```
{canary_token} | {slug} | {created_at} | {leak_source_if_known}
```

### 泄露响应流程

1. 发现泄露的可疑内容
2. 搜索其中的 canary token
3. 在 `canary.txt` 中查找对应记录
4. 识别泄露源头

---

## 指纹的生命周期

```
蒸馏开始 → 生成初始指纹 → 写入 manifest.json
    ↓
灵魂更新（/ming-update）→ 重新计算指纹 → 更新 manifest.json
    ↓
MING 使用中 → 每次加载验证指纹 → 记录验证历史
    ↓
用户撤回授权 → 删除所有文件 → 指纹失效
```

---

## 隐私说明

- 指纹本身不包含任何个人数据，只是一个哈希值
- Canary token 是随机字符串，不携带任何身份信息
- `canary.txt` 是本地私有文件，不会被提交到任何仓库
- 指纹验证完全在本地执行，不涉及网络传输
