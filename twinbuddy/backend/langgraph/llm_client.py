"""
llm_client.py — MiniMax LLM 客户端（双 Key 自动切换）

用法：
    from llm_client import llm_client
    text = llm_client.chat("你是谁？")
"""
from __future__ import annotations

import json
import os
import time
import logging
from typing import Any, Dict, List, Optional

import httpx

logger = logging.getLogger("twinbuddy.llm")

# ── Key 配置 ────────────────────────────────────────────────────────────────

def _load_keys():
    """从环境变量加载 MiniMax Key，忽略源码中的任何占位值。"""
    raw_keys = [
        os.environ.get("MINIMAX_API_KEY", ""),
        os.environ.get("MINIMAX_API_KEY_1", ""),
        os.environ.get("MINIMAX_API_KEY_2", ""),
    ]
    # 过滤掉空字符串和明显的占位符
    # MiniMax 真实 key 格式: sk-cp-xxxxxxxx，允许通过
    # 占位符特征: sk- 后面紧跟很短的内容（如 sk-test、sk-placeholder）
    valid = [
        k for k in raw_keys
        if k and not (
            k.startswith("sk-")
            and len(k) < 30  # MiniMax key 长度 > 30
        )
    ]
    if not valid:
        import warnings
        warnings.warn(
            "MINIMAX_API_KEY / MINIMAX_API_KEY_1 / MINIMAX_API_KEY_2 "
            "均未设置或使用了占位符。LLM 调用将会失败，请设置真实 Key。",
            UserWarning,
        )
        return []
    return valid


_KEYS = _load_keys()
_BASE_URL = "https://api.minimax.chat"
_MODEL = "MiniMax-M2.7"

# ── 全局状态 ────────────────────────────────────────────────────────────────

_current_key_idx = 0  # 当前使用的 key 索引


def _get_headers(api_key: str) -> Dict[str, str]:
    return {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }


def _call_api(payload: Dict[str, Any], api_key: str) -> Dict[str, Any]:
    """用指定 key 调用 MiniMax Chat API（同步版本）"""
    with httpx.Client(timeout=60.0) as client:
        resp = client.post(
            f"{_BASE_URL}/v1/text/chatcompletion_v2",
            headers=_get_headers(api_key),
            json=payload,
        )
        resp.raise_for_status()
        # 强制用 utf-8 解码原始字节，防止中文乱码
        data = json.loads(resp.content.decode("utf-8"))
        # MiniMax 返回结构：data.choices[0].message.content
        return data


def _extract_content(result: Dict[str, Any]) -> str:
    """从 MiniMax API 响应中提取文本内容"""
    try:
        choices = result.get("choices", [])
        if choices:
            return choices[0].get("message", {}).get("content", "").strip()
        # 兼容其他响应格式
        return result.get("output", "") or result.get("text", "")
    except Exception:
        return ""


# ── 主客户端 ────────────────────────────────────────────────────────────────


class MiniMaxClient:
    """MiniMax LLM 客户端，支持双 Key 自动切换"""

    def __init__(self, model: str = _MODEL, temperature: float = 0.7):
        self.model = model
        self.temperature = temperature
        self._key_idx = 0

    @property
    def _current_key(self) -> str:
        return _KEYS[self._key_idx % len(_KEYS)]

    def _try_call(self, messages: List[Dict[str, str]], try_key_idx: int) -> Dict[str, Any]:
        """用指定索引的 key 尝试调用"""
        key = _KEYS[try_key_idx % len(_KEYS)]
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": self.temperature,
        }
        return _call_api(payload, key)

    def chat(
        self,
        user_message: str,
        system_prompt: Optional[str] = None,
        temperature: Optional[float] = None,
    ) -> str:
        """
        发送对话请求，Key 失效时自动切换到备用 Key。

        Returns:
            模型回复文本（字符串），调用失败返回空字符串。
        """
        messages: List[Dict[str, str]] = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": user_message})

        start = time.time()
        tried = set()

        for _ in range(len(_KEYS)):
            try:
                key_idx = self._key_idx % len(_KEYS)
                if key_idx in tried:
                    break
                tried.add(key_idx)

                result = self._try_call(messages, key_idx)
                content = _extract_content(result)
                elapsed = (time.time() - start) * 1000
                logger.info(
                    "LLM 调用成功 | key=%d | elapsed=%.0fms | model=%s | tokens≈%s",
                    key_idx,
                    elapsed,
                    self.model,
                    result.get("usage", {}).get("total_tokens", "?"),
                )
                return content

            except httpx.HTTPStatusError as exc:
                status = exc.response.status_code
                # 401 / 403 → Key 无效，切换
                if status in (401, 403):
                    logger.warning("Key[%d] 无效 (HTTP %d)，切换备用 Key", key_idx, status)
                    self._key_idx += 1
                    continue
                # 其他 HTTP 错误（429 等）直接抛出
                logger.error("LLM HTTP 错误 | key=%d | status=%d | %s", key_idx, status, exc)
                raise

            except httpx.TimeoutException:
                logger.warning("Key[%d] 请求超时，切换备用 Key", key_idx)
                self._key_idx += 1
                continue

            except Exception as exc:
                logger.error("LLM 调用异常 | key=%d | %s", key_idx, exc)
                raise

        logger.error("所有 MiniMax Key 均失败")
        return ""

    def chat_structured(
        self,
        user_message: str,
        system_prompt: str,
        json_schema: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        结构化输出：要求模型返回 JSON。
        json_schema 为输出格式的 JSON Schema 描述。
        """
        import json

        messages = [
            {"role": "system", "content": system_prompt + "\n\n你必须只返回 JSON，不要包含任何其他文字。"},
            {"role": "user", "content": user_message},
        ]
        raw = self.chat_raw(messages)
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            logger.warning("LLM 返回非 JSON，已返回原文: %s", raw[:200])
            return {"raw": raw}

    def chat_raw(self, messages: List[Dict[str, str]]) -> str:
        """直接发送消息列表，返回原始文本（复用 Key 切换逻辑）"""
        start = time.time()
        tried = set()

        for _ in range(len(_KEYS)):
            try:
                key_idx = self._key_idx % len(_KEYS)
                if key_idx in tried:
                    break
                tried.add(key_idx)

                result = self._try_call(messages, key_idx)
                content = _extract_content(result)
                elapsed = (time.time() - start) * 1000
                logger.info(
                    "LLM raw 调用成功 | key=%d | elapsed=%.0fms",
                    key_idx,
                    elapsed,
                )
                return content

            except httpx.HTTPStatusError as exc:
                if exc.response.status_code in (401, 403):
                    logger.warning("Key[%d] 无效，切换备用 Key", key_idx)
                    self._key_idx += 1
                    continue
                raise
            except httpx.TimeoutException:
                logger.warning("Key[%d] 超时，切换备用 Key", key_idx)
                self._key_idx += 1
                continue
            except Exception:
                raise

        return ""


# ── 全局单例 ────────────────────────────────────────────────────────────────

llm_client = MiniMaxClient(temperature=0.7)


# ── 便捷函数 ────────────────────────────────────────────────────────────────

def chat(user_message: str, system_prompt: Optional[str] = None) -> str:
    return llm_client.chat(user_message, system_prompt)


def chat_structured(
    user_message: str,
    system_prompt: str,
    json_schema: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    return llm_client.chat_structured(user_message, system_prompt, json_schema)
