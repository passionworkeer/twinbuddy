# -*- coding: utf-8 -*-
"""
langgraph/llm_nodes.py — LLM 驱动的协商节点

用 MiniMax LLM 替代模板文本，生成真实的对话内容。
Fallback：若 LLM 调用失败，降级到对话示例片段。

深度优化：注入完整的 buddy JSON 数据（conversation_examples / never_says /
language_markers / negotiation_style 等），并支持协商模式切换。
"""
from __future__ import annotations

import random
from typing import Any, Dict, List, Optional

from .state import NegotiationState, NegotiationPhase, NegotiationRound
from .nodes import TOPICS, TOPIC_LABELS, PROPOSALS, _trait
from .llm_client import llm_client

# ── System Prompts ─────────────────────────────────────────────────────────

TRAVEL_SYSTEM = """你是一个旅行搭子协商AI，名字叫"搭搭"。两个用户（user 和 buddy）正在讨论旅行偏好，请你来生成他们说的话。
你必须严格遵循用户性格：MBTI 性格决定说话风格（E人话多热情，I人话少沉稳）。
每次只生成一条消息，不要生成多余内容。"""

# ── 深度 Buddy 数据注入的 Prompts ─────────────────────────────────────────

PROPOSER_PROMPT = """你是 user 的数字分身，正在和 buddy 协商旅行计划。

【你的人格档案（严格遵守）】
- MBTI：{mbti}
- 说话语气：{tone}
- 句式习惯：{sentence_patterns}
- 语言特征词：{language_markers}
- emoji使用频率：{emoji_freq}
- 口头禅：{typical_phrases}
- 决策风格：{decision_style}
- 压力反应：{stress_response}
- 恐惧因素：{fear_factors}
- 绝不让步的事：{hard_to_compromise}
- 可以妥协的事：{easy_to_compromise}
- 被施压时的反应：{pressure_response}

【你平时说话的方式】（参考风格，禁止照搬）：
{conversation_example}

【绝不能说的话】（禁止生成以下内容）：
{never_says}

【当前讨论话题】{topic_label}
【对方(buddy)的偏好】{buddy_preference}
【你的偏好是】{user_preference}

{compatibility_block}请用符合你性格的方式，说一段话来表达你的偏好。要求：
- 30-60字
- 自然口语化，像你平时说话
- 必须包含你的口头禅或语言特征词
- 绝不能说出现在"绝不能说的话"里的内容
- 可以表现出你会坚持的底线，也可以表现出你愿意妥协的地方
- 直接写对话内容，不要前缀
"""

EVALUATOR_PROMPT = """你是 buddy 的数字分身，正在回应 user 的提议。

【你的人格档案（严格遵守）】
- MBTI：{mbti}
- 说话语气：{tone}
- 句式习惯：{sentence_patterns}
- 语言特征词：{language_markers}
- emoji使用频率：{emoji_freq}
- 口头禅：{typical_phrases}
- 决策风格：{decision_style}
- 压力反应：{stress_response}
- 恐惧因素：{fear_factors}
- 绝不让步的事：{hard_to_compromise}
- 可以妥协的事：{easy_to_compromise}
- 被施压时的反应：{pressure_response}

【你平时说话的方式】（参考风格，禁止照搬）：
{conversation_example}

【绝不能说的话】（禁止生成以下内容）：
{never_says}

【当前讨论话题】{topic_label}
【对方(user)的提议】{user_proposal}
{conflict_mode_hint}

请用符合你性格的方式，回应对方的提议。要求：
- 20-50字
- 自然口语化，像你平时说话
- 必须包含你的口头禅或语言特征词
- 可以表示认同、部分认同或提出不同意见
- 直接写对话内容，不要前缀
"""

COMPROMISE_PROMPT = """两个旅行搭子正在讨论【{topic_label}】，他们在旅行偏好上有些分歧。
请生成 user 的数字分身说的一句话，用来提议折中方案。要求：
- 20-40字
- 口语化、友好的语气
- 体现 user 的性格（MBTI={mbti}，说话语气={tone}，口头禅={typical_phrases}）
- 真正提出一个具体的折中方案
- 直接写对话内容，不要前缀
"""

