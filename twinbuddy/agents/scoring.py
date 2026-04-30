# -*- coding: utf-8 -*-
"""
scoring.py — MING 六维度兼容性评分引擎

从 mock_database.py 独立出来，专用于评分计算。
数据来源统一走 agents/buddies/（100个完整persona）。

六维度：
  pace               25 pts
  social_energy      20 pts
  decision_style     20 pts
  interest_alignment 25 pts
  budget             15 pts
  personality_completion -5 – +10 pts
"""

from __future__ import annotations

import re
from typing import Optional, Set

# ---------------------------------------------------------------------------
# MBTI quadrant map (MING framework)
# ---------------------------------------------------------------------------
MBTI_QUADRANTS: dict[str, str] = {
    "INTJ": "NT", "INTP": "NT", "ENTJ": "NT", "ENTP": "NT",
    "INFJ": "NF", "INFP": "NF", "ENFJ": "NF", "ENFP": "NF",
    "ISTJ": "SJ", "ISFJ": "SJ", "ESTJ": "SJ", "ESFJ": "SJ",
    "ISTP": "SP", "ISFP": "SP", "ESTP": "SP", "ESFP": "SP",
}

# ---------------------------------------------------------------------------
# Budget rank table (ordered low → high)
# ---------------------------------------------------------------------------
BUDGET_RANKS: list[str] = [
    "1500-2500元", "1500-3000元",
    "2000-3500元", "2500-4000元", "2500-4500元",
    "3000-5000元", "3000-6000元",
    "3500-5500元", "3500-6000元",
    "4000-6000元", "4000-7000元",
    "5000-8000元", "6000-10000元",
]
BUDGET_RANK_MAP: dict[str, int] = {b: i for i, b in enumerate(BUDGET_RANKS)}


def _parse_budget(budget_str: str) -> tuple[int, int, int]:
    """Return (min_yuan, max_yuan, rank_index) from a budget string like '3000-5000元'."""
    nums = [int(x) for x in re.findall(r"\d+", budget_str)]
    if not nums:
        return (0, 0, -1)
    lo, hi = min(nums), max(nums)
    rank = BUDGET_RANK_MAP.get(budget_str, -1)
    return lo, hi, rank


# =============================================================================
# DIMENSION 1 · Pace  (J/P axis)  — max 25 pts
# =============================================================================

def _infer_jp(pace_str: str) -> Optional[str]:
    """Infer J/P tendency from a Chinese pace description."""
    s = pace_str.lower()
    if any(kw in s for kw in ["计划", "准时", "严格", "精确", "控制", "日程",
                               "攻略", "安排", "高效", "目标", "条理", "从容"]):
        return "J"
    if any(kw in s for kw in ["随性", "弹性", "灵活", "慢悠", "随缘",
                               "漫游", "不定", "随机", "即兴", "停", "慢", "放", "闲"]):
        return "P"
    return None


