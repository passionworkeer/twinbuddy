# -*- coding: utf-8 -*-
"""
agents/buddy_persona_generator.py — TwinBuddy 搭子 Persona LLM 生成器

核心功能：根据用户画像（MBTI + 兴趣 + 目的地），
        LLM 实时生成「风格互补」的搭子 persona，
        结构完全模仿 buddy_xx.json。

Fallback：LLM 不可用时，从 agents/buddies/ 目录读取，
          选一个与用户 MBTI 互补的现有搭子 JSON。
"""

from __future__ import annotations

from pathlib import Path
from typing import Any, Dict, List, Optional

# ---------------------------------------------------------------------------
# LLM Client
# ---------------------------------------------------------------------------


def _get_llm_client():
    try:
        from agents.llm_client import llm_client
        return llm_client
    except ImportError:
        return None


# ---------------------------------------------------------------------------
# Buddy MBTI 互补配对表
# ---------------------------------------------------------------------------

# 当 LLM 不可用时，从这映射表选一个与用户 MBTI 互补的搭子 MBTI
COMPLEMENTARY_BUDDY_MBTIS: Dict[str, str] = {
    "ENFP": "ISTJ",
    "ISTJ": "ENFP",
    "INFP": "ESTJ",
    "ESTJ": "INFP",
    "INTJ": "ESFP",
    "ESFP": "INTJ",
    "INTP": "ESFJ",
    "ESFJ": "INTP",
    "ENTJ": "ISFP",
    "ISFP": "ENTJ",
    "ENTP": "ISFJ",
    "ISFJ": "ENTP",
    "INFJ": "ESTP",
    "ESTP": "INFJ",
    "ENFJ": "ISTP",
    "ISTP": "ENFJ",
}

# ---------------------------------------------------------------------------
# Fallback：从现有 buddy JSON 中读取
# ---------------------------------------------------------------------------


def _get_fallback_buddy(user_mbti: str, user_interests: List[str], destination: str) -> Dict[str, Any]:
    """
    LLM 不可用时，从 agents/buddies/ 目录选一个与用户互补的现有搭子。
    """
    buddy_mbti = COMPLEMENTARY_BUDDY_MBTIS.get(user_mbti.upper(), "INFP")

    # 扫描 agents/buddies/ 目录，找一个匹配的 MBTI
    buddies_dir = Path(__file__).parent / "buddies"

    if buddies_dir.exists():
        # 先找固定 MBTI 的buddy
        for f in sorted(buddies_dir.glob(f"buddy_*.json")):
            try:
                import json
                with open(f, "r", encoding="utf-8") as fh:
                    data = json.load(fh)
                if data.get("mbti", "").upper() == buddy_mbti.upper():
                    return _normalize_buddy(data)
            except Exception:
                continue

        # 找不到精确匹配，随便拿一个
        for f in sorted(buddies_dir.glob(f"buddy_*.json")):
            if "buddy_01" not in str(f):
                try:
                    import json
                    with open(f, "r", encoding="utf-8") as fh:
                        data = json.load(fh)
                    return _normalize_buddy(data)
                except Exception:
                    continue

    # 终极 fallback：硬编码最小结构
    return _hardcoded_buddy(buddy_mbti, user_interests, destination)


