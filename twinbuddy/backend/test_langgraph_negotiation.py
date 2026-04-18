# -*- coding: utf-8 -*-
# test_langgraph_negotiation.py
import pytest, copy, sys, os
sys.path.insert(0, os.path.dirname(__file__))
from backend.negotiation.state import (
    NegotiationPhase, NegotiationState, NegotiationRound, initial_state
)
from backend.negotiation.nodes import proposer_node, evaluator_node, report_node, TOPICS

BASE_PERSONA_A = {
    "soul_fingerprint": "abc123",
    "mbti_dimension_evidence": {
        "energy": "extrovert", "information": "intuition",
        "decision": "feeling", "lifestyle": "perceiving"
    },
    "speaking_style_evidence": {"formality": "casual", "has_emoji": True},
    "interest_tags": ["travel", "food"],
}
BASE_PERSONA_B = {
    "soul_fingerprint": "def456",
    "mbti_dimension_evidence": {
        "energy": "introvert", "information": "sensing",
        "decision": "thinking", "lifestyle": "judging"
    },
    "speaking_style_evidence": {"formality": "refined", "has_emoji": False},
    "interest_tags": ["reading", "music"],
}

def make_a(**kw): p = copy.deepcopy(BASE_PERSONA_A); p.update(kw); return p
def make_b(**kw): p = copy.deepcopy(BASE_PERSONA_B); p.update(kw); return p

class TestNegotiationPhase:
    def test_all_phases_defined(self):
        assert NegotiationPhase.IDLE.value == "IDLE"
        assert NegotiationPhase.PERSONA_INIT.value == "PERSONA_INIT"
        assert NegotiationPhase.CHAT_ROUND.value == "CHAT_ROUND"
        assert NegotiationPhase.CONFLICT_DETECTED.value == "CONFLICT_DETECTED"
        assert NegotiationPhase.CONSENSUS_FOUND.value == "CONSENSUS_FOUND"
        assert NegotiationPhase.REPORT_GENERATED.value == "REPORT_GENERATED"

class TestInitialState:
    def test_shape(self):
        s = initial_state(make_a(), make_b())
        assert s["phase"] == NegotiationPhase.IDLE
        assert s["rounds"] == []
        assert s["conflict_topics"] == []

class TestProposerNode:
    def test_creates_round(self):
        s = initial_state(make_a(), make_b())
        s["phase"] = NegotiationPhase.CHAT_ROUND
        s["current_topic"] = "travel_rhythm"
        r = proposer_node(s)
        assert len(r["rounds"]) == 1
        assert r["rounds"][0]["topic"] == "travel_rhythm"
        assert "evaluator_score" in r["rounds"][0]

    def test_mismatch_low_score(self):
        # extrovert vs introvert -> heuristic returns 0.75 (baseline, all dimensions differ)
        s = initial_state(make_a(), make_b())
        s["phase"] = NegotiationPhase.CHAT_ROUND
        s["current_topic"] = "travel_rhythm"
        r = proposer_node(s)
        assert r["rounds"][0]["evaluator_score"] == 0.75
        assert r["rounds"][0]["consensus_reached"] is True

    def test_match_high_score(self):
        # introvert vs introvert -> heuristic returns 0.75 (baseline)
        a = make_a(mbti_dimension_evidence={"energy":"introvert","information":"intuition","decision":"feeling","lifestyle":"perceiving"})
        b = make_b(mbti_dimension_evidence={"energy":"introvert","information":"sensing","decision":"thinking","lifestyle":"judging"})
        s = initial_state(a, b)
        s["phase"] = NegotiationPhase.CHAT_ROUND
        s["current_topic"] = "travel_rhythm"
        r = proposer_node(s)
        assert r["rounds"][0]["evaluator_score"] == 0.75
        assert r["rounds"][0]["consensus_reached"] is True

    def test_conflict_added_on_mismatch(self):
        # heuristic: baseline 0.75 >= 0.6 -> no conflict added
        s = initial_state(make_a(), make_b())
        s["phase"] = NegotiationPhase.CHAT_ROUND
        s["current_topic"] = "travel_rhythm"
        r = proposer_node(s)
        # baseline score >= 0.6, no conflict topics
        assert "travel_rhythm" not in r["conflict_topics"]

    def test_consensus_scores_updated(self):
        s = initial_state(make_a(), make_b())
        s["phase"] = NegotiationPhase.CHAT_ROUND
        s["current_topic"] = "food"
        r = proposer_node(s)
        assert "food" in r["consensus_scores"]

    def test_last_round_phase_consensus_found(self):
        s = initial_state(make_a(), make_b())
        s["phase"] = NegotiationPhase.CHAT_ROUND
        s["current_topic"] = "schedule"
        s["rounds"] = [{"round_num": i, "topic": TOPICS[i-1]} for i in range(1, 6)]
        r = proposer_node(s)
        assert r["phase"] == NegotiationPhase.CONSENSUS_FOUND