def _score_pace(user_mbti: str, user_pace: str,
                buddy_mbti: str, buddy_pace: str) -> tuple[float, str]:
    """Score J/P axis + pace-text compatibility. Returns (score, reason)."""
    user_jp = user_mbti[3] if len(user_mbti) >= 4 else None
    buddy_jp = buddy_mbti[3] if len(buddy_mbti) >= 4 else None

    if user_jp not in ("J", "P"):
        user_jp = _infer_jp(user_pace)
    if buddy_jp not in ("J", "P"):
        buddy_jp = _infer_jp(buddy_pace)

    if user_jp and buddy_jp:
        if user_jp == buddy_jp:
            lbl = "J" if user_jp == "J" else "P"
            return (25.0, f"{lbl}型节奏一致，双方在同一频率上行进")
        if user_jp == "J":
            return (18.0, "J型 + P型组合，J人获得弹性，P人有计划兜底")
        return (15.0, "P型 + J型组合，P人获得结构，J人享受灵活空间")

    if user_jp or buddy_jp:
        return (10.0, "节奏偏好部分已知，双方有一定默契基础")

    slow_kw = {"慢", "漫", "停", "随", "放", "闲", "舒适", "轻松", "自然醒"}
    fast_kw = {"快", "赶", "充", "高", "暴", "紧", "马", "效", "精", "目标", "强度", "体力", "精准"}
    u_slow = any(k in user_pace for k in slow_kw)
    u_fast = any(k in user_pace for k in fast_kw)
    b_slow = any(k in buddy_pace for k in slow_kw)
    b_fast = any(k in buddy_pace for k in fast_kw)

    if u_slow and b_slow:
        return (22.0, "双方都偏慢节奏，步伐自然一致")
    if u_fast and b_fast:
        return (18.0, "双方都偏快节奏，效率优先高度同步")
    if u_slow and b_fast:
        return (6.0, "节奏差异大，慢悠型容易被快节奏催促拖累")
    if u_fast and b_slow:
        return (4.0, "快节奏型需要等待慢悠型，容易产生疲劳感落差")

    return (10.0, "节奏偏好不明，需实际相处判断")


# =============================================================================
# DIMENSION 2 · Social Energy  (E/I axis)  — max 20 pts
# =============================================================================

def _infer_ei(style: str) -> Optional[str]:
    """Infer E/I tendency from travel-style description."""
    s = style.lower()
    if any(kw in s for kw in ["社交", "团队", "协调", "照顾大家", "自来熟",
                               "气氛", "连接", "集体", "夜", "嗨"]):
        return "E"
    if any(kw in s for kw in ["独处", "私密", "漫游", "避开", "安静",
                               "一个人", "内向", "荒野"]):
        return "I"
    return None


def _score_social_energy(user_mbti: str, user_style: str,
                          buddy_mbti: str, buddy_style: str) -> tuple[float, str]:
    """Score E/I axis compatibility. Returns (score, reason)."""
    user_ei = user_mbti[0] if len(user_mbti) >= 4 else None
    buddy_ei = buddy_mbti[0] if len(buddy_mbti) >= 4 else None

    if user_ei not in ("E", "I"):
        user_ei = _infer_ei(user_style)
    if buddy_ei not in ("E", "I"):
        buddy_ei = _infer_ei(buddy_style)

    if user_ei and buddy_ei:
        if user_ei == buddy_ei:
            lbl = "E" if user_ei == "E" else "I"
            return (20.0, f"{lbl}型组合，社交能量在同一频道，相处舒适度高")
        return (12.0, "E+I组合互补：E人带来活力，I人带来深度，但需提前约定独处时间")

    return (10.0, "社交能量偏好未知，初期需多沟通节奏")


# =============================================================================
# DIMENSION 3 · Decision Style  (T/F axis)  — max 20 pts
# =============================================================================

_T_KEYWORDS = {"逻辑", "数据", "Excel", "理性", "目标", "效率", "事实",
                "ROI", "性价比", "最优", "分析", "证据", "量化"}
_F_KEYWORDS = {"感觉", "价值观", "大家", "我们", "氛围", "和气", "照顾",
                "和谐", "情感", "心灵", "感受", "共鸣", "照顾大家", "集体"}


def _score_decision_style(user_mbti: str, buddy_mbti: str,
                           user_neg: str, buddy_neg: str) -> tuple[float, str]:
    """Score T/F axis compatibility. Returns (score, reason)."""
    user_tf = user_mbti[2] if len(user_mbti) >= 4 else None
    buddy_tf = buddy_mbti[2] if len(buddy_mbti) >= 4 else None

    if user_tf and buddy_tf:
        if user_tf == buddy_tf:
            lbl = "T理性" if user_tf == "T" else "F感性"
            return (20.0, f"{lbl}型组合，决策风格一致，沟通成本低")
        return (8.0, "T+F理性/感性差异大，协商中容易产生价值观冲突，需提前约定决策规则")

    u_t = sum(1 for k in _T_KEYWORDS if k in user_neg)
    u_f = sum(1 for k in _F_KEYWORDS if k in user_neg)
    b_t = sum(1 for k in _T_KEYWORDS if k in buddy_neg)
    b_f = sum(1 for k in _F_KEYWORDS if k in buddy_neg)

    u_is_t = u_t > u_f
    b_is_t = b_t > b_f

    if u_is_t == b_is_t:
        return (15.0, "决策风格相近，沟通效率有保障")
    return (8.0, "决策风格差异较大，协商中容易产生价值观摩擦")


