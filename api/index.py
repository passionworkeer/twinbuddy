# api/index.py
"""
TwinBuddy API 统一入口（Vercel Python Runtime）
所有 /api/* 请求打到同一个 Function 实例。

本地开发：uvicorn api.index:app --reload --port 8000
Vercel：自动识别 api/index.py 为入口
"""

from __future__ import annotations

import os

from pathlib import Path as _P
from dotenv import load_dotenv
_env = _P(__file__).parent.parent / ".env"
if _env.exists():
    load_dotenv(_env)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api import frontend_router, stt_router


_DEFAULT_CORS_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]


def _get_cors_origins() -> list[str]:
    configured = os.environ.get("CORS_ALLOW_ORIGINS", "")
    origins = [origin.strip() for origin in configured.split(",") if origin.strip()]
    if origins:
        return origins
    if os.environ.get("VERCEL") is not None:
        return []
    return _DEFAULT_CORS_ORIGINS


app = FastAPI(
    title="TwinBuddy API",
    version="1.0.0",
    docs_url="/docs" if os.environ.get("VERCEL") is None else None,
    redoc_url="/redoc" if os.environ.get("VERCEL") is None else None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_get_cors_origins(),
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 复用现有 router（不做拆分，先验证入口可行）
# frontend_router 已有 prefix="/api"，stt_router 已有 prefix="/api"
app.include_router(frontend_router)
app.include_router(stt_router)


@app.get("/api/health")
def health_check():
    """健康检查端点"""
    return {"status": "healthy", "service": "twinbuddy-api"}
