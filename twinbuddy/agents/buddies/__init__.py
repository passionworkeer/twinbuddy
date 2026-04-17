# -*- coding: utf-8 -*-
"""
agents/buddies/__init__.py — TwinBuddy Buddy Index Loader

从 buddies/ 目录加载所有预生成的搭子 JSON 文件，提供统一的搭子查询 API。
支持从 MOCK_BUDDIES 列表无缝回退，保证向后兼容。

目录结构：
  buddies/
    buddy_01.json         ← 搭子完整人格数据（JSON）
    buddy_01_prompt.md     ← 搭子角色提示词（Markdown）
    buddy_02.json
    buddy_02_prompt.md
    ...

设计原则：
  - LRU 缓存：避免重复读文件
  - 缺失容错：部分搭子未生成时仍可服务
  - 向后兼容：与 mock_database.py 的数据结构完全兼容
"""

from __future__ import annotations

import json
import logging
import re
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, List, Optional

# ---------------------------------------------------------------------------
# 路径配置
# ---------------------------------------------------------------------------

BUDDIES_DIR = Path(__file__).parent
_logger = logging.getLogger("twinbuddy.buddies")

# ---------------------------------------------------------------------------
# 数据加载（缓存）
# ---------------------------------------------------------------------------


def _normalize_buddy(raw: dict) -> dict:
    """
    将 JSON 文件格式的搭子数据规范化为 mock_database.py 期望的格式。

    JSON 文件结构（原生）：
      {
        "id": "buddy_01",
        "name": "小满",
        "mbti": "ENFP",
        "travel_style": "说走就走的自由灵魂，...",
        "preferences": {
          "likes": [...],
          "dislikes": [...],
          "budget": "3000-5000元/次，半年出行1-2次",
          "pace": "慢悠悠，睡到自然醒，...",
          ...
        },
        "negotiation_style": { "approach": "...", ... },
        ...
      }

    mock_database.py 期望格式（扁平）：
      {
        "id": "buddy_01",
        "name": "小满",
        "mbti": "ENFP",
        "travel_style": "...",       ← 来自顶层或 preferences.pace 或默认
        "preferences": {
          "likes": [...],
          "dislikes": [...],
          "budget": "3000-5000元",
          "pace": "慢悠悠，睡到自然醒，...",
        },
        "negotiation_style": "...",  ← 字符串，来自 negotiation_style.approach
        ...
      }
    """
    prefs = raw.get("preferences") or {}

    # 1. preferences.budget：标准化，去掉「/次」等后缀
    raw_budget = prefs.get("budget", "")
    budget_str = str(raw_budget)
    # 去掉「，半年出行...」等说明文字，保留第一个「-」之间的数字范围
    m_budget = re.search(r"(\d+-\d+)\s*元", budget_str)
    budget_normalized = m_budget.group(1) + "元" if m_budget else budget_str.split("，")[0].strip()

    # 2. travel_style：优先用顶层字段，其次推断
    travel_style = (
        raw.get("travel_style") or prefs.get("pace", "") or ""
    )
    if isinstance(travel_style, dict):
        # 取 overall 或 pace 字段
        travel_style = travel_style.get("overall") or travel_style.get("pace") or ""

    # 3. negotiation_style：优先用字符串，其次取 .approach
    neg_style = raw.get("negotiation_style", "")
    if isinstance(neg_style, dict):
        neg_style = neg_style.get("approach", "")

    # 4. personality 层合并到顶层（与 mock_database.py 兼容）
    personality_layers = raw.get("personality_layers") or {}

    # 5. typical_phrases：从 speaking_style 或顶层提取
    speaking = raw.get("speaking_style") or {}
    if isinstance(speaking, dict):
        typical_phrases = speaking.get("typical_phrases", [])
    else:
        typical_phrases = raw.get("typical_phrases", [])

    # 6. avatar_emoji：优先用顶层
    avatar_emoji = raw.get("avatar_emoji", "")

    # 7. identity 层
    identity = raw.get("identity") or {}

    return {
        **raw,
        # 规范化的 preferences
        "preferences": {
            "likes": prefs.get("likes", []),
            "dislikes": prefs.get("dislikes", []),
            "budget": budget_normalized,
            "pace": prefs.get("pace", ""),
        },
        # 扁平字段（mock_database.py 依赖）
        "travel_style": travel_style,
        "negotiation_style": neg_style,
        "typical_phrases": typical_phrases,
        "avatar_emoji": avatar_emoji,
        "identity": identity,
        # personality_layers 保留
        "personality_layers": personality_layers,
    }


