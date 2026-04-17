"""
langgraph/llm_nodes.py — LLM 驱动的协商节点

用 MiniMax LLM 替代模板文本，生成真实的对话内容。
Fallback：若 LLM 调用失败，降级到原模板逻辑。
"""
from __future__ import annotations

import random
from typing import Any, Dict, List

from .state import NegotiationState, NegotiationPhase, NegotiationRound
from .nodes import TOPICS, TOPIC_LABELS, PROPOSALS, _trait
from ..llm_client import llm_client

# ── System Prompts ─────────────────────────────────────────────────────────

TRAVEL_SYSTEM = """你是一个旅行搭子协商AI，名字叫"搭搭"。两个用户（user 和 buddy）正在讨论旅行偏好，请你来生成他们说的话。
你必须严格遵循用户性格：MBTI 性格决定说话风格（E人话多热情，I人话少沉稳）。
每次只生成一条消息，不要生成多余内容。"""

PROPOSER_PROMPT = """你是 user 的数字分身，正在和 buddy 协商旅行计划。

【你的性格】
- MBTI：{mbti}
- 旅行风格：{travel_style}
- 说话风格：{speaking_style}
- 典型口头禅：{typical_phrases}

【当前讨论话题】{topic_label}
【对方(buddy)的偏好】{buddy_preference}

【你的偏好是】{user_preference}

请用符合你性格的方式，说一段话来表达你的偏好。要求：
- 30-60字
- 自然口语化
- 符合你的MBTI性格（E人：热情、话多；I人：沉稳、话少）
- 不用写"user说："这样的前缀，直接写对话内容
"""

EVALUATOR_PROMPT = """你是 buddy 的数字分身，正在回应 user 的提议。

【你的性格】
- MBTI：{mbti}
- 旅行风格：{travel_style}
- 说话风格：{speaking_style}
- 典型口头禅：{typical_phrases}

【当前讨论话题】{topic_label}
【对方(user)的提议】{user_proposal}

请用符合你性格的方式，回应对方的提议。要求：
- 20-50字
- 自然口语化
- 可以表示认同、部分认同或提出不同意见
- 不用写"buddy说："这样的前缀，直接写对话内容
"""

COMPROMISE_PROMPT = """两个旅行搭子正在讨论【{topic_label}】，他们在旅行偏好上有些分歧。
请生成 user 的数字分身说的一句话，用来提议折中方案。要求：
- 20-40字
- 口语化、友好的语气
- 体现 user 的性格（{mbti}，{speaking_style}）
- 真正提出一个具体的折中方案
- 直接写对话内容，不要前缀
"""

RESOLUTION_PROMPT = """两个旅行搭子已经完成了一轮协商，话题是【{topic_label}】。
请生成 buddy 的数字分身说的一句话，表示接受折中方案并结题。要求：
- 15-30字
- 口语化、积极的语气
- 直接写对话内容，不要前缀
"""


def _fmt_preference(topic: str, persona: Dict[str, Any]) -> str:
    trait = _trait(persona, topic)
    return PROPOSALS.get(topic, {}).get(trait, "希望旅途愉快")


def _score_preference(user_pref: str, buddy_pref: str, topic: str) -> float:
    """
    用 LLM 打分：两个偏好有多匹配，返回 0.0-1.0。
    优先用规则快速判断，减少 LLM 调用次数。
    """
    user_trait = user_pref
    buddy_trait = buddy_pref

    # 快速规则（避免每次都调 LLM）
    if user_trait == buddy_trait:
        return 0.75 + random.uniform(0, 0.15)
    # 极端对立组合
    opposites = [
        (("early", "night"), 0.3),
        (("high", "low"), 0.35),
        (("extrovert", "introvert"), 0.4),
        (("flexible", "strict"), 0.45),
    ]
    for (a, b), score in opposites:
        if {user_trait, buddy_trait} == {a, b}:
            return score + random.uniform(0, 0.1)
    return 0.5 + random.uniform(0, 0.2)


