# api/_store.py
"""内存状态持久化（JSON 文件备份）"""
from __future__ import annotations

import json
import threading
from pathlib import Path as _Path
from typing import Any, Dict

_DATA_DIR = _Path(__file__).parent.parent / "data"
_DATA_DIR.mkdir(exist_ok=True)

_ONBOARDING_STORE_FILE = _DATA_DIR / "onboarding_store.json"
_PERSONA_STORE_FILE = _DATA_DIR / "persona_store.json"


def _load_store(path: _Path) -> Dict[str, Dict[str, Any]]:
    if path.exists():
        try:
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {}
    return {}


def _save_store_async(path: _Path, store: Dict[str, Dict[str, Any]]) -> None:
    def _write():
        try:
            with open(path, "w", encoding="utf-8") as f:
                json.dump(store, f, ensure_ascii=False, indent=2)
        except Exception:
            pass
    threading.Thread(target=_write, daemon=True).start()


# 内存状态（从文件恢复，启动时即加载）
_onboarding_store: Dict[str, Dict[str, Any]] = _load_store(_ONBOARDING_STORE_FILE)
_persona_store: Dict[str, Dict[str, Any]] = _load_store(_PERSONA_STORE_FILE)
