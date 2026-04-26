# api/negotiate.py
"""POST /api/negotiate 端点 + 所有协商相关辅助函数"""
from __future__ import annotations

import json
import re
import uuid
from pathlib import Path as _Path
from typing import Any, Dict, List, Optional

from fastapi import APIRouter

from api._constants import BUDDY_CONFIGS, CITY_NAMES, MBTI_EMOJI, MBTI_LABELS
from api._models import NegotiationRequest
from api._store import _persona_store
from agents import persona_doc
from agents.mock_database import get_compatibility_breakdown as _mock_compat_breakdown
from persona_generator import generate_persona_from_onboarding

router = APIRouter(prefix="/api", tags=["Negotiate"])

_MOCK_DIR = _Path(__file__).parent.parent / "mock_personas"


# ---------------------------------------------------------------------------
# MING 四维人格框架常量
# ---------------------------------------------------------------------------

_COGNITION_MAP: Dict[str, Dict[str, Any]] = {
    "energy": {
        "I": {"recharge": "独处充电，从内部世界获取能量", "decision_basis": "依赖内部框架和深度思考", "social_style": "选择性深度交流后需要独处消化", "keyword": "内向探索者"},
        "E": {"recharge": "社交充电，从外部世界获取能量", "decision_basis": "依赖外部反馈和讨论", "social_style": "在对话中理清思路，边聊边想", "keyword": "外向行动派"},
    },
    "information": {
        "N": {"gather": "直觉思维，偏好抽象和可能性", "focus": "关注模式和关联，不拘泥于细节", "pattern_recognition": "善于发现隐藏的可能性", "keyword": "直觉型"},
        "S": {"gather": "感觉认知，注重具体细节和现实", "focus": "关注实际可行的方案", "pattern_recognition": "依赖五官感知和经验", "keyword": "实感型"},
    },
    "decision": {
        "T": {"approach": "逻辑决策，情感表达克制", "justice": "重视公平和原则", "conflict_style": "直面问题，讲究道理", "keyword": "理性决策者"},
        "F": {"approach": "情感决策，共情能力强", "justice": "重视和谐和人情", "conflict_style": "顾及他人感受，避免冲突", "keyword": "情感共鸣者"},
    },
    "lifestyle": {
        "J": {"style": "有计划，喜欢确定性和控制感", "closure": "偏好清晰结论和既定安排", "stress": "面对不确定性时会焦虑", "keyword": "计划掌控型"},
        "P": {"style": "灵活随性，享受开放性和可能性", "closure": "保留余地，随情况调整", "stress": "被强制约束时感到压抑", "keyword": "弹性适应型"},
    },
}

_EXPRESSION_MAP: Dict[str, Dict[str, Any]] = {
    "energy": {
        "I": {"verbosity": "话少沉稳，表达间接含蓄", "rhythm": "深思后才回应，不急于表达", "typical_phrases": ["让我想想", "这个嘛...", "嗯"]},
        "E": {"verbosity": "话多热情，表达直接主动", "rhythm": "边想边说，节奏快且有感染力", "typical_phrases": ["我觉得吧！", "走走走！", "太棒了！"]},
    },
    "information": {
        "N": {"metaphor": "善用隐喻和联想，跳跃性思维", "abstract": "谈论方向和可能性多于具体细节", "typical_phrases": ["感觉像是...", "说不清但...", "说不定"]},
        "S": {"metaphor": "描述贴近现实，具体可感", "abstract": "谈论眼前事实和可操作步骤", "typical_phrases": ["这个具体是...", "上次就是...", "按计划"]},
    },
    "decision": {
        "T": {"structure": "表达偏结构化，逻辑清晰", "tone": "客观冷静，少用感叹词", "typical_phrases": ["从逻辑上看", "理性分析", "这个结论"]},
        "F": {"structure": "情感表达丰富，语气温暖", "tone": "主观感受多，共情式表达", "typical_phrases": ["我觉得...", "你一定很难受吧", "一起加油"]},
    },
    "lifestyle": {
        "J": {"conclusion": "偏好清晰结论，干脆利落", "hedging": "很少保留余地，说一不二", "typical_phrases": ["就这样定了", "按计划执行", "没问题"]},
        "P": {"conclusion": "保留余地，留有调整空间", "hedging": "经常说「再说吧」「到时候看」", "typical_phrases": ["先这样吧", "到时候再调整", "灵活处理"]},
    },
}

