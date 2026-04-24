# api/buddies.py
"""GET /api/buddies 端点"""
from __future__ import annotations

from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Query

from api._constants import BUDDY_CONFIGS
from api._store import _onboarding_store
from agents.buddies import get_buddy_public
from agents.real_persona_index import get_top_personas

router = APIRouter(prefix="/api", tags=["Buddies"])


def _build_user_prefs(onboarding: Dict[str, Any], user_id: str = "") -> Dict[str, Any]:
    mbti = (onboarding.get("mbti") or "ENFP").strip().upper()
    interests: List[str] = onboarding.get("interests") or []
    city = onboarding.get("city") or ""

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


@router.get("/buddies")
async def get_buddies(
    user_id: Optional[str] = Query(default=None, description="用户ID"),
    limit: int = Query(default=10, ge=1, le=50),
    mbti: Optional[str] = Query(default=None, description="MBTI 类型"),
    interests: Optional[str] = Query(default=None, description="兴趣列表，逗号分隔"),
    city: Optional[str] = Query(default=None, description="城市"),
) -> Dict[str, Any]:
    if user_id and user_id in _onboarding_store:
        onboarding = _onboarding_store[user_id]
        user_prefs = _build_user_prefs(onboarding, user_id)
    else:
        onboarding = {
            "mbti": mbti or "ENFP",
            "interests": interests.split(",") if interests else [],
            "city": city or "chongqing",
        }
        user_prefs = _build_user_prefs(onboarding, user_id or "")

    top_buddies = get_top_personas(user_prefs, limit=limit)

    return {
        "success": True,
        "buddies": [get_buddy_public(buddy, user_prefs) for buddy in top_buddies],
        "user_prefs": user_prefs,
        "meta": {
            "user_id": user_id or "",
            "limit": limit,
            "total_buddies": len(top_buddies),
            "mbti": user_prefs.get("mbti"),
            "city": user_prefs.get("city"),
        },
    }
