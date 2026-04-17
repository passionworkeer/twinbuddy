#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
MING Soul Writer
Generates the complete MING soul file structure from parsed data.
Handles: init, generate, combine, manifest.
"""
from __future__ import annotations

import argparse
import codecs
import hashlib
import json
import os
import re
import sys

# ── Windows UTF-8 ─────────────────────────────────────────────────────────────
if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

from datetime import datetime
from pathlib import Path
from typing import Any, Optional

# ─── Paths ─────────────────────────────────────────────────────────────────────

# Detect MING project root (where tools/ lives)
_TOOLS_DIR = Path(__file__).resolve().parent          # .../MING/tools
_MING_ROOT = _TOOLS_DIR.parent                        # .../MING
_PROFILES_DIR = _MING_ROOT / "profiles"
_PROMPTS_DIR = _MING_ROOT / "prompts"

# ─── Encoding ───────────────────────────────────────────────────────────────────

def _open(path, mode="r", encoding="utf-8"):
    try:
        return open(path, mode, encoding=encoding)
    except TypeError:
        return codecs.open(path, mode, encoding=encoding)


def _write_file(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with _open(path, "w", encoding="utf-8") as f:
        f.write(content)


def _read_file(path: Path) -> str:
    if not path.exists():
        return ""
    with _open(path, encoding="utf-8") as f:
        return f.read()


# ─── Colors (ANSI) ──────────────────────────────────────────────────────────────

def _col(code: int, text: str) -> str:
    if sys.stdout.isatty():
        return f"\033[{code}m{text}\033[0m"
    return text

GREEN  = lambda t: _col(32, t)
YELLOW = lambda t: _col(33, t)
RED    = lambda t: _col(31, t)
CYAN   = lambda t: _col(36, t)
BOLD   = lambda t: _col(1, t)


def _info(msg: str) -> None:
    print(f"{CYAN('[info]')} {msg}")


def _ok(msg: str) -> None:
    print(f"{GREEN('[ok]')} {msg}")


def _warn(msg: str) -> None:
    print(f"{YELLOW('[warn]')} {msg}", file=sys.stderr)


def _err(msg: str) -> None:
    print(f"{RED('[error]')} {msg}", file=sys.stderr)


# ─── Slug validation ────────────────────────────────────────────────────────────

_SLUG_RE = re.compile(r"^[a-z0-9][-a-z0-9_]{1,30}$")

def validate_slug(slug: str) -> bool:
    return bool(_SLUG_RE.match(slug))


def slug_to_title(slug: str) -> str:
    """Convert slug like 'ming-2024-weekly' to 'MING 2024 Weekly'."""
    return " ".join(p.capitalize() for p in re.split(r"[-_]", slug)).replace("Ming", "MING")


# ─── Jinja2-style template variable replacement ─────────────────────────────────
# Minimal implementation: supports {{ var }} and {% if %} {% endif %}

_TEMPLATE_VAR = re.compile(r"\{\{\s*(\w+(?:\.\w+)*)\s*\}\}\}")
_TEMPLATE_IF  = re.compile(r"\{%\s*if\s+(\w+)\s*%\}")
_TEMPLATE_ENDIF = re.compile(r"\{%\s*endif\s*%\}")
_TEMPLATE_FOR  = re.compile(r"\{%\s*for\s+(\w+)\s+in\s+(\w+(?:\.\w+)*)\s*%\}")


def _get_nested(data: dict, key: str) -> Any:
    """Get nested key like 'verbal_tics.哈' from dot-notation."""
    parts = key.split(".")
    val = data
    for p in parts:
        if isinstance(val, dict):
            val = val.get(p)
        else:
            return None
    return val


def _render_template(template: str, data: dict) -> str:
    """Render a template string with data dict. Supports {{ var }}, {% if var %}...{% endif %}."""
    result: list[str] = []
    lines = template.splitlines(keepends=True)

    # Pre-process if/for blocks
    i = 0
    while i < len(lines):
        line = lines[i]

        # Simple variable substitution
        def replace_var(m):
            val = _get_nested(data, m.group(1))
            if val is None:
                return ""
            if isinstance(val, (dict, list)):
                return json.dumps(val, ensure_ascii=False)
            return str(val)

        new_line = _TEMPLATE_VAR.sub(replace_var, line)
        result.append(new_line)
        i += 1

    text = "".join(result)

    # Process {% if %} blocks
    while True:
        if_m = _TEMPLATE_IF.search(text)
        if not if_m:
            break
        end_m = _TEMPLATE_ENDIF.search(text, if_m.end())
        if not end_m:
            _warn(f"Unclosed if block starting at: {if_m.group(0)}")
            break

        var_name = if_m.group(1)
        val = _get_nested(data, var_name)
        inner = text[if_m.end():end_m.start()]

        if val:
            text = text[:if_m.start()] + inner + text[end_m.end():]
        else:
            text = text[:if_m.start()] + text[end_m.end():]

    return text


# ─── Built-in templates (when no external template exists) ─────────────────────

def _default_soul_md(slug: str, data: dict) -> str:
    """Generate a default soul.md from parsed data."""
    title = slug_to_title(slug)
    date_range = data.get("date_range", {})
    first = date_range.get("first") or "未知"
    last = date_range.get("last") or "未知"
    total = data.get("total_messages", 0)
    avg_len = data.get("avg_message_length", 0)
    short_ratio = data.get("short_burst_ratio", 0)

    verbal_tics = data.get("verbal_tics", {})
    top_tics = sorted(verbal_tics.items(), key=lambda x: -x[1])[:8]
    tics_md = "\n".join(f"- `{k}` {v}次" for k, v in top_tics) if top_tics else "- （无）"

    emoji = data.get("emoji", {})
    top_emoji = sorted(emoji.items(), key=lambda x: -x[1])[:10]
    emoji_md = " ".join(e for e, _ in top_emoji) if top_emoji else "（无）"

    top_cn = data.get("top_chinese_words", [])[:15]
    cn_md = "\n".join(f"- {c['char']} ({c['count']}次)" for c in top_cn) if top_cn else "- （无）"

    samples = data.get("samples", [])[:10]
    samples_md = "\n".join(f"> [{s['sender']}] {s['time']}: {s['content'][:60]}" for s in samples) if samples else ""

    time_dist = data.get("time_distribution", {})
    active_hours = sorted(
        [(h, c) for h, c in time_dist.items() if isinstance(c, int) and c > 0],
        key=lambda x: -x[1]
    )[:5]
    hours_md = ", ".join(f"{h}点({c}条)" for h, c in active_hours) if active_hours else "数据不足"

    return f"""# {title} — 灵魂文件

