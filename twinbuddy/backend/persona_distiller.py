# -*- coding: utf-8 -*-
"""
persona_distiller.py — 四维蒸馏引擎（cognition / expression / behavior / emotion）
TwinBuddy Hackathon MVP 专用

职责：接收原始数据（MBTI / bio / chat），返回各维度结构化蒸馏结果。
设计：纯函数，无副作用，不可变数据流。
"""

from __future__ import annotations

import re
from typing import Any, Dict, List

# ---------------------------------------------------------------------------
# MBTI 维度解释表
# ---------------------------------------------------------------------------

MBTI_INTERPRETATIONS: Dict[str, Dict[str, str]] = {
    "I": {"cognition": "内倾型认知，决策依赖内部框架而非外部反馈",
          "behavior": "独处充电，社交后需要恢复时间"},
    "E": {"cognition": "外倾型认知，从外部互动中获取能量和想法",
          "behavior": "社交充电，独处太久会低落"},
    "N": {"cognition": "直觉型思维，偏好抽象和可能性，不拘泥于具体事实",
          "expression": "表达偏概念性，喜欢用隐喻和联想"},
    "S": {"cognition": "感觉型认知，注重具体可观测的细节",
          "expression": "表达偏向具体，描述贴近现实"},
    "T": {"cognition": "思考型决策，优先逻辑和客观标准",
          "emotion": "情感表达克制，不轻易流露脆弱"},
    "F": {"cognition": "情感型决策，优先价值观和人际和谐",
          "emotion": "共情能力强，情感表达丰富"},
    "J": {"behavior": "判断型作息，生活有计划，喜欢确定性",
          "expression": "表达偏结构化，偏好清晰结论"},
    "P": {"behavior": "感知型作息，灵活随性，享受开放性",
          "expression": "表达偏开放，保留余地，不急于下定论"},
}

# 常见口头禅列表（用于从聊天记录中匹配）
VERBAL_TICS_CANDIDATES = [
    "嗯", "啊", "呃", "这个", "就是说", "其实", "好吧",
    "感觉", "大概", "可能吧", "应该", "说实话", "卧槽",
    "绝了", "可以的", "厉害了", "笑死",
]

# ---------------------------------------------------------------------------
# 工具函数（纯函数）
# ---------------------------------------------------------------------------


def _mbti_to_dimensions(mbti: str) -> Dict[str, List[str]]:
    """将 MBTI 四字母翻译为多维度标签列表"""
    mapping: Dict[str, List[str]] = {
        "cognition": [], "expression": [], "behavior": [], "emotion": []
    }
    for letter, interpretations in MBTI_INTERPRETATIONS.items():
        if letter in mbti:
            for dim, desc in interpretations.items():
                if dim in mapping:
                    mapping[dim].append(desc)
    return mapping


def _chat_stats(chat_text: str) -> Dict[str, Any]:
    """从聊天记录文本提取统计特征"""
    if not chat_text:
        return {"total_chars": 0, "msg_count": 0, "avg_len": 0,
                "has_emoji": False, "exclamation_ratio": 0.0}
    lines = [l.strip() for l in chat_text.splitlines() if l.strip()]
    total_chars = sum(len(l) for l in lines)
    exclamation_count = sum(1 for c in chat_text if c in ("！", "!"))
    emoji_pattern = re.compile(
        r"[\U0001F600-\U0001F64F\U0001F300-\U0001F5FF"
        r"\U0001F680-\U0001F6FF\U0001F1E0-\U0001F1FF]"
    )
    return {
        "total_chars": total_chars,
        "msg_count": len(lines),
        "avg_len": round(total_chars / max(len(lines), 1), 1),
        "has_emoji": bool(emoji_pattern.search(chat_text)),
        "exclamation_ratio": round(exclamation_count / max(len(chat_text), 1), 4),
    }


def _extract_verbal_tics(text: str) -> List[str]:
    """从文本中提取高频词作为口头禅候选"""
    if not text:
        return []
    found = []
    for filler in VERBAL_TICS_CANDIDATES:
        count = text.count(filler)
        if count >= 2:
            found.append(f"{filler}（出现约{count}次）")
    return found[:6]


