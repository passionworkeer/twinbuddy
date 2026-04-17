# -*- coding: utf-8 -*-
"""
test_matching.py — TDD tests for agents/matching_graph and buddy_agent
TwinBuddy Hackathon MVP

TDD workflow:
  1. Write tests (RED) — assertions encode expected behaviour
  2. Implement logic in matching_graph.py / buddy_agent.py if needed
  3. Run tests (GREEN)
  4. Refactor if needed

Run:  cd agents && python -m pytest test_matching.py -v
"""
from __future__ import annotations

import sys
from pathlib import Path

# Ensure agents modules are importable
_agents = Path(__file__).parent
if str(_agents) not in sys.path:
    sys.path.insert(0, str(_agents))

import pytest

# Check langgraph availability before importing matching_graph
try:
    import langgraph  # noqa: F401
    _HAS_LANGGRAPH = True
except ImportError:
    _HAS_LANGGRAPH = False


# ═══════════════════════════════════════════════════════════════════════════════
# Tests that do NOT require langgraph
# ═══════════════════════════════════════════════════════════════════════════════


class TestBuddyAgentPropose:
    """test_buddy_agent_propose — ENFP agent 提出方案含 emoji"""

    def test_buddy_agent_propose(self):
        """ENFP agent propose() must return a string containing emoji"""
        from buddy_agent import BuddyAgent
        from mock_database import get_buddy_by_id

        enfp_buddy = get_buddy_by_id("buddy_01")  # ENFP · 小满
        assert enfp_buddy is not None, "buddy_01 (ENFP) must exist in mock DB"
        assert enfp_buddy["mbti"] == "ENFP"

        agent = BuddyAgent(enfp_buddy)
        context = {
            "destination": "成都",
            "user_preferences": {"likes": ["美食"], "dislikes": ["暴走"]},
            "other_proposals": [],
        }

        proposal = agent.propose(context, round_num=1)

        assert isinstance(proposal, str), "propose() must return a string"
        assert len(proposal) > 10, "proposal must not be empty"
        # ENFP proposals must contain emoji
        enfp_emoji_set = set("✨🔥💥🌟🎉")
        assert any(c in proposal for c in enfp_emoji_set), (
            f"ENFP proposal must contain emoji, got: {proposal[:80]}"
        )
        # Must mention destination
        assert "成都" in proposal, "proposal must mention the destination"
        # Must include agent name
        assert agent.name in proposal, "proposal must include agent name"


class TestBuddyAgentRefuse:
    """test_buddy_agent_refuse — ISTJ agent 拒绝方式严谨"""

    def test_buddy_agent_refuse(self):
        """ISTJ agent refuse() must return a string with structured/logical tone"""
        from buddy_agent import BuddyAgent
        from mock_database import get_buddy_by_id

        istj_buddy = get_buddy_by_id("buddy_02")  # ISTJ · 老陈
        assert istj_buddy is not None, "buddy_02 (ISTJ) must exist in mock DB"
        assert istj_buddy["mbti"] == "ISTJ"

        agent = BuddyAgent(istj_buddy)
        reason = "不符合行程规划原则"
        refusal = agent.refuse(reason)

        assert isinstance(refusal, str), "refuse() must return a string"
        assert len(refusal) > 0, "refusal must not be empty"
        # ISTJ refuses in a structured/principled way — must NOT use excessive emoji
        enfp_emoji_set = set("✨🔥💥🌟🎉")
        emoji_count = sum(1 for c in refusal if c in enfp_emoji_set)
        assert emoji_count == 0, (
            f"ISTJ refusal should be structured, not emoji-heavy "
            f"(got {emoji_count} emoji): {refusal}"
        )
        # ISTJ refuses firmly
        assert any(kw in refusal for kw in ["原则", "清单", "不接受", "不能", "抱歉", "不"]), (
            f"ISTJ refusal must convey firmness, got: {refusal}"
        )


class TestCompatibilityScore:
    """test_compatibility_score — 同类型 score > 异类型"""

    def test_compatibility_score(self):
        """Same-type or similar-type pairs must score higher than opposite types"""
        from mock_database import score_compatibility

        user_prefs_same = {
            "mbti": "ENFP",
            "budget": "3000-5000元",
            "pace": "慢悠悠，不想累着",
            "likes": ["美食", "拍照", "旅行"],
        }
        user_prefs_diff = {
            "mbti": "ISTJ",
            "budget": "6000-8000元",
            "pace": "快节奏",
            "likes": ["博物馆", "历史"],
        }

        enfp_buddy = {"mbti": "ENFP", "preferences": {
            "budget": "3000-5000元",
            "pace": "慢悠悠，不想累着",
            "likes": ["美食", "拍照"],
        }}
        istj_buddy = {"mbti": "ISTJ", "preferences": {
            "budget": "6000-8000元",
            "pace": "快节奏",
            "likes": ["博物馆"],
        }}

        # ENFP user + ENFP buddy should score well
        score_same = score_compatibility(user_prefs_same, enfp_buddy)
        # ISTJ user + ENFP buddy should score lower (different type + different prefs)
        score_diff = score_compatibility(user_prefs_diff, enfp_buddy)

        assert isinstance(score_same, (int, float)), "score must be numeric"
        assert isinstance(score_diff, (int, float)), "score must be numeric"
        assert 0 <= score_same <= 100, f"score must be in [0,100], got {score_same}"
        assert 0 <= score_diff <= 100, f"score must be in [0,100], got {score_diff}"
        assert score_same > score_diff, (
            f"Same-type compatibility ({score_same}) should be higher than "
            f"cross-type ({score_diff})"
        )


