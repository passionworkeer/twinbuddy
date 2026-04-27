# -*- coding: utf-8 -*-
"""
test_negotiation.py — 协商模块单元测试

覆盖:
  api/negotiation/state.py   — NegotiationPhase, NegotiationState, initial_state
  api/negotiation/nodes.py   — _trait, PROPOSALS, TOPICS, proposer_node, report_node
  api/negotiation/graph.py    — _score_rule, _parse_rounds (不需要 LLM)
"""
from __future__ import annotations

import pytest

from api.negotiation.state import (
    NegotiationPhase,
    NegotiationState,
    NegotiationRound,
    initial_state,
)
from api.negotiation.nodes import (
    TOPICS,
    TOPIC_LABELS,
    PROPOSALS,
    _trait,
    proposer_node,
    evaluator_node,
    report_node,
)
from api.negotiation.graph import _score_rule, _parse_rounds, _build_negotiate_prompt


# ─────────────────────────────────────────────────────────────────────────────
# state.py
# ─────────────────────────────────────────────────────────────────────────────

class TestNegotiationPhase:
    def test_all_phases_are_string_enum_values(self):
        assert NegotiationPhase.IDLE.value == "IDLE"
        assert NegotiationPhase.PROPOSE.value == "PROPOSE"
        assert NegotiationPhase.CHAT_ROUND.value == "CHAT_ROUND"
        assert NegotiationPhase.CONSENSUS_FOUND.value == "CONSENSUS_FOUND"
        assert NegotiationPhase.REPORT_GENERATED.value == "REPORT_GENERATED"

    def test_phase_is_comparable(self):
        assert NegotiationPhase.IDLE != NegotiationPhase.CHAT_ROUND
        assert NegotiationPhase.CONSENSUS_FOUND == NegotiationPhase.CONSENSUS_FOUND


class TestNegotiationState:
    def test_can_create_minimal_state(self):
        state = NegotiationState(
            phase=NegotiationPhase.IDLE,
            user_persona={},
            twin_persona={},
        )
        assert state["phase"] == NegotiationPhase.IDLE
        assert state["user_persona"] == {}
        assert state["twin_persona"] == {}

    def test_state_accepts_all_keys(self):
        state = NegotiationState(
            phase=NegotiationPhase.CHAT_ROUND,
            user_persona={"mbti": "ENFP"},
            twin_persona={"mbti": "ISTJ"},
            rounds=[],
            conflict_topics=["food"],
            current_topic="food",
            consensus_scores={"food": 0.72},
            final_report={"overall_score": 0.72},
            user_compatibility_breakdown={},
        )
        assert state["conflict_topics"] == ["food"]
        assert state["consensus_scores"]["food"] == 0.72
        assert state["final_report"]["overall_score"] == 0.72


class TestInitialState:
    def test_initial_state_has_idle_phase(self):
        up = {"mbti": "ENFP"}
        tp = {"mbti": "ISTJ"}
        state = initial_state(up, tp)
        assert state["phase"] == NegotiationPhase.IDLE
        assert state["user_persona"] == up
        assert state["twin_persona"] == tp
        assert state["rounds"] == []
        assert state["conflict_topics"] == []
        assert state["consensus_scores"] == {}
        assert state["final_report"] is None

    def test_initial_state_is_independent_of_inputs(self):
        up, tp = {"id": "user1"}, {"id": "buddy1"}
        s1 = initial_state(up, tp)
        s2 = initial_state(up, tp)
        s1["phase"] = NegotiationPhase.CONSENSUS_FOUND
        assert s2["phase"] == NegotiationPhase.IDLE  # not mutated


# ─────────────────────────────────────────────────────────────────────────────
# nodes.py
# ─────────────────────────────────────────────────────────────────────────────

class TestTopics:
    def test_topics_has_three_items(self):
        assert len(TOPICS) == 3
        assert "travel_rhythm" in TOPICS
        assert "food" in TOPICS
        assert "budget" in TOPICS

    def test_topic_labels_covers_all_topics(self):
        for topic in TOPICS:
            assert topic in TOPIC_LABELS
        assert TOPIC_LABELS["travel_rhythm"] == "旅行节奏"
        assert TOPIC_LABELS["food"] == "美食偏好"
        assert TOPIC_LABELS["budget"] == "预算范围"


class TestProposals:
    def test_proposals_has_all_topics(self):
        for topic in TOPICS:
            assert topic in PROPOSALS

    def test_proposals_structure_is_consistent(self):
        for topic, options in PROPOSALS.items():
            assert isinstance(options, dict)
            assert len(options) >= 2


