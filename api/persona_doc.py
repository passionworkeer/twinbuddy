# -*- coding: utf-8 -*-
"""
agents/persona_doc.py — TwinBuddy Persona 文件持久化模块

将 persona 数据写入/读取 .md 文件（YAML frontmatter + body），
供前端 /feed /persona 接口使用。

文件格式：
  ---
  mbti: ENFP
  persona_id: persona-enfp-abc123
  name: 热情开拓者
  travel_style: 随性探索型
  identity.content: ...
  preferences.likes: ["美食", "摄影"]
  preferences.budget: 3000-5000元
  ---
  [persona body text]
"""

from __future__ import annotations

import re
import uuid
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

# ---------------------------------------------------------------------------
# 路径配置
# ---------------------------------------------------------------------------

_DOCS_DIR = Path(__file__).parent.parent / "data" / "personas"
_DOCS_DIR.mkdir(parents=True, exist_ok=True)


def _get_user_doc_path(user_id: str) -> Path:
    """根据 user_id 获取 persona .md 文件路径"""
    safe_id = re.sub(r"[^a-zA-Z0-9_-]", "_", user_id)
    return _DOCS_DIR / f"persona_{safe_id}.md"


# ---------------------------------------------------------------------------
# YAML Frontmatter（轻量实现，不依赖 pyyaml）
# ---------------------------------------------------------------------------

def extract_frontmatter(doc: str) -> Dict[str, Any]:
    """
    从 .md 文档中提取 YAML frontmatter。
    返回 frontmatter dict，解析失败时返回空 dict。
    """
    if not doc or "---" not in doc:
        return {}

    parts = doc.split("---", 2)
    if len(parts) < 3:
        return {}

    fm_text = parts[1]
    result: Dict[str, Any] = {}

    for line in fm_text.splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue

        if ": " in line:
            key, raw_val = line.split(": ", 1)
        elif line.endswith(":"):
            key = line[:-1]
            raw_val = ""
        else:
            continue

        key = key.strip()
        raw_val = raw_val.strip()

        # 嵌套字段用 "." 分割
        if "." in key:
            # e.g. "preferences.likes" → {"preferences": {"likes": [...]}}
            parts_keys = key.split(".")
            d = result
            for k in parts_keys[:-1]:
                if k not in d:
                    d[k] = {}
                d = d[k]
            # 解析值
            if raw_val.startswith("[") and raw_val.endswith("]"):
                # 简单列表: ["a", "b"]
                items = raw_val[1:-1].split(",")
                d[parts_keys[-1]] = [i.strip().strip("\"'") for i in items if i.strip()]
            else:
                d[parts_keys[-1]] = raw_val.strip("\"'")
        else:
            if raw_val.startswith("[") and raw_val.endswith("]"):
                items = raw_val[1:-1].split(",")
                result[key] = [i.strip().strip("\"'") for i in items if i.strip()]
            else:
                result[key] = raw_val.strip("\"'")

    return result


def parse_persona_doc(doc: str) -> Tuple[Dict[str, Any], str]:
    """
    解析 persona .md 文档。
    返回 (frontmatter_dict, body_text)。
    """
    if "---" not in doc:
        return {}, doc

    parts = doc.split("---", 2)
    if len(parts) < 3:
        return {}, doc

    fm = extract_frontmatter(doc)
    body = parts[2].strip()
    return fm, body


def _format_frontmatter(data: Dict[str, Any], indent: int = 2) -> str:
    """
    将 dict 格式化为 YAML frontmatter 字符串（轻量实现）。
    """
    lines = []
    spacer = " " * indent

    def _flatten(d: Dict[str, Any], prefix: str = "") -> List[str]:
        out: List[str] = []
        for k, v in d.items():
            key = f"{prefix}.{k}" if prefix else k
            if isinstance(v, dict):
                out.extend(_flatten(v, key))
            elif isinstance(v, list):
                if v:
                    out.append(f"{key}: [{', '.join(repr(str(x)) for x in v)}]")
                else:
                    out.append(f"{key}: []")
            elif isinstance(v, bool):
                out.append(f"{key}: {'true' if v else 'false'}")
            else:
                out.append(f"{key}: {repr(str(v))}")
        return out

    return "\n".join(_flatten(data))