_BEHAVIOR_MAP: Dict[str, Dict[str, Any]] = {
    "energy": {
        "I": {"social_energy": "独处充电型，社交后需要恢复时间", "initiation": "被动响应为主，很少主动发起", "social_duration": "深度交流 > 泛泛社交"},
        "E": {"social_energy": "社交充电型，人多更有活力", "initiation": "主动发起对话，享受成为焦点", "social_duration": "长时间社交也不会疲惫"},
    },
    "information": {
        "N": {"exploration": "探索模式：偏好新奇和可能性", "route": "随性探索，不喜欢精确规划", "interest": "容易被新事物吸引，关注长远意义"},
        "S": {"exploration": "务实模式：偏好熟悉和稳定", "route": "按计划执行，注重效率和安全性", "interest": "关注眼前可行，关注细节和传统"},
    },
    "decision": {
        "T": {"stress_response": "用逻辑分析问题，寻求解决方案", "emotion_display": "克制情绪表达，倾向冷处理", "support_style": "提供实际帮助而非情感安慰"},
        "F": {"stress_response": "先处理情绪，再处理事情", "emotion_display": "情绪外露，需要倾诉和共情", "support_style": "先陪伴后建议，情感支持优先"},
    },
    "lifestyle": {
        "J": {"planning": "高度计划性，日程安排紧凑", "spontaneity": "不喜欢临时变更，计划外会焦虑", "time_orientation": "准时、守时、讨厌拖延"},
        "P": {"planning": "灵活安排，不喜欢被时间表约束", "spontaneity": "享受意外，享受即兴决定", "time_orientation": "时间观念弹性，不拘泥准时"},
    },
}