# =============================================================================
# DIMENSION 4 · Interest Alignment  (N/S axis + likes/dislikes)  — max 25 pts
# =============================================================================

_INTEREST_CANONICAL_KEYWORDS: dict[str, tuple[str, ...]] = {
    "摄影": ("摄影", "拍照", "出片", "打卡"),
    "美食": ("美食", "火锅", "小吃", "探店", "吃"),
    "自然风光": ("山", "川", "湖", "海", "自然", "风光", "徒步", "露营", "骑行", "日落", "日出"),
    "历史文化": ("古镇", "人文", "历史", "文化", "古城", "博物馆", "遗迹"),
    "城市探索": ("citywalk", "城市", "夜游", "夜生活", "街区", "巷子"),
    "慢节奏": ("慢", "深度", "休闲", "发呆", "自然醒"),
    "效率打卡": ("详细", "计划", "高效", "清单", "打卡"),
    "预算控制": ("预算", "省钱", "性价比", "控制"),
    "自由冒险": ("说走就走", "即兴", "自由", "冒险", "自驾"),
    "夜间作息": ("夜猫", "晚睡", "夜生活"),
    "晨间作息": ("早起",),
    "社交边界": ("各自行动", "独处", "边界", "社交"),
}


def _normalize_interest_terms(items: list) -> Set[str]:
    """Normalize raw tags into semantic interest categories."""
    normalized: Set[str] = set()
    for item in items or []:
        raw = str(item).strip()
        if not raw:
            continue
        lowered = raw.lower()
        matched = False
        for canonical, keywords in _INTEREST_CANONICAL_KEYWORDS.items():
            if any(kw.lower() in lowered for kw in keywords):
                normalized.add(canonical)
                matched = True
        if not matched:
            normalized.add(raw)
    return normalized


def _score_interest_alignment(
    user_mbti: str,
    user_likes: list, user_dislikes: list,
    buddy_mbti: str,
    buddy_likes: list, buddy_dislikes: list,
) -> tuple[float, str]:
    """Score N/S + set-overlap. Returns (score, reason)."""
    user_ns = user_mbti[1] if len(user_mbti) >= 4 else None
    buddy_ns = buddy_mbti[1] if len(buddy_mbti) >= 4 else None

    u_likes = _normalize_interest_terms(user_likes)
    b_likes = _normalize_interest_terms(buddy_likes)
    u_dislikes = _normalize_interest_terms(user_dislikes)
    b_dislikes = _normalize_interest_terms(buddy_dislikes)

    shared_likes = len(u_likes & b_likes)
    shared_dislikes = len(u_dislikes & b_dislikes)
    conflicts = len((u_likes & b_dislikes) | (u_dislikes & b_likes))

    score = shared_likes * 2.0 + shared_dislikes * 3.0 - conflicts * 4.0

    ns_bonus = 0.0
    ns_reason = ""
    if user_ns and buddy_ns:
        if user_ns == buddy_ns:
            ns_bonus = 5.0
            label = "N直觉" if user_ns == "N" else "S感觉"
            ns_reason = f"同属{label}型，兴趣取向一致"
        else:
            ns_bonus = -2.0
            ns_reason = "N+S直觉/感觉型互补但兴趣底层差异明显"
    else:
        ns_reason = "直觉/感觉偏好未知"

    score += ns_bonus
    score = max(0.0, min(25.0, score))

    parts = []
    if shared_likes > 0:
        parts.append(f"语义归一后共同喜好{shared_likes}项")
    if shared_dislikes > 0:
        parts.append(f"共同厌恶{shared_dislikes}项（最重要）")
    if conflicts > 0:
        parts.append(f"兴趣冲突{conflicts}项")
    if ns_reason:
        parts.append(ns_reason)

    reason = "，".join(parts) if parts else "偏好数据有限，需实际相处了解"
    return (score, reason)


