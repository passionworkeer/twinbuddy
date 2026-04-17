# langgraph/graph.py
from __future__ import annotations
from typing import Dict, Any, Literal
from .state import NegotiationState, NegotiationPhase, initial_state
from .nodes import proposer_node, evaluator_node, report_node, TOPICS

def build_negotiation_graph():
    from langgraph.graph import StateGraph, END
    from langgraph.checkpoint.memory import MemorySaver
    builder = StateGraph(NegotiationState)
    builder.add_node("proposer", proposer_node)
    builder.add_node("evaluator", evaluator_node)
    builder.add_node("report", report_node)
    def route(state: NegotiationState) -> Literal["evaluator", "report", END]:
        if state["phase"] == NegotiationPhase.REPORT_GENERATED: return END
        if state["phase"] == NegotiationPhase.CONSENSUS_FOUND: return "report"
        return "evaluator"
    builder.set_entry_point("proposer")
    builder.add_edge("proposer", "evaluator")
    builder.add_conditional_edges("evaluator", route)
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
