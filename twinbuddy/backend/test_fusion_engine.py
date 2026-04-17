# -*- coding: utf-8 -*-
import pytest
from fusion_engine import (FusionInput, extract_mbti_dimensions,
    extract_speaking_style, extract_interests, compute_weight_decay, fuse_persona)

class TestFusionInput:
    def test_from_raw(self):
        inp = FusionInput.from_raw(mbti="ENFP", bio="test")
        assert inp.mbti == "ENFP"
    def test_uppercase(self):
        assert FusionInput.from_raw(mbti="enfp").mbti == "ENFP"
    def test_defaults(self):
        i = FusionInput.from_raw(mbti="X")
        assert i.mbti_weight == 0.9
        assert i.speaking_style_weight == 0.8
        assert i.interest_weight == 0.7
        assert i.decay_rate == 0.1
    def test_custom_weights(self):
        i = FusionInput.from_raw(mbti="X", mbti_weight=0.95, decay_rate=0.05)
        assert i.mbti_weight == 0.95
        assert i.decay_rate == 0.05
    def test_frozen(self):
        i = FusionInput.from_raw(mbti="ENTJ")
        with pytest.raises(Exception): i.mbti = "X"

class TestMbtiDim:
    def test_introvert(self):
        r = extract_mbti_dimensions("INTJ")
        assert r["energy"] == "introvert"
        assert r["decision"] == "thinking"
        assert r["lifestyle"] == "judging"
    def test_extrovert(self):
        assert extract_mbti_dimensions("ENFP")["energy"] == "extrovert"
    def test_feeling(self):
        assert extract_mbti_dimensions("INFP")["decision"] == "feeling"
    def test_short_unknown(self):
        r = extract_mbti_dimensions("IN")
        assert r["energy"] == "unknown"
    def test_new_dict(self):
        r = extract_mbti_dimensions("ISTJ")
        r["energy"] = "mod"
        assert extract_mbti_dimensions("ISTJ")["energy"] == "introvert"

class TestSpeaking:
    def test_emoji(self):
        assert extract_speaking_style("hi 😂", "")["has_emoji"] is True
    def test_question(self):
        assert extract_speaking_style("how are you?", "")["has_question"] is True
    def test_new_dict(self):
        r = extract_speaking_style("hi", "")
        r["has_emoji"] = True
        assert extract_speaking_style("hi", "")["has_emoji"] is False

class TestInterests:
    def test_travel(self): assert "travel" in extract_interests("爱旅行", "")
    def test_food(self): assert "food" in extract_interests("美食", "")
    def test_tech(self): assert "tech" in extract_interests("python AI", "")
    def test_new_list(self):
        r = extract_interests("tech", "")
        r.append("x")
        assert "x" not in extract_interests("tech", "")
    def test_empty(self): assert extract_interests("", "") == []

class TestDecay:
    def test_zero_dist(self): assert compute_weight_decay(0.9, 0.0) == 0.9
    def test_decay(self):
        r = compute_weight_decay(0.9, 1.0, 0.1)
        assert r < 0.9
    def test_returns_float(self): assert isinstance(compute_weight_decay(0.8, 0.3), float)

class TestFuse:
    def test_mbti_only(self):
        r = fuse_persona(mbti="INTJ")
        assert r["input_summary"]["mbti"] == "INTJ"
        assert len(r["dimensions"]) == 5
    def test_with_bio(self):
        r = fuse_persona(mbti="ENFP", bio="I love travel and good food")
        assert "travel" in r["interest_tags"]
        assert "bio" in r["sources_used"]
    def test_all_inputs(self):
        r = fuse_persona(mbti="ISTJ", bio="read", chat_history="gym " * 50)
        assert "chat_history" in r["sources_used"]
    def test_mbti_no_decay(self):
        r = fuse_persona(mbti="ENTJ")
        assert r["dimensions"]["cognition"]["weight_decay"] == 0.9
    def test_expression_has_decay(self):
        r = fuse_persona(mbti="ENTJ")
        assert r["dimensions"]["expression"]["weight_decay"] < 0.9
    def test_custom_weights(self):
        r = fuse_persona(mbti="X", mbti_weight=0.95)
        assert r["weights_applied"]["mbti"] == 0.95
    def test_immutable(self):
        orig = "ENFP"
        fuse_persona(mbti=orig)
        assert orig == "ENFP"
    def test_confidence_range(self):
        r = fuse_persona(mbti="INTJ")
        assert 0 <= r["overall_confidence"] <= 1
    def test_required_dim_fields(self):
        r = fuse_persona(mbti="ISTJ")
        req = {"dimension","value","source","weight","distance_from_source","weight_decay","confidence"}
        for d in r["dimensions"].values():
            assert req.issubset(d.keys())

if __name__ == "__main__": pytest.main([__file__, "-v"])