_EMOTION_MAP: Dict[str, Dict[str, Any]] = {
    "energy": {
        "I": {"attachment": "在亲密中保持独立空间的需求", "intimacy": "需要深入连接而非广泛社交", "recharge_needs": "独处时间 = 情绪修复时间"},
        "E": {"attachment": "在关系中寻求更多连接和确认", "intimacy": "通过外部社交确认自我价值", "recharge_needs": "社交活动 = 情绪充电"},
    },
    "information": {
        "N": {"triggers": "对未来的焦虑和不确定性", "positive": "被理解和被看到潜在可能性", "growth": "关注成长和人生意义类话题"},
        "S": {"triggers": "对具体问题的失控感和压力", "positive": "被关注当下的需求和感受", "growth": "关注稳定和安全的生活"},
    },
    "decision": {
        "T": {"emotion_display": "情绪不外显，常用理性化防御", "vulnerability": "示弱=暴露弱点，需要保持掌控感", "comfort": "解决问题比情感安慰更有效"},
        "F": {"emotion_display": "情绪外显，需要被看见和被共情", "vulnerability": "愿意展示脆弱，寻求情感支持", "comfort": "被倾听和被理解比解决方案更重要"},
    },
    "lifestyle": {
        "J": {"control": "通过控制感获得安全感", "anxiety": "不确定性是主要焦虑源", "comfort_mechanism": "做计划、列清单、整理"},
        "P": {"control": "通过保持开放性减少压迫感", "anxiety": "被约束和被迫做决定是主要压力", "comfort_mechanism": "拖延、自我宽慰、转移注意力"},
    },
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

_MBTI_DEALBREAKERS: Dict[str, List[str]] = {
    "ENFP": ["计划太紧的行程", "没有自由探索空间", "被打断即兴想法"],
    "ENFJ": ["冷漠疏离的旅伴", "破坏和谐的氛围", "无视他人感受"],
    "ENTP": ["没有讨论和辩论空间", "被强制接受单一观点", "无聊重复的内容"],
    "ENTJ": ["低效拖延的行为", "没有明确目标", "决策被反复推翻"],
    "ESFP": ["过于严肃压抑的氛围", "没有即兴发挥的空间", "长时间独处"],
    "ESFJ": ["被忽视和不被认可", "旅伴不参与社交", "破坏团队氛围"],
    "ESTP": ["过于理论化不落地", "没有刺激和挑战", "被过度约束"],
    "ESTJ": ["混乱无计划", "不遵守承诺", "做事没有条理"],
    "INFP": ["价值观冲突", "被强制改变内心想法", "不真诚的关系"],
    "INFJ": ["被误解和不被理解", "持续的负能量", "精神压力过大"],
    "INTP": ["被强制输出结论", "没有思考独处空间", "逻辑漏洞被忽视"],
    "INTJ": ["决策被无理推翻", "没有战略意义的忙碌", "被要求服从多数"],
    "ISFP": ["被强制审美", "不自由的行程安排", "被忽视的感官体验"],
    "ISFJ": ["被否定过去的付出", "不尊重隐私", "需要帮助时没人响应"],
    "ISTP": ["被强制社交", "不尊重独立解决问题的空间", "被迫做不擅长的事"],
    "ISTJ": ["违反已约定的计划", "做事不负责任", "不尊重传统和规则"],
}


# ---------------------------------------------------------------------------
# 辅助函数
# ---------------------------------------------------------------------------

def _extract_mbti(text: str) -> Optional[str]:
    if not text:
        return None
    m = re.search(r"\b([IE][NS][TF][JP])([AT])?\b", text.strip().upper())
    if not m:
        return None
    return (m.group(1) + (m.group(2) or "")).upper()


def _load_mock_persona(mbti: str) -> Optional[Dict[str, Any]]:
    path = _MOCK_DIR / mbti.lower() / "persona.json"
    if path.exists():
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    return None


def _load_compatibility(a_mbti: str, b_mbti: str) -> Optional[Dict[str, Any]]:
    combo = sorted([a_mbti.upper(), b_mbti.upper()])
    dir_path = _MOCK_DIR / combo[0].lower()
    pattern = f"compatibility_{combo[0].lower()}_{combo[1].lower()}"
    if not dir_path.exists():
        return None
    import random as _random
    candidates = [f for f in dir_path.iterdir() if f.name.startswith(pattern) and f.suffix == ".json"]
    if not candidates:
        return None
    chosen = _random.choice(candidates)
    with open(chosen, "r", encoding="utf-8") as f:
        return json.load(f)


def _build_user_prefs_from_persona(persona: Dict[str, Any]) -> Dict[str, Any]:
    identity: Dict[str, Any] = persona.get("identity", {})
    sp: Dict[str, Any] = persona.get("speaking_style", {})
    travel: Dict[str, Any] = persona.get("travel_style", {})
    neg: Dict[str, Any] = persona.get("negotiation_style", {})
    layer0: Dict[str, Any] = persona.get("layer0_hard_rules", {})

    identity_content = str(identity.get("content", ""))
    mbti_match = re.search(r"\b([IE][NS][TF][JP])([AT])?\b", identity_content)
    if not mbti_match:
        mbti_influence = str(persona.get("mbti_influence", ""))
        mbti_match = re.search(r"\b([IE][NS][TF][JP])([AT])?\b", mbti_influence)
    mbti = mbti_match.group(0) if mbti_match else persona.get("mbti_type") or persona.get("mbti", "ENFP")

    likes: List[str] = identity.get("core_values", []) or []
    if not likes:
        markers: List[str] = sp.get("language_markers", [])
        likes = [m for m in markers if len(m) > 2][:5]

    dealbreakers: List[str] = []
    if isinstance(layer0, dict):
        dealbreakers = layer0.get("dealbreakers", []) or []

    budget = ""
    if isinstance(travel, dict):
        budget = travel.get("budget", "")
    elif isinstance(travel, str):
        budget = travel

    pace = ""
    if isinstance(travel, dict):
        pace = travel.get("preferred_pace", "") or travel.get("pace_preference", "")

    neg_style_str = ""
    if isinstance(neg, dict):
        approach = neg.get("approach", "")
        hard = neg.get("hard_to_compromise", [])
        easy = neg.get("easy_to_compromise", [])
        neg_style_str = f"{approach}。绝不妥协：{'、'.join(hard[:2])}。可以妥协：{'、'.join(easy[:2])}"
    elif isinstance(neg, str):
        neg_style_str = neg

    return {
        "mbti": mbti,
        "likes": likes,
        "dislikes": dealbreakers,
        "budget": budget,
        "pace": pace,
        "travel_style": str(travel) if isinstance(travel, str) else "",
        "negotiation_style": neg_style_str,
        "city": persona.get("city", ""),
    }


def _get_negotiation_compatibility_breakdown(
    user_prefs: Optional[Dict[str, Any]],
    twin_persona: Dict[str, Any],
) -> Optional[Dict[str, Any]]:
    if not user_prefs:
        return None
    breakdown = None
    try:
        breakdown = _mock_compat_breakdown(user_prefs, twin_persona)
    except Exception:
        pass
    if breakdown:
        neg_style: Dict[str, Any] = twin_persona.get("negotiation_style", {})
        if isinstance(neg_style, dict):
            easy = neg_style.get("easy_to_compromise", [])
            hard = neg_style.get("hard_to_compromise", [])
        else:
            easy, hard = [], []
        return {
            "total": breakdown.get("total", 50) / 100.0,
            "strengths": breakdown.get("strengths", []),
            "red_flags": breakdown.get("red_flags", []),
            "easy_to_compromise": easy[:3],
            "hard_to_compromise": hard[:3],
        }
    neg_style: Dict[str, Any] = twin_persona.get("negotiation_style", {})
    if isinstance(neg_style, dict):
        return {
            "total": 0.5, "strengths": [], "red_flags": [],
            "easy_to_compromise": neg_style.get("easy_to_compromise", [])[:3],
            "hard_to_compromise": neg_style.get("hard_to_compromise", [])[:3],
        }
    return None


def _parse_mbti_dimensions(mbti: str) -> Dict[str, str]:
    if len(mbti) < 4:
        return {"energy": "N", "information": "N", "decision": "T", "lifestyle": "J"}
    return {"energy": mbti[0], "information": mbti[1], "decision": mbti[2], "lifestyle": mbti[3]}


def _get_mbti_dim(dims: Dict[str, str], framework: Dict[str, Any], dim_name: str) -> Dict[str, Any]:
    key = dims.get(dim_name, "")
    return framework.get(dim_name, {}).get(key, {})


def _merge_interests_into_prompt(interests: List[str], mbti: str, city: str, voice: str) -> str:
    parts = []
    city_name = CITY_NAMES.get(city, city or "")
    if city_name:
        parts.append(f"向往{city_name}")
    if interests:
        parts.append(f"热爱{'、'.join(interests[:3])}")
    if voice and len(voice.strip()) > 5:
        clean = voice.strip()
        if len(clean) > 50:
            clean = clean[:50] + "..."
        parts.append(f"自我描述：{clean}")
    return "，".join(parts) if parts else ""


def _build_layer0_rules(mbti: str, interests: List[str]) -> List[str]:
    base = _MBTI_DEALBREAKERS.get(mbti.upper(), ["真诚互动"])
    city_rules = [f"喜欢去{it}" for it in interests if it in CITY_NAMES]
    return base[:3] + city_rules[:2]


def _build_identity(mbti: str, dims: Dict[str, str], city: str, interests: List[str], voice: str) -> Dict[str, Any]:
    cog = _get_mbti_dim(dims, _COGNITION_MAP, "energy")
    inf = _get_mbti_dim(dims, _COGNITION_MAP, "information")
    dec = _get_mbti_dim(dims, _COGNITION_MAP, "decision")
    lif = _get_mbti_dim(dims, _COGNITION_MAP, "lifestyle")
    city_name = CITY_NAMES.get(city, "")
    label = MBTI_LABELS.get(mbti.upper(), mbti)
    keyword = _MBTI_KEYWORDS.get(mbti.upper(), "")
    extras = _merge_interests_into_prompt(interests, mbti, city, voice)
    content = f"你是{label}。{cog.get('keyword', '')}，{inf.get('keyword', '')}，{dec.get('keyword', '')}，{lif.get('keyword', '')}。"
    if extras:
        content += f" {extras}"
    if city_name:
        content += f" 向往{city_name}，期待在那里找到属于自己的旅行体验。"
    return {"title": "身份层", "content": content.strip(), "emoji": MBTI_EMOJI.get(mbti.upper(), "🤖")}


def _build_speaking_style(mbti: str, dims: Dict[str, str], interests: List[str], voice: str) -> Dict[str, Any]:
    eng = _get_mbti_dim(dims, _EXPRESSION_MAP, "energy")
    inf = _get_mbti_dim(dims, _EXPRESSION_MAP, "information")
    dec = _get_mbti_dim(dims, _EXPRESSION_MAP, "decision")
    lif = _get_mbti_dim(dims, _EXPRESSION_MAP, "lifestyle")
    base_phrases = eng.get("typical_phrases", [])[:2]
    dec_phrases = dec.get("typical_phrases", [])[:1]
    if voice and len(voice.strip()) > 2:
        base_phrases.append(voice.strip()[:20])
    if interests:
        base_phrases.append(f"喜欢{interests[0]}")
    typical = list(dict.fromkeys(base_phrases + dec_phrases))[:5]
    if dims["decision"] == "F":
        tone = "温暖共情"
    elif dims["energy"] == "E":
        tone = "热情活泼"
    else:
        tone = "沉稳内敛"
    return {
        "title": "说话风格",
        "content": f"{eng.get('verbosity', '')}，{dec.get('structure', '')}。{lif.get('conclusion', '')}",
        "emoji": "💬",
        "typical_phrases": typical,
        "chat_tone": tone,
    }


def _build_emotion_decision(mbti: str, dims: Dict[str, str], interests: List[str], voice: str) -> Dict[str, Any]:
    beh_eng = _get_mbti_dim(dims, _BEHAVIOR_MAP, "energy")
    beh_dec = _get_mbti_dim(dims, _BEHAVIOR_MAP, "decision")
    beh_lif = _get_mbti_dim(dims, _BEHAVIOR_MAP, "lifestyle")
    emo_eng = _get_mbti_dim(dims, _EMOTION_MAP, "energy")
    emo_dec = _get_mbti_dim(dims, _EMOTION_MAP, "decision")
    emo_lif = _get_mbti_dim(dims, _EMOTION_MAP, "lifestyle")
    stress = beh_dec.get("stress_response", "冷静分析") + "，" + beh_lif.get("stress", "需要计划")
    decision_style = dims["decision"].lower() + ("-cautious" if dims["lifestyle"] == "J" else "-adaptive")
    return {
        "title": "情绪与决策",
        "content": f"{emo_dec.get('emotion_display', '')}，{emo_lif.get('comfort_mechanism', '')}。{emo_eng.get('recharge_needs', '')}",
        "emoji": "💭",
        "stress_response": stress,
        "decision_style": decision_style,
    }


def _build_social_behavior(mbti: str, dims: Dict[str, str], interests: List[str]) -> Dict[str, Any]:
    eng = _get_mbti_dim(dims, _BEHAVIOR_MAP, "energy")
    inf = _get_mbti_dim(dims, _BEHAVIOR_MAP, "information")
    dec = _get_mbti_dim(dims, _BEHAVIOR_MAP, "decision")
    social_style = eng.get("social_energy", "平衡型社交")
    if dims["energy"] == "E":
        social_style += "，主动发起"
    else:
        social_style += "，被动响应"
    return {
        "title": "社交行为",
        "content": f"{eng.get('initiation', '')}，{inf.get('exploration', '')}。{dec.get('support_style', '')}",
        "emoji": "🤝",
        "social_style": social_style,
    }


def _build_persona_from_onboarding(
    mbti: str,
    city: str,
    interests: Optional[List[str]] = None,
    voice_text: Optional[str] = None,
) -> Dict[str, Any]:
    mbti = mbti.strip().upper()
    if len(mbti) < 4:
        mbti = "ENFP"
    mbti_lower = mbti.lower()
    interests = interests or []
    voice_text = voice_text or ""

    llm_persona = generate_persona_from_onboarding(
        mbti=mbti, interests=interests, voice_text=voice_text, city=city,
    )
    if llm_persona:
        fingerprint = f"twin-{mbti_lower}-{uuid.uuid4().hex[:8]}"
        persona_id = f"persona-{mbti_lower}-{uuid.uuid4().hex[:8]}"
        label = MBTI_LABELS.get(mbti, mbti)
        keyword = _MBTI_KEYWORDS.get(mbti, "")
        city_name = CITY_NAMES.get(city.lower(), city or "未选择")
        travel_style_fallback = _TRAVEL_STYLES.get(mbti, "随性探索型")
        prompt_parts = [keyword, label]
        if interests:
            prompt_parts.append("热爱" + "、".join(interests[:3]))
        if city_name and city_name != "未选择":
            prompt_parts.append(f"向往{city_name}")
        if voice_text and len(voice_text.strip()) > 5:
            prompt_parts.append("真实自我描述：" + voice_text.strip()[:30])
        avatar_prompt = "，".join(prompt_parts)
        layer0_hard_rules = _build_layer0_rules(mbti, interests)
        travel_style_val = llm_persona.get("travel_style", "")
        if isinstance(travel_style_val, dict):
            travel_style_str = travel_style_val.get("overall", travel_style_fallback)
        else:
            travel_style_str = str(travel_style_val) or travel_style_fallback
        mbti_influence = llm_persona.get(
            "mbti_influence",
            f"MBTI={mbti}，{keyword}，{label}。城市探索偏好：{city_name}。旅行风格：{travel_style_str}。",
        )
        data_sources = ["mbti", "llm"]
        if interests:
            data_sources.append("interests")
        if voice_text and len(voice_text.strip()) > 5:
            data_sources.append("voice_text")
        confidence = 0.70 if llm_persona.get("_fallback") else 0.90
        return {
            "persona_id": persona_id, "name": label, "avatar_prompt": avatar_prompt,
            "avatar_emoji": MBTI_EMOJI.get(mbti, "🤖"),
            "layer0_hard_rules": layer0_hard_rules,
            "mbti_influence": mbti_influence,
            "travel_style": travel_style_str,
            "soul_fingerprint": fingerprint,
            "confidence_score": confidence,
            "data_sources_used": data_sources,
            "identity": llm_persona.get("identity", {}),
            "speaking_style": llm_persona.get("speaking_style", {}),
            "emotion_decision": llm_persona.get("emotion_decision", {}),
            "social_behavior": llm_persona.get("social_behavior", {}),
            "negotiation_style": llm_persona.get("negotiation_style", {}),
            "preferences": llm_persona.get("preferences", {}),
            "conversation_examples": llm_persona.get("conversation_examples", {}),
            "compatibility_notes": llm_persona.get("compatibility_notes", {}),
            "travel_style_detail": llm_persona.get("travel_style") if isinstance(llm_persona.get("travel_style"), dict) else {},
        }
    return _build_persona_from_mbti(mbti, interests, city, voice_text)


def _build_persona_from_mbti(mbti: str, interests: List[str], city: str, voice_text: str) -> Dict[str, Any]:
    mbti = mbti.strip().upper()
    if len(mbti) < 4:
        mbti = "ENFP"
    mbti_lower = mbti.lower()
    mock = _load_mock_persona(mbti)
    dims = _parse_mbti_dimensions(mbti)
    fingerprint = f"twin-{mbti_lower}-{uuid.uuid4().hex[:8]}"
    persona_id = f"persona-{mbti_lower}-{uuid.uuid4().hex[:8]}"
    label = MBTI_LABELS.get(mbti, mbti)
    keyword = _MBTI_KEYWORDS.get(mbti, "")
    travel_style = _TRAVEL_STYLES.get(mbti, "随性探索型")
    city_name = CITY_NAMES.get(city.lower(), city or "未选择")
    prompt_parts = [keyword, label]
    if interests:
        prompt_parts.append("热爱" + "、".join(interests[:3]))
    if city_name and city_name != "未选择":
        prompt_parts.append(f"向往{city_name}")
    if voice_text and len(voice_text.strip()) > 5:
        prompt_parts.append("真实自我描述：" + voice_text.strip()[:30])
    avatar_prompt = "，".join(prompt_parts)
    layer0_hard_rules = _build_layer0_rules(mbti, interests)
    identity = _build_identity(mbti, dims, city, interests, voice_text)
    speaking_style = _build_speaking_style(mbti, dims, interests, voice_text)
    emotion_decision = _build_emotion_decision(mbti, dims, interests, voice_text)
    social_behavior = _build_social_behavior(mbti, dims, interests)
    if mock:
        identity = {**mock.get("identity", {}), "emoji": MBTI_EMOJI.get(mbti, "🤖")}
        mock_ss = mock.get("speaking_style", {})
        speaking_style = {**speaking_style, **{k: v for k, v in mock_ss.items() if k not in speaking_style or not speaking_style[k]}}
        for key in ["emotion_decision", "social_behavior"]:
            if key in mock and isinstance(mock[key], dict):
                if key == "emotion_decision":
                    emotion_decision = mock[key]
                else:
                    social_behavior = mock[key]
    data_sources = ["mbti"]
    if interests:
        data_sources.append("interests")
    if voice_text and len(voice_text.strip()) > 5:
        data_sources.append("voice_text")
    if mock:
        data_sources.append("mock_data")
        confidence = 0.85
    elif interests and voice_text:
        confidence = 0.75
    elif interests or voice_text:
        confidence = 0.65
    else:
        confidence = 0.50
    mbti_influence = f"MBTI={mbti}，{keyword}，{label}。城市探索偏好：{city_name}。旅行风格：{travel_style}。沟通基调：{speaking_style.get('chat_tone', '')}。"
    return {
        "persona_id": persona_id, "name": label, "avatar_prompt": avatar_prompt,
        "avatar_emoji": MBTI_EMOJI.get(mbti, "🤖"),
        "layer0_hard_rules": layer0_hard_rules,
        "identity": identity, "speaking_style": speaking_style,
        "emotion_decision": emotion_decision, "social_behavior": social_behavior,
        "travel_style": travel_style, "mbti_influence": mbti_influence,
        "soul_fingerprint": fingerprint, "confidence_score": confidence,
        "data_sources_used": data_sources,
    }


def _build_negotiation_result(city: str, user_mbti: str, buddy_mbti: str) -> Dict[str, Any]:
    city_name = CITY_NAMES.get(city, city or "大理")
    compat = _load_compatibility(user_mbti, buddy_mbti)
    buddy_config = BUDDY_CONFIGS.get(buddy_mbti.lower(), BUDDY_CONFIGS["enfp"])
    user_config = BUDDY_CONFIGS.get(user_mbti.lower(), BUDDY_CONFIGS["enfp"])
    if compat:
        overall = compat["overall_score"]
        radar = [
            {"dimension": "行程节奏", "user_score": 90, "buddy_score": 75, "weight": 0.8},
            {"dimension": "美食偏好", "user_score": 80, "buddy_score": 85, "weight": 0.6},
            {"dimension": "拍照风格", "user_score": 70, "buddy_score": 90, "weight": 0.5},
            {"dimension": "预算控制", "user_score": 75, "buddy_score": 80, "weight": 0.7},
            {"dimension": "冒险精神", "user_score": 85, "buddy_score": 65, "weight": 0.9},
        ]
        red_flags = compat.get("challenges", [])[:2]
        messages = [
            {"speaker": "user", "content": f"我想去{city_name}旅行，探索当地的美食！", "timestamp": 1700000000},
            {"speaker": "buddy", "content": buddy_config["typical_phrases"][0], "timestamp": 1700000010},
            {"speaker": "user", "content": "太好了！那我们一起做攻略吧~", "timestamp": 1700000020},
            {"speaker": "buddy", "content": buddy_config["typical_phrases"][1] if len(buddy_config["typical_phrases"]) > 1 else "没问题！", "timestamp": 1700000030},
        ]
        plan = [f"{city_name}古城民宿2晚", f"{city_name}周边自然风光1天", "特色美食探索之旅", "轻松休闲一日"]
        return {
            "destination": city_name, "dates": "5月10日-5月15日", "budget": "人均3500元",
            "consensus": overall > 0.6, "plan": plan,
            "matched_buddies": [user_config["name"], buddy_config["name"]],
            "radar": radar, "red_flags": red_flags, "messages": messages,
        }
    else:
        return {
            "destination": city_name, "dates": "待定", "budget": "待定", "consensus": False,
            "plan": [], "matched_buddies": [user_config["name"], buddy_config["name"]],
            "radar": [], "red_flags": ["数据不足，请补充更多信息"], "messages": [],
        }


# ---------------------------------------------------------------------------
# 端点
# ---------------------------------------------------------------------------

@router.post("/negotiate")
async def negotiate(req: NegotiationRequest) -> Dict[str, Any]:
    import asyncio, logging
    logger = logging.getLogger("twinbuddy.api")

    city = req.destination or "dali"
    city_name = CITY_NAMES.get(city, city or "大理")

    user_persona: Optional[Dict[str, Any]] = None
    user_mbti = req.mbti.upper() if req.mbti else "ENFP"
    user_name = "你"

    if req.mbti:
        user_persona = _build_persona_from_onboarding(user_mbti, req.destination, req.interests or [], req.voice_text or "")
        logger.info("协商请求使用前端传入参数 | user_mbti=%s | interests=%s", user_mbti, req.interests)
    elif req.user_persona_id:
        for uid_key, p in _persona_store.items():
            if p.get("persona_id") == req.user_persona_id:
                md_doc = persona_doc.load_persona_doc(uid_key)
                if md_doc:
                    fm, body = persona_doc.parse_persona_doc(md_doc)
                    if fm:
                        user_persona = persona_doc.dict_from_frontmatter(fm, body)
                        user_name = str(user_persona.get("name") or user_name)
                        user_mbti = fm.get("mbti", user_mbti)
                        break
                user_persona = p
                user_name = str(p.get("name") or user_name)
                user_mbti = _extract_mbti(str(p.get("mbti_influence") or "")) or _extract_mbti(str(p.get("mbti_type") or "")) or user_mbti
                break

    buddy_mbti = (req.buddy_mbti or "INFP").upper()
    buddy_config = BUDDY_CONFIGS.get(buddy_mbti.lower(), BUDDY_CONFIGS["enfp"])

    buddy_md = persona_doc.get_buddy_doc(f"buddy_{buddy_mbti.lower()}") if req.buddy_mbti else None
    if buddy_md:
        fm, body = persona_doc.parse_persona_doc(buddy_md)
        twin_persona = persona_doc.dict_from_frontmatter(fm, body) if fm else None
    else:
        twin_persona = None

    if not twin_persona:
        twin_persona = _load_mock_persona(buddy_mbti)

    if not twin_persona:
        twin_persona = {
            "persona_id": f"persona-{buddy_mbti.lower()}-{uuid.uuid4().hex[:8]}",
            "mbti_type": buddy_mbti,
            "travel_style": buddy_config["travel_style"],
            "speaking_style": {"chat_tone": "温和细腻", "typical_phrases": buddy_config["typical_phrases"]},
            "mbti_dimension_evidence": {"energy": "introvert", "lifestyle": "perceiving"},
        }

    try:
        from api.negotiation.llm_client import _LLM_AVAILABLE
        if not _LLM_AVAILABLE:
            logger.warning("LLM 不可用，降级到 Mock 协商")
            result = _build_negotiation_result(city, user_mbti, buddy_mbti)
            return {
                "success": True, "data": result,
                "meta": {"source": "mock", "llm_error": "LLM 未配置", "user_mbti": user_mbti, "buddy_mbti": buddy_mbti, "destination": city},
            }

        from api.negotiation.graph import run_negotiation

        active_user_persona = user_persona or _build_persona_from_onboarding(user_mbti, city, [], "")
        user_prefs_for_compat: Optional[Dict[str, Any]] = None
        try:
            user_prefs_for_compat = _build_user_prefs_from_persona(active_user_persona)
        except Exception:
            pass

        compat_breakdown = _get_negotiation_compatibility_breakdown(user_prefs_for_compat, twin_persona)
        try:
            # Wrap sync run_negotiation in asyncio timeout (10s) so we fail fast
            # instead of blocking for 60s when MiniMax is unreachable
            langgraph_result = await asyncio.wait_for(
                asyncio.get_event_loop().run_in_executor(
                    None, lambda: run_negotiation(active_user_persona, twin_persona, user_compatibility_breakdown=compat_breakdown)
                ),
                timeout=10.0,
            )
        except asyncio.TimeoutError:
            logger.warning("LLM 协商超时 (10s)，降级到 Mock")
            result = _build_negotiation_result(city, user_mbti, buddy_mbti)
            return {
                "success": True, "data": result,
                "meta": {"source": "mock", "llm_error": "协商超时", "user_mbti": user_mbti, "buddy_mbti": buddy_mbti, "destination": city},
            }
        except Exception as llm_err:
            logger.warning("LLM 协商失败 (run_negotiation): %s，降级到 Mock", llm_err)
            result = _build_negotiation_result(city, user_mbti, buddy_mbti)
            return {
                "success": True, "data": result,
                "meta": {"source": "mock", "llm_error": str(llm_err), "user_mbti": user_mbti, "buddy_mbti": buddy_mbti, "destination": city},
            }
        rounds = langgraph_result.get("rounds", [])
        consensus_scores = langgraph_result.get("consensus_scores", {})
        final_report = langgraph_result.get("final_report", {})

        messages = []
        for r in rounds:
            ts_base = 1700000000 + r["round_num"] * 100
            messages.append({"speaker": "user", "content": r.get("proposer_message", ""), "timestamp": ts_base})
            messages.append({"speaker": "buddy", "content": r.get("evaluator_message", ""), "timestamp": ts_base + 10})

        DIM_LABELS = ["行程节奏", "美食偏好", "拍照风格", "预算控制", "冒险精神", "作息时间"]
        radar = []
        for i, (t, s) in enumerate(consensus_scores.items()):
            radar.append({"dimension": DIM_LABELS[i] if i < len(DIM_LABELS) else t, "user_score": int(s * 100), "buddy_score": int(s * 90), "weight": 0.7})

        plan = final_report.get("strengths", []) if final_report else []
        if not plan:
            plan = [f"{city_name}古城民宿2晚", f"{city_name}周边自然风光1天", "特色美食探索之旅"]

        overall = final_report.get("overall_score", 0.5) if final_report else 0.5
        result_data = {
            "destination": city_name, "dates": "5月10日-5月15日", "budget": "人均3500元",
            "consensus": overall > 0.5, "plan": plan,
            "matched_buddies": [user_name, buddy_config["name"]],
            "radar": radar,
            "red_flags": final_report.get("challenges", [])[:2] if final_report else [],
            "messages": messages,
        }
        llm_source = "llm"
        try:
            from api.negotiation.llm_client import _KEYS as _LLM_KEYS
            if not _LLM_KEYS:
                llm_source = "llm_fallback"
        except Exception:
            pass

        logger.info("LLM 协商成功 | source=%s | overall=%.3f | rounds=%d", llm_source, overall, len(rounds))
        return {
            "success": True, "data": result_data,
            "meta": {"source": llm_source, "user_mbti": user_mbti, "buddy_mbti": buddy_mbti, "destination": city, "overall_score": overall},
        }
    except Exception as exc:
        error_msg = str(exc)
        is_key_error = "API Key 未配置" in error_msg or "未设置" in error_msg
        if is_key_error:
            logger.error("【LLM 未配置】%s", error_msg)
        else:
            logger.warning("LLM 协商失败，降级到 Mock: %s", exc)

        result = _build_negotiation_result(city, user_mbti, buddy_mbti)
        return {
            "success": True, "data": result,
            "meta": {
                "source": "mock",
                "llm_error": error_msg if is_key_error else None,
                "user_mbti": user_mbti, "buddy_mbti": buddy_mbti, "destination": city,
            },
        }
