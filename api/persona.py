# api/persona.py
"""GET /api/persona 端点"""
from __future__ import annotations

from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Query

from api._store import _persona_store
from agents import persona_doc

router = APIRouter(prefix="/api", tags=["Persona"])


def _build_persona_from_params(
    mbti: str, interests: List[str], city: str, voice_text: str
) -> Dict[str, Any]:
    """无 user_id 时，根据参数构建人格（供预计算使用）"""
    from api.negotiate import _build_persona_from_onboarding
    return _build_persona_from_onboarding(mbti, city, interests, voice_text)


@router.get("/persona")
async def get_persona(
    user_id: Optional[str] = Query(None, description="用户 ID"),
    mbti: Optional[str] = Query(None, description="MBTI 类型"),
    interests: Optional[str] = Query(None, description="兴趣标签，逗号分隔"),
    city: Optional[str] = Query(None, description="城市 ID"),
    voice_text: Optional[str] = Query(None, description="语音转文字内容"),
) -> Dict[str, Any]:
    """
    GET /api/persona?user_id=xxx
    或 GET /api/persona?mbti=ENFP&interests=美食,摄影&city=chengdu&voice_text=...

    无 user_id 时，根据参数构建人格（用于预计算场景）。
    """
    # 有 user_id：从持久化数据读取
    if user_id:
        md_doc = persona_doc.load_persona_doc(user_id)
        if md_doc:
            fm, body = persona_doc.parse_persona_doc(md_doc)
            if fm:
                persona = persona_doc.dict_from_frontmatter(fm, body)
                persona["user_id"] = user_id
                return {"success": True, "data": persona}

        if user_id in _persona_store:
            persona = _persona_store[user_id]
            return {"success": True, "data": persona}

        raise HTTPException(status_code=404, detail="未找到用户数据，请先完成引导")

    # 无 user_id：根据参数构建人格（供预计算使用）
    if not mbti:
        raise HTTPException(status_code=400, detail="缺少 user_id 或 mbti 参数")

    interest_list = [i.strip() for i in interests.split(",")] if interests else []
    persona = _build_persona_from_params(mbti.upper(), interest_list, city or "", voice_text or "")
    return {"success": True, "data": persona}