# ---------------------------------------------------------------------------
# 四维蒸馏函数
# ---------------------------------------------------------------------------


def distill_cognition(mbti: str, bio: str, chat: str) -> Dict[str, Any]:
    """
    蒸馏认知维度（Cognition）
    覆盖：决策逻辑 / 因果推理 / 价值排序 / 风险态度 / 自我对话 / 核心矛盾
    """
    dims = _mbti_to_dimensions(mbti)
    is_thinker = "T" in mbti
    reasoning_style = "逻辑驱动型" if is_thinker else "价值驱动型"

    top_values = []
    if "F" in mbti:
        top_values.append({"rank": 1, "value": "人际关系与和谐", "evidence": "F维度"})
    if "T" in mbti:
        top_values.append({"rank": 1, "value": "逻辑一致性与自主判断", "evidence": "T维度"})
    if "N" in mbti:
        top_values.append({"rank": 2, "value": "可能性与成长", "evidence": "N维度"})
    if "S" in mbti:
        top_values.append({"rank": 2, "value": "稳定与安全感", "evidence": "S维度"})
    top_values.sort(key=lambda x: x["rank"])

    return {
        "decision_logic": [
            f"决策风格：{reasoning_style}，优先考虑{'逻辑标准' if is_thinker else '情感价值'}",
            f"信息来源偏好：{'自主判断' if 'I' in mbti else '外部反馈收集'}（MBTI I/E维度）",
            "注：以上为基于MBTI的推断，需聊天记录深度分析以提升置信度",
        ],
        "causal_reasoning": [
            f"归因倾向：{'内归因优先' if 'I' in mbti else '外归因优先'}（MBTI I/E维度）",
            f"推理模式：{'直觉跳跃式' if 'N' in mbti else '经验归纳式'}（MBTI N/S维度）",
        ],
        "value_priority": top_values,
        "risk_attitude": "偏保守" if "S" in mbti and "J" in mbti else "适度冒险",
        "self_dialogue": [
            f"典型内心独白模式：{', '.join(dims.get('cognition', [])[:2]) or '待从聊天记录提取'}"
        ],
        "core_contradiction": "待从完整素材中识别（需 LLM 深度分析）",
        "mbti_dimension_evidence": dims.get("cognition", []),
        "confidence_note": "基础推断；深度认知矛盾需 LLM 调用",
    }


def distill_expression(mbti: str, bio: str, chat: str) -> Dict[str, Any]:
    """
    蒸馏表达维度（Expression）
    覆盖：口头禅 / 句式节奏 / 语气变化 / emoji使用 / 语言混用 / 绝对不会说
    """
    stats = _chat_stats(chat)
    tics = _extract_verbal_tics(chat)

    avg_len = stats["avg_len"]
    if avg_len < 20:
        rhythm = "碎片短句型——消息短促，一条一个意思，喜欢连续发多条"
    elif avg_len < 60:
        rhythm = "中等长度——表达完整但不啰嗦，节奏适中"
    else:
        rhythm = "长句输出型——喜欢一条说完整件事，逻辑清晰"

    emoji_usage = "常用emoji，表情丰富" if stats["has_emoji"] else "较少使用emoji，文字为主"
    if stats["exclamation_ratio"] > 0.02:
        emoji_usage += "，感叹号使用较多，情绪表达强烈"

    return {
        "verbal_tics": tics,
        "sentence_rhythm": rhythm,
        "tone_variations": {
            "casual": "日常闲聊语气" if "E" in mbti else "偏内敛，话说得不急",
            "late_night": "深夜模式：词风变慢变深，更容易流露真实情绪",
            "stressed": "压力下语气变急/变短，或转向独处沉默",
        },
        "emoji_usage": emoji_usage,
        "language_mixing": "待从聊天记录中提取（中英混用/方言/网络用语）",
        "never_says": [
            "注：'绝对不会说'需从大量聊天记录中对比得出，暂由规则推断",
            "不主动说空洞的鼓励话（除非性格本身如此）",
        ],
        "msg_stats": stats,
        "confidence_note": "基础推断；精确口头禅和语气差异需 LLM 调用",
    }


