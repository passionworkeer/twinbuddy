# -*- coding: utf-8 -*-
"""
agents/real_persona_index.py — 真实用户 Persona 索引与匹配

从 twinbuddy/data/personas/ 目录加载所有真实 persona 文件，
通过 MING 六维度算法与用户偏好匹配，返回 top-N 最相似的搭子及预生成对话。

数据流：
  用户 onboarding → 算法匹配真实 persona → 返回搭子 + 预生成对话

文件命名：
  twinbuddy/data/personas/{uuid}.md    ← 真实 persona（UUID 无前缀）
  twinbuddy/data/personas/persona_*.md  ← 测试文件（跳过）
"""
from __future__ import annotations

import json
import logging
import re
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

def _scoring_module():
    try:
        from twinbuddy.agents import scoring as sc
        return sc
    except Exception:
        from twinbuddy.agents import scoring as sc
        return sc

_logger = logging.getLogger("twinbuddy.real_persona_index")

# ---------------------------------------------------------------------------
# 路径配置
# ---------------------------------------------------------------------------

_REPO_ROOT = Path(__file__).resolve().parent.parent
_REAL_PERSONA_DIR = _REPO_ROOT / "twinbuddy" / "data" / "personas"
_MOCK_DIALOGUE_DIR = _REPO_ROOT / "mock_personas"

# ---------------------------------------------------------------------------
# 字段规范化
# ---------------------------------------------------------------------------

def _normalize_persona(raw: Dict[str, Any], file_stem: str) -> Optional[Dict[str, Any]]:
    """
    将真实 persona .md 的 frontmatter 规范化为 scoring.score_compatibility() 期望的格式。

    真实 persona 字段（flat）:
      mbti, pace, social_mode, decision_style, budget,
      interests_like, interests_dislike, negotiation_style,
      persona_id, soul_fingerprint, city

    目标格式（与 agents/buddies/*.json 兼容）:
      mbti, preferences.{likes,dislikes,budget,pace},
      negotiation_style (str), travel_style (str)
    """
    try:
        # 1. preferences 规范化为嵌套 dict
        interests_like: List[str] = raw.get("interests_like") or []
        interests_dislike: List[str] = raw.get("interests_dislike") or []

        # interests_like 可能是嵌套列表，如 ["美食", "摄影"] 或 [["美食", "摄影"]]
        if interests_like and isinstance(interests_like[0], list):
            interests_like = interests_like[0]
        if interests_dislike and isinstance(interests_dislike[0], list):
            interests_dislike = interests_dislike[0]

        # 2. negotiation_style 可能是 dict 或 str
        neg_raw = raw.get("negotiation_style") or ""
        if isinstance(neg_raw, dict):
            neg_style = neg_raw.get("approach", "")
        else:
            neg_style = str(neg_raw)

        # 3. travel_style = pace
        pace = str(raw.get("pace") or "")

        # 4. mbti 和 city（需要在 return 前定义）
        mbti = str(raw.get("mbti") or "ENFP").strip("'\"")

        # 5. 顶层扁平字段
        travel_style = pace  # scoring 用 travel_style

        # 6. city
        city = str(raw.get("city") or "")

        return {
            "id": file_stem,  # UUID stem（无 .md 后缀）
            "persona_id": raw.get("persona_id", f"persona-{file_stem}"),
            "name": f"搭子-{city or mbti}",
            "avatar_emoji": "🌟",
            "mbti": mbti,
            "preferences": {
                "likes": interests_like,
                "dislikes": interests_dislike,
                "budget": str(raw.get("budget") or ""),
                "pace": pace,
            },
            "negotiation_style": neg_style,
            "travel_style": travel_style,
            "city": city,
            "soul_fingerprint": raw.get("soul_fingerprint", ""),
            # 保留原始 body（用于前端展示）
            "_raw": raw,
        }
    except Exception as exc:
        _logger.warning("规范化 persona 失败 [%s]: %s", file_stem, exc)
        return None


# ---------------------------------------------------------------------------
# Persona 加载（带 LRU 缓存）
# ---------------------------------------------------------------------------