> 由 MING Soul Writer 自动生成
> 生成时间: {datetime.now().strftime('%Y-%m-%d %H:%M')}

## 基础档案

- **Slug:** {slug}
- **数据范围:** {first} ~ {last}
- **总消息数:** {total}
- **平均消息长度:** {avg_len} 字
- **短句比例:** {short_ratio:.1%}

## 语言指纹

### 口头禅 / 语气词
{tics_md}

### 表情符号偏好
{emoji_md}

### 高频表达
{cn_md}

### 活跃时段
{hours_md}

## 交流风格摘要

基于以上数据，此人倾向于：
- 消息平均长度为 {avg_len:.0f} 字，属于{'偏短' if avg_len < 20 else '中等' if avg_len < 50 else '偏长'}的交流风格
- 短句（≤5字）比例为 {short_ratio:.0%}，{'短句较多' if short_ratio > 0.3 else '以完整句子为主'}
- {'高频使用语气词' if len(top_tics) > 3 else '语气词使用较少'}

## 典型消息样本

{samples_md}

---

*此文件由 MING Soul Writer 自动生成，请人工校对后使用。*
"""


def _default_memory_md(slug: str, data: dict) -> str:
    """Generate a default memory.md from parsed data."""
    title = slug_to_title(slug)
    date_range = data.get("date_range", {})
    return f"""# {title} — 记忆档案

> 自动生成 | {datetime.now().strftime('%Y-%m-%d')}

## 元信息

- Slug: {slug}
- 数据范围: {date_range.get('first', '?')} ~ {date_range.get('last', '?')}
- 消息总数: {data.get('total_messages', 0)}

## 交流模式

- 平均消息长度: {data.get('avg_message_length', 0)} 字
- 短句占比: {data.get('short_burst_ratio', 0):.1%}
- 活跃时段: {', '.join(data.get('time_distribution', {}).keys())}

