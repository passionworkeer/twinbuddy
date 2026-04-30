from __future__ import annotations

import asyncio
import json
import time
import uuid
from typing import Any, Dict, Iterable, List

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from api._models import TwinBuddyChatHistoryResponse, TwinBuddyChatSendRequest
from api._store import (
    append_chat_message,
    get_chat_conversation,
    get_profile,
    save_chat_conversation,
    save_profile,
)
from api.style_vector import extract_style_vector

router = APIRouter(prefix="/api", tags=["ChatV2"])


def _sse(payload: Dict[str, Any]) -> str:
    return f"data: {json.dumps(payload, ensure_ascii=False)}\n\n"


def _chunk_text(text: str, size: int = 20) -> Iterable[str]:
    for start in range(0, len(text), size):
        yield text[start : start + size]


def _build_reply(profile: Dict[str, Any], message: str) -> tuple[str, str]:
    city = profile.get("city", "你的城市")
    budget = profile.get("budget", "舒适")
    travel_range = "、".join(profile.get("travel_range", [])[:2]) or "周边城市"

    if "预算" in message:
        reply = f"按你现在偏 {budget} 的预算习惯，我会先把 {city} 出发的 {travel_range} 线路拆成交通、住宿、体验三段，再帮你筛掉太贵的项。"
        hint = "预算敏感度已更新，后续会优先筛选花费节奏接近的搭子。"
    elif "周末" in message or "假期" in message:
        reply = f"你提到周末/假期节奏，我会优先给你推荐 2-3 天可成行、且不用太赶的方案，再结合你在 {city} 的出发便利性排一下。"
        hint = "出行时长偏好已记录，会影响后续匹配和协商。"
    else:
        reply = f"收到。我会把你这句偏好并进数字分身画像里，接下来既能给你出行建议，也会在帮你筛搭子时参考这条信息。"
        hint = "已提取新的表达风格和偏好线索。"
    return reply, hint


@router.post("/chat/send")
async def send_chat(req: TwinBuddyChatSendRequest) -> StreamingResponse:
    profile = get_profile(req.user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    conversation_id = req.conversation_id or f"conv_{uuid.uuid4().hex[:10]}"
    user_message = {
        "id": f"msg_{uuid.uuid4().hex[:8]}",
        "role": "user",
        "content": req.message,
        "created_at": int(time.time() * 1000),
    }
    append_chat_message(conversation_id, req.user_id, user_message)

    reply, hint = _build_reply(profile, req.message)
    assistant_message = {
        "id": f"msg_{uuid.uuid4().hex[:8]}",
        "role": "assistant",
        "content": reply,
        "created_at": int(time.time() * 1000) + 1,
    }

    conversation = get_chat_conversation(conversation_id) or {
        "conversation_id": conversation_id,
        "user_id": req.user_id,
        "messages": [],
    }
    user_texts = [item["content"] for item in conversation.get("messages", []) if item.get("role") == "user"]
    profile["style_vector"] = extract_style_vector([profile.get("self_desc", ""), *user_texts])
    save_profile(req.user_id, profile)

    async def event_stream():
        yield _sse({"type": "meta", "conversation_id": conversation_id})
        current = ""
        for chunk in _chunk_text(reply):
            current += chunk
            yield _sse({"type": "message", "conversation_id": conversation_id, "content": chunk})
            await asyncio.sleep(0)
        append_chat_message(conversation_id, req.user_id, assistant_message)
        yield _sse({"type": "preference_hint", "conversation_id": conversation_id, "content": hint})
        yield _sse({"type": "done", "conversation_id": conversation_id})

    headers = {"Cache-Control": "no-cache", "X-Accel-Buffering": "no"}
    return StreamingResponse(event_stream(), media_type="text/event-stream", headers=headers)


@router.get("/chat/history/{conversation_id}")
async def get_chat_history(conversation_id: str) -> Dict[str, Any]:
    conversation = get_chat_conversation(conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    response = TwinBuddyChatHistoryResponse(
        conversation_id=conversation_id,
        user_id=conversation["user_id"],
        items=conversation.get("messages", []),
    )
    return {"success": True, "data": response.model_dump()}
