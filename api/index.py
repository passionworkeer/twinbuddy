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

app = FastAPI(
    title="TwinBuddy API",
    version="1.0.0",
    docs_url="/docs" if os.environ.get("VERCEL") is None else None,
    redoc_url="/redoc" if os.environ.get("VERCEL") is None else None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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