## 关键词汇

### 高频中文bigram
{', '.join(c['char'] for c in data.get('top_chinese_words', [])[:20])}

### 高频英文词
{', '.join(w['word'] for w in data.get('top_english_words', [])[:20])}

## 触发词清单（待人工补充）

- （由人工维护）
"""


def _default_interaction_md(slug: str, data: dict) -> str:
    title = slug_to_title(slug)
    return f"""# {title} — 交互偏好

> 自动生成 | {datetime.now().strftime('%Y-%m-%d')}

## 交互模式摘要

| 维度 | 数值 |
|------|------|
| 平均消息长度 | {data.get('avg_message_length', 0)} 字 |
| 短句比例 | {data.get('short_burst_ratio', 0):.1%} |
| 语气词种类 | {len(data.get('verbal_tics', {}))} 种 |

## 语气词偏好

{json.dumps(data.get('verbal_tics', {}), ensure_ascii=False, indent=2)}

## Emoji 偏好

{json.dumps(dict(sorted(data.get('emoji', {}).items(), key=lambda x: -x[1])[:15]), ensure_ascii=False, indent=2)}

## 建议的交互风格（待人工校对）

- （由人工维护）
"""


def _default_corrections_md(slug: str) -> str:
    return f"""# 纠错记录

> 自动生成 | {datetime.now().strftime('%Y-%m-%d')}

## 使用说明

此文件记录 soul.md 中发现的错误和修正。

格式：
- **日期:** YYYY-MM-DD
- **问题:** 描述
- **修正:** 修正后的描述
"""


def _default_conflicts_md(slug: str) -> str:
    return f"""# 冲突记录

> 自动生成 | {datetime.now().strftime('%Y-%m-%d')}

## 使用说明

此文件记录 soul.md 与实际交互中的冲突/不一致。

格式：
- **日期:** YYYY-MM-DD
- **场景:** 什么情况下发现不一致
- **原假设:** soul.md 中怎么写的
- **实际表现:** 实际是什么
- **处理方式:** 如何解决
"""


def _default_proactive_md(slug: str) -> str:
    return f"""# 主动触发配置

> 自动生成 | {datetime.now().strftime('%Y-%m-%d')}

## 使用说明

配置 MING 的主动行为触发条件。

