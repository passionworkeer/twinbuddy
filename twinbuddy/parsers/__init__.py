# -*- coding: utf-8 -*-
"""
MING Parsers — 多源数据解析器统一入口
"""
from __future__ import annotations

from .base import BaseParser
from .mbti_parser import MBTIParser
from .chat_parser import ChatParser
from .douyin_parser import DouyinParser
from .fusion import fuse_persona_sources

__all__ = [
    "BaseParser",
    "MBTIParser",
    "ChatParser",
    "DouyinParser",
    "fuse_persona_sources",
]