def distill_behavior(mbti: str, bio: str, chat: str) -> Dict[str, Any]:
    """
    蒸馏行为维度（Behavior）
    覆盖：日常节律 / 应激反应 / 社交模式 / 习惯循环 / 边界行为 / 社交能量
    """
    dims = _mbti_to_dimensions(mbti)
    is_introvert = "I" in mbti

    if is_introvert:
        social_energy = "独处充电型——社交后需要独处时间恢复，不是不合群"
        social_pattern = "偏被动响应型，不主动发起群聊，1-on-1 更自在"
    else:
        social_energy = "社交充电型——从互动中获取能量"
        social_pattern = "主动发起型，是气氛担当，不惧冷场"

    if "J" in mbti:
        habit_loops = [
            {"name": "计划执行", "cue": "任务确立", "behavior": "列清单/按计划执行",
             "reward": "秩序感与完成满足", "freq": "每日"},
        ]
    else:
        habit_loops = [
            {"name": "弹性探索", "cue": "兴趣触发", "behavior": "灵活尝试，不拘泥计划",
             "reward": "新鲜感与自由感", "freq": "不定"},
        ]

    return {
        "daily_rhythm": [
            "注：精确节律需从聊天时间戳数据中提取",
            f"社交时间倾向：{'偏晚（夜猫子）' if 'N' in mbti else '偏早（早起型）'}",
        ],
        "stress_reactions": [
            f"典型应激：{'整理/规划行动' if 'J' in mbti else '情绪表达/倾诉'}（MBTI J/P维度）",
        ],
        "social_patterns": social_pattern,
        "habit_loops": habit_loops,
        "boundary_behaviors": [
            "注：边界行为需从具体冲突场景中提取，暂为规则性推断",
        ],
        "social_energy": social_energy,
        "mbti_dimension_evidence": dims.get("behavior", []),
        "confidence_note": "基础推断；精确行为模式需 LLM 调用",
    }


def distill_emotion(mbti: str, bio: str, chat: str) -> Dict[str, Any]:
    """
    蒸馏情感维度（Emotion）
    覆盖：情绪触发器 / 依恋模式 / 安抚方式 / 爱的表达 / 情感外壳 / 核心锚点 / 回避话题
    """
    dims = _mbti_to_dimensions(mbti)
    is_feeler = "F" in mbti

    if "I" in mbti and "J" in mbti:
        attachment = "偏回避型——注重独立空间，不习惯频繁确认关系"
    elif "E" in mbti and "F" in mbti:
        attachment = "偏焦虑型——需要频繁连接，在意对方回应"
    else:
        attachment = "偏安全型——能自在亲近，也能接受距离"

    shell = "理性外壳——用逻辑和解决问题来代替情感表达" if "T" in mbti \
        else "情绪外壳——表面可能轻松，内在敏感，信任后才流露"

    return {
        "triggers_positive": ["被认可/被记住细节", "完成有挑战的事"],
        "triggers_negative": ["被忽视/被冷落", "被否定", "失去控制感"],
        "attachment_style": attachment,
        "comfort_patterns": [
            "注：精确安抚方式需从大量记录中提取，暂为规则性推断",
            f"可能的安抚：{'倾诉型' if is_feeler else '独处/行动型'}（MBTI T/F维度）",
        ],
        "love_expression": "注：需从关系互动记录中提取，暂无法从基础信息判断",
        "emotional_shell": {
            "surface": shell,
            "inner": "待从深度素材中提取真实内在情感状态",
        },
        "core_anchors": {
            "highlights": ["注：需从叙事材料中提取核心高光时刻"],
            "wounds": ["注：需从叙事材料中提取，标注'回避深度挖掘'"],
        },
        "avoided_topics": ["注：需从回避行为中提取，暂无法推断"],
        "mbti_dimension_evidence": dims.get("emotion", []),
        "confidence_note": "基础推断；精确情感模式需 LLM 调用",
    }
