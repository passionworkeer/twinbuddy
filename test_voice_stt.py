# -*- coding: utf-8 -*-
"""
test_voice_stt.py — 语音文件批量 STT 测试

用法（本地，需先配置 twinbuddy/.env 中的 iFlytek key）:
    python test_voice_stt.py

用法（服务器，已配置环境变量）:
    python test_voice_stt.py --dir /path/to/voices --limit 5

依赖：
    pip install scipy numpy websockets python-dotenv

iFlytek 免费额度：每月 500 次请求
"""
import argparse
import asyncio
import base64
import io
import json
import logging
import os
import sys
import wave
from pathlib import Path

import numpy as np
from scipy import signal

# ── 日志（必须在 .env 加载前定义）──────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger("test_stt")

# 加载 .env（支持本地开发）
try:
    from dotenv import load_dotenv
    _ENV_PATH = Path(__file__).parent / "twinbuddy" / ".env"
    if _ENV_PATH.exists():
        load_dotenv(_ENV_PATH)
        logger.info("已加载 .env: %s", _ENV_PATH)
    else:
        logger.warning(".env 未找到: %s，将使用系统环境变量", _ENV_PATH)
except ImportError:
    logger.warning("python-dotenv 未安装，环境变量需手动配置")

# ── 参数 ──────────────────────────────────────────────────────────────

VOICE_DIR = Path("D:/hyt/voices")
OUTPUT_FILE = Path("D:/hyt/voices/stt_results.json")

SR_ORIG = 24000   # 微信语音原始采样率
SR_TARGET = 16000  # iFlytek 要求采样率
MAX_DURATION = 60  # 单文件最大秒数（超过跳过）


# ── 重采样 ───────────────────────────────────────────────────────────

def resample_wav(wav_path: Path) -> tuple[bytes, float]:
    """
    读取 wav 文件，重采样到 16kHz，返回 PCM bytes + 时长(秒)。
    """
    with wave.open(str(wav_path), "rb") as wf:
        sr = wf.getframerate()
        n_frames = wf.getnframes()
        pcm = wf.readframes(n_frames)
        duration = n_frames / sr if sr > 0 else 0

    audio = np.frombuffer(pcm, dtype=np.int16).astype(np.float32) / 32768.0

    if sr != SR_TARGET:
        # 24000 -> 16000，比例 2:3
        ratio = SR_TARGET / sr
        n_target = int(len(audio) * ratio)
        audio = signal.resample(audio, n_target)

    pcm_16k = (audio * 32767).astype(np.int16)
    return pcm_16k.tobytes(), len(pcm_16k) / SR_TARGET


# ── iFlytek STT ──────────────────────────────────────────────────────

async def _build_url() -> str:
    import base64, datetime, hashlib, hmac
    from urllib.parse import urlencode

    api_key = os.environ["XFYUN_API_KEY"]
    api_secret = os.environ["XFYUN_API_SECRET"]
    host = "iat-api.xfyun.cn"
    path = "/v2/iat"

    now_utc = datetime.datetime.now(datetime.timezone.utc)
    date_str = now_utc.strftime("%a, %d %b %Y %H:%M:%S GMT")
    sign_str = f"host: {host}\ndate: {date_str}\nGET {path} HTTP/1.1"
    sig_b64 = base64.b64encode(
        hmac.new(api_secret.encode(), sign_str.encode(), hashlib.sha256).digest()
    ).decode()
    auth = f'api_key="{api_key}", algorithm="hmac-sha256", headers="host date request-line", signature="{sig_b64}"'
    auth_b64 = base64.b64encode(auth.encode()).decode()
    params = {"authorization": auth_b64, "date": date_str, "host": host}
    return f"wss://{host}{path}?{urlencode(params)}"


async def _parse_ws_resp(raw: str) -> tuple[str, bool]:
    try:
        d = json.loads(raw)
        if d.get("code") != 0:
            return None, False
        words = []
        for w in d.get("data", {}).get("result", {}).get("ws", []):
            for cw in w.get("cw", []):
                words.extend([x for x in [cw.get("w")] if x])
        return "".join(words), d.get("data", {}).get("result", {}).get("pgs") == "rpl"
    except Exception:
        return None, False


