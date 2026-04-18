# -*- coding: utf-8 -*-
# langgraph/graph.py
from __future__ import annotations

from typing import Dict, Any, Literal, Optional

from langgraph.graph import StateGraph, END

from .state import NegotiationState, NegotiationPhase, initial_state
from .llm_nodes import (
    llm_proposer_node as proposer_node,
    llm_evaluator_node as evaluator_node,
    llm_report_node as report_node,
    TOPICS,
)


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
    builder = StateGraph(NegotiationState)
    builder.add_node("proposer", proposer_node)
    builder.add_node("evaluator", evaluator_node)
    builder.add_node("report", report_node)
    builder.set_entry_point("proposer")
    builder.add_conditional_edges("proposer", route)
    # 每次 invoke 仅处理一个 topic，topic 切换由 run_negotiation 外层循环控制
    builder.add_edge("evaluator", END)
    builder.add_edge("report", END)
    return builder.compile()


def run_negotiation(
    user_persona: Dict[str, Any],
    twin_persona: Dict[str, Any],
    user_compatibility_breakdown: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    运行双数字人协商流程。

    参数：
        user_persona: 用户人格数据字典（来自 persona_doc 或前端）
        twin_persona: 搭子人格数据字典（来自 buddy JSON，包含完整的
                      speaking_style / negotiation_style / conversation_examples 等字段）
        user_compatibility_breakdown: MING 六维度兼容性分解数据，由前端计算后传入。
                                     包含 total / strengths / red_flags / easy_to_compromise 等字段，
                                     LLM proposer 据此选择协商策略。
    """
    graph = build_negotiation_graph()
    state = initial_state(user_persona, twin_persona)
    state["phase"] = NegotiationPhase.PERSONA_INIT
    # 深度注入：传递兼容性分解数据，供 LLM proposer 节点使用
    state["user_compatibility_breakdown"] = user_compatibility_breakdown
    for topic in TOPICS:
        if state["phase"] == NegotiationPhase.REPORT_GENERATED:
            break
        state["current_topic"] = topic
        result = graph.invoke(state)
        state = NegotiationState(
            phase=result["phase"],
            user_persona=result["user_persona"],
            twin_persona=result["twin_persona"],
            rounds=result["rounds"],
            conflict_topics=result["conflict_topics"],
            current_topic=result.get("current_topic", topic),
            consensus_scores=result["consensus_scores"],
            final_report=result["final_report"],
            user_compatibility_breakdown=result.get("user_compatibility_breakdown"),
        )
    return {
        "phase": state["phase"],
        "rounds": state["rounds"],
        "consensus_scores": state["consensus_scores"],
        "conflict_topics": state["conflict_topics"],
        "final_report": state["final_report"],
        "user_persona_id": state["user_persona"].get("soul_fingerprint", ""),
        "twin_persona_id": state["twin_persona"].get("soul_fingerprint", ""),
    }