# =============================================================================
# DIMENSION 5 · Budget Compatibility  — max 15 pts
# =============================================================================

def _score_budget(user_budget: str, buddy_budget: str) -> tuple[float, str]:
    """Score budget range overlap. Returns (score, reason)."""
    if not user_budget or not buddy_budget:
        return (5.0, "预算信息不完整，无法精确评估")

    u_lo, u_hi, u_rank = _parse_budget(user_budget)
    b_lo, b_hi, b_rank = _parse_budget(buddy_budget)

    if u_rank == -1 or b_rank == -1:
        if u_lo and b_lo:
            diff = abs(u_lo - b_lo)
            if diff <= 500:
                return (10.0, "预算数字高度接近，消费观念一致")
            if diff <= 1500:
                return (6.0, "预算区间有部分重叠，需要协商消费边界")
            return (0.0, "预算差距较大，一方想省钱一方想奢侈，摩擦风险高")
        return (5.0, "预算信息不完整")

    if u_rank == b_rank:
        return (15.0, "预算区间完全一致，消费观念高度契合")

    diff = abs(u_rank - b_rank)
    if diff == 1:
        return (8.0, "预算区间相邻，有一定重叠，可协商")
    if diff == 2:
        return (4.0, "预算区间差异明显，需要提前约定消费规则")
    return (0.0, "预算区间差距很大，旅途消费摩擦风险高")


# =============================================================================
# DIMENSION 6 · Personality Completion  (MING quadrants)  — -5 to +10 pts
# =============================================================================

_COMPLEMENT_PAIRS: set[tuple[str, str]] = {
    ("ENFP", "ISTJ"), ("ENFP", "ISFJ"),
    ("INFP", "ESTJ"), ("INFP", "ESFJ"),
    ("INTJ", "ESFP"), ("INTJ", "ESTP"),
    ("INTP", "ESFJ"), ("INTP", "ENFJ"),
    ("ENTJ", "ISFP"), ("ENTJ", "INFP"),
    ("ENTP", "ISFJ"), ("ENTP", "ISTJ"),
    ("ISFJ", "ENTP"), ("ISFJ", "ENFP"),
    ("ESFJ", "INTP"), ("ESFJ", "INFP"),
    ("ENFJ", "ISTP"), ("ENFJ", "ISFP"),
    ("INFJ", "ESTP"), ("INFJ", "ESFP"),
    ("ISFP", "ENTJ"), ("ISFP", "ESTJ"),
    ("ESFP", "INTJ"), ("ESFP", "ISTJ"),
}


def _score_personality_completion(user_mbti: str, buddy_mbti: str) -> tuple[float, str]:
    """Score personality complementarity. Returns (bonus_score, reason_str)."""
    if not user_mbti or not buddy_mbti:
        return (0.0, "MBTI信息不足，无法评估人格互补性")

    if user_mbti == buddy_mbti:
        return (10.0, "同类型人格，天然理解对方的思维和感受方式")

    user_q = MBTI_QUADRANTS.get(user_mbti)
    buddy_q = MBTI_QUADRANTS.get(buddy_mbti)

    if user_q and buddy_q and user_q == buddy_q:
        names = {"NT": "理性型", "NF": "理想型", "SJ": "传统型", "SP": "感觉型"}
        return (6.0, f"同属{names.get(user_q, '')}人格，价值观和世界观接近")

    pair = tuple(sorted([user_mbti, buddy_mbti]))
    if pair in _COMPLEMENT_PAIRS:
        return (4.0, "人格互补：一方带来结构，一方带来灵感，形成互助关系")

    quadrant_conflict: dict[tuple[str, str], tuple[str, str]] = {
        ("NT", "SJ"): ("理性型", "传统型"),
        ("NF", "SP"): ("理想型", "感觉型"),
    }
    if user_q and buddy_q:
        key = tuple(sorted([user_q, buddy_q]))
        if key in quadrant_conflict:
            n = quadrant_conflict[key]
            return (-3.0, f"{n[0]}与{n[1]}世界观差异大，核心价值观需要磨合期")

    return (0.0, "人格组合中性，需实际相处才能判断适配度")