def _normalize_buddy(data: Dict[str, Any]) -> Dict[str, Any]:
    """将 buddy JSON 规范化为测试期望的格式"""
    import re
    prefs = data.get("preferences") or {}

    # budget 规范化
    raw_budget = prefs.get("budget", "")
    m_budget = re.search(r"(\d+-\d+)\s*元", str(raw_budget))
    budget_normalized = m_budget.group(1) + "元" if m_budget else str(raw_budget).split("，")[0].strip()

    neg = data.get("negotiation_style", {})
    if isinstance(neg, dict):
        neg_approach = neg.get("approach", "")
    else:
        neg_approach = str(neg)

    speaking = data.get("speaking_style", {})
    if isinstance(speaking, dict):
        typical_phrases = speaking.get("typical_phrases", [])
    else:
        typical_phrases = data.get("typical_phrases", [])

    # identity 规范化：buddy_xx.json 的 identity 是 {background/core_values/life_stage}
    # 规范化为 {content: ..., emoji: ...}
    raw_identity = data.get("identity", {})
    if isinstance(raw_identity, dict):
        identity_content = raw_identity.get("background") or raw_identity.get("content") or data.get("name", "")
    else:
        identity_content = str(raw_identity) if raw_identity else data.get("name", "")
    identity_emoji = raw_identity.get("emoji") if isinstance(raw_identity, dict) else data.get("avatar_emoji", "🤖")

    return {
        "mbti": data.get("mbti", "INFP"),
        "identity": {
            "title": "身份层",
            "content": identity_content,
            "emoji": identity_emoji,
        },
        "speaking_style": {
            "typical_phrases": typical_phrases,
            "chat_tone": speaking.get("chat_tone", "") if isinstance(speaking, dict) else "",
        },
        "emotion_decision": {
            "stress_response": (
                data.get("emotion_decision", {}).get("stress_response", "")
                if isinstance(data.get("emotion_decision"), dict)
                else ""
            ),
        },
        "social_behavior": {
            "social_style": (
                data.get("social_behavior", {}).get("social_style", "")
                if isinstance(data.get("social_behavior"), dict)
                else ""
            ),
        },
        "negotiation_style": {
            "approach": neg_approach,
            "hard_to_compromise": (
                neg.get("hard_to_compromise", [])
                if isinstance(neg, dict)
                else []
            ),
            "easy_to_compromise": (
                neg.get("easy_to_compromise", [])
                if isinstance(neg, dict)
                else []
            ),
        },
        "preferences": {
            "likes": prefs.get("likes", []),
            "dislikes": prefs.get("dislikes", []),
            "budget": budget_normalized,
        },
        "conversation_examples": data.get("conversation_examples", {}),
        "travel_style": data.get("travel_style", ""),
    }


def _hardcoded_buddy(mbti: str, user_interests: List[str], destination: str) -> Dict[str, Any]:
    """终极 fallback：硬编码最小搭子结构"""
    buddy_mbti = COMPLEMENTARY_BUDDY_MBTIS.get(mbti.upper(), "INFP")

    buddy_names = {
        "ENFP": ("小满", "😊"),
        "ISTJ": ("老陈", "📐"),
        "INFP": ("小鱼", "🌙"),
        "INTJ": ("阿谋", "🧠"),
        "ESFP": ("阿嗨", "🎪"),
        "ENTP": ("奇点", "⚡"),
        "ISFP": ("小艺", "🎨"),
        "ENTJ": ("凯哥", "🎯"),
        "default": ("搭子", "🤝"),
    }
    name, emoji = buddy_names.get(buddy_mbti, buddy_names["default"])

    interest_map = {
        "美食": "爱吃地道小吃",
        "摄影": "爱拍照记录",
        "古镇人文": "喜欢历史故事",
        "徒步登山": "热爱户外挑战",
        "自驾自由": "喜欢自由路线",
        "夜猫子旅行": "习惯晚睡晚起",
        "街边小吃探店": "对探店有热情",
    }
    interest_desc = "、".join(interest_map.get(i, i) for i in user_interests[:3]) if user_interests else "喜欢旅行"

    return {
        "mbti": buddy_mbti,
        "identity": {
            "title": "身份层",
            "content": f"{name}（{buddy_mbti}），{interest_desc}，是你的旅行搭子。",
            "emoji": emoji,
        },
        "speaking_style": {
            "title": "说话风格",
            "content": f"基于{buddy_mbti}性格特征的说话方式",
            "emoji": "💬",
            "typical_phrases": [f"我觉得", f"一起去{name}吧"],
            "chat_tone": "符合MBTI特征",
        },
        "emotion_decision": {
            "title": "情绪与决策",
            "content": f"{name}在压力下的反应符合{buddy_mbti}特征",
            "emoji": "💭",
            "stress_response": "情绪反应符合MBTI特征",
            "decision_style": "理性决策",
        },
        "social_behavior": {
            "title": "社交行为",
            "content": f"{name}的社交风格符合{buddy_mbti}特征",
            "emoji": "🤝",
            "social_style": "外向主动型",
        },
        "negotiation_style": {
            "approach": "愿意协商，尊重对方意见，但有底线",
            "hard_to_compromise": ["行程太满，没有自由时间"],
            "easy_to_compromise": ["景点顺序可以调整", "出发时间可以商量"],
        },
        "preferences": {
            "likes": ["旅行", "探索"],
            "dislikes": ["暴走", "早起"],
            "budget": "3000-5000元",
        },
        "conversation_examples": {
            "excited_about_trip": f"{name}: 太好了！终于要去{destination}了！",
            "compromising": f"{name}: 好吧，那我们就各退一步~",
        },
        "travel_style": "随性探索型",
    }