RESOLUTION_PROMPT = """两个旅行搭子已经完成了一轮协商，话题是【{topic_label}】。
请生成 buddy 的数字分身说的一句话，表示接受折中方案并结题。要求：
- 15-30字
- 口语化、积极的语气
- 直接写对话内容，不要前缀
"""

# ── Topic → conversation_example 映射 ───────────────────────────────────────

_TOPIC_EXAMPLE_KEY: Dict[str, str] = {
    "travel_rhythm": "excited_about_trip",
    "food": "excited_about_trip",
    "budget": "when_disagreeing",
    "social": "stressed_on_trip",
    "boundaries": "compromising",
    "schedule": "compromising",
}


# ── 辅助函数 ─────────────────────────────────────────────────────────────────

def _fmt_preference(topic: str, persona: Dict[str, Any]) -> str:
    trait = _trait(persona, topic)
    return PROPOSALS.get(topic, {}).get(trait, "希望旅途愉快")


def _get_conversation_example(persona: Dict[str, Any], topic: str) -> str:
    """
    根据 topic 从 persona['conversation_examples'] 选取相关示例。
    格式：buddy JSON 中 conversation_examples = {excited_about_trip, when_disagreeing, ...}
    """
    conv: Dict[str, str] = persona.get("conversation_examples", {})
    key = _TOPIC_EXAMPLE_KEY.get(topic, "excited_about_trip")
    example = conv.get(key, "")
    if not example:
        # Fallback：取任意非空示例
        for v in conv.values():
            if v:
                return v
    return example


def _build_never_says(persona: Dict[str, Any]) -> str:
    """
    从 persona['speaking_style']['never_says'] 构建禁止列表字符串。
    """
    never: List[str] = persona.get("speaking_style", {}).get("never_says", [])
    if not never:
        return "无特殊禁忌"
    return "\n".join(f"- 禁止说「{s}」" for s in never)


def _get_negotiation_style(persona: Dict[str, Any]) -> Dict[str, Any]:
    """
    获取 persona['negotiation_style']，保证返回 dict 而非 None。
    """
    neg = persona.get("negotiation_style", {})
    if isinstance(neg, dict) and neg:
        return neg
    if "_internal" in persona:
        inner = persona["_internal"].get("cognition", {}).get("negotiation_style", {})
        if isinstance(inner, dict):
            return inner
    return {}


def _get_emotion_decision(persona: Dict[str, Any]) -> Dict[str, Any]:
    """
    获取 persona['emotion_decision']，保证返回 dict。
    """
    emo = persona.get("emotion_decision", {})
    if isinstance(emo, dict) and emo:
        return emo
    if "_internal" in persona:
        inner = persona["_internal"].get("emotion", {})
        if isinstance(inner, dict):
            return inner
    return {}


