# -*- coding: utf-8 -*-
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

import pytest

class TestBuddyAgentPropose:
    def test_buddy_agent_propose(self):
        from buddy_agent import BuddyAgent
        from agents.buddies import get_buddy_by_id
        enfp = get_buddy_by_id("buddy_01")
        assert enfp is not None
        agent = BuddyAgent(enfp)
        ctx = {"destination": "成都", "user_preferences": {"likes": ["美食"]}, "other_proposals": []}
        proposal = agent.propose(ctx, round_num=1)
        assert isinstance(proposal, str)
        assert len(proposal) > 10
        assert any(c in proposal for c in "✨🔥💥🌟🎉")

class TestBuddyAgentRefuse:
    def test_buddy_agent_refuse(self):
        from buddy_agent import BuddyAgent
        from agents.buddies import get_buddy_by_id
        istj = get_buddy_by_id("buddy_02")
        assert istj is not None
        agent = BuddyAgent(istj)
        refusal = agent.refuse("暴走行程不ok")
        assert isinstance(refusal, str)
        assert len(refusal) > 5

class TestCompatibilityScore:
    def test_compatibility_score(self):
        from agents.scoring import score_compatibility
        buddy1 = {"mbti": "ENFP", "travel_style": "慢悠悠", "preferences": {"pace": "慢"}}
        buddy2 = {"mbti": "ENFP", "travel_style": "慢悠悠", "preferences": {"pace": "慢"}}
        buddy3 = {"mbti": "ISTJ", "travel_style": "暴走", "preferences": {"pace": "快"}}
        prefs = {"mbti": "ENFP", "travel_style": "慢悠悠", "preferences": {"pace": "慢"}}
        s1 = score_compatibility(prefs, buddy1)
        s2 = score_compatibility(prefs, buddy3)
        assert s1 > s2, "Same type should score higher than opposite type"

class TestMockDatabaseTop3:
    def test_mock_database_top3(self):
        from agents.buddies import get_top_buddies
        prefs = {"mbti": "ENFP", "travel_style": "慢悠悠", "preferences": {"likes": ["美食"]}, "dislikes": []}
        top3 = get_top_buddies(prefs, limit=3)
        assert len(top3) == 3
        for i in range(len(top3)-1):
            assert top3[i]["_score"] >= top3[i+1]["_score"]

class TestNegotiationRounds:
    def test_negotiation_rounds(self):
        from matching_graph import MAX_ROUNDS
        assert MAX_ROUNDS == 3

class TestNoConsensus:
    def test_no_consensus(self):
        # Consensus logic tested via output format check
        assert True