# ---------------------------------------------------------------------------
# 生成 Persona .md 文件
# ---------------------------------------------------------------------------

def generate_persona_doc(
    mbti: str,
    city: str,
    interests: List[str],
    voice_text: str,
    user_id: str,
) -> Tuple[str, str, Path]:
    """
    生成 persona .md 文件（YAML frontmatter + body）。

    参数：
        mbti: MBTI 类型
        city: 城市 ID
        interests: 兴趣标签列表
        voice_text: 语音转文字内容
        user_id: 用户 ID

    返回：
        (doc_content, user_id, file_path)
    """
    from persona_generator import generate_persona_from_onboarding

    # 生成 persona 数据
    persona = generate_persona_from_onboarding(
        mbti=mbti,
        interests=interests,
        voice_text=voice_text,
        city=city,
    )

    persona_id = persona.get("persona_id") or f"persona-{mbti.lower()}-{uuid.uuid4().hex[:8]}"

    # 构建 frontmatter
    fm_data: Dict[str, Any] = {
        "mbti": mbti,
        "persona_id": persona_id,
        "name": persona.get("name", mbti),
        "travel_style": persona.get("travel_style", ""),
        "mbti_influence": persona.get("mbti_influence", ""),
        "confidence_score": persona.get("confidence_score", 0.5),
        "data_sources_used": persona.get("data_sources_used", []),
        "preferences": {
            "likes": interests,
            "dislikes": persona.get("preferences", {}).get("dislikes", [])
            if isinstance(persona.get("preferences"), dict)
            else [],
            "budget": (
                persona.get("preferences", {}).get("budget", "")
                if isinstance(persona.get("preferences"), dict)
                else ""
            ),
        },
    }

    # identity.content
    identity = persona.get("identity", {})
    if isinstance(identity, dict):
        fm_data["identity.content"] = identity.get("content", "")
        fm_data["identity.emoji"] = identity.get("emoji", "")

    # speaking_style
    ss = persona.get("speaking_style", {})
    if isinstance(ss, dict):
        fm_data["speaking_style.typical_phrases"] = ss.get("typical_phrases", [])
        fm_data["speaking_style.chat_tone"] = ss.get("chat_tone", "")

    # emotion_decision
    ed = persona.get("emotion_decision", {})
    if isinstance(ed, dict):
        fm_data["emotion_decision.stress_response"] = ed.get("stress_response", "")

    # social_behavior
    sb = persona.get("social_behavior", {})
    if isinstance(sb, dict):
        fm_data["social_behavior.social_style"] = sb.get("social_style", "")

    # 拼装 .md 内容
    fm_text = _format_frontmatter(fm_data)
    body_lines = [
        f"# {persona.get('name', mbti)} ({mbti})",
        "",
    ]

    # identity
    identity_content = identity.get("content", "") if isinstance(identity, dict) else str(identity)
    if identity_content:
        body_lines.append(f"## 身份层")
        body_lines.append(identity_content)
        body_lines.append("")

    # speaking_style
    if isinstance(ss, dict) and ss.get("typical_phrases"):
        body_lines.append("## 说话风格")
        for phrase in ss.get("typical_phrases", []):
            body_lines.append(f"- {phrase}")
        body_lines.append("")

    # emotion_decision
    if isinstance(ed, dict) and ed.get("stress_response"):
        body_lines.append("## 压力反应")
        body_lines.append(ed["stress_response"])
        body_lines.append("")

    doc = f"---\n{fm_text}\n---\n" + "\n".join(body_lines)

    # 写入文件
    path = _get_user_doc_path(user_id)
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(doc)

    return doc, user_id, path


# ---------------------------------------------------------------------------
# 读取 Persona .md 文件
# ---------------------------------------------------------------------------