def _build_persona_block(
    persona: Dict[str, Any],
    role: str,  # "user" | "buddy"
) -> Dict[str, str]:
    """
    从 persona dict 中提取所有注入 prompt 所需的字段，
    返回一个 {field_name: value} 字典供 .format() 使用。
    处理多种可能的字段命名（mbti_type / mbti 等）。
    """
    # MBTI：支持多种命名
    mbti_raw = (
        persona.get("mbti_type")
        or persona.get("mbti")
        or ""
    )
    # identity 层（前端_api.py 生成的 persona 有 identity.content）
    identity: Dict[str, Any] = persona.get("identity", {})
    identity_content = str(identity.get("content", ""))
    # 从 identity.content 提取 MBTI
    import re as _re
    mbti_match = _re.search(r"\b([IE][NS][TF][JP])([AT])?\b", identity_content)
    mbti = mbti_match.group(0) if mbti_match else mbti_raw or "ENFP"

    # speaking_style 可能是 dict 或 str（来自 frontmatter）
    sp_raw = persona.get("speaking_style", {})
    sp: Dict[str, Any] = sp_raw if isinstance(sp_raw, dict) else {}
    tone = sp.get("chat_tone") or sp.get("tone", "自然随性") if isinstance(sp_raw, dict) else str(sp_raw)
    sentence_patterns = sp.get("sentence_patterns", "短句偏多") if isinstance(sp_raw, dict) else "短句偏多"
    markers: List[str] = sp.get("language_markers", []) if isinstance(sp_raw, dict) else []
    language_markers = "、".join(markers[:3]) if markers else "无特殊语气词"
    emoji_freq = sp.get("emoji_freq", "偶尔") if isinstance(sp_raw, dict) else "偶尔"
    phrases: List[str] = sp.get("typical_phrases", []) if isinstance(sp_raw, dict) else []
    typical_phrases = "、".join(phrases[:3]) if phrases else "无特殊口头禅"

    emo = _get_emotion_decision(persona)
    neg = _get_negotiation_style(persona)
    # travel_style 可能是 dict 或 str
    travel_raw = persona.get("travel_style", {})
    travel: Dict[str, Any] = travel_raw if isinstance(travel_raw, dict) else {}
    # 决策风格
    decision_style = emo.get("decision_style", "凭直觉决策")
    # 压力反应
    stress_response = emo.get("stress_response", "情绪来得快去得快")
    # 恐惧因素
    fears: List[str] = emo.get("fear_factors", [])
    fear_factors = "、".join(fears[:2]) if fears else "无特殊恐惧"
    # 绝不让步（neg 可能是 dict 或 str）
    if isinstance(neg, dict):
        hard: List[str] = neg.get("hard_to_compromise", [])
        hard_to_compromise = "、".join(hard[:2]) if hard else "无特殊底线"
        easy: List[str] = neg.get("easy_to_compromise", [])
        easy_to_compromise = "、".join(easy[:2]) if easy else "多数事项可以协商"
        pressure_response = neg.get("pressure_response", "会烦躁但很快过去")
    else:
        # neg 是 str（来自 frontmatter 的 negotiation_style 描述）
        hard_to_compromise = "无特殊底线"
        easy_to_compromise = "多数事项可以协商"
        pressure_response = "会烦躁但很快过去"
    # 对话示例
    topic_default = _TOPIC_EXAMPLE_KEY.get("travel_rhythm", "excited_about_trip")
    conversation_example = _get_conversation_example(persona, topic_default)
    if not conversation_example:
        conversation_example = f"（{role}的说话风格示例，参考语气即可）"
    # 绝不能说的话
    never_says = _build_never_says(persona)

    return {
        "mbti": mbti,
        "tone": tone,
        "sentence_patterns": sentence_patterns,
        "language_markers": language_markers,
        "emoji_freq": emoji_freq,
        "typical_phrases": typical_phrases,
        "decision_style": decision_style,
        "stress_response": stress_response,
        "fear_factors": fear_factors,
        "hard_to_compromise": hard_to_compromise,
        "easy_to_compromise": easy_to_compromise,
        "pressure_response": pressure_response,
        "conversation_example": conversation_example,
        "never_says": never_says,
        "travel_style": travel.get("preferred_pace", "灵活随性"),
    }


def _build_compatibility_block(
    breakdown: Optional[Dict[str, Any]],
    buddy_neg: Dict[str, Any],
) -> str:
    """
    构建【匹配分析】段落，告诉 LLM 当前协商的兼容性和分歧维度。
    若 breakdown 为 None，返回空字符串（向后兼容）。
    """
    if not breakdown:
        return ""

    total: float = breakdown.get("total", 0.5)
    strengths: List[str] = breakdown.get("strengths", [])
    red_flags: List[str] = breakdown.get("red_flags", [])
    easy_comp: List[str] = breakdown.get("easy_to_compromise", [])
    hard_comp: List[str] = breakdown.get("hard_to_compromise", [])

    compatible = "、".join(strengths[:2]) if strengths else "多个方面"
    conflict = "、".join(red_flags[:2]) if red_flags else "一些方面"
    flexible = "、".join(easy_comp[:2]) if easy_comp else "、".join(
        buddy_neg.get("easy_to_compromise", [])[:2]
    ) or "细节安排"

    return f"""【匹配分析】
- 你们整体匹配度：{int(total * 100)}%
- {compatible} 方面你们很合拍
- {conflict} 方面存在分歧
- 对方可能在 {flexible} 上更愿意让步

请利用这些信息，选择合适的协商策略。
"""


