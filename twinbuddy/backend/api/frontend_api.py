# -*- coding: utf-8 -*-
"""
backend/api/frontend_api.py — TwinBuddy 前端对接 API
FastAPI 路由，为前端提供 Onboarding / Persona / Feed / Negotiate 接口

数据流：
  前端 localStorage → POST /api/onboarding → 存储到内存 session
  前端 localStorage → GET /api/persona → 从 session 加载 persona
  前端 GET /api/feed → 返回视频列表 + 搭子信息
  前端 POST /api/negotiate → 返回预生成协商结果

设计原则：
  - 不可变数据流：每个 handler 只读不解构输入
  - Mock 数据优先：所有核心路径使用预生成结果，避免 LLM 调用
  - 内存 session：MVP 阶段不持久化，重启后数据清空
"""

from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field, field_validator

# ---------------------------------------------------------------------------
# 路由
# ---------------------------------------------------------------------------

router = APIRouter(prefix="/api", tags=["前端对接"])

# ---------------------------------------------------------------------------
# 内存状态（MVP 阶段，重启清空）
# ---------------------------------------------------------------------------

# onboarding_data: { user_id: OnboardingData }
_onboarding_store: Dict[str, Dict[str, Any]] = {}

# persona_store: { user_id: Persona }
_persona_store: Dict[str, Dict[str, Any]] = {}

# ---------------------------------------------------------------------------
# Mock 数据路径
# ---------------------------------------------------------------------------

_MOCK_DIR = Path(__file__).parent.parent / "mock_personas"

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

# 搭子配置（4个 Mock 人格）
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
    user_persona_id: Optional[str] = None
    buddy_mbti: Optional[str] = None
    destination: str = Field(..., description="目的地城市ID")


# ---------------------------------------------------------------------------
# 辅助函数
# ---------------------------------------------------------------------------


def _load_mock_persona(mbti: str) -> Optional[Dict[str, Any]]:
    """加载指定 MBTI 的 Mock persona JSON"""
    mbti_lower = mbti.lower()
    path = _MOCK_DIR / mbti_lower / "persona.json"
    if path.exists():
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    return None


def _load_compatibility(a_mbti: str, b_mbti: str) -> Optional[Dict[str, Any]]:
    """加载两个 MBTI 之间的预生成协商结果"""
    combo = sorted([a_mbti.upper(), b_mbti.upper()])
    path = _MOCK_DIR / combo[0].lower() / f"compatibility_{combo[0].lower()}_{combo[1].lower()}.json"
    if path.exists():
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    return None


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


def _build_persona_from_onboarding(mbti: str, city: str) -> Dict[str, Any]:
    """
    根据 Onboarding 数据（MBTI 为主）生成前端期望的 Persona 结构。
    只用 MBTI，数据不足时 confidence_score 降低。
    """
    mock = _load_mock_persona(mbti)
    mbti_lower = mbti.lower()
    emoji = _MBTI_EMOJI.get(mbti.upper(), "🤖")
    label = _MBTI_LABELS.get(mbti.upper(), mbti)
    city_name = _CITY_NAMES.get(city, city or "未选择")
    fingerprint = f"twin-{mbti_lower}-{uuid.uuid4().hex[:8]}"

    if mock:
        layer0 = mock.get("layer0_hard_rules", {})
        if isinstance(layer0, dict):
            hard_rules = layer0.get("dealbreakers", []) + layer0.get("must_haves", [])
        else:
            hard_rules = layer0 if isinstance(layer0, list) else []
    else:
        hard_rules = ["真诚"]

    return {
        "persona_id": f"persona-{mbti_lower}-{uuid.uuid4().hex[:8]}",
        "name": label,
        "avatar_prompt": f"{label}，喜欢旅行，{city_name}爱好者",
        "avatar_emoji": emoji,
        "layer0_hard_rules": hard_rules,
        "identity": mock.get("identity", {
            "title": "身份层",
            "content": f"你是{label}，向往{city_name}的旅行体验",
            "emoji": emoji,
        }) if mock else {"title": "身份层", "content": f"你是{label}", "emoji": emoji},
        "speaking_style": mock.get("speaking_style", {
            "title": "说话风格",
            "content": "随性自然，喜欢表达感受",
            "emoji": "💬",
            "typical_phrases": ["挺好的", "出发！", "这个不错"],
            "chat_tone": "轻松友好",
        }) if mock else {"title": "说话风格", "content": "随性自然", "emoji": "💬", "typical_phrases": [], "chat_tone": "轻松"},
        "emotion_decision": mock.get("emotion_decision", {
            "title": "情绪与决策",
            "content": "情感驱动决策",
            "emoji": "💭",
            "stress_response": "需要时间独处消化",
            "decision_style": "feeling",
        }) if mock else {"title": "情绪与决策", "content": "情感驱动", "emoji": "💭", "stress_response": "需要时间", "decision_style": "feeling"},
        "social_behavior": mock.get("social_behavior", {
            "title": "社交行为",
            "content": "适度社交后需要独处充电",
            "emoji": "🤝",
            "social_style": "选择性社交",
        }) if mock else {"title": "社交行为", "content": "适度社交", "emoji": "🤝", "social_style": "选择性"},
        "travel_style": mock.get("travel_style", "随性探索型") if mock else "随性探索型",
        "mbti_influence": f"MBTI={mbti}。{label}，城市探索爱好者。",
        "soul_fingerprint": fingerprint,
        "confidence_score": 0.75 if mock else 0.5,
        "data_sources_used": ["mbti"],
    }


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
        return {
            "destination": city_name,
            "dates": "5月10日-5月15日",
            "budget": "人均3500元",
            "consensus": overall > 0.6,
            "plan": plan,
            "matched_buddies": [user_config["name"], buddy_config["name"]],
            "radar": radar,
            "red_flags": red_flags,
            "messages": messages,
        }
    else:
        return {
            "destination": city_name,
            "dates": "待定",
            "budget": "待定",
            "consensus": False,
            "plan": [],
            "matched_buddies": [user_config["name"], buddy_config["name"]],
            "radar": [],
            "red_flags": ["数据不足，请补充更多信息"],
            "messages": [],
        }


