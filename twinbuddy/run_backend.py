# -*- coding: utf-8 -*-
"""
run_backend.py - TwinBuddy 后端启动脚本

解决 Python 路径问题，确保 agents 模块可以正确导入。
"""
import sys
from pathlib import Path

# 将 repo root 加入 Python path（agents 在 repo root，不在 twinbuddy 内）
_repo_root = str(Path(__file__).resolve().parent.parent)
_twinbuddy_root = str(Path(__file__).resolve().parent)
if _repo_root not in sys.path:
    sys.path.insert(0, _repo_root)
if _twinbuddy_root not in sys.path:
    sys.path.insert(0, _twinbuddy_root)

# 设置 Windows UTF-8 兼容
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

import os
os.environ.setdefault("PYTHONPATH", _repo_root)

# 启动 uvicorn
import uvicorn

if __name__ == "__main__":
    uvicorn.run(
        "backend.api.frontend_api:router",
        host="0.0.0.0",
        port=8004,
        reload=True,
        reload_dirs=[_repo_root],
    )
