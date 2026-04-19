# -*- coding: utf-8 -*-
"""
backend/api/xfyun_stt.py — iFlytek 实时语音转文字 WebSocket 客户端

功能：
  - 生成带有 HMAC-SHA256 签名的 iFlytek iat WebSocket URL
  - 将 16kHz / 16bit / mono PCM 音频流式发送给 iFlytek
  - 实时 yield 识别结果文本

认证（严格遵循 iFlytek 文档）：
  - date 格式：RFC1123（如 "Sat, 19 Apr 2026 12:00:00 GMT"）
  - signString = "host: {host}\\ndate: {date}\\nGET /v2/iat HTTP/1.1"
  - signature   = base64(hmac_sha256(signString, apiSecret))
  - auth_origin = f'api_key="{api_key}", algorithm="hmac-sha256", '
                 f'headers="host date request-line", signature="{signature}"'
  - authorization = base64(auth_origin)

音频参数：
  - 采样率：16000 Hz
  - 位深：16 bit
  - 声道：mono
  - 帧大小：1280 字节（约 40ms @ 16kHz）
  - 最大会话时长：60s

动态纠错（dwa="wpgs"）：
  - pgs="apd"  → 追加模式，持续 append 识别结果
  - pgs="rpl"  → 替换模式，ws[] 包含完整新结果需替换旧结果
  结果解析：ws[].cw[].w 拼接为文本

环境变量：
  XFYUN_APP_ID      — 应用 ID
  XFYUN_API_KEY     — API Key
  XFYUN_API_SECRET  — API Secret
"""

from __future__ import annotations

import asyncio
import base64
import hashlib
import hmac
import json
import logging
import os
from datetime import datetime, timezone
from typing import AsyncGenerator, AsyncIterator, Optional

import websockets

logger = logging.getLogger("twinbuddy.xfyun_stt")

# ---------------------------------------------------------------------------
# 常量
# ---------------------------------------------------------------------------

_IFLYTEK_HOST = "iat-api.xfyun.cn"
_IFLYTEK_PATH = "/v2/iat"
_WSS_URL = f"wss://{_IFLYTEK_HOST}{_IFLYTEK_PATH}"

