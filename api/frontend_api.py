# -*- coding: utf-8 -*-
"""
backend/api/frontend_api.py — TwinBuddy 前端对接 API（路由重导出层）

各端点已拆分到独立文件，此文件负责统一导出 router，
保持 api/index.py 的导入接口兼容。

拆分结构：
  _models.py      - 共享 Pydantic 模型
  _constants.py  - 共享常量（城市/MBTI/视频/搭子配置）
  _store.py      - 内存状态持久化
  feed.py        - GET /api/feed
  buddies.py     - GET /api/buddies
  onboarding.py  - POST /api/onboarding
  persona.py     - GET /api/persona
  negotiate.py   - POST /api/negotiate
"""

from __future__ import annotations

from fastapi import APIRouter

# 子 router 已有 prefix="/api"，合并时不加额外 prefix
from api.buddies import router as _buddies_router
from api.buddies_v2 import router as _buddies_v2_router
from api.blind_game import router as _blind_game_router
from api.chat import router as _chat_router
from api.community import router as _community_router
from api.messages import router as _messages_router
from api.negotiate import router as _negotiate_router
from api.persona import router as _persona_router
from api.profiles import router as _profiles_router
from api.security import router as _security_router
from api.trips import router as _trips_router

# 主 router：不设 prefix（子 router 已包含 /api）
router = APIRouter(tags=["前端对接"])
router.include_router(_buddies_router)
router.include_router(_buddies_v2_router)
router.include_router(_blind_game_router)
router.include_router(_chat_router)
router.include_router(_community_router)
router.include_router(_messages_router)
router.include_router(_persona_router)
router.include_router(_profiles_router)
router.include_router(_negotiate_router)
router.include_router(_security_router)
router.include_router(_trips_router)

__all__ = ["router"]

# Re-export 模型（向后兼容）
from api._models import (
    NegotiationRequest,
    OnboardingDataRequest,
    PersonaResponse,
    VideoItemResponse,
)
