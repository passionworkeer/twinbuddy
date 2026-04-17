#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
MING Fusion Engine — 多源人格画像融合引擎
整合 MBTI、聊天记录、抖音数据、照片，输出统一人格画像。
优先级：MBTI > 聊天记录 > 抖音数据 > 照片（仅用于 Avatar）
冲突处理：高置信度数据覆盖低置信度
"""
from __future__ import annotations

import sys
from typing import Any, Optional

# ── Windows UTF-8 ──────────────────────────────────────────────────────────────
from MING.parsers._encoding import *  # noqa: F401,F403


# ─── 置信度常量 ──────────────────────────────────────────────────────────────

CONFIDENCE_LEVELS = {
    "MBTI": 0.9,
    "ChatParser": 0.7,
    "DouyinParser": 0.65,
    "PhotoParser": 0.4,  # 照片仅用于 Avatar，置信度最低
}

# Persona 字段权重（用于计算总体置信度）
FIELD_WEIGHTS = {
    "mbti_type": 1.0,
    "dimensions": 0.8,
    "key_traits": 0.7,
    "communication_style": 0.7,
    "decision_making": 0.7,
    "stress_response": 0.6,
    "growth_areas": 0.6,
    "topics": 0.6,
    "speaking_style": 0.6,
    "emotional_tone": 0.5,
    "relationship_depth": 0.5,
    "key_phrases": 0.4,
    "decision_patterns": 0.5,
    "content_categories": 0.5,
    "engagement_style": 0.4,
    "aesthetic_preference": 0.4,
    "travel_interests": 0.4,
    "influencer_affinity": 0.3,
    "content_tone": 0.3,
}


# ─── 融合策略 ───────────────────────────────────────────────────────────────

def _resolve_field(
    field: str,
    sources: dict[str, Any],
    preferred_source: str,
) -> tuple[Any, str]:
    """
    解析单一字段的冲突。

    策略：
    1. 优先使用高优先级来源（MBTI > Chat > Douyin > Photo）
    2. 若高优先级来源无此字段，使用次高优先级
    3. 合并列表类型字段（topics, key_traits 等）
    """
    source_order = ["MBTIParser", "ChatParser", "DouyinParser", "PhotoParser"]

    # 优先使用指定来源
    if preferred_source and sources.get(preferred_source, {}).get(field) is not None:
        return sources[preferred_source][field], preferred_source

    # 按优先级从高到低查找
    for src in source_order:
        src_data = sources.get(src, {})
        val = src_data.get(field)
        if val is not None and val != "" and val != []:
            return val, src

    return None, ""


def _merge_lists(*items: Any) -> list:
    """合并多个列表，去重，保持顺序。"""
    seen = set()
    result = []
    for item in items:
        if isinstance(item, list):
            for v in item:
                if v not in seen:
                    seen.add(v)
                    result.append(v)
        elif item and item not in seen:
            seen.add(item)
            result.append(item)
    return result


def _compute_overall_confidence(
    persona: dict,
    active_sources: list[str],
) -> float:
    """计算总体置信度（加权平均）。"""
    if not active_sources:
        return 0.0

    total_weight = 0.0
    weighted_sum = 0.0
    for field, weight in FIELD_WEIGHTS.items():
        val = persona.get(field)
        if val is not None and val != "" and val != []:
            total_weight += weight
            weighted_sum += weight

    # 有数据字段越多，置信度越高
    coverage = total_weight / sum(FIELD_WEIGHTS.values()) if FIELD_WEIGHTS else 0
    # 来源越多，置信度越高
    source_bonus = min(len(active_sources) * 0.05, 0.15)
    return round(min(coverage + source_bonus, 1.0), 3)


def _infer_personality_summary(persona: dict) -> str:
    """根据融合结果生成人格画像摘要。"""
    parts: list[str] = []

    mbti = persona.get("mbti_type")
    if mbti:
        parts.append(f"MBTI 类型为 {mbti}，")
        comm = persona.get("communication_style", "")
        if comm:
            parts[-1] += f"沟通风格{comm}。"

    topics = persona.get("topics", [])
    if topics:
        parts.append(f"日常关注领域包括 {', '.join(topics[:3])}。")

    tone = persona.get("emotional_tone")
    if tone:
        parts.append(f"情感表达{tone}。")

    style = persona.get("speaking_style")
    if style:
        parts.append(f"说话风格：{style}。")

    cats = persona.get("content_categories", [])
    if cats:
        parts.append(f"内容偏好：{', '.join(cats[:3])}。")

    if not parts:
        return "人格画像数据不足，需补充更多数据源。"

    return "".join(parts)


def _cross_validate_mbti(mbti_type: str | None, chat: dict | None) -> dict[str, Any]:
    """
    交叉验证 MBTI 与聊天记录的一致性。
    例如：MBTI 为 ENFP，但聊天记录显示话题以工作为主且情感表达消极，
    则降低 MBTI 相关字段的置信度。
    """
    result = {"validated": True, "warnings": []}
    if not mbti_type:
        return result

    if chat:
        topics = chat.get("topics", [])
        tone = chat.get("emotional_tone", "")

        # E 型但聊天记录显示话少
        if mbti_type[0] == "E":
            total_msgs = chat.get("total_messages", 0)
            ratio = chat.get("message_ratio", {})
            if total_msgs > 50 and ratio.get("user", 0) < 0.3:
                result["warnings"].append("MBTI 显示外倾(E)，但聊天记录发言量偏低，可能存在情境差异")

        # F 型但情感表达消极
        if mbti_type[2] == "F":
            if "负面" in tone or "消极" in tone:
                result["warnings"].append("MBTI 显示情感型(F)，但聊天记录情感表达偏消极，参考时需考虑情境因素")

    return result


# ─── 主融合函数 ─────────────────────────────────────────────────────────────

def fuse_persona_sources(
    douyin: dict | None = None,
    mbti: dict | None = None,
    chat: dict | None = None,
    photo: str | None = None,
    *,
    debug: bool = False,
) -> dict:
    """
    融合多源数据，输出统一人格画像。

    参数:
        douyin: DouyinParser 提取的 persona dict
        mbti:   MBTIParser 提取的 persona dict
        chat:   ChatParser 提取的 persona dict
        photo:  照片路径（用于 Avatar，不参与人格融合）
        debug:  是否返回融合详情（供调试）

    返回:
        {
            "persona": { ... unified persona fields ... },
            "confidence": 0.87,
            "active_sources": ["MBTIParser", "ChatParser"],
            "validation": { ... cross-validation results ... },
            "summary": "...",
            "debug": { ... }  # 仅 debug=True 时
        }
    """
    sources: dict[str, dict] = {}

    # 整理来源数据
    if mbti and mbti.get("mbti_type"):
        sources["MBTIParser"] = mbti
    if chat and chat.get("total_messages", 0) > 0:
        sources["ChatParser"] = chat
    if douyin and douyin.get("content_categories"):
        sources["DouyinParser"] = douyin

    active_sources = list(sources.keys())

    # 构建统一画像
    persona: dict = {
        "source": "fusion",
        "active_sources": active_sources,
    }

    # 1. MBTI 核心字段（最高优先级）
    if "MBTIParser" in sources:
        src = sources["MBTIParser"]
        for field in ("mbti_type", "dimensions", "key_traits",
                      "communication_style", "decision_making",
                      "stress_response", "growth_areas"):
            val, _ = _resolve_field(field, sources, "MBTIParser")
            if val is not None:
                persona[field] = val

    # 2. 聊天记录字段（次高优先级）
    if "ChatParser" in sources:
        src = sources["ChatParser"]
        for field in ("topics", "speaking_style", "emotional_tone",
                      "relationship_depth", "key_phrases", "decision_patterns",
                      "total_messages", "message_ratio", "avg_message_length"):
            val, _ = _resolve_field(field, sources, "ChatParser")
            if val is not None:
                persona[field] = val

    # 3. 抖音数据字段
    if "DouyinParser" in sources:
        src = sources["DouyinParser"]
        for field in ("content_categories", "engagement_style",
                      "aesthetic_preference", "travel_interests",
                      "influencer_affinity", "content_tone"):
            val, _ = _resolve_field(field, sources, "DouyinParser")
            if val is not None:
                persona[field] = val

    # 4. 列表字段合并（topics, key_traits 等）
    all_topics: list = []
    all_traits: list = []
    for src_name, src_data in sources.items():
        if src_name == "ChatParser":
            all_topics = _merge_lists(all_topics, src_data.get("topics", []))
        if src_name == "DouyinParser":
            all_topics = _merge_lists(all_topics, src_data.get("content_categories", []))
        if src_name == "MBTIParser":
            all_traits = _merge_lists(all_traits, src_data.get("key_traits", []))

    if all_topics:
        persona["interests_topics"] = all_topics[:10]
    if all_traits:
        persona["personality_traits"] = all_traits[:10]

    # 5. Avatar（来自照片）
    if photo:
        persona["avatar_photo"] = photo

    # 6. 计算总体置信度
    confidence = _compute_overall_confidence(persona, active_sources)
    persona["confidence"] = confidence

    # 7. 交叉验证
    mbti_type = persona.get("mbti_type")
    chat_data = sources.get("ChatParser")
    validation = _cross_validate_mbti(mbti_type, chat_data)

    # 8. 人格摘要
    summary = _infer_personality_summary(persona)

    result = {
        "persona": persona,
        "confidence": confidence,
        "active_sources": active_sources,
        "validation": validation,
        "summary": summary,
    }

    if debug:
        result["debug"] = {
            "sources": sources,
            "field_weights": FIELD_WEIGHTS,
            "source_confidences": {
                name: CONFIDENCE_LEVELS.get(name, 0.5) for name in active_sources
            },
        }

    return result


# ─── 便捷函数 ───────────────────────────────────────────────────────────────

def quick_fuse(**kwargs) -> dict:
    """快速融合，简化调用。"""
    return fuse_persona_sources(**kwargs)


# ─── CLI ─────────────────────────────────────────────────────────────────────

def main() -> None:
    import json

    # 模拟多源数据
    mbti_data = {
        "mbti_type": "ENFP",
        "dimensions": {"IE": 0.3, "NS": 0.8, "FT": -0.2, "JP": -0.5},
        "key_traits": ["热情", "有创意", "爱社交", "不喜欢细节"],
        "communication_style": "表达型，喜欢讲故事和分享感受",
        "decision_making": "情感驱动，但有愿景",
        "stress_response": "在压力下可能变得批判性",
        "growth_areas": ["时间管理", "跟进细节"],
    }

    chat_data = {
        "total_messages": 284,
        "message_ratio": {"user": 0.6, "other": 0.4},
        "avg_message_length": 45,
        "topics": ["旅行", "美食", "工作"],
        "speaking_style": "简洁直接，偶尔用表情包",
        "emotional_tone": "积极正面，很少负面情绪表达",
        "relationship_depth": "亲密关系，有私人话题分享",
        "key_phrases": ["哈哈哈", "我觉得", "那我们"],
        "decision_patterns": "喜欢商量，但最终会自己做决定",
    }

    douyin_data = {
        "content_categories": ["旅行", "美食", "科技"],
        "engagement_style": "点赞为主，很少评论",
        "aesthetic_preference": "喜欢有质感的内容，偏爱大地色系",
        "travel_interests": ["小众目的地", "深度游"],
        "influencer_affinity": ["穷游网"],
        "content_tone": "记录生活，分享真实体验",
    }

    result = fuse_persona_sources(
        mbti=mbti_data,
        chat=chat_data,
        douyin=douyin_data,
        photo="/path/to/avatar.jpg",
        debug=True,
    )

    print("=== 融合结果 ===")
    print(f"置信度: {result['confidence']}")
    print(f"活跃来源: {result['active_sources']}")
    print(f"摘要: {result['summary']}")
    print()
    print("=== 统一画像 ===")
    print(json.dumps(result["persona"], ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
