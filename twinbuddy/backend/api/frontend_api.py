# -*- coding: utf-8 -*-
"""
backend/api/frontend_api.py — TwinBuddy 前端对接 API
FastAPI 路由，为前端提供 Onboarding / Persona / Feed / Buddies / Negotiate 接口

数据流：
  前端 localStorage → POST /api/onboarding → persona .md 文件 + 内存 session
  前端 localStorage → GET /api/persona → 从 .md 文件或内存加载
  前端 GET /api/feed → MING 六维度算法评分 → Feed + 懂你卡片
  前端 GET /api/buddies → top-N 搭子排序
  前端 POST /api/negotiate → LangGraph 双 Agent 协商

设计原则：
  - 不可变数据流：每个 handler 只读不解构输入
  - Persona 持久化：MiniMax LLM 生成 → .md 文件（YAML frontmatter + Markdown body）
  - 算法/Agent 解耦：frontmatter 喂 MING 算法，Markdown body 喂 Agent
  - 向后兼容：所有接口 fallback 到规则生成，保证系统在 LLM 不可用时仍工作
  - 搭子系统：优先从 agents/buddies/ .md 文件加载，fallback 到 JSON，最后 fallback 到 MOCK_BUDDIES
"""

from __future__ import annotations

import json
import re
import threading
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from fastapi import APIRouter, File, HTTPException, Query, UploadFile
from pydantic import BaseModel, Field, field_validator

# 搭子系统（从 JSON 文件加载，fallback 到 MOCK_BUDDIES）
from agents.buddies import (
    get_all_buddies,
    get_buddy_by_id,
    get_top_buddies,
    get_compatibility_breakdown as _get_buddy_breakdown,
    get_buddy_public,
)
from agents import persona_doc
from agents.scoring import get_compatibility_breakdown as _mock_compat_breakdown
from persona_generator import generate_persona_from_onboarding

# ---------------------------------------------------------------------------
# 路由
# ---------------------------------------------------------------------------

router = APIRouter(prefix="/api", tags=["前端对接"])

# ---------------------------------------------------------------------------
# 持久化配置（JSON 文件备份，防止服务器重启数据丢失）
# ---------------------------------------------------------------------------

_DATA_DIR = Path(__file__).parent.parent / "data"
_DATA_DIR.mkdir(exist_ok=True)

_ONBOARDING_STORE_FILE = _DATA_DIR / "onboarding_store.json"
_PERSONA_STORE_FILE = _DATA_DIR / "persona_store.json"


def _load_store(path: Path) -> Dict[str, Dict[str, Any]]:
    """从 JSON 文件恢复内存状态（服务器重启后调用）。"""
    if path.exists():
        try:
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {}
    return {}


def _save_store_async(path: Path, store: Dict[str, Dict[str, Any]]) -> None:
    """异步写入 JSON 文件备份（不阻塞请求处理线程）。"""

    def _write():
        try:
            with open(path, "w", encoding="utf-8") as f:
                json.dump(store, f, ensure_ascii=False, indent=2)
        except Exception:
            pass

    threading.Thread(target=_write, daemon=True).start()


# ---------------------------------------------------------------------------
# 内存状态（从文件恢复，启动时即加载）
# ---------------------------------------------------------------------------

# onboarding_data: { user_id: OnboardingData }
_onboarding_store: Dict[str, Dict[str, Any]] = _load_store(_ONBOARDING_STORE_FILE)

# persona_store: { user_id: Persona }
_persona_store: Dict[str, Dict[str, Any]] = _load_store(_PERSONA_STORE_FILE)

# 城市 emoji 映射
_CITY_EMOJI: Dict[str, str] = {
    "chengdu": "🐼", "chongqing": "🌶️", "dali": "🌊",
    "lijiang": "🏔️", "huangguoshu": "💧", "xian": "🏯",
    "qingdao": "🍺", "guilin": "🎋", "harbin": "❄️", "xiamen": "🌴",
}

# 城市中文名
_CITY_NAMES: Dict[str, str] = {
    "chengdu": "成都", "chongqing": "重庆", "dali": "大理",
    "lijiang": "丽江", "huangguoshu": "黄果树", "xian": "西安",
    "qingdao": "青岛", "guilin": "桂林", "harbin": "哈尔滨", "xiamen": "厦门",
}

# MBTI 中文标签
_MBTI_LABELS: Dict[str, str] = {
    "ENFP": "热情开拓者", "ENFJ": "理想领袖", "ENTP": "智多星", "ENTJ": "指挥官",
    "ESFP": "舞台明星", "ESFJ": "主人", "ESTP": "创业者", "ESTJ": "总经理",
    "INFP": "诗意漫游者", "INFJ": "引路人", "INTP": "学者", "INTJ": "战略家",
    "ISFP": "艺术家", "ISFJ": "守护者", "ISTP": "工匠", "ISTJ": "审计师",
}

# MBTI emoji
_MBTI_EMOJI: Dict[str, str] = {
    "ENFP": "🌈", "ENFJ": "🌟", "ENTP": "⚡", "ENTJ": "🎯",
    "ESFP": "🎪", "ESFJ": "🤗", "ESTP": "🚀", "ESTJ": "📋",
    "INFP": "🌙", "INFJ": "🔮", "INTP": "📚", "INTJ": "🧠",
    "ISFP": "🎨", "ISFJ": "🛡️", "ISTP": "🔧", "ISTJ": "📐",
}

_NEGOTIATION_DIM_LABELS: List[str] = ["行程节奏", "美食偏好", "拍照风格", "预算控制", "冒险精神", "作息时间"]
_NEGOTIATION_DIM_WEIGHTS: List[float] = [0.8, 0.6, 0.5, 0.7, 0.9, 0.6]

# ---------------------------------------------------------------------------
# Mock 视频数据（Feed 用）
# ---------------------------------------------------------------------------

# 视频封面图（Unsplash）
_VIDEO_COVERS = [
    "https://images.unsplash.com/photo-1537531383496-f4749c6c3aa2?w=800&q=80",
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
    "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&q=80",
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
    "https://images.unsplash.com/photo-1514924013411-cbf25faa35bb?w=800&q=80",
]

_VIDEO_TITLES = [
    "成都火锅的正确打开方式",
    "川西小环线自驾日记",
    "洱海边的日落有多绝",
    "一个人的丽江古城漫游",
    "厦门鼓浪屿的慢生活",
]

# 默认 Feed 视频列表（无搭子信息）
_DEFAULT_VIDEOS = [
    {"id": "v1", "type": "video",  "cover_url": _VIDEO_COVERS[0], "location": "成都", "title": _VIDEO_TITLES[0],  "video_url": None, "buddy": None},
    {"id": "v2", "type": "video",  "cover_url": _VIDEO_COVERS[1], "location": "川西", "title": _VIDEO_TITLES[1],  "video_url": None, "buddy": None},
    {"id": "v3", "type": "twin_card", "cover_url": _VIDEO_COVERS[2], "location": "大理", "title": _VIDEO_TITLES[2],  "video_url": None, "buddy": None},
    {"id": "v4", "type": "twin_card", "cover_url": _VIDEO_COVERS[3], "location": "丽江", "title": _VIDEO_TITLES[3],  "video_url": None, "buddy": None},
    {"id": "v5", "type": "twin_card", "cover_url": _VIDEO_COVERS[4], "location": "厦门", "title": _VIDEO_TITLES[4],  "video_url": None, "buddy": None},
]

# 城市 emoji
_CITY_EMOJI: Dict[str, str] = {
    "chengdu": "🐼", "chongqing": "🌶️", "dali": "🌊",
    "lijiang": "🏔️", "huangguoshu": "💧", "xian": "🏯",
    "qingdao": "🍺", "guilin": "🎋", "harbin": "❄️", "xiamen": "🌴",
}

# 城市中文名
_CITY_NAMES: Dict[str, str] = {
    "chengdu": "成都", "chongqing": "重庆", "dali": "大理",
    "lijiang": "丽江", "huangguoshu": "黄果树", "xian": "西安",
    "qingdao": "青岛", "guilin": "桂林", "harbin": "哈尔滨", "xiamen": "厦门",
}


