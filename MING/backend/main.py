# -*- coding: utf-8 -*-
"""
main.py — TwinBuddy FastAPI 后端入口
TwinBuddy Hackathon MVP 专用

端口：8000
路由：
  POST /generate_avatar  — 多文件上传，返回完整 Persona JSON
  GET  /health           — 健康检查

设计原则：
  - 不可变数据流：每个 handler 只读不解构输入
  - 错误显式处理：统一错误格式，状态码明确
  - 输入验证：文件大小限制、格式白名单
  - 并发处理：asyncio 异步文件 IO
"""

from __future__ import annotations

import asyncio
import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import (
    BackgroundTasks,
    FastAPI,
    File,
    Form,
    HTTPException,
    UploadFile,
    status,
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, field_validator

# 项目内部模块
from persona_engine import generate_persona

# ---------------------------------------------------------------------------
# 配置
# ---------------------------------------------------------------------------

MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024   # 10 MB / 文件
ALLOWED_EXTENSIONS = {".json", ".txt", ".jpg", ".jpeg", ".png", ".webp"}
ALLOWED_MIME_TYPES = {
    "application/json",
    "text/plain",
    "image/jpeg",
    "image/png",
    "image/webp",
}
FRONTEND_ORIGIN = "http://localhost:5173"

# 日志配置
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
)
logger = logging.getLogger("twinbuddy")

# ---------------------------------------------------------------------------
# FastAPI 应用
# ---------------------------------------------------------------------------

app = FastAPI(
    title="TwinBuddy Persona API",
    description="孪生搭子 Hackathon MVP — 五层 Persona 生成服务",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS — 允许前端 localhost:5173
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_ORIGIN, "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# 请求 / 响应模型
# ---------------------------------------------------------------------------


class GenerateAvatarRequest(BaseModel):
    """结构化请求体（备用，支持 JSON 直传）"""
    mbti: str = Field(..., min_length=3, max_length=6, description="MBTI 类型，如 INTJ")
    bio: str = Field("", max_length=5000, description="用户自我介绍文本")
    chat_logs: str = Field("", max_length=500_000, description="聊天记录原始文本")

    @field_validator("mbti")
    @classmethod
    def normalize_mbti(cls, v: str) -> str:
        return v.strip().upper()

    @field_validator("bio", "chat_logs")
    @classmethod
    def strip_text(cls, v: str) -> str:
        return v.strip()


class PersonaResponse(BaseModel):
    """统一响应结构"""
    success: bool
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    meta: Optional[Dict[str, Any]] = None


# ---------------------------------------------------------------------------
# 辅助函数
# ---------------------------------------------------------------------------


def _validate_file(file: UploadFile) -> None:
    """验证单个上传文件：大小 + MIME 类型（无副作用）"""
    # 读取文件头判断大小（不读取全部内容避免浪费内存）
    chunk = file.file.read(512)
    file.file.seek(0)  # 重置游标

    if not chunk:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"文件 '{file.filename}' 为空",
        )

    content_start = chunk[:32]
    if (
        file.content_type not in ALLOWED_MIME_TYPES
        and not any(content_start.startswith(b) for b in [b"{", b"["])
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"文件 '{file.filename}' 类型 '{file.content_type}' 不在白名单内。"
                f"允许: {sorted(ALLOWED_MIME_TYPES)}"
            ),
        )


def _read_file_safely(file: UploadFile) -> str:
    """安全读取文本文件内容（异步友好）"""
    try:
        content_bytes = file.file.read()
        if len(content_bytes) > MAX_FILE_SIZE_BYTES:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"'{file.filename}' 超过 {MAX_FILE_SIZE_BYTES // 1024 // 1024}MB 限制",
            )
        return content_bytes.decode("utf-8", errors="replace")
    except UnicodeDecodeError:
        # 二进制文件（非文本）返回空字符串，前端应传 TXT/JSON
        logger.warning("无法将 '%s' 解码为 UTF-8，已跳过文本解析", file.filename)
        return ""


def _parse_json_safely(content: str, filename: str) -> Dict[str, Any]:
    """安全解析 JSON，失败返回空 dict（不抛异常）"""
    try:
        return json.loads(content)
    except json.JSONDecodeError as e:
        logger.warning("'%s' JSON 解析失败: %s，已降级为空字典", filename, e)
        return {}


async def _collect_form_files(
    mbti_file: Optional[UploadFile] = None,
    bio_file: Optional[UploadFile] = None,
    chat_file: Optional[UploadFile] = None,
    douyin_file: Optional[UploadFile] = None,
    photo_file: Optional[UploadFile] = None,
) -> Dict[str, Any]:
    """
    异步收集所有上传文件并解析内容。
    返回 {"mbti": "...", "bio": "...", "chat_logs": "...", ...}
    """
    async def read_text(f: Optional[UploadFile]) -> str:
        if f is None:
            return ""
        _validate_file(f)
        # 同步读取包装为 run_in_executor（asyncio 不直接支持同步文件 IO）
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, _read_file_safely, f)

    # 并行读取所有文件
    mbti_text, bio_text, chat_text, photo_path = await asyncio.gather(
        read_text(mbti_file),
        read_text(bio_file),
        read_text(chat_file),
        # 图片文件只传路径，不读取内容
        asyncio.to_thread(lambda: photo_file.filename if photo_file else None),
    )

    # 解析抖音 JSON
    douyin_data: Dict[str, Any] = {}
    if douyin_file:
        _validate_file(douyin_file)
        content = await read_text(douyin_file)
        douyin_data = _parse_json_safely(content, douyin_file.filename or "douyin.json")

    return {
        "mbti": mbti_text.strip(),
        "bio": bio_text.strip(),
        "chat_logs": chat_text.strip(),
        "douyin_data": douyin_data,
        "photo_path": photo_path,
    }