@lru_cache(maxsize=1)
def _load_all_normalized() -> List[Dict[str, Any]]:
    """加载所有真实 persona 并规范化。启动时调用一次，结果缓存。"""
    if not _REAL_PERSONA_DIR.exists():
        _logger.warning("真实 persona 目录不存在: %s", _REAL_PERSONA_DIR)
        return []

    personas: List[Dict[str, Any]] = []
    skipped = 0
    for path in _REAL_PERSONA_DIR.glob("*.md"):
        stem = path.stem
        # 跳过测试文件
        if stem.startswith("persona_test"):
            skipped += 1
            continue
        try:
            content = path.read_text(encoding="utf-8")
            fm = _parse_frontmatter(content)
            if not fm:
                continue
            normalized = _normalize_persona(fm, stem)
            if normalized:
                personas.append(normalized)
        except Exception as exc:
            _logger.warning("加载 persona 失败 [%s]: %s", path.name, exc)

    _logger.info(
        "真实 persona 加载完成 | total=%d | skipped=%d | dir=%s",
        len(personas), skipped, _REAL_PERSONA_DIR,
    )
    return personas


def _parse_frontmatter(doc: str) -> Optional[Dict[str, Any]]:
    """解析 YAML frontmatter（不依赖 pyyaml，轻量实现）。"""
    doc = doc.lstrip()
    if not doc.startswith("---"):
        return None
    end = doc.find("\n---\n")
    if end < 0:
        return None
    fm_text = doc[3:end].strip()
    return _parse_yaml_simple(fm_text)


def _parse_yaml_simple(text: str) -> Dict[str, Any]:
    """极简 YAML parser：支持 list、string、number。不依赖 pyyaml。"""
    result: Dict[str, Any] = {}
    lines = text.splitlines()
    i = 0
    while i < len(lines):
        line = lines[i]
        # 跳过空行和注释
        if not line.strip() or line.strip().startswith("#"):
            i += 1
            continue
        # 列表项
        m_list = re.match(r"^(\s*-\s*)(.*)$", line)
        if m_list:
            indent = len(m_list.group(1)) - 1
            value = m_list.group(2).strip().strip("'\",")
            # 尝试解析内嵌列表
            if value.startswith("[") and value.endswith("]"):
                try:
                    value = json.loads(value)
                except Exception:
                    pass
            if result and isinstance(list(result.values())[-1], list):
                last_key = list(result.keys())[-1]
                if isinstance(result[last_key], list):
                    result[last_key].append(value)
                    i += 1
                    continue
            if result and isinstance(list(result.values())[-1], list):
                pass
            else:
                result[line.strip().lstrip("- ")] = value
            i += 1
            continue
        # key: value
        m_kv = re.match(r"^(\w[\w_]*)\s*:\s*(.*)$", line)
        if m_kv:
            key = m_kv.group(1)
            raw_val = m_kv.group(2).strip()
            if raw_val in ("", "[]", "{}"):
                result[key] = [] if raw_val == "[]" else {}
                i += 1
                continue
            if raw_val.startswith("["):
                # 内联列表
                try:
                    result[key] = json.loads(raw_val)
                except Exception:
                    result[key] = [raw_val.strip().strip("'\",")]
                i += 1
                continue
            # 去除引号
            val = raw_val.strip("'\",")
            # 布尔值
            if val in ("true", "True"):
                val = True
            elif val in ("false", "False"):
                val = False
            result[key] = val
            i += 1
            continue
        i += 1
    return result


# ---------------------------------------------------------------------------
# 对话加载
# ---------------------------------------------------------------------------

def _get_compatibility_path(user_mbti: str, buddy_mbti: str) -> Optional[Path]:
    """
    根据 MBTI 对查找预生成对话文件。

    文件命名约定：
      mock_personas/{mbti1}/{mbti2}/compatibility_{mbti1}_{mbti2}_{dest}_[真实].json
      其中 {mbti1} < {mbti2}（字母序）

    参数:
        user_mbti: 当前用户的 MBTI
        buddy_mbti: 匹配到的搭子的 MBTI
    返回:
        compatibility 文件路径，未找到返回 None
    """
    combo = sorted([user_mbti.upper(), buddy_mbti.upper()])
    dir_path = _MOCK_DIALOGUE_DIR / combo[0].lower()
    pattern = f"compatibility_{combo[0].lower()}_{combo[1].lower()}_"

    if not dir_path.exists():
        return None

    candidates = [
        f for f in dir_path.iterdir()
        if f.name.startswith(pattern) and f.suffix == ".json"
    ]
    if not candidates:
        return None

    # 优先选"真实"版本
    real_candidates = [f for f in candidates if "_真实" in f.name]
    return real_candidates[0] if real_candidates else candidates[0]