def _detect_mode(text: str, buddy_neg: Dict[str, Any]) -> str:
    """
    检测协商模式：
    - conflict：检测到 conflict_keywords 或文本中有明显对抗情绪
    - normal：默认
    """
    if not text:
        return "normal"
    conflict_keywords: List[str] = buddy_neg.get("conflict_keywords", [])
    text_lower = text.lower()
    for kw in conflict_keywords:
        if kw.lower() in text_lower:
            return "conflict"
    # 启发式：出现多个感叹号+否定词
    neg_markers = ["不行", "不接受", "绝对不", "不行！", "不行吧"]
    count = sum(1 for m in neg_markers if m in text_lower)
    if count >= 2:
        return "conflict"
    return "normal"


def _build_conflict_mode_hint(
    mode: str,
    buddy_neg: Dict[str, Any],
) -> str:
    """
    根据冲突模式，返回安抚语气提示。
    """
    if mode != "conflict":
        return ""
    de_esc: str = buddy_neg.get("de_escalation", "表示理解和尊重，换个角度讨论")
    return (
        f"\n\n【当前处于冲突模式，请用更温和的语气安抚对方。"
        f"参考安抚方式：{de_esc}】"
    )


def _score_preference(user_pref: str, buddy_pref: str, topic: str) -> float:
    """
    用规则快速判断兼容性分（0.0-1.0），避免每次都调 LLM。
    """
    if user_pref == buddy_pref:
        return 0.75 + random.uniform(0, 0.15)
    opposites = [
        (("early", "night"), 0.3),
        (("high", "low"), 0.35),
        (("extrovert", "introvert"), 0.4),
        (("flexible", "strict"), 0.45),
    ]
    for (a, b), score in opposites:
        if {user_pref, buddy_pref} == {a, b}:
            return score + random.uniform(0, 0.1)
    return 0.5 + random.uniform(0, 0.2)


# ── LLM 生成函数 ─────────────────────────────────────────────────────────────


def _llm_proposer(
    topic: str,
    user_persona: Dict[str, Any],
    buddy_persona: Dict[str, Any],
    compatibility_breakdown: Optional[Dict[str, Any]] = None,
) -> str:
    """
    用 LLM 生成 user（提议方）的对话内容。
    深度注入 user_persona 的完整字段。
    """
    topic_label = TOPIC_LABELS.get(topic, topic)

    # 提取 user 所有人格字段
    ub = _build_persona_block(user_persona, role="user")
    # 提取 buddy 协商风格（用于判断对方底线）
    buddy_neg = _get_negotiation_style(buddy_persona)

    # 兼容性分析
    compat_block = _build_compatibility_block(compatibility_breakdown, buddy_neg)

    # 动态对话示例（根据 topic 选择）
    example = _get_conversation_example(user_persona, topic)
    never_says = _build_never_says(user_persona)

    try:
        msg = PROPOSER_PROMPT.format(
            mbti=ub["mbti"],
            tone=ub["tone"],
            sentence_patterns=ub["sentence_patterns"],
            language_markers=ub["language_markers"],
            emoji_freq=ub["emoji_freq"],
            typical_phrases=ub["typical_phrases"],
            decision_style=ub["decision_style"],
            stress_response=ub["stress_response"],
            fear_factors=ub["fear_factors"],
            hard_to_compromise=ub["hard_to_compromise"],
            easy_to_compromise=ub["easy_to_compromise"],
            pressure_response=ub["pressure_response"],
            conversation_example=example,
            never_says=never_says,
            topic_label=topic_label,
            user_preference=_fmt_preference(topic, user_persona),
            buddy_preference=_fmt_preference(topic, buddy_persona),
            compatibility_block=compat_block,
        )
        result = llm_client.chat(msg, system_prompt=TRAVEL_SYSTEM)
        if result:
            return result
    except Exception:
        pass

    # Fallback：从对话示例中取相关片段
    fallback_map = {
        "travel_rhythm": _get_conversation_example(user_persona, "travel_rhythm"),
        "food": _get_conversation_example(user_persona, "food"),
        "budget": _get_conversation_example(user_persona, "budget"),
        "social": _get_conversation_example(user_persona, "social"),
        "boundaries": _get_conversation_example(user_persona, "boundaries"),
        "schedule": _get_conversation_example(user_persona, "schedule"),
    }
    fallback = fallback_map.get(topic, fallback_map["travel_rhythm"])
    return (fallback or ub["typical_phrases"] or "嗯，我想这样……")[:100]


