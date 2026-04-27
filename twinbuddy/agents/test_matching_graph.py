# -*- coding: utf-8 -*-
"""
test_matching_graph.py — TwinBuddy Agent Matching 模块单元测试

覆盖:
  twinbuddy/agents/matching_graph.py
    — input_node, parse_preferences, should_continue_negotiation
    — _build_final_plan, _build_no_consensus_plan, _format_output
    — MAX_ROUNDS, NegotiationRound, GraphState
"""
from __future__ import annotations

import sys
from pathlib import Path

# 确保 twinbuddy/agents 可导入
_root = Path(__file__).parent.parent.parent
if str(_root) not in sys.path:
    sys.path.insert(0, str(_root))

import pytest
from dataclasses import is_dataclass

# 导入需要在 path 正确时才能导入的模块
import twinbuddy.agents.matching_graph as mg_module
from twinbuddy.agents.matching_graph import (
    MAX_ROUNDS,
    NegotiationRound,
    GraphState,
    input_node,
    parse_preferences,
    should_continue_negotiation,
    _build_final_plan,
    _build_no_consensus_plan,
    _format_output,
)


# ─────────────────────────────────────────────────────────────────────────────
# Schema
# ─────────────────────────────────────────────────────────────────────────────

class TestSchema:
    def test_max_rounds_is_3(self):
        assert MAX_ROUNDS == 3

    def test_negotiation_round_is_dataclass(self):
        assert is_dataclass(NegotiationRound)

    def test_negotiation_round_fields(self):
        rnd = NegotiationRound(round_num=1)
        assert rnd.round_num == 1
        assert rnd.proposals == []
        assert rnd.reactions == []
        assert rnd.concessions == []

    def test_negotiation_round_can_hold_data(self):
        rnd = NegotiationRound(
            round_num=2,
            proposals=[{"agent_id": "b1", "agent_name": "阿明", "content": "去成都"}],
            reactions=[{"from_agent": "b1", "to_agent": "b2", "content": "同意"}],
            concessions=[{"agent_id": "b1", "content": "我让一步"}],
        )
        assert len(rnd.proposals) == 1
        assert rnd.proposals[0]["content"] == "去成都"

    def test_graph_state_has_all_required_fields(self):
        state = GraphState(
            messages=[],
            user_persona={"mbti": "ENFP"},
            destination="成都",
        )
        assert state.user_persona["mbti"] == "ENFP"
        assert state.destination == "成都"
        assert state.negotiation_round == 0
        assert state.consensus_reached is False


# ─────────────────────────────────────────────────────────────────────────────
# input_node
# ─────────────────────────────────────────────────────────────────────────────

class TestInputNode:
    def test_sets_error_when_user_persona_empty(self):
        state = GraphState(messages=[], user_persona={})
        result = input_node(state)
        assert result.error == "user_persona is required"

    def test_sets_error_when_mbti_missing(self):
        state = GraphState(messages=[], user_persona={"travel_style": "慢"})
        result = input_node(state)
        assert "mbti" in result.error

    def test_sets_error_when_destination_missing(self):
        state = GraphState(messages=[], user_persona={"mbti": "ENFP", "travel_style": "慢"})
        result = input_node(state)
        assert "destination" in result.error

    def test_normalises_budget_when_missing(self):
        state = GraphState(messages=[], user_persona={
            "mbti": "ENFP",
            "travel_style": "慢",
            "destination": "成都",
        })
        result = input_node(state)
        assert result.budget == "3000-5000元"

    def test_normalises_dates_when_missing(self):
        state = GraphState(messages=[], user_persona={
            "mbti": "ENFP",
            "travel_style": "慢",
            "destination": "成都",
        })
        result = input_node(state)
        assert result.dates == "待定"

    def test_preserves_explicit_budget_and_dates(self):
        state = GraphState(messages=[], user_persona={
            "mbti": "ENFP",
            "travel_style": "慢",
            "destination": "成都",
            "budget": "8000-10000元",
            "dates": "2026-05-01",
        })
        result = input_node(state)
        assert result.budget == "8000-10000元"
        assert result.dates == "2026-05-01"

    def test_copies_destination_to_state(self):
        # All required fields must be present to reach the copy logic
        state = GraphState(messages=[], user_persona={
            "mbti": "ENFP",
            "travel_style": "slow travel",
            "destination": "Chongqing",
            "dates": "2026-07",
            "budget": "5000",
        })
        result = input_node(state)
        assert result.destination == "Chongqing"
        assert result.dates == "2026-07"
        assert result.budget == "5000"


# ─────────────────────────────────────────────────────────────────────────────
# parse_preferences
# ─────────────────────────────────────────────────────────────────────────────