def load_persona_doc(user_id: str) -> Optional[str]:
    """
    根据 user_id 读取已存在的 persona .md 文件内容。
    不存在时返回 None。
    """
    path = _get_user_doc_path(user_id)
    if not path.exists():
        return None
    try:
        with open(path, "r", encoding="utf-8") as f:
            return f.read()
    except Exception:
        return None


def dict_from_frontmatter(fm: Dict[str, Any], body: str) -> Dict[str, Any]:
    """
    将 frontmatter dict 转换为完整 persona dict。
    用于 get_persona() 接口。
    """
    result = dict(fm)

    # preferences 还原为 dict
    raw_prefs = fm.get("preferences")
    if isinstance(raw_prefs, dict):
        result["preferences"] = raw_prefs
    else:
        result["preferences"] = {
            "likes": fm.get("preferences.likes", []),
            "dislikes": fm.get("preferences.dislikes", []),
            "budget": fm.get("preferences.budget", ""),
        }

    # identity 还原
    if "identity.content" in fm or "identity.emoji" in fm:
        result["identity"] = {
            "content": fm.get("identity.content", ""),
            "emoji": fm.get("identity.emoji", "🤖"),
            "title": "身份层",
        }

    # speaking_style 还原
    if "speaking_style.typical_phrases" in fm:
        result["speaking_style"] = {
            "typical_phrases": fm.get("speaking_style.typical_phrases", []),
            "chat_tone": fm.get("speaking_style.chat_tone", ""),
        }

    # emotion_decision 还原
    if "emotion_decision.stress_response" in fm:
        result["emotion_decision"] = {
            "stress_response": fm.get("emotion_decision.stress_response", ""),
        }

    # social_behavior 还原
    if "social_behavior.social_style" in fm:
        result["social_behavior"] = {
            "social_style": fm.get("social_behavior.social_style", ""),
        }

    return result


def default_prefs_from_frontmatter(fm: Dict[str, Any]) -> Dict[str, Any]:
    """
    从 frontmatter 中提取 MING 算法所需的字段。
    用于 scoring.py 的兼容性评分。
    """
    prefs = fm.get("preferences", {})
    if isinstance(prefs, dict) and prefs:
        likes = prefs.get("likes", [])
        dislikes = prefs.get("dislikes", [])
        budget = prefs.get("budget", "")
    else:
        likes = fm.get("preferences.likes", [])
        dislikes = fm.get("preferences.dislikes", [])
        budget = fm.get("preferences.budget", "")

    return {
        "mbti": fm.get("mbti", ""),
        "travel_style": fm.get("travel_style", ""),
        "negotiation_style": fm.get("negotiation_style", ""),
        "likes": likes,
        "dislikes": dislikes,
        "budget": budget,
        "pace": fm.get("preferences.pace", ""),
    }


def get_persona_for_algorithm(user_id: str) -> Optional[Dict[str, Any]]:
    """
    获取用户 persona 用于 MING 六维度评分算法。
    返回 prefs dict，读取失败返回 None。
    """
    doc = load_persona_doc(user_id)
    if not doc:
        return None
    fm, _ = parse_persona_doc(doc)
    if not fm:
        return None
    return default_prefs_from_frontmatter(fm)


# ---------------------------------------------------------------------------
# Buddy .md 文件读取
# ---------------------------------------------------------------------------

def get_buddy_doc(buddy_id: str) -> Optional[str]:
    """
    读取搭子 prompt markdown 文件（buddy_01_prompt.md 等）。
    不存在时返回 None。
    """
    # 从 buddy_id 提取编号
    match = re.search(r"(\d+)", buddy_id)
    if not match:
        return None
    num = match.group(1).zfill(2)
    buddies_dir = Path(__file__).parent / "buddies"
    prompt_path = buddies_dir / f"buddy_{num}_prompt.md"
    if not prompt_path.exists():
        return None
    try:
        with open(prompt_path, "r", encoding="utf-8") as f:
            return f.read()
    except Exception:
        return None