@lru_cache(maxsize=1)
def _load_all_dialogues() -> Dict[str, Dict[str, Any]]:
    """
    预加载所有对话文件，建立 (sorted_mbti → dialogue_data) 的索引。
    返回: {(mbti1,mbti2): dialogue_data}
    """
    index: Dict[str, Dict[str, Any]] = {}
    if not _MOCK_DIALOGUE_DIR.exists():
        return index
    for path in _MOCK_DIALOGUE_DIR.rglob("compatibility_*.json"):
        try:
            with open(path, encoding="utf-8") as f:
                d = json.load(f)
            key = tuple(sorted([d.get("user_mbti","").upper(), d.get("buddy_mbti","").upper()]))
            # 优先保留含 messages 的真实版本（覆盖不含 messages 的 mock 版本）
            is_real = "_真实" in path.name
            existing = index.get(key)
            if is_real or existing is None:
                index[key] = d
        except Exception:
            pass
    return index


# ---------------------------------------------------------------------------
# 公开 API
# ---------------------------------------------------------------------------

def _find_dialogue(
    dialogue_index: Dict[str, Any],
    user_mbti: str,
    buddy_mbti: str,
) -> Optional[Dict[str, Any]]:
    """
    查找预生成对话：优先精确 MBTI 对，相同 MBTI 时找该用户 MBTI 的最佳替代对话。
    """
    key = tuple(sorted([user_mbti, buddy_mbti]))
    dialogue = dialogue_index.get(key)
    if dialogue:
        return dialogue
    # 同 MBTI 自配无预生成对话 → 找该用户 MBTI 与其他常见搭子的对话
    if user_mbti == buddy_mbti:
        fallback_map = {
            "ENFP": ["ISFP", "INTJ", "ISTJ"],
            "INTJ": ["ENFP"],
            "INFP": ["ENFP", "ISFP"],
        }
        fallbacks = fallback_map.get(user_mbti, [])
        for fb in fallbacks:
            alt_key = tuple(sorted([user_mbti, fb]))
            d = dialogue_index.get(alt_key)
            if d:
                return d
    return None


def get_top_personas(
    user_prefs: Dict[str, Any],
    limit: int = 5,
) -> List[Dict[str, Any]]:
    """
    使用 MING 六维度算法匹配真实 persona，返回 top-N 最相似的搭子及对话。

    参数:
        user_prefs: 用户偏好，字段同 _build_user_prefs() 输出
                    (mbti, likes, dislikes, budget, pace, travel_style, negotiation_style, city)
        limit: 返回数量，默认 5

    返回:
        列表元素：
          id             — persona UUID（无 .md 后缀）
          mbti           — MBTI
          score          — 兼容分 (0-100)
          breakdown      — 六维度评分
          dialogue       — 预生成对话 dict 或 None
            {
              "destination": "大理",
              "user_mbti": "ENFP",
              "buddy_mbti": "ISFP",
              "overall_score": 0.88,
              "messages": [...],
              "summary": "..."
            }
          ...规范化后的 persona 字段（preferences, negotiation_style 等）
    """
    personas = _load_all_normalized()
    if not personas:
        _logger.warning("无真实 persona 可用，返回空列表")
        return []

    dialogue_index = _load_all_dialogues()

    scored: List[Dict[str, Any]] = []
    sc = _scoring_module()
    user_mbti = user_prefs.get("mbti", "").upper()

    for p in personas:
        score = sc.score_compatibility(user_prefs, p)
        breakdown = sc.get_compatibility_breakdown(user_prefs, p)

        # 查找对话：优先精确 MBTI 对，否则找同一用户 MBTI 的替代对话
        dialogue = _find_dialogue(dialogue_index, user_mbti, p.get("mbti", "").upper())

        scored.append({
            **p,
            "score": round(score, 1),
            "breakdown": breakdown,
            "dialogue": dialogue,
            # 兼容 agents/buddies 的字段名
            "_score": round(score, 1),
            "_breakdown": breakdown,
        })

    scored.sort(key=lambda x: x["score"], reverse=True)
    return scored[:limit]


def get_persona_by_id(persona_id: str) -> Optional[Dict[str, Any]]:
    """
    根据 persona UUID 查找单个真实 persona。
    persona_id 可以是带 "persona-" 前缀或不带。
    """
    personas = _load_all_normalized()
    for p in personas:
        pid = p.get("persona_id", "")
        if pid == persona_id or pid == f"persona-{persona_id}" or p.get("id") == persona_id:
            return p
    return None