class TestParsePreferences:
    def test_extracts_all_fields(self):
        state = GraphState(
            messages=[],
            user_persona={
                "mbti": "INTJ",
                "travel_style": "暴走",
                "likes": ["爬山", "夜景"],
                "dislikes": ["排队"],
                "budget": "4000",
                "pace": "fast",
            },
            destination="重庆",
            dates="2026-08",
        )
        result = parse_preferences(state)
        # parse_preferences returns GraphState (stores parsed_preferences on it)
        prefs = result.parsed_preferences
        assert prefs["mbti"] == "INTJ"
        assert prefs["travel_style"] == "暴走"
        assert prefs["likes"] == ["爬山", "夜景"]
        assert prefs["dislikes"] == ["排队"]
        assert prefs["destination"] == "重庆"
        assert prefs["dates"] == "2026-08"

    def test_handles_missing_optional_fields(self):
        state = GraphState(messages=[], user_persona={"mbti": "INFP"})
        result = parse_preferences(state)
        prefs = result.parsed_preferences
        assert prefs["mbti"] == "INFP"
        assert prefs["likes"] == []
        assert prefs["dislikes"] == []


# ─────────────────────────────────────────────────────────────────────────────
# should_continue_negotiation
# ─────────────────────────────────────────────────────────────────────────────

class TestShouldContinueNegotiation:
    def test_returns_output_when_consensus_reached(self):
        state = GraphState(messages=[], user_persona={})
        state.consensus_reached = True
        assert should_continue_negotiation(state) == "output_result"

    def test_returns_output_when_max_rounds_reached(self):
        state = GraphState(messages=[], user_persona={})
        state.negotiation_round = MAX_ROUNDS
        state.consensus_reached = False
        assert should_continue_negotiation(state) == "output_result"

    def test_returns_agent_negotiation_when_rounds_remaining(self):
        state = GraphState(messages=[], user_persona={})
        state.negotiation_round = 1
        state.consensus_reached = False
        assert should_continue_negotiation(state) == "agent_negotiation"

    def test_returns_agent_negotiation_before_max_rounds(self):
        state = GraphState(messages=[], user_persona={})
        state.negotiation_round = 2
        state.consensus_reached = False
        assert should_continue_negotiation(state) == "agent_negotiation"


# ─────────────────────────────────────────────────────────────────────────────
# Output formatters
# ─────────────────────────────────────────────────────────────────────────────

class TestBuildFinalPlan:
    def test_contains_destination(self):
        candidates = [
            {"id": "b1", "name": "阿明", "mbti": "ENFP", "travel_style": "慢", "preferences": {"likes": []}},
            {"id": "b2", "name": "小红", "mbti": "ISTJ", "travel_style": "快", "preferences": {"likes": []}},
        ]
        plan = _build_final_plan("成都", "2026-07-15", "4000-6000元", candidates)
        assert "成都" in plan
        assert "2026-07-15" in plan
        assert "4000-6000元" in plan
        assert "阿明" in plan
        assert "小红" in plan

    def test_contains_schedule_days(self):
        plan = _build_final_plan("成都", "2026-07", "5000", [])
        assert "D1" in plan or "抵达" in plan or "接机" in plan


class TestBuildNoConsensusPlan:
    def test_contains_destination_and_max_rounds(self):
        candidates = [
            {"id": "b1", "name": "Buddy1", "mbti": "ENFP", "negotiation_style": "stub立场"},
        ]
        plan = _build_no_consensus_plan("Chengdu", candidates)
        assert "Chengdu" in plan
        assert str(MAX_ROUNDS) in plan

    def test_lists_each_candidate_stance(self):
        candidates = [
            {"id": "b1", "name": "Buddy1", "mbti": "ENFP", "negotiation_style": "StanceA"},
            {"id": "b2", "name": "Buddy2", "mbti": "ISTJ", "negotiation_style": "StanceB"},
        ]
        plan = _build_no_consensus_plan("Chengdu", candidates)
        assert "Buddy1" in plan
        assert "Buddy2" in plan
        assert "StanceA" in plan


class TestFormatOutput:
    def test_shows_candidates_header(self):
        state = GraphState(messages=[], user_persona={})
        state.candidates = [
            {"id": "b1", "name": "Buddy1", "mbti": "ENFP", "travel_style": "slow", "preferences": {"likes": ["food"]}},
        ]
        state.negotiation_rounds = []
        state.final_plan = "Chengdu Trip"
        output = _format_output(state)
        assert "Buddy1" in output

    def test_shows_negotiation_rounds(self):
        state = GraphState(messages=[], user_persona={})
        state.candidates = []
        state.negotiation_rounds = [
            NegotiationRound(
                round_num=1,
                proposals=[{"agent_id": "b1", "agent_name": "Buddy1", "content": "Go to Chengdu"}],
                reactions=[],
                concessions=[],
            ),
        ]
        state.final_plan = "no plan"
        output = _format_output(state)
        assert "第 1 轮协商" in output  # Chinese heading
        assert "提案阶段" in output

    def test_includes_final_plan_in_output(self):
        state = GraphState(messages=[], user_persona={})
        state.candidates = []
        state.negotiation_rounds = []
        state.final_plan = "Perfect Plan"
        output = _format_output(state)
        assert "Perfect Plan" in output
