# -*- coding: utf-8 -*-
"""
TwinBuddy 数据隔离层 — 隐私优先架构
"""
from __future__ import annotations
import hashlib, json, shutil, time, uuid, re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, Optional

DEFAULT_STORAGE_ROOT = Path("./user_data")

@dataclass
class UserSession:
    user_id: str
    session_key: str
    created_at: float
    persona_path: str
    uploads_dir: str
    failed_attempts: int = 0
    locked_until: float = 0.0

    def fingerprint(self, *raw_data: str) -> str:
        h = hashlib.sha256()
        for item in raw_data:
            h.update(str(item).encode("utf-8"))
        return h.hexdigest()[:32]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "user_id": self.user_id,
            "session_key": self.session_key,
            "created_at": self.created_at,
            "created_at_iso": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(self.created_at)),
            "persona_path": self.persona_path,
            "uploads_dir": self.uploads_dir,
            "locked": self.locked_until > time.time(),
        }

class DataIsolation:
    MAX_FAILED_ATTEMPTS = 5
    LOCK_DURATION = 300.0

    def __init__(self, storage_root: str | Path = DEFAULT_STORAGE_ROOT, session_ttl_seconds: float = 86400.0):
        self.storage_root = Path(storage_root)
        self.storage_root.mkdir(exist_ok=True, parents=True)
        self._sessions: Dict[str, UserSession] = {}
        self.session_ttl = session_ttl_seconds

    def create_user(self) -> UserSession:
        user_id = str(uuid.uuid4())
        user_dir = self.storage_root / user_id
        user_dir.mkdir(exist_ok=True, parents=True)
        session = UserSession(
            user_id=user_id,
            session_key=uuid.uuid4().hex[:32],
            created_at=time.time(),
            persona_path=str(user_dir / "persona.json"),
            uploads_dir=str(user_dir / "uploads"),
        )
        Path(session.uploads_dir).mkdir(exist_ok=True, parents=True)
        self._sessions[user_id] = session
        return session

    def get_session(self, user_id: str) -> Optional[UserSession]:
        session = self._sessions.get(user_id)
        if session is None: return None
        if time.time() - session.created_at > self.session_ttl:
            self.wipe(session)
            return None
        return session

    def get_or_create_session(self, user_id: Optional[str] = None) -> UserSession:
        if user_id:
            existing = self.get_session(user_id)
            if existing: return existing
        return self.create_user()

    def verify_session_key(self, user_id: str, session_key: str) -> tuple[bool, Optional[UserSession]]:
        session = self._sessions.get(user_id)
        if session is None: return False, None
        if time.time() < session.locked_until: return False, None
        if session.session_key != session_key:
            session.failed_attempts += 1
            if session.failed_attempts >= self.MAX_FAILED_ATTEMPTS:
                session.locked_until = time.time() + self.LOCK_DURATION
                session.failed_attempts = 0
            return False, None
        session.failed_attempts = 0
        return True, session

    def store_persona(self, session: UserSession, persona: Dict[str, Any]) -> str:
        p = Path(session.persona_path)
        p.write_text(json.dumps(persona, ensure_ascii=False, indent=2), encoding="utf-8")
        return session.persona_path

    def load_persona(self, session: UserSession) -> Optional[Dict[str, Any]]:
        p = Path(session.persona_path)
        if not p.exists(): return None
        return json.loads(p.read_text(encoding="utf-8"))

    def store_upload(self, session: UserSession, filename: str, content: bytes, subfolder: str = "") -> str:
        safe_name = self._sanitize_filename(filename)
        base = Path(session.uploads_dir)
        if subfolder: base = base / subfolder
        base.mkdir(exist_ok=True, parents=True)
        file_path = base / safe_name
        file_path.write_bytes(content)
        return str(file_path)

    def purge_uploads(self, session: UserSession) -> int:
        uploads = Path(session.uploads_dir)
        if not uploads.exists(): return 0
        files = [f for f in uploads.rglob("*") if f.is_file()]
        for f in files: f.unlink()
        return len(files)

    def wipe(self, session: UserSession) -> Dict[str, Any]:
        user_dir = Path(session.persona_path).parent
        deleted_files = []
        if user_dir.exists():
            for f in user_dir.rglob("*"):
                if f.is_file():
                    deleted_files.append(str(f))
                    f.unlink()
            shutil.rmtree(str(user_dir), ignore_errors=True)
        self._sessions.pop(session.user_id, None)
        return {"user_id": session.user_id, "deleted_files": deleted_files, "total_files": len(deleted_files), "wiped_at": time.time()}

    @staticmethod
    def _sanitize_filename(raw: str) -> str:
        name = re.sub(r"[^\w\-.]", "_", raw)
        name = re.sub(r"__+", "_", name)
        return name.strip("_") or "unnamed"

    def get_storage_stats(self) -> Dict[str, Any]:
        total_users = len(list(self.storage_root.iterdir()))
        total_size = sum(f.stat().st_size for f in self.storage_root.rglob("*") if f.is_file())
        return {"storage_root": str(self.storage_root), "total_users": total_users, "total_bytes": total_size, "total_mb": round(total_size/1024/1024, 2)}

_isolation_instance: Optional[DataIsolation] = None

def get_isolation(storage_root: str = "./user_data") -> DataIsolation:
    global _isolation_instance
    if _isolation_instance is None:
        _isolation_instance = DataIsolation(storage_root=Path(storage_root))
    return _isolation_instance