# ---------------------------------------------------------------------------
# LLM 生成
# ---------------------------------------------------------------------------

LLM_SYSTEM_PROMPT = """你是一个专业的旅行搭子人格生成器。
请根据用户画像，生成一个「风格互补」的旅行搭子 persona。
输出必须严格遵循以下 JSON 结构：

{
  "identity": {"title":"身份层","Content":"搭子名字+年龄+职业+核心性格描述","emoji":"..."},
  "speaking_style": {"title":"说话风格","Content":"说话风格描述","emoji":"💬","typical_phrases":["口头禅1","口头禅2","口头禅3"],"chat_tone":"温暖活泼/理性沉稳/..."},
  "emotion_decision": {"title":"情绪与决策","Content":"压力反应和决策风格描述","emoji":"💭","stress_response":"在压力下会...","decision_style":"决策风格"},
  "social_behavior": {"title":"社交行为","Content":"社交风格描述","emoji":"🤝","social_style":"社交风格概括"},
  "negotiation_style": {
    "approach":"协商策略描述，搭子如何与用户协商行程",
    "hard_to_compromise":["搭子绝不妥协的点1","绝不妥协的点2"],
    "easy_to_compromise":["搭子容易妥协的点1","容易妥协的点2"],
    "conflict_keywords":["激怒搭子的关键词1","关键词2"],
    "de_escalation":"安抚搭子的方法"
  },
  "preferences": {
    "likes":["搭子喜欢的1","喜欢的2"],
    "dislikes":["搭子讨厌的1","讨厌的2"],
    "budget":"预算区间"
  },
  "conversation_examples": {
    "excited_about_trip":"兴奋聊旅行时的对话示例",
    "when_disagreeing":"表达不同意见时的对话示例",
    "compromising":"达成共识时的对话示例"
  },
  "mbti":"搭子的MBTI（4字母）"
}

注意：
1. 搭子风格必须与用户「互补」而非「相同」
2. typical_phrases 必须包含 3-5 个符合该 MBTI 的真实口头禅
3. 全部用中文输出
4. 只输出 JSON，不要有任何其他文字"""


LLM_USER_TEMPLATE = """为以下用户生成一个互补风格的旅行搭子：

用户 MBTI：{user_mbti}
用户兴趣标签：{user_interests}
目的地：{destination}

要求：
- 搭子 MBTI 应与用户互补（如用户是随性的P型，搭子可以是稍有计划的J型）
- 搭子说话风格应与用户不同但能互补
- negotiation_style 应包含能让搭子妥协和不能妥协的具体内容
- typical_phrases 要真实，符合搭子 MBTI"""


def generate_buddy_persona_from_user(
    user_mbti: str,
    user_interests: List[str],
    destination: str,
) -> Dict[str, Any]:
    """
    根据用户画像，LLM 生成一个风格互补的搭子 persona。
    LLM 不可用时 fallback 到现有 buddy JSON。
    """
    user_mbti = user_mbti.strip().upper() if user_mbti else "ENFP"
    user_interests = user_interests or []
    destination = destination or "大理"

    llm = _get_llm_client()

    if llm is not None:
        try:
            interests_str = "、".join(user_interests) if user_interests else "未选择"
            user_msg = LLM_USER_TEMPLATE.format(
                user_mbti=user_mbti,
                user_interests=interests_str,
                destination=destination,
            )
            result = llm.chat_structured(user_msg, LLM_SYSTEM_PROMPT)

            if isinstance(result, dict) and "identity" in result:
                # 补充确保字段完整
                result.setdefault("mbti", COMPLEMENTARY_BUDDY_MBTIS.get(user_mbti, "INFP"))
                result.setdefault("preferences", {
                    "likes": ["旅行", "探索"],
                    "dislikes": ["暴走"],
                    "budget": "3000-5000元",
                })
                result.setdefault("conversation_examples", {})
                return result
        except Exception:
            pass  # fallback

    # Fallback：使用现有 buddy JSON
    return _get_fallback_buddy(user_mbti, user_interests, destination)
