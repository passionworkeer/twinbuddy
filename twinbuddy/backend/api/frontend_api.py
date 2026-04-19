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

# ---------------------------------------------------------------------------
# Mock 数据路径
# ---------------------------------------------------------------------------

_MOCK_DIR = Path(__file__).parent.parent.parent.parent / "mock_personas"

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

    # likes：优先 core_values，其次 language_markers
    likes: List[str] = identity.get("core_values", []) or []
    if not likes:
        markers: List[str] = sp.get("language_markers", [])
        likes = [m for m in markers if len(m) > 2][:5]

    # dislikes
    dealbreakers: List[str] = []
    if isinstance(layer0, dict):
        dealbreakers = layer0.get("dealbreakers", []) or []

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
    user_persona_id: Optional[str] = None
    buddy_mbti: Optional[str] = None
    destination: str = Field(..., description="目的地城市ID")
    # 直接传入用户 onboarding 数据（无需先调用 /onboarding 接口）
    mbti: Optional[str] = Field(default=None, description="用户 MBTI 类型")
    interests: Optional[List[str]] = Field(default_factory=list, description="兴趣标签")
    voiceText: Optional[str] = Field(default="", description="语音转文字内容")


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
async def get_persona(
    user_id: Optional[str] = Query(default=None),
    mbti: Optional[str] = Query(default=None),
    interests: Optional[str] = Query(default=None),  # comma-separated
    city: Optional[str] = Query(default=None),
    voice_text: Optional[str] = Query(default=None),
) -> Dict[str, Any]:
    """
    GET /api/persona?user_id=xxx
    或者
    GET /api/persona?mbti=ENFP&interests=美食,摄影&city=北京&voice_text=...

    支持两种模式：
    1. user_id 模式：从后端存储读取人格
    2. 直接参数模式：直接传 mbti/interests/city 参数（本地存储场景）

    获取当前用户的数字孪生人格。
    读取顺序：1) persona .md 文件  2) 内存 persona_store  3) 从 onboarding 重新生成或直接生成
    """

    # 直接参数模式（本地存储场景）
    if mbti:
        parsed_interests = interests.split(",") if interests else []
        persona = _build_persona_from_onboarding(
            mbti=mbti,
            city=city or "",
            interests=parsed_interests,
            voice_text=voice_text or "",
        )
        return {"success": True, "data": persona}

    # user_id 模式
    if not user_id:
        raise HTTPException(status_code=400, detail="需要 user_id 或 mbti 参数")

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
    limit: int = Query(default=10, ge=1, le=50),
    mbti: Optional[str] = Query(default=None),
    interests: Optional[str] = Query(default=None),
    city: Optional[str] = Query(default=None),
) -> Dict[str, Any]:
    """
    GET /api/buddies

    返回用户的推荐搭子列表（按 MING 六维度兼容性评分排序）。

    支持两种调用方式：
    1. user_id 模式：user_id 存在时使用存储的用户数据
    2. 直接参数模式：传 mbti/interests/city（本地存储场景，无需 user_id）

    响应结构：
      {
        "success": true,
        "buddies": [...],
        "user_prefs": {...},
        "meta": {...}
      }
    """
    # 构建 user_prefs：优先用存储的数据，否则用直接参数
    user_prefs: Dict[str, Any] = {"mbti": mbti, "interests": [], "city": city, "voice_text": None}

    if interests:
        user_prefs["interests"] = [i.strip() for i in interests.split(",") if i.strip()]

    if user_id and user_id in _onboarding_store:
        onboarding = _onboarding_store[user_id]
        user_prefs = _build_user_prefs(onboarding, user_id)

    # 获取 top-N 搭子（使用 MING 六维度评分）
    top_buddies = get_top_buddies(user_prefs, limit=limit)

    return {
        "success": True,
        "buddies": [get_buddy_public(buddy, user_prefs) for buddy in top_buddies],
        "user_prefs": user_prefs,
        "meta": {
            "user_id": user_id,
            "limit": limit,
            "total_buddies": len(top_buddies),
            "mbti": user_prefs.get("mbti"),
            "city": user_prefs.get("city"),
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

    # ── 获取用户 persona（优先 .md 文件，其次内存）────────────────────
    user_persona: Optional[Dict[str, Any]] = None
    user_mbti = "ENFP"
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
        # 从用户兴趣中随机选一部分作为搭子兴趣（模拟部分重叠）
        user_interests = req.interests or []
        shared = [i for i in user_interests if i in ["美食", "摄影", "自然风光", "城市探索"]]
        buddy_interests = shared[:1] + [i for i in ["美食", "摄影", "自然风光", "城市探索"] if i not in shared][:2]
        twin_persona = {
            "persona_id": f"persona-{buddy_mbti.lower()}-{_uuid.uuid4().hex[:8]}",
            "mbti_type": buddy_mbti,
            "travel_style": buddy_config["travel_style"],
            "speaking_style": {
                "chat_tone": "温和细腻",
                "typical_phrases": buddy_config["typical_phrases"],
            },
            "mbti_dimension_evidence": {"energy": "introvert", "lifestyle": "perceiving"},
            "preferences": {
                "likes": buddy_interests,
                "dislikes": ["人挤人", "打卡拍照"],
            },
        }

    # 尝试 LLM 真实协商（单次调用，不走 LangGraph 状态机）
    try:

        # 使用的人格数据（优先用户 persona，fallback 到动态生成）
        # 优先使用请求体直接传入的 onboarding 数据
        active_user_persona = (
            user_persona
            or _build_persona_from_onboarding(
                req.mbti or user_mbti,
                city,
                req.interests or [],
                req.voiceText or "",
            )
        )

        # 构建 user_prefs 以计算兼容性分解（供 LLM 深度注入）
        user_prefs_for_compat: Optional[Dict[str, Any]] = None
        try:
            user_prefs_for_compat = _build_user_prefs_from_persona(active_user_persona)
        except Exception:
            pass
        # 将请求中的 interests 直接注入，避免 persona 构建丢失
        if user_prefs_for_compat and req.interests:
            user_prefs_for_compat["likes"] = req.interests

        compat_breakdown = _get_negotiation_compatibility_breakdown(
            user_prefs_for_compat, twin_persona
        )
        # 雷达图需要完整的 dimensions，直接用 _mock_compat_breakdown
        breakdown = _mock_compat_breakdown(user_prefs_for_compat, twin_persona) if user_prefs_for_compat else None

        # ── 单次 LLM 调用生成协商对话 ─────────────────────────────────────────
        # 不走 LangGraph 状态机，直接一次请求返回完整结果
        # 3 个 key 自动轮换，失败不降级 mock，直接抛异常
        user_mbti_str = user_mbti or "ENFP"
        buddy_mbti_str = twin_persona.get("mbti") or twin_persona.get("mbti_type") or buddy_mbti
        interests_str = "、".join(req.interests) if req.interests else "美食和风景"
        user_style = active_user_persona.get("speaking_style", {}).get("chat_tone", "热情直接") if isinstance(active_user_persona.get("speaking_style"), dict) else "热情直接"
        buddy_style = twin_persona.get("speaking_style", {}).get("chat_tone", "温和细腻") if isinstance(twin_persona.get("speaking_style"), dict) else "温和细腻"
        user_phrases = active_user_persona.get("speaking_style", {}).get("typical_phrases", []) if isinstance(active_user_persona.get("speaking_style"), dict) else []
        buddy_phrases = twin_persona.get("speaking_style", {}).get("typical_phrases", []) if isinstance(twin_persona.get("speaking_style"), dict) else []

        compat_total = compat_breakdown.get("total", 0.75) if compat_breakdown else 0.75
        compat_strengths = compat_breakdown.get("strengths", [])[:2] if compat_breakdown else []
        compat_flags = compat_breakdown.get("red_flags", [])[:2] if compat_breakdown else []

        SYSTEM_PROMPT = "你是一个旅行搭子协商助手，严格输出JSON，不要输出任何其他文字。"
        USER_PROMPT = f"""两个旅行搭子在协商去{city_name}旅行。

用户信息：MBTI={user_mbti_str}，兴趣={interests_str}，说话风格={user_style}
搭子信息：MBTI={buddy_mbti_str}，说话风格={buddy_style}
用户口头禅：{'、'.join(user_phrases[:2]) if user_phrases else '说走就走'}
搭子口头禅：{'、'.join(buddy_phrases[:2]) if buddy_phrases else '慢慢来'}
整体匹配度：{int(compat_total*100)}%
匹配优势：{'；'.join(compat_strengths) if compat_strengths else '旅行节奏接近，沟通顺畅'}
潜在分歧：{'；'.join(compat_flags) if compat_flags else '需要约定休息时间'}

请生成协商对话，JSON格式：
{{
  "messages": [
    {{"speaker": "user", "content": "..."}},
    {{"speaker": "buddy", "content": "..."}},
    ...共6-8条消息，像微信聊天，短句口语化...
  ]],
  "overall_score": 0.0-1.0的浮点数,
  "recommendation": "25字推荐语"
}}

要求：
- 对话要有来有回，用户和搭子各说3-4条
- 消息要短（10-30字），像微信聊天
- 必须提到具体的旅行内容（大理的景点/美食/住宿）
- 用户要提到自己的兴趣：{interests_str}
- 不要每条都加emoji，最多1/3
- 整体合拍就高分，有分歧就中等
- 只输出JSON，不要markdown代码块"""

        from negotiation.llm_client import llm_client
        raw = llm_client.chat(USER_PROMPT, system_prompt=SYSTEM_PROMPT)
        if not raw:
            raise ValueError("LLM返回空")

        # 解析 JSON
        raw = raw.strip()
        if raw.startswith("```"):
            parts = raw.split("```")
            for p in parts:
                p = p.strip()
                if p and not p.startswith("json"):
                    raw = p
                    break
        llm_data: Dict[str, Any] = json.loads(raw)

        messages_raw: List[Dict[str, Any]] = llm_data.get("messages", [])
        messages = []
        ts_base = 1700000000
        for i, m in enumerate(messages_raw):
            ts = ts_base + i * 15
            messages.append({"speaker": m.get("speaker", "user"), "content": m.get("content", ""), "timestamp": ts})

        overall = float(llm_data.get("overall_score", 0.75))
        final_report = {"overall_score": overall, "strengths": compat_strengths, "recommendation": llm_data.get("recommendation", "")}

        # 用 MING 六维度算法生成雷达图数据（不依赖 LLM topic 数）
        # 算法分数字典需要归一化到 0-100
        # pace(max25), social_energy(max20), decision_style(max20), interest_alignment(max25), budget(max15), personality_completion(-5~10)
        ALGO_MAX = {
            "pace": 25, "social_energy": 20, "decision_style": 20,
            "interest_alignment": 25, "budget": 15,
        }
        BUDDY_RATIO = {
            "pace": 0.90, "social_energy": 0.85, "decision_style": 0.88,
            "interest_alignment": 0.90, "budget": 0.92, "personality_completion": 0.90,
        }
        radar = []
        DIM_LABELS = ["行程节奏", "美食偏好", "拍照风格", "预算控制", "冒险精神", "作息时间"]
        ALGORITHM_KEYS = [
            "pace", "interest_alignment", "interest_alignment",
            "budget", "personality_completion", "social_energy",
        ]
        WEIGHTS = [0.8, 0.6, 0.5, 0.7, 0.9, 0.8]
        # breakdown 包含完整 dimensions（_get_negotiation_compatibility_breakdown 会去掉 dimensions）
        breakdown = _mock_compat_breakdown(user_prefs_for_compat, twin_persona) if user_prefs_for_compat else None
        # DEBUG: print breakdown dims and user_prefs keys
        import sys
        sys.stderr.write(f"DEBUG breakdown_has_dims={breakdown is not None and 'dimensions' in breakdown} "
            f"interest_align={(breakdown or {}).get('dimensions',{}).get('interest_alignment') if breakdown else None} "
            f"user_prefs_keys={list((user_prefs_for_compat or {}).keys())}\n")
        sys.stderr.flush()
        for i, algo_key in enumerate(ALGORITHM_KEYS):
            user_score = 70
            buddy_score = 65
            if breakdown:
                if algo_key == "personality_completion":
                    pc = breakdown.get("personality_completion", {})
                    raw = pc.get("score", 0)
                    # 归一化: -5..10 → 0..100
                    user_score = int((raw + 5) / 15 * 100)
                    buddy_score = int(user_score * BUDDY_RATIO[algo_key])
                elif algo_key in ALGO_MAX:
                    dim_data = breakdown["dimensions"].get(algo_key, {})
                    raw = dim_data.get("score", 0)
                    mx = ALGO_MAX[algo_key]
                    user_score = int(raw / mx * 100) if mx else 70
                    buddy_score = int(user_score * BUDDY_RATIO.get(algo_key, 0.9))
            radar.append({
                "dimension": DIM_LABELS[i],
                "user_score": user_score,
                "buddy_score": buddy_score,
                "weight": WEIGHTS[i],
            })

        # red_flags / strengths 优先用算法结果，其次用 final_report
        red_flags = []
        strengths = []
        if breakdown:
            red_flags = breakdown.get("red_flags", [])[:2]
            strengths = breakdown.get("strengths", [])
        if not strengths and final_report:
            strengths = final_report.get("strengths", [])

        plan = strengths[:3] if strengths else [
            f"{city_name}古城民宿2晚",
            f"{city_name}周边自然风光1天",
            "特色美食探索之旅",
        ]

        overall = final_report.get("overall_score", 0.5) if final_report else 0.5
        result_data = {
            "destination": city_name,
            "dates": "5月10日-5月15日",
            "budget": "人均3500元",
            "consensus": overall > 0.5,
            "plan": plan,
            "matched_buddies": [user_name, buddy_config["name"]],
            "radar": radar,
            "red_flags": red_flags,
            "messages": messages,
        }
        llm_source = "llm"
        try:
            from negotiation.llm_client import _KEYS as _LLM_KEYS
            if not _LLM_KEYS:
                llm_source = "llm_fallback"
        except Exception:
            pass

        logger.info("LLM 协商成功 | source=%s | overall=%.3f | msgs=%d", llm_source, overall, len(messages))
        return {
            "success": True,
            "data": result_data,
            "meta": {
                "source": llm_source,
                "user_mbti": user_mbti,
                "buddy_mbti": buddy_mbti,
                "destination": city,
                "overall_score": overall,
            },
        }
    except Exception as exc:
        # 3 个 key 自动轮换都失败了，不降级 mock，直接报错
        logger.error("LLM 全部失败（3 key 均不可用）: %s", exc)
        raise HTTPException(status_code=503, detail=f"LLM 服务不可用: {exc}")


# ---------------------------------------------------------------------------
# Buddy Persona 预计算缓存
# ---------------------------------------------------------------------------

_BUDDY_PERSONA_CACHE: Dict[str, Dict[str, Any]] = {}


@router.post("/precompute-buddy")
async def precompute_buddy(req: NegotiationRequest) -> Dict[str, Any]:
    """
    预计算搭子 persona（异步，不阻塞用户请求）。

    前端在用户点击目的地时调用此接口，
    后端在后台生成 top-3 搭子的 persona，结果存入 _BUDDY_PERSONA_CACHE。
    后续 /api/negotiate/stream 直接从缓存读取，无需等待 LLM。
    """
    import asyncio
    import logging
    logger = logging.getLogger("twinbuddy.api")

    user_mbti = (req.mbti or "ENFP").strip().upper()
    interests = req.interests or []
    city = req.destination or "dali"

    user_prefs = _build_user_prefs({"mbti": user_mbti, "interests": interests, "city": city})

    def _compute():
        try:
            top_buddies = get_top_buddies(user_prefs, limit=3)
        except Exception:
            top_buddies = []

        results = {}
        for i, buddy in enumerate(top_buddies):
            buddy_id = buddy.get("id", f"buddy_{i+1:02d}")
            try:
                from agents.buddy_persona_generator import generate_buddy_persona_from_user
                buddy_persona = generate_buddy_persona_from_user(
                    user_mbti=user_mbti,
                    user_interests=interests,
                    destination=city,
                )
            except Exception:
                buddy_persona = buddy
            results[buddy_id] = buddy_persona
            _BUDDY_PERSONA_CACHE[f"{req.user_persona_id or 'anon'}:{buddy_id}"] = buddy_persona
        return results

    # 后台执行，不阻塞
    asyncio.get_event_loop().run_in_executor(None, _compute)
    logger.info("预计算搭子 persona 已启动 | user_mbti=%s | destination=%s", user_mbti, city)
    return {"success": True, "message": "预计算已启动"}


@router.post("/negotiate/stream")
async def negotiate_stream(req: NegotiationRequest):
    """
    SSE 流式协商接口 — 实时返回 MiniMax LLM 生成的消息。

    流式输出：每个 LLM 调用完成后立即 yield，
    前端可实时展示对话，无需等待全部生成完毕。

    SSE 格式：
      event: message
      data: {"speaker": "user"|"buddy", "content": "...", "topic": "...", "round": 1}

      event: done
      data: {"summary": "...", "overall": 0.85}
    """
    import asyncio
    import logging
    from fastapi.responses import StreamingResponse
    from fastapi import Query

    logger = logging.getLogger("twinbuddy.api")
    city = req.destination or "dali"
    city_name = _CITY_NAMES.get(city, city or "大理")

    # ── 获取用户 persona ──────────────────────────────────────────────
    user_persona: Optional[Dict[str, Any]] = None
    user_mbti = (req.mbti or "ENFP").strip().upper()
    user_id = req.user_persona_id or "anon"

    if req.user_persona_id:
        for uid_key, p in _persona_store.items():
            if p.get("persona_id") == req.user_persona_id:
                user_persona = p
                break

    # 构建用户 prefs
    active_user_persona = (
        user_persona
        or {"mbti_type": user_mbti, "identity": {"content": ""},
            "speaking_style": {"chat_tone": "热情直接", "typical_phrases": ["说走就走！"]},
            "emotion_decision": {"decision_style": "凭直觉"},
            "negotiation_style": {"approach": "友好协商"},
            "city": city}
    )

    # ── 获取 Buddy persona（缓存优先）─────────────────────────────────
    buddy_mbti = (req.buddy_mbti or "INFP").strip().upper()
    buddy_id_key = f"{user_id}:{buddy_mbti}"

    twin_persona = _BUDDY_PERSONA_CACHE.get(buddy_id_key)
    if not twin_persona:
        try:
            from agents.buddy_persona_generator import generate_buddy_persona_from_user
            twin_persona = generate_buddy_persona_from_user(
                user_mbti=user_mbti,
                user_interests=req.interests or [],
                destination=city,
            )
        except Exception:
            twin_persona = {
                "mbti_type": buddy_mbti,
                "identity": {"content": f"MBTI={buddy_mbti}的旅行者"},
                "speaking_style": {"chat_tone": "温和随和", "typical_phrases": ["慢慢来", "挺好的"]},
                "emotion_decision": {"decision_style": "凭直觉"},
                "negotiation_style": {"approach": "温和协商", "easy_to_compromise": ["节奏"], "hard_to_compromise": ["预算"]},
            }

    # ── 计算兼容性分解 ────────────────────────────────────────────────
    try:
        user_prefs = _build_user_prefs_from_persona(active_user_persona)
    except Exception:
        user_prefs = None

    compat_breakdown = _get_negotiation_compatibility_breakdown(user_prefs, twin_persona)

    # ── 两段 LLM 调用：生成具体计划 + 生成故事 ───────────────────────────
    #
    # 第一步：生成具体旅行计划（酒店/餐厅/景点/时间线）
    # 第二步：把计划注入故事 prompt，生成 20-30 条长对话
    # 前端体验：消息每 0.2s 动画出现，用户可滚动

    async def _stream_negotiation():
        from backend.negotiation.nodes import TOPIC_LABELS
        import random, asyncio

        # ── 提取用户 onboarding 信息（用于注入对话）────────────────────────
        user_onboarding_mbti = (req.mbti or "ENFP").strip().upper()
        user_onboarding_interests = req.interests or []
        user_onboarding_voice = req.voiceText or ""
        user_onboarding_city = city
        interests_str = "、".join(user_onboarding_interests) if user_onboarding_interests else "探索美食和风景"

        def _get_conv_examples(persona: Dict[str, Any]) -> Dict[str, str]:
            conv: Dict[str, Any] = persona.get("conversation_examples", {})
            if isinstance(conv, dict) and conv:
                return conv
            sp = persona.get("speaking_style", {}) or {}
            if isinstance(sp, dict):
                tone = sp.get("chat_tone", "") or sp.get("tone", "")
                phrases = sp.get("typical_phrases", [])
                if tone or phrases:
                    return {
                        "excited": f"（说话风格：{tone}。口头禅：{'、'.join(phrases[:3])}）",
                    }
            return {}

        def _get_speaking_style(persona: Dict[str, Any]) -> str:
            sp = persona.get("speaking_style", {}) or {}
            if isinstance(sp, dict):
                return f"{sp.get('chat_tone', '')} {sp.get('sentence_patterns', '')}".strip()
            return str(sp) if sp else "自然随性"

        user_examples = _get_conv_examples(active_user_persona)
        buddy_examples = _get_conv_examples(twin_persona)
        user_style = _get_speaking_style(active_user_persona)
        buddy_style = _get_speaking_style(twin_persona)

        # ── 第一步：生成具体旅行计划 ──────────────────────────────────────
        plan_prompt = f"""根据以下信息，为两个旅行搭子生成大理3天2晚的具体旅行计划。

用户信息：
- 性格：{user_onboarding_mbti}型
- 兴趣：{interests_str}
- 备注：{user_onboarding_voice or '无'}

搭子性格：{twin_persona.get('mbti_type', twin_persona.get('mbti', 'INFP'))}

请生成一个具体的旅行计划，严格JSON格式：
{{
  "hotel": {{"name": "酒店名", "location": "位置", "price": "价格/晚", "reason": "为什么选这个"}},
  "restaurants": [
    {{"name": "店名", "type": "类型", "price": "人均", "must_try": "必点"}}
  ],
  "attractions": [
    {{"name": "景点名", "time": "建议游览时间", "reason": "为什么去"}}
  ],
  "itinerary": [
    {{"day": "Day1", "theme": "主题", "highlights": ["亮点1", "亮点2"]}}
  ]
}}

只输出JSON，不要任何其他文字。"""

        def _gen_plan():
            from backend.negotiation.llm_client import llm_client
            return llm_client.chat(plan_prompt, system_prompt="你是一个旅行规划助手，只输出JSON。")

        plan_json = "{}"
        try:
            raw_plan = await asyncio.to_thread(_gen_plan)
            if raw_plan:
                raw_plan = raw_plan.strip()
                if raw_plan.startswith("```"):
                    parts = raw_plan.split("```")
                    for p in parts:
                        if p.strip() and not p.strip().startswith("json"):
                            raw_plan = p.strip()
                            break
                plan_json = raw_plan
        except Exception:
            pass

        # 提取计划中的关键信息用于对话注入
        plan_info = ""
        try:
            plan_data = json.loads(plan_json)
            hotel_name = plan_data.get("hotel", {}).get("name", "")
            hotel_loc = plan_data.get("hotel", {}).get("location", "")
            hotel_price = plan_data.get("hotel", {}).get("price", "")
            restaurants = plan_data.get("restaurants", [])
            attractions = plan_data.get("attractions", [])
            restaurant_names = "、".join([r.get("name","") for r in restaurants[:3] if r.get("name")])
            attraction_names = "、".join([a.get("name","") for a in attractions[:3] if a.get("name")])
            plan_info = f"【已规划内容】住宿：{hotel_name}（{hotel_loc}，{hotel_price}）；餐厅：{restaurant_names}；景点：{attraction_names}"
        except Exception:
            plan_info = ""

        compat_total = 0.5
        if compat_breakdown:
            compat_total = compat_breakdown.get("total", 0.5)

        # 随机选择故事风格
        plot_styles = [
            ("soulmate", "知己难得", "两人越聊越合拍，快速达成共识，温馨有火花"),
            ("banter", "相爱相杀", "你来我往小嘴斗嘴，表面拌嘴实际很在乎，最后和好"),
            ("conflict", "立场交锋", "各有坚持不肯退让，激烈讨论后各退一步达成折中"),
            ("warmup", "渐入佳境", "一开始有点拘谨陌生，聊开了以后发现意外合拍"),
        ]
        plot_key, plot_name, plot_desc = random.choice(plot_styles)

        topics_str = "、".join([TOPIC_LABELS.get(t, t) for t in ["travel_rhythm", "food", "budget"]])

        # 从人格数据中提取 MBTI
        def _extract_mbti(p):
            mbti_raw = p.get("mbti_type") or p.get("mbti", "")
            return mbti_raw or "ENFP"

        user_mbti = _extract_mbti(active_user_persona)
        buddy_mbti = _extract_mbti(twin_persona)

        # 构建对话示例块
        user_excited = user_examples.get("excited_about_trip", user_examples.get("excited", ""))[:200]
        buddy_excited = buddy_examples.get("excited_about_trip", buddy_examples.get("excited", ""))[:200]
        user_disagree = user_examples.get("when_disagreeing", user_examples.get("disagree", ""))[:200]
        buddy_disagree = buddy_examples.get("when_disagreeing", buddy_examples.get("disagree", ""))[:200]

        # 提取人格约束（避免在 f-string 中直接访问嵌套 dict）
        user_neg = active_user_persona.get("negotiation_style") or {}
        user_emo = active_user_persona.get("emotion_decision") or {}
        user_hard = user_neg.get("hard_to_compromise", []) if isinstance(user_neg, dict) else []
        user_pressure = user_emo.get("pressure_response", "") if isinstance(user_emo, dict) else ""

        buddy_neg = twin_persona.get("negotiation_style") or {}
        buddy_emo = twin_persona.get("emotion_decision") or {}
        buddy_hard = buddy_neg.get("hard_to_compromise", []) if isinstance(buddy_neg, dict) else []
        buddy_pressure = buddy_emo.get("pressure_response", "") if isinstance(buddy_emo, dict) else ""

        story_prompt = f"""你是两个旅行搭子的微信聊天记录生成器。

【背景】User（{user_mbti}型，兴趣：{interests_str}）和Buddy（{buddy_mbti}型）正在协商去{city_name}旅行。
{plan_info}

【User 真实对话风格】
兴奋时：「{user_excited}」
坚持己见时：「{user_disagree}」

【Buddy 真实对话风格】
兴奋时：「{buddy_excited}」
坚持己见时：「{buddy_disagree}」

【User 约束】
- 绝不让步：{user_hard[:2] or ['无']}
- 不能接受：{user_pressure or '无'}

【Buddy 约束】
- 绝不让步：{buddy_hard[:2] or ['无']}
- 不能接受：{buddy_pressure or '无'}

【场景】{plot_name}型：{plot_desc}

【输出格式】严格JSON数组，共22-28条消息，每条10-35字：
[
  {{"speaker": "user", "content": "..."}},
  {{"speaker": "buddy", "content": "..."}},
  ...
  {{"speaker": "summary", "content": "25字推荐语"}}
]

【要求】
- 严格参考上面两个"真实对话风格"，不要凭空生成语气
- 消息要像微信聊天：短句、有时没说完、有时打错字又撤回、语气词自然
- 必须讨论具体计划：酒店名字、景点名字、餐厅名字、时间安排
- User 要提到自己的兴趣：{interests_str}
- 不要每条都加emoji，最多1/4
- 对话要有来有回，至少10个回合以上才能达成共识
- 不要用"我们必须/你应该"这种命令式，多用"要不去""我觉得""你觉得呢"
- {plot_name}型的节奏：{plot_desc}
- 只输出JSON"""

        def _generate_story():
            from backend.negotiation.llm_client import llm_client
            return llm_client.chat(story_prompt, system_prompt="你是一个旅行搭子协商故事生成器，只输出JSON。")

        try:
            raw = await asyncio.to_thread(_generate_story)
            if not raw:
                raise ValueError("LLM返回空")

            # 尝试解析 JSON
            # LLM 可能输出带 markdown 代码块
            raw = raw.strip()
            if raw.startswith("```"):
                raw = raw.split("```")[1]
                if raw.startswith("json"):
                    raw = raw[4:]
                raw = raw.strip()

            messages = json.loads(raw)
            if not isinstance(messages, list):
                messages = [messages]

            # 逐条 SSE 推送，间隔 0.25s 让前端有动画效果
            topic_map = {0: "旅行节奏", 1: "旅行节奏", 2: "美食探索", 3: "美食探索", 4: "预算安排", 5: "预算安排"}
            for i, msg in enumerate(messages):
                if msg.get("speaker") == "summary":
                    payload = json.dumps({"summary": msg.get("content", "")}, ensure_ascii=False)
                    yield f"event: done\ndata: {payload}\n\n"
                else:
                    topic = topic_map.get(i, "")
                    payload = json.dumps({
                        "speaker": msg.get("speaker", "user"),
                        "content": msg.get("content", ""),
                        "topic": topic,
                        "round": (i // 2) + 1,
                    }, ensure_ascii=False)
                    yield f"event: message\ndata: {payload}\n\n"
                    await asyncio.sleep(0.25)

        except Exception as exc:
            logger.error("故事生成失败: %s", exc)
            # Fallback：生成简单对话
            fallback = [
                {"speaker": "user", "content": f"说走就走！去{city_name}旅行真的太期待啦~"},
                {"speaker": "buddy", "content": "对呀！我也一直想去~这次一定要好好计划一下！"},
                {"speaker": "user", "content": "那必须得去吃本地特色美食！"},
                {"speaker": "buddy", "content": "同意！还有拍照，风景超美的~"},
                {"speaker": "user", "content": "预算方面我觉得差不多就行，开心最重要！"},
                {"speaker": "buddy", "content": "嗯嗯，性价比优先~"},
                {"speaker": "user", "content": "那就这么定了！冲冲冲！"},
                {"speaker": "buddy", "content": "好！期待这次旅行！🌟"},
            ]
            for i, msg in enumerate(fallback):
                if msg.get("speaker") == "summary":
                    payload = json.dumps({"summary": msg.get("content", "")}, ensure_ascii=False)
                    yield f"event: done\ndata: {payload}\n\n"
                else:
                    payload = json.dumps({
                        "speaker": msg.get("speaker", "user"),
                        "content": msg.get("content", ""),
                        "topic": "",
                        "round": (i // 2) + 1,
                    }, ensure_ascii=False)
                    yield f"event: message\ndata: {payload}\n\n"
                    await asyncio.sleep(0.25)

    return StreamingResponse(
        _stream_negotiation(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


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
