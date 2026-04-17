# langgraph/graph.py
from __future__ import annotations
from typing import Dict, Any, Literal
from .state import NegotiationState, NegotiationPhase, initial_state
from .llm_nodes import llm_proposer_node as proposer_node, llm_evaluator_node as evaluator_node, llm_report_node as report_node, TOPICS

def route(state: NegotiationState) -> Literal["proposer", "evaluator", "report", END]:
    """
    路由逻辑：
    - phase == PROPOSE / CHAT_ROUND / default → evaluator（进入评估阶段）
    - phase == EVALUATE → evaluator（同上，保持兼容）
    - phase == CONSENSUS_FOUND → report（达成共识，生成报告）
    - phase == CONFLICT_DETECTED → evaluator（继续协商）
    - phase == REPORT_GENERATED → __end__（结束）
    """
    phase = state.get("phase", NegotiationPhase.PROPOSE)

    if phase == NegotiationPhase.CONSENSUS_FOUND:
        return "report"
    elif phase == NegotiationPhase.REPORT_GENERATED:
        return END
    elif phase == NegotiationPhase.CONFLICT_DETECTED:
        return "evaluator"
    else:
        # PROPOSE / CHAT_ROUND / EVALUATE → 进入 evaluator
        return "evaluator"


def build_negotiation_graph():
    from langgraph.graph import StateGraph, END
    from langgraph.checkpoint.memory import MemorySaver
    builder = StateGraph(NegotiationState)
    builder.add_node("proposer", proposer_node)
    builder.add_node("evaluator", evaluator_node)
    builder.add_node("report", report_node)
    builder.set_entry_point("proposer")
    builder.add_conditional_edges("proposer", route)
    builder.add_edge("evaluator", "proposer")  # 评估后回到提议者
    builder.add_edge("report", END)
    return builder.compile(checkpointer=MemorySaver())

def run_negotiation(user_persona: Dict[str, Any], twin_persona: Dict[str, Any]) -> Dict[str, Any]:
    from langgraph.graph import END
    graph = build_negotiation_graph()
    state = initial_state(user_persona, twin_persona)
    state["phase"] = NegotiationPhase.PERSONA_INIT
    config = {"configurable": {"thread_id": "default"}}
    for topic in TOPICS:
        if state["phase"] == NegotiationPhase.REPORT_GENERATED: break
        state["current_topic"] = topic
        result = graph.invoke(state, config)
        state = NegotiationState(
            phase=result["phase"], user_persona=result["user_persona"],
            twin_persona=result["twin_persona"], rounds=result["rounds"],
            conflict_topics=result["conflict_topics"],
            current_topic=result.get("current_topic", topic),
            consensus_scores=result["consensus_scores"], final_report=result["final_report"],
        )
    return {
        "phase": state["phase"], "rounds": state["rounds"],
        "consensus_scores": state["consensus_scores"],
        "conflict_topics": state["conflict_topics"],
        "final_report": state["final_report"],
        "user_persona_id": state["user_persona"].get("soul_fingerprint", ""),
        "twin_persona_id": state["twin_persona"].get("soul_fingerprint", ""),
    }
