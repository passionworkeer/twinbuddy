from __future__ import annotations

from typing import Any, Dict, List

from fastapi import APIRouter, HTTPException, Query

from api._constants import MBTI_EMOJI
from api.real_persona_index import get_persona_by_id, get_top_personas
from api._store import get_profile

router = APIRouter(prefix="/api", tags=["BuddiesV2"])


_FALLBACK_CANDIDATES = [
    {
        "buddy_id": "buddy-001",
        "nickname": "小满",
        "mbti": "ENFJ",
        "city": "深圳",
        "status": "等待你决定",
        "highlights": ["周末短途", "会做攻略", "吃饭不纠结"],
        "conflicts": ["拍照诉求略高"],
        "source": "mock_fallback",
        "is_seed": True,
    },
    {
        "buddy_id": "buddy-002",
        "nickname": "阿杰",
        "mbti": "INTP",
        "city": "广州",
        "status": "协商完成",
        "highlights": ["深度慢游", "预算稳定", "情绪平稳"],
        "conflicts": ["社交强度偏低"],
        "source": "mock_fallback",
        "is_seed": True,
    },
    {
        "buddy_id": "buddy-003",
        "nickname": "Momo",
        "mbti": "ISFP",
        "city": "珠海",
        "status": "继续观察",
        "highlights": ["城市散步", "美食优先", "出片稳定"],
        "conflicts": ["作息偏晚"],
        "source": "mock_fallback",
        "is_seed": True,
    },
]


def _calculate_match_score(profile: Dict[str, Any], candidate: Dict[str, Any]) -> int:
    score = 68
    if profile.get("city") == candidate.get("city"):
        score += 8
    if profile.get("budget") in ("经济", "舒适"):
        score += 5
    if "周边城市" in profile.get("travel_range", []) or "国内" in profile.get("travel_range", []):
        score += 4
    candidate_mbti = candidate.get("mbti", "")
    if profile.get("mbti", "") and candidate_mbti and profile.get("mbti", "").startswith(candidate_mbti[0]):
        score += 2
    return min(score, 92)


def _build_radar(score: int) -> List[Dict[str, Any]]:
    base = max(score - 8, 55)
    return [
        {"dimension": "行程节奏", "user_score": base, "buddy_score": base + 6, "weight": 0.25},
        {"dimension": "消费态度", "user_score": base + 4, "buddy_score": base + 2, "weight": 0.25},
        {"dimension": "行程风格", "user_score": base + 1, "buddy_score": base + 5, "weight": 0.2},
        {"dimension": "社交强度", "user_score": base - 4, "buddy_score": base + 2, "weight": 0.1},
        {"dimension": "拍照态度", "user_score": base + 7, "buddy_score": base + 3, "weight": 0.05},
        {"dimension": "美食追求", "user_score": base + 5, "buddy_score": base + 1, "weight": 0.15},
    ]


def _build_user_prefs(profile: Dict[str, Any]) -> Dict[str, Any]:
    travel_range = profile.get("travel_range") or []
    budget = profile.get("budget") or "舒适"
    mbti = (profile.get("mbti") or "ENFP").upper()
    city = profile.get("city") or ""
    style_vector = profile.get("style_vector") or {}

    pace = style_vector.get("travel_pace")
    if not pace:
        if "周边城市" in travel_range or "周末短途" in travel_range:
            pace = "慢悠悠，睡到自然醒，不赶景点，享受过程"
        else:
            pace = "有计划，每天有明确目标，不喜欢临时改变"

    negotiation_style = style_vector.get("decision_style")
    if not negotiation_style:
        negotiation_style = "用感受和价值观说服，温和但坚定，容易被真诚打动"

    likes = profile.get("interests") or []

    return {
        "mbti": mbti,
        "likes": likes,
        "dislikes": [],
        "budget": budget,
        "pace": pace,
        "travel_style": pace,
        "negotiation_style": negotiation_style,
        "city": city,
    }


def _build_persona_candidate(persona: Dict[str, Any], index: int, profile: Dict[str, Any]) -> Dict[str, Any]:
    breakdown = persona.get("breakdown") or {}
    highlights = breakdown.get("strengths") or persona.get("preferences", {}).get("likes") or ["偏好稳定"]
    conflicts = breakdown.get("red_flags") or persona.get("preferences", {}).get("dislikes") or ["需要继续协商"]
    score = int(round(persona.get("score", 72)))
    city = persona.get("city") or profile.get("city") or "未设置城市"
    persona_id = persona.get("id", str(index))
    buddy_id = f"seed-{persona_id}"
    dialogue = persona.get("dialogue") or {}

    return {
        "buddy_id": buddy_id,
        "nickname": persona.get("name") or f"搭子{index}",
        "mbti": persona.get("mbti") or "ENFP",
        "city": city,
        "status": "种子候选",
        "highlights": highlights[:3],
        "conflicts": conflicts[:2],
        "avatar": persona.get("avatar_emoji") or MBTI_EMOJI.get(persona.get("mbti", ""), "✨"),
        "match_score": score,
        "negotiation_id": f"neg-seed-{index:03d}",
        "preview": dialogue.get("summary") or f"基于 {city} 与 {profile.get('budget', '舒适')} 预算偏好，系统为你挑出的一位种子搭子。",
        "source": "seed_persona",
        "is_seed": True,
    }


