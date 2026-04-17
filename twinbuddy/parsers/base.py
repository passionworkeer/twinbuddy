#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
MING Parsers — 基类与统一接口
定义所有解析器的抽象基类，保证接口一致性。
"""
from __future__ import annotations

import sys
from abc import ABC, abstractmethod
from typing import Any, Optional

# ── Windows UTF-8 ──────────────────────────────────────────────────────────────
from ._encoding import *  # noqa: F401,F403


class BaseParser(ABC):
    """
    所有数据解析器的抽象基类。

    子类必须实现:
    - detect()   : 自动检测内容格式，返回 bool
    - parse()    : 解析内容，返回结构化 dict
    - extract_for_persona() : 提取用于 Persona 的字段

    设计原则:
    - 错误容忍：格式不完整时尽可能提取可用信息
    - 返回一致性：extract_for_persona() 输出字段尽量对齐
    - 自动检测：detect() 决定是否处理此文件/内容
    """

    # 解析器名称，供日志/调试用
    name: str = "BaseParser"

    # 置信度（0.0–1.0），用于 fusion 时冲突处理
    confidence: float = 0.5

    def detect(self, content: str | bytes) -> bool:
        """
        自动检测 content 是否属于本解析器处理的格式。

        Args:
            content: 原始文本内容或二进制数据（bytes 时需先解码）

        Returns:
            True 表示本解析器可处理此内容
        """
        if isinstance(content, bytes):
            try:
                content = content.decode("utf-8", errors="ignore")
            except Exception:
                return False
        return self._detect(content)

    @abstractmethod
    def _detect(self, text: str) -> bool:
        """子类实现的格式检测逻辑。"""
        ...

    def parse(self, content: str | bytes) -> dict:
        """
        将 content 解析为结构化数据。

        Args:
            content: 原始文本或二进制数据

        Returns:
            dict，结构由子类定义；出错时返回 {"error": "...", "partial": bool}
        """
        if isinstance(content, bytes):
            try:
                content = content.decode("utf-8", errors="ignore")
            except Exception as e:
                return {"error": f"解码失败: {e}", "partial": False}
        try:
            return self._parse(content)
        except Exception as e:
            return {"error": str(e), "partial": True}

    @abstractmethod
    def _parse(self, text: str) -> dict:
        """子类实现的解析逻辑。"""
        ...

    def extract_for_persona(self, parsed: dict) -> dict:
        """
        从 parse() 的结果中提取用于 Persona 画像的字段。

        返回字段应尽量对齐 fusion.py 的合并接口:
        {
            "source": str,          # 解析器名称
            "confidence": float,    # 本次提取的置信度
            "raw": dict,            # 原始解析结果（供 fusion 参考）
            ...  # 各解析器特有的 persona 字段
        }
        """
        result = {
            "source": self.name,
            "confidence": self.confidence,
            "raw": parsed,
        }
        result.update(self._extract_fields(parsed))
        return result

    @abstractmethod
    def _extract_fields(self, parsed: dict) -> dict:
        """子类实现的 persona 字段提取。"""
        ...

    def process(self, content: str | bytes | dict) -> dict:
        """
        便捷方法：依次执行 detect → parse → extract_for_persona。
        出错时返回空结果而非抛出异常。
        支持 dict 输入（直接跳过多余的 JSON 序列化/反序列化）。
        """
        # 内部存储原始内容（str）
        _content: str
        _raw: dict | None = None

        if isinstance(content, dict):
            _raw = content
            _content = ""  # detect/parse 由子类用 _raw 处理
        elif isinstance(content, bytes):
            try:
                _content = content.decode("utf-8", errors="ignore")
            except Exception:
                return {"error": f"{self.name}: bytes 解码失败", "persona": None}
        else:
            _content = content

        # detect: dict 时直接传给 _detect 处理
        if not self.detect(_content if _raw is None else _raw):
            return {"error": f"{self.name}: 格式不匹配", "persona": None}

        # parse: dict 时直接传给 _parse 处理
        if _raw is not None:
            parsed = self._parse_dict(_raw)
        else:
            parsed = self.parse(_content)

        if "error" in parsed and not parsed.get("partial"):
            return {"error": parsed["error"], "persona": None}
        persona = self.extract_for_persona(parsed)
        return {"persona": persona}

    def _parse_dict(self, data: dict) -> dict:
        """子类可覆盖：处理 dict 输入（避免 JSON 序列化/反序列化）。"""
        try:
            import json
            text = json.dumps(data, ensure_ascii=False)
        except Exception:
            return {"error": "无法序列化 dict", "partial": False}
        return self._parse(text)

    def __repr__(self) -> str:
        return f"<{self.name} confidence={self.confidence}>"