async def stt_once(pcm_bytes: bytes) -> str:
    """单次 STT 调用，返回识别文本。"""
    import websockets

    url = await _build_url()
    app_id = os.environ["XFYUN_APP_ID"]
    FRAME_SIZE = 1280  # 40ms @ 16kHz

    async def send_loop(ws):
        first = True
        for i in range(0, len(pcm_bytes), FRAME_SIZE):
            chunk = pcm_bytes[i : i + FRAME_SIZE]
            frame = {
                "data": {
                    "status": 0 if first else 1,
                    "format": "audio/L16;rate=16000",
                    "encoding": "raw",
                    "audio": base64.b64encode(chunk).decode(),
                }
            }
            if first:
                frame["common"] = {"app_id": app_id}
                frame["business"] = {
                    "language": "zh_cn", "domain": "iat",
                    "accent": "mandarin", "dwa": "wpgs", "ptt": 1,
                }
                first = False
            await ws.send(json.dumps(frame))
            await asyncio.sleep(0.040)

    accumulated: list[str] = []
    is_replace = False

    try:
        async with websockets.connect(url, ping_interval=15) as ws:
            # 发送认证帧
            first = True
            for i in range(0, len(pcm_bytes), FRAME_SIZE):
                chunk = pcm_bytes[i : i + FRAME_SIZE]
                frame = {
                    "data": {
                        "status": 0 if first else 1,
                        "format": "audio/L16;rate=16000",
                        "encoding": "raw",
                        "audio": base64.b64encode(chunk).decode(),
                    }
                }
                if first:
                    frame["common"] = {"app_id": app_id}
                    frame["business"] = {
                        "language": "zh_cn", "domain": "iat",
                        "accent": "mandarin", "dwa": "wpgs", "ptl": 1,
                    }
                    first = False
                await ws.send(json.dumps(frame))
                await asyncio.sleep(0.040)

            # 接收结果
            done = False
            while not done:
                try:
                    resp = await asyncio.wait_for(ws.recv(), timeout=10.0)
                    text, is_rep = await _parse_ws_resp(resp)
                    if text:
                        if is_rep:
                            accumulated.clear()
                        accumulated.append(text)
                    d = json.loads(resp)
                    if d.get("data", {}).get("status") == 2:
                        done = True
                except asyncio.TimeoutError:
                    break

            # 结束帧
            end_frame = {
                "data": {"status": 2, "format": "audio/L16;rate=16000",
                         "encoding": "raw", "audio": ""}
            }
            try:
                await ws.send(json.dumps(end_frame))
            except Exception:
                pass

    except websockets.exceptions.ConnectionClosed as e:
        logger.warning("连接关闭: %s", e)

    return "".join(accumulated)


# ── 批量测试 ─────────────────────────────────────────────────────────

async def test_batch(voice_dir: Path, limit: int = 10) -> list[dict]:
    """测试 voice_dir 下的前 N 个 wav 文件。"""
    wav_files = sorted(voice_dir.glob("*.wav"))
    if not wav_files:
        logger.error("目录下没有 wav 文件: %s", voice_dir)
        return []

    logger.info("找到 %d 个 wav 文件，测试前 %d 个", len(wav_files), limit)
    results = []

    for i, wav_path in enumerate(wav_files[:limit]):
        logger.info("[%d/%d] 处理: %s", i + 1, limit, wav_path.name)

        # 重采样
        try:
            pcm_bytes, duration = resample_wav(wav_path)
        except Exception as e:
            logger.error("  重采样失败: %s", e)
            results.append({"file": wav_path.name, "error": f"resample: {e}"})
            continue

        if duration > MAX_DURATION:
            logger.warning("  跳过（时长 %.1fs > %ds）", duration, MAX_DURATION)
            results.append({"file": wav_path.name, "error": f"too long: {duration:.1f}s"})
            continue

        # STT
        try:
            text = await stt_once(pcm_bytes)
        except KeyError as e:
            logger.error("  iFlytek key 缺失: %s", e)
            logger.error("  请确保环境变量 XFYUN_APP_ID / XFYUN_API_KEY / XFYUN_API_SECRET 已配置")
            break
        except Exception as e:
            logger.error("  STT 失败: %s", e)
            results.append({"file": wav_path.name, "error": str(e), "duration": duration})
            continue

        result = {"file": wav_path.name, "text": text, "duration": duration}
        logger.info("  结果: %s", text[:80] if text else "(空)")
        results.append(result)

    return results


# ── 主入口 ───────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="批量语音 STT 测试")
    parser.add_argument("--dir", type=Path, default=VOICE_DIR, help="语音目录")
    parser.add_argument("--limit", type=int, default=5, help="测试数量")
    parser.add_argument("--output", type=Path, default=OUTPUT_FILE, help="结果输出路径")
    args = parser.parse_args()

    logger.info("测试配置:")
    logger.info("  语音目录: %s", args.dir)
    logger.info("  测试数量: %d", args.limit)
    logger.info("  iFlytek APP_ID: %s", "已配置" if os.environ.get("XFYUN_APP_ID") else "未配置!")
    logger.info("  iFlytek API_KEY: %s", "已配置" if os.environ.get("XFYUN_API_KEY") else "未配置!")

    results = asyncio.run(test_batch(args.dir, args.limit))

    # 保存结果
    with open(args.output, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    logger.info("结果已保存: %s", args.output)

    # 打印摘要
    success = [r for r in results if "text" in r]
    failed = [r for r in results if "error" in r]
    logger.info("完成: 成功=%d 失败=%d", len(success), len(failed))
    for r in success:
        logger.info("  [OK] %s -> %s", r["file"][-30:], r.get("text", "")[:60])


if __name__ == "__main__":
    main()
