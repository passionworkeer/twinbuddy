# -*- coding: utf-8 -*-
"""
MING Parsers — Windows UTF-8 初始化
只在首次导入时执行，设置 stdout/stderr 编码。
"""
from __future__ import annotations

import sys

# 防止重复执行
if not getattr(sys, "_ming_utf8_initialized", False):
    if sys.platform == "win32":
        try:
            import io
            # 已包装过则不再重复包装
            if isinstance(sys.stdout, io.TextIOWrapper):
                pass  # 已在别处包装
            else:
                sys.stdout = io.TextIOWrapper(
                    sys.stdout.buffer, encoding="utf-8", errors="replace"
                )
                sys.stderr = io.TextIOWrapper(
                    sys.stderr.buffer, encoding="utf-8", errors="replace"
                )
        except Exception:
            # 在某些测试环境（如 pytest）下 stdout 已被包装，此处静默忽略
            pass
    sys._ming_utf8_initialized = True
