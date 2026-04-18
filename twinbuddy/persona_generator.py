# -*- coding: utf-8 -*-
"""
persona_generator.py — TwinBuddy 用户 Persona LLM 生成器

优先级：
  1. MiniMax LLM 生成（实时）
  2. Fallback：规则映射（MBTI + interests）

导出：
  generate_persona_from_onboarding(mbti, interests, voice_text, city) -> dict
"""

from __future__ import annotations

import os
from typing import Any, Dict, List, Optional

# ---------------------------------------------------------------------------
# LLM Client（懒加载）
# ---------------------------------------------------------------------------


def _get_llm_client():
    """延迟导入，避免循环依赖"""
    try:
        from agents.llm_client import llm_client
        return llm_client
    except ImportError:
        return None


# ---------------------------------------------------------------------------
# MBTI 基础数据
# ---------------------------------------------------------------------------

_MBTI_LABELS: Dict[str, str] = {
    "ENFP": "热情开拓者", "ENFJ": "理想领袖", "ENTP": "智多星", "ENTJ": "指挥官",
    "ESFP": "舞台明星", "ESFJ": "主人", "ESTP": "创业者", "ESTJ": "总经理",
    "INFP": "诗意漫游者", "INFJ": "引路人", "INTP": "学者", "INTJ": "战略家",
    "ISFP": "艺术家", "ISFJ": "守护者", "ISTP": "工匠", "ISTJ": "审计师",
}

_MBTI_KEYWORDS: Dict[str, str] = {
    "ENFP": "热情创意", "ENFJ": "理想共鸣", "ENTP": "智趣探索", "ENTJ": "果断领航",
    "ESFP": "活力即兴", "ESFJ": "温暖关怀", "ESTP": "行动冒险", "ESTJ": "务实执行",
    "INFP": "内在追寻", "INFJ": "深度理解", "INTP": "理性思辨", "INTJ": "战略布局",
    "ISFP": "细腻感知", "ISFJ": "守护温暖", "ISTP": "独立解决", "ISTJ": "可靠秩序",
}

_TRAVEL_STYLES: Dict[str, str] = {
    "ENFP": "随性探索型", "ENFJ": "共鸣体验型", "ENTP": "智趣发现型", "ENTJ": "高效领航型",
    "ESFP": "活力即兴型", "ESFJ": "社交分享型", "ESTP": "冒险挑战型", "ESTJ": "计划执行型",
    "INFP": "心灵漫游型", "INFJ": "意义追寻型", "INTP": "深度研究型", "INTJ": "战略规划型",
    "ISFP": "艺术感知型", "ISFJ": "守护体验型", "ISTP": "独立探索型", "ISTJ": "秩序巡旅型",
}

_MBTI_EMOJI: Dict[str, str] = {
    "ENFP": "🌈", "ENFJ": "🌟", "ENTP": "⚡", "ENTJ": "🎯",
    "ESFP": "🎪", "ESFJ": "🤗", "ESTP": "🚀", "ESTJ": "📋",
    "INFP": "🌙", "INFJ": "🔮", "INTP": "📚", "INTJ": "🧠",
    "ISFP": "🎨", "ISFJ": "🛡️", "ISTP": "🔧", "ISTJ": "📐",
}

# ---------------------------------------------------------------------------
# MBTI 维度映射
# ---------------------------------------------------------------------------

_TYPICAL_PHRASES: Dict[str, List[str]] = {
    "ENFP": ["哇塞！", "冲冲冲！", "说走就走！"],
    "ISTJ": ["按计划执行", "安全第一", "守时很重要"],
    "INFP": ["这里好安静", "慢慢来", "想在这儿多待会儿"],
    "ENTJ": ["效率第一！", "目标明确就出发", "听我安排"],
    "ESFP": ["太有趣了！", "快拍照！", "晚上去哪儿嗨"],
    "INTP": ["让我想想", "这个逻辑上……", "其实有另一种可能"],
    "ISFP": ["好美啊", "这个颜色我喜欢", "好舒服的感觉"],
    "ENTP": ["诶等等，我有个新想法！", "我们来开个脑洞", "换个角度看看"],
    "default": ["我觉得", "嗯……", "有道理"],
}

_STRESS_RESPONSES: Dict[str, str] = {
    "ENFP": "情绪波动大但恢复快，容易被新事物转移注意力",
    "ISTJ": "焦虑但克制，会坚持按计划执行",
    "INFP": "内心压力大但表面温和，容易妥协以维持和谐",
    "ENTJ": "压力转化为行动力，目标导向更强",
    "ESFP": "当场释放情绪，很快翻篇",
    "INTP": "用逻辑处理压力，陷入过度分析",
    "ISFP": "情绪写在脸上，需要独处消化",
    "ENTP": "把压力当挑战，越压越兴奋",
    "default": "保持冷静，理性应对",
}

_SOCIAL_STYLES: Dict[str, str] = {
    "ENFP": "极度外向，社交充电，主动发起对话",
    "ISTJ": "内向但有责任感，在熟悉范围内主动",
    "INFP": "内向深度型，被动但真诚，重质不重量",
    "ENTJ": "领导型，主动掌控场面，决策迅速",
    "ESFP": "活力社交型，人越多越兴奋，气氛担当",
    "INTP": "选择性社交，独立思考，需要独处恢复",
    "ISFP": "被动温和，喜欢小圈子，讨厌冲突",
    "ENTP": "辩论型社交，知识分享为主，不喜欢太感性",
    "default": "平衡型社交，需要时主动，独处也舒适",
}