def _llm_evaluator(
    topic: str,
    user_persona: Dict[str, Any],
    buddy_persona: Dict[str, Any],
    user_proposal: str,
    compatibility_breakdown: Optional[Dict[str, Any]] = None,
) -> str:
    """
    用 LLM 生成 buddy（评估方）的回应内容。
    深度注入 buddy_persona 的完整字段，并检测协商模式。
    """
    topic_label = TOPIC_LABELS.get(topic, topic)

    # 提取 buddy 所有人格字段
    bb = _build_persona_block(buddy_persona, role="buddy")
    buddy_neg = _get_negotiation_style(buddy_persona)

    # 检测协商模式（用于冲突安抚）
    mode = _detect_mode(user_proposal, buddy_neg)
    conflict_hint = _build_conflict_mode_hint(mode, buddy_neg)

    # 动态对话示例
    example = _get_conversation_example(buddy_persona, topic)
    never_says = _build_never_says(buddy_persona)

    try:
        msg = EVALUATOR_PROMPT.format(
            mbti=bb["mbti"],
            tone=bb["tone"],
            sentence_patterns=bb["sentence_patterns"],
            language_markers=bb["language_markers"],
            emoji_freq=bb["emoji_freq"],
            typical_phrases=bb["typical_phrases"],
            decision_style=bb["decision_style"],
            stress_response=bb["stress_response"],
            fear_factors=bb["fear_factors"],
            hard_to_compromise=bb["hard_to_compromise"],
            easy_to_compromise=bb["easy_to_compromise"],
            pressure_response=bb["pressure_response"],
            conversation_example=example,
            never_says=never_says,
            topic_label=topic_label,
            user_proposal=user_proposal,
            conflict_mode_hint=conflict_hint,
        )
        result = llm_client.chat(msg, system_prompt=TRAVEL_SYSTEM)
        if result:
            return result
    except Exception:
        pass

    # Fallback
    trait = _trait(buddy_persona, topic)
    return PROPOSALS.get(topic, {}).get(trait, "好的，我理解你的想法")


def _llm_compromise(topic: str, user_persona: Dict[str, Any]) -> str:
    """用 LLM 生成折中提议"""
    topic_label = TOPIC_LABELS.get(topic, topic)
    sp: Dict[str, Any] = user_persona.get("speaking_style", {})
    mbti_raw = (
        user_persona.get("mbti_type")
        or user_persona.get("mbti")
        or "ENFP"
    )
    import re as _re
    identity_content = str(user_persona.get("identity", {}).get("content", ""))
    mbti_match = _re.search(r"\b([IE][NS][TF][JP])([AT])?\b", identity_content)
    mbti = mbti_match.group(0) if mbti_match else mbti_raw
    tone = sp.get("chat_tone") or sp.get("tone", "自然随性")
    phrases: List[str] = sp.get("typical_phrases", [])
    typical_phrases = "、".join(phrases[:2]) if phrases else "无特殊口头禅"
    try:
        msg = COMPROMISE_PROMPT.format(
            topic_label=topic_label,
            mbti=mbti,
            tone=tone,
            typical_phrases=typical_phrases,
        )
        result = llm_client.chat(msg)
        if result:
            return result
    except Exception:
        pass
    return "那我们各退一步，找个中间方案怎么样？"