# ---------------------------------------------------------------------------
# 路由实现
# ---------------------------------------------------------------------------


@router.post("/onboarding")
async def save_onboarding(req: OnboardingDataRequest) -> Dict[str, Any]:
    """
    POST /api/onboarding

    保存用户引导数据（MBTI + 兴趣 + 语音 + 城市）。
    MVP 阶段存内存，重启清空。
    """
    user_id = str(uuid.uuid4())
    data = req.model_dump()
    _onboarding_store[user_id] = data

    persona = _build_persona_from_onboarding(req.mbti, req.city)
    persona["persona_id"] = f"persona-{req.mbti.lower()}-{uuid.uuid4().hex[:8]}"
    _persona_store[user_id] = persona

    return {
        "success": True,
        "message": "已保存",
        "user_id": user_id,
        "persona_id": persona["persona_id"],
    }


@router.get("/persona")
async def get_persona(user_id: str = Query(...)) -> Dict[str, Any]:
    """
    GET /api/persona?user_id=xxx

    获取当前用户的数字孪生人格。
    如果内存中没有，尝试从 onboarding 数据重新生成。
    """
    if user_id in _persona_store:
        return {"success": True, "data": _persona_store[user_id]}

    if user_id in _onboarding_store:
        onboarding = _onboarding_store[user_id]
        persona = _build_persona_from_onboarding(
            onboarding.get("mbti", "ENFP"),
            onboarding.get("city", ""),
        )
        _persona_store[user_id] = persona
        return {"success": True, "data": persona}

    raise HTTPException(status_code=404, detail="未找到用户数据，请先完成引导")


@router.get("/feed")
async def get_feed(city: Optional[str] = Query(None)) -> Dict[str, Any]:
    """
    GET /api/feed?city=xxx

    返回视频 Feed 列表：
    - 视频 1-2：普通内容（无搭子信息）
    - 视频 3-5：懂你卡片触发（有搭子信息 + 兼容度）

    city 参数用于过滤目的地相关性。
    """
    videos = []
    buddy_mbtis = ["INFP", "ENFP", "ISTJ"]

    for i in range(5):
        video_id = f"v{i + 1}"
        is_card = i >= 2  # 第3条开始触发懂你卡片

        buddy = None
        if is_card:
            buddy_mbti = buddy_mbtis[i % len(buddy_mbtis)]
            buddy = _build_buddy(buddy_mbti, city or "dali")

        videos.append({
            "id": video_id,
            "type": "twin_card" if is_card else "video",
            "cover_url": _VIDEO_COVERS[i],
            "location": _CITY_NAMES.get(city or "", _VIDEO_TITLES[i].split("·")[0]) if is_card else _VIDEO_TITLES[i][:6],
            "title": _VIDEO_TITLES[i],
            "buddy": buddy,
        })

    return {
        "success": True,
        "data": videos,
        "meta": {"total": len(videos), "city": city or "all"},
    }


@router.post("/negotiate")
async def negotiate(req: NegotiationRequest) -> Dict[str, Any]:
    """
    POST /api/negotiate

    双数字人协商：返回预生成的协商结果。
    优先使用 Mock 协商数据，fallback 到动态生成。
    """
    city = req.destination or "dali"
    user_mbti = "ENFP"
    buddy_mbti = req.buddy_mbti or "INFP"

    result = _build_negotiation_result(city, user_mbti, buddy_mbti)
    return {
        "success": True,
        "data": result,
        "meta": {
            "user_mbti": user_mbti,
            "buddy_mbti": buddy_mbti,
            "destination": city,
        },
    }