def _build_fallback_candidate(profile: Dict[str, Any], candidate: Dict[str, Any], index: int) -> Dict[str, Any]:
    score = _calculate_match_score(profile, candidate)
    return {
        **candidate,
        "avatar": MBTI_EMOJI.get(candidate["mbti"], "✨"),
        "match_score": score,
        "negotiation_id": f"neg-{index:03d}",
        "preview": f"数字分身已经帮你们对齐了 {profile.get('budget')} 预算和 {profile.get('city')} 出发节奏。",
    }


def _get_candidate_pool(profile: Dict[str, Any]) -> List[Dict[str, Any]]:
    fallback_items = [
        _build_fallback_candidate(profile, candidate, index)
        for index, candidate in enumerate(_FALLBACK_CANDIDATES, start=1)
    ]
    personas = get_top_personas(_build_user_prefs(profile), limit=3)
    if not personas:
        return fallback_items

    persona_items = [
        _build_persona_candidate(persona, index, profile)
        for index, persona in enumerate(personas, start=len(fallback_items) + 1)
    ]
    return fallback_items + persona_items


@router.get("/buddies/inbox")
async def get_buddy_inbox(
    user_id: str = Query(..., description="用户 ID"),
    page: int = Query(default=1, ge=1),
) -> Dict[str, Any]:
    profile = get_profile(user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    if not profile.get("is_verified"):
        raise HTTPException(status_code=403, detail="请先完成实名认证后再查看搭子动态")

    items = _get_candidate_pool(profile)

    return {
        "success": True,
        "data": {"items": items, "page": page, "has_more": False},
    }


def _resolve_card_candidate(buddy_id: str) -> Dict[str, Any] | None:
    fallback = next((item for item in _FALLBACK_CANDIDATES if item["buddy_id"] == buddy_id), None)
    if fallback:
        return fallback
    if not buddy_id.startswith("seed-"):
        return None
    persona = get_persona_by_id(buddy_id.removeprefix("seed-"))
    if not persona:
        return None
    return _build_persona_candidate(persona, 1, {})


@router.get("/buddies/{buddy_id}/card")
async def get_buddy_card(
    buddy_id: str,
    negotiation_id: str = Query(default=""),
) -> Dict[str, Any]:
    candidate = _resolve_card_candidate(buddy_id)
    if not candidate:
        raise HTTPException(status_code=404, detail="Buddy not found")

    score = candidate.get("match_score") or _calculate_match_score({"city": candidate["city"], "budget": "舒适", "mbti": candidate["mbti"], "travel_range": ["周边城市"]}, candidate)
    card = {
        "profile": {
            "buddy_id": buddy_id,
            "nickname": candidate["nickname"],
            "mbti": candidate["mbti"],
            "avatar": candidate.get("avatar") or MBTI_EMOJI.get(candidate["mbti"], "✨"),
            "city": candidate["city"],
            "summary": f"{candidate['nickname']} 更偏向 {candidate['highlights'][0]}，在协商里表现出较高的稳定度。",
        },
        "negotiation_summary": {
            "negotiation_id": negotiation_id or f"neg-{buddy_id}",
            "match_score": score,
            "consensus": candidate["highlights"],
            "conflicts": candidate["conflicts"],
            "report_intro": "预算与目的地选择已经初步对齐，适合进入下一步了解。",
        },
        "radar_chart": _build_radar(score),
        "actions": [
            {"id": "blind-game", "label": "开始 6 轮盲选"},
            {"id": "skip", "label": "先跳过"},
            {"id": "wechat", "label": "进一步认识"},
        ],
    }
    return {"success": True, "data": card}


@router.post("/buddies/{buddy_id}/accept")
async def accept_buddy(buddy_id: str, payload: Dict[str, str]) -> Dict[str, Any]:
    if not get_profile(payload.get("user_id", "")):
        raise HTTPException(status_code=404, detail="Profile not found")
    return {
        "success": True,
        "data": {
            "room_id": f"room-{buddy_id}",
            "peer_profile": {"buddy_id": buddy_id},
        },
    }


@router.post("/buddies/{buddy_id}/skip")
async def skip_buddy(buddy_id: str) -> Dict[str, Any]:
    return {"success": True, "data": {"buddy_id": buddy_id, "status": "skipped"}}


@router.post("/buddies/{buddy_id}/decide")
async def decide_buddy(buddy_id: str, payload: Dict[str, str]) -> Dict[str, Any]:
    decision = payload.get("decision", "decline")
    return {"success": True, "data": {"buddy_id": buddy_id, "decision": decision}}
