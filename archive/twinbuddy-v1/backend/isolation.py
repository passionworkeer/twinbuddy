# -*- coding: utf-8 -*-
"""
TwinBuddy 数据隔离层 — 隐私优先架构

每个用户的 Persona 数据必须严格隔离：
- user_id 基于 session UUID 生成，不收集手机号/微信等实名信息
- 文件上传后立即分配 user_id，所有存储路径包含 user_id 前缀
- 数据不跨用户共享
- 用户可随时通过 wipe() 删除自己的所有数据

核心原则：
  1. 匿名化 — user_id 与用户真实身份无关联
  2. 隔离存储 — 每个用户的数据在文件系统层面完全隔离
  3. 可清除性 — DELETE /user 可以物理删除该用户所有数据
  4. 不可逆指纹 — 原始敏感数据生成哈希指纹后即丢弃，不保留副本
"""

from __future__ import annotations

import hashlib
import json
import shutil
import time
import uuid
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, Optional

# ---------------------------------------------------------------------------
# 配置
# ---------------------------------------------------------------------------

DEFAULT_STORAGE_ROOT = Path("./user_data")


# ---------------------------------------------------------------------------
# 数据模型
# ---------------------------------------------------------------------------


@dataclass
class UserSession:
    """
    单一用户会话的元数据容器。

    注意：本对象仅存储 session 层面的元信息，
    不包含任何可识别个人身份的数据（手机、微信等）。

    安全字段：
      - failed_attempts  连续验证失败次数（达上限后 account locked）
      - locked_until     若锁定，为锁定的 Unix 时间戳截止值
    """

    user_id: str               # 匿名 UUID，不对应任何真实身份
    session_key: str           # 一次性 session token（32位 hex）
    created_at: float          # Unix 时间戳
    persona_path: str          # 隔离的 persona.json 路径
    uploads_dir: str           # 上传文件隔离目录
    failed_attempts: int = 0   # 连续验证失败次数（防暴力破解）
    locked_until: float = 0.0  # 账户锁定截止时间戳（0 表示未锁定）

    def fingerprint(self, *raw_data: str) -> str:
        """
        从任意原始数据生成不可逆 SHA-256 指纹。

        用于：当需要将多个数据源关联到同一用户、
        但又不能保存原始数据时。
        例如：email + 设备ID → 匿名指纹

        返回值：32字符 hex 字符串，不存储原始输入。
        """
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


# ---------------------------------------------------------------------------
# 核心隔离逻辑
# ---------------------------------------------------------------------------


