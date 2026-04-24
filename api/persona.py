# api/persona.py
"""GET /api/persona 端点"""
from __future__ import annotations

from typing import Any, Dict, Optional

from fastapi import APIRouter, HTTPException, Query

from api._store import _persona_store
from agents import persona_doc

router = APIRouter(prefix="/api", tags=["Persona"])


@router.get("/persona")
async def get_persona(
    user_id: Optional[str] = Query(None, description="用户 ID"),
) -> Dict[str, Any]:
    """
    GET /api/persona?user_id=xxx

    返回用户 persona 数据。
    优先从 .md 文件读取（服务器重启后可恢复），其次查内存。
    """
    if not user_id:
        raise HTTPException(status_code=400, detail="缺少 user_id 参数")

    # 方式1：从 .md 文件读取（优先，恢复服务器重启后的数据）
    md_doc = persona_doc.load_persona_doc(user_id)
    if md_doc:
        fm, body = persona_doc.parse_persona_doc(md_doc)
        if fm:
            persona = persona_doc.dict_from_frontmatter(fm, body)
            persona["user_id"] = user_id
            return {"success": True, "data": persona}

    # 方式2：从内存读取
    if user_id in _persona_store:
        persona = _persona_store[user_id]
        return {"success": True, "data": persona}

    raise HTTPException(status_code=404, detail="未找到用户数据，请先完成引导")
