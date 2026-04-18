# -*- coding: utf-8 -*-
"""
persona_engine.py — MING 五层 Persona 生成引擎（主入口）
TwinBuddy Hackathon MVP 专用

职责：
  1. 定义不可变输入容器（RawSource）
  2. 编排四维蒸馏 + 五层渲染流程
  3. 提供 generate_persona() 唯一公开 API

模块结构：
  persona_engine.py     ← 本文件，薄调度层
  persona_distiller.py ← 四维蒸馏（cognition / expression / behavior / emotion）
  persona_layers.py    ← 五层渲染（Layer0–Layer4）

设计原则：不可变数据流，纯函数转换，无副作用
"""

from __future__ import annotations

import hashlib
import uuid
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from persona_distiller import (
    distill_behavior,
    distill_cognition,
    distill_emotion,
    distill_expression,
)
from persona_layers import (
    build_layer0,
    build_layer1,
    build_layer2,
    build_layer3,
    build_layer4,
    compute_confidence,
    infer_travel_style,
)

# ---------------------------------------------------------------------------
# 不可变输入容器
# ---------------------------------------------------------------------------


@dataclass(frozen=True)
class RawSource:
    """
    多源原始数据容器，所有字段只读（frozen dataclass 保证不可变性）。
    工厂方法 from_dict 执行防御性复制，不修改任何传入对象。
    """
    mbti: str
    bio: str
    chat_logs: str
    douyin_data: Dict[str, Any]
    photo_path: Optional[str]

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> RawSource:
        """工厂方法：从 dict 构造 RawSource（防御性复制）"""
        return cls(
            mbti=str(data.get("mbti", "")).strip().upper() or "UNKNOWN",
            bio=str(data.get("bio", "")).strip(),
            chat_logs=str(data.get("chat_logs", "")).strip(),
            douyin_data=dict(data.get("douyin_data", {})),
            photo_path=data.get("photo_path"),
        )


# ---------------------------------------------------------------------------
# 内部工具
# ---------------------------------------------------------------------------


def _compute_fingerprint(raw: RawSource) -> str:
    """计算 Soul Fingerprint（纯函数）"""
    content = (
        f"{raw.mbti}|{raw.bio[:200]}|"
        f"{len(raw.chat_logs)}|{list(raw.douyin_data.keys())}"
    )
    return hashlib.sha256(content.encode("utf-8")).hexdigest()[:16]


def _sources_list(
    bio: str, chat_logs: str, has_douyin: bool, has_photo: bool
) -> List[str]:
    """返回实际使用了哪些数据源（用于响应）"""
    used = ["mbti"]
    if len(bio) > 20:          used.append("bio")
    if len(chat_logs) > 100:  used.append("chat_logs")
    if has_douyin:             used.append("douyin_data")
    if has_photo:              used.append("photo")
    return used


# ---------------------------------------------------------------------------
# 主入口：generate_persona
# ---------------------------------------------------------------------------


