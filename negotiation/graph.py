# -*- coding: utf-8 -*-
"""
negotiation/graph.py — 单次 LLM 调用协商

重构说明（2026-04-19）：
  旧方案用 LangGraph 状态机，每次 topic 调用 2-4 次 HTTP，
  3 个 topic × 4 = 12 次 HTTP，总延迟 10-20 秒。
  新方案一次 LLM 调用返回完整 JSON，总延迟 1-2 秒。
"""
from __future__ import annotations

import datetime as dt
import random
from typing import Any, Dict, List, Optional

from .state import NegotiationState, NegotiationPhase, NegotiationRound
from .llm_nodes import (
    TOPICS,
    TOPIC_LABELS,
    _build_persona_block,
    _build_compatibility_block,
    _get_negotiation_style,
    _get_conversation_example,
    _build_never_says,
)
from .llm_client import llm_client

# ── System Prompt ──────────────────────────────────────────────────────────────

_NEGOTIATE_SYSTEM = """你是一个旅行搭子协商AI，名字叫"搭搭"。
你会生成两个数字人（user 和 buddy）关于旅行偏好的协商对话。
严格遵循每个人的性格设定，生成口语化、真实的对话。"""

# ── 单次调用 Mega Prompt ──────────────────────────────────────────────────────


def _build_negotiate_prompt(
    user_persona: Dict[str, Any],
    buddy_persona: Dict[str, Any],
    user_compatibility_breakdown: Optional[Dict[str, Any]] = None,
) -> str:
    """构建单次 LLM 调用的 mega prompt。"""

    ub = _build_persona_block(user_persona, role="user")
    bb = _build_persona_block(buddy_persona, role="buddy")
    buddy_neg = _get_negotiation_style(buddy_persona)
    compat_block = _build_compatibility_block(user_compatibility_breakdown, buddy_neg)

    # 每个 topic 的偏好（规则快速获取）
    from .nodes import PROPOSALS, _trait

    topic_blocks = []
    for topic in TOPICS:
        topic_label = TOPIC_LABELS.get(topic, topic)
        user_trait = _trait(user_persona, topic)
        buddy_trait = _trait(buddy_persona, topic)
        user_pref = PROPOSALS.get(topic, {}).get(user_trait, "希望旅途愉快")
        buddy_pref = PROPOSALS.get(topic, {}).get(buddy_trait, "希望旅途愉快")

        # 动态对话示例
        user_example = _get_conversation_example(user_persona, topic) or "（参考语气）"
        buddy_example = _get_conversation_example(buddy_persona, topic) or "（参考语气）"
        user_never = _build_never_says(user_persona)
        buddy_never = _build_never_says(buddy_persona)

        topic_blocks.append(f"""
【话题 {topic_label}】
- user 的偏好：{user_pref}
- buddy 的偏好：{buddy_pref}
- user 说话示例：{user_example}
- buddy 说话示例：{buddy_example}
- user 绝不能说：{user_never}
- buddy 绝不能说：{buddy_never}""")

    topics_text = "\n".join(topic_blocks)

    return f"""两个旅行搭子正在协商旅行计划，请生成完整对话。

【user 人格档案】
- MBTI：{ub['mbti']}，说话语气：{ub['tone']}
- 口头禅：{ub['typical_phrases']}
- 语言特征词：{ub['language_markers']}
- 决策风格：{ub['decision_style']}
- 压力反应：{ub['stress_response']}
- 恐惧因素：{ub['fear_factors']}
- 绝不让步：{ub['hard_to_compromise']}
- 可以妥协：{ub['easy_to_compromise']}

【buddy 人格档案】
- MBTI：{bb['mbti']}，说话语气：{bb['tone']}
- 口头禅：{bb['typical_phrases']}
- 语言特征词：{bb['language_markers']}
- 决策风格：{bb['decision_style']}
- 压力反应：{bb['stress_response']}
- 恐惧因素：{bb['fear_factors']}
- 绝不让步：{bb['hard_to_compromise']}
- 可以妥协：{bb['easy_to_compromise']}

{compat_block}

【三个协商话题】
{topics_text}

请为每个话题生成 user 和 buddy 的对话，然后用 JSON 返回结果：
{{
  "rounds": [
    {{
      "topic": "travel_rhythm",
      "topic_label": "旅行节奏",
      "proposer_message": "user说的话，20-50字，口语化，符合user性格，包含口头禅",
      "evaluator_message": "buddy的回应，20-50字，口语化，符合buddy性格，包含口头禅",
      "evaluator_score": 0.0-1.0的数字，双方越合拍越接近1.0",
      "consensus_reached": true或false
    }},
    {{ ... food ... }},
    {{ ... budget ... }}
  ],
  "conflict_topics": ["topic_key", ...]  // consensus_reached=false 的话题
}}

要求：
- 每条消息20-50字，口语化
- 必须包含说话人的口头禅或语言特征词
- 对话要真实自然，像两个真人在聊天
- 不要在消息前后加引号或前缀，直接写内容
- evaluator_score 根据双方偏好差异打分，差异小=高分，差异大=低分
- 直接返回 JSON，不要有其他文字
"""


