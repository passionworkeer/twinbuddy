from __future__ import annotations

import time
import uuid
from typing import Any, Dict, List

from fastapi import APIRouter, HTTPException, Query

from api._models import TwinBuddyMessageSendRequest
from api._store import get_profile, get_room, list_rooms, save_room

router = APIRouter(prefix="/api", tags=["MessagesV2"])


def _seed_rooms_for_user(user_id: str) -> None:
    if any(room.get("owner_user_id") == user_id for room in list_rooms().values()):
        return

    defaults = [
        {
            "room_id": "room-01",
            "peer_user": {"id": "buddy-001", "nickname": "小满", "mbti": "ENFJ"},
            "messages": [
                {
                    "id": "msg-room01-1",
                    "sender_id": "buddy-001",
                    "content": "这周末如果去顺德，你更想吃还是拍？",
                    "type": "text",
                    "created_at": int(time.time() * 1000) - 5000,
                }
            ],
        },
        {
            "room_id": "room-02",
            "peer_user": {"id": "buddy-002", "nickname": "阿杰", "mbti": "INTP"},
            "messages": [
                {
                    "id": "msg-room02-1",
                    "sender_id": "buddy-002",
                    "content": "我把预算拆成交通和住宿两段了，晚点给你看。",
                    "type": "text",
                    "created_at": int(time.time() * 1000) - 4000,
                }
            ],
        },
        {
            "room_id": "room-03",
            "peer_user": {"id": "buddy-004", "nickname": "栗子", "mbti": "ESFJ"},
            "messages": [
                {
                    "id": "msg-room03-1",
                    "sender_id": "buddy-004",
                    "content": "我先把顺德想吃的 3 家店列出来了，你看要不要压成 2 家。",
                    "type": "trip_card",
                    "created_at": int(time.time() * 1000) - 3200,
                }
            ],
        },
        {
            "room_id": "room-04",
            "peer_user": {"id": "buddy-005", "nickname": "Ryan", "mbti": "ENTP"},
            "messages": [
                {
                    "id": "msg-room04-1",
                    "sender_id": "buddy-005",
                    "content": "如果你愿意，我们可以先确认预算上限，再看当天临场发挥。",
                    "type": "text",
                    "created_at": int(time.time() * 1000) - 2600,
                }
            ],
        },
    ]

    for room in defaults:
        room["owner_user_id"] = user_id
        save_room(room["room_id"], room)


@router.get("/conversations")
async def get_conversations(user_id: str = Query(...)) -> Dict[str, Any]:
    profile = get_profile(user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    _seed_rooms_for_user(user_id)
    items = []
    for room in list_rooms().values():
        if room.get("owner_user_id") != user_id:
            continue
        last_message = room.get("messages", [])[-1] if room.get("messages") else None
        items.append(
            {
                "room_id": room["room_id"],
                "peer_user": room["peer_user"],
                "last_message": last_message["content"] if last_message else "",
                "unread_count": 0,
            }
        )
    return {"success": True, "data": {"items": items}}


@router.get("/messages/{room_id}")
async def get_messages(room_id: str, page: int = Query(default=1, ge=1)) -> Dict[str, Any]:
    room = get_room(room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    return {"success": True, "data": {"items": room.get("messages", []), "page": page}}


@router.post("/messages")
async def send_message(req: TwinBuddyMessageSendRequest) -> Dict[str, Any]:
    room = get_room(req.room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    message = {
        "id": f"msg_{uuid.uuid4().hex[:10]}",
        "sender_id": req.sender_id,
        "content": req.content,
        "type": req.type,
        "created_at": int(time.time() * 1000),
    }
    room.setdefault("messages", []).append(message)
    save_room(req.room_id, room)
    return {"success": True, "data": message}