def _build_error_response(exc: Exception) -> JSONResponse:
    """将异常转换为统一错误响应"""
    if isinstance(exc, HTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "success": False,
                "error": exc.detail,
                "data": None,
                "meta": None,
            },
        )
    logger.exception("未预期的服务器错误")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "error": "服务器内部错误，请稍后重试",
            "data": None,
            "meta": None,
        },
    )


# ---------------------------------------------------------------------------
# 路由
# ---------------------------------------------------------------------------


@app.get("/health", tags=["系统"])
async def health_check() -> Dict[str, Any]:
    """
    健康检查接口
    返回服务器状态、版本、当前时间（UTC）
    """
    return {
        "status": "healthy",
        "service": "TwinBuddy Persona API",
        "version": "1.0.0",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "uptime": "ok",
    }


@app.post("/generate_avatar", response_model=PersonaResponse, tags=["Avatar"])
async def generate_avatar(
    background_tasks: BackgroundTasks,
    # 表单字段（非文件）
    mbti: str = Form(""),
    bio: str = Form(""),
    chat_logs: str = Form(""),
    # 文件上传
    mbti_file: Optional[UploadFile] = File(None),
    bio_file: Optional[UploadFile] = File(None),
    chat_file: Optional[UploadFile] = File(None),
    douyin_file: Optional[UploadFile] = File(None),
    photo_file: Optional[UploadFile] = File(None),
) -> JSONResponse:
    """
    POST /generate_avatar

    多文件上传接口，同时支持表单字段直传。

    文件上传（Form / multipart）：
      - mbti_file     (.txt)       MBTI 测试结果文本
      - bio_file      (.txt)       用户自我介绍
      - chat_file     (.txt)       聊天记录
      - douyin_file   (.json)      抖音导出数据
      - photo_file    (.jpg/.png)  用户照片（可选）

    表单字段直传（Form data）：
      - mbti       MBTI 类型字符串，如 "INTJ"
      - bio        自我介绍文本
      - chat_logs  聊天记录文本

    优先级：文件上传 > 表单字段（若传文件则忽略同名表单字段）

    返回：PersonaResponse
      - success: True 时 data 包含完整五层 Persona JSON
      - success: False 时 error 包含错误信息
    """
    try:
        # Step 1: 收集数据（文件 + 表单）
        file_data = await _collect_form_files(
            mbti_file=mbti_file,
            bio_file=bio_file,
            chat_file=chat_file,
            douyin_file=douyin_file,
            photo_file=photo_file,
        )

        # Step 2: 合并数据（文件优先于表单字段）
        final_mbti = file_data["mbti"] or mbti.strip().upper()
        final_bio = file_data["bio"] or bio.strip()
        final_chat = file_data["chat_logs"] or chat_logs.strip()
        final_douyin = file_data["douyin_data"]
        final_photo = file_data["photo_path"]

        # Step 3: 输入验证
        if not final_mbti:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="MBTI 类型不能为空（通过 mbti 参数或 mbti_file 上传）",
            )

        # MBTI 格式粗验（4字母 + 可选 A/T 后缀）
        mbti_pattern = r"^[IE][NS][TF][JP][AT]?$"
        import re
        if not re.match(mbti_pattern, final_mbti):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"MBTI 类型格式错误：'{final_mbti}'，期望如 INTJ / INFP-A",
            )

        logger.info(
            "收到 Persona 生成请求 | MBTI=%s | bio_len=%d | chat_len=%d | "
            "douyin_keys=%s | photo=%s",
            final_mbti,
            len(final_bio),
            len(final_chat),
            list(final_douyin.keys()),
            final_photo,
        )

        # Step 4: 调用 Persona 引擎（同步 CPU 操作，放入线程池避免阻塞事件循环）
        loop = asyncio.get_event_loop()
        persona = await loop.run_in_executor(
            None,
            lambda: generate_persona(
                mbti=final_mbti,
                bio=final_bio,
                chat_logs=final_chat,
                douyin_data=final_douyin,
                photo_path=final_photo,
            ),
        )

        logger.info(
            "Persona 生成完成 | id=%s | fingerprint=%s | confidence=%.2f",
            persona["persona_id"],
            persona["soul_fingerprint"],
            persona["confidence_score"],
        )

        # Step 5: 返回成功响应
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "success": True,
                "data": persona,
                "error": None,
                "meta": {
                    "request_mbti": final_mbti,
                    "data_sources_count": len(persona["data_sources_used"]),
                    "generated_at": persona["generated_at"],
                },
            },
        )

    except HTTPException:
        raise
    except Exception as exc:  # noqa: BLE001
        return _build_error_response(exc)


# ---------------------------------------------------------------------------
# 启动入口（uvicorn main:app --reload --port 8000）
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