def _score_rule(
    user_persona: Dict[str, Any],
    buddy_persona: Dict[str, Any],
    topic: str,
) -> float:
    """用规则快速打分（本地计算，不需要 LLM）。"""
    from .nodes import _trait
    ut = _trait(user_persona, topic)
    bt = _trait(buddy_persona, topic)
    if ut == bt:
        return round(0.75 + random.uniform(0, 0.15), 3)
    opposites = [
        (("early", "night"), 0.3),
        (("high", "low"), 0.35),
        (("extrovert", "introvert"), 0.4),
        (("flexible", "strict"), 0.45),
        (("casual", "refined"), 0.45),
    ]
    for (a, b), score in opposites:
        if {ut, bt} == {a, b}:
            return round(score + random.uniform(0, 0.1), 3)
    return round(0.5 + random.uniform(0, 0.2), 3)


def _parse_rounds(
    raw: Any,
    user_persona: Dict[str, Any],
    buddy_persona: Dict[str, Any],
) -> tuple[List[NegotiationRound], List[str], Dict[str, float]]:
    """
    解析 LLM 返回的 rounds 数据，补充规则打分。
    raw 可能是 dict（正常）或 str（JSON 解析失败时的原始文本）。
    """
    rounds: List[NegotiationRound] = []
    conflict_topics: List[str] = []
    consensus_scores: Dict[str, float] = {}

    if isinstance(raw, dict):
        raw_rounds = raw.get("rounds", [])
        if isinstance(raw_rounds, list):
            for i, r in enumerate(raw_rounds):
                topic = r.get("topic", TOPICS[i] if i < len(TOPICS) else f"topic_{i}")
                topic_label = TOPIC_LABELS.get(topic, topic)
                # 优先用 LLM 返回的分，没有就用规则算
                score = r.get("evaluator_score")
                if score is None:
                    score = _score_rule(user_persona, buddy_persona, topic)
                else:
                    score = round(float(score), 3)

                consensus = bool(r.get("consensus_reached", score >= 0.6))

                entry: NegotiationRound = {
                    "round_num": i + 1,
                    "topic": topic,
                    "topic_label": topic_label,
                    "proposer_message": str(r.get("proposer_message", ""))[:200],
                    "evaluator_message": str(r.get("evaluator_message", ""))[:200],
                    "evaluator_score": score,
                    "resolution": "已达成共识" if consensus else "需要进一步协商",
                    "consensus_reached": consensus,
                }
                rounds.append(entry)
                consensus_scores[topic] = score
                if not consensus:
                    conflict_topics.append(topic)
            return rounds, conflict_topics, consensus_scores

    # 解析失败：用规则兜底
    for i, topic in enumerate(TOPICS):
        score = _score_rule(user_persona, buddy_persona, topic)
        topic_label = TOPIC_LABELS.get(topic, topic)
        entry: NegotiationRound = {
            "round_num": i + 1,
            "topic": topic,
            "topic_label": topic_label,
            "proposer_message": f"（LLM解析失败，规则兜底）我对{topic_label}的偏好是...",
            "evaluator_message": f"（LLM解析失败，规则兜底）我理解你的想法，我们可以商量。",
            "evaluator_score": score,
            "resolution": "已达成共识" if score >= 0.6 else "需要进一步协商",
            "consensus_reached": score >= 0.6,
        }
        rounds.append(entry)
        consensus_scores[topic] = score
        if score < 0.6:
            conflict_topics.append(topic)
    return rounds, conflict_topics, consensus_scores