# ═══════════════════════════════════════════════════════════════════════════════
# Tests that require langgraph
# ═══════════════════════════════════════════════════════════════════════════════


@pytest.mark.skipif(not _HAS_LANGGRAPH, reason="langgraph not installed")
class TestMockDatabaseTop3:
    """test_mock_database_top3 — 返回 Top3 候选"""

    def test_mock_database_top3(self):
        """match_candidates must return the top 3 compatible buddies sorted by score"""
        from matching_graph import match_candidates, GraphState, parse_preferences

        state = GraphState(
            messages=[],
            user_persona={
                "mbti": "ENFP",
                "travel_style": "慢悠悠旅游",
                "likes": ["美食", "拍照", "旅行"],
                "dislikes": ["暴走", "早起"],
                "budget": "3000-5000元",
                "pace": "慢悠悠，不想累着",
                "destination": "成都",
            }
        )
        state.destination = "成都"
        state.budget = "3000-5000元"

        state = parse_preferences(state)
        state = match_candidates(state)

        candidates = state.candidates
        assert isinstance(candidates, list), "candidates must be a list"
        assert len(candidates) == 3, f"Expected top 3 candidates, got {len(candidates)}"

        from mock_database import score_compatibility
        prefs = state.parsed_preferences
        for i in range(len(candidates) - 1):
            score_i = score_compatibility(prefs, candidates[i])
            score_j = score_compatibility(prefs, candidates[i + 1])
            assert score_i >= score_j, (
                f"Candidates must be sorted descending: {score_i} >= {score_j}"
            )


@pytest.mark.skipif(not _HAS_LANGGRAPH, reason="langgraph not installed")
class TestNegotiationRounds:
    """test_negotiation_rounds — 3轮内输出结果"""

    def test_negotiation_rounds(self):
        """Full negotiation must complete within MAX_ROUNDS (3) rounds"""
        from matching_graph import build_matching_graph, GraphState, MAX_ROUNDS

        assert MAX_ROUNDS == 3, "MAX_ROUNDS must be 3"

        state = GraphState(
            messages=[],
            user_persona={
                "mbti": "ENFP",
                "travel_style": "慢悠悠旅游",
                "likes": ["美食", "拍照"],
                "dislikes": ["暴走"],
                "budget": "4000-6000元",
                "pace": "慢悠悠",
                "destination": "成都",
                "dates": "2024-07-15~19",
            }
        )
        state.destination = "成都"
        state.dates = "2024-07-15~19"
        state.budget = "4000-6000元"

        graph = build_matching_graph()
        compiled = graph.compile()
        result = compiled.invoke(state)

        rounds = result.get("negotiation_rounds", [])
        assert len(rounds) <= MAX_ROUNDS, (
            f"Negotiation must complete within {MAX_ROUNDS} rounds, got {len(rounds)}"
        )
        assert len(rounds) >= 1, "At least 1 negotiation round must run"
        for rnd in rounds:
            assert len(rnd.proposals) > 0, "Each round must have proposals"


@pytest.mark.skipif(not _HAS_LANGGRAPH, reason="langgraph not installed")
class TestNoConsensus:
    """test_no_consensus — 无法共识时输出"未能达成共识" """

    def test_no_consensus(self):
        """When consensus is not reached, final output must contain '未能达成共识'"""
        from matching_graph import build_matching_graph, GraphState, MAX_ROUNDS

        state = GraphState(
            messages=[],
            user_persona={
                "mbti": "ENFP",
                "travel_style": "慢悠悠旅游",
                "likes": ["美食", "拍照"],
                "dislikes": ["暴走"],
                "budget": "3000元",
                "pace": "极慢",
                "destination": "成都",
                "dates": "2024-07-15~19",
            }
        )
        state.destination = "成都"
        state.budget = "3000元"
        state.dates = "2024-07-15~19"

        graph = build_matching_graph()
        compiled = graph.compile()
        result = compiled.invoke(state)

        messages = result.get("messages", [])
        assert len(messages) > 0, "Result must contain messages"

        last_msg = messages[-1]
        final_content = getattr(last_msg, "content", str(last_msg))

        consensus = result.get("consensus_reached", False)
        if not consensus:
            assert "未能达成共识" in final_content, (
                f"No-consensus output must contain '未能达成共识', got: {final_content[:200]}"
            )
        else:
            assert len(result.get("final_plan", "")) > 0, (
                "Consensus reached: final_plan must be present"
            )

        assert len(result.get("negotiation_rounds", [])) > 0, (
            "negotiation_rounds must be recorded in state"
        )


# ═══════════════════════════════════════════════════════════════════════════════
# Helpers
# ═══════════════════════════════════════════════════════════════════════════════


def run_tests() -> bool:
    loader = pytest.TestLoader()
    suite = loader.loadTestsFromTestCase(TestBuddyAgentPropose)
    suite.addTests(loader.loadTestsFromTestCase(TestBuddyAgentRefuse))
    suite.addTests(loader.loadTestsFromTestCase(TestCompatibilityScore))
    if _HAS_LANGGRAPH:
        suite.addTests(loader.loadTestsFromTestCase(TestMockDatabaseTop3))
        suite.addTests(loader.loadTestsFromTestCase(TestNegotiationRounds))
        suite.addTests(loader.loadTestsFromTestCase(TestNoConsensus))

    runner = pytest.TextTestRunner(verbosity=2)
    result = runner.run(suite)

    total = result.testsRun
    failures = len(result.failures)
    errors = len(result.errors)

    print()
    print("=" * 60)
    print(f"  Test result summary")
    print(f"  Total: {total}  |  Passed: {total - failures - errors}  |  Failed: {failures}  |  Errors: {errors}")
    print("=" * 60)
    return result.wasSuccessful()


if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)