class TestTrait:
    # NOTE: _trait() uses re.search(r'\b([IE][NS][TF][JP])\b', ...).
    # \b does NOT match between a Chinese char and ASCII (Python Unicode \w includes CJK).
    # Therefore it falls back to mbti_influence → empty → defaults below.

    def test_extrovert_from_mbti_influence(self):
        # mbti_influence is the primary MBTI source in production
        p = {"identity": {"content": "我是ENFP外向型人格"}, "mbti_influence": "ENFP-A", "speaking_style": {}, "social_behavior": {}}
        assert _trait(p, "travel_rhythm") == "extrovert"

    def test_introvert_from_mbti_influence(self):
        p = {"identity": {"content": "INTJ内敛深沉"}, "mbti_influence": "INTJ", "speaking_style": {}, "social_behavior": {}}
        assert _trait(p, "travel_rhythm") == "introvert"

    def test_fallback_when_no_mbti(self):
        # No mbti_influence → empty string → defaults to N (introvert), J (early)
        p = {"identity": {"content": "无MBTI"}, "speaking_style": {}, "social_behavior": {}}
        assert _trait(p, "travel_rhythm") == "introvert"
        assert _trait(p, "schedule") == "early"

    def test_food_casual_from_warm_chat_tone(self):
        p = {"mbti_influence": "INFJ", "identity": {"content": "INFJ"}, "speaking_style": {"chat_tone": "温暖热情"}, "social_behavior": {}}
        assert _trait(p, "food") == "casual"

    def test_food_refined_from_steady_chat_tone(self):
        p = {"mbti_influence": "ISTJ", "identity": {"content": "ISTJ"}, "speaking_style": {"chat_tone": "沉稳结构"}, "social_behavior": {}}
        assert _trait(p, "food") == "refined"

    def test_social_high_from_E(self):
        p = {"mbti_influence": "ENFP", "identity": {"content": "ENFP外向"}, "speaking_style": {}, "social_behavior": {}}
        assert _trait(p, "social") == "high"

    def test_social_low_from_I(self):
        p = {"mbti_influence": "INTJ", "identity": {"content": "INTJ内敛"}, "speaking_style": {}, "social_behavior": {}}
        assert _trait(p, "social") == "low"

    def test_schedule_early_from_J_lifestyle(self):
        p = {"mbti_influence": "ENFJ-A", "identity": {"content": "ENFJ-A"}, "speaking_style": {}, "social_behavior": {}}
        assert _trait(p, "schedule") == "early"

    def test_schedule_night_from_P_lifestyle(self):
        p = {"mbti_influence": "ENFP-P", "identity": {"content": "ENFP-P"}, "speaking_style": {}, "social_behavior": {}}
        assert _trait(p, "schedule") == "night"

    def test_budget_always_medium(self):
        p = {"mbti_influence": "ENFP", "identity": {"content": "ENFP"}}
        assert _trait(p, "budget") == "medium"


class TestProposerNode:
    def test_proposer_adds_one_round(self):
        state = initial_state(
            {"identity": {"content": "ENFP"}},
            {"identity": {"content": "ISTJ"}},
        )
        result = proposer_node(state)
        assert len(result["rounds"]) == 1
        assert result["rounds"][0]["round_num"] == 1

    def test_consensus_reached_when_traits_match(self):
        # Both extrovert → same trait → high score → consensus
        state = initial_state(
            {"identity": {"content": "ENFP"}},
            {"identity": {"content": "ESFJ"}},
        )
        state["current_topic"] = "travel_rhythm"
        result = proposer_node(state)
        assert result["rounds"][0]["consensus_reached"] is True

    def test_conflict_when_traits_differ(self):
        state = initial_state(
            {"identity": {"content": "ENFP"}},
            {"identity": {"content": "INTJ"}},
        )
        state["current_topic"] = "travel_rhythm"
        result = proposer_node(state)
        assert result["rounds"][0]["consensus_reached"] is False
        assert "travel_rhythm" in result["conflict_topics"]

    def test_updates_consensus_scores(self):
        state = initial_state(
            {"identity": {"content": "ENFP"}},
            {"identity": {"content": "ISTJ"}},
        )
        state["current_topic"] = "travel_rhythm"
        result = proposer_node(state)
        assert "travel_rhythm" in result["consensus_scores"]


class TestReportNode:
    def test_report_node_sets_phase_to_report_generated(self):
        state = initial_state({}, {})
        state["consensus_scores"] = {"travel_rhythm": 0.75, "food": 0.60}
        result = report_node(state)
        assert result["phase"] == NegotiationPhase.REPORT_GENERATED

    def test_report_contains_overall_score(self):
        state = initial_state({}, {})
        state["consensus_scores"] = {"travel_rhythm": 0.8, "food": 0.4}
        result = report_node(state)
        assert "final_report" in result
        assert result["final_report"]["overall_score"] == pytest.approx(0.6, abs=0.001)

    def test_report_classifies_strengths_and_challenges(self):
        state = initial_state({}, {})
        state["consensus_scores"] = {"travel_rhythm": 0.8, "food": 0.3}
        result = report_node(state)
        strengths = result["final_report"]["strengths"]
        challenges = result["final_report"]["challenges"]
        assert "旅行节奏" in strengths
        assert "美食偏好" in challenges


# ─────────────────────────────────────────────────────────────────────────────
# graph.py — LLM-free helpers only
# ─────────────────────────────────────────────────────────────────────────────