# ── 入口函数 ─────────────────────────────────────────────────────────────────


def negotiate(
    user_persona: Dict[str, Any],
    twin_persona: Dict[str, Any],
    user_compatibility_breakdown: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    单次 LLM 调用，生成完整协商结果。

    参数：
        user_persona: 用户人格数据字典
        twin_persona: 搭子人格数据字典
        user_compatibility_breakdown: MING 六维度兼容性分解数据

    返回：
        {
            "phase": "REPORT_GENERATED",
            "rounds": [...],
            "consensus_scores": {...},
            "conflict_topics": [...],
            "final_report": {...},
            "user_persona_id": "...",
            "twin_persona_id": "...",
        }
    """
    prompt = _build_negotiate_prompt(
        user_persona, twin_persona, user_compatibility_breakdown
    )

    result = llm_client.chat(prompt, system_prompt=_NEGOTIATE_SYSTEM)

    # 尝试解析 JSON
    raw_data: Any = None
    text = result.strip()

    # 尝试从文本中提取 JSON
    import json as _json
    import re as _re

    json_match = _re.search(r"\{[\s\S]*\}", text)
    if json_match:
        try:
            raw_data = _json.loads(json_match.group(0))
        except _json.JSONDecodeError:
            pass

    if raw_data is None:
        raise RuntimeError(f"LLM 返回无法解析为 JSON: {text[:200]}")

    # 解析 rounds，规则兜底
    rounds, conflict_topics, consensus_scores = _parse_rounds(
        raw_data, user_persona, twin_persona
    )

    # 生成 final_report
    total_score = (
        sum(consensus_scores.values()) / max(1, len(consensus_scores))
        if consensus_scores
        else 0.5
    )

    # LLM 推荐语
    recommendation = str(raw_data.get("recommendation", "")) if isinstance(raw_data, dict) else ""
    if not recommendation or len(recommendation) < 5:
        recommendation = (
            "推荐深入交流" if total_score >= 0.6 else "建议谨慎了解"
        )

    dim_scores = {}
    for t in TOPICS:
        s = consensus_scores.get(t, 0.0)
        dim_scores[t] = {
            "score": s,
            "level": "high" if s >= 0.7 else "medium" if s >= 0.5 else "low",
            "label": TOPIC_LABELS.get(t, t),
        }

    final_report = {
        "generated_at": dt.datetime.now(dt.timezone.utc).isoformat(),
        "overall_score": round(total_score, 4),
        "dimension_scores": dim_scores,
        "conflict_topics": conflict_topics,
        "total_rounds": len(rounds),
        "consensus_rounds": sum(1 for r in rounds if r.get("consensus_reached")),
        "strengths": [TOPIC_LABELS[t] for t, s in consensus_scores.items() if s >= 0.7],
        "challenges": [TOPIC_LABELS[t] for t, s in consensus_scores.items() if s < 0.6],
        "recommendation": recommendation,
    }

    return {
        "phase": NegotiationPhase.REPORT_GENERATED.value,
        "rounds": rounds,
        "consensus_scores": consensus_scores,
        "conflict_topics": conflict_topics,
        "final_report": final_report,
        "user_persona_id": user_persona.get("soul_fingerprint", ""),
        "twin_persona_id": twin_persona.get("soul_fingerprint", ""),
    }


# ── 保留旧接口（兼容，调用新函数）────────────────────────────────────────────


def run_negotiation(
    user_persona: Dict[str, Any],
    twin_persona: Dict[str, Any],
    user_compatibility_breakdown: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    兼容旧接口，内部直接调用单次 LLM 的 negotiate()。
    """
    return negotiate(user_persona, twin_persona, user_compatibility_breakdown)