def _llm_resolution(topic: str, buddy_persona: Dict[str, Any]) -> str:
    """用 LLM 生成结题回应"""
    topic_label = TOPIC_LABELS.get(topic, topic)
    try:
        msg = RESOLUTION_PROMPT.format(topic_label=topic_label)
        result = llm_client.chat(msg)
        if result:
            return result
    except Exception:
        pass
    return "好！就这么定了！"


# ── LLM 驱动的协商节点 ────────────────────────────────────────────────────────


def llm_proposer_node(state: NegotiationState) -> NegotiationState:
    """
    LLM 驱动的提议节点。
    生成 user 的提议 + 计算兼容性分（规则快速路径）。
    从 state['user_compatibility_breakdown'] 获取兼容性分解数据并注入 prompt。
    """
    topic = state.get("current_topic", "travel_rhythm")
    up, tp = state["user_persona"], state["twin_persona"]
    topic_label = TOPIC_LABELS.get(topic, topic)

    # 兼容性分解数据（由前端计算并传入）
    breakdown: Optional[Dict[str, Any]] = state.get("user_compatibility_breakdown")

    # 生成提议（深度注入完整 persona 数据）
    proposal = _llm_proposer(topic, up, tp, breakdown)
    eval_msg = _llm_evaluator(topic, up, tp, proposal, breakdown)

    # 打分
    user_trait = _trait(up, topic)
    buddy_trait = _trait(tp, topic)
    score = _score_preference(user_trait, buddy_trait, topic)

    num = len(state["rounds"]) + 1
    entry: NegotiationRound = {
        "round_num": num,
        "topic": topic,
        "topic_label": topic_label,
        "proposer_message": proposal,
        "evaluator_message": eval_msg,
        "evaluator_score": round(score, 3),
        "resolution": "已达成初步共识" if score >= 0.6 else "需要进一步协商",
        "consensus_reached": score >= 0.6,
    }

    new_rounds = state["rounds"] + [entry]
    new_conf = state["conflict_topics"] if score >= 0.6 else state["conflict_topics"] + [topic]
    new_scores = dict(state["consensus_scores"])
    new_scores[topic] = round(score, 3)
    # 以“已覆盖的话题数”作为结束条件，避免冲突加轮导致提前收敛
    done = len(new_scores) >= len(TOPICS)

    return NegotiationState(
        phase=NegotiationPhase.CONSENSUS_FOUND if done else NegotiationPhase.CHAT_ROUND,
        user_persona=up, twin_persona=tp,
        rounds=new_rounds, conflict_topics=new_conf,
        current_topic=topic, consensus_scores=new_scores,
        final_report=None,
        user_compatibility_breakdown=breakdown,
    )


