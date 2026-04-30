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
_PROFILE_STORE_FILE = _DATA_DIR / "profile_store.json"
_CHAT_STORE_FILE = _DATA_DIR / "chat_store.json"
_MESSAGING_STORE_FILE = _DATA_DIR / "messaging_store.json"
_BLIND_GAME_STORE_FILE = _DATA_DIR / "blind_game_store.json"
_SECURITY_STORE_FILE = _DATA_DIR / "security_store.json"
_TRIP_STORE_FILE = _DATA_DIR / "trip_store.json"
_COMMUNITY_STORE_FILE = _DATA_DIR / "community_store.json"


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
_profile_store: Dict[str, Dict[str, Any]] = _load_store(_PROFILE_STORE_FILE)
_chat_store: Dict[str, Dict[str, Any]] = _load_store(_CHAT_STORE_FILE)
_messaging_store: Dict[str, Dict[str, Any]] = _load_store(_MESSAGING_STORE_FILE)
_blind_game_store: Dict[str, Dict[str, Any]] = _load_store(_BLIND_GAME_STORE_FILE)
_security_store: Dict[str, Dict[str, Any]] = _load_store(_SECURITY_STORE_FILE)
_trip_store: Dict[str, Dict[str, Any]] = _load_store(_TRIP_STORE_FILE)
_community_store: Dict[str, Dict[str, Any]] = _load_store(_COMMUNITY_STORE_FILE)


def save_profile(user_id: str, profile: Dict[str, Any]) -> None:
    _profile_store[user_id] = profile
    _save_store_async(_PROFILE_STORE_FILE, _profile_store)


def get_profile(user_id: str) -> Dict[str, Any] | None:
    return _profile_store.get(user_id)


def save_chat_conversation(conversation_id: str, conversation: Dict[str, Any]) -> None:
    _chat_store[conversation_id] = conversation
    _save_store_async(_CHAT_STORE_FILE, _chat_store)


def get_chat_conversation(conversation_id: str) -> Dict[str, Any] | None:
    return _chat_store.get(conversation_id)


def append_chat_message(conversation_id: str, user_id: str, message: Dict[str, Any]) -> None:
    conversation = _chat_store.setdefault(
        conversation_id,
        {"conversation_id": conversation_id, "user_id": user_id, "messages": []},
    )
    conversation["user_id"] = user_id
    conversation.setdefault("messages", []).append(message)
    _save_store_async(_CHAT_STORE_FILE, _chat_store)


def save_room(room_id: str, room: Dict[str, Any]) -> None:
    _messaging_store[room_id] = room
    _save_store_async(_MESSAGING_STORE_FILE, _messaging_store)


def get_room(room_id: str) -> Dict[str, Any] | None:
    return _messaging_store.get(room_id)


def list_rooms() -> Dict[str, Dict[str, Any]]:
    return _messaging_store


def save_blind_game(game_id: str, game: Dict[str, Any]) -> None:
    _blind_game_store[game_id] = game
    _save_store_async(_BLIND_GAME_STORE_FILE, _blind_game_store)


def get_blind_game(game_id: str) -> Dict[str, Any] | None:
    return _blind_game_store.get(game_id)


def save_security_status(user_id: str, status: Dict[str, Any]) -> None:
    _security_store[user_id] = status
    _save_store_async(_SECURITY_STORE_FILE, _security_store)


def get_security_status(user_id: str) -> Dict[str, Any] | None:
    return _security_store.get(user_id)


def save_trip(trip_id: str, trip: Dict[str, Any]) -> None:
    _trip_store[trip_id] = trip
    _save_store_async(_TRIP_STORE_FILE, _trip_store)


def get_trip(trip_id: str) -> Dict[str, Any] | None:
    return _trip_store.get(trip_id)


def list_trips() -> Dict[str, Dict[str, Any]]:
    return _trip_store


def save_post(post_id: str, post: Dict[str, Any]) -> None:
    _community_store[post_id] = post
    _save_store_async(_COMMUNITY_STORE_FILE, _community_store)


def get_post(post_id: str) -> Dict[str, Any] | None:
    return _community_store.get(post_id)


def list_posts() -> Dict[str, Dict[str, Any]]:
    return _community_store
