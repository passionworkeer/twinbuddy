# -*- coding: utf-8 -*-
"""
agents/buddies/migrate.py — 一次性迁移脚本

将现有的：
    buddy_XX.json  +  buddy_XX_prompt.md
合并成：
    buddy_XX.md    （YAML frontmatter + Markdown body）

用法：
    cd twinbuddy
    python -m agents.buddies.migrate

迁移后：
  - 原文件备份为 .bak（可以在确认无误后手动删除）
  - get_buddy_doc() 自动从 .md 读取，无需额外改动
  - JSON + _prompt.md 仍作为 fallback 保留

YAML frontmatter 字段（与 persona_doc.py 共享 schema）：
  mbti, pace, social_mode, decision_style, budget,
  interests_like, interests_dislike
"""

from __future__ import annotations

import json
import re
import shutil
from datetime import datetime
from pathlib import Path

import yaml

BUDDIES_DIR = Path(__file__).parent

# ── 推断函数（与 persona_doc.py 保持一致）────────────────────────────────

def _infer_social_mode(travel_style: str) -> str:
    s = travel_style.lower()
    if any(k in s for k in ["社交", "团队", "活跃", "热闹", "自来熟"]):
        return "group_oriented"
    if any(k in s for k in ["独处", "安静", "私密", "独自"]):
        return "solitude_oriented"
    return "balanced"


def _infer_decision_style(neg: str) -> str:
    s = neg.lower()
    if any(k in s for k in ["逻辑", "数据", "理性", "分析", "excel", "计划"]):
        return "analytical"
    if any(k in s for k in ["感受", "情感", "价值观", "和谐", "温柔", "软"]):
        return "empathetic"
    if any(k in s for k in ["直觉", "随性", "即兴", "弹性"]):
        return "spontaneous"
    return "balanced"


def _build_frontmatter(buddy_json: dict) -> dict:
    """从 buddy JSON 提取 YAML frontmatter 字段。"""
    prefs = buddy_json.get("preferences") or {}

    # budget 标准化：去掉「/次」等说明文字
    raw_budget = prefs.get("budget", "")
    m_budget = re.search(r"(\d+-\d+)\s*元", str(raw_budget))
    budget = m_budget.group(1) + "元" if m_budget else str(raw_budget).split("，")[0].strip()

    travel_style = buddy_json.get("travel_style") or ""
    if isinstance(travel_style, dict):
        travel_style = travel_style.get("overall") or travel_style.get("pace") or ""

    neg = buddy_json.get("negotiation_style") or ""
    if isinstance(neg, dict):
        neg = neg.get("approach") or ""

    return {
        "mbti": buddy_json.get("mbti", ""),
        "name": buddy_json.get("name", ""),
        "id": buddy_json.get("id", ""),
        "pace": prefs.get("pace", ""),
        "social_mode": _infer_social_mode(travel_style),
        "decision_style": _infer_decision_style(neg),
        "budget": budget,
        "interests_like": prefs.get("likes", []),
        "interests_dislike": prefs.get("dislikes", []),
    }


# ── 主迁移逻辑 ─────────────────────────────────────────────────────────────

def migrate_buddy(num_str: str) -> bool:
    """
    迁移单个搭子编号（如 "01", "21"）。
    成功返回 True，文件不存在或已迁移返回 False。
    """
    json_path = BUDDIES_DIR / f"buddy_{num_str}.json"
    md_path = BUDDIES_DIR / f"buddy_{num_str}_prompt.md"
    out_path = BUDDIES_DIR / f"buddy_{num_str}.md"

    if not json_path.exists() and not md_path.exists():
        return False

    # 读取 JSON
    buddy_json = None
    if json_path.exists():
        try:
            with open(json_path, "r", encoding="utf-8") as f:
                buddy_json = json.load(f)
        except UnicodeDecodeError:
            with open(json_path, "r", encoding="utf-8-sig") as f:
                buddy_json = json.load(f)

    # 读取 Markdown body
    body = ""
    if md_path.exists():
        body = md_path.read_text(encoding="utf-8").strip()

    # 如果 JSON 不存在但有 prompt.md，构造最小 JSON
    if buddy_json is None:
        # 从 prompt.md 尝试提取 name 和 mbti
        name_m = re.search(r"^#\s*(.+?)\s*\(?([IE][NS][TF][JP])", body, re.MULTILINE)
        name = name_m.group(1).strip() if name_m else f"搭子{num_str}"
        mbti_m = re.search(r"\b([IE][NS][TF][JP])\b", body)
        mbti = mbti_m.group(1) if mbti_m else "ENFP"
        buddy_json = {"id": f"buddy_{num_str}", "name": name, "mbti": mbti,
                       "preferences": {}, "travel_style": "", "negotiation_style": ""}

    # 构建 frontmatter
    fm = _build_frontmatter(buddy_json)

    # 组装 .md 文件
    fm_yaml = yaml.dump(fm, allow_unicode=True, default_flow_style=False, sort_keys=False)
    combined = f"---\n{fm_yaml}---\n\n{body}"

    # 备份原文件
    ts = datetime.now().strftime("%Y%m%d%H%M%S")
    for src, suffix in [(json_path, ".json"), (md_path, "_prompt.md")]:
        if src.exists():
            bak = src.with_suffix(src.suffix + f".bak.{ts}")
            shutil.copy2(src, bak)
            print(f"  备份: {src.name} → {bak.name}")

    # 写入新文件
    out_path.write_text(combined, encoding="utf-8")
    print(f"  生成: {out_path.name}")
    return True


def main():
    print(f"\n=== Buddy 文件迁移 ===")
    print(f"目标目录: {BUDDIES_DIR.resolve()}")
    print(f"原文件将备份为 .bak.timestamp，请确认无误后手动删除。\n")

    # 收集所有编号
    num_set: set = set()
    for f in BUDDIES_DIR.glob("buddy_*.json"):
        m = re.search(r"(\d+)", f.name)
        if m:
            num_set.add(m.group(1).lstrip("0") or m.group(1))

    nums = sorted(num_set, key=lambda x: int(x))
    print(f"找到 {len(nums)} 个搭子 JSON 文件，开始迁移...\n")

    migrated = 0
    skipped = 0
    for num in nums:
        md_path = BUDDIES_DIR / f"buddy_{num}.md"
        if md_path.exists():
            print(f"[{num}] 已迁移，跳过")
            skipped += 1
            continue

        print(f"[{num}] 迁移中...")
        ok = migrate_buddy(num)
        if ok:
            migrated += 1
        else:
            skipped += 1

    print(f"\n=== 完成 ===")
    print(f"迁移: {migrated} 个")
    print(f"跳过: {skipped} 个")
    print(f"\n新格式文件: {BUDDIES_DIR}/buddy_XX.md")
    print(f"备份文件:   {BUDDIES_DIR}/buddy_XX.json.bak.TIMESTAMP")
    print(f"确认无误后删除备份: find . -name '*.bak.*' | xargs rm\n")


if __name__ == "__main__":
    main()
