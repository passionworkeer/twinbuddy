# api/onboarding.py
"""POST /api/onboarding 端点"""
from __future__ import annotations

import logging
import uuid
from typing import Any, Dict

from fastapi import APIRouter

from api._models import OnboardingDataRequest
from api._store import _onboarding_store, _persona_store, _save_store_async
from agents import persona_doc
from persona_generator import generate_persona_from_onboarding

router = APIRouter(prefix="/api", tags=["Onboarding"])

logger = logging.getLogger("twinbuddy.api")


def _generate_persona_id() -> str:
    return f"persona-{uuid.uuid4().hex[:8]}"


@router.post("/onboarding")
async def save_onboarding(req: OnboardingDataRequest) -> Dict[str, Any]:
    """
    POST /api/onboarding

    保存用户引导数据，触发 LLM 生成完整 persona 并持久化到 .md 文件。
    同时在内存和 JSON 文件中备份。
    """
    user_id = str(uuid.uuid4())
    onboarding_data = {
        "user_id": user_id,
        "mbti": req.mbti,
        "interests": req.interests,
        "voiceText": req.voiceText,
        "city": req.city,
        "completed": req.completed,
    }

    # 保存 onboarding 数据
    _onboarding_store[user_id] = onboarding_data
    _save_store_async()

    # 生成 persona
    try:
        persona = generate_persona_from_onboarding(
            mbti=req.mbti,
            interests=req.interests,
            city=req.city,
            voice_text=req.voiceText,
        )
        if not persona:
            raise ValueError("generate_persona_from_onboarding returned empty")

        # 保存 persona 到 .md 文件
        persona_doc.save_persona_doc(user_id, persona)

        # 更新 persona store
        persona["user_id"] = user_id
        persona["persona_id"] = persona.get("persona_id") or _generate_persona_id()
        _persona_store[user_id] = persona

    except Exception as exc:
        logger.warning("LLM persona 生成失败，降级到 Mock: %s", exc)
        # 降级：构造最小 persona
        persona = {
            "persona_id": _generate_persona_id(),
            "mbti_type": req.mbti,
            "city": req.city,
            "identity": {
                "content": f"MBTI={req.mbti}",
                "core_values": req.interests,
            },
            "speaking_style": {
                "chat_tone": "温和",
                "typical_phrases": [],
            },
            "travel_style": {
                "budget": "",
                "preferred_pace": "",
            },
            "negotiation_style": {
                "approach": "温和协商",
                "easy_to_compromise": [],
                "hard_to_compromise": [],
            },
            "layer0_hard_rules": {
                "dealbreakers": [],
                "max_budget_per_day": 0,
                "must_have": [],
            },
            "user_id": user_id,
        }
        _persona_store[user_id] = persona

    return {"success": True, "data": persona}
