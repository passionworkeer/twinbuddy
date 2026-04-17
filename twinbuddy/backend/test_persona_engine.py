# -*- coding: utf-8 -*-
"""
test_persona_engine.py — TDD tests for persona_engine
TwinBuddy Hackathon MVP

TDD workflow:
  1. Write tests (RED) — assertions encode expected behaviour
  2. Implement in persona_engine.py / persona_distiller.py / persona_layers.py
  3. Run tests (GREEN)
  4. Refactor if needed

Run:  cd backend && python -m pytest test_persona_engine.py -v
"""
from __future__ import annotations

import sys
from pathlib import Path

# Ensure backend modules are importable
_backend = Path(__file__).parent
if str(_backend) not in sys.path:
    sys.path.insert(0, str(_backend))

import pytest


# ═══════════════════════════════════════════════════════════════════════════════
# RED phase: skeleton tests that encode expected behaviour
# ═══════════════════════════════════════════════════════════════════════════════


class TestPersonaEngineBasic:
    """test_persona_engine_basic — 输入 MBTI ENFP，返回含 layer0_hard_rules 的 dict"""

    def test_persona_engine_basic(self):
        """ENFP 输入应返回含 layer0_hard_rules 的完整 dict"""
        from persona_engine import generate_persona

        result = generate_persona(
            mbti="ENFP",
            bio="喜欢旅行和美食，热情开朗",
            chat_logs="今天去了成都，超开心！",
            douyin_data=None,
            photo_path=None,
        )

        # Must be a dict with expected top-level keys
        assert isinstance(result, dict), "generate_persona must return a dict"
        assert "layer0_hard_rules" in result, "layer0_hard_rules must be present"
        assert "identity" in result, "Layer1 identity must be present"
        assert "speaking_style" in result, "Layer2 speaking_style must be present"
        assert "emotion_decision" in result, "Layer3 emotion_decision must be present"
        assert "social_behavior" in result, "Layer4 social_behavior must be present"
        assert isinstance(result["layer0_hard_rules"], list), "layer0_hard_rules must be a list"
        assert len(result["layer0_hard_rules"]) > 0, "layer0_hard_rules must not be empty"


class TestPersonaLayersComplete:
    """test_persona_layers_complete — 输出包含 L0-L4 全部 5 层"""

    def test_persona_layers_complete(self):
        """Result must contain all 5 layers: L0, L1, L2, L3, L4"""
        from persona_engine import generate_persona

        result = generate_persona(
            mbti="INTJ",
            bio="理性严谨，喜欢独立思考",
            chat_logs="我用逻辑分析一切问题",
            douyin_data={"like_list": []},
            photo_path=None,
        )

        # L0
        assert "layer0_hard_rules" in result
        # L1
        assert "identity" in result
        # L2
        assert "speaking_style" in result
        # L3
        assert "emotion_decision" in result
        # L4
        assert "social_behavior" in result

        # Layer1 (identity) must contain key fields
        identity = result["identity"]
        assert isinstance(identity, dict)
        assert "mbti_influence" in identity

        # Layer2 (speaking_style) must contain key fields
        speaking = result["speaking_style"]
        assert isinstance(speaking, dict)

        # Layer3 (emotion_decision) must contain key fields
        emotion = result["emotion_decision"]
        assert isinstance(emotion, dict)
        assert "emotion_triggers" in emotion

        # Layer4 (social_behavior) must contain key fields
        social = result["social_behavior"]
        assert isinstance(social, dict)


class TestSoulFingerprintFormat:
    """test_soul_fingerprint_format — SHA256 前16位格式"""

    def test_soul_fingerprint_format(self):
        """soul_fingerprint must be the first 16 hex chars of SHA256"""
        import hashlib
        from persona_engine import generate_persona, RawSource

        result = generate_persona(
            mbti="ENFP",
            bio="测试bio",
            chat_logs="测试聊天",
            douyin_data=None,
            photo_path=None,
        )

        fp = result.get("soul_fingerprint", "")
        assert isinstance(fp, str), "soul_fingerprint must be a string"

        # Must be exactly 16 hex characters
        assert len(fp) == 16, f"soul_fingerprint must be 16 chars, got {len(fp)}"
        assert all(c in "0123456789abcdef" for c in fp), \
            f"soul_fingerprint must be hex, got: {fp}"

        # Verify it is actually the first 16 chars of SHA256
        raw = RawSource.from_dict({
            "mbti": "ENFP",
            "bio": "测试bio",
            "chat_logs": "测试聊天",
            "douyin_data": {},
            "photo_path": None,
        })
        expected_content = (
            f"{raw.mbti}|{raw.bio[:200]}|"
            f"{len(raw.chat_logs)}|{list(raw.douyin_data.keys())}"
        )
        expected_fp = hashlib.sha256(expected_content.encode("utf-8")).hexdigest()[:16]
        assert fp == expected_fp, \
            f"soul_fingerprint does not match expected SHA256 prefix: {fp} vs {expected_fp}"


