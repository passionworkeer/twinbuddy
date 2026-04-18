# -*- coding: utf-8 -*-
# card_engine.py - TwinBuddy 懂你卡片触发引擎
from __future__ import annotations
import json, os
from typing import Any, Dict, Optional
from pathlib import Path

# ---------------------------------------------------------------------------
# Trigger logic (pure function, no side effects)
# ---------------------------------------------------------------------------

TRIGGER_VIDEO_IDS = frozenset({3, 4, 5})
NORMAL_VIDEO_IDS = frozenset({1, 2})

def should_trigger_card(video_id: int) -> bool:
    return video_id in TRIGGER_VIDEO_IDS

def is_normal_video(video_id: int) -> bool:
    return video_id in NORMAL_VIDEO_IDS

# ---------------------------------------------------------------------------
# Video data (in-memory mock)
# ---------------------------------------------------------------------------

MOCK_VIDEOS = {
    1: {"video_id": 1, "title": "一个人的川西自驾，邂逅绝美日落", "category": "travel", "trigger_card": False},
    2: {"video_id": 2, "title": "成都美食地图｜必吃的10家苍蝇馆子", "category": "food", "trigger_card": False},
    3: {"video_id": 3, "title": "ENFP灵魂拷问：你是这样的自己吗？", "category": "lifestyle", "trigger_card": True},
    4: {"video_id": 4, "title": "INFP vs ENFP：理想主义者的共鸣与差异", "category": "social", "trigger_card": True},
    5: {"video_id": 5, "title": "ISTJ深度解析：你是不是传说中的靠谱搭子？", "category": "adventure", "trigger_card": True},
}

def get_video_data(video_id: int) -> Optional[Dict[str, Any]]:
    return MOCK_VIDEOS.get(video_id)

# ---------------------------------------------------------------------------
# Mock persona loader
# ---------------------------------------------------------------------------

MOCK_PERSONAS_DIR = Path(__file__).parent / "mock_personas"

def load_mock_persona(mbti_a: str, mbti_b: str) -> Optional[Dict[str, Any]]:
    combo = sorted([mbti_a.upper(), mbti_b.upper()])
    path = MOCK_PERSONAS_DIR / combo[0].lower() / f"compatibility_{combo[0].lower()}_{combo[1].lower()}.json"
    if path.exists():
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    return None

# ---------------------------------------------------------------------------
# Feed endpoint builder
# ---------------------------------------------------------------------------

def build_feed_response(video_id: int) -> Dict[str, Any]:
    video = get_video_data(video_id)
    if video is None:
        return {"error": "Video not found", "video_id": video_id, "status": 404}
    trigger = should_trigger_card(video_id)
    card_content = None
    negotiation_result = None
    if trigger:
        card_content = {
            "card_type": "twin_card",
            "title": "懂你的瞬间",
            "subtitle": f"你们在「{video['category']}」上很有共鸣",
            "compatibility_score": 0.78,
            "mbti_pair": "ENFP / INFP",
            "trigger_topic": video["category"],
        }
        compat = load_mock_persona("ENFP", "INFP")
        if compat:
            negotiation_result = {
                "phase": compat.get("phase", "REPORT_GENERATED"),
                "overall_score": compat.get("overall_score", 0.78),
                "rounds_summary": compat.get("rounds", [])[:2],
                "final_report": compat.get("final_report"),
            }
    return {
        "video_id": video_id,
        "title": video["title"],
        "category": video["category"],
        "trigger_card": trigger,
        "card_content": card_content,
        "negotiation_result": negotiation_result,
        "status": 200,
    }