# =============================================================================
# PUBLIC API
# =============================================================================

def score_compatibility(user_prefs: dict, buddy: dict) -> float:
    """
    Compute overall compatibility score (0-100).
    数据来源：agents/buddies/*.json（100个完整persona）
    """
    user_mbti = user_prefs.get("mbti", "")
    buddy_mbti = buddy.get("mbti", "")

    # 从 persona 结构中提取数据（兼容不同格式）
    def get_prefs(d: dict, key: str, default=''):
        return d.get(key) or d.get("preferences", {}).get(key, default) if isinstance(d.get("preferences"), dict) else d.get(key, default)

    def get_list(d: dict, key: str):
        return d.get(key) or (d.get("preferences", {}).get(key, []) if isinstance(d.get("preferences"), dict) else [])

    s_pace, _ = _score_pace(
        user_mbti, get_prefs(user_prefs, "pace"),
        buddy_mbti, get_prefs(buddy, "pace"),
    )
    s_energy, _ = _score_social_energy(
        user_mbti, get_prefs(user_prefs, "travel_style"),
        buddy_mbti, get_prefs(buddy, "travel_style"),
    )
    s_decision, _ = _score_decision_style(
        user_mbti, buddy_mbti,
        get_prefs(user_prefs, "negotiation_style"),
        get_prefs(buddy, "negotiation_style"),
    )
    s_interest, _ = _score_interest_alignment(
        user_mbti,
        get_list(user_prefs, "likes"),
        get_list(user_prefs, "dislikes"),
        buddy_mbti,
        get_list(buddy, "likes"),
        get_list(buddy, "dislikes"),
    )
    s_budget, _ = _score_budget(
        get_prefs(user_prefs, "budget"),
        get_prefs(buddy, "budget"),
    )
    s_personality, _ = _score_personality_completion(user_mbti, buddy_mbti)

    total = s_pace + s_energy + s_decision + s_interest + s_budget + s_personality
    return max(0.0, min(100.0, total))


