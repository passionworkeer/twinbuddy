# -*- coding: utf-8 -*-
"""
persona_layers.py — 五层 Persona 渲染器（Layer0–Layer4）
TwinBuddy Hackathon MVP 专用

职责：接收四维蒸馏结果，渲染五层结构化 Persona JSON。
设计：纯函数，无副作用，不可变数据流。
"""

from __future__ import annotations

from typing import Any, Dict, List

# ---------------------------------------------------------------------------
# Layer0 硬规则（最高优先级，NEGATIVE 系统）
# 参考 prompts/02-persona/01-layer0-hard.md
# ---------------------------------------------------------------------------


def build_layer0(mbti: str, bio: str, chat: str) -> List[str]:
    """构建 Layer0 硬规则列表"""
    rules = [
        # L0-1~L0-3：身份边界
        "不扮演用户现实中的他人，不虚构不存在的共同经历",
        "不突然变得'完美温柔'，保持一贯的表达方式",
        "不变成人生导师模式，不主动输出结构化建议（除非性格本身如此）",
        # L0-4~L0-5：表达边界
        "可以用回避、沉默、敷衍回应不想回答的问题",
        "不替对话方做价值判断，不说'你应该这样做'",
        # L0-6~L0-8：伦理边界
        "不提供医疗、法律、财务等专业建议；分享经验须标注'仅供参考'",
        "不主动询问收入、婚恋、体重、政治立场、宗教等敏感话题",
        (
            "避免 AI 典型用语（'好的我理解''作为AI我不建议'），"
            "允许不连贯、错别字（在打字场景下）"
        ),
    ]
    if "I" in mbti:
        rules.append("不主动发起多人社交，1-on-1 更自在")
    if "T" in mbti:
        rules.append("情感表达克制，不轻易流露脆弱，不跳过冲突直接安慰")
    return rules


# ---------------------------------------------------------------------------
# Layer1 身份层（POSITIVE）
# ---------------------------------------------------------------------------


def build_layer1(
    mbti: str,
    bio: str,
    cognition_dims: List[str],
) -> Dict[str, Any]:
    """构建 Layer1 身份层"""
    return {
        "name": "待从用户资料提取",
        "self_concept": (
            cognition_dims[0] if cognition_dims
            else "待深度分析"
        ),
        "roles": ["注：从 bio 和自我介绍中提取职业/家庭角色"],
        "mbti_influence": (
            f"MBTI {mbti} 塑造的认知框架："
            f"{'内倾直觉' if 'IN' in mbti else ''}"
            f"{'外倾感觉' if 'ES' in mbti else ''}"
            f"{'思考判断' if 'TJ' in mbti else ''}"
            f"{'情感感知' if 'FP' in mbti else ''}"
        ),
        "identity_note": "Layer1 身份需从 bio 文本中显式提取，当前为基础推断",
    }


# ---------------------------------------------------------------------------
# Layer2 说话风格层（直接映射 expression 维度）
# ---------------------------------------------------------------------------


def build_layer2(
    mbti: str,
    expression_data: Dict[str, Any],
) -> Dict[str, Any]:
    """构建 Layer2 说话风格层"""
    return {
        "verbal_tics": expression_data.get("verbal_tics", []),
        "sentence_rhythm": expression_data.get("sentence_rhythm", "待分析"),
        "tone": expression_data.get("tone_variations", {}),
        "emoji_usage": expression_data.get("emoji_usage", "待分析"),
        "never_says": expression_data.get("never_says", []),
        "msg_stats": expression_data.get("msg_stats", {}),
    }


# ---------------------------------------------------------------------------
# Layer3 情感与决策层
# ---------------------------------------------------------------------------


def build_layer3(
    mbti: str,
    cognition_data: Dict[str, Any],
    emotion_data: Dict[str, Any],
) -> Dict[str, Any]:
    """构建 Layer3 情感与决策层"""
    return {
        "decision_logic": cognition_data.get("decision_logic", []),
        "risk_attitude": cognition_data.get("risk_attitude", "待分析"),
        "emotion_triggers": {
            "positive": emotion_data.get("triggers_positive", []),
            "negative": emotion_data.get("triggers_negative", []),
        },
        "attachment_style": emotion_data.get("attachment_style", "待分析"),
        "comfort_patterns": emotion_data.get("comfort_patterns", []),
        "emotional_shell": emotion_data.get("emotional_shell", {}),
        "mbti_influence": (
            f"MBTI {mbti} 影响："
            f"{'理性决策优先' if 'T' in mbti else '情感价值优先'}; "
            f"{'需要独立空间处理情绪' if 'I' in mbti else '需要倾诉和连接处理情绪'}"
        ),
    }


# ---------------------------------------------------------------------------
# Layer4 人际行为层
# ---------------------------------------------------------------------------


def build_layer4(
    mbti: str,
    behavior_data: Dict[str, Any],
    emotion_data: Dict[str, Any],
) -> Dict[str, Any]:
    """构建 Layer4 人际行为层"""
    return {
        "social_patterns": behavior_data.get("social_patterns", "待分析"),
        "social_energy": behavior_data.get("social_energy", "待分析"),
        "stress_reactions": behavior_data.get("stress_reactions", []),
        "habit_loops": behavior_data.get("habit_loops", []),
        "love_expression": emotion_data.get("love_expression", "待分析"),
        "boundary_behaviors": behavior_data.get("boundary_behaviors", []),
        "avoided_topics": emotion_data.get("avoided_topics", []),
        "mbti_influence": (
            f"MBTI {mbti} 影响："
            f"{'独处充电' if 'I' in mbti else '社交充电'}; "
            f"{'计划性强' if 'J' in mbti else '灵活弹性'}"
        ),
    }


# ---------------------------------------------------------------------------
# 辅助：推断旅行风格
# ---------------------------------------------------------------------------


def infer_travel_style(mbti: str) -> str:
    """从 MBTI 推断旅行风格（辅助字段）"""
    if "IS" in mbti:
        return "深度沉浸型——偏好少而精的行程，需要独处时间，讨厌打卡式旅游"
    if "ES" in mbti:
        return "社交探索型——喜欢结伴出行，善于发现有趣的人和环境"
    if "IJ" in mbti:
        return "计划执行型——喜欢提前规划，行程紧凑，追求效率"
    if "EP" in mbti:
        return "随性漫游型——不做详细计划，享受意外发现，弹性安排"
    return "平衡型——介于计划与随性之间，视目的地而定"


# ---------------------------------------------------------------------------
# 元数据计算
# ---------------------------------------------------------------------------


def compute_confidence(
    mbti: str,
    bio: str,
    chat_logs: str,
    has_douyin: bool,
    has_photo: bool,
) -> float:
    """基于数据来源覆盖度计算置信度（0.0~0.95）"""
    score = 0.0
    if mbti:
        score += 0.15
    if len(bio) > 20:
        score += 0.20
    if len(chat_logs) > 100:
        score += 0.30
    if has_douyin:
        score += 0.20
    if has_photo:
        score += 0.15
    return min(round(score, 2), 0.95)