def _load_mock_videos() -> List[Dict[str, Any]]:
    """
    从 mock_videos.json 加载视频数据。
    文件不存在或解析失败时返回默认视频列表。
    """
    videos_path = _DATA_DIR / "mock_videos.json"
    if videos_path.exists():
        try:
            with open(videos_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return _DEFAULT_VIDEOS


def _clamp_score(value: Any, fallback: int = 70) -> int:
    """将分数标准化到 0-100，输入异常时回退到 fallback。"""
    try:
        score = int(float(value))
    except Exception:
        score = fallback
    return max(0, min(100, score))


def _normalize_radar(raw_radar: Any) -> List[Dict[str, Any]]:
    """规范化雷达图结构，确保始终返回 6 维可渲染数据。"""
    radar_list = raw_radar if isinstance(raw_radar, list) else []
    normalized: List[Dict[str, Any]] = []

    for idx, label in enumerate(_NEGOTIATION_DIM_LABELS):
        source = radar_list[idx] if idx < len(radar_list) and isinstance(radar_list[idx], dict) else {}
        fallback_score = 68 + idx * 3
        normalized.append({
            "dimension": label,
            "user_score": _clamp_score(source.get("user_score"), fallback=fallback_score),
            "buddy_score": _clamp_score(source.get("buddy_score"), fallback=fallback_score - 4),
            "weight": float(source.get("weight", _NEGOTIATION_DIM_WEIGHTS[idx])),
        })

    return normalized


def _normalize_analysis_basis(raw_basis: Any) -> Dict[str, List[str]]:
    """保证 analysis_basis 三个字段始终存在且类型稳定。"""
    basis = raw_basis if isinstance(raw_basis, dict) else {}

    def _normalize_list(key: str) -> List[str]:
        value = basis.get(key, [])
        if not isinstance(value, list):
            return []
        return [str(item).strip() for item in value if str(item).strip()]

    return {
        "input_tags": _normalize_list("input_tags"),
        "strengths": _normalize_list("strengths"),
        "conflicts": _normalize_list("conflicts"),
    }


def _ensure_negotiation_payload(data: Dict[str, Any]) -> Dict[str, Any]:
    """对协商结果做统一兜底，保障前端详情页字段稳定。"""
    payload = dict(data)
    destination = str(payload.get("destination") or "大理")

    payload["destination"] = destination
    payload["radar"] = _normalize_radar(payload.get("radar"))

    messages = payload.get("messages")
    payload["messages"] = messages if isinstance(messages, list) else []

    red_flags = payload.get("red_flags")
    payload["red_flags"] = [str(flag).strip() for flag in red_flags if str(flag).strip()] if isinstance(red_flags, list) else []

    plan = payload.get("plan")
    if isinstance(plan, list):
        payload["plan"] = [str(item).strip() for item in plan if str(item).strip()]
    else:
        payload["plan"] = []

    if not payload["plan"]:
        payload["plan"] = [
            f"{destination}古城民宿2晚",
            f"{destination}周边自然风光1天",
            "特色美食探索之旅",
        ]

    payload["analysis_report"] = str(payload.get("analysis_report") or "协商已完成，建议按当前共识先执行首轮行程。")
    payload["analysis_basis"] = _normalize_analysis_basis(payload.get("analysis_basis"))

    if not isinstance(payload.get("matched_buddies"), list):
        payload["matched_buddies"] = []

    payload["dates"] = str(payload.get("dates") or "待定")
    payload["budget"] = str(payload.get("budget") or "待定")
    payload["consensus"] = bool(payload.get("consensus", False))

    return payload


# ---------------------------------------------------------------------------
# 用户偏好构建（将 onboarding 数据转换为兼容性评分格式）
# ---------------------------------------------------------------------------

# 搭子配置（4个 Mock 人格，用于视频中无用户数据时的 fallback）
_BUDDY_CONFIGS = {
    "enfp": {
        "name": "小雅", "mbti": "ENFP",
        "avatar_emoji": "🌈",
        "typical_phrases": ["说走就走！", "这也太美了吧！", "冲冲冲！"],
        "travel_style": "随性探索型",
    },
    "istj": {
        "name": "老陈", "mbti": "ISTJ",
        "avatar_emoji": "📐",
        "typical_phrases": ["计划好了再出发", "我们按路线走", "安全第一"],
        "travel_style": "严谨计划型",
    },
    "infp": {
        "name": "小鱼", "mbti": "INFP",
        "avatar_emoji": "🌙",
        "typical_phrases": ["这里好安静", "我们慢慢走", "想在这儿多待会儿"],
        "travel_style": "诗意漫游者",
    },
    "entj": {
        "name": "凯哥", "mbti": "ENTJ",
        "avatar_emoji": "🎯",
        "typical_phrases": ["听我安排！", "效率第一", "目标明确就出发"],
        "travel_style": "指挥官型",
    },
}


def _build_user_prefs(onboarding: Dict[str, Any], user_id: str = "") -> Dict[str, Any]:
    """
    将 onboarding 数据（mbti / interests / city / voiceText）转换为
    score_compatibility() 期望的 user_prefs 格式。

    优先从 persona .md 文件读取 MING 算法所需的 frontmatter 数据，
    缺失时根据 MBTI 类型推断合理的默认值。
    """
    mbti = (onboarding.get("mbti") or "ENFP").strip().upper()
    interests: List[str] = onboarding.get("interests") or []
    city = onboarding.get("city") or ""

    # 尝试从 persona .md frontmatter 读取 prefs
    if user_id:
        md_prefs = persona_doc.get_persona_for_algorithm(user_id)
        if md_prefs:
            return md_prefs

    # MBTI 维度
    if len(mbti) >= 4:
        ei, ns, tf, jp = mbti[0], mbti[1], mbti[2], mbti[3]
    else:
        ei, ns, tf, jp = "E", "N", "F", "P"

    # 从 MBTI 推断 pace / travel_style
    if jp == "J":
        pace = "有计划，每天有明确目标，不喜欢临时改变"
        travel_style = "计划执行型"
    else:
        pace = "慢悠悠，睡到自然醒，不赶景点，享受过程"
        travel_style = "随性探索型"

    # 从 MBTI 推断 negotiation_style
    if tf == "T":
        negotiation_style = "用逻辑和数据说服，不擅长情绪施压，立场坚定"
    else:
        negotiation_style = "用感受和价值观说服，温和但坚定，容易被真诚打动"

    # 从 MBTI 推断 budget（感性类型偏低，理性类型偏高）
    budget_map = {
        "ENFP": "3000-5000元", "ENFJ": "4000-6000元", "ENTP": "3000-6000元", "ENTJ": "6000-10000元",
        "ESFP": "5000-8000元", "ESFJ": "3500-5500元", "ESTP": "4000-7000元", "ESTJ": "5000-8000元",
        "INFP": "2500-4000元", "INFJ": "3500-6000元", "INTP": "3000-5000元", "INTJ": "5000-8000元",
        "ISFP": "2000-3500元", "ISFJ": "3000-5000元", "ISTP": "3000-6000元", "ISTJ": "4000-6000元",
    }
    budget = budget_map.get(mbti, "3500-5500元")

    return {
        "mbti": mbti,
        "likes": interests,
        "dislikes": [],
        "budget": budget,
        "pace": pace,
        "travel_style": travel_style,
        "negotiation_style": negotiation_style,
        "city": city,
    }


def _build_buddy(mbti: str, city: str) -> Dict[str, Any]:
    """根据 MBTI 构建搭子信息（用于视频中无用户数据时的 fallback）。"""
    config = _BUDDY_CONFIGS.get(mbti.lower(), _BUDDY_CONFIGS["enfp"])
    compat = _load_compatibility("ENFP", mbti)
    score = int(compat["overall_score"] * 100) if compat else 75
    return {
        "name": config["name"],
        "mbti": config["mbti"],
        "avatar_emoji": config["avatar_emoji"],
        "typical_phrases": config["typical_phrases"],
        "travel_style": config["travel_style"],
        "compatibility_score": score,
    }


# ---------------------------------------------------------------------------
# 协商兼容性分解（供 LangGraph LLM 使用）
# ---------------------------------------------------------------------------

def _build_user_prefs_from_persona(persona: Dict[str, Any]) -> Dict[str, Any]:
    """
    将完整的 persona dict 转换为 MING 算法期望的 user_prefs 格式。

    字段映射（persona → user_prefs）：
      mbti            ← identity.content 中的 MBTI 或 mbti_type
      likes           ← identity.core_values
      dislikes        ← layer0_hard_rules.dealbreakers
      budget          ← travel_style.budget
      pace            ← travel_style.preferred_pace
      travel_style    ← travel_style (字符串)
      negotiation_style ← negotiation_style (字符串)

    适用于 negotiate 端点：将用户人格数据转换为兼容性算法输入，
    结果传给 LangGraph LLM 以实现深度协商策略注入。
    """
    identity: Dict[str, Any] = persona.get("identity", {})
    sp: Dict[str, Any] = persona.get("speaking_style", {})
    travel: Dict[str, Any] = persona.get("travel_style", {})
    neg: Dict[str, Any] = persona.get("negotiation_style", {})
    layer0: Dict[str, Any] = persona.get("layer0_hard_rules", {})

    # MBTI：从 identity.content 或 mbti_influence 提取
    identity_content = str(identity.get("content", ""))
    import re as _re
    mbti_match = _re.search(r"\b([IE][NS][TF][JP])([AT])?\b", identity_content)
    if not mbti_match:
        mbti_influence = str(persona.get("mbti_influence", ""))
        mbti_match = _re.search(r"\b([IE][NS][TF][JP])([AT])?\b", mbti_influence)
    mbti = mbti_match.group(0) if mbti_match else persona.get("mbti_type") or persona.get("mbti", "ENFP")

    # likes：优先 interest_tags，其次 core_values，再次 language_markers
    likes: List[str] = []
    raw_interest_tags = persona.get("interest_tags", [])
    if isinstance(raw_interest_tags, list):
        likes = [str(x).strip() for x in raw_interest_tags if str(x).strip()]
    if not likes:
        likes = identity.get("core_values", []) or []
    if not likes:
        markers: List[str] = sp.get("language_markers", [])
        likes = [m for m in markers if len(m) > 2][:5]

    # dislikes
    dealbreakers: List[str] = []
    if isinstance(layer0, dict):
        dealbreakers = layer0.get("dealbreakers", []) or []
    elif isinstance(layer0, list):
        dealbreakers = [str(x).strip() for x in layer0 if str(x).strip()]

    # budget
    budget = ""
    if isinstance(travel, dict):
        budget = travel.get("budget", "")
    elif isinstance(travel, str):
        budget = travel

    # pace
    pace = ""
    if isinstance(travel, dict):
        pace = travel.get("preferred_pace", "") or travel.get("pace_preference", "")

    # negotiation_style（字符串）
    neg_style_str = ""
    if isinstance(neg, dict):
        approach = neg.get("approach", "")
        hard = neg.get("hard_to_compromise", [])
        easy = neg.get("easy_to_compromise", [])
        neg_style_str = f"{approach}。绝不妥协：{'、'.join(hard[:2])}。可以妥协：{'、'.join(easy[:2])}"
    elif isinstance(neg, str):
        neg_style_str = neg

    return {
        "mbti": mbti,
        "likes": likes,
        "dislikes": dealbreakers,
        "budget": budget,
        "pace": pace,
        "travel_style": str(travel) if isinstance(travel, str) else "",
        "negotiation_style": neg_style_str,
        "city": persona.get("city", ""),
    }


def _get_negotiation_compatibility_breakdown(
    user_prefs: Optional[Dict[str, Any]],
    twin_persona: Dict[str, Any],
) -> Optional[Dict[str, Any]]:
    """
    为协商流程计算兼容性分解数据，深度注入到 LLM prompt 中。

    返回格式：
      {
        "total": float,           # 0.0-1.0
        "strengths": List[str],   # 匹配度高的维度描述
        "red_flags": List[str],   # 潜在冲突维度描述
        "easy_to_compromise": List[str],  # 搭子愿意妥协的方面
        "hard_to_compromise": List[str],  # 搭子绝不妥协的方面
      }

    数据来源（优先级）：
      1. user_prefs + twin_persona → MING 六维度算法
      2. twin_persona['negotiation_style']（rich buddy JSON 字段）
      3. None（向后兼容）
    """
    if not user_prefs:
        return None

    # 方式1：从 MING 算法计算六维度分解
    breakdown = None
    try:
        breakdown = _mock_compat_breakdown(user_prefs, twin_persona)
    except Exception:
        pass

    if breakdown:
        # 从 rich buddy JSON 补充 negotiation_style 字段
        neg_style: Dict[str, Any] = twin_persona.get("negotiation_style", {})
        if isinstance(neg_style, dict):
            easy = neg_style.get("easy_to_compromise", [])
            hard = neg_style.get("hard_to_compromise", [])
        else:
            easy = []
            hard = []
        return {
            "total": breakdown.get("total", 50) / 100.0,  # 归一化到 0-1
            "strengths": breakdown.get("strengths", []),
            "red_flags": breakdown.get("red_flags", []),
            "easy_to_compromise": easy[:3],
            "hard_to_compromise": hard[:3],
        }

    # 方式2：从 rich buddy JSON 直接提取（无 MING 算法时）
    neg_style: Dict[str, Any] = twin_persona.get("negotiation_style", {})
    if isinstance(neg_style, dict):
        return {
            "total": 0.5,
            "strengths": [],
            "red_flags": [],
            "easy_to_compromise": neg_style.get("easy_to_compromise", [])[:3],
            "hard_to_compromise": neg_style.get("hard_to_compromise", [])[:3],
        }

    return None


# ---------------------------------------------------------------------------
# Pydantic 模型
# ---------------------------------------------------------------------------


class OnboardingDataRequest(BaseModel):
    """POST /api/onboarding 请求体"""
    mbti: str = Field(..., min_length=3, max_length=6, description="MBTI 类型")
    interests: List[str] = Field(default_factory=list, description="兴趣标签数组")
    voiceText: str = Field(default="", description="语音转文字内容")
    city: str = Field(default="", description="向往城市ID")
    completed: bool = Field(default=True, description="是否完成引导")

    @field_validator("mbti")
    @classmethod
    def normalize_mbti(cls, v: str) -> str:
        return v.strip().upper()


class PersonaResponse(BaseModel):
    """GET /api/persona 响应体"""
    persona_id: str
    name: str
    avatar_prompt: str
    avatar_emoji: str
    layer0_hard_rules: List[str]
    identity: Dict[str, Any]
    speaking_style: Dict[str, Any]
    emotion_decision: Dict[str, Any]
    social_behavior: Dict[str, Any]
    travel_style: str
    mbti_influence: str
    soul_fingerprint: str
    confidence_score: float
    data_sources_used: List[str]


class VideoItemResponse(BaseModel):
    """GET /api/feed 单个视频项"""
    id: str
    type: str
    cover_url: str
    video_url: Optional[str] = None
    location: str
    title: str
    buddy: Optional[Dict[str, Any]] = None


class NegotiationRequest(BaseModel):
    """POST /api/negotiate 请求体"""
    user_id: Optional[str] = None
    user_persona_id: Optional[str] = None
    buddy_mbti: Optional[str] = None
    mbti: Optional[str] = None
    interests: List[str] = Field(default_factory=list)
    voiceText: str = Field(default="")
    travel_style: Optional[str] = None
    destination: str = Field(..., description="目的地城市ID")

    @field_validator("mbti")
    @classmethod
    def normalize_optional_mbti(cls, v: Optional[str]) -> Optional[str]:
        if not v:
            return v
        return v.strip().upper()


# ---------------------------------------------------------------------------
# 辅助函数
# ---------------------------------------------------------------------------


def _extract_mbti(text: str) -> Optional[str]:
    """
    从任意文本中提取 MBTI（4字母 + 可选 A/T 后缀）。
    例如: "MBTI=ENFP。热情开拓者" -> "ENFP"
    """
    import re

    if not text:
        return None
    m = re.search(r"\b([IE][NS][TF][JP])([AT])?\b", text.strip().upper())
    if not m:
        return None
    return (m.group(1) + (m.group(2) or "")).upper()


def _find_buddy_by_mbti(mbti: str) -> Optional[Dict[str, Any]]:
    """从 agents/buddies 数据集中按 MBTI 找一个可用搭子。"""
    target = (mbti or "").strip().upper()
    if not target:
        return None
    for buddy in get_all_buddies():
        if str(buddy.get("mbti", "")).strip().upper() == target:
            return buddy
    return None


def _buddy_json_to_persona(buddy: Dict[str, Any]) -> Dict[str, Any]:
    """将 buddies JSON 格式转换为协商链路可消费的 persona 字典。"""
    identity_raw = buddy.get("identity", {}) if isinstance(buddy.get("identity", {}), dict) else {}
    speaking_raw = buddy.get("speaking_style", {}) if isinstance(buddy.get("speaking_style", {}), dict) else {}
    emotion_raw = buddy.get("emotion_decision", {}) if isinstance(buddy.get("emotion_decision", {}), dict) else {}
    social_raw = buddy.get("social_behavior", {}) if isinstance(buddy.get("social_behavior", {}), dict) else {}

    travel_raw = buddy.get("travel_style", "")
    if isinstance(travel_raw, dict):
        travel_style = (
            str(travel_raw.get("overall") or "").strip()
            or str(travel_raw.get("pace_preference") or "").strip()
            or "随性探索型"
        )
    else:
        travel_style = str(travel_raw or "").strip() or "随性探索型"

    raw_layer0 = (
        buddy.get("personality_layers", {}).get("layer0_hard_rules", {})
        if isinstance(buddy.get("personality_layers", {}), dict)
        else {}
    )
    hard_rules: List[str] = []
    if isinstance(raw_layer0, dict):
        for key in ("dealbreakers", "must_haves"):
            vals = raw_layer0.get(key, [])
            if isinstance(vals, list):
                hard_rules.extend([str(v).strip() for v in vals if str(v).strip()])
    elif isinstance(raw_layer0, list):
        hard_rules = [str(v).strip() for v in raw_layer0 if str(v).strip()]
    hard_rules = list(dict.fromkeys(hard_rules))

    typical_phrases = speaking_raw.get("typical_phrases", [])
    if not isinstance(typical_phrases, list):
        typical_phrases = []

    return {
        "persona_id": str(buddy.get("id") or f"buddy-{str(buddy.get('mbti', '')).lower()}"),
        "name": str(buddy.get("name") or "搭子"),
        "mbti_type": str(buddy.get("mbti") or ""),
        "mbti": str(buddy.get("mbti") or ""),
        "avatar_emoji": str(buddy.get("avatar_emoji") or "🤖"),
        "avatar_prompt": str(buddy.get("avatar_prompt") or ""),
        "identity": {
            "emoji": "🧭",
            "title": "Identity",
            "content": str(identity_raw.get("background") or identity_raw.get("life_stage") or ""),
        },
        "speaking_style": {
            "emoji": "💬",
            "title": "Style",
            "content": str(speaking_raw.get("tone") or speaking_raw.get("sentence_patterns") or ""),
            "typical_phrases": typical_phrases,
            "chat_tone": str(speaking_raw.get("tone") or ""),
        },
        "emotion_decision": {
            "emoji": "🧠",
            "title": "Decision",
            "content": str(emotion_raw.get("decision_style") or ""),
            "stress_response": str(emotion_raw.get("stress_response") or ""),
            "decision_style": str(emotion_raw.get("decision_style") or ""),
        },
        "social_behavior": {
            "emoji": "🤝",
            "title": "Social",
            "content": str(social_raw.get("conflict_style") or social_raw.get("boundaries") or ""),
            "social_style": str(social_raw.get("conflict_style") or social_raw.get("social_energy") or ""),
        },
        "travel_style": travel_style,
        "layer0_hard_rules": hard_rules,
        "preferences": buddy.get("preferences", {}),
        "negotiation_style": buddy.get("negotiation_style", {}),
        "compatibility_notes": buddy.get("compatibility_notes", {}),
    }


def _load_mock_persona(mbti: str) -> Optional[Dict[str, Any]]:
    """
    加载指定 MBTI 的 persona。

    唯一来源：agents/buddies（主数据源）
    """
    buddy = _find_buddy_by_mbti(mbti)
    if buddy:
        return _buddy_json_to_persona(buddy)
    return None


def _load_compatibility(a_mbti: str, b_mbti: str) -> Optional[Dict[str, Any]]:
    """
    加载两个 MBTI 之间的协商兼容性。

    来源：使用 agents/buddies + MING 评分实时估算
    """
    buddy = _find_buddy_by_mbti(b_mbti)
    if not buddy:
        return None

    user_prefs = _build_user_prefs({"mbti": a_mbti.upper(), "interests": [], "city": ""})
    breakdown = _mock_compat_breakdown(user_prefs, buddy)
    total = float(breakdown.get("total", 75.0))

    if total >= 85:
        recommendation = "匹配度很高，建议直接围绕共同兴趣制定主线行程。"
    elif total >= 70:
        recommendation = "匹配度良好，先约定节奏与预算，再细化景点优先级。"
    else:
        recommendation = "匹配度一般，建议先做1天轻量试跑，再决定长线同行。"

    return {
        "overall_score": round(total / 100.0, 3),
        "rounds": [],
        "strengths": breakdown.get("strengths", []),
        "challenges": breakdown.get("red_flags", []),
        "recommendation": recommendation,
    }


def _build_buddy(mbti: str, city: str) -> Dict[str, Any]:
    """根据 MBTI 构建搭子信息"""
    config = _BUDDY_CONFIGS.get(mbti.lower(), _BUDDY_CONFIGS["enfp"])
    compat = _load_compatibility("ENFP", mbti)
    score = int(compat["overall_score"] * 100) if compat else 75
    return {
        "name": config["name"],
        "mbti": config["mbti"],
        "avatar_emoji": config["avatar_emoji"],
        "typical_phrases": config["typical_phrases"],
        "travel_style": config["travel_style"],
        "compatibility_score": score,
    }


# ---------------------------------------------------------------------------
# MING 四维人格框架 — MBTI 维度映射
# ---------------------------------------------------------------------------

def _parse_mbti_dimensions(mbti: str) -> Dict[str, str]:
    """将 4-letter MBTI 解析为四个维度的值"""
    if len(mbti) < 4:
        return {"energy": "N", "information": "N", "decision": "T", "lifestyle": "J"}
    return {
        "energy":     mbti[0],   # I/E
        "information": mbti[1],   # N/S
        "decision":    mbti[2],   # T/F
        "lifestyle":   mbti[3],   # J/P
    }


# 认知维度（cognition/L1-identity）MBTI 映射
_COGNITION_MAP: Dict[str, Dict[str, Any]] = {
    "energy": {
        "I": {
            "recharge": "独处充电，从内部世界获取能量",
            "decision_basis": "依赖内部框架和深度思考",
            "social_style": "选择性深度交流后需要独处消化",
            "keyword": "内向探索者",
        },
        "E": {
            "recharge": "社交充电，从外部世界获取能量",
            "decision_basis": "依赖外部反馈和讨论",
            "social_style": "在对话中理清思路，边聊边想",
            "keyword": "外向行动派",
        },
    },
    "information": {
        "N": {
            "gather": "直觉思维，偏好抽象和可能性",
            "focus": "关注模式和关联，不拘泥于细节",
            "pattern_recognition": "善于发现隐藏的可能性",
            "keyword": "直觉型",
        },
        "S": {
            "gather": "感觉认知，注重具体细节和现实",
            "focus": "关注实际可行的方案",
            "pattern_recognition": "依赖五官感知和经验",
            "keyword": "实感型",
        },
    },
    "decision": {
        "T": {
            "approach": "逻辑决策，情感表达克制",
            "justice": "重视公平和原则",
            "conflict_style": "直面问题，讲究道理",
            "keyword": "理性决策者",
        },
        "F": {
            "approach": "情感决策，共情能力强",
            "justice": "重视和谐和人情",
            "conflict_style": "顾及他人感受，避免冲突",
            "keyword": "情感共鸣者",
        },
    },
    "lifestyle": {
        "J": {
            "style": "有计划，喜欢确定性和控制感",
            "closure": "偏好清晰结论和既定安排",
            "stress": "面对不确定性时会焦虑",
            "keyword": "计划掌控型",
        },
        "P": {
            "style": "灵活随性，享受开放性和可能性",
            "closure": "保留余地，随情况调整",
            "stress": "被强制约束时感到压抑",
            "keyword": "弹性适应型",
        },
    },
}

# 表达维度（expression/L2-speaking_style）MBTI 映射
_EXPRESSION_MAP: Dict[str, Dict[str, Any]] = {
    "energy": {
        "I": {
            "verbosity": "话少沉稳，表达间接含蓄",
            "rhythm": "深思后才回应，不急于表达",
            "typical_phrases": ["让我想想", "这个嘛...", "嗯"],
        },
        "E": {
            "verbosity": "话多热情，表达直接主动",
            "rhythm": "边想边说，节奏快且有感染力",
            "typical_phrases": ["我觉得吧！", "走走走！", "太棒了！"],
        },
    },
    "information": {
        "N": {
            "metaphor": "善用隐喻和联想，跳跃性思维",
            "abstract": "谈论方向和可能性多于具体细节",
            "typical_phrases": ["感觉像是...", "说不清但...", "说不定"],
        },
        "S": {
            "metaphor": "描述贴近现实，具体可感",
            "abstract": "谈论眼前事实和可操作步骤",
            "typical_phrases": ["这个具体是...", "上次就是...", "按计划"],
        },
    },
    "decision": {
        "T": {
            "structure": "表达偏结构化，逻辑清晰",
            "tone": "客观冷静，少用感叹词",
            "typical_phrases": ["从逻辑上看", "理性分析", "这个结论"],
        },
        "F": {
            "structure": "情感表达丰富，语气温暖",
            "tone": "主观感受多，共情式表达",
            "typical_phrases": ["我觉得...", "你一定很难受吧", "一起加油"],
        },
    },
    "lifestyle": {
        "J": {
            "conclusion": "偏好清晰结论，干脆利落",
            "hedging": "很少保留余地，说一不二",
            "typical_phrases": ["就这样定了", "按计划执行", "没问题"],
        },
        "P": {
            "conclusion": "保留余地，留有调整空间",
            "hedging": "经常说「再说吧」「到时候看」",
            "typical_phrases": ["先这样吧", "到时候再调整", "灵活处理"],
        },
    },
}

# 行为维度（behavior/L3-social_behavior）MBTI 映射
_BEHAVIOR_MAP: Dict[str, Dict[str, Any]] = {
    "energy": {
        "I": {
            "social_energy": "独处充电型，社交后需要恢复时间",
            "initiation": "被动响应为主，很少主动发起",
            "social_duration": "深度交流 > 泛泛社交",
        },
        "E": {
            "social_energy": "社交充电型，人多更有活力",
            "initiation": "主动发起对话，享受成为焦点",
            "social_duration": "长时间社交也不会疲惫",
        },
    },
    "information": {
        "N": {
            "exploration": "探索模式：偏好新奇和可能性",
            "route": "随性探索，不喜欢精确规划",
            "interest": "容易被新事物吸引，关注长远意义",
        },
        "S": {
            "exploration": "务实模式：偏好熟悉和稳定",
            "route": "按计划执行，注重效率和安全性",
            "interest": "关注眼前可行，关注细节和传统",
        },
    },
    "decision": {
        "T": {
            "stress_response": "用逻辑分析问题，寻求解决方案",
            "emotion_display": "克制情绪表达，倾向冷处理",
            "support_style": "提供实际帮助而非情感安慰",
        },
        "F": {
            "stress_response": "先处理情绪，再处理事情",
            "emotion_display": "情绪外露，需要倾诉和共情",
            "support_style": "先陪伴后建议，情感支持优先",
        },
    },
    "lifestyle": {
        "J": {
            "planning": "高度计划性，日程安排紧凑",
            "spontaneity": "不喜欢临时变更，计划外会焦虑",
            "time_orientation": "准时、守时、讨厌拖延",
        },
        "P": {
            "planning": "灵活安排，不喜欢被时间表约束",
            "spontaneity": "享受意外，享受即兴决定",
            "time_orientation": "时间观念弹性，不拘泥准时",
        },
    },
}

# 情感维度（emotion/L4-emotion_decision）MBTI 映射
_EMOTION_MAP: Dict[str, Dict[str, Any]] = {
    "energy": {
        "I": {
            "attachment": "在亲密中保持独立空间的需求",
            "intimacy": "需要深入连接而非广泛社交",
            "recharge_needs": "独处时间 = 情绪修复时间",
        },
        "E": {
            "attachment": "在关系中寻求更多连接和确认",
            "intimacy": "通过外部社交确认自我价值",
            "recharge_needs": "社交活动 = 情绪充电",
        },
    },
    "information": {
        "N": {
            "triggers": "对未来的焦虑和不确定性",
            "positive": "被理解和被看到潜在可能性",
            "growth": "关注成长和人生意义类话题",
        },
        "S": {
            "triggers": "对具体问题的失控感和压力",
            "positive": "被关注当下的需求和感受",
            "growth": "关注稳定和安全的生活",
        },
    },
    "decision": {
        "T": {
            "emotion_display": "情绪不外显，常用理性化防御",
            "vulnerability": "示弱=暴露弱点，需要保持掌控感",
            "comfort": "解决问题比情感安慰更有效",
        },
        "F": {
            "emotion_display": "情绪外显，需要被看见和被共情",
            "vulnerability": "愿意展示脆弱，寻求情感支持",
            "comfort": "被倾听和被理解比解决方案更重要",
        },
    },
    "lifestyle": {
        "J": {
            "control": "通过控制感获得安全感",
            "anxiety": "不确定性是主要焦虑源",
            "comfort_mechanism": "做计划、列清单、整理",
        },
        "P": {
            "control": "通过保持开放性减少压迫感",
            "anxiety": "被约束和被迫做决定是主要压力",
            "comfort_mechanism": "拖延、自我宽慰、转移注意力",
        },
    },
}

# MBTI 中文标签（已在顶部定义，这里补充更多映射）
_MBTI_KEYWORDS: Dict[str, str] = {
    "ENFP": "热情创意", "ENFJ": "理想共鸣", "ENTP": "智趣探索", "ENTJ": "果断领航",
    "ESFP": "活力即兴", "ESFJ": "温暖关怀", "ESTP": "行动冒险", "ESTJ": "务实执行",
    "INFP": "内在追寻", "INFJ": "深度理解", "INTP": "理性思辨", "INTJ": "战略布局",
    "ISFP": "细腻感知", "ISFJ": "守护温暖", "ISTP": "独立解决", "ISTJ": "可靠秩序",
}

# 旅行风格映射
_TRAVEL_STYLES: Dict[str, str] = {
    "ENFP": "随性探索型", "ENFJ": "共鸣体验型", "ENTP": "智趣发现型", "ENTJ": "高效领航型",
    "ESFP": "活力即兴型", "ESFJ": "社交分享型", "ESTP": "冒险挑战型", "ESTJ": "计划执行型",
    "INFP": "心灵漫游型", "INFJ": "意义追寻型", "INTP": "深度研究型", "INTJ": "战略规划型",
    "ISFP": "艺术感知型", "ISFJ": "守护体验型", "ISTP": "独立探索型", "ISTJ": "秩序巡旅型",
}

# MBTI dealbreaker/rule 生成
_MBTI_DEALBREAKERS: Dict[str, List[str]] = {
    "ENFP": ["计划太紧的行程", "没有自由探索空间", "被打断即兴想法"],
    "ENFJ": ["冷漠疏离的旅伴", "破坏和谐的氛围", "无视他人感受"],
    "ENTP": ["没有讨论和辩论空间", "被强制接受单一观点", "无聊重复的内容"],
    "ENTJ": ["低效拖延的行为", "没有明确目标", "决策被反复推翻"],
    "ESFP": ["过于严肃压抑的氛围", "没有即兴发挥的空间", "长时间独处"],
    "ESFJ": ["被忽视和不被认可", "旅伴不参与社交", "破坏团队氛围"],
    "ESTP": ["过于理论化不落地", "没有刺激和挑战", "被过度约束"],
    "ESTJ": ["混乱无计划", "不遵守承诺", "做事没有条理"],
    "INFP": ["价值观冲突", "被强制改变内心想法", "不真诚的关系"],
    "INFJ": ["被误解和不被理解", "持续的负能量", "精神压力过大"],
    "INTP": ["被强制输出结论", "没有思考独处空间", "逻辑漏洞被忽视"],
    "INTJ": ["决策被无理推翻", "没有战略意义的忙碌", "被要求服从多数"],
    "ISFP": ["被强制审美", "不自由的行程安排", "被忽视的感官体验"],
    "ISFJ": ["被否定过去的付出", "不尊重隐私", "需要帮助时没人响应"],
    "ISTP": ["被强制社交", "不尊重独立解决问题的空间", "被迫做不擅长的事"],
    "ISTJ": ["违反已约定的计划", "做事不负责任", "不尊重传统和规则"],
}


def _get_mbti_dim(dims: Dict[str, str], framework: Dict[str, Any], dim_name: str) -> Dict[str, Any]:
    """从 framework 中获取指定维度的映射数据"""
    key = dims.get(dim_name, "")
    return framework.get(dim_name, {}).get(key, {})


def _merge_interests_into_prompt(interests: List[str], mbti: str, city: str, voice: str) -> str:
    """将 interests/city/voice 合并为一个描述性提示"""
    parts = []
    city_name = _CITY_NAMES.get(city, city or "")
    if city_name:
        parts.append(f"向往{city_name}")
    if interests:
        interest_str = "、".join(interests[:3])
        parts.append(f"热爱{interest_str}")
    if voice and len(voice.strip()) > 5:
        # 从 voiceText 提取关键词（去除无意义的语气词）
        clean = voice.strip()
        if len(clean) > 50:
            clean = clean[:50] + "..."
        parts.append(f"自我描述：{clean}")
    return "，".join(parts) if parts else ""


def _build_layer0_rules(mbti: str, interests: List[str]) -> List[str]:
    """基于 MBTI 类型 + interests 生成 layer0 硬规则"""
    base = _MBTI_DEALBREAKERS.get(mbti.upper(), ["真诚互动"])
    # 加入 interests 中的城市作为 must-have
    city_rules = [f"喜欢去{it}" for it in interests if it in _CITY_NAMES]
    return base[:3] + city_rules[:2]


def _build_identity(mbti: str, dims: Dict[str, str], city: str, interests: List[str], voice: str) -> Dict[str, Any]:
    """L1-identity: 认知维度 → 身份层"""
    cog = _get_mbti_dim(dims, _COGNITION_MAP, "energy")
    inf = _get_mbti_dim(dims, _COGNITION_MAP, "information")
    dec = _get_mbti_dim(dims, _COGNITION_MAP, "decision")
    lif = _get_mbti_dim(dims, _COGNITION_MAP, "lifestyle")
    city_name = _CITY_NAMES.get(city, "")
    label = _MBTI_LABELS.get(mbti.upper(), mbti)
    keyword = _MBTI_KEYWORDS.get(mbti.upper(), "")
    extras = _merge_interests_into_prompt(interests, mbti, city, voice)
    content = f"你是{label}。{cog.get('keyword', '')}，{inf.get('keyword', '')}，{dec.get('keyword', '')}，{lif.get('keyword', '')}。"
    if extras:
        content += f" {extras}"
    if city_name:
        content += f" 向往{city_name}，期待在那里找到属于自己的旅行体验。"
    return {
        "title": "身份层",
        "content": content.strip(),
        "emoji": _MBTI_EMOJI.get(mbti.upper(), "🤖"),
    }


def _build_speaking_style(mbti: str, dims: Dict[str, str], interests: List[str], voice: str) -> Dict[str, Any]:
    """L2-speaking_style: 表达维度 → 说话风格"""
    eng = _get_mbti_dim(dims, _EXPRESSION_MAP, "energy")
    inf = _get_mbti_dim(dims, _EXPRESSION_MAP, "information")
    dec = _get_mbti_dim(dims, _EXPRESSION_MAP, "decision")
    lif = _get_mbti_dim(dims, _EXPRESSION_MAP, "lifestyle")

    # 合并 typical_phrases（取各维度 + voiceText 中的）
    base_phrases = eng.get("typical_phrases", [])[:2]
    dec_phrases = dec.get("typical_phrases", [])[:1]
    if voice and len(voice.strip()) > 2:
        base_phrases.append(voice.strip()[:20])
    if interests:
        base_phrases.append(f"喜欢{interests[0]}")
    typical = list(dict.fromkeys(base_phrases + dec_phrases))[:5]
    # chat_tone
    if dims["decision"] == "F":
        tone = "温暖共情"
    elif dims["energy"] == "E":
        tone = "热情活泼"
    else:
        tone = "沉稳内敛"
    return {
        "title": "说话风格",
        "content": f"{eng.get('verbosity', '')}，{dec.get('structure', '')}。{lif.get('conclusion', '')}",
        "emoji": "💬",
        "typical_phrases": typical,
        "chat_tone": tone,
    }


def _build_emotion_decision(mbti: str, dims: Dict[str, str], interests: List[str], voice: str) -> Dict[str, Any]:
    """L3-emotion_decision: 行为维度 → 情绪与决策"""
    beh_eng = _get_mbti_dim(dims, _BEHAVIOR_MAP, "energy")
    beh_dec = _get_mbti_dim(dims, _BEHAVIOR_MAP, "decision")
    beh_lif = _get_mbti_dim(dims, _BEHAVIOR_MAP, "lifestyle")
    emo_eng = _get_mbti_dim(dims, _EMOTION_MAP, "energy")
    emo_dec = _get_mbti_dim(dims, _EMOTION_MAP, "decision")
    emo_lif = _get_mbti_dim(dims, _EMOTION_MAP, "lifestyle")

    stress = beh_dec.get("stress_response", "冷静分析") + "，" + beh_lif.get("stress", "需要计划")
    decision_style = dims["decision"].lower() + ("-cautious" if dims["lifestyle"] == "J" else "-adaptive")

    return {
        "title": "情绪与决策",
        "content": f"{emo_dec.get('emotion_display', '')}，{emo_lif.get('comfort_mechanism', '')}。{emo_eng.get('recharge_needs', '')}",
        "emoji": "💭",
        "stress_response": stress,
        "decision_style": decision_style,
    }


def _build_social_behavior(mbti: str, dims: Dict[str, str], interests: List[str]) -> Dict[str, Any]:
    """L4-social_behavior: 行为维度 → 社交行为"""
    eng = _get_mbti_dim(dims, _BEHAVIOR_MAP, "energy")
    inf = _get_mbti_dim(dims, _BEHAVIOR_MAP, "information")
    dec = _get_mbti_dim(dims, _BEHAVIOR_MAP, "decision")

    social_style = eng.get("social_energy", "平衡型社交")
    if dims["energy"] == "E":
        social_style += "，主动发起"
    else:
        social_style += "，被动响应"
    return {
        "title": "社交行为",
        "content": f"{eng.get('initiation', '')}，{inf.get('exploration', '')}。{dec.get('support_style', '')}",
        "emoji": "🤝",
        "social_style": social_style,
    }


def _build_persona_from_onboarding(
    mbti: str,
    city: str,
    interests: Optional[List[str]] = None,
    voice_text: Optional[str] = None,
) -> Dict[str, Any]:
    """
    根据 Onboarding 数据（MBTI + interests + city + voiceText）动态生成 Persona。

    优先使用 LLM 生成丰富的 persona 结构（persona_generator.py）。
    LLM 不可用时 fallback 到硬编码的 MBTI 映射表。

    参数:
        mbti: MBTI 类型（如 ENFP）
        city: 城市 ID（如 dali）
        interests: 兴趣标签列表
        voice_text: 用户语音转文字内容
    """
    mbti = mbti.strip().upper()
    if len(mbti) < 4:
        mbti = "ENFP"
    mbti_lower = mbti.lower()
    interests = interests or []
    voice_text = voice_text or ""

    # ── 1. 尝试 LLM 生成 ──────────────────────────────────────────────────
    llm_persona = generate_persona_from_onboarding(
        mbti=mbti,
        interests=interests,
        voice_text=voice_text,
        city=city,
    )

    if llm_persona:
        # 合并 LLM 生成的数据与前端所需的必要元字段
        fingerprint = f"twin-{mbti_lower}-{uuid.uuid4().hex[:8]}"
        persona_id = f"persona-{mbti_lower}-{uuid.uuid4().hex[:8]}"
        label = _MBTI_LABELS.get(mbti, mbti)
        keyword = _MBTI_KEYWORDS.get(mbti, "")
        city_name = _CITY_NAMES.get(city.lower(), city or "未选择")
        travel_style_fallback = _TRAVEL_STYLES.get(mbti, "随性探索型")

        # avatar_prompt
        prompt_parts = [keyword, label]
        if interests:
            prompt_parts.append("热爱" + "、".join(interests[:3]))
        if city_name and city_name != "未选择":
            prompt_parts.append(f"向往{city_name}")
        if voice_text and len(voice_text.strip()) > 5:
            prompt_parts.append("真实自我描述：" + voice_text.strip()[:30])
        avatar_prompt = "，".join(prompt_parts)

        # layer0 硬规则
        layer0_hard_rules = _build_layer0_rules(mbti, interests)

        # travel_style 可能是 dict（LLM返回）或 str
        travel_style_val = llm_persona.get("travel_style", "")
        if isinstance(travel_style_val, dict):
            travel_style_str = travel_style_val.get("overall", travel_style_fallback)
        else:
            travel_style_str = str(travel_style_val) or travel_style_fallback

        # mbti_influence
        mbti_influence = llm_persona.get(
            "mbti_influence",
            f"MBTI={mbti}，{keyword}，{label}。城市探索偏好：{city_name}。旅行风格：{travel_style_str}。",
        )

        # confidence_score：LLM 生成时更高
        data_sources = ["mbti", "llm"]
        if interests:
            data_sources.append("interests")
        if voice_text and len(voice_text.strip()) > 5:
            data_sources.append("voice_text")
        if llm_persona.get("_fallback"):
            confidence = 0.70
        else:
            confidence = 0.90

        return {
            "persona_id": persona_id,
            "name": label,
            "avatar_prompt": avatar_prompt,
            "avatar_emoji": _MBTI_EMOJI.get(mbti, "🤖"),
            "layer0_hard_rules": layer0_hard_rules,
            "mbti_influence": mbti_influence,
            "travel_style": travel_style_str,
            "soul_fingerprint": fingerprint,
            "confidence_score": confidence,
            "data_sources_used": data_sources,
            # LLM 生成的完整结构
            "identity": llm_persona.get("identity", {}),
            "speaking_style": llm_persona.get("speaking_style", {}),
            "emotion_decision": llm_persona.get("emotion_decision", {}),
            "social_behavior": llm_persona.get("social_behavior", {}),
            # 扩展字段（如果 LLM 返回了的话）
            "negotiation_style": llm_persona.get("negotiation_style", {}),
            "preferences": llm_persona.get("preferences", {}),
            "conversation_examples": llm_persona.get("conversation_examples", {}),
            "compatibility_notes": llm_persona.get("compatibility_notes", {}),
            "travel_style_detail": (
                llm_persona.get("travel_style")
                if isinstance(llm_persona.get("travel_style"), dict)
                else {}
            ),
        }

    # ── 2. Fallback：使用硬编码 MBTI 映射表 ────────────────────────────────
    return _build_persona_from_mbti(mbti, interests, city, voice_text)


def _build_persona_from_mbti(
    mbti: str,
    interests: List[str],
    city: str,
    voice_text: str,
) -> Dict[str, Any]:
    """
    Fallback 路径：使用硬编码的 MBTI 映射表生成 persona。
    当 LLM 完全不可用时使用此函数。
    """
    mbti = mbti.strip().upper()
    if len(mbti) < 4:
        mbti = "ENFP"
    mbti_lower = mbti.lower()

    # 尝试加载 Mock 数据
    mock = _load_mock_persona(mbti)

    # 解析 MBTI 四个维度
    dims = _parse_mbti_dimensions(mbti)

    # 生成唯一指纹
    fingerprint = f"twin-{mbti_lower}-{uuid.uuid4().hex[:8]}"
    persona_id = f"persona-{mbti_lower}-{uuid.uuid4().hex[:8]}"
    label = _MBTI_LABELS.get(mbti, mbti)
    keyword = _MBTI_KEYWORDS.get(mbti, "")
    travel_style = _TRAVEL_STYLES.get(mbti, "随性探索型")

    # city emoji
    city_name = _CITY_NAMES.get(city.lower(), city or "未选择")

    # avatar_prompt：综合 MBTI + interests + city
    prompt_parts = [keyword, label]
    if interests:
        prompt_parts.append("热爱" + "、".join(interests[:3]))
    if city_name and city_name != "未选择":
        prompt_parts.append(f"向往{city_name}")
    if voice_text and len(voice_text.strip()) > 5:
        prompt_parts.append("真实自我描述：" + voice_text.strip()[:30])
    avatar_prompt = "，".join(prompt_parts)

    # layer0 硬规则
    layer0_hard_rules = _build_layer0_rules(mbti, interests)

    # 动态生成 L1-L4 层
    identity = _build_identity(mbti, dims, city, interests, voice_text)
    speaking_style = _build_speaking_style(mbti, dims, interests, voice_text)
    emotion_decision = _build_emotion_decision(mbti, dims, interests, voice_text)
    social_behavior = _build_social_behavior(mbti, dims, interests)

    # Mock 数据补充（如果有的话，merge 而非覆盖）
    if mock:
        # identity 使用 mock 中的（更完整），但更新 emoji
        identity = {**mock.get("identity", {}), "emoji": _MBTI_EMOJI.get(mbti, "🤖")}
        # speaking_style 使用 mock 中的 typical_phrases
        mock_ss = mock.get("speaking_style", {})
        speaking_style = {
            **speaking_style,
            **{k: v for k, v in mock_ss.items() if k not in speaking_style or not speaking_style[k]},
        }
        # 其他层优先用 mock
        for key in ["emotion_decision", "social_behavior"]:
            if key in mock:
                if isinstance(mock[key], dict):
                    emotion_decision = mock[key] if key == "emotion_decision" else emotion_decision
                    social_behavior = mock[key] if key == "social_behavior" else social_behavior

    # confidence_score：根据数据来源计算
    data_sources = ["mbti"]
    if interests:
        data_sources.append("interests")
    if voice_text and len(voice_text.strip()) > 5:
        data_sources.append("voice_text")
    if mock:
        data_sources.append("mock_data")
        confidence = 0.85
    elif interests and voice_text:
        confidence = 0.75
    elif interests or voice_text:
        confidence = 0.65
    else:
        confidence = 0.50

    # mbti_influence 描述
    mbti_influence = (
        f"MBTI={mbti}，{keyword}，{label}。"
        f"城市探索偏好：{city_name}。"
        f"旅行风格：{travel_style}。"
        f"沟通基调：{speaking_style.get('chat_tone', '')}。"
    )

    # 组装完整 Persona（前端 types/index.ts 中定义的完整字段）
    persona = {
        "persona_id": persona_id,
        "name": label,
        "avatar_prompt": avatar_prompt,
        "avatar_emoji": _MBTI_EMOJI.get(mbti, "🤖"),
        "layer0_hard_rules": layer0_hard_rules,
        # L1
        "identity": identity,
        # L2
        "speaking_style": speaking_style,
        # L3
        "emotion_decision": emotion_decision,
        # L4
        "social_behavior": social_behavior,
        # meta
        "travel_style": travel_style,
        "mbti_influence": mbti_influence,
        "soul_fingerprint": fingerprint,
        "confidence_score": confidence,
        "data_sources_used": data_sources,
    }

    return persona


def _build_negotiation_result(city: str, user_mbti: str, buddy_mbti: str) -> Dict[str, Any]:
    """
    根据目的地 + 用户MBTI + 搭子MBTI 构建协商结果。
    优先使用预生成协商数据，fallback 到动态生成。
    """
    city_name = _CITY_NAMES.get(city, city or "大理")
    compat = _load_compatibility(user_mbti, buddy_mbti)
    buddy_config = _BUDDY_CONFIGS.get(buddy_mbti.lower(), _BUDDY_CONFIGS["enfp"])
    user_config = _BUDDY_CONFIGS.get(user_mbti.lower(), _BUDDY_CONFIGS["enfp"])

    if compat:
        overall = compat["overall_score"]
        rounds = compat.get("rounds", [])
        radar = [
            {"dimension": "行程节奏", "user_score": 90, "buddy_score": 75, "weight": 0.8},
            {"dimension": "美食偏好", "user_score": 80, "buddy_score": 85, "weight": 0.6},
            {"dimension": "拍照风格", "user_score": 70, "buddy_score": 90, "weight": 0.5},
            {"dimension": "预算控制", "user_score": 75, "buddy_score": 80, "weight": 0.7},
            {"dimension": "冒险精神", "user_score": 85, "buddy_score": 65, "weight": 0.9},
        ]
        red_flags = compat.get("challenges", [])[:2]
        messages = [
            {"speaker": "user", "content": f"我想去{city_name}旅行，探索当地的美食！", "timestamp": 1700000000},
            {"speaker": "buddy", "content": buddy_config["typical_phrases"][0], "timestamp": 1700000010},
            {"speaker": "user", "content": "太好了！那我们一起做攻略吧~", "timestamp": 1700000020},
            {"speaker": "buddy", "content": buddy_config["typical_phrases"][1] if len(buddy_config["typical_phrases"]) > 1 else "没问题！", "timestamp": 1700000030},
        ]
        plan = [
            f"{city_name}古城民宿2晚",
            f"{city_name}周边自然风光1天",
            "特色美食探索之旅",
            "轻松休闲一日",
        ]
        return _ensure_negotiation_payload({
            "destination": city_name,
            "dates": "5月10日-5月15日",
            "budget": "人均3500元",
            "consensus": overall > 0.6,
            "plan": plan,
            "matched_buddies": [user_config["name"], buddy_config["name"]],
            "radar": radar,
            "red_flags": red_flags,
            "messages": messages,
            "analysis_report": compat.get("recommendation", "匹配度较好，建议围绕共同偏好展开行程。"),
            "analysis_basis": {
                "input_tags": [],
                "strengths": compat.get("strengths", [])[:3],
                "conflicts": compat.get("challenges", [])[:3],
            },
        })
    else:
        return _ensure_negotiation_payload({
            "destination": city_name,
            "dates": "待定",
            "budget": "待定",
            "consensus": False,
            "plan": [],
            "matched_buddies": [user_config["name"], buddy_config["name"]],
            "radar": [],
            "red_flags": ["数据不足，请补充更多信息"],
            "messages": [],
            "analysis_report": "当前信息不足，建议补充兴趣标签后重新协商。",
            "analysis_basis": {"input_tags": [], "strengths": [], "conflicts": ["输入信息不足"]},
        })


# ---------------------------------------------------------------------------
# 路由实现
# ---------------------------------------------------------------------------


@router.post("/onboarding")
async def save_onboarding(req: OnboardingDataRequest) -> Dict[str, Any]:
    """
    POST /api/onboarding

    保存用户引导数据（MBTI + 兴趣 + 语音 + 城市）。
    调用 MiniMax LLM 生成 persona .md 文件（YAML frontmatter + Markdown body），
    同时保留内存字典以支持向后兼容。
    """
    import logging
    logger = logging.getLogger("twinbuddy.api")

    user_id = str(uuid.uuid4())
    data = req.model_dump()
    _onboarding_store[user_id] = data

    # 生成 persona .md 文件（调用 MiniMax LLM）
    doc, _, doc_path = persona_doc.generate_persona_doc(
        mbti=req.mbti,
        city=req.city,
        interests=req.interests,
        voice_text=req.voiceText,
        user_id=user_id,
    )

    # 构建内存 persona dict（用于向后兼容和快速读取）
    persona = _build_persona_from_onboarding(
        mbti=req.mbti,
        city=req.city,
        interests=req.interests,
        voice_text=req.voiceText,
    )
    # 如果 LLM 生成成功，用 frontmatter 补充内存 dict 的 prefs 字段
    if doc:
        fm = persona_doc.extract_frontmatter(doc)
        if fm:
            prefs = persona_doc.default_prefs_from_frontmatter(fm)
            persona = {**persona, **prefs}
    persona["persona_id"] = persona.get("persona_id") or f"persona-{req.mbti.lower()}-{user_id[:8]}"
    _persona_store[user_id] = persona

    # 异步持久化到文件（不阻塞响应）
    _save_store_async(_ONBOARDING_STORE_FILE, _onboarding_store)
    _save_store_async(_PERSONA_STORE_FILE, _persona_store)

    if doc:
        logger.info("Persona .md 已生成: %s", doc_path)
    else:
        logger.warning("Persona LLM 生成失败，使用规则生成 fallback | user_id=%s", user_id)

    return {
        "success": True,
        "data": {"user_id": user_id, "persona_id": persona["persona_id"]},
        "meta": {"message": "已保存", "doc_path": str(doc_path) if doc_path else ""},
    }


@router.get("/persona")
async def get_persona(user_id: str = Query(...)) -> Dict[str, Any]:
    """
    GET /api/persona?user_id=xxx

    获取当前用户的数字孪生人格。
    读取顺序：1) persona .md 文件  2) 内存 persona_store  3) 从 onboarding 重新生成
    """
    # 1. 尝试从 .md 文件读取
    md_doc = persona_doc.load_persona_doc(user_id)
    if md_doc:
        fm, body = persona_doc.parse_persona_doc(md_doc)
        if fm:
            persona = persona_doc.dict_from_frontmatter(fm, body)
            return {"success": True, "data": persona}

    # 2. 尝试从内存读取
    if user_id in _persona_store:
        return {"success": True, "data": _persona_store[user_id]}

    # 3. 从 onboarding 重新生成
    if user_id in _onboarding_store:
        onboarding = _onboarding_store[user_id]
        persona = _build_persona_from_onboarding(
            mbti=onboarding.get("mbti", "ENFP"),
            city=onboarding.get("city", ""),
            interests=onboarding.get("interests"),
            voice_text=onboarding.get("voiceText"),
        )
        _persona_store[user_id] = persona
        return {"success": True, "data": persona}

    raise HTTPException(status_code=404, detail="未找到用户数据，请先完成引导")


@router.get("/feed")
async def get_feed(
    city: Optional[str] = Query(None),
    user_id: Optional[str] = Query(None),
) -> Dict[str, Any]:
    """
    GET /api/feed?city=xxx&user_id=xxx

    返回视频 Feed 列表：
      - 视频 1-2：普通内容（无搭子信息）
      - 视频 3-5：懂你卡片触发（有真实兼容性评分 + 雷达图数据）

    当 user_id 存在时：
      1. 从 onboarding_store 获取用户 MBTI/interests/city 数据
      2. 调用 get_top_buddies(user_prefs, limit=10) 获取 top-10 搭子
      3. 按兼容性分数在视频中插入懂你卡片（分数 >= 60 触发）
      4. 返回 user_prefs 供前端使用

    city 参数用于过滤目的地相关性（预留）。
    """
    # 1. 加载视频数据
    videos = _load_mock_videos()

    # 2. 构建用户偏好（优先从 onboarding store，fallback 到 persona .md 文件）
    user_prefs: Optional[Dict[str, Any]] = None
    onboarding: Optional[Dict[str, Any]] = None

    if user_id:
        if user_id in _onboarding_store:
            onboarding = _onboarding_store[user_id]
            user_prefs = _build_user_prefs(onboarding, user_id)
        else:
            # 服务器重启后：onboarding_store 可能有数据，但 user_id 不在当前内存
            # 尝试直接从 persona .md 文件读取
            md_prefs = persona_doc.get_persona_for_algorithm(user_id)
            if md_prefs:
                user_prefs = md_prefs

    # 3. 获取 top-N 搭子（使用 MING 六维度评分）
    top_buddies: List[Dict[str, Any]] = []
    if user_prefs:
        top_buddies = get_top_buddies(user_prefs, limit=10)
    else:
        # 无用户数据时：加载前3个搭子作为示例
        all_b = get_all_buddies()
        top_buddies = all_b[:3]

    # 4. 在懂你卡片视频中插入搭子数据
    #    兼容性分数 >= 60 时触发懂你卡片，否则显示为普通视频
    CARD_TRIGGER_THRESHOLD = 60.0

    # Guest 用户的默认评分偏好（用于在没有 user_prefs 时展示兼容性分数）
    _GUEST_PREFS = {
        "mbti": "ENFP",
        "travel_style": "随性探索型",
        "preferences": {"likes": ["美食", "拍照", "自然风光"], "dislikes": ["暴走"], "pace": "慢悠悠"},
    }

    enriched_videos = []
    for i, video in enumerate(videos):
        v = dict(video)

        # 确定是否应该触发懂你卡片
        is_twin_card = v.get("type") == "twin_card"

        if is_twin_card:
            buddy_idx = i - 2  # 0-based index within twin_card slots (v3=0, v4=1, v5=2)
            if buddy_idx < len(top_buddies):
                buddy = top_buddies[buddy_idx]
                score = buddy.get("_score", 0.0)
                # Guest 用户：实时计算相对于默认 ENFP 的兼容性分数
                if user_prefs is None:
                    score = round(_mock_compat_breakdown(_GUEST_PREFS, buddy)["total"], 1)
                    buddy_with_score = dict(buddy, _score=score)
                else:
                    buddy_with_score = dict(buddy, _score=score)

                # 低于触发阈值，降级为普通视频（仅对登录用户应用；guest 展示所有卡片）
                if user_prefs is not None and score < CARD_TRIGGER_THRESHOLD:
                    v["type"] = "video"
                    v["buddy"] = None
                else:
                    v["buddy"] = get_buddy_public(buddy_with_score, user_prefs)
                    v["location"] = city or _CITY_NAMES.get(
                        onboarding.get("city", "") if onboarding else "", v.get("location", "大理")
                    )
            else:
                # 没有更多搭子（logged-in user 降级；guest 保持类型）
                if user_prefs is not None:
                    v["type"] = "video"
                v["buddy"] = None
        # 普通视频保持原样

        enriched_videos.append(v)

    return {
        "success": True,
        "data": enriched_videos,
        "buddies": [get_buddy_public(b, user_prefs) for b in top_buddies[:10]],
        "user_prefs": user_prefs,
        "meta": {
            "total": len(enriched_videos),
            "city": city or "all",
            "user_id": user_id,
            "buddy_count": len(top_buddies),
        },
    }


@router.get("/buddies")
async def get_buddies(
    user_id: Optional[str] = Query(default=None),
    limit: int = Query(default=10, ge=1, le=100),
) -> Dict[str, Any]:
    """
    GET /api/buddies?limit=10
    GET /api/buddies?user_id=xxx&limit=10  （带评分排序）

    无 user_id：返回所有搭子（无评分）
    有 user_id：返回按 MING 六维度兼容性评分排序的推荐搭子

    响应结构：
      {
        "success": true,
        "buddies": [
          {
            "id": "buddy_01",
            "name": "小满",
            "mbti": "ENFP",
            "avatar_emoji": "✨",
            "travel_style": "...",
            "typical_phrases": [...],
            "compatibility_score": 87.5,
            ...
          },
          ...
        ],
        "user_prefs": {...},
        "meta": {...}
      }
    """
    # 1. 构建 user_prefs（如果提供了 user_id）
    user_prefs: Optional[Dict[str, Any]] = None
    if user_id:
        if user_id in _onboarding_store:
            onboarding = _onboarding_store[user_id]
            user_prefs = _build_user_prefs(onboarding, user_id)
        else:
            # 尝试从 persona .md 读取
            md_prefs = persona_doc.get_persona_for_algorithm(user_id)
            if md_prefs:
                user_prefs = md_prefs

    # 2. 获取搭子列表
    if user_prefs:
        # 有用户数据 → 六维度评分排序
        top_buddies = get_top_buddies(user_prefs, limit=limit)
        buddies_data = [get_buddy_public(buddy, user_prefs) for buddy in top_buddies]
    else:
        # 无用户数据 → 返回全部搭子（无评分）
        all_buddies = get_all_buddies()
        buddies_data = [
            {
                "id": b.get("id", ""),
                "name": b.get("name", ""),
                "mbti": b.get("mbti", ""),
                "avatar_emoji": b.get("avatar_emoji", ""),
                "avatar_prompt": b.get("avatar_prompt", ""),
                "travel_style": b.get("travel_style", ""),
                "typical_phrases": b.get("speaking_style", {}).get("typical_phrases", [])
                                 if isinstance(b.get("speaking_style"), dict)
                                 else b.get("typical_phrases", []),
            }
            for b in all_buddies[:limit]
        ]

    return {
        "success": True,
        "buddies": buddies_data,
        "user_prefs": user_prefs,
        "meta": {
            "user_id": user_id,
            "limit": limit,
            "total_buddies": len(buddies_data),
            "mbti": user_prefs.get("mbti") if user_prefs else None,
            "city": user_prefs.get("city") if user_prefs else None,
        },
    }


@router.post("/negotiate")
async def negotiate(req: NegotiationRequest) -> Dict[str, Any]:
    """
    POST /api/negotiate

    双数字人协商：
      - 用户端：优先从 persona .md 文件读取，其次查内存 _persona_store
      - Buddy端：优先从 .md 文件读取（persona_doc.get_buddy_doc），
                 其次从 buddies/ JSON 加载，最后 fallback 到规则生成
      - LLM 调用失败时降级到 Mock 数据
    """
    import logging
    logger = logging.getLogger("twinbuddy.api")

    city = req.destination or "dali"
    city_name = _CITY_NAMES.get(city, city or "大理")
    requested_mbti = (req.mbti or "").strip().upper()
    requested_interests = [str(x).strip() for x in (req.interests or []) if str(x).strip()]
    requested_voice = (req.voiceText or "").strip()

    # ── 获取用户 persona（优先 .md 文件，其次内存）────────────────────
    user_persona: Optional[Dict[str, Any]] = None
    user_mbti = requested_mbti or "ENFP"
    user_name = "你"

    if req.user_persona_id:
        # 方式1：从内存找到后，尝试升级到 .md 文件
        for uid_key, p in _persona_store.items():
            if p.get("persona_id") == req.user_persona_id:
                md_doc = persona_doc.load_persona_doc(uid_key)
                if md_doc:
                    fm, body = persona_doc.parse_persona_doc(md_doc)
                    if fm:
                        user_persona = persona_doc.dict_from_frontmatter(fm, body)
                        user_name = str(user_persona.get("name") or user_name)
                        user_mbti = fm.get("mbti", user_mbti)
                        break
                user_persona = p
                user_name = str(p.get("name") or user_name)
                user_mbti = (
                    _extract_mbti(str(p.get("mbti_influence") or ""))
                    or _extract_mbti(str(p.get("mbti_type") or ""))
                    or user_mbti
                )
                break

    # 方式2：通过 user_id 直接关联后端持久化数据
    if not user_persona and req.user_id:
        md_doc = persona_doc.load_persona_doc(req.user_id)
        if md_doc:
            fm, body = persona_doc.parse_persona_doc(md_doc)
            if fm:
                user_persona = persona_doc.dict_from_frontmatter(fm, body)
                user_name = str(user_persona.get("name") or user_name)
                user_mbti = fm.get("mbti", user_mbti)

        if not user_persona and req.user_id in _persona_store:
            p = _persona_store[req.user_id]
            user_persona = p
            user_name = str(p.get("name") or user_name)
            user_mbti = (
                _extract_mbti(str(p.get("mbti_influence") or ""))
                or _extract_mbti(str(p.get("mbti_type") or ""))
                or user_mbti
            )

        if not user_persona and req.user_id in _onboarding_store:
            onboarding = _onboarding_store[req.user_id]
            user_mbti = str(onboarding.get("mbti") or user_mbti).upper()
            user_persona = _build_persona_from_onboarding(
                user_mbti,
                str(onboarding.get("city") or city),
                onboarding.get("interests") or [],
                str(onboarding.get("voiceText") or ""),
            )

    if requested_mbti:
        user_mbti = requested_mbti

    # ── 获取 Buddy persona（优先 .md 文件，其次 JSON，最后规则生成）──
    buddy_mbti = (req.buddy_mbti or "INFP").upper()
    buddy_config = _BUDDY_CONFIGS.get(buddy_mbti.lower(), _BUDDY_CONFIGS["enfp"])

    # 方式1：从 buddy .md 文件加载（persona_doc 统一接口）
    buddy_md = persona_doc.get_buddy_doc(f"buddy_{buddy_mbti.lower()}") if req.buddy_mbti else None
    if buddy_md:
        fm, body = persona_doc.parse_persona_doc(buddy_md)
        twin_persona = persona_doc.dict_from_frontmatter(fm, body) if fm else None
    else:
        twin_persona = None

    # 方式2：从 buddies/ JSON 加载
    if not twin_persona:
        twin_persona = _load_mock_persona(buddy_mbti)

    # 方式3：fallback 到规则生成
    if not twin_persona:
        import uuid as _uuid
        twin_persona = {
            "persona_id": f"persona-{buddy_mbti.lower()}-{_uuid.uuid4().hex[:8]}",
            "mbti_type": buddy_mbti,
            "travel_style": buddy_config["travel_style"],
            "speaking_style": {
                "chat_tone": "温和细腻",
                "typical_phrases": buddy_config["typical_phrases"],
            },
            "mbti_dimension_evidence": {"energy": "introvert", "lifestyle": "perceiving"},
        }

    # 尝试 LLM 真实协商
    try:
        from negotiation.graph import run_negotiation

        # 优先从请求与历史记录中提取标签/语音上下文
        context_interests = list(requested_interests)
        context_voice = requested_voice
        if req.user_id and req.user_id in _onboarding_store:
            onboarding = _onboarding_store[req.user_id]
            if not context_interests:
                context_interests = [
                    str(x).strip() for x in (onboarding.get("interests") or []) if str(x).strip()
                ]
            if not context_voice:
                context_voice = str(onboarding.get("voiceText") or "").strip()

        # 使用的人格数据（优先用户 persona，fallback 到动态生成）
        if user_persona:
            active_user_persona = dict(user_persona)
        else:
            active_user_persona = _build_persona_from_onboarding(
                user_mbti,
                city,
                context_interests,
                context_voice,
            )

        # 将前端标签与语音上下文注入 persona，供 LLM 协商 prompt 使用
        if context_interests:
            active_user_persona["interest_tags"] = context_interests[:12]
            identity = active_user_persona.get("identity", {})
            if isinstance(identity, dict):
                raw_core = identity.get("core_values", [])
                core_values = [str(x).strip() for x in raw_core if str(x).strip()] if isinstance(raw_core, list) else []
                identity["core_values"] = list(dict.fromkeys(context_interests + core_values))[:12]
                active_user_persona["identity"] = identity
        if context_voice:
            active_user_persona["voice_text"] = context_voice

        # 构建 user_prefs 以计算兼容性分解（供 LLM 深度注入）
        user_prefs_for_compat: Optional[Dict[str, Any]] = None
        try:
            user_prefs_for_compat = _build_user_prefs_from_persona(active_user_persona)
        except Exception:
            pass

        if user_prefs_for_compat is None:
            user_prefs_for_compat = {}
        if user_mbti and not user_prefs_for_compat.get("mbti"):
            user_prefs_for_compat["mbti"] = user_mbti
        if context_interests:
            user_prefs_for_compat["likes"] = context_interests
        if requested_mbti:
            user_prefs_for_compat["mbti"] = requested_mbti
        if req.travel_style:
            user_prefs_for_compat["travel_style"] = req.travel_style

        # 计算协商兼容性分解（包含 total/strengths/red_flags/easy_to_compromise）
        compat_breakdown = _get_negotiation_compatibility_breakdown(
            user_prefs_for_compat, twin_persona
        )

        langgraph_result = run_negotiation(
            active_user_persona,
            twin_persona,
            user_compatibility_breakdown=compat_breakdown,
        )
        rounds = langgraph_result.get("rounds", [])
        consensus_scores = langgraph_result.get("consensus_scores", {})
        final_report = langgraph_result.get("final_report", {})

        # 格式化为前端期望的结构
        messages = []
        for r in rounds:
            ts_base = 1700000000 + r["round_num"] * 100
            messages.append({"speaker": "user", "content": r.get("proposer_message", ""), "timestamp": ts_base})
            messages.append({"speaker": "buddy", "content": r.get("evaluator_message", ""), "timestamp": ts_base + 10})

        radar = []
        for i, (t, s) in enumerate(consensus_scores.items()):
            radar.append({
                "dimension": _NEGOTIATION_DIM_LABELS[i] if i < len(_NEGOTIATION_DIM_LABELS) else t,
                "user_score": int(s * 100),
                "buddy_score": int(s * 90),
                "weight": _NEGOTIATION_DIM_WEIGHTS[i] if i < len(_NEGOTIATION_DIM_WEIGHTS) else 0.7,
            })

        plan = final_report.get("strengths", []) if final_report else []
        if not plan:
            plan = [
                f"{city_name}古城民宿2晚",
                f"{city_name}周边自然风光1天",
                "特色美食探索之旅",
            ]

        overall = final_report.get("overall_score", 0.5) if final_report else 0.5
        final_tags = context_interests or (
            user_prefs_for_compat.get("likes", []) if isinstance(user_prefs_for_compat, dict) else []
        )
        result_data = {
            "destination": city_name,
            "dates": "5月10日-5月15日",
            "budget": "人均3500元",
            "consensus": overall > 0.5,
            "plan": plan,
            "matched_buddies": [user_name, buddy_config["name"]],
            "radar": radar,
            "red_flags": final_report.get("challenges", [])[:2] if final_report else [],
            "messages": messages,
            "analysis_report": final_report.get("recommendation", "") if final_report else "",
            "analysis_basis": {
                "input_tags": final_tags[:8] if isinstance(final_tags, list) else [],
                "strengths": final_report.get("strengths", [])[:3] if final_report else [],
                "conflicts": final_report.get("challenges", [])[:3] if final_report else [],
            },
        }
        result_data = _ensure_negotiation_payload(result_data)
        llm_source = "llm"
        try:
            from negotiation.llm_client import _KEYS as _LLM_KEYS
            if not _LLM_KEYS:
                llm_source = "llm_fallback"
        except Exception:
            pass

        logger.info("LLM 协商成功 | source=%s | overall=%.3f | rounds=%d", llm_source, overall, len(rounds))
        return {
            "success": True,
            "data": result_data,
            "meta": {
                "source": llm_source,
                "user_mbti": user_mbti,
                "buddy_mbti": buddy_mbti,
                "destination": city,
                "overall_score": overall,
                "tag_count": len(final_tags) if isinstance(final_tags, list) else 0,
            },
        }
    except Exception as exc:
        logger.warning("LLM 协商失败，降级到 Mock: %s", exc)
        # Fallback：使用 Mock 数据
        result = _build_negotiation_result(city, user_mbti, buddy_mbti)
        return {
            "success": True,
            "data": result,
            "meta": {
                "source": "mock",
                "user_mbti": user_mbti,
                "buddy_mbti": buddy_mbti,
                "destination": city,
            },
        }


@router.post("/stt")
async def speech_to_text(
    audio: UploadFile = File(...),
) -> Dict[str, Any]:
    """
    POST /api/stt

    语音转文字接口。
    接收音频文件，返回识别文本。
    目前返回占位文本，未来可接入真实 STT 服务。
    """
    import logging
    logger = logging.getLogger("twinbuddy.api")

    try:
        # 读取音频文件
        audio_bytes = await audio.read()
        logger.info("收到 STT 请求, audio_size=%d bytes", len(audio_bytes))

        # TODO: 接入真实 STT 服务（如 MiniMax、阿里云 ASR 等）
        # 目前返回占位文本，模拟语音识别成功
        placeholder_text = "（这是语音转文字的占位文本，请接入真实 STT 服务）"

        return {
            "success": True,
            "text": placeholder_text,
        }
    except Exception as exc:
        logger.error("STT 处理失败: %s", exc)
        return {
            "success": False,
            "text": "",
            "error": str(exc),
        }