格式：
- **触发条件:** 什么情况下触发
- **触发内容:** 说什么/做什么
- **冷却时间:** 多少小时内不重复触发
"""


def _default_meta(slug: str) -> dict:
    return {
        "slug": slug,
        "created": datetime.now().isoformat(),
        "updated": datetime.now().isoformat(),
        "version": "1.0.0",
        "data_sources": [],
        "status": "generated",
    }


def _default_manifest_entry(file_path: Path, content: str) -> dict:
    sha = hashlib.sha256(content.encode("utf-8")).hexdigest()
    return {
        "file": str(file_path),
        "sha256": sha,
        "size": len(content),
        "generated": datetime.now().isoformat(),
    }


# ─── Template loading ─────────────────────────────────────────────────────────

def _load_template(template_name: str) -> Optional[str]:
    """Try to load a template file from prompts/ directory."""
    template_path = _PROMPTS_DIR / f"{template_name}.md"
    if template_path.exists():
        return _read_file(template_path)

    # Also check tools/templates/
    tools_tpl = _TOOLS_DIR / "templates" / f"{template_name}.md"
    if tools_tpl.exists():
        return _read_file(tools_tpl)

    return None


# ─── Command: init ─────────────────────────────────────────────────────────────

def cmd_init(args: argparse.Namespace) -> None:
    slug = args.slug

    if not validate_slug(slug):
        _err(f"Invalid slug: '{slug}'. Use: 2-31 chars, lowercase letters, numbers, hyphens/underscores, starts with letter/number.")
        sys.exit(1)

    profile_dir = _PROFILES_DIR / slug
    if profile_dir.exists() and any(profile_dir.iterdir()):
        if not args.force:
            _err(f"Profile '{slug}' already exists. Use --force to overwrite.")
            sys.exit(1)
        _warn(f"Overwriting existing profile '{slug}'...")

    profile_dir.mkdir(parents=True, exist_ok=True)

    files = {
        "soul.md":       "# 灵魂文件\n\n> 待生成\n",
        "memory.md":     "# 记忆档案\n\n> 待生成\n",
        "interaction.md":"# 交互偏好\n\n> 待生成\n",
        "corrections.md": _default_corrections_md(slug),
        "conflicts.md":   _default_conflicts_md(slug),
        "proactive.json": json.dumps({
            "triggers": [],
            "cooldown_hours": 24,
        }, ensure_ascii=False, indent=2),
    }

    for fname, content in files.items():
        _write_file(profile_dir / fname, content)

    # Write meta.json
    meta = _default_meta(slug)
    if args.based_on:
        meta["data_sources"] = [os.path.abspath(args.based_on)]
        meta["based_on"] = args.based_on
    _write_file(profile_dir / "meta.json", json.dumps(meta, ensure_ascii=False, indent=2))

    _ok(f"Initialized profile: {slug}")
    _info(f"Location: {profile_dir}")
    print()
    print("Files created:")
    for fname in files:
        print(f"  - {CYAN(fname)}")
    print()
    print("Next: python soul_writer.py generate {slug} --data <data.json>")


# ─── Command: generate ─────────────────────────────────────────────────────────

def cmd_generate(args: argparse.Namespace) -> None:
    slug = args.slug
    data_path = os.path.abspath(args.data)

    if not os.path.exists(data_path):
        _err(f"Data file not found: {data_path}")
        sys.exit(1)

    # Load data
    try:
        with _open(data_path) as f:
            data = json.load(f)
    except json.JSONDecodeError as e:
        _err(f"Invalid JSON in {data_path}: {e}")
        sys.exit(1)

    profile_dir = _PROFILES_DIR / slug
    if not profile_dir.exists():
        _warn(f"Profile '{slug}' does not exist. Creating...")
        profile_dir.mkdir(parents=True, exist_ok=True)

    # Load custom templates or use defaults
    soul_template = _load_template("soul")
    memory_template = _load_template("memory")
    interaction_template = _load_template("interaction")

    # Generate soul.md
    soul_content = _render_template(soul_template, data) if soul_template else _default_soul_md(slug, data)
    _write_file(profile_dir / "soul.md", soul_content)
    _ok(f"soul.md generated")

    # Generate memory.md
    memory_content = _render_template(memory_template, data) if memory_template else _default_memory_md(slug, data)
    _write_file(profile_dir / "memory.md", memory_content)
    _ok(f"memory.md generated")

    # Generate interaction.md
    interaction_content = _render_template(interaction_template, data) if interaction_template else _default_interaction_md(slug, data)
    _write_file(profile_dir / "interaction.md", interaction_content)
    _ok(f"interaction.md generated")

    # Update meta.json
    meta_path = profile_dir / "meta.json"
    meta = json.loads(_read_file(meta_path)) if meta_path.exists() else _default_meta(slug)
    meta["updated"] = datetime.now().isoformat()
    meta["version"] = str(float(meta.get("version", "1.0")) + 0.1)
    if data_path not in meta.get("data_sources", []):
        meta.setdefault("data_sources", []).append(data_path)
    meta["status"] = "generated"
    _write_file(meta_path, json.dumps(meta, ensure_ascii=False, indent=2))

    _info(f"Profile updated: {slug}")


# ─── Command: combine ──────────────────────────────────────────────────────────

def cmd_combine(args: argparse.Namespace) -> None:
    slug = args.slug
    profile_dir = _PROFILES_DIR / slug

    if not profile_dir.exists():
        _err(f"Profile '{slug}' not found.")
        sys.exit(1)

    files_order = [
        "soul.md",
        "memory.md",
        "interaction.md",
        "corrections.md",
        "conflicts.md",
    ]

    parts: list[str] = [
        f"# {slug_to_title(slug)} — MING Soul Profile",
        "",
        f"> 合并生成 | {datetime.now().strftime('%Y-%m-%d %H:%M')}",
        "",
    ]

    for fname in files_order:
        fpath = profile_dir / fname
        if fpath.exists():
            content = _read_file(fpath)
            if content.strip():
                parts.append(f"\n{'=' * 60}\n")
                parts.append(f"## {fname.replace('.md', '').upper()}\n")
                parts.append(content.strip())

    # Add proactive.json as code block
    proactive_path = profile_dir / "proactive.json"
    if proactive_path.exists():
        proactive_content = _read_file(proactive_path)
        if proactive_content.strip():
            parts.append(f"\n{'=' * 60}\n")
            parts.append("## PROACTIVE CONFIG\n")
            parts.append("```json")
            parts.append(proactive_content.strip())
            parts.append("```")

    combined = "\n".join(parts)
    output_path = profile_dir / "SKILL.md"
    _write_file(output_path, combined)
    _ok(f"SKILL.md generated: {output_path}")
    _info(f"Total size: {len(combined)} chars")


# ─── Command: manifest ─────────────────────────────────────────────────────────

def cmd_manifest(args: argparse.Namespace) -> None:
    slug = args.slug
    profile_dir = _PROFILES_DIR / slug

    if not profile_dir.exists():
        _err(f"Profile '{slug}' not found.")
        sys.exit(1)

    md_files = list(profile_dir.glob("*.md")) + list(profile_dir.glob("*.json"))
    manifest_entries: list[dict] = []

    for fpath in sorted(md_files):
        content = _read_file(fpath)
        sha = hashlib.sha256(content.encode("utf-8")).hexdigest()
        manifest_entries.append({
            "file": fpath.name,
            "sha256": sha,
            "size": len(content),
            "modified": datetime.fromtimestamp(fpath.stat().st_mtime).isoformat(),
        })

    manifest = {
        "slug": slug,
        "generated": datetime.now().isoformat(),
        "files": manifest_entries,
    }

    manifest_path = profile_dir / "manifest.json"
    _write_file(manifest_path, json.dumps(manifest, ensure_ascii=False, indent=2))
    _ok(f"manifest.json generated: {manifest_path}")

    if args.update:
        # Also update meta.json fingerprint
        meta_path = profile_dir / "meta.json"
        if meta_path.exists():
            meta = json.loads(_read_file(meta_path))
            meta["manifest_sha256"] = hashlib.sha256(
                json.dumps(manifest, ensure_ascii=False).encode("utf-8")
            ).hexdigest()
            meta["manifest_updated"] = datetime.now().isoformat()
            _write_file(meta_path, json.dumps(meta, ensure_ascii=False, indent=2))
            _ok("meta.json fingerprint updated")

    # Print summary
    print()
    print(f"Files tracked ({len(manifest_entries)}):")
    for entry in manifest_entries:
        print(f"  {entry['sha256'][:12]}  {entry['file']} ({entry['size']} bytes)")


# ─── CLI ──────────────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(
        prog="soul_writer.py",
        description=(
            "MING Soul Writer — generates the complete MING soul file structure.\n"
            "  init       Create directory structure\n"
            "  generate   Fill soul files from JSON data\n"
            "  combine    Merge .md files into SKILL.md\n"
            "  manifest   Compute SHA256 fingerprints\n"
        ),
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    sub = parser.add_subparsers(dest="cmd", required=True)

    # init
    p_init = sub.add_parser("init", help="Initialize a new profile directory")
    p_init.add_argument("slug", help="Profile slug (e.g. ming-2024-weekly)")
    p_init.add_argument("--based-on", dest="based_on", help="Path to source data file")
    p_init.add_argument("--force", action="store_true", help="Overwrite existing profile")

    # generate
    p_gen = sub.add_parser("generate", help="Generate soul files from JSON data")
    p_gen.add_argument("slug", help="Profile slug")
    p_gen.add_argument("--data", required=True, help="Path to parsed data JSON file")

    # combine
    p_combine = sub.add_parser("combine", help="Merge .md files into SKILL.md")
    p_combine.add_argument("slug", help="Profile slug")

    # manifest
    p_manifest = sub.add_parser("manifest", help="Compute SHA256 fingerprints for all files")
    p_manifest.add_argument("slug", help="Profile slug")
    p_manifest.add_argument("--update", action="store_true",
                             help="Also update fingerprint in meta.json")

    args = parser.parse_args()

    if args.cmd == "init":
        cmd_init(args)
    elif args.cmd == "generate":
        cmd_generate(args)
    elif args.cmd == "combine":
        cmd_combine(args)
    elif args.cmd == "manifest":
        cmd_manifest(args)


if __name__ == "__main__":
    main()