def get_compatibility_breakdown(user_prefs: dict, buddy: dict) -> dict:
    """Return detailed multi-dimensional breakdown for radar chart."""
    user_mbti = user_prefs.get("mbti", "")
    buddy_mbti = buddy.get("mbti", "")

    def get_prefs(d: dict, key: str, default=''):
        return d.get(key) or d.get("preferences", {}).get(key, default) if isinstance(d.get("preferences"), dict) else d.get(key, default)

    def get_list(d: dict, key: str):
        return d.get(key) or (d.get("preferences", {}).get(key, []) if isinstance(d.get("preferences"), dict) else [])

    user_likes = get_list(user_prefs, "likes")
    user_dislikes = get_list(user_prefs, "dislikes")
    buddy_likes = get_list(buddy, "likes")
    buddy_dislikes = get_list(buddy, "dislikes")

    s_pace, r_pace = _score_pace(user_mbti, get_prefs(user_prefs, "pace"),
                                  buddy_mbti, get_prefs(buddy, "pace"))
    s_energy, r_energy = _score_social_energy(user_mbti, get_prefs(user_prefs, "travel_style"),
                                                buddy_mbti, get_prefs(buddy, "travel_style"))
    s_decision, r_decision = _score_decision_style(user_mbti, buddy_mbti,
                                                     get_prefs(user_prefs, "negotiation_style"),
                                                     get_prefs(buddy, "negotiation_style"))
    s_interest, r_interest = _score_interest_alignment(user_mbti, user_likes, user_dislikes,
                                                        buddy_mbti, buddy_likes, buddy_dislikes)
    s_budget, r_budget = _score_budget(get_prefs(user_prefs, "budget"),
                                        get_prefs(buddy, "budget"))
    s_personality, r_personality = _score_personality_completion(user_mbti, buddy_mbti)

    # Red flags
    red_flags: list[str] = []
    shared_dislikes = len(set(user_dislikes) & set(buddy_dislikes))
    if not shared_dislikes and (user_dislikes and buddy_dislikes):
        red_flags.append("双方厌恶项完全不重叠，可能对彼此的雷区一无所知")

    conflicts = len(set(user_likes) & set(buddy_dislikes)) + len(set(user_dislikes) & set(buddy_likes))
    if conflicts >= 2:
        red_flags.append(f"存在{conflicts}项直接冲突的喜好/厌恶，协商成本高")

    if s_budget == 0:
        red_flags.append("预算差距很大，消费观念可能产生持续摩擦")

    user_ei = user_mbti[0] if len(user_mbti) >= 4 else None
    buddy_ei = buddy_mbti[0] if len(buddy_mbti) >= 4 else None
    if user_ei and buddy_ei and user_ei != buddy_ei and s_energy < 12:
        red_flags.append("社交能量差异明显，需要提前约定独处/社交时间")

    user_tf = user_mbti[2] if len(user_mbti) >= 4 else None
    buddy_tf = buddy_mbti[2] if len(buddy_mbti) >= 4 else None
    if user_tf and buddy_tf and user_tf != buddy_tf:
        flbl = "T理性" if user_tf == "T" else "F感性"
        blbl = "T理性" if buddy_tf == "T" else "F感性"
        red_flags.append(f"{flbl}型与{blbl}型决策逻辑不同，协商时需注意方式")

    if s_decision <= 8 and s_decision > 0:
        red_flags.append("决策风格差异较大，行程规划需提前明确分工")

    # Strengths
    strengths: list[str] = []
    if s_pace >= 22:
        strengths.append("旅行节奏高度一致，路上不会互相催促或拖累")
    if shared_dislikes >= 3:
        strengths.append(f"共同厌恶{shared_dislikes}项，彼此对旅行体验的底线接近")
    if s_interest >= 20:
        strengths.append("兴趣高度重叠，旅途会有很多共同话题和体验")
    if s_personality >= 9:
        strengths.append("人格组合极其罕见，相处起来会非常合拍")
    elif s_personality >= 6:
        strengths.append("人格类型契合度高，世界观和价值观接近")
    if s_energy == 20:
        strengths.append("社交能量完全同步，相处毫无能量负担")
    if s_budget == 15:
        strengths.append("预算区间完全一致，消费摩擦概率极低")
    if s_decision == 20:
        strengths.append("决策风格一致，协商效率高")
    if not strengths:
        strengths.append("各方面兼容度中等，需要时间相互了解")

    total = max(0.0, min(100.0, s_pace + s_energy + s_decision + s_interest + s_budget + s_personality))

    return {
        "total": round(total, 1),
        "dimensions": {
            "pace":               {"score": round(s_pace, 1),       "max": 25, "reason": r_pace},
            "social_energy":     {"score": round(s_energy, 1),     "max": 20, "reason": r_energy},
            "decision_style":     {"score": round(s_decision, 1),   "max": 20, "reason": r_decision},
            "interest_alignment": {"score": round(s_interest, 1),    "max": 25, "reason": r_interest},
            "budget":             {"score": round(s_budget, 1),     "max": 15, "reason": r_budget},
        },
        "personality_completion": {"score": round(s_personality, 1), "reason": r_personality},
        "red_flags": red_flags,
        "strengths": strengths,
    }