class DataIsolation:
    """
    数据隔离核心引擎。

    设计要点：
    - 所有存储路径包含 user_id 子目录前缀，确保物理隔离
    - persona.json 和上传文件分离存储（上传文件仅作临时处理，
      生成完 Persona 后应立即删除原始文件）
    - session_key 有效期默认为 24 小时，可扩展

    使用示例：
        di = DataIsolation(storage_root="./user_data")
        session = di.create_user()
        di.store_persona(session, persona_data)
        di.store_upload(session, file_bytes, "photo.jpg")
        di.wipe(session)   # 一键清除所有数据
    """

    MAX_FAILED_ATTEMPTS = 5   # 连续验证失败上限
    LOCK_DURATION = 300.0     # 锁定持续时间（秒），5分钟

    def __init__(
        self,
        storage_root: str | Path = DEFAULT_STORAGE_ROOT,
        session_ttl_seconds: float = 86_400.0,
    ) -> None:
        self.storage_root = Path(storage_root)
        self.storage_root.mkdir(exist_ok=True, parents=True)
        self._sessions: Dict[str, UserSession] = {}   # in-memory session registry
        self.session_ttl = session_ttl_seconds

    # ── Session 管理 ────────────────────────────────────────────────────────

    def create_user(self) -> UserSession:
        """
        创建匿名用户会话。

        流程：
        1. 生成随机 UUID 作为 user_id（与真实身份无关联）
        2. 创建 user_id 子目录
        3. 生成一次性 session_key（32位 hex）
        4. 记录创建时间戳

        返回：
            UserSession 对象（ caller 应在请求结束时保留 user_id 用于后续操作）
        """
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

        # 创建上传目录
        Path(session.uploads_dir).mkdir(exist_ok=True, parents=True)

        self._sessions[user_id] = session
        return session

    def get_session(self, user_id: str) -> Optional[UserSession]:
        """根据 user_id 读取会话（带 TTL 校验）"""
        session = self._sessions.get(user_id)
        if session is None:
            return None
        if time.time() - session.created_at > self.session_ttl:
            self.wipe(session)
            return None
        return session

    def get_or_create_session(self, user_id: Optional[str] = None) -> UserSession:
        """
        获取现有会话（若 user_id 有效且未过期），
        否则创建新的匿名会话。
        """
        if user_id:
            existing = self.get_session(user_id)
            if existing:
                return existing
        return self.create_user()

    def verify_session_key(self, user_id: str, session_key: str) -> tuple[bool, Optional[UserSession]]:
        """
        验证 session_key 是否与 user_id 对应的会话匹配。

        安全特性：
          - 连续失败 MAX_FAILED_ATTEMPTS 次后账户锁定 LOCK_DURATION 秒
          - 验证成功时自动重置失败计数
          - TTL 过期的会话视为不存在

        参数：
            user_id     — 匿名用户 ID
            session_key — 客户端提交的 X-Session-Key 值

        返回：
            (验证是否通过, session 对象)
            若 session 不存在或已锁定，返回 (False, None)
        """
        session = self._sessions.get(user_id)
        if session is None:
            return False, None

        # TTL 检查
        if time.time() - session.created_at > self.session_ttl:
            self.wipe(session)
            return False, None

        # 账户锁定检查
        if time.time() < session.locked_until:
            return False, None

        if session.session_key != session_key:
            session.failed_attempts += 1
            if session.failed_attempts >= self.MAX_FAILED_ATTEMPTS:
                session.locked_until = time.time() + self.LOCK_DURATION
                session.failed_attempts = 0
            return False, None

        # 验证成功，重置失败计数
        session.failed_attempts = 0
        return True, session

    # ── Persona 存储 ─────────────────────────────────────────────────────────

    def store_persona(self, session: UserSession, persona: Dict[str, Any]) -> str:
        """
        将 Persona JSON 存入 user_id 隔离目录。

        参数：
            session    — 有效的 UserSession
            persona    — 完整 Persona 字典

        返回：
            persona_path 路径字符串

        注意：
            原始上传文件应在调用此方法后立即删除，
            仅保留 persona.json 作为可重建的数据抽象。
        """
        p = Path(session.persona_path)
        p.write_text(
            json.dumps(persona, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
        return session.persona_path

    def load_persona(self, session: UserSession) -> Optional[Dict[str, Any]]:
        """从隔离目录读取 Persona JSON（不存在则返回 None）"""
        p = Path(session.persona_path)
        if not p.exists():
            return None
        return json.loads(p.read_text(encoding="utf-8"))

    # ── 上传文件管理 ─────────────────────────────────────────────────────────

    def store_upload(
        self,
        session: UserSession,
        filename: str,
        content: bytes,
        subfolder: str = "",
    ) -> str:
        """
        将上传文件存入 user_id/uploads/[subfolder]/ 目录。

        用途：临时保存用户上传的图片/文档，
        在 Persona 生成完成后应调用 purge_uploads() 清理原始文件。

        参数：
            session    — 有效的 UserSession
            filename   — 原始文件名（会做安全化处理）
            content    — 文件二进制内容
            subfolder  — 子目录分类（如 "photos", "docs"）

        返回：
            存储后的文件路径
        """
        safe_name = self._sanitize_filename(filename)
        base = Path(session.uploads_dir)
        if subfolder:
            base = base / subfolder
        base.mkdir(exist_ok=True, parents=True)
        file_path = base / safe_name
        file_path.write_bytes(content)
        return str(file_path)

    def purge_uploads(self, session: UserSession) -> int:
        """
        删除用户所有上传的原始文件（保留目录结构）。

        Persona 生成完成后必须调用此方法，
        确保原始图片/文档不被长期存储。

        返回：
            删除的文件数量
        """
        uploads = Path(session.uploads_dir)
        if not uploads.exists():
            return 0
        files = [f for f in uploads.rglob("*") if f.is_file()]
        for f in files:
            f.unlink()
        return len(files)

    # ── 数据清除 ─────────────────────────────────────────────────────────────

    def wipe(self, session: UserSession) -> Dict[str, Any]:
        """
        删除该用户所有数据（不可恢复）。

        清除范围：
        - uploads/ 目录下所有文件
        - persona.json
        - user_id 子目录本身

        返回：
            包含删除统计信息的字典

        安全说明：
            此操作物理删除文件，无备份，不可逆。
            调用前建议确认用户意图。
        """
        user_dir = Path(session.persona_path).parent
        deleted_files: list[str] = []

        if user_dir.exists():
            for f in user_dir.rglob("*"):
                if f.is_file():
                    deleted_files.append(str(f))
                    f.unlink()
            # 自底向上删除空目录
            for d in sorted(user_dir.rglob("*"), key=lambda p: len(p.parts), reverse=True):
                if d.is_dir() and not any(d.iterdir()):
                    d.rmdir()
            shutil.rmtree(str(user_dir), ignore_errors=True)

        # 从内存注册表移除
        self._sessions.pop(session.user_id, None)

        return {
            "user_id": session.user_id,
            "deleted_files": deleted_files,
            "total_files": len(deleted_files),
            "wiped_at": time.time(),
        }

    # ── 工具方法 ─────────────────────────────────────────────────────────────

    @staticmethod
    def _sanitize_filename(raw: str) -> str:
        """
        去除路径遍历字符，防止 ../ 注入。
        保留扩展名，将空格替换为下划线。
        """
        import re
        name = re.sub(r"[^\w\-.]", "_", raw)
        name = re.sub(r"__+", "_", name)
        return name.strip("_") or "unnamed"

    def get_storage_stats(self) -> Dict[str, Any]:
        """返回当前存储统计（用于管理接口）"""
        total_users = len(list(self.storage_root.iterdir()))
        total_size = sum(
            f.stat().st_size
            for f in self.storage_root.rglob("*")
            if f.is_file()
        )
        return {
            "storage_root": str(self.storage_root),
            "total_users": total_users,
            "total_bytes": total_size,
            "total_mb": round(total_size / 1024 / 1024, 2),
        }


# ---------------------------------------------------------------------------
# 全局单例（FastAPI 依赖注入）
# ---------------------------------------------------------------------------

# 懒加载单例，避免模块导入时提前创建目录
_isolation_instance: Optional[DataIsolation] = None


def get_isolation(storage_root: str = "./user_data") -> DataIsolation:
    global _isolation_instance
    if _isolation_instance is None:
        _isolation_instance = DataIsolation(storage_root=Path(storage_root))
    return _isolation_instance
