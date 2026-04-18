# -*- coding: utf-8 -*-
# langgraph/nodes.py
from __future__ import annotations
from typing import Any, Dict, List
from .state import NegotiationState, NegotiationPhase, NegotiationRound

TOPICS = ["travel_rhythm", "food", "budget"]
TOPIC_LABELS = {
    "travel_rhythm": "旅行节奏", "food": "美食偏好",
    "budget": "预算范围",
}
PROPOSALS = {
    "travel_rhythm": {
        "extrovert": "喜欢随时出发、充满惊喜的旅行！不走寻常路~",
        "introvert": "偏好提前规划，每天不要太满，需要独处充电时间",
    },
    "food": {
        "casual": "路边摊和苍蝇馆子才是灵魂！要的就是地道~",
        "refined": "更倾向于环境好的餐厅，要有氛围感，拍照也好看",
    },
    "budget": {
        "high": "旅行是为了体验，花钱买享受是值得的",
        "medium": "性价比优先，但不会亏待自己",
        "low": "穷游也是一种态度，住青旅坐绿皮火车很有感觉",
    },
    "social": {
        "high": "旅行就是要认识新朋友！搭子多多益善~",
        "medium": "可以社交，但更喜欢和熟悉的人一起",
        "low": "旅行是为了远离人群，享受安静",
    },
    "boundaries": {
        "flexible": "计划赶不上变化，随性一点更自在~",
        "strict": "我需要明确的边界，私人空间是底线",
    },
    "schedule": {
        "early": "早起看日出是我的习惯，6点起床跑步才有精神",
        "night": "我是夜猫子，晚上才是我的主场，熬夜写诗",
    },
}

def _trait(p, dim):
    """
    从 persona 对象提取指定维度的特征值。

    persona 结构（frontend_api.py 生成）：
      - identity.content 包含 "内向/外向" 等关键词
      - speaking_style.chat_tone / typical_phrases
      - emotion_decision.decision_style
      - social_behavior.social_style
      - mbti_influence 包含完整 MBTI 字符串
    """
    # 1. 优先从 identity 层解析 MBTI 维度（最可靠）
    identity_content = str(p.get("identity", {}).get("content", ""))

    # 2. 从 mbti_influence 提取 MBTI 类型（如 "ENFP"）
    import re
    mbti_match = re.search(r"\b([IE][NS][TF][JP])([AT])?\b", identity_content)
    if not mbti_match:
        mbti_influence = str(p.get("mbti_influence", ""))
        mbti_match = re.search(r"\b([IE][NS][TF][JP])([AT])?\b", mbti_influence)
    mbti = mbti_match.group(0) if mbti_match else ""

    # 3. 解析四个维度
    energy = mbti[0] if len(mbti) >= 1 else "N"   # I/E
    lifestyle = mbti[3] if len(mbti) >= 4 else "J"  # J/P

    # 4. speaking_style 层
    speaking_style = p.get("speaking_style", {})
    st_chat_tone = str(speaking_style.get("chat_tone", "")).lower()

    # 5. social_behavior 层
    social_behavior = p.get("social_behavior", {})
    social_style = str(social_behavior.get("social_style", "")).lower()

    # 维度映射
    if dim == "travel_rhythm":
        if energy == "E":
            return "extrovert"
        elif energy == "I":
            return "introvert"
        return "introvert"
    if dim == "food":
        if "温暖" in st_chat_tone or "热情" in st_chat_tone:
            return "casual"
        if "沉稳" in st_chat_tone or "结构" in st_chat_tone:
            return "refined"
        return "casual"
    if dim == "budget":
        return "medium"
    if dim == "social":
        if energy == "E":
            return "high"
        if "主动" in social_style:
            return "medium"
        return "low"
    if dim == "boundaries":
        return "strict" if lifestyle == "J" else "flexible"
    if dim == "schedule":
        return "early" if lifestyle == "J" else "night"
    return "medium"

def proposer_node(state: NegotiationState) -> NegotiationState:
    topic = state.get("current_topic", "travel_rhythm")
    up, tp = state["user_persona"], state["twin_persona"]
    trait_u, trait_t = _trait(up, topic), _trait(tp, topic)
    label = TOPIC_LABELS.get(topic, topic)
    proposal = PROPOSALS.get(topic, {}).get(trait_u, f"关于{label}，我的偏好是...")
    eval_msg = PROPOSALS.get(topic, {}).get(trait_t, f"我的偏好是...")
    score = 0.75 if trait_u == trait_t else 0.42
    num = len(state["rounds"]) + 1
    entry: NegotiationRound = {
        "round_num": num, "topic": topic,
        "proposer_message": proposal, "evaluator_message": eval_msg,
        "evaluator_score": score,
        "resolution": "已达成初步共识" if score >= 0.6 else "需要进一步协商",
        "consensus_reached": score >= 0.6,
    }
    new_rounds = state["rounds"] + [entry]
    new_conf = state["conflict_topics"] if score >= 0.6 else state["conflict_topics"] + [topic]
    new_scores = dict(state["consensus_scores"]); new_scores[topic] = score
    done = num >= len(TOPICS)
    return NegotiationState(
        phase=NegotiationPhase.CONSENSUS_FOUND if done else NegotiationPhase.CHAT_ROUND,
        user_persona=up, twin_persona=tp,
        rounds=new_rounds, conflict_topics=new_conf,
        current_topic=topic, consensus_scores=new_scores, final_report=None,
    )

def evaluator_node(state: NegotiationState) -> NegotiationState:
    last = state["rounds"][-1] if state["rounds"] else None
    score = last.get("evaluator_score", 0.5) if last else 0.5
    return NegotiationState(
        phase=NegotiationPhase.CONFLICT_DETECTED if score < 0.6 else NegotiationPhase.CHAT_ROUND,
        user_persona=state["user_persona"], twin_persona=state["twin_persona"],
        rounds=state["rounds"], conflict_topics=state["conflict_topics"],
        current_topic=state.get("current_topic",""),
        consensus_scores=state["consensus_scores"], final_report=None,
    )

def report_node(state: NegotiationState) -> NegotiationState:
    import datetime as dt
    scores = state["consensus_scores"]
    overall = round(sum(scores.values()) / max(1, len(scores)), 4) if scores else 0.5
    dim_scores = {}
    for t in TOPICS:
        s = scores.get(t, 0.0)
        dim_scores[t] = {"score": s, "level": "high" if s >= 0.7 else "medium" if s >= 0.5 else "low"}
    report = {
        "generated_at": dt.datetime.now(dt.timezone.utc).isoformat(),
        "overall_score": overall, "dimension_scores": dim_scores,
        "conflict_topics": state["conflict_topics"],
        "total_rounds": len(state["rounds"]),
        "consensus_rounds": sum(1 for r in state["rounds"] if r.get("consensus_reached")),
        "strengths": [TOPIC_LABELS[t] for t, s in scores.items() if s >= 0.7],
        "challenges": [TOPIC_LABELS[t] for t, s in scores.items() if s < 0.6],
        "recommendation": "推荐深入交流" if overall >= 0.6 else "建议谨慎了解",
    }
    return NegotiationState(
        phase=NegotiationPhase.REPORT_GENERATED,
        user_persona=state["user_persona"], twin_persona=state["twin_persona"],
        rounds=state["rounds"], conflict_topics=state["conflict_topics"],
        current_topic=state.get("current_topic",""),
        consensus_scores=scores, final_report=report,
    )
