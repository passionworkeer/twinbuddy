# -*- coding: utf-8 -*-
# langgraph/state.py
from __future__ import annotations
from typing import TypedDict, List, Dict, Any, Optional
from enum import Enum

class NegotiationPhase(str, Enum):
    IDLE = "IDLE"
    PERSONA_INIT = "PERSONA_INIT"
    CHAT_ROUND = "CHAT_ROUND"
    CONFLICT_DETECTED = "CONFLICT_DETECTED"
    NEGOTIATION = "NEGOTIATION"
    CONSENSUS_FOUND = "CONSENSUS_FOUND"
    REPORT_GENERATED = "REPORT_GENERATED"

class NegotiationRound(TypedDict, total=False):
    round_num: int
    topic: str
    proposer_message: str
    evaluator_message: str
    evaluator_score: float
    resolution: str
    consensus_reached: bool

class NegotiationState(TypedDict, total=False):
    phase: NegotiationPhase
    user_persona: Dict[str, Any]
    twin_persona: Dict[str, Any]
    rounds: List[NegotiationRound]
    conflict_topics: List[str]
    current_topic: str
    consensus_scores: Dict[str, float]
    final_report: Optional[Dict[str, Any]]
    # 兼容性分解数据，由前端在调用前计算并传入
    user_compatibility_breakdown: Optional[Dict[str, Any]]

def initial_state(up, tp) -> NegotiationState:
    return NegotiationState(
        phase=NegotiationPhase.IDLE,
        user_persona=up, twin_persona=tp,
        rounds=[], conflict_topics=[],
        current_topic="", consensus_scores={}, final_report=None,
        user_compatibility_breakdown=None,
    )
