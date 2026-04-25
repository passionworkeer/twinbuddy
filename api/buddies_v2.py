from __future__ import annotations

from typing import Any, Dict, List

from fastapi import APIRouter, HTTPException, Query

from api._constants import MBTI_EMOJI
from api._store import get_profile

router = APIRouter(prefix="/api", tags=["BuddiesV2"])

_CANDIDATES = [
    {
        "buddy_id": "buddy-001",
        "nickname": "小满",
        "mbti": "ENFJ",
        "city": "深圳",
        "status": "等待你决定",
        "highlights": ["周末短途", "会做攻略", "吃饭不纠结"],
        "conflicts": ["拍照诉求略高"],
    },
    {
        "buddy_id": "buddy-002",
        "nickname": "阿杰",
        "mbti": "INTP",
        "city": "广州",
        "status": "协商完成",
        "highlights": ["深度慢游", "预算稳定", "情绪平稳"],
        "conflicts": ["社交强度偏低"],
    },
    {
        "buddy_id": "buddy-003",
        "nickname": "Momo",
        "mbti": "ISFP",
        "city": "珠海",
        "status": "继续观察",
        "highlights": ["城市散步", "美食优先", "出片稳定"],
        "conflicts": ["作息偏晚"],
    },
    {
        "buddy_id": "buddy-004",
        "nickname": "栗子",
        "mbti": "ESFJ",
        "city": "佛山",
        "status": "等待你决定",
        "highlights": ["会照顾同行体验", "预算稳定", "节奏舒服"],
        "conflicts": ["可能会过度在意细节"],
    },
    {
        "buddy_id": "buddy-005",
        "nickname": "Ryan",
        "mbti": "ENTP",
        "city": "深圳",
        "status": "协商完成",
        "highlights": ["路线灵活", "愿意尝鲜", "聊天推进快"],
        "conflicts": ["临时改计划概率偏高"],
    },
    {
        "buddy_id": "buddy-006",
        "nickname": "南枝",
        "mbti": "INFP",
        "city": "广州",
        "status": "继续观察",
        "highlights": ["情绪稳定", "审美在线", "拍照细腻"],
        "conflicts": ["效率偏低"],
    },
]


def _calculate_match_score(profile: Dict[str, Any], candidate: Dict[str, Any]) -> int:
    score = 68
    if profile.get("city") == candidate["city"]:
        score += 8
    if profile.get("budget") in ("经济", "舒适"):
        score += 5
    if "周边城市" in profile.get("travel_range", []) or "国内" in profile.get("travel_range", []):
        score += 4
    if profile.get("mbti", "").startswith(candidate["mbti"][0]):
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

    items = []
    for index, candidate in enumerate(_CANDIDATES, start=1):
        score = _calculate_match_score(profile, candidate)
        items.append(
            {
                **candidate,
                "avatar": MBTI_EMOJI.get(candidate["mbti"], "✨"),
                "match_score": score,
                "negotiation_id": f"neg-{index:03d}",
                "preview": f"数字分身已经帮你们对齐了 {profile.get('budget')} 预算和 {profile.get('city')} 出发节奏。",
            }
        )

    return {
        "success": True,
        "data": {"items": items, "page": page, "has_more": False},
    }


@router.get("/buddies/{buddy_id}/card")
async def get_buddy_card(
    buddy_id: str,
    negotiation_id: str = Query(default=""),
) -> Dict[str, Any]:
    candidate = next((item for item in _CANDIDATES if item["buddy_id"] == buddy_id), None)
    if not candidate:
        raise HTTPException(status_code=404, detail="Buddy not found")

    score = 82 if candidate["buddy_id"] == "buddy-001" else 77 if candidate["buddy_id"] == "buddy-002" else 74
    card = {
        "profile": {
            "buddy_id": buddy_id,
            "nickname": candidate["nickname"],
            "mbti": candidate["mbti"],
            "avatar": MBTI_EMOJI.get(candidate["mbti"], "✨"),
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
