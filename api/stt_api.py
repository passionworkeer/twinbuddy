# -*- coding: utf-8 -*-
"""
backend/api/stt_api.py — TwinBuddy 语音转文字 API

提供两个接口：
  1. POST /api/stt/recognize  — 完整音频上传（非流式）
  2. WebSocket /api/stt/ws   — 实时流式识别

WebSocket 协议：
  客户端 → 服务端（binary）：
    - PCM 音频块（16kHz / 16bit / mono，建议 1280 字节 = 40ms）
    - 空 binary 消息：标记音频结束
  服务端 → 客户端（text，JSON）：
    - {"type": "text", "content": "识别文本"}
    - {"type": "done", "text": "完整拼接文本"}
    - {"type": "error", "message": "错误描述"}

环境变量（启动前必须配置）：
  XFYUN_APP_ID      — iFlytek 应用 ID
  XFYUN_API_KEY     — iFlytek API Key
  XFYUN_API_SECRET  — iFlytek API Secret
"""

from __future__ import annotations

import asyncio
import logging
from typing import AsyncGenerator, AsyncIterator

from fastapi import APIRouter, File, HTTPException, UploadFile, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse

from .xfyun_stt import (
    FRAME_SIZE_BYTES,
    stt_from_upload,
    stt_stream,
)

logger = logging.getLogger("twinbuddy.stt")
router = APIRouter(prefix="/api/stt", tags=["语音转文字"])


# ---------------------------------------------------------------------------
# 非流式接口（完整音频一次上传）
# ---------------------------------------------------------------------------

@router.post(
    "/recognize",
    summary="语音识别（完整音频）",
    response_model=dict,
)
async def recognize(
    audio: UploadFile = File(..., description="16kHz / 16bit / mono PCM 音频文件"),
) -> dict:
    """
    接收完整音频文件，返回识别文本。

    适用于短音频（< 60s），如语音消息、录音文件等。
    长音频或需要实时反馈时请使用 WebSocket 接口。

    音频要求：
      - 格式：16kHz / 16bit / mono PCM
      - 编码：raw（无压缩）
      - 时长：建议 < 60s（iFlytek 单次会话限制）

    Returns:
        {
          "success": true,
          "text": "识别结果文本",
          "meta": {"size_bytes": N}
        }
    """
    try:
        audio_bytes = await audio.read()
        audio_size = len(audio_bytes)

        if audio_size == 0:
            raise HTTPException(status_code=400, detail="音频文件为空")

        logger.info("STT recognize 请求 | size=%d bytes | filename=%s", audio_size, audio.filename)

        # 调用 iFlytek 识别
        text = await stt_from_upload(audio_bytes)

        logger.info("STT 识别成功 | text_len=%d", len(text))
        return {
            "success": True,
            "text": text,
            "meta": {"size_bytes": audio_size},
        }

    except HTTPException:
        raise
    except Exception as exc:
        logger.error("STT recognize 失败: %s", exc)
        return {
            "success": False,
            "text": "",
            "error": str(exc),
        }


# ---------------------------------------------------------------------------
# 流式 WebSocket 接口
# ---------------------------------------------------------------------------

@router.websocket(
    "/ws",
    name="stt_websocket",
)
async def stt_websocket(websocket: WebSocket) -> None:
    """
    WebSocket 实时语音识别接口。

    建立连接后：
      1. 客户端持续发送二进制 PCM 音频块（建议 1280 字节 / 40ms）
      2. 服务端实时解析并推送识别结果
      3. 客户端发送空 binary 消息表示音频结束
      4. 服务端推送 {"type": "done"} 后关闭连接

    音频参数：
      - 采样率：16000 Hz
      - 位深：16 bit
      - 声道：mono
      - 推荐帧大小：1280 字节（约 40ms）

    错误处理：
      - 认证失败：发送 {"type": "error", "message": "..."} 后关闭
      - 超时（60s 无数据）：自动关闭连接
      - iFlytek 服务异常：转发错误消息后关闭
    """
    await websocket.accept()

    logger.debug("STT WebSocket 连接已建立 | client=%s", websocket.client)

    class ChunkStream(AsyncIterator[bytes]):
        """
        将 FastAPI WebSocket 转换为 AsyncIterator[bytes]，
        供 stt_stream 消费。

        客户端发送：
          - 非空 binary → 音频数据
          - 空 binary   → 结束标记
        """

        __slots__ = ("_ws", "_ended")

        def __init__(self, ws: WebSocket) -> None:
            self._ws = ws
            self._ended = False

        def __aiter__(self) -> "ChunkStream":
            return self

        async def __anext__(self) -> bytes:
            if self._ended:
                raise StopAsyncIteration

            try:
                data = await asyncio.wait_for(
                    self._ws.receive_bytes(),
                    timeout=60.0,
                )
                # 空消息 = 音频结束信号
                if len(data) == 0:
                    self._ended = True
                    logger.debug("收到空帧，音频流结束")
                    raise StopAsyncIteration
                return data

            except asyncio.TimeoutError:
                logger.warning("WebSocket 接收超时（60s），自动关闭")
                self._ended = True
                raise StopAsyncIteration

    try:
        stream = ChunkStream(websocket)
        accumulated: list[str] = []

        async for text in stt_stream(stream):
            if text:
                accumulated.append(text)
                await websocket.send_json({
                    "type": "text",
                    "content": text,
                })
                logger.debug("推送识别片段 | len=%d", len(text))

        # 发送完成信号
        final_text = "".join(accumulated)
        await websocket.send_json({
            "type": "done",
            "text": final_text,
        })
        logger.info("STT WebSocket 完成 | total_chars=%d", len(final_text))

    except WebSocketDisconnect:
        logger.debug("客户端主动断开 WebSocket")

    except Exception as exc:
        logger.error("STT WebSocket 异常: %s", exc)
        try:
            await websocket.send_json({
                "type": "error",
                "message": str(exc),
            })
        except Exception:
            pass  # 连接可能已断开


# ---------------------------------------------------------------------------
# 健康检查（开发调试用）
# ---------------------------------------------------------------------------

@router.get(
    "/health",
    summary="STT 服务健康检查",
    response_model=dict,
)
async def stt_health() -> dict:
    """
    检查 iFlytek 凭证是否配置正确（不实际调用 API）。

    Returns:
        {
          "status": "configured" | "missing_env",
          "has_app_id": bool,
          "has_api_key": bool,
        }
    """
    import os

    has_app_id = bool(os.environ.get("XFYUN_APP_ID"))
    has_api_key = bool(os.environ.get("XFYUN_API_KEY"))
    has_secret = bool(os.environ.get("XFYUN_API_SECRET"))

    if has_app_id and has_api_key and has_secret:
        return {
            "status": "configured",
            "has_app_id": True,
            "has_api_key": True,
            "has_api_secret": True,
        }
    return {
        "status": "missing_env",
        "has_app_id": has_app_id,
        "has_api_key": has_api_key,
        "has_api_secret": has_secret,
        "required_env": ["XFYUN_APP_ID", "XFYUN_API_KEY", "XFYUN_API_SECRET"],
    }
