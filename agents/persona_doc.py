# -*- coding: utf-8 -*-
"""
agents/persona_doc.py — TwinBuddy Persona Document 核心模块

统一文档格式：
  ---
  # [YAML frontmatter — MING 算法读取]
  mbti: ENFP
  pace: 慢悠悠，睡到自然醒
  social_mode: group_oriented
  decision_style: spontaneous
  budget: 3000-5000元
  interests_like: [...]
  interests_dislike: [...]
  # [Markdown body — Agent 读取]
  ## 身份
  你是...
  ## 说话风格
  ...
  ---

职责：
  1. 调用 MiniMax LLM，根据 Onboarding 数据生成完整的 .md 文件
  2. 解析 .md 文件，提取 frontmatter（算法用）和 body（Agent 用）
  3. 文件持久化，服务器重启后仍可读
  4. 保持与现有 nodes.py / llm_nodes.py dict 接口的兼容

数据流：
  Onboarding → generate_persona_doc() → .md 文件
                                    ↓
  MING 算法 ← extract_frontmatter()   ← load_persona_doc()
  Agent     ← extract_body()
"""

from __future__ import annotations

import re
import uuid
from pathlib import Path
from typing import Any, Dict, List, Optional

import yaml

from backend.negotiation.llm_client import llm_client

# ── 路径配置 ────────────────────────────────────────────────────────────────

_AGENTS_DIR = Path(__file__).parent
_DATA_DIR = _AGENTS_DIR.parent / "data"
_PERSONAS_DIR = _DATA_DIR / "personas"


# ── Prompt 模板 ─────────────────────────────────────────────────────────────

PERSONA_GEN_SYSTEM = """你是一个人格蒸馏引擎，根据用户的旅行偏好数据，生成一份结构完整的人格文档。

文档必须严格分两部分：
1. YAML frontmatter（字段固定，供算法读取，不得删改字段名）
2. Markdown 正文（供 AI Agent 作为 system prompt 使用）

【格式要求】
- 文件以 --- 分隔两部分，第一部分是 YAML，第二部分是 Markdown
- YAML 只能包含 schema 中定义的字段，不能有额外字段
- Markdown 用 ## 标题分层，保持简洁但具体

【人格约束】
- 说话风格必须包含至少 2 个具体口头禅
- 底线和软偏好必须从用户自述（voice_text）中提取，不能凭空捏造
- 如果 voice_text 较短，从 MBTI 和 interests 推断
- 永远不要在 Markdown 里重复 frontmatter 的内容
"""


PERSONA_GEN_USER = """根据以下用户数据生成人格文档：

- MBTI：{mbti}
- 兴趣标签：{interests}
- 自述内容：{voice_text}
- 目的地城市：{city_name}

请生成完整的 YAML frontmatter + Markdown 正文。
YAML frontmatter 字段说明：
- mbti: MBTI类型，如 ENFP
- pace: 旅行节奏描述，20字以内，如"慢悠悠，睡到自然醒"
- social_mode: 社交偏好，group_oriented / solitude_oriented / balanced
- decision_style: 决策风格，spontaneous / analytical / empathetic / balanced
- budget: 预算区间，如"3000-5000元"
- interests_like: 喜欢的标签列表（从 interests 提取或推断）
- interests_dislike: 讨厌的标签列表（从 MBTI 类型推断）
- negotiation_style: 协商风格，soft_persuasion / logical / empathetic / flexible

Markdown 正文必须包含：
- ## 身份：具体的人设背景，3-5句
- ## 说话风格：口头禅2-3个，语气描述
- ## 情绪与决策：压力反应、决策方式
- ## 协商策略：如何说服TA，如何避免激怒TA
- ## 底线（不可妥协）：从 voice_text 提取的硬限制，1-3条
- ## 软偏好（可协商）：可以调整的偏好，1-3条

直接输出文档，不要任何解释。"""


# ── Frontmatter 解析 ────────────────────────────────────────────────────────

_FRONTMATTER_RE = re.compile(r"^---\s*\n(.*?)\n---\s*\n", re.DOTALL | re.MULTILINE)


def extract_frontmatter(doc: str) -> Dict[str, Any]:
    """
    从 .md 文档中提取 YAML frontmatter。

    Returns:
        dict，字段如 mbti / pace / social_mode 等。
        frontmatter 不存在或解析失败时返回空 dict。
    """
    m = _FRONTMATTER_RE.match(doc)
    if not m:
        return {}
    try:
        return yaml.safe_load(m.group(1)) or {}
    except yaml.YAMLError:
        return {}


