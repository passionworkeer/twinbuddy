# langgraph/nodes.py
from __future__ import annotations
from typing import Any, Dict, List
from .state import NegotiationState, NegotiationPhase, NegotiationRound

TOPICS = ["travel_rhythm", "food", "budget", "social", "boundaries", "schedule"]
TOPIC_LABELS = {
    "travel_rhythm": "旅行节奏", "food": "美食偏好",
    "budget": "预算范围", "social": "社交方式",
    "boundaries": "边界设置", "schedule": "作息时间",
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
    ev = p.get("mbti_dimension_evidence", {})
    st = p.get("speaking_style_evidence", {})
    if dim == "travel_rhythm": return ev.get("energy", "introvert")
    if dim == "food": return st.get("formality", "casual")
    if dim == "budget": return "medium"
    if dim == "social": return "high" if ev.get("energy") == "extrovert" else "medium"
    if dim == "boundaries": return "strict" if ev.get("lifestyle") == "judging" else "flexible"
    if dim == "schedule": return "early" if ev.get("lifestyle") == "judging" else "night"
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