@lru_cache(maxsize=1)
def _load_all_buddy_raw() -> List[dict]:
    """
    从 buddies/ 目录加载所有 buddy_*.json 文件。
    文件不存在或解析失败时打印警告但不崩溃。

    编码处理策略：
      1. 尝试 UTF-8（严格）— 大多数文件
      2. 尝试 latin-1 — 处理混合 UTF-8/GBK 文件（部分 JSON 有未转义的
         ASCII 双引号 " 在中文字符串中，导致 json.loads 失败）

    引号修复：使用状态机将字符串值内部的 ASCII 双引号替换为单引号，
    修复 LLM 生成 JSON 时的常见错误（如 "用"算了算了"来安慰自己"）。
    """
    if not BUDDIES_DIR.exists():
        _logger.warning(
            "搭子目录不存在: %s，将回退到 MOCK_BUDDIES（agents/mock_database.py）",
            BUDDIES_DIR,
        )
        return []

    json_files = sorted(BUDDIES_DIR.glob("buddy_*.json"))
    if not json_files:
        _logger.warning(
            "搭子目录 %s 中没有找到 buddy_*.json 文件，将回退到 MOCK_BUDDIES",
            BUDDIES_DIR,
        )
        return []

    buddies = []
    errors = []
    for fpath in json_files:
        raw_text = None
        used_encoding = None

        # 编码策略：
        # 1. latin-1 优先 — 保留原始字节，不丢失数据（部分文件混合 UTF-8/GBK）
        # 2. utf-8 回退 — 纯 UTF-8 文件
        for enc in ("latin-1", "utf-8"):
            try:
                with open(fpath, "r", encoding=enc) as f:
                    raw_text = f.read()
                used_encoding = enc
                break
            except UnicodeDecodeError:
                continue

        if raw_text is None:
            errors.append(f"{fpath.name}: 所有编码均失败")
            continue

        # 修复 JSON 字符串值内部的未转义 ASCII 双引号
        fixed_text = _fix_inner_quotes(raw_text)

        try:
            raw = json.loads(fixed_text)
            normalized = _normalize_buddy(raw)
            buddies.append(normalized)
        except json.JSONDecodeError:
            # Fallback：直接替换所有双引号为单引号（激进修复）
            try:
                fallback = raw_text.replace('"', "'")
                raw = json.loads(fallback)
                normalized = _normalize_buddy(raw)
                buddies.append(normalized)
            except Exception as e2:
                errors.append(f"{fpath.name}({used_encoding}): {e2}")

    for err in errors:
        _logger.warning("加载搭子文件失败: %s", err)

    _logger.info("从 JSON 文件加载了 %d 个搭子（%d 个文件，%d 个错误）",
                 len(buddies), len(json_files), len(errors))
    return buddies


def _fix_inner_quotes(text: str) -> str:
    """
    状态机：将 JSON 文本中字符串值内部的 ASCII 双引号替换为单引号。

    JSON 字符串值：以 ASCII " 开头和结尾（中间部分可能有中文和其他字符），
    其内部出现的中文引号包围的 ASCII 双引号会导致解析失败。
    例如：  "stress_response": "用"算了算了"来安慰自己"
                          ↑这里 ↑这里

    策略：
      - 跟踪 in_string 状态
      - 忽略转义的 \"（跳过下一字符）
      - 在字符串内部，把非结构性的 ASCII " 替换为 '
      - JSON 结构字符（key: value 中的引号）保持不变
    """
    result = []
    i = 0
    n = len(text)
    in_string = False
    while i < n:
        c = text[i]
        if not in_string:
            if c == '"':
                in_string = True
                result.append(c)
            else:
                result.append(c)
            i += 1
            continue

        # We are inside a string value
        if c == "\\":
            # 转义序列：原样保留，跳过下一个字符
            result.append(c)
            if i + 1 < n:
                result.append(text[i + 1])
                i += 2
            else:
                i += 1
            continue

        if c == '"':
            # 字符串值结束
            in_string = False
            result.append(c)
            i += 1
            continue

        # 在字符串内部的中文字符之间，可能有未转义的 ASCII 双引号
        # 启发式：检查前后是否是CJK字符或中文字符，如果是则替换
        prev_c = text[i - 1] if i > 0 else ""
        next_c = text[i + 1] if i + 1 < n else ""
        # 如果前后有CJK字符，这个 " 很可能是不该出现的引号
        if _is_cjk(prev_c) and _is_cjk(next_c):
            # 前后都有中日韩字符，把这个双引号替换为单引号
            result.append("'")
        else:
            result.append(c)
        i += 1

    return "".join(result)


def _is_cjk(c: str) -> bool:
    """检查字符是否为 CJK（中日韩统一表意文字）。"""
    if not c:
        return False
    cp = ord(c)
    # CJK Unified Ideographs + Extension + Compatibility
    return (0x4E00 <= cp <= 0x9FFF or
            0x3400 <= cp <= 0x4DBF or
            0x20000 <= cp <= 0x2A6DF)


# ---------------------------------------------------------------------------
# 公开 API
# ---------------------------------------------------------------------------