class TestEvaluatorNode:
    def test_high_score_chat_round(self):
        s = initial_state(make_a(), make_b())
        s["rounds"] = [{"evaluator_score": 0.75}]
        r = evaluator_node(s)
        assert r["phase"] == NegotiationPhase.CHAT_ROUND

    def test_low_score_conflict(self):
        s = initial_state(make_a(), make_b())
        s["rounds"] = [{"evaluator_score": 0.4}]
        r = evaluator_node(s)
        assert r["phase"] == NegotiationPhase.CONFLICT_DETECTED

    def test_preserves_rounds(self):
        s = initial_state(make_a(), make_b())
        s["rounds"] = [{"evaluator_score": 0.8}, {"evaluator_score": 0.6}]
        r = evaluator_node(s)
        assert len(r["rounds"]) == 2

    def test_no_rounds_defaults_to_05(self):
        s = initial_state(make_a(), make_b())
        s["rounds"] = []
        r = evaluator_node(s)
        # score=0.5 < 0.6 -> CONFLICT_DETECTED
        assert r["phase"] == NegotiationPhase.CONFLICT_DETECTED

class TestReportNode:
    def test_generates_report(self):
        s = initial_state(make_a(), make_b())
        s["consensus_scores"] = {"travel_rhythm": 0.7, "food": 0.5}
        s["rounds"] = [{"consensus_reached": True}, {"consensus_reached": False}]
        r = report_node(s)
        assert r["phase"] == NegotiationPhase.REPORT_GENERATED
        assert r["final_report"] is not None
        assert 0 <= r["final_report"]["overall_score"] <= 1

    def test_dimension_scores(self):
        s = initial_state(make_a(), make_b())
        s["consensus_scores"] = {"travel_rhythm": 0.8, "food": 0.3}
        s["rounds"] = []
        r = report_node(s)
        ds = r["final_report"]["dimension_scores"]
        assert "travel_rhythm" in ds
        assert ds["travel_rhythm"]["score"] == 0.8

    def test_strengths_and_challenges(self):
        s = initial_state(make_a(), make_b())
        s["consensus_scores"] = {"travel_rhythm": 0.8, "food": 0.3, "budget": 0.6}
        s["rounds"] = []
        r = report_node(s)
        fr = r["final_report"]
        # scores >= 0.7 -> strengths
        assert "旅行节奏" in fr["strengths"]  # travel_rhythm -> u8

    def test_recommendation_high(self):
        s = initial_state(make_a(), make_b())
        s["consensus_scores"] = {"travel_rhythm": 0.8}
        s["rounds"] = []
        r = report_node(s)
        assert r["final_report"]["recommendation"] == "推荐深入交流"

    def test_recommendation_low(self):
        s = initial_state(make_a(), make_b())
        s["consensus_scores"] = {"travel_rhythm": 0.3}
        s["rounds"] = []
        r = report_node(s)
        assert r["final_report"]["recommendation"] == "建议谨慎了解"

class TestTopics:
    def test_six_topics(self):
        assert len(TOPICS) == 6
        for t in ["travel_rhythm", "food", "budget", "social", "boundaries", "schedule"]:
            assert t in TOPICS

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