def extract_body(doc: str) -> str:
    """从 .md 文档中提取 Markdown 正文（frontmatter 之后的内容）。"""
    m = _FRONTMATTER_RE.match(doc)
    if m:
        body = doc[m.end():].strip()
        return body if body else doc.strip()
    return doc.strip()


def parse_persona_doc(doc: str) -> tuple[Dict[str, Any], str]:
    """返回 (frontmatter_dict, body_markdown)。"""
    return extract_frontmatter(doc), extract_body(doc)


# ── Persona Dict 兼容层 ──────────────────────────────────────────────────────

def default_prefs_from_frontmatter(fm: Dict[str, Any]) -> Dict[str, Any]:
    """
    将 frontmatter 转换为 score_compatibility() 期望的 user_prefs 格式。

    字段映射：
      mbti           → mbti
      pace           → pace
      social_mode    → travel_style（转字符串）
      decision_style → negotiation_style
      budget         → budget
      interests_like → likes
      interests_dislike → dislikes
    """
    social_label = {
        "group_oriented": "社交活跃，喜欢和同伴一起探索",
        "solitude_oriented": "独处充电，偏爱安静旅行",
        "balanced": "平衡型，社交和独处皆可",
    }.get(fm.get("social_mode", ""), "")

    decision_label = {
        "spontaneous": "凭直觉做决定，不做成本收益分析，容易被有趣的事带跑",
        "analytical": "用数据和逻辑说服，立场坚定不易妥协",
        "empathetic": "用感受和价值观说服，温和但坚定，容易被真诚打动",
        "balanced": "理性感性兼顾，根据场景灵活调整",
    }.get(fm.get("decision_style", ""), "")

    return {
        "mbti": fm.get("mbti", ""),
        "likes": fm.get("interests_like", []),
        "dislikes": fm.get("interests_dislike", []),
        "budget": fm.get("budget", ""),
        "pace": fm.get("pace", ""),
        "travel_style": social_label,
        "negotiation_style": decision_label,
    }


def dict_from_frontmatter(fm: Dict[str, Any], body: str) -> Dict[str, Any]:
    """
    将 frontmatter + body 转换为 nodes.py / llm_nodes.py 期望的 dict 格式。
    保持与现有协商代码的向后兼容。
    """
    # 从 body 提取典型口头禅（找 - 开头的列表项）
    phrases = re.findall(r"^\s*[-*]\s*(.{5,40}?)\s*$", body, re.MULTILINE)
    typical_phrases = phrases[:3] if phrases else []

    # 从 body 提取底线
    hard_lines = []
    in_hard = False
    for line in body.split("\n"):
        if "底线" in line or "不可妥协" in line:
            in_hard = True
            continue
        if in_hard and line.strip().startswith("-"):
            hard_lines.append(line.strip("- *").strip())

    mbti = fm.get("mbti", "")
    label_map = {
        "ENFP": "热情开拓者", "ENFJ": "理想领袖", "ENTP": "智多星", "ENTJ": "指挥官",
        "ESFP": "舞台明星", "ESFJ": "主人", "ESTP": "创业者", "ESTJ": "总经理",
        "INFP": "诗意漫游者", "INFJ": "引路人", "INTP": "学者", "INTJ": "战略家",
        "ISFP": "艺术家", "ISFJ": "守护者", "ISTP": "工匠", "ISTJ": "审计师",
    }
    label = label_map.get(mbti, mbti)

    emoji_map = {
        "ENFP": "🌈", "ENFJ": "🌟", "ENTP": "⚡", "ENTJ": "🎯",
        "ESFP": "🎪", "ESFJ": "🤗", "ESTP": "🚀", "ESTJ": "📋",
        "INFP": "🌙", "INFJ": "🔮", "INTP": "📚", "INTJ": "🧠",
        "ISFP": "🎨", "ISFJ": "🛡️", "ISTP": "🔧", "ISTJ": "📐",
    }

    travel_styles = {
        "ENFP": "随性探索型", "ENFJ": "共鸣体验型", "ENTP": "智趣发现型", "ENTJ": "高效领航型",
        "ESFP": "活力即兴型", "ESFJ": "社交分享型", "ESTP": "冒险挑战型", "ESTJ": "计划执行型",
        "INFP": "心灵漫游型", "INFJ": "意义追寻型", "INTP": "深度研究型", "INTJ": "战略规划型",
        "ISFP": "艺术感知型", "ISFJ": "守护体验型", "ISTP": "独立探索型", "ISTJ": "秩序巡旅型",
    }

    decision_styles = {
        "spontaneous": "f-adaptive",
        "analytical": "t-cautious",
        "empathetic": "f-cautious",
        "balanced": "t-adaptive",
    }

    return {
        "persona_id": fm.get("persona_id", f"persona-{mbti.lower()}-{uuid.uuid4().hex[:8]}"),
        "name": fm.get("name", label),
        "mbti_type": mbti,
        "avatar_emoji": emoji_map.get(mbti, "🤖"),
        "travel_style": travel_styles.get(mbti, "随性探索型"),
        "speaking_style": {
            "chat_tone": fm.get("chat_tone", "自然随性"),
            "typical_phrases": typical_phrases,
        },
        "emotion_decision": {
            "decision_style": decision_styles.get(fm.get("decision_style", ""), "f-adaptive"),
        },
        "social_behavior": {
            "social_style": fm.get("social_mode", "group_oriented"),
        },
        "layer0_hard_rules": fm.get("hard_rules", []),
        "mbti_influence": f"MBTI={mbti}，{label}",
        "soul_fingerprint": fm.get("soul_fingerprint", f"twin-{mbti.lower()}-{uuid.uuid4().hex[:8]}"),
        # 兼容 score_compatibility 字段
        **default_prefs_from_frontmatter(fm),
    }