class TestConfidenceScoreBounds:
    """test_confidence_score_bounds — 置信度在 0.0-1.0 之间"""

    def test_confidence_score_bounds(self):
        """confidence_score must be a float in [0.0, 1.0]"""
        from persona_engine import generate_persona

        # Empty input
        result_empty = generate_persona(
            mbti="ENFP", bio="", chat_logs="", douyin_data=None, photo_path=None
        )
        conf = result_empty.get("confidence_score")
        assert conf is not None, "confidence_score must be present"
        assert isinstance(conf, float), f"confidence_score must be float, got {type(conf)}"
        assert 0.0 <= conf <= 1.0, \
            f"confidence_score must be in [0.0, 1.0], got {conf}"

        # Rich input
        result_rich = generate_persona(
            mbti="INTJ",
            bio="I am a strategic thinker who loves planning trips",
            chat_logs="D1: Visited the museum. D2: Tried local food. D3: Hiked the mountain. "
                      "It was amazing! The sunset was incredible. Can't wait to go back.",
            douyin_data={"like_list": [{"desc": "travel"}]},
            photo_path="/path/to/photo.jpg",
        )
        conf_rich = result_rich.get("confidence_score")
        assert 0.0 <= conf_rich <= 1.0, \
            f"confidence_score must be in [0.0, 1.0], got {conf_rich}"

        # Rich input should have higher confidence than empty
        assert conf_rich > conf, \
            "Rich input should produce higher confidence than minimal input"


class TestEmptySourceGraceful:
    """test_empty_source_graceful — 无数据时降级处理（confidence 降低但不崩溃）"""

    def test_empty_source_graceful(self):
        """Empty sources must not raise; confidence should be lower but > 0"""
        from persona_engine import generate_persona

        # Minimal valid input
        result_minimal = generate_persona(
            mbti="ENFP",
            bio="",
            chat_logs="",
            douyin_data=None,
            photo_path=None,
        )

        assert isinstance(result_minimal, dict), "Must return dict even with empty inputs"
        assert "confidence_score" in result_minimal
        # Confidence must be > 0 because MBTI is provided
        conf = result_minimal["confidence_score"]
        assert conf >= 0.0, "confidence must not be negative"

        # All required layers must still be present
        for key in ("layer0_hard_rules", "identity", "speaking_style",
                    "emotion_decision", "social_behavior"):
            assert key in result_minimal, f"'{key}' must be present even with empty sources"

        # soul_fingerprint must still be valid
        fp = result_minimal.get("soul_fingerprint", "")
        assert len(fp) == 16, "soul_fingerprint must be 16 chars even with minimal input"

    def test_totally_empty_mbti(self):
        """Completely empty MBTI must be handled gracefully (no crash)"""
        from persona_engine import generate_persona

        # Empty string MBTI — must not raise
        try:
            result = generate_persona(
                mbti="",
                bio="",
                chat_logs="",
                douyin_data=None,
                photo_path=None,
            )
            assert isinstance(result, dict)
            # Should have defaulted to UNKNOWN
            internal = result.get("_internal", {}).get("raw_summary", {})
            assert internal.get("mbti") in ("UNKNOWN", ""), \
                "Empty MBTI should default to UNKNOWN"
        except Exception as e:
            pytest.fail(f"generate_persona raised on empty MBTI: {e}")


class TestImmutability:
    """test_immutability — 两次调用返回不同 dict 对象（无共享状态）"""

    def test_immutability(self):
        """Two calls with same inputs must return distinct dict objects"""
        from persona_engine import generate_persona

        result1 = generate_persona(
            mbti="ENFP",
            bio="I love travel",
            chat_logs="今天去了成都！",
            douyin_data=None,
            photo_path=None,
        )
        result2 = generate_persona(
            mbti="ENFP",
            bio="I love travel",
            chat_logs="今天去了成都！",
            douyin_data=None,
            photo_path=None,
        )

        # Must be different objects (no shared mutable state)
        assert result1 is not result2, \
            "Two calls must return distinct dict objects (no shared state)"
        assert result1 is not result2["_internal"], \
            "Nested dicts must not leak as shared references"

        # Same fingerprint because same inputs
        assert result1["soul_fingerprint"] == result2["soul_fingerprint"], \
            "Same inputs must produce same fingerprint"

    def test_different_inputs_different_persona_ids(self):
        """Different inputs must produce different persona_id"""
        from persona_engine import generate_persona

        r1 = generate_persona(mbti="ENFP", bio="a", chat_logs="a")
        r2 = generate_persona(mbti="INTJ", bio="b", chat_logs="b")

        assert r1["persona_id"] != r2["persona_id"], \
            "Different personas must have different persona_id"

    def test_internal_dicts_are_new_instances(self):
        """Internal dimension dicts must be new objects on each call"""
        from persona_engine import generate_persona

        r1 = generate_persona(mbti="ENFP", bio="x", chat_logs="y")
        r2 = generate_persona(mbti="ENFP", bio="x", chat_logs="y")

        internal1 = r1["_internal"]
        internal2 = r2["_internal"]

        assert internal1 is not internal2, \
            "_internal must be a fresh dict on each call"
        assert internal1["cognition"] is not internal2["cognition"], \
            "Dimension dicts must not be shared between calls"


# ═══════════════════════════════════════════════════════════════════════════════
# Helpers
# ═══════════════════════════════════════════════════════════════════════════════


def run_tests() -> bool:
    loader = pytest.TestLoader()
    suite = loader.loadTestsFromTestCase(TestPersonaEngineBasic)
    suite.addTests(loader.loadTestsFromTestCase(TestPersonaLayersComplete))
    suite.addTests(loader.loadTestsFromTestCase(TestSoulFingerprintFormat))
    suite.addTests(loader.loadTestsFromTestCase(TestConfidenceScoreBounds))
    suite.addTests(loader.loadTestsFromTestCase(TestEmptySourceGraceful))
    suite.addTests(loader.loadTestsFromTestCase(TestImmutability))

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