def generate_persona(
    mbti: str,
    bio: str,
    chat_logs: str,
    douyin_data: Optional[Dict[str, Any] | str] = None,
    photo_path: Optional[str] = None,
) -> Dict[str, Any]:
    """
    五层 Persona 生成入口（纯函数，无副作用）

    参数：
        mbti        — MBTI 四字母，如 "INTJ"
        bio         — 用户自我介绍文本
        chat_logs   — 原始聊天记录文本
        douyin_data — 抖音导出 JSON（dict 或 JSON 字符串，可选）
        photo_path  — 用户图片路径（可选）

    返回：
        完整五层 Persona JSON（包含 identity / speaking_style /
        emotion_decision / social_behavior / layer0_hard_rules 等顶层字段）
    """
    import json as _json

    # ── Step 0: 规范化 douyin_data ─────────────────────────────────────
    parsed_douyin: Dict[str, Any] = {}
    if douyin_data:
        if isinstance(douyin_data, dict):
            parsed_douyin = douyin_data
        elif isinstance(douyin_data, str) and douyin_data.strip():
            try:
                parsed_douyin = _json.loads(douyin_data)
            except _json.JSONDecodeError:
                pass  # 降级为空字典，保持静默

    # ── Step 1: 构造不可变输入 ──────────────────────────────────────────
    raw = RawSource.from_dict({
        "mbti": mbti,
        "bio": bio,
        "chat_logs": chat_logs,
        "douyin_data": parsed_douyin,
        "photo_path": photo_path,
    })

    # ── Step 2: 四维蒸馏（纯函数，彼此独立，可并行）─────────────────────
    cognition  = distill_cognition(raw.mbti, raw.bio, raw.chat_logs)
    expression = distill_expression(raw.mbti, raw.bio, raw.chat_logs)
    behavior   = distill_behavior(raw.mbti, raw.bio, raw.chat_logs)
    emotion    = distill_emotion(raw.mbti, raw.bio, raw.chat_logs)

    # ── Step 3: 五层渲染（纯函数，无外部依赖）──────────────────────────
    layer0_hard = build_layer0(raw.mbti, raw.bio, raw.chat_logs)
    layer1      = build_layer1(
        raw.mbti, raw.bio,
        cognition.get("mbti_dimension_evidence", []),
    )
    layer2      = build_layer2(raw.mbti, expression)
    layer3      = build_layer3(raw.mbti, cognition, emotion)
    layer4      = build_layer4(raw.mbti, behavior, emotion)

    # ── Step 4: 元数据 ─────────────────────────────────────────────────
    confidence  = compute_confidence(
        raw.mbti, raw.bio, raw.chat_logs,
        bool(raw.douyin_data), bool(raw.photo_path),
    )
    fingerprint = _compute_fingerprint(raw)
    now         = datetime.now(timezone.utc).isoformat()

    # ── Step 5: MBTI 影响力摘要 ─────────────────────────────────────────
    mbti_letters = raw.mbti
    mbti_influence = (
        f"MBTI={mbti_letters}。"
        f"{'理性主导，逻辑优先。' if 'T' in mbti_letters else '情感主导，价值优先。'}"
        f"{'内倾，需要独处时间。' if 'I' in mbti_letters else '外倾，从社交获取能量。'}"
        f"{'直觉型，喜欢抽象和可能性。' if 'N' in mbti_letters else '实感型，注重具体细节。'}"
        f"{'判断型，偏好计划和控制感。' if 'J' in mbti_letters else '感知型，享受灵活和开放。'}"
    )

    # ── Step 6: 组装输出（所有字段新构造，无修改原对象）────────────────
    return {
        # 元数据
        "generated_at": now,
        "persona_id": str(uuid.uuid4()),
        "soul_fingerprint": fingerprint,
        "confidence_score": confidence,
        "data_sources_used": _sources_list(
            bio, chat_logs, bool(raw.douyin_data), bool(raw.photo_path)
        ),
        "mbti_influence": mbti_influence,

        # Layer0（最高优先级，NEGATIVE）
        "layer0_hard_rules": layer0_hard,

        # Layer1–Layer4
        "identity":        layer1,
        "speaking_style":  layer2,
        "emotion_decision": layer3,
        "social_behavior": layer4,

        # 附加兼容性字段（供 TwinBuddy 前端直接消费）
        "travel_style": infer_travel_style(mbti_letters),
        "mbti_summary": (
            f"{mbti_letters} 类型，"
            f"{'独处充电' if 'I' in mbti_letters else '社交充电'}，"
            f"{'直觉思维' if 'N' in mbti_letters else '实感行动'}，"
            f"{'理性决策' if 'T' in mbti_letters else '情感优先'}，"
            f"{'计划执行' if 'J' in mbti_letters else '弹性探索'}。"
        ),

        # 内部维度（供 LLM 后续深度加工，不暴露给前端）
        "_internal": {
            "cognition":  cognition,
            "expression": expression,
            "behavior":   behavior,
            "emotion":    emotion,
            "raw_summary": {
                "mbti":        raw.mbti,
                "bio_len":     len(raw.bio),
                "chat_chars":  len(raw.chat_logs),
                "douyin_keys": list(raw.douyin_data.keys()),
            },
        },
    }