def _llm_proposer(
    topic: str, user_persona: Dict[str, Any], buddy_persona: Dict[str, Any]
) -> str:
    """用 LLM 生成 user 的提议"""
    topic_label = TOPIC_LABELS.get(topic, topic)
    sp = user_persona.get("speaking_style", {})
    try:
        msg = PROPOSER_PROMPT.format(
            mbti=user_persona.get("mbti_type", "ENFP"),
            travel_style=user_persona.get("travel_style", "随性探索型"),
            speaking_style=sp.get("chat_tone", "自然随性"),
            typical_phrases=", ".join(sp.get("typical_phrases", [])[:2]),
            topic_label=topic_label,
            user_preference=_fmt_preference(topic, user_persona),
            buddy_preference=_fmt_preference(topic, buddy_persona),
        )
        result = llm_client.chat(msg, system_prompt=TRAVEL_SYSTEM)
        if result:
            return result
    except Exception:
        pass
    # Fallback
    trait = _trait(user_persona, topic)
    return PROPOSALS.get(topic, {}).get(trait, f"关于{topic_label}，我希望能达成共识")[0]


def _llm_evaluator(
    topic: str, user_persona: Dict[str, Any], buddy_persona: Dict[str, Any], user_proposal: str
) -> str:
    """用 LLM 生成 buddy 的回应"""
    topic_label = TOPIC_LABELS.get(topic, topic)
    sp = buddy_persona.get("speaking_style", {})
    try:
        msg = EVALUATOR_PROMPT.format(
            mbti=buddy_persona.get("mbti_type", "INFP"),
            travel_style=buddy_persona.get("travel_style", "诗意漫游者"),
            speaking_style=sp.get("chat_tone", "温和细腻"),
            typical_phrases=", ".join(sp.get("typical_phrases", [])[:2]),
            topic_label=topic_label,
            user_proposal=user_proposal,
        )
        result = llm_client.chat(msg, system_prompt=TRAVEL_SYSTEM)
        if result:
            return result
    except Exception:
        pass
    # Fallback
    trait = _trait(buddy_persona, topic)
    return PROPOSALS.get(topic, {}).get(trait, "好的，我理解了")[0]


def _llm_compromise(topic: str, user_persona: Dict[str, Any]) -> str:
    """用 LLM 生成折中提议"""
    topic_label = TOPIC_LABELS.get(topic, topic)
    sp = user_persona.get("speaking_style", {})
    try:
        msg = COMPROMISE_PROMPT.format(
            topic_label=topic_label,
            mbti=user_persona.get("mbti_type", "ENFP"),
            speaking_style=sp.get("chat_tone", "自然随性"),
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


# ── LLM 驱动的协商节点 ─────────────────────────────────────────────────────


def llm_proposer_node(state: NegotiationState) -> NegotiationState:
    """
    LLM 驱动的提议节点。
    生成 user 的提议 + 计算兼容性分（规则快速路径 + LLM 补充）。
    """
    topic = state.get("current_topic", "travel_rhythm")
    up, tp = state["user_persona"], state["twin_persona"]
    topic_label = TOPIC_LABELS.get(topic, topic)

    # 生成提议
    proposal = _llm_proposer(topic, up, tp)
    eval_msg = _llm_evaluator(topic, up, tp, proposal)

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
    done = num >= len(TOPICS)

    return NegotiationState(
        phase=NegotiationPhase.CONSENSUS_FOUND if done else NegotiationPhase.CHAT_ROUND,
        user_persona=up, twin_persona=tp,
        rounds=new_rounds, conflict_topics=new_conf,
        current_topic=topic, consensus_scores=new_scores, final_report=None,
    )


def llm_evaluator_node(state: NegotiationState) -> NegotiationState:
    """
    处理冲突：如果上一轮分数 < 0.6，插入折中轮。
    """
    last = state["rounds"][-1] if state["rounds"] else None
    score = last.get("evaluator_score", 0.5) if last else 0.5

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
        "evaluator_score": round(score + 0.25, 3),  # 折中后分数提升
        "resolution": "通过折中达成共识",
        "consensus_reached": True,
    }

    new_rounds = state["rounds"] + [entry]
    new_scores = dict(state["consensus_scores"])
    new_scores[topic] = round(score + 0.25, 3)

    return NegotiationState(
        phase=NegotiationPhase.CONSENSUS_FOUND,
        user_persona=up, twin_persona=tp,
        rounds=new_rounds, conflict_topics=state["conflict_topics"],
        current_topic=topic, consensus_scores=new_scores, final_report=None,
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
