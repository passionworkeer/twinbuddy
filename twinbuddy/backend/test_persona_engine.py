import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent / "parsers"))

import pytest
from persona_engine import generate_persona

class TestPersonaEngineBasic:
    def test_persona_engine_basic(self):
        result = generate_persona(mbti="ENFP", bio="I love travel and food", chat_logs="Hello world")
        assert "layer0_hard_rules" in result
        assert isinstance(result["layer0_hard_rules"], list)

class TestPersonaLayersComplete:
    def test_persona_layers_complete(self):
        result = generate_persona(mbti="ISTJ", bio="", chat_logs="")
        assert "identity" in result
        assert "speaking_style" in result
        assert "emotion_decision" in result
        assert "social_behavior" in result
        assert "travel_style" in result

class TestSoulFingerprintFormat:
    def test_soul_fingerprint_format(self):
        result = generate_persona(mbti="INFP", bio="test", chat_logs="test")
        fp = result.get("soul_fingerprint", "")
        assert len(fp) == 16, f"Soul fingerprint should be 16 hex chars, got: {fp}"
        assert all(c in "0123456789abcdef" for c in fp)

class TestConfidenceScoreBounds:
    def test_confidence_score_bounds(self):
        result_empty = generate_persona(mbti="", bio="", chat_logs="")
        result_rich = generate_persona(mbti="ENFP", bio="I love food travel photography", chat_logs="hello world I love this place")
        assert 0.0 <= result_empty["confidence_score"] <= 1.0
        assert 0.0 <= result_rich["confidence_score"] <= 1.0
        assert result_rich["confidence_score"] >= result_empty["confidence_score"]

class TestEmptySourceGraceful:
    def test_empty_source_graceful(self):
        result = generate_persona(mbti="", bio="", chat_logs="")
        assert result is not None
        assert "confidence_score" in result

class TestImmutability:
    def test_immutability(self):
        r1 = generate_persona(mbti="ENFP", bio="test", chat_logs="")
        r2 = generate_persona(mbti="ENFP", bio="test", chat_logs="")
        assert r1 is not r2, "Each call must return a new dict"

# Run: cd backend && python -m pytest test_persona_engine.py -v