def _parse_mbti(mbti: str) -> Dict[str, str]:
    mbti = mbti.strip().upper()
    if len(mbti) < 4:
        mbti = "ENFP"
    return {
        "energy": mbti[0],      # E/I
        "info": mbti[1],        # N/S
        "decision": mbti[2],    # T/F
        "lifestyle": mbti[3],  # J/P
    }


def _build_persona_fallback(
    mbti: str,
    interests: List[str],
    voice_text: str,
    city: str,
) -> Dict[str, Any]:
    """Fallback：纯规则生成（无 LLM 时使用）"""
    mbti = mbti.strip().upper()
    if len(mbti) < 4:
        mbti = "ENFP"
    label = _MBTI_LABELS.get(mbti, mbti)
    keyword = _MBTI_KEYWORDS.get(mbti, "")
    travel_style = _TRAVEL_STYLES.get(mbti, "随性探索型")
    emoji = _MBTI_EMOJI.get(mbti, "🤖")
    phrases = _TYPICAL_PHRASES.get(mbti, _TYPICAL_PHRASES["default"])
    stress = _STRESS_RESPONSES.get(mbti, _STRESS_RESPONSES["default"])
    social = _SOCIAL_STYLES.get(mbti, _SOCIAL_STYLES["default"])

    # 整合 interests 到 content
    interest_str = ""
    if interests:
        interest_str = f"，热爱{','.join(interests[:3])}"

    return {
        "identity": {
            "title": "身份层",
            "content": f"你是{label}（{mbti}），{keyword}{interest_str}。",
            "emoji": emoji,
        },
        "speaking_style": {
            "title": "说话风格",
            "content": f"基于MBTI={mbti}的典型说话方式",
            "emoji": "💬",
            "typical_phrases": phrases,
            "chat_tone": "符合MBTI特征",
        },
        "emotion_decision": {
            "title": "情绪与决策",
            "content": f"压力反应：{stress}",
            "emoji": "💭",
            "stress_response": stress,
            "decision_style": f"{mbti[2]}-{'理性' if mbti[2] == 'T' else '感性'}决策",
        },
        "social_behavior": {
            "title": "社交行为",
            "content": f"社交风格：{social}",
            "emoji": "🤝",
            "social_style": social,
        },
        "travel_style": travel_style,
        "mbti_influence": f"MBTI={mbti}，{label}，{keyword}。旅行风格：{travel_style}。",
        "confidence_score": 0.65,
        "data_sources_used": ["mbti", "fallback"],
    }


# ---------------------------------------------------------------------------
# LLM 生成
# ---------------------------------------------------------------------------

LLM_SYSTEM_PROMPT = """你是一个专业的人格分析师，输出JSON格式的用户旅行人格描述。

输出格式：
{
  "identity": {"title":"身份层","Content":"...","emoji":"🤖"},
  "speaking_style": {"title":"说话风格","Content":"...","emoji":"💬","typical_phrases":["..."],"chat_tone":"..."},
  "emotion_decision": {"title":"情绪与决策","Content":"...","emoji":"💭","stress_response":"...","decision_style":"..."},
  "social_behavior": {"title":"社交行为","Content":"...","emoji":"🤝","social_style":"..."}
}

注意：只输出JSON，不要有其他文字。"""

LLM_USER_TEMPLATE = """分析以下用户的人格特征，生成完整的旅行人格描述：

- MBTI：{mbti}
- 兴趣标签：{interests}
- 城市：{city}
- 语音描述：{voice_text}

请生成符合这个MBTI类型特征、且融合了兴趣标签和城市偏好的完整人格描述。"""


def generate_persona_from_onboarding(
    mbti: str,
    interests: List[str],
    voice_text: str,
    city: str,
) -> Optional[Dict[str, Any]]:
    """
    根据 Onboarding 数据生成用户 Persona。

    优先使用 MiniMax LLM 生成。
    LLM 不可用时 fallback 到规则生成。
    """
    mbti = mbti.strip().upper() if mbti else "ENFP"
    interests = interests or []
    voice_text = voice_text or ""
    city = city or ""

    llm = _get_llm_client()

    if llm is not None:
        try:
            interests_str = "、".join(interests) if interests else "未选择"
            city_display = {"chengdu": "成都", "chongqing": "重庆", "dali": "大理",
                            "lijiang": "丽江", "xian": "西安", "qingdao": "青岛",
                            "xiamen": "厦门"}.get(city, city)

            user_msg = LLM_USER_TEMPLATE.format(
                mbti=mbti,
                interests=interests_str,
                city=city_display,
                voice_text=voice_text,
            )

            result = llm.chat_structured(user_msg, LLM_SYSTEM_PROMPT)

            # 验证返回结构
            if isinstance(result, dict) and "identity" in result:
                # 补充 MBTI 基础字段
                result["travel_style"] = _TRAVEL_STYLES.get(mbti, "随性探索型")
                result["mbti_influence"] = (
                    f"MBTI={mbti}，{_MBTI_LABELS.get(mbti,'')}。"
                    f"融合兴趣：{interests_str}。"
                )
                result["confidence_score"] = 0.90
                result["data_sources_used"] = ["mbti", "llm", "interests"]
                return result
        except Exception:
            pass  # fallback 到规则生成

    # Fallback：规则生成
    return _build_persona_fallback(mbti, interests, voice_text, city)
