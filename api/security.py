from __future__ import annotations

import time
from typing import Any, Dict

from fastapi import APIRouter, HTTPException

from api._models import TwinBuddySecurityStatusResponse, TwinBuddySecurityVerifyRequest
from api._store import get_profile, get_security_status, save_profile, save_security_status

router = APIRouter(prefix="/api", tags=["SecurityV2"])


def _mask_name(name: str) -> str:
    if len(name) <= 1:
        return "*"
    return name[0] + "*" * (len(name) - 1)


@router.get("/security/status/{user_id}")
async def get_verification_status(user_id: str) -> Dict[str, Any]:
    profile = get_profile(user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    status = get_security_status(user_id) or {}
    payload = TwinBuddySecurityStatusResponse(
        user_id=user_id,
        is_verified=bool(profile.get("is_verified")),
        verification_status=profile.get("verification_status", "unverified"),
        real_name_masked=status.get("real_name_masked", ""),
        id_number_tail=status.get("id_number_tail", ""),
        verified_at=profile.get("verified_at"),
    )
    return {"success": True, "data": payload.model_dump()}


@router.post("/security/verify")
async def verify_user(req: TwinBuddySecurityVerifyRequest) -> Dict[str, Any]:
    profile = get_profile(req.user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    if not req.face_checked:
        raise HTTPException(status_code=400, detail="Face verification required")

    verified_at = int(time.time() * 1000)
    profile["is_verified"] = True
    profile["verification_status"] = "verified"
    profile["verified_at"] = verified_at
    save_profile(req.user_id, profile)

    status = {
        "user_id": req.user_id,
        "real_name_masked": _mask_name(req.legal_name),
        "id_number_tail": req.id_number_tail,
        "verified_at": verified_at,
    }
    save_security_status(req.user_id, status)

    payload = TwinBuddySecurityStatusResponse(
        user_id=req.user_id,
        is_verified=True,
        verification_status="verified",
        real_name_masked=status["real_name_masked"],
        id_number_tail=req.id_number_tail,
        verified_at=verified_at,
    )
    return {"success": True, "data": payload.model_dump()}