def get_all_buddies() -> List[dict]:
    """
    返回所有搭子列表（已规范化）。
    如果 buddies/ 目录不存在或为空，自动回退到 agents.mock_database.MOCK_BUDDIES。
    """
    from agents.mock_database import MOCK_BUDDIES

    raw = _load_all_buddy_raw()
    if raw:
        return raw
    # 回退到内存中的 MOCK_BUDDIES
    _logger.info("使用 MOCK_BUDDIES 回退（共 %d 个搭子）", len(MOCK_BUDDIES))
    return MOCK_BUDDIES


def get_buddy_by_id(buddy_id: str) -> Optional[dict]:
    """
    根据 buddy_id 查找单个搭子。
    未找到时返回 None。
    """
    for b in get_all_buddies():
        if b.get("id") == buddy_id:
            return b
    return None


def get_top_buddies(user_prefs: dict, limit: int = 3) -> List[dict]:
    """
    使用 MING 六维度评分算法排序，返回兼容性最高的 top-N 搭子。

    参数:
        user_prefs: 包含 mbti / likes / dislikes / budget / pace / travel_style 等字段的字典
        limit: 返回数量，默认 3

    返回:
        列表元素在 mock_database.score_compatibility 的格式基础上额外附加：
          _score      — 整体兼容度 (0-100)
          _breakdown  — 六维度详细评分（雷达图用）
    """
    from agents.mock_database import score_compatibility, get_compatibility_breakdown

    buddies = get_all_buddies()
    scored: List[dict] = []
    for b in buddies:
        s = score_compatibility(user_prefs, b)
        breakdown = get_compatibility_breakdown(user_prefs, b)
        entry = dict(b)
        entry["_score"] = s
        entry["_breakdown"] = breakdown
        scored.append(entry)

    scored.sort(key=lambda x: x["_score"], reverse=True)
    return scored[:limit]


def get_compatibility_breakdown(user_prefs: dict, buddy_id: str) -> Optional[dict]:
    """
    返回指定搭子的六维度兼容性雷达图数据。
    未找到 buddy_id 时返回 None。
    """
    from mock_database import get_compatibility_breakdown as _score_breakdown

    buddy = get_buddy_by_id(buddy_id)
    if not buddy:
        _logger.warning("未找到搭子: %s", buddy_id)
        return None
    return _score_breakdown(user_prefs, buddy)


def get_buddy_prompt(buddy_id: str) -> str:
    """
    读取并返回指定搭子的 prompt markdown 文件内容。
    未找到时返回空字符串（不抛异常）。
    """
    # 从 buddy_id 提取编号，如 "buddy_01" -> "01"
    match = re.search(r"(\d+)", buddy_id)
    if not match:
        return ""

    num = match.group(1).zfill(2)
    prompt_path = BUDDIES_DIR / f"buddy_{num}_prompt.md"

    if not prompt_path.exists():
        _logger.debug("搭子 prompt 文件不存在: %s", prompt_path)
        return ""

    try:
        with open(prompt_path, "r", encoding="utf-8") as f:
            return f.read()
    except Exception as e:
        _logger.warning("读取搭子 prompt 文件失败 %s: %s", prompt_path, e)
        return ""


def get_buddy_public(buddy: dict, user_prefs: Optional[dict] = None) -> dict:
    """
    将搭子数据转换为前端 API 响应格式。

    参数:
        buddy: 搭子字典（来自 get_buddy_by_id 或 get_top_buddies 的结果）
        user_prefs: 用户偏好（可选，用于附加兼容性数据）

    返回:
        前端期望的搭子公开字段字典。
    """
    result = {
        "id": buddy.get("id", ""),
        "name": buddy.get("name", ""),
        "mbti": buddy.get("mbti", ""),
        "avatar_emoji": buddy.get("avatar_emoji", ""),
        "travel_style": (
            buddy.get("travel_style")
            if isinstance(buddy.get("travel_style"), str)
            else ""
        ),
        "typical_phrases": buddy.get("typical_phrases", []),
        # 额外维度数据（雷达图用）
        "preferences": buddy.get("preferences", {}),
        "negotiation_style": (
            buddy.get("negotiation_style")
            if isinstance(buddy.get("negotiation_style"), str)
            else ""
        ),
    }

    # 附加评分数据（来自 get_top_buddies）
    if "_score" in buddy:
        result["compatibility_score"] = round(buddy["_score"], 1)
    if "_breakdown" in buddy:
        result["compatibility_breakdown"] = buddy["_breakdown"]

    # 如果传入了 user_prefs 但没有预计算，重新算一次
    if user_prefs and "compatibility_score" not in result:
        from agents.mock_database import score_compatibility, get_compatibility_breakdown
        result["compatibility_score"] = round(score_compatibility(user_prefs, buddy), 1)
        result["compatibility_breakdown"] = get_compatibility_breakdown(user_prefs, buddy)

    return result
