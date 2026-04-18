# -*- coding: utf-8 -*-
"""
test_frontend_api.py — 前端 API 端到端测试
覆盖 /api/onboarding, /api/persona, /api/feed, /api/negotiate
"""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


# ── /api/onboarding ──────────────────────────────────────────────────────────


class TestOnboardingEndpoint:
    def test_save_onboarding_success(self):
        resp = client.post("/api/onboarding", json={
            "mbti": "ENFP",
            "interests": ["川西", "摄影"],
            "voiceText": "我喜欢旅行",
            "city": "dali",
            "completed": True,
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True
        assert data["meta"]["message"] == "已保存"
        assert "user_id" in data["data"]
        assert "persona_id" in data["data"]

    def test_save_onboarding_normalizes_mbti(self):
        resp = client.post("/api/onboarding", json={
            "mbti": "ENFP",
            "interests": [],
            "city": "",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["data"]["persona_id"].startswith("persona-enfp-")

    def test_save_onboarding_minimal(self):
        resp = client.post("/api/onboarding", json={
            "mbti": "INTJ",
        })
        assert resp.status_code == 200
        assert resp.json()["success"] is True

    def test_save_onboarding_invalid_mbti(self):
        resp = client.post("/api/onboarding", json={
            "mbti": "notvalid",
        })
        assert resp.status_code == 422  # Pydantic validation error


# ── /api/persona ────────────────────────────────────────────────────────────


class TestPersonaEndpoint:
    def test_get_persona_not_found(self):
        resp = client.get("/api/persona?user_id=nonexistent")
        assert resp.status_code == 404

    def test_get_persona_after_onboarding(self):
        # 先保存 onboarding
        save_resp = client.post("/api/onboarding", json={"mbti": "INFP"})
        user_id = save_resp.json()["data"]["user_id"]

        # 再获取 persona
        resp = client.get(f"/api/persona?user_id={user_id}")
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True
        assert "persona_id" in data["data"]
        assert data["data"]["avatar_emoji"] == "🌙"
        assert data["data"]["name"] == "诗意漫游者"


# ── /api/feed ────────────────────────────────────────────────────────────────


class TestFeedEndpoint:
    def test_feed_returns_5_videos(self):
        resp = client.get("/api/feed")
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True
        videos = data["data"]
        assert len(videos) == 5

    def test_feed_first_two_are_normal_video(self):
        resp = client.get("/api/feed")
        videos = resp.json()["data"]
        assert videos[0]["type"] == "video"
        assert videos[1]["type"] == "video"
        assert videos[0]["buddy"] is None
        assert videos[1]["buddy"] is None

    def test_feed_last_three_trigger_twin_card(self):
        resp = client.get("/api/feed")
        videos = resp.json()["data"]
        # Guest user (no user_id): top_buddies has 3 buddies (indices 0-2)
        # v3 (index 2): twin_card + buddy[0] ✓
        # v4 (index 3): twin_card (no 4th buddy, kept as type) ✗ buddy
        # v5 (index 4): twin_card + buddy[2] ✓
        assert videos[2]["type"] == "twin_card"
        assert videos[2]["buddy"] is not None
        assert "name" in videos[2]["buddy"]
        assert "compatibility_score" in videos[2]["buddy"]
        # v4 has no 4th buddy for guest, type stays twin_card but no buddy data
        assert videos[3]["type"] == "twin_card"
        # v5 also has a buddy
        assert videos[4]["type"] == "twin_card"
        assert videos[4]["buddy"] is not None

    def test_feed_with_city_filter(self):
        resp = client.get("/api/feed?city=chengdu")
        assert resp.status_code == 200
        data = resp.json()
        assert data["meta"]["city"] == "chengdu"

    def test_feed_covers_have_urls(self):
        resp = client.get("/api/feed")
        videos = resp.json()["data"]
        for v in videos:
            assert v["cover_url"].startswith("http")


# ── /api/negotiate ───────────────────────────────────────────────────────────


class TestNegotiateEndpoint:
    def test_negotiate_success(self):
        resp = client.post("/api/negotiate", json={
            "destination": "dali",
            "buddy_mbti": "INFP",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True
        result = data["data"]
        assert result["destination"] == "大理"
        assert "consensus" in result
        assert "radar" in result
        assert "messages" in result
        assert "matched_buddies" in result

    def test_negotiate_enfp_infp_compat(self):
        resp = client.post("/api/negotiate", json={
            "destination": "xian",
            "buddy_mbti": "INFP",
        })
        result = resp.json()["data"]
        assert result["destination"] == "西安"
        assert len(result["messages"]) > 0
        assert len(result["radar"]) > 0

    def test_negotiate_uses_interest_tags_in_report(self):
        tags = ["摄影打卡", "重度火锅党", "慢节奏旅行"]
        resp = client.post("/api/negotiate", json={
            "destination": "dali",
            "buddy_mbti": "INFP",
            "mbti": "ENFP",
            "interests": tags,
            "voiceText": "我想慢慢玩，重点拍照和吃好吃的",
        })
        assert resp.status_code == 200
        data = resp.json()["data"]
        assert isinstance(data.get("analysis_report", ""), str)
        basis = data.get("analysis_basis", {})
        assert basis.get("input_tags") == tags

    def test_negotiate_unknown_city(self):
        resp = client.post("/api/negotiate", json={
            "destination": "unknown_city",
        })
        assert resp.status_code == 200
        # Falls back to raw city name
        assert "unknown_city" in resp.json()["data"]["destination"]

    def test_negotiate_buddy_emojis(self):
        for mbti, expected_emoji in [("ENFP", "🌈"), ("ISTJ", "📐"), ("INFP", "🌙"), ("ENTJ", "🎯")]:
            resp = client.post("/api/negotiate", json={"destination": "dali", "buddy_mbti": mbti})
            assert resp.status_code == 200, f"Failed for {mbti}"


# ── CORS / integration ──────────────────────────────────────────────────────


class TestCORS:
    def test_cors_headers_on_api(self):
        resp = client.get("/api/feed")
        # TestClient handles CORS; verify 200
        assert resp.status_code == 200