# ── 文件持久化 ──────────────────────────────────────────────────────────────

def _ensure_personas_dir() -> Path:
    _PERSONAS_DIR.mkdir(parents=True, exist_ok=True)
    return _PERSONAS_DIR


def persona_doc_path(user_id: str) -> Path:
    return _ensure_personas_dir() / f"{user_id}.md"


def save_persona_doc(user_id: str, doc: str) -> Path:
    """保存 persona .md 文件，返回路径。"""
    path = persona_doc_path(user_id)
    path.write_text(doc, encoding="utf-8")
    return path


def load_persona_doc(user_id: str) -> Optional[str]:
    """读取 persona .md 文件内容，不存在返回 None。"""
    path = persona_doc_path(user_id)
    if path.exists():
        return path.read_text(encoding="utf-8")
    return None


def persona_doc_exists(user_id: str) -> bool:
    return persona_doc_path(user_id).exists()


# ── 核心生成 ────────────────────────────────────────────────────────────────

def generate_persona_doc(
    mbti: str,
    interests: Optional[List[str]] = None,
    city: str = "",
    voice_text: str = "",
    user_id: Optional[str] = None,
) -> tuple[str, str, Path]:
    """
    调用 MiniMax LLM，根据 Onboarding 数据生成完整的 persona .md 文件。

    Args:
        mbti: MBTI 类型，如 "ENFP"
        interests: 兴趣标签列表
        city: 目的地城市 ID
        voice_text: 用户语音转文字的自述
        user_id: 可选，用于直接保存文件

    Returns:
        (doc_content, user_id, file_path)
        如果 LLM 调用失败，doc_content 为空字符串

    数据流：
        generate_persona_doc()
              ↓
        MiniMax LLM（PERSONA_GEN_USER prompt）
              ↓
        完整 .md 文本（YAML frontmatter + Markdown body）
              ↓
        save_persona_doc(user_id, doc)
    """
    import logging
    logger = logging.getLogger("twinbuddy.persona_gen")

    interests = interests or []
    mbti = mbti.strip().upper()
    if len(mbti) < 4:
        mbti = "ENFP"

    _CITY_NAMES = {
        "chengdu": "成都", "chongqing": "重庆", "dali": "大理",
        "lijiang": "丽江", "huangguoshu": "黄果树", "xian": "西安",
        "qingdao": "青岛", "guilin": "桂林", "harbin": "哈尔滨", "xiamen": "厦门",
    }
    city_name = _CITY_NAMES.get(city.lower(), city or "大理")
    interests_str = "、".join(interests[:5]) if interests else "未选择"
    voice_str = voice_text.strip() if voice_text else "无"

    uid = user_id or str(uuid.uuid4())

    # 组装 prompt
    user_prompt = PERSONA_GEN_USER.format(
        mbti=mbti,
        interests=interests_str,
        voice_text=voice_str,
        city_name=city_name,
    )

    try:
        raw = llm_client.chat(user_prompt, system_prompt=PERSONA_GEN_SYSTEM)
        if not raw or len(raw) < 100:
            logger.warning("LLM 返回过短，跳过保存: %s", raw[:100] if raw else "(空)")
            return "", uid, Path("")

        # 清理：移除可能的 markdown 代码块包裹
        clean = raw.strip()
        if clean.startswith("```markdown"):
            clean = clean[len("```markdown"):].strip()
        elif clean.startswith("```"):
            clean = re.sub(r"^```[^\n]*\n", "", clean, count=1)
        if clean.endswith("```"):
            clean = clean[:-3].strip()

        # 补充 persona_id 和 soul_fingerprint 到 frontmatter
        fm = extract_frontmatter(clean)
        fm.setdefault("mbti", mbti)
        fm.setdefault("persona_id", f"persona-{mbti.lower()}-{uid[:8]}")
        fm.setdefault("soul_fingerprint", f"twin-{mbti.lower()}-{uid[:8]}")

        # 重新组装文档
        fm_yaml = yaml.dump(fm, allow_unicode=True, default_flow_style=False, sort_keys=False)
        body = extract_body(clean)
        doc = f"---\n{fm_yaml}---\n\n{body}"

        # 保存
        path = save_persona_doc(uid, doc)
        logger.info("Persona 文档生成成功 | user_id=%s | mbti=%s | path=%s", uid, mbti, path)
        return doc, uid, path

    except Exception as exc:
        logger.error("LLM 生成 persona 失败: %s", exc)
        return "", uid, Path("")