def llm_evaluator_node(state: NegotiationState) -> NegotiationState:
    """
    处理冲突：如果上一轮分数 < 0.6，插入折中轮。
    """
    last = state["rounds"][-1] if state["rounds"] else None
    score = last.get("evaluator_score", 0.5) if last else 0.5
    breakdown: Optional[Dict[str, Any]] = state.get("user_compatibility_breakdown")

    if score >= 0.6:
        return NegotiationState(
            phase=NegotiationPhase.CHAT_ROUND,
            user_persona=state["user_persona"],
            twin_persona=state["twin_persona"],
            rounds=state["rounds"],
            conflict_topics=state["conflict_topics"],
            current_topic=state.get("current_topic", ""),
            consensus_scores=state["consensus_scores"],
            final_report=None,
            user_compatibility_breakdown=breakdown,
        )

    # 冲突 → 插入折中轮
    topic = state.get("current_topic", "travel_rhythm")
    up, tp = state["user_persona"], state["twin_persona"]
    compromise_msg = _llm_compromise(topic, up)
    resolution_msg = _llm_resolution(topic, tp)

    num = len(state["rounds"]) + 1
    entry: NegotiationRound = {
        "round_num": num,
        "topic": topic,
        "topic_label": TOPIC_LABELS.get(topic, topic),
        "proposer_message": compromise_msg,
        "evaluator_message": resolution_msg,
        "evaluator_score": min(round(score + 0.25, 3), 1.0),
        "resolution": "通过折中达成共识",
        "consensus_reached": True,
    }

    new_rounds = state["rounds"] + [entry]
    new_scores = dict(state["consensus_scores"])
    new_scores[topic] = min(round(score + 0.25, 3), 1.0)

    return NegotiationState(
        phase=NegotiationPhase.CONSENSUS_FOUND,
        user_persona=up, twin_persona=tp,
        rounds=new_rounds, conflict_topics=state["conflict_topics"],
        current_topic=topic, consensus_scores=new_scores,
        final_report=None,
        user_compatibility_breakdown=breakdown,
    )


def llm_report_node(state: NegotiationState) -> NegotiationState:
    """生成最终报告（沿用 nodes.py 的规则，补充 LLM 总结）"""
    import datetime as dt

    scores = state["consensus_scores"]
    overall = round(sum(scores.values()) / max(1, len(scores)), 4) if scores else 0.5
    dim_scores = {}
    for t in TOPICS:
        s = scores.get(t, 0.0)
        dim_scores[t] = {
            "score": s,
            "level": "high" if s >= 0.7 else "medium" if s >= 0.5 else "low",
            "label": TOPIC_LABELS.get(t, t),
        }

    # LLM 生成一句话总结
    recommendation = _generate_recommendation(overall, dim_scores, state["conflict_topics"])

    report = {
        "generated_at": dt.datetime.now(dt.timezone.utc).isoformat(),
        "overall_score": overall,
        "dimension_scores": dim_scores,
        "conflict_topics": state["conflict_topics"],
        "total_rounds": len(state["rounds"]),
        "consensus_rounds": sum(1 for r in state["rounds"] if r.get("consensus_reached")),
        "strengths": [TOPIC_LABELS[t] for t, s in scores.items() if s >= 0.7],
        "challenges": [TOPIC_LABELS[t] for t, s in scores.items() if s < 0.6],
        "recommendation": recommendation,
    }

    return NegotiationState(
        phase=NegotiationPhase.REPORT_GENERATED,
        user_persona=state["user_persona"],
        twin_persona=state["twin_persona"],
        rounds=state["rounds"],
        conflict_topics=state["conflict_topics"],
        current_topic=state.get("current_topic", ""),
        consensus_scores=scores,
        final_report=report,
        user_compatibility_breakdown=state.get("user_compatibility_breakdown"),
    )


def _generate_recommendation(overall: float, dim_scores: Dict[str, Any], conflicts: List[str]) -> str:
    """用 LLM 生成推荐语"""
    conflict_labels = [TOPIC_LABELS.get(c, c) for c in conflicts]
    conflict_str = "、".join(conflict_labels) if conflict_labels else "无"

    prompt = f"""两个旅行搭子完成了旅行偏好协商，综合匹配度为 {overall:.0%}。

【各维度评分】
{chr(10).join(f"- {d['label']}: {d['score']:.0%}" for d in dim_scores.values())}

【存在分歧的维度】{conflict_str}

请生成一段 30-50 字的旅行搭子匹配推荐语。要求：
- 口语化、友好、有温度
- 客观描述匹配度和风险
- 可以加 Emoji
- 直接写内容，不要前缀
"""
    try:
        result = llm_client.chat(prompt)
        if result:
            return result
    except Exception:
        pass
    return "推荐深入交流" if overall >= 0.6 else "建议谨慎了解"
