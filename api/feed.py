# api/feed.py
"""GET /api/feed 端点"""
from __future__ import annotations

import json
from pathlib import Path as _Path
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Query

from api._constants import BUDDY_CONFIGS, CITY_NAMES, DEFAULT_VIDEOS
from api._store import _onboarding_store
from agents.buddies import get_all_buddies, get_buddy_public
from agents.mock_database import get_compatibility_breakdown as _mock_compat_breakdown
from agents import persona_doc
from agents.real_persona_index import get_top_personas

router = APIRouter(prefix="/api", tags=["Feed"])


# ---------------------------------------------------------------------------
# 内部辅助
# ---------------------------------------------------------------------------

def _load_mock_videos() -> List[Dict[str, Any]]:
    data_dir = _Path(__file__).parent.parent / "data"
    videos_path = data_dir / "mock_videos.json"
    if videos_path.exists():
        try:
            with open(videos_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return DEFAULT_VIDEOS


def _build_buddy(mbti: str, city: str) -> Dict[str, Any]:
    config = BUDDY_CONFIGS.get(mbti.lower(), BUDDY_CONFIGS["enfp"])
    return {
        "name": config["name"],
        "mbti": config["mbti"],
        "avatar_emoji": config["avatar_emoji"],
        "typical_phrases": config["typical_phrases"],
        "travel_style": config["travel_style"],
        "compatibility_score": 75,
    }


def _build_user_prefs(onboarding: Dict[str, Any], user_id: str = "") -> Dict[str, Any]:
    mbti = (onboarding.get("mbti") or "ENFP").strip().upper()
    interests: List[str] = onboarding.get("interests") or []
    city = onboarding.get("city") or ""

    if user_id:
        md_prefs = persona_doc.get_persona_for_algorithm(user_id)
        if md_prefs:
            return md_prefs

    if len(mbti) >= 4:
        jp = mbti[3]
    else:
        jp = "P"

    if jp == "J":
        pace = "有计划，每天有明确目标，不喜欢临时改变"
        travel_style = "计划执行型"
    else:
        pace = "慢悠悠，睡到自然醒，不赶景点，享受过程"
        travel_style = "随性探索型"

    tf = mbti[2] if len(mbti) >= 3 else "F"
    if tf == "T":
        negotiation_style = "用逻辑和数据说服，不擅长情绪施压，立场坚定"
    else:
        negotiation_style = "用感受和价值观说服，温和但坚定，容易被真诚打动"

    budget_map = {
        "ENFP": "3000-5000元", "ENFJ": "4000-6000元", "ENTP": "3000-6000元", "ENTJ": "6000-10000元",
        "ESFP": "5000-8000元", "ESFJ": "3500-5500元", "ESTP": "4000-7000元", "ESTJ": "5000-8000元",
        "INFP": "2500-4000元", "INFJ": "3500-6000元", "INTP": "3000-5000元", "INTJ": "5000-8000元",
        "ISFP": "2000-3500元", "ISFJ": "3000-5000元", "ISTP": "3000-6000元", "ISTJ": "4000-6000元",
    }

    return {
        "mbti": mbti,
        "likes": interests,
        "dislikes": [],
        "budget": budget_map.get(mbti, "3500-5500元"),
        "pace": pace,
        "travel_style": travel_style,
        "negotiation_style": negotiation_style,
        "city": city,
    }


# ---------------------------------------------------------------------------
# 端点
# ---------------------------------------------------------------------------

@router.get("/feed")
async def get_feed(
    city: Optional[str] = Query(None),
    user_id: Optional[str] = Query(None),
) -> Dict[str, Any]:
    videos = _load_mock_videos()

    user_prefs: Optional[Dict[str, Any]] = None
    onboarding: Optional[Dict[str, Any]] = None

    if user_id:
        if user_id in _onboarding_store:
            onboarding = _onboarding_store[user_id]
            user_prefs = _build_user_prefs(onboarding, user_id)
        else:
            md_prefs = persona_doc.get_persona_for_algorithm(user_id)
            if md_prefs:
                user_prefs = md_prefs

    top_buddies: List[Dict[str, Any]] = []
    if user_prefs:
        top_buddies = get_top_personas(user_prefs, limit=10)
    else:
        all_b = get_all_buddies()
        top_buddies = all_b[:3]

    CARD_TRIGGER_THRESHOLD = 60.0

    _GUEST_PREFS = {
        "mbti": "ENFP",
        "travel_style": "随性探索型",
        "preferences": {"likes": ["美食", "拍照", "自然风光"], "dislikes": ["暴走"], "pace": "慢悠悠"},
    }

    enriched_videos = []
    for i, video in enumerate(videos):
        v = dict(video)
        is_twin_card = v.get("type") == "twin_card"

        if is_twin_card:
            buddy_idx = i - 2
            if buddy_idx < len(top_buddies):
                buddy = top_buddies[buddy_idx]
                score = buddy.get("_score", 0.0)
                if user_prefs is None:
                    score = round(_mock_compat_breakdown(_GUEST_PREFS, buddy)["total"], 1)
                    buddy_with_score = dict(buddy, _score=score)
                else:
                    buddy_with_score = dict(buddy, _score=score)

                if user_prefs is not None and score < CARD_TRIGGER_THRESHOLD:
                    v["type"] = "video"
                    v["buddy"] = None
                else:
                    v["buddy"] = get_buddy_public(buddy_with_score, user_prefs)
                    v["location"] = city or CITY_NAMES.get(
                        onboarding.get("city", "") if onboarding else "", v.get("location", "大理")
                    )
            else:
                if user_prefs is not None:
                    v["type"] = "video"
                v["buddy"] = None

        enriched_videos.append(v)

    return {
        "success": True,
        "data": enriched_videos,
        "buddies": [get_buddy_public(b, user_prefs) for b in top_buddies[:10]],
        "user_prefs": user_prefs,
        "meta": {
            "total": len(enriched_videos),
            "city": city or "all",
            "user_id": user_id,
            "buddy_count": len(top_buddies),
        },
    }