# ── 统一读取 API（供 MING 算法和 Agent 使用）────────────────────────────────

def get_persona_for_algorithm(user_id: str) -> Optional[Dict[str, Any]]:
    """
    返回适合 MING score_compatibility() 的 user_prefs dict。
    从 persona .md 文件读取，不存在返回 None。
    """
    doc = load_persona_doc(user_id)
    if not doc:
        return None
    fm = extract_frontmatter(doc)
    if not fm:
        return None
    return default_prefs_from_frontmatter(fm)


def get_persona_dict(user_id: str) -> Optional[Dict[str, Any]]:
    """
    返回适合 nodes.py / llm_nodes.py 的完整 persona dict。
    从 persona .md 文件读取，自动从 body 补充字段。
    """
    doc = load_persona_doc(user_id)
    if not doc:
        return None
    fm, body = parse_persona_doc(doc)
    if not fm:
        return None
    return dict_from_frontmatter(fm, body)


def get_persona_md(user_id: str) -> Optional[str]:
    """返回完整的 persona .md 文件内容（供 Agent 直接作为 system prompt 使用）。"""
    return load_persona_doc(user_id)


# ── Buddy .md 文件兼容 ──────────────────────────────────────────────────────

def get_buddy_doc(buddy_id: str) -> Optional[str]:
    """
    读取 buddy 的 .md 文件（YAML frontmatter + Markdown body）。
    如果 .md 不存在，尝试从现有的 JSON + _prompt.md 合并（向后兼容）。
    返回 None 如果完全不存在。
    """
    from agents.buddies import BUDDIES_DIR, get_buddy_prompt as _get_md_prompt

    # 从 buddy_id 提取编号
    m = re.search(r"(\d+)", buddy_id)
    if not m:
        return None
    num = m.group(1).lstrip("0") or "1"
    # 尝试 buddy_XX.md
    md_path = BUDDIES_DIR / f"buddy_{num}.md"
    if md_path.exists():
        return md_path.read_text(encoding="utf-8")

    # 回退：合并现有 JSON + _prompt.md
    from agents.buddies import get_buddy_by_id as _get_json_buddy
    buddy = _get_json_buddy(buddy_id)
    if not buddy:
        return None
    prompt_md = _get_md_prompt(buddy_id)
    if prompt_md:
        # 从 JSON 构建 frontmatter
        prefs = buddy.get("preferences", {})
        budget = prefs.get("budget", "")
        fm = {
            "mbti": buddy.get("mbti", ""),
            "pace": prefs.get("pace", ""),
            "social_mode": _infer_social_mode(buddy.get("travel_style", "")),
            "decision_style": _infer_decision_style(buddy.get("negotiation_style", "")),
            "budget": budget,
            "interests_like": prefs.get("likes", []),
            "interests_dislike": prefs.get("dislikes", []),
        }
        fm_yaml = yaml.dump(fm, allow_unicode=True, default_flow_style=False)
        return f"---\n{fm_yaml}---\n\n{prompt_md}"

    return None


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
    if any(k in s for k in ["直觉", "随性", "即兴", "弹性", " spontan"]):
        return "spontaneous"
    return "balanced"
