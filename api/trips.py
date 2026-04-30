from __future__ import annotations

import time
import uuid
from typing import Any, Dict

from fastapi import APIRouter, HTTPException

from api._models import TwinBuddyTripReportRequest, TwinBuddyTripStatusResponse
from api._store import get_profile, get_trip, save_trip

router = APIRouter(prefix="/api", tags=["TripsV2"])


def _mask_phone(phone: str) -> str:
    if len(phone) < 4:
        return "*" * len(phone)
    return f"{'*' * max(len(phone) - 4, 0)}{phone[-4:]}"


@router.post("/trips/report")
async def report_trip(req: TwinBuddyTripReportRequest) -> Dict[str, Any]:
    user_a = get_profile(req.user_a_id)
    if not user_a:
        raise HTTPException(status_code=404, detail="Profile not found")
    if not user_a.get("is_verified"):
        raise HTTPException(status_code=403, detail="请先完成实名认证后再上报行程")

    user_b = get_profile(req.user_b_id)
    peer_label = user_b.get("nickname") if user_b else req.user_b_id

    trip_id = f"trip_{uuid.uuid4().hex[:10]}"
    payload = TwinBuddyTripStatusResponse(
        trip_id=trip_id,
        status="reported",
        destination=req.destination,
        depart_date=req.depart_date,
        return_date=req.return_date,
        emergency_contact_masked=_mask_phone(req.emergency_contact_phone),
        emergency_notification_sent=True,
        created_at=int(time.time() * 1000),
    )
    trip = payload.model_dump() | {
        "user_a_id": req.user_a_id,
        "user_b_id": req.user_b_id,
        "peer_label": peer_label,
        "emergency_contact_name": req.emergency_contact_name[:1] + "*",
    }
    save_trip(trip_id, trip)
    return {"success": True, "data": trip}


@router.get("/trips/{trip_id}/status")
async def get_trip_status(trip_id: str) -> Dict[str, Any]:
    trip = get_trip(trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    return {"success": True, "data": trip}