class TestScoreRule:
    def test_identical_traits_score_high(self):
        user = {"identity": {"content": "ENFP"}}
        buddy = {"identity": {"content": "ENFP"}}
        score = _score_rule(user, buddy, "travel_rhythm")
        assert 0.75 <= score <= 0.90  # 0.75 + 0~0.15

    def test_opposite_traits_score_low(self):
        user = {"identity": {"content": "ENFP"}}  # E → extrovert
        buddy = {"identity": {"content": "INTJ"}}  # I → introvert
        score = _score_rule(user, buddy, "travel_rhythm")
        assert 0.3 <= score <= 0.5  # opposite bucket, may be up to 0.5 with random

    def test_score_is_between_0_and_1(self):
        for topic in TOPICS:
            for mbti_a in ["ENFP", "INTJ", "ESFJ", "ISTJ"]:
                for mbti_b in ["ENFP", "INTJ", "ESFJ", "ISTJ"]:
                    s = _score_rule(
                        {"identity": {"content": mbti_a}},
                        {"identity": {"content": mbti_b}},
                        topic,
                    )
                    assert 0.0 <= s <= 1.0


class TestParseRounds:
    def test_parses_valid_llm_response(self):
        raw = {
            "rounds": [
                {
                    "topic": "travel_rhythm",
                    "topic_label": "旅行节奏",
                    "proposer_message": "我偏好慢节奏旅行",
                    "evaluator_message": "我也是！",
                    "evaluator_score": 0.82,
                    "consensus_reached": True,
                },
                {
                    "topic": "food",
                    "topic_label": "美食偏好",
                    "proposer_message": "我爱吃火锅",
                    "evaluator_message": "我不太能吃辣",
                    "evaluator_score": 0.35,
                    "consensus_reached": False,
                },
                {
                    "topic": "budget",
                    "topic_label": "预算范围",
                    "proposer_message": "3000-5000",
                    "evaluator_message": "差不多",
                    "evaluator_score": 0.70,
                    "consensus_reached": True,
                },
            ],
            "conflict_topics": ["food"],
        }
        rounds, conflicts, scores = _parse_rounds(raw, {}, {})
        assert len(rounds) == 3
        assert conflicts == ["food"]
        assert rounds[0]["evaluator_score"] == 0.82
        assert rounds[1]["consensus_reached"] is False

    def test_fallback_when_raw_is_string(self):
        raw = "this is not JSON at all"
        rounds, conflicts, scores = _parse_rounds(raw, {}, {})
        # Should produce len(TOPICS) fallback rounds
        assert len(rounds) == len(TOPICS)
        assert all(isinstance(r["evaluator_score"], float) for r in rounds)

    def test_fallback_when_rounds_missing(self):
        # raw.get("rounds", []) = [] → isinstance([], list) is True,
        # for loop runs 0 times → returns empty rounds (no fallback reached)
        raw = {"some": "other"}
        rounds, conflicts, scores = _parse_rounds(raw, {}, {})
        assert len(rounds) == 0

    def test_fallback_when_rounds_is_not_a_list(self):
        # rounds field is missing → raw_rounds = [] → empty → no fallback
        # Only non-list rounds field triggers fallback
        raw = "not a dict at all"
        rounds, conflicts, scores = _parse_rounds(raw, {}, {})
        assert len(rounds) == len(TOPICS)  # true fallback

    def test_falls_back_to_rule_when_score_missing(self):
        raw = {
            "rounds": [
                {
                    "topic": "travel_rhythm",
                    "proposer_message": "hello",
                    "evaluator_message": "hi",
                    "consensus_reached": True,
                    # no evaluator_score
                }
            ]
        }
        rounds, _, _ = _parse_rounds(raw, {}, {})
        # Should have computed a score from rule
        assert isinstance(rounds[0]["evaluator_score"], float)

    def test_score_rounds_truncated_to_200_chars(self):
        raw = {
            "rounds": [
                {
                    "topic": "travel_rhythm",
                    "proposer_message": "A" * 500,
                    "evaluator_message": "B" * 500,
                    "evaluator_score": 0.75,
                    "consensus_reached": True,
                }
            ]
        }
        rounds, _, _ = _parse_rounds(raw, {}, {})
        assert len(rounds[0]["proposer_message"]) <= 200
        assert len(rounds[0]["evaluator_message"]) <= 200


class TestBuildNegotiatePrompt:
    def test_prompt_contains_both_personas(self):
        user = {"identity": {"content": "ENFP"}}
        buddy = {"identity": {"content": "ISTJ"}}
        prompt = _build_negotiate_prompt(user, buddy)
        assert "user" in prompt.lower()
        assert "buddy" in prompt.lower()
        assert "ENFP" in prompt
        assert "ISTJ" in prompt

    def test_prompt_contains_all_topics(self):
        prompt = _build_negotiate_prompt({}, {})
        for topic in TOPICS:
            assert topic in prompt

    def test_prompt_contains_topic_labels_for_active_topics(self):
        # Only topics in TOPICS appear in the prompt
        prompt = _build_negotiate_prompt({}, {})
        for topic in TOPICS:
            label = TOPIC_LABELS.get(topic, topic)
            assert label in prompt, f"{topic} label {label!r} not found in prompt"
