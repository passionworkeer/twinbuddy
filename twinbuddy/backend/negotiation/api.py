# -*- coding: utf-8 -*-
# langgraph/api.py
from __future__ import annotations
from typing import Dict, Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from .graph import run_negotiation

router = APIRouter(prefix="/negotiation", tags=["协商"])

class NegotiationRequest(BaseModel):
    user_persona: Dict[str, Any]
    twin_persona: Dict[str, Any]

class NegotiationResponse(BaseModel):
    phase: str
    rounds: list
    consensus_scores: Dict[str, float]
    conflict_topics: list
    final_report: Dict[str, Any] | None

@router.post("/run", response_model=NegotiationResponse)
def run_negotiation_api(req: NegotiationRequest) -> NegotiationResponse:
    if not req.user_persona or not req.twin_persona:
        raise HTTPException(status_code=400, detail="user_persona and twin_persona are required")
    try:
        result = run_negotiation(req.user_persona, req.twin_persona)
        return NegotiationResponse(
            phase=result["phase"],
            rounds=result["rounds"],
            consensus_scores=result["consensus_scores"],
            conflict_topics=result["conflict_topics"],
            final_report=result["final_report"],
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