# 音频帧参数（16kHz / 16bit / mono）
AUDIO_SAMPLE_RATE = 16000
AUDIO_BYTES_PER_SAMPLE = 2  # 16bit
AUDIO_CHANNELS = 1
FRAME_SIZE_BYTES = 1280  # ~40ms of audio
FRAME_DURATION_MS = (FRAME_SIZE_BYTES // (AUDIO_BYTES_PER_SAMPLE * AUDIO_CHANNELS)) / (AUDIO_SAMPLE_RATE / 1000)

# 业务参数
_BUSINESS_PARAMS = {
    "language": "zh_cn",
    "domain": "iat",
    "accent": "mandarin",
    "dwa": "wpgs",  # 动态纠错：实时修正识别结果
    "ptt": 1,       # 标点注入
}


# ---------------------------------------------------------------------------
# 认证
# ---------------------------------------------------------------------------

def _build_auth_url() -> str:
    """
    生成带 HMAC-SHA256 签名的 iFlytek iat WebSocket URL。

    签名步骤（严格按 iFlytek 文档）：
      1. date = UTC now, RFC1123 format
      2. signString = "host: {host}\\ndate: {date}\\nGET /v2/iat HTTP/1.1"
      3. signature = base64(hmac_sha256(signString, apiSecret))
      4. auth_origin 包含 api_key + algorithm + headers + signature
      5. authorization = base64(auth_origin)
      6. 最终 URL 带 authorization / date / host query params
    """
    api_key = os.environ.get("XFYUN_API_KEY", "")
    api_secret = os.environ.get("XFYUN_API_SECRET", "")

    if not api_key or not api_secret:
        raise EnvironmentError(
            "XFYUN_API_KEY and XFYUN_API_SECRET environment variables are required"
        )

    # Step 1: RFC1123 date in UTC
    now_utc = datetime.now(timezone.utc)
    date_str = now_utc.strftime("%a, %d %b %Y %H:%M:%S GMT")

    # Step 2: Canonical string to sign
    # 注意：host 小写，路径 /v2/iat，HTTP/1.1（注意空格）
    sign_string = f"host: {_IFLYTEK_HOST}\ndate: {date_str}\nGET /v2/iat HTTP/1.1"

    # Step 3: HMAC-SHA256 signature
    signature_bytes = hmac.new(
        api_secret.encode("utf-8"),
        sign_string.encode("utf-8"),
        hashlib.sha256,
    ).digest()
    signature_b64 = base64.b64encode(signature_bytes).decode("utf-8")

    # Step 4: Auth origin string
    auth_origin = (
        f'api_key="{api_key}", '
        f'algorithm="hmac-sha256", '
        f'headers="host date request-line", '
        f'signature="{signature_b64}"'
    )

    # Step 5: Authorization header value (base64 of auth_origin)
    authorization_b64 = base64.b64encode(auth_origin.encode("utf-8")).decode("utf-8")

    # Step 6: Build full URL with query params
    from urllib.parse import urlencode
    params = {
        "authorization": authorization_b64,
        "date": date_str,
        "host": _IFLYTEK_HOST,
    }
    return f"{_WSS_URL}?{urlencode(params)}"


async def generate_auth_url() -> str:
    """
    异步封装：生成带签名的 WebSocket URL。

    Returns:
        完整 wss:// URL，包含 authorization / date / host query params
    """
    return _build_auth_url()


# ---------------------------------------------------------------------------
# 结果解析
# ---------------------------------------------------------------------------

def _parse_result(resp_data: dict) -> tuple[Optional[str], bool]:
    """
    从 iFlytek 响应中解析识别文本。

    响应结构：
      {
        "code": 0,
        "data": {
          "result": {
            "pgs": "apd" | "rpl",   # append or replace
            "ws": [
              {"cw": [{"w": "词1"}]},
              {"cw": [{"w": "词2"}]},
            ]
          },
          "status": 0 | 1 | 2   # 0=开始, 1=中间, 2=结束
        }
      }

    当 pgs="rpl" 时，ws[] 包含完整的新文本（需替换旧结果），
    不只是差异部分。返回 (完整文本, True)。

    Returns:
        (拼接后的中文文本, 是否为替换模式)  失败时 (None, False)
    """
    try:
        if resp_data.get("code") != 0:
            code = resp_data.get("code")
            message = resp_data.get("message", "")
            logger.warning("iFlytek 返回错误 code=%d message=%s", code, message)
            return None, False

        result = resp_data.get("data", {}).get("result", {})
        ws_list: list = result.get("ws", [])

        if not ws_list:
            return None, False

        # 判断是否为替换模式（iFlytek 动态纠错时收到完整新结果）
        pgs = result.get("pgs", "apd")
        is_replace = pgs == "rpl"

        # 提取所有词
        words: list[str] = []
        for w in ws_list:
            for cw in w.get("cw", []):
                word = cw.get("w", "")
                if word:
                    words.append(word)

        return "".join(words), is_replace

    except Exception as exc:
        logger.debug("解析 iFlytek 响应失败: %s", exc)
        return None, False


# ---------------------------------------------------------------------------
# 核心流式识别
# ---------------------------------------------------------------------------

async def stt_stream(
    audio_chunks: AsyncIterator[bytes],
) -> AsyncGenerator[tuple[str, bool], None]:
    """
    将音频块流发送给 iFlytek，实时 yield 识别结果文本。

    工作流程：
      1. 建立 WebSocket 连接（带 HMAC 签名认证）
      2. 发送第一个帧（包含 common + business + data）
      3. 等待并检查认证响应
      4. 逐帧发送音频（status=1）
      5. 实时解析并 yield 识别结果（text, is_replace）
      6. 发送结束帧（status=2）
      7. 接收残余结果后关闭

    Args:
        audio_chunks: 异步迭代器，每次 yield 一个 PCM 音频块（1280 字节）

    Yields:
        (str, bool): 识别文本 + 是否为替换模式（pgs="rpl" 时为 True，
                     调用方应替换累积结果而非追加）
    """
    url = _build_auth_url()
    app_id = os.environ.get("XFYUN_APP_ID", "")

    async with websockets.connect(url, ping_interval=15) as ws:
        logger.debug("iFlytek WebSocket 连接已建立")

        # ── Send first frame with auth + params, validate first response ─────────
        first_frame = {
            "common": {"app_id": app_id},
            "business": dict(_BUSINESS_PARAMS),
            "data": {
                "status": 0,
                "format": "audio/L16;rate=16000",
                "encoding": "raw",
                "audio": "",
            },
        }
        await ws.send(json.dumps(first_frame))
        logger.debug("第一帧已发送，等待认证响应")

        # Validate first response before proceeding
        try:
            first_resp_raw = await asyncio.wait_for(ws.recv(), timeout=5.0)
            first_resp = json.loads(first_resp_raw)
            first_code = first_resp.get("code")
            if first_code != 0:
                raise RuntimeError(
                    f"iFlytek 拒绝请求: code={first_code} msg={first_resp.get('message', '')}"
                )
            logger.debug("iFlytek 认证成功，开始流式识别")
        except asyncio.TimeoutError:
            raise RuntimeError("iFlytek 认证响应超时（5s），请检查网络或 API 密钥")
        except websockets.exceptions.ConnectionClosed:
            raise RuntimeError("iFlytek 连接在认证阶段关闭")

        # ── Concurrent audio send + result receive ───────────────────────────────
        # iFlytek expects continuous audio at ~40ms intervals.
        # Decouple sending from receiving using a queue.

        result_queue: asyncio.Queue[tuple[str, bool]] = asyncio.Queue()
        send_done = asyncio.Event()

        async def _send_loop() -> None:
            status = 0
            try:
                async for chunk in audio_chunks:
                    if status == 0:
                        status = 1
                    frame = {
                        "data": {
                            "status": status,
                            "format": "audio/L16;rate=16000",
                            "encoding": "raw",
                            "audio": base64.b64encode(chunk).decode("utf-8"),
                        }
                    }
                    await asyncio.sleep(0.040)
                    await ws.send(json.dumps(frame))
            except StopAsyncIteration:
                pass
            except websockets.exceptions.ConnectionClosed:
                pass
            finally:
                send_done.set()
                logger.debug("音频发送线程结束")

        async def _recv_loop() -> None:
            while not send_done.is_set():
                try:
                    resp = await asyncio.wait_for(ws.recv(), timeout=5.0)
                    resp_data = json.loads(resp)
                    text, is_replace = _parse_result(resp_data)
                    if text:
                        await result_queue.put((text, is_replace))
                    if resp_data.get("data", {}).get("status") == 2:
                        logger.debug("收到 iFlytek 结束帧")
                        break
                except asyncio.TimeoutError:
                    continue
                except (websockets.exceptions.ConnectionClosedOK,
                        websockets.exceptions.ConnectionClosed):
                    break

        send_task = asyncio.create_task(_send_loop())

        try:
            await _recv_loop()
        finally:
            send_task.cancel()
            try:
                await send_task
            except asyncio.CancelledError:
                pass

        # Drain results from queue
        while not result_queue.empty():
            try:
                text, is_replace = result_queue.get_nowait()
                yield text, is_replace
            except asyncio.QueueEmpty:
                break

        # ── Send end frame + receive trailing results ──────────────────────────────
        end_frame = {
            "data": {
                "status": 2,
                "format": "audio/L16;rate=16000",
                "encoding": "raw",
                "audio": "",
            }
        }
        try:
            await ws.send(json.dumps(end_frame))
            logger.debug("结束帧已发送")
        except websockets.exceptions.ConnectionClosed:
            logger.debug("结束帧未发送（连接已关闭）")

        # Receive trailing results (last batch from iFlytek)
        try:
            while True:
                resp = await asyncio.wait_for(ws.recv(), timeout=3.0)
                resp_data = json.loads(resp)
                text, _ = _parse_result(resp_data)
                if text:
                    yield text, False
                if resp_data.get("data", {}).get("status") == 2:
                    break
        except asyncio.TimeoutError:
            logger.debug("残余结果接收完成（超时）")
        except (websockets.exceptions.ConnectionClosedOK,
               websockets.exceptions.ConnectionClosed):
            logger.debug("iFlytek WebSocket 关闭")

    logger.debug("iFlytek WebSocket 连接已关闭")


# ---------------------------------------------------------------------------
# 便捷封装：从完整音频 bytes → 字符串
# ---------------------------------------------------------------------------

async def stt_stream_from_bytes(
    audio_data: bytes,
    frame_size: int = FRAME_SIZE_BYTES,
) -> str:
    """
    将完整音频 bytes 转为文字（简化接口，适用于 < 60s 音频）。

    将 audio_data 切分为固定大小的帧，通过内部 async 生成器传递给 stt_stream。

    Args:
        audio_data: 完整 16kHz / 16bit / mono PCM 数据
        frame_size: 每帧字节数，默认 1280（约 40ms）

    Returns:
        完整识别文本（所有片段拼接，pgs="rpl" 替换模式下自动去重）
    """
    async def chunk_gen() -> AsyncGenerator[bytes, None]:
        for i in range(0, len(audio_data), frame_size):
            yield audio_data[i : i + frame_size]

    # 累积文本，遇到 pgs="rpl" 替换模式时替换
    accumulated: list[str] = []
    async for text, is_replace in stt_stream(chunk_gen()):
        if is_replace:
            accumulated.clear()
        accumulated.append(text)

    return "".join(accumulated)


# ---------------------------------------------------------------------------
# 同步封装（用于 FastAPI 中直接处理 UploadFile）
# ---------------------------------------------------------------------------

async def stt_from_upload(audio_bytes: bytes) -> str:
    """
    FastAPI 端点可直接调用的接口。

    接收完整音频字节，返回识别字符串。
    等价于 stt_stream_from_bytes，但错误处理更完善。
    """
    try:
        return await stt_stream_from_bytes(audio_bytes)
    except Exception as exc:
        logger.error("stt_from_upload 失败: %s", exc)
        raise
