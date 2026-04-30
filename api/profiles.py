from __future__ import annotations

import time
import uuid
from typing import Any, Dict

from fastapi import APIRouter, HTTPException

from api._constants import MBTI_LABELS
from api._models import (
    TwinBuddyProfileRequest,
    TwinBuddyProfilePatchRequest,
    TwinBuddyProfileResponse,
    TwinBuddyStylePatchRequest,
)
from api._store import get_profile, save_profile
from api.style_vector import extract_style_vector

router = APIRouter(prefix="/api", tags=["ProfilesV2"])


def _profile_nickname(mbti: str, city: str) -> str:
    city_label = city[:2] if city else "旅行"
    return f"{city_label}{MBTI_LABELS.get(mbti, mbti)}"


@router.post("/profiles")
async def create_profile(req: TwinBuddyProfileRequest) -> Dict[str, Any]:
    user_id = req.user_id or f"user_{uuid.uuid4().hex[:8]}"
    updated_at = int(time.time() * 1000)
    style_vector = extract_style_vector([req.self_desc])
    profile = TwinBuddyProfileResponse(
        user_id=user_id,
        nickname=_profile_nickname(req.mbti, req.city),
        mbti=req.mbti,
        travel_range=req.travel_range,
        budget=req.budget,
        self_desc=req.self_desc,
        city=req.city,
        style_vector=style_vector,
        is_verified=False,
        verification_status="unverified",
        updated_at=updated_at,
    )
    save_profile(user_id, profile.model_dump())
    return {"success": True, "data": profile.model_dump()}


@router.get("/profiles/{user_id}")
async def get_profile_detail(user_id: str) -> Dict[str, Any]:
    profile = get_profile(user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return {"success": True, "data": profile}


@router.patch("/profiles/{user_id}/style")
async def patch_profile_style(user_id: str, req: TwinBuddyStylePatchRequest) -> Dict[str, Any]:
    profile = get_profile(user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    profile["style_vector"] = req.style_vector
    profile["updated_at"] = int(time.time() * 1000)
    save_profile(user_id, profile)
    return {"success": True, "data": profile}


@router.patch("/profiles/{user_id}")
async def patch_profile(user_id: str, req: TwinBuddyProfilePatchRequest) -> Dict[str, Any]:
    profile = get_profile(user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    if req.budget is not None:
        profile["budget"] = req.budget
    if req.self_desc is not None:
        profile["self_desc"] = req.self_desc
    if req.city is not None:
        profile["city"] = req.city
    if req.travel_range is not None:
        profile["travel_range"] = req.travel_range
    if req.style_vector is not None:
        profile["style_vector"] = req.style_vector
    profile["updated_at"] = int(time.time() * 1000)
    save_profile(user_id, profile)
    return {"success": True, "data": profile}
