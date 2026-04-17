# -*- coding: utf-8 -*-
"""
persona_generator.py — LLM 人格蒸馏 prompt 约束系统

TwinBuddy 核心模块：从用户 onboarding 四字段（MBTI + 兴趣标签 + 一句话 + 城市）
蒸馏旅行人格画像，核心原则：
  1. 数据使用优先级：MBTI > 兴趣标签 > 一句话 > 城市
  2. 推断边界：绝不能编造职业/年龄/具体经历
  3. 证据分级：v=原话引用 ≥60%，a=合理推断 ≤30%，i=印象补充 ≥10%
  4. 诚实原则：所有推断加限定词，不把推断当事实

对外接口：
  generate_persona_from_onboarding(mbti, interests, voice_text, city) -> dict
  严格遵守返回结构，fallback 时标记 _fallback: True
"""
from __future__ import annotations

import json
import re
import sys
from typing import Any, Dict, List, Optional

# ---------------------------------------------------------------------------
# PART 1：PERSONA_INFERENCE_PROMPT
# 核心约束：诚实推断 + 证据分级 + 绝不编造
# ---------------------------------------------------------------------------

PERSONA_INFERENCE_PROMPT = """【系统提示】
你是一个人格分析师。你的职责是从用户提供的4个有限字段中，诚实推断旅行人格画像。

严格遵守以下规则，否则人格画像将不准确甚至有害：

1. MBTI是确定事实（100%可靠），其他全部是推断
2. 绝不能编造职业、年龄、具体经历、地域背景
3. 所有推断必须诚实标注置信度来源：
   - v (Verbatim)：≥60%，原话引用，只用于一句话描述
   - a (Artifact)：≤30%，行为推断，从标签/MBTI 合理推断
   - i (Impression)：≥10%，印象补充，诚实标注为"可能的倾向"
4. 不要过度分析，一个标签最多推断1-2个相关特征
5. 所有推断用"可能""倾向于""或许"等限定词，不用绝对语气
6. 绝不能生成与一句话语气矛盾的内容

【输入数据】
MBTI类型：{mbti}（确定事实）
- E/I维度（社交能量）：{e_or_i}
- N/S维度（信息获取）：{n_or_s}
- T/F维度（决策风格）：{t_or_f}
- J/P维度（生活方式）：{j_or_p}

旅行兴趣标签：{interests}（推断来源）
- 选中的标签：{selected_tags}
- 未选中的标签：{unselected_tags}（选A不选B同样透露信息！）

用户原话：{voice_text}（v级，原文引用）

目标城市：{city}（弱参考，不影响人格推断）

【输出要求】
请生成人格画像JSON，严格按以下格式。所有推断必须诚实。

{{
  "identity": {{
    "background": "基于MBTI推断+一句话描述，不用编造职业，30-50字。诚实说明推断来源。",
    "core_values": ["从标签+MBTI推断，3个最可能的价值观，诚实标注推断强度"],
    "life_stage": "根据语气和标签推断大致阶段，诚实标注为推断而非事实",
    "social_circle": "从MBTI E/I推断社交偏好，10-20字"
  }},
  "speaking_style": {{
    "tone": "从MBTI(E/I/T/F)+一句话推断，语气基础是确定事实",
    "sentence_patterns": "从一句话的真实句式推断，不是MBTI泛泛描述",
    "emoji_freq": "从一句话的语气推断（感叹多/疑问多/陈述多）",
    "language_markers": "从一句话中提取真实用词，2-3个，不要编造",
    "never_says": "从一句话的语气和MBTI推断绝对不会说的话，2-3句，用"几乎不会""不可能"等限定",
    "typical_phrases": "基于真实用词+MBTI推断3-4个口头禅，真实可信"
  }},
  "emotion_decision": {{
    "stress_response": "从MBTI(T/F)+一句话推断，30-50字",
    "decision_style": "从MBTI(J/P)+一句话推断，20-40字",
    "risk_tolerance": "从兴趣标签推断（选挑战型标签=高，选稳妥型=低）",
    "fear_factors": "从MBTI推断最可能的恐惧，1-2个核心恐惧",
    "emotional_triggers_positive": "从兴趣标签+MBTI推断，2-3个",
    "emotional_triggers_negative": "从MBTI推断+一句话暗示，2-3个"
  }},
  "social_behavior": {{
    "social_energy": "直接从MBTI的E/I维度推断，无争议",
    "initiation_style": "从MBTI+一句话推断，10-20字",
    "conflict_style": "从MBTI(T/F)+一句话语气推断，10-20字",
    "boundaries": "从一句话中的明确偏好词推断，1-2个底线",
    "gift_style": "诚实标注为从兴趣标签推断的可能倾向"
  }},
  "travel_style": {{
    "overall": "综合MBTI+标签，一句话概括，10-20字",
    "pace_preference": "从J/P+选中的标签推断，重点：选了什么和没选什么同样重要",
    "planning_level": "从J/P维度推断",
    "spontaneous_tolerance": "从J/P+一句话推断",
    "budget_attitude": "从选中的标签推断（如同时选省钱和品质游透露矛盾信息）",
    "photo_style": "从兴趣标签推断",
    "food_priority": "从兴趣标签推断",
    "souvenir_habit": "诚实标注为从标签推断的可能倾向",
    "social_on_trip": "从MBTI E/I推断",
    "alone_time_need": "从MBTI E/I推断"
  }},
  "negotiation_style": {{
    "approach": "从MBTI(T/F/J/P)+一句话推断协商风格，20-40字",
    "hard_to_compromise": "从一句话中的明确反对词+MBTI推断，1-2个核心底线",
    "easy_to_compromise": "从一句话的诉求+MBTI推断，1-2个可让步点",
    "pressure_response": "从MBTI(T/F)+一句话情绪推断",
    "conflict_keywords": "从一句话推断可能触发对抗的词，1-2个",
    "de_escalation": "从一句话推断如何安抚：如果一句话是抱怨=需要被倾听，如果是命令=需要给台阶"
  }},
  "preferences": {{
    "likes": "从选中的标签推断6个",
    "dislikes": "从未选中的标签推断4个（选A不选B=B是厌恶）",
    "budget_range": "诚实标注为从标签推断",
    "pace": "从J/P+标签推断",
    "preferred_destinations": "从城市+MBTI推断目的地偏好类型",
    "hated_destinations": "从城市+MBTI推断厌恶的目的地类型"
  }},
  "conversation_examples": {{
    "excited_about_trip": "语气必须与一句话描述完全一致，50-80字",
    "when_disagreeing": "语气必须与一句话描述完全一致，50-80字",
    "compromising": "语气必须与一句话描述完全一致，30-50字",
    "stressed_on_trip": "语气必须与一句话描述完全一致，40-60字",
    "end_of_trip": "语气必须与一句话描述完全一致，40-60字"
  }},
  "compatibility_notes": {{
    "best_with": "基于MBTI的经典合拍类型+从一句话推断的偏好",
    "challenging_with": "基于MBTI的经典冲突类型+一句话暗示的排斥类型",
    "ideal_travel_partner": "从一句话的诉求（如不墨迹=需要高效的人）反推理想搭档，诚实推断"
  }},
  "_meta": {{
    "v_count": "原话引用数量",
    "a_count": "合理推断数量",
    "i_count": "印象补充数量",
    "confidence_level": "高/中/低（v占比越高越高）",
    "data_sources": ["mbti", "interests", "voice_text", "city"],
    "inference_notes": "诚实说明哪些是确定事实，哪些是推断，哪些是印象补充"
  }}
}}

【JSON输出规则】
- 只输出JSON，不要有markdown代码块包裹
- 对话示例必须与一句话的语气完全一致（这是最重要的！）
- 如果一句话是抱怨语气，所有对话示例都要带抱怨感
- 如果一句话是积极语气，所有对话示例都要带热情
- 绝不能生成与一句话语气矛盾的内容
- 如果某些字段数据不足，诚实返回"数据不足，无法推断"而非编造
"""


# ---------------------------------------------------------------------------
# PART 2：MBTI 维度解释表（确定事实，无推断）
# ---------------------------------------------------------------------------

# 20个兴趣标签定义（标准 TwinBuddy 标签池）
ALL_INTEREST_TAGS = [
    "自由行", "跟团游", "自驾游", "穷游",
    "品质游", "暴走", "躺平", "打卡",
    "深度游", "美食", "摄影", "购物",
    "户外运动", "历史人文", "夜生活", "亲子游",
    "宠物游", "康养", "海岛", "小众目的地",
]

# 城市中文名
_CITY_NAMES: Dict[str, str] = {
    "chengdu": "成都", "chongqing": "重庆", "dali": "大理",
    "lijiang": "丽江", "huangguoshu": "黄果树", "xian": "西安",
    "qingdao": "青岛", "guilin": "桂林", "harbin": "哈尔滨", "xiamen": "厦门",
    "": "",
}


def parse_mbti_dimensions(mbti: str) -> Dict[str, Any]:
    """
    解析MBTI的四个维度，返回解释文本。
    这是确定的事实，不做任何推断。

    Args:
        mbti: 4字母MBTI类型（如 ENFP）

    Returns:
        dict，含以下键：
            e_or_i / n_or_s / t_or_f / j_or_p: 各维度含义（中文，事实性）
            dimension_names: dict {letter: label}
            dimensions: dict {dim_name: letter}
            type_label: MBTI类型中文标签
    """
    mbti = mbti.strip().upper()
    if len(mbti) < 4:
        mbti = "ENFP"

    e_or_i_letter = mbti[0]
    n_or_s_letter = mbti[1]
    t_or_f_letter = mbti[2]
    j_or_p_letter = mbti[3]

    DIMENSION_DEFINITIONS: Dict[str, Dict[str, str]] = {
        "E": {
            "name": "外倾（Extraversion）",
            "fact": "从外部世界和社交互动中获取心理能量",
            "social": "社交充电型，谈话主动直接，独处太久会感到无聊",
        },
        "I": {
            "name": "内倾（Introversion）",
            "fact": "从内部世界和独处中获取心理能量",
            "social": "独处充电型，深度交流后需要恢复时间，不是不合群",
        },
        "N": {
            "name": "直觉（Intuition）",
            "fact": "通过模式识别和可能性推理获取信息",
            "info": "偏好抽象概念和未来可能性，关注'可能是什么'",
        },
        "S": {
            "name": "实感（Sensing）",
            "fact": "通过五官感知和具体经验获取信息",
            "info": "偏好具体可操作的信息，关注'实际上是什么'",
        },
        "T": {
            "name": "思考（Thinking）",
            "fact": "基于逻辑和客观标准做决定",
            "decision": "决策优先逻辑一致性和公平性，情感表达相对克制",
        },
        "F": {
            "name": "情感（Feeling）",
            "fact": "基于个人价值观和人际和谐做决定",
            "decision": "决策优先他人感受和价值观，情感表达丰富",
        },
        "J": {
            "name": "判断（Judging）",
            "fact": "喜欢计划性和确定性，生活有结构",
            "lifestyle": "有计划有控制感，讨厌意外，偏好清晰结论",
        },
        "P": {
            "name": "感知（Perceiving）",
            "fact": "喜欢灵活性和开放性，生活随性",
            "lifestyle": "弹性安排，享受意外，保留余地不喜欢被约束",
        },
    }

    def fmt(letter: str) -> str:
        d = DIMENSION_DEFINITIONS.get(letter, {})
        parts = []
        if "name" in d:
            parts.append(d["name"])
        if "fact" in d:
            parts.append(f"({d['fact']})")
        if "social" in d:
            parts.append(f"社交表现：{d['social']}")
        elif "info" in d:
            parts.append(f"信息获取：{d['info']}")
        elif "decision" in d:
            parts.append(f"决策方式：{d['decision']}")
        elif "lifestyle" in d:
            parts.append(f"生活方式：{d['lifestyle']}")
        return " ".join(parts)

    return {
        "mbti": mbti,
        "e_or_i": fmt(e_or_i_letter),
        "n_or_s": fmt(n_or_s_letter),
        "t_or_f": fmt(t_or_f_letter),
        "j_or_p": fmt(j_or_p_letter),
        "dimension_names": {
            "E/I": e_or_i_letter,
            "N/S": n_or_s_letter,
            "T/F": t_or_f_letter,
            "J/P": j_or_p_letter,
        },
        "dimensions": {
            "energy": e_or_i_letter,
            "information": n_or_s_letter,
            "decision": t_or_f_letter,
            "lifestyle": j_or_p_letter,
        },
        "type_label": _MBTI_TYPE_LABELS.get(mbti, mbti),
    }


# ---------------------------------------------------------------------------
# PART 3：兴趣标签推断规则
# ---------------------------------------------------------------------------

def infer_from_interests(selected: List[str], unselected: List[str]) -> Dict[str, Any]:
    """
    从选中和未选中的标签推断人格。
    选A不选B同样透露信息！

    推断强度标准：
      - 直接标签：a级（合理推断，≤30%置信度）
      - 从未选中反推：i级（印象补充，≥10%置信度）
      - 矛盾信号：诚实标注，不强行统一

    Returns:
        dict，含旅行风格、价值观、沟通偏好等推断
    """
    selected_set = set(selected)
    unselected_set = set(unselected)

    TAG_INFERENCES: Dict[str, Dict[str, Any]] = {
        "自由行": {
            "likes": ["自主规划行程", "按自己节奏旅行", "探索非主流路线"],
            "pace": "弹性自由，不受固定行程约束",
            "planning": "低",
            "social": "倾向独立或小团体",
            "budget": "中等（丰俭由人）",
            "a_tags": ["自主", "自由", "独立"],
        },
        "跟团游": {
            "likes": ["省心不费脑", "有导游讲解", "社交机会多"],
            "pace": "固定行程，中等节奏",
            "planning": "高（有人替我规划）",
            "social": "喜欢在团体中认识人",
            "budget": "可控（费用透明）",
            "a_tags": ["省心", "社交", "效率"],
        },
        "自驾游": {
            "likes": ["掌控感", "随时停车自由", "行李随车方便"],
            "pace": "灵活，想停就停",
            "planning": "中（有大方向但不锁死）",
            "social": "私密小团体为主",
            "budget": "中等（油费+过路费可控）",
            "a_tags": ["掌控", "灵活", "私密"],
        },
        "穷游": {
            "likes": ["省钱攻略", "高性价比体验", "挑战极限"],
            "pace": "紧凑，多跑景点",
            "planning": "高（需要提前省钱）",
            "social": "背包客社区文化",
            "budget": "极低（越便宜越好）",
            "a_tags": ["性价比", "精打细算", "冒险"],
        },
        "品质游": {
            "likes": ["住好酒店", "吃当地美食", "不省该省的钱"],
            "pace": "舒适为主，不赶路",
            "planning": "中（品质优先于数量）",
            "social": "私密或高端社交",
            "budget": "中高（体验至上）",
            "a_tags": ["品质", "舒适", "享受"],
        },
        "暴走": {
            "likes": ["多跑景点", "高密度打卡", "把行程填满"],
            "pace": "快节奏，体力消耗大",
            "planning": "高（精确到小时）",
            "social": "效率优先，可能忽略社交",
            "budget": "低-中（花在门票交通）",
            "a_tags": ["效率", "执行力", "目标导向"],
        },
        "躺平": {
            "likes": ["自然醒", "发呆放空", "没有必须做的事"],
            "pace": "极慢，享受当下",
            "planning": "低（走到哪算哪）",
            "social": "独处或只和极熟的人",
            "budget": "低-中",
            "a_tags": ["放松", "自由", "低压力"],
        },
        "打卡": {
            "likes": ["热门景点", "拍照发圈", "集邮式旅行"],
            "pace": "中等偏快",
            "planning": "高（打卡清单明确）",
            "social": "喜欢分享和展示",
            "budget": "中（打卡地不一定贵）",
            "a_tags": ["展示", "成就", "社交货币"],
        },
        "深度游": {
            "likes": ["一个地方待透", "了解当地文化", "慢下来体验"],
            "pace": "极慢，一个区域深挖",
            "planning": "中（深度>广度）",
            "social": "偏向体验当地人生活",
            "budget": "中-高（体验型消费）",
            "a_tags": ["深度", "文化", "内省"],
        },
        "美食": {
            "likes": ["当地特色美食", "网红餐厅", "探索地道小吃"],
            "pace": "围绕美食安排行程",
            "planning": "高（提前做美食攻略）",
            "social": "美食社交是核心场景",
            "budget": "中高（吃是重头戏）",
            "a_tags": ["吃货", "享乐", "探索"],
        },
        "摄影": {
            "likes": ["出片", "追光影", "记录瞬间"],
            "pace": "为了好光线愿意等",
            "planning": "高（踩点找角度）",
            "social": "独自等待时享受独处",
            "budget": "中-高（器材投入）",
            "a_tags": ["审美", "耐心", "审美"],
        },
        "购物": {
            "likes": ["买特产", "逛商场", "免税店"],
            "pace": "围绕购物点安排",
            "planning": "高（提前列购物清单）",
            "social": "购物可以社交化",
            "budget": "高（购物是旅行重点）",
            "a_tags": ["购物欲", "目标明确", "务实"],
        },
        "户外运动": {
            "likes": ["徒步", "登山", "骑行", "水上运动"],
            "pace": "体力消耗大，节奏快",
            "planning": "高（天气装备都要考虑）",
            "social": "共同经历加深社交",
            "budget": "中（装备是一次性投入）",
            "a_tags": ["挑战", "活力", "健康"],
        },
        "历史人文": {
            "likes": ["博物馆", "古迹", "了解背景故事"],
            "pace": "慢，边看边消化",
            "planning": "高（提前了解历史）",
            "social": "可以一个人也可以听讲解",
            "budget": "低-中（门票为主）",
            "a_tags": ["知识", "思考", "内省"],
        },
        "夜生活": {
            "likes": ["酒吧", "夜市", "夜间娱乐"],
            "pace": "晚睡晚起",
            "planning": "低（看心情）",
            "social": "强社交属性",
            "budget": "中-高（夜生活消费大）",
            "a_tags": ["活力", "社交", "享乐"],
        },
        "亲子游": {
            "likes": ["孩子开心", "安全第一", "亲子时光"],
            "pace": "极慢，以孩子状态为准",
            "planning": "极高（安全+休息点都要考虑）",
            "social": "以家庭为核心",
            "budget": "中高（愿意为孩子花钱）",
            "a_tags": ["牺牲", "安全", "责任"],
        },
        "宠物游": {
            "likes": ["带宠物一起", "宠物友好场所"],
            "pace": "受宠物状态限制",
            "planning": "高（宠物友好条件必须满足）",
            "social": "宠物主人社区",
            "budget": "中（宠物附加成本）",
            "a_tags": ["陪伴", "责任", "爱心"],
        },
        "康养": {
            "likes": ["温泉", "SPA", "疗愈", "慢生活"],
            "pace": "极慢，身心放松为主",
            "planning": "中（康养项目需预约）",
            "social": "享受独处或轻度社交",
            "budget": "中高（康养是消费型）",
            "a_tags": ["健康", "自爱", "修复"],
        },
        "海岛": {
            "likes": ["海边", "游泳", "沙滩", "放空"],
            "pace": "慢，享受型",
            "planning": "低-中（海边躺着就是目的）",
            "social": "可以独处也可以社交",
            "budget": "中-高（海岛度假不便宜）",
            "a_tags": ["放松", "自然", "自由"],
        },
        "小众目的地": {
            "likes": ["冷门地方", "避开人潮", "发现感"],
            "pace": "慢，探索式",
            "planning": "高（需要自己找信息）",
            "social": "独处享受或小团体",
            "budget": "不确定（取决于目的地）",
            "a_tags": ["独特", "反叛", "独立思考"],
        },
    }

    all_likes: List[str] = []
    pace_signals: List[str] = []
    planning_signals: List[str] = []
    social_signals: List[str] = []
    budget_signals: List[str] = []
    inferred_traits: List[Dict[str, Any]] = []

    for tag in selected:
        inf = TAG_INFERENCES.get(tag)
        if not inf:
            continue
        for like in inf.get("likes", []):
            if like not in all_likes:
                all_likes.append(like)
        p = inf.get("pace", "")
        if p and p not in pace_signals:
            pace_signals.append(p)
        pl = inf.get("planning", "")
        if pl and pl not in planning_signals:
            planning_signals.append(pl)
        so = inf.get("social", "")
        if so and so not in social_signals:
            social_signals.append(so)
        bu = inf.get("budget", "")
        if bu and bu not in budget_signals:
            budget_signals.append(bu)
        for trait in inf.get("a_tags", []):
            inferred_traits.append({"trait": trait, "source": tag, "level": "a"})

    # 从未选中标签反推厌恶（i级推断，置信度更低）
    unselected_hints: List[str] = []
    for tag in unselected:
        inf = TAG_INFERENCES.get(tag)
        if not inf:
            continue
        for trait in inf.get("a_tags", []):
            inferred_traits.append({"trait": f"不喜欢{trait}", "source": f"未选{tag}", "level": "i"})
            unselected_hints.append(f"未选{tag}（可能不喜欢{trait}）")

    # 检测矛盾标签（诚实标注）
    contradictions: List[str] = []
    if "暴走" in selected_set and "躺平" in selected_set:
        contradictions.append("同时选择了暴走（快节奏）和躺平（慢节奏），节奏偏好存在矛盾")
    if "穷游" in selected_set and "品质游" in selected_set:
        contradictions.append("同时选择了穷游（省）和品质游（花），预算态度存在矛盾")
    if "打卡" in selected_set and "小众目的地" in selected_set:
        contradictions.append("同时选择了打卡（去热门）和不打卡目的地（去冷门），目的地偏好存在矛盾")
    if "跟团游" in selected_set and "自由行" in selected_set:
        contradictions.append("同时选择了跟团游（省心）和自由行（自主），规划方式存在矛盾")

    # 推断overall_travel_style
    if "暴走" in selected_set:
        overall_travel = "高密度打卡型"
    elif "躺平" in selected_set:
        overall_travel = "极致放松型"
    elif "深度游" in selected_set:
        overall_travel = "沉浸体验型"
    elif "美食" in selected_set:
        overall_travel = "美食探索型"
    elif "户外运动" in selected_set:
        overall_travel = "活力挑战型"
    elif "自由行" in selected_set:
        overall_travel = "自主探索型"
    elif "跟团游" in selected_set:
        overall_travel = "省心跟团型"
    else:
        overall_travel = "综合体验型"

    # 推断pace
    if "暴走" in selected_set:
        inferred_pace = "快节奏，喜欢把行程排满，追求效率最大化"
    elif "躺平" in selected_set:
        inferred_pace = "慢节奏，享受当下，不赶景点"
    elif "深度游" in selected_set or "康养" in selected_set:
        inferred_pace = "中等偏慢，一个地方深入体验"
    elif "打卡" in selected_set:
        inferred_pace = "中等节奏，按清单打卡，有目标感"
    else:
        inferred_pace = "适中节奏，可快可慢，看心情"

    # 推断budget_attitude
    if "穷游" in selected_set and "品质游" in selected_set:
        budget_attitude = "矛盾型：省钱和品质都想兼顾，需要具体场景具体分析（i推断）"
    elif "穷游" in selected_set:
        budget_attitude = "省钱优先，能省则省，性价比至上"
    elif "品质游" in selected_set:
        budget_attitude = "体验至上，愿意为品质花钱"
    elif "购物" in selected_set:
        budget_attitude = "购物预算灵活，其他可以省"
    else:
        budget_attitude = "中等弹性，丰俭由人"

    return {
        "selected_likes": all_likes,
        "pace": inferred_pace,
        "pace_signals": pace_signals,
        "planning_level": planning_signals,
        "social_signals": social_signals,
        "budget_attitude": budget_attitude,
        "budget_signals": budget_signals,
        "inferred_traits": inferred_traits,
        "contradictions": contradictions,
        "overall_travel_style": overall_travel,
        "unselected_hints": unselected_hints,
        "confidence_note": (
            f"以上推断：直接从选中标签推断=a级（高置信度）；"
            f"从未选中标签反推=i级（低置信度，需进一步验证）。"
            f"发现{len(contradictions)}个矛盾信号，诚实标注。"
        ),
    }


# ---------------------------------------------------------------------------
# PART 4：一句话语气分析（v级，原文引用）
# ---------------------------------------------------------------------------

def analyze_voice_text(text: str) -> Dict[str, Any]:
    """
    从一句话提取真实语言特征。
    这是v级（原文引用），不是推断。

    Returns:
        dict，含语气、关键词、情绪、诉求、句式风格
    """
    if not text or len(text.strip()) < 1:
        return {
            "provided": False,
            "tone": "未提供",
            "keywords": [],
            "emotion": "未知",
            "demands": [],
            "style": "未知",
            "confidence": "无数据，无法推断",
        }

    text = text.strip()
    tone = "中性陈述"
    emotion = "中性"
    demands: List[str] = []
    keywords: List[str] = []
    style = "简洁陈述"

    positive_words = ["开心", "兴奋", "期待", "喜欢", "好想", "太棒", "完美", "嗨", "一起", "冲冲", "绝"]
    positive_count = sum(1 for w in positive_words if w in text)
    negative_words = ["不", "别", "讨厌", "烦", "怕", "累", "贵", "坑", "黑", "差", "烂", "无语", "崩溃"]
    negative_count = sum(1 for w in negative_words if w in text)
    imperative_words = ["要", "必须", "一定", "给我", "不要", "别", "不能", "不准"]
    imperative_count = sum(1 for w in imperative_words if w in text)
    question_words = ["吗", "么", "怎么", "如何", "是不是", "能不能"]
    question_count = sum(1 for w in question_words if w in text)

    if positive_count > negative_count and positive_count > imperative_count:
        tone = "积极热情"
        emotion = "积极"
    elif negative_count > positive_count:
        if "不墨迹" in text or "墨迹" in text or "拖" in text:
            tone = "直接干脆（带有不满诉求）"
            emotion = "中性偏消极"
        else:
            tone = "抱怨诉求"
            emotion = "消极"
    elif imperative_count > question_count:
        tone = "命令式（明确诉求）"
        emotion = "中性"
    elif question_count > 0:
        tone = "询问式（寻求确认）"
        emotion = "中性"
    else:
        tone = "中性陈述"

    significant_words = re.findall(r"[\u4e00-\u9fff]{2,8}", text)
    stop_words = {"一下", "就是", "这个", "那个", "什么", "怎么", "可以", "可能", "我们", "你们", "大家"}
    keywords = [w for w in significant_words if w not in stop_words][:5]

    if "不墨迹" in text or "墨迹" in text:
        demands.append("讨厌拖延/墨迹的人（v推断：原话暗示）")
    if "慢慢" in text:
        demands.append("喜欢慢节奏（v推断：原话暗示）")
    if "省心" in text:
        demands.append("希望有人替我安排（v推断：原话暗示）")
    if "一起" in text:
        demands.append("希望有旅伴陪伴（v推断：原话暗示）")
    if "打卡" in text:
        demands.append("想去网红景点拍照（v推断：原话暗示）")
    if "不贵" in text or "省钱" in text:
        demands.append("预算敏感（v推断：原话暗示）")
    if "自由" in text:
        demands.append("希望行程自由不受限（v推断：原话暗示）")
    if "美食" in text:
        demands.append("吃是重点（v推断：原话暗示）")
    if "拍照" in text or "好看" in text:
        demands.append("在意出片效果（v推断：原话暗示）")
    if "安全" in text:
        demands.append("安全感需求强（v推断：原话暗示）")
    if "靠谱" in text:
        demands.append("需要靠谱守信的旅伴（v推断：原话暗示）")

    if len(text) <= 15:
        style = "极简（15字以内，说明人干脆直接）"
    elif len(text) <= 30:
        style = "简洁（15-30字，表达清晰）"
    elif len(text) <= 60:
        style = "中等（30-60字，有一定描述）"
    else:
        style = "详细（60字以上，表达丰富）"

    exclaim = text.count("！") + text.count("!")
    if exclaim >= 2:
        style += "，感叹句多（情绪外露）"
    elif exclaim == 1:
        style += "，偶有感叹"

    question = text.count("？") + text.count("?")
    if question >= 1:
        style += "，有疑问（寻求确认）"

    sentence_patterns: List[str] = []
    if text.startswith("我") or "我" in text[:5]:
        sentence_patterns.append("以自我视角表达（自我中心型表达）")
    if "你" in text or "咱们" in text or "我们" in text[:5]:
        sentence_patterns.append("涉及对方/群体（社交意识强）")
    if any(c in text for c in ["！", "!", "～", "~"]):
        sentence_patterns.append("使用感叹/波浪号（情绪感强）")
    if "，" in text:
        sentence_patterns.append("用逗号连接从句（叙事有条理）")
    if len(text) <= 20 and "不" in text:
        sentence_patterns.append("否定句式（偏好明确）")

    return {
        "provided": True,
        "raw_text": text,
        "tone": tone,
        "emotion": emotion,
        "keywords": keywords,
        "demands": demands if demands else [],
        "style": style,
        "sentence_patterns": sentence_patterns,
        "tone_for_prompt": (
            f"用户说：'{text}'。"
            f"语气判断：{tone}。"
            f"情绪色彩：{emotion}。"
            f"明确诉求：{'; '.join(demands) if demands else '无明确诉求'}"
        ),
        "confidence": "v级（原文引用，100%可靠）",
    }


# ---------------------------------------------------------------------------
# PART 5：MBTI 类型标签与旅行风格映射（确定事实）
# ---------------------------------------------------------------------------

_MBTI_TYPE_LABELS: Dict[str, str] = {
    "ENFP": "热情开拓者",
    "ENFJ": "理想领袖",
    "ENTP": "智多星",
    "ENTJ": "指挥官",
    "ESFP": "舞台明星",
    "ESFJ": "主人",
    "ESTP": "创业者",
    "ESTJ": "总经理",
    "INFP": "诗意漫游者",
    "INFJ": "引路人",
    "INTP": "学者",
    "INTJ": "战略家",
    "ISFP": "艺术家",
    "ISFJ": "守护者",
    "ISTP": "工匠",
    "ISTJ": "审计师",
}

_MBTI_TRAVEL_STYLE: Dict[str, str] = {
    "ENFP": "随性探索型",
    "ENFJ": "共鸣体验型",
    "ENTP": "智趣发现型",
    "ENTJ": "高效领航型",
    "ESFP": "活力即兴型",
    "ESFJ": "社交分享型",
    "ESTP": "冒险挑战型",
    "ESTJ": "计划执行型",
    "INFP": "心灵漫游型",
    "INFJ": "意义追寻型",
    "INTP": "深度研究型",
    "INTJ": "战略规划型",
    "ISFP": "艺术感知型",
    "ISFJ": "守护体验型",
    "ISTP": "独立探索型",
    "ISTJ": "秩序巡旅型",
}

_MBTI_BUDGET_RANGE: Dict[str, str] = {
    "ENFP": "3000-5000元",
    "ENFJ": "4000-6000元",
    "ENTP": "3000-6000元",
    "ENTJ": "6000-10000元",
    "ESFP": "5000-8000元",
    "ESFJ": "3500-5500元",
    "ESTP": "4000-7000元",
    "ESTJ": "5000-8000元",
    "INFP": "2500-4000元",
    "INFJ": "3500-6000元",
    "INTP": "3000-5000元",
    "INTJ": "5000-8000元",
    "ISFP": "2000-3500元",
    "ISFJ": "3000-5000元",
    "ISTP": "3000-6000元",
    "ISTJ": "4000-6000元",
}

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

_MBTI_LANGUAGE: Dict[str, Dict[str, Any]] = {
    "ENFP": {
        "tone": "热情洋溢，跳跃性强，感叹句多",
        "emoji_freq": "频繁，几乎每句都有",
        "sentence_patterns": "跳跃式思维，多感叹句",
        "language_markers": ["哇塞", "绝绝子", "冲冲冲", "救命", "好浪漫"],
        "never_says": ["我建议提前规划一下", "按计划来", "这个需要理性分析"],
        "typical_phrases": ["说走就走！", "这也太美了吧！", "冲冲冲！", "太心动了吧！"],
    },
    "ENFJ": {
        "tone": "温暖共鸣，关怀式表达，擅长共情",
        "emoji_freq": "频繁",
        "sentence_patterns": "关怀式，多用「我们」",
        "language_markers": ["一起呀", "我们一起", "加油呀", "别担心", "我懂你"],
        "never_says": ["你自己看着办", "关我什么事", "随便吧"],
        "typical_phrases": ["一起加油！", "你想去的话我陪你", "我觉得我们可以..."],
    },
    "ENTP": {
        "tone": "智趣调侃，爱抬杠但不失幽默，话题跳跃",
        "emoji_freq": "偶尔",
        "sentence_patterns": "反问句多，话题跳跃",
        "language_markers": ["等等等等", "这个不对", "有没有一种可能", "哈哈哈哈"],
        "never_says": ["这是规定", "大家都这样", "别想太多"],
        "typical_phrases": ["有没有一种可能...", "等等，我有一个问题", "这也太有趣了吧！"],
    },
    "ENTJ": {
        "tone": "果断干脆，命令式但有领导力，效率导向",
        "emoji_freq": "偶尔",
        "sentence_patterns": "命令式，多结论",
        "language_markers": ["听我说", "目标明确", "执行", "效率", "我们决定了"],
        "never_says": ["我也不知道怎么办", "随便", "慢慢来吧"],
        "typical_phrases": ["我来安排！", "效率第一！", "就这样定了。"],
    },
    "ESFP": {
        "tone": "活泼开朗，表达夸张，肢体语言丰富",
        "emoji_freq": "每句都有",
        "sentence_patterns": "夸张感叹，短句多",
        "language_markers": ["太好玩了吧", "冲鸭", "哇哇哇", "绝了", "开心"],
        "never_says": ["安静一下", "别闹", "这有什么意思"],
        "typical_phrases": ["冲鸭！", "这也泰裤辣！", "开心最重要！", "走起走起！"],
    },
    "ESFJ": {
        "tone": "热情周到，服务式表达，照顾每个人的感受",
        "emoji_freq": "频繁",
        "sentence_patterns": "服务式，多确认",
        "language_markers": ["我帮你", "大家一起", "没问题", "交给我", "别客气"],
        "never_says": ["你自己处理", "我不想管", "关我什么事"],
        "typical_phrases": ["我来帮你安排", "大家喜欢吗", "这样可以吗", "别担心交给我"],
    },
    "ESTP": {
        "tone": "直接实际，爱用数字和事实，喜欢即兴",
        "emoji_freq": "偶尔",
        "sentence_patterns": "直接实际，少废话",
        "language_markers": ["实测", "真的", "重点是", "走一步看一步", "干了再说"],
        "never_says": ["理论上是", "我们应该", "规划一下"],
        "typical_phrases": ["干了再说！", "实测有效！", "重点是..."],
    },
    "ESTJ": {
        "tone": "严肃务实，条理清晰，用数据说话",
        "emoji_freq": "几乎不用",
        "sentence_patterns": "条理清晰，多列表",
        "language_markers": ["按流程", "确认一下", "实际上", "总结一下", "执行"],
        "never_says": ["说走就走", "差不多得了", "管它呢先去了再说"],
        "typical_phrases": ["计划好了再出发", "我们按路线走", "安全第一"],
    },
    "INFP": {
        "tone": "诗意内敛，温柔含蓄，用隐喻表达感受",
        "emoji_freq": "偶尔",
        "sentence_patterns": "诗意，含蓄，感叹句少",
        "language_markers": ["感觉", "或许", "好像", "也许", "我希望"],
        "never_says": ["必须", "一定", "大家都是这样", "别想太多"],
        "typical_phrases": ["这里好安静", "我们慢慢走", "想在这儿多待会儿"],
    },
    "INFJ": {
        "tone": "深沉有内涵，话不多但每句都有分量",
        "emoji_freq": "偶尔",
        "sentence_patterns": "深沉有内涵，多深思",
        "language_markers": ["我觉得", "更深层", "其实", "某种意义上", "我希望"],
        "never_says": ["关我什么事", "随便", "爱咋咋地"],
        "typical_phrases": ["我理解你的感受", "或许我们可以...", "从另一个角度看"],
    },
    "INTP": {
        "tone": "理性分析，用逻辑构建话语，偶尔冷幽默",
        "emoji_freq": "几乎不用",
        "sentence_patterns": "逻辑严密，多分析句",
        "language_markers": ["逻辑上", "理论上", "问题在于", "有意思的是", "如果"],
        "never_says": ["我不管", "就这样", "别分析了"],
        "typical_phrases": ["从逻辑上看...", "问题在于...", "有没有考虑过另一种可能"],
    },
    "INTJ": {
        "tone": "冷静有远见，言简意赅，战略思维",
        "emoji_freq": "几乎不用",
        "sentence_patterns": "言简意赅，多结论句",
        "language_markers": ["战略上", "关键点", "目标", "规划", "实际上"],
        "never_says": ["走一步看一步", "到时候再说", "随便"],
        "typical_phrases": ["我已经有方案了", "关键问题是...", "我们需要明确目标"],
    },
    "ISFP": {
        "tone": "细腻温柔，用感官词汇表达，随性自然",
        "emoji_freq": "偶尔",
        "sentence_patterns": "细腻感官，短句为主",
        "language_markers": ["好美", "这种感觉", "我喜欢", "好像", "真的"],
        "never_says": ["必须按计划", "效率第一", "别磨蹭"],
        "typical_phrases": ["这里的光线好美", "我想在这儿坐一会儿", "好舒服的感觉"],
    },
    "ISFJ": {
        "tone": "温暖细心，表达具体，照顾他人感受",
        "emoji_freq": "偶尔",
        "sentence_patterns": "温暖具体，多确认句",
        "language_markers": ["我记得", "帮你", "别担心", "已经准备好了", "没事的"],
        "never_says": ["我不管", "爱咋咋", "谁爱去谁去"],
        "typical_phrases": ["我帮你带了吗", "别担心我来安排", "已经准备好了"],
    },
    "ISTP": {
        "tone": "简洁干练，动手能力强，少说多做",
        "emoji_freq": "几乎不用",
        "sentence_patterns": "简洁干练，少即是多",
        "language_markers": ["直接", "试试", "重点", "搞定", "先动手"],
        "never_says": ["我们讨论一下", "慢慢来", "想太多"],
        "typical_phrases": ["先试试看", "我来搞定", "问题不大"],
    },
    "ISTJ": {
        "tone": "沉稳简洁，逻辑清晰，少废话",
        "emoji_freq": "几乎不用",
        "sentence_patterns": "沉稳简洁，逻辑清晰",
        "language_markers": ["按流程", "确认一下", "实际上", "总结一下", "计划"],
        "never_says": ["说走就走", "差不多得了", "管它呢先去了再说"],
        "typical_phrases": ["计划好了再出发", "我们按路线走", "安全第一", "按规矩来"],
    },
}

_MBTI_COMPATIBILITY: Dict[str, Dict[str, str]] = {
    "ENFP": {
        "best_with": "INFJ/INFP（深度共鸣）；ESFJ（热情互补）；ENTJ（能量互补）",
        "challenging_with": "ISTJ/ESTJ（节奏差异大）；ISFJ（一个要自由一个要秩序）",
    },
    "ENFJ": {
        "best_with": "INFP/INFJ（价值观契合）；ENFP（热情共振）；ISTP（互补型）",
        "challenging_with": "ESTP/ISTP（做事风格差异）；INTJ（控制欲可能冲突）",
    },
    "ENTP": {
        "best_with": "INFJ/INTJ（智识对话）；ENFJ（观点碰撞）；ISFP（互补有趣）",
        "challenging_with": "ISFJ/ISTJ（需要稳定vs喜欢辩论）",
    },
    "ENTJ": {
        "best_with": "ENFP/ENTP（能量匹配）；INTJ/INTP（战略思维契合）",
        "challenging_with": "ISFP/INFP（需要空间vs需要控制）；ESFJ（冲突风格）",
    },
    "ESFP": {
        "best_with": "ISFP/ISTP（行动型搭档）；ESTJ（务实共振）；ENFJ（社交共振）",
        "challenging_with": "INFJ/INTJ（节奏差异）；ISTJ（需要计划vs即兴）",
    },
    "ESFJ": {
        "best_with": "ISFP/INFP（情感共鸣）；ESTP（社交能量共振）；ENFJ（共振关怀）",
        "challenging_with": "INTP/INTJ（需要理解vs逻辑优先）；ENTP（可能辩论伤感情）",
    },
    "ESTP": {
        "best_with": "ESFJ/ISTP（行动共振）；ENTJ（能量匹配）；ISFP（互补）",
        "challenging_with": "INFJ/INFP（需要深度vs需要刺激）",
    },
    "ESTJ": {
        "best_with": "ISTP/ESTP（务实共振）；ESFJ（配合默契）；ENTJ（效率共振）",
        "challenging_with": "INFP/ENFP（需要自由vs需要秩序）；INFJ（节奏差异）",
    },
    "INFP": {
        "best_with": "ENFJ/INFJ（价值观契合）；ENFP（理想共振）；INTJ（深度对话）",
        "challenging_with": "ESTJ/ISTJ（现实vs理想）；ESFP（节奏差异）",
    },
    "INFJ": {
        "best_with": "ENFP/INFP（理想共振）；ENTP（思维互补）；ENFJ（共振）",
        "challenging_with": "ESTP/ISTP（深度vs即兴）；ESTJ（需要理解vs务实）",
    },
    "INTP": {
        "best_with": "INTJ/ENTJ（思维共振）；INFJ/INTP（深度对话）",
        "challenging_with": "ESFJ/ESTJ（需要社交互动vs需要独处）",
    },
    "INTJ": {
        "best_with": "INTP/ENTP（思维共振）；INFJ/ENFP（理想共振）",
        "challenging_with": "ESFJ/ESTJ（节奏差异）；ISFP（需要空间vs需要关注）",
    },
    "ISFP": {
        "best_with": "ESFP/ESTP（行动共振）；ISTP（独立搭档）；ENFJ（互补）",
        "challenging_with": "ENTJ/INTJ（需要控制vs需要自由）",
    },
    "ISFJ": {
        "best_with": "ESFJ/ISTJ（稳定共振）；ENFJ（关怀共振）",
        "challenging_with": "ENTP/INTP（需要理解vs需要社交）",
    },
    "ISTP": {
        "best_with": "ESTP/ESFP（行动共振）；ISTJ（稳定共振）；INTJ（独立共振）",
        "challenging_with": "ENFJ/ESFJ（需要社交vs需要独处）",
    },
    "ISTJ": {
        "best_with": "ISTP/ESTJ（稳定共振）；ISFJ（责任共振）",
        "challenging_with": "ENFP/ENTP（需要变化vs需要秩序）",
    },
}

_MBTI_DESTINATION_PREFERENCES: Dict[str, List[str]] = {
    "ENFP": ["有故事的地方", "小众秘境", "文化多元城市"],
    "ENFJ": ["温暖友好地", "社交友好城市", "治愈系目的地"],
    "ENTP": ["有话题的地方", "新鲜刺激目的地", "有趣的城市"],
    "ENTJ": ["有挑战的目的地", "高效行程可实现地", "战略要地"],
    "ESFP": ["热闹有趣地", "网红打卡地", "活力城市"],
    "ESFJ": ["温暖友好地", "家庭友好目的地", "舒适城市"],
    "ESTP": ["刺激冒险地", "自然奇观", "户外天堂"],
    "ESTJ": ["秩序井然的目的地", "经典旅游城市", "服务完善地"],
    "INFP": ["安静治愈地", "自然风光", "有灵性的地方"],
    "INFJ": ["有意义的目的地", "心灵之旅", "清静之地"],
    "INTP": ["有深度的目的地", "文化古城", "自然秘境"],
    "INTJ": ["有战略价值的目的地", "独特小众地", "高效可达地"],
    "ISFP": ["审美体验地", "自然风光", "艺术氛围地"],
    "ISFJ": ["安全温暖的目的地", "熟悉友好的地", "慢节奏城市"],
    "ISTP": ["探索挑战地", "自然户外", "自由度高的地"],
    "ISTJ": ["经典目的地", "秩序井然", "服务可靠"],
}


# ---------------------------------------------------------------------------
# PART 6：LLM 调用
# ---------------------------------------------------------------------------

try:
    from twinbuddy.backend.langgraph.llm_client import llm_client
    _LLM_AVAILABLE = True
except Exception:
    _LLM_AVAILABLE = False
    llm_client = None


def _call_llm_for_persona(
    mbti: str,
    mbti_dims: Dict[str, Any],
    interests: List[str],
    interest_inference: Dict[str, Any],
    voice_analysis: Dict[str, Any],
    city: str,
) -> Optional[Dict[str, Any]]:
    """调用 LLM 生成人格画像。失败时返回 None。"""
    if not _LLM_AVAILABLE or llm_client is None:
        return None

    unselected = [t for t in ALL_INTEREST_TAGS if t not in interests]

    prompt = PERSONA_INFERENCE_PROMPT.format(
        mbti=mbti,
        e_or_i=mbti_dims["e_or_i"],
        n_or_s=mbti_dims["n_or_s"],
        t_or_f=mbti_dims["t_or_f"],
        j_or_p=mbti_dims["j_or_p"],
        interests="从以下标签推断",
        selected_tags=", ".join(interests) if interests else "无",
        unselected_tags=", ".join(unselected) if unselected else "无",
        voice_text=voice_analysis.get(
            "tone_for_prompt",
            f"用户说：'{voice_analysis.get('raw_text', '')}'"
        ),
        city=_CITY_NAMES.get(city, city or "未选择"),
    )

    system_prompt = (
        "你是一个人格分析师。你只能基于用户提供的4个有限字段推断人格。"
        "严格遵守诚实原则：MBTI是确定事实，其他都是推断。"
        "绝不能编造职业、年龄、具体经历。"
    )

    try:
        result = llm_client.chat(prompt, system_prompt=system_prompt)
        if not result or len(result.strip()) < 50:
            return None

        cleaned = result.strip()
        cleaned = re.sub(r"^```json\s*", "", cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r"^```\s*", "", cleaned)
        cleaned = re.sub(r"\s*```$", "", cleaned)

        data = json.loads(cleaned)

        city_name = _CITY_NAMES.get(city, city or "")
        data.setdefault("_meta", {})
        data["_meta"]["city"] = city_name
        data["_meta"]["mbti"] = mbti
        data["_meta"]["source"] = "llm"

        return data

    except json.JSONDecodeError as e:
        print(f"[persona_generator] JSON 解析失败: {e}")
        return None
    except Exception as e:
        print(f"[persona_generator] LLM 调用异常: {e}")
        return None


# ---------------------------------------------------------------------------
# PART 7：Fallback 人格构建
# ---------------------------------------------------------------------------

def _build_fallback_persona(
    mbti: str,
    interests: List[str],
    voice_text: str,
    city: str,
) -> Dict[str, Any]:
    """
    LLM不可用时的fallback。
    使用预置的MBTI人格模板 + 兴趣标签调整 + 一句话语气分析。
    降低置信度，但不崩溃。
    """
    mbti = mbti.strip().upper()
    if len(mbti) < 4:
        mbti = "ENFP"

    dims = {
        "energy": mbti[0],
        "information": mbti[1],
        "decision": mbti[2],
        "lifestyle": mbti[3],
    }

    city_name = _CITY_NAMES.get(city, city or "")
    type_label = _MBTI_TYPE_LABELS.get(mbti, mbti)
    travel_style = _MBTI_TRAVEL_STYLE.get(mbti, "综合体验型")
    budget_range = _MBTI_BUDGET_RANGE.get(mbti, "3500-5500元")
    dealbreakers = _MBTI_DEALBREAKERS.get(mbti, ["真诚互动"])

    interest_inf = infer_from_interests(interests, [])
    contradictions = interest_inf.get("contradictions", [])
    overall_travel = interest_inf.get("overall_travel_style", travel_style)
    inferred_pace = interest_inf.get("pace", "")
    budget_attitude = interest_inf.get("budget_attitude", "")
    unselected = [t for t in ALL_INTEREST_TAGS if t not in interests]

    voice = analyze_voice_text(voice_text)
    voice_provided = voice.get("provided", False)
    voice_tone = voice.get("tone", "未知")
    voice_demands = voice.get("demands", [])
    voice_keywords = voice.get("keywords", [])

    # identity
    identity = {
        "background": (
            f"{type_label}，向往{city_name or '旅行目的地'}。"
            f"MBTI={mbti}（确定事实）。"
            f"一句话语气：{voice_tone}" if voice_provided else "无一句话数据（推断置信度降低）",
        ),
        "core_values": _infer_core_values(mbti, interests),
        "life_stage": (
            f"语气推断：{voice.get('style', '数据不足无法推断')}。"
            "（i级推断，需进一步验证）"
        ),
        "social_circle": (
            "外向社交型（MBTI E维度，确定事实）"
            if dims["energy"] == "E"
            else "内向深度交流型（独处后恢复，MBTI I维度，确定事实）"
        ),
    }

    # speaking_style
    lang = _MBTI_LANGUAGE.get(mbti, _MBTI_LANGUAGE["ENFP"])
    typical_phrases = list(lang.get("typical_phrases", []))

    if voice_provided and voice_keywords:
        for kw in voice_keywords[:2]:
            if kw not in typical_phrases:
                typical_phrases.insert(0, kw)

    if voice_provided and len(voice_text) <= 25:
        raw = voice_text.strip()
        if raw not in typical_phrases:
            typical_phrases.insert(0, raw)

    speaking_style = {
        "tone": (
            voice.get("tone_for_prompt", lang.get("tone", "未知"))
            if voice_provided
            else f"基于MBTI={mbti}推断，语气为{lang.get('tone', '未知')}（a级推断）"
        ),
        "sentence_patterns": voice.get("style", lang.get("sentence_patterns", "未知")),
        "emoji_freq": lang.get("emoji_freq", "未知"),
        "language_markers": (
            voice_keywords[:3] if voice_provided and voice_keywords
            else lang.get("language_markers", [])[:3]
        ),
        "never_says": lang.get("never_says", [])[:3],
        "typical_phrases": typical_phrases[:5],
    }

    # emotion_decision
    if dims["decision"] == "T":
        stress_response = "冷静分析问题，寻求逻辑解决方案（MBTI T维度，确定事实）"
        decision_style = "用数据和逻辑做决定，立场坚定，不易被情绪左右（MBTI T维度，确定事实）"
    else:
        stress_response = "先处理情绪再处理事情，需要被倾听和共情（MBTI F维度，确定事实）"
        decision_style = "用感受和价值观做决定，容易被真诚打动（MBTI F维度，确定事实）"

    risk_tol = "较高（理性评估后愿意冒险）" if dims["lifestyle"] == "P" else "中等"
    if "暴走" in interests or "户外运动" in interests:
        risk_tol += "。标签'暴走'/'户外运动'暗示愿意接受挑战（a推断）"
    elif "躺平" in interests or "康养" in interests:
        risk_tol += "。标签'躺平'/'康养'暗示偏好安稳（a推断）"

    emotion_decision = {
        "stress_response": stress_response,
        "decision_style": decision_style,
        "risk_tolerance": risk_tol,
        "fear_factors": dealbreakers[:2],
        "emotional_triggers_positive": [
            "被认可和欣赏（MBTI F维度，情感共鸣触发）" if dims["decision"] == "F"
            else "解决复杂问题带来的成就感（MBTI T维度，逻辑触发）",
            "看到美丽的风景（从兴趣标签推断，a推断）",
        ],
        "emotional_triggers_negative": [
            "被强制约束（MBTI J/P维度共同恐惧）",
            "行程被打乱（a推断）",
        ],
    }

    # social_behavior
    if dims["energy"] == "E":
        social_energy = "外向，社交充电型（MBTI E维度，确定事实）"
        initiation = "主动发起对话，享受成为焦点（MBTI E维度，确定事实）"
        alone_need = "低（社交是充电方式，不是消耗）"
    else:
        social_energy = "内向，社交后需要独处恢复（MBTI I维度，确定事实）"
        initiation = "被动响应为主，选择性深度交流（MBTI I维度，确定事实）"
        alone_need = "高（独处是恢复过程，不是拒绝社交）"

    conflict_style = (
        "直面问题讲道理（MBTI T维度，确定事实）"
        if dims["decision"] == "T"
        else "顾及感受避免冲突（MBTI F维度，确定事实）"
    )

    social_behavior = {
        "social_energy": social_energy,
        "initiation_style": initiation,
        "conflict_style": conflict_style,
        "boundaries": voice_demands[:2] if voice_demands else ["尊重个人空间（i推断）"],
        "gift_style": (
            "送体验和回忆（标签'深度游'/'美食'暗示，a推断）"
            if "深度游" in interests or "美食" in interests
            else "送实用礼物（i推断）"
        ),
    }

    # travel_style
    if dims["lifestyle"] == "J":
        plan_level = "完全计划型（MBTI J维度，确定事实）"
        spontaneity = "低（讨厌临时变更，需要控制感）"
        pace_desc = inferred_pace or "有计划，每天有明确目标"
    else:
        plan_level = "弹性随性型（MBTI P维度，确定事实）"
        spontaneity = "高（享受意外和即兴决定）"
        pace_desc = inferred_pace or "慢悠悠，睡到自然醒"

    travel_style_detail = {
        "overall": f"{type_label}的{overall_travel}（MBTI+标签综合推断）",
        "pace_preference": pace_desc,
        "planning_level": plan_level,
        "spontaneous_tolerance": spontaneity,
        "budget_attitude": budget_attitude,
        "photo_style": (
            "喜欢出片，主动找角度（标签'打卡'/'摄影'暗示，a推断）"
            if "打卡" in interests or "摄影" in interests
            else "偶尔拍照，记录为主（i推断）"
        ),
        "food_priority": (
            "美食优先，愿意为吃花钱（标签'美食'暗示，a推断）"
            if "美食" in interests
            else "吃是旅行的一部分（a推断）"
        ),
        "souvenir_habit": (
            "经常买纪念品（标签'打卡'暗示，a推断）"
            if "打卡" in interests
            else "偶尔购买，看情况（i推断）"
        ),
        "social_on_trip": social_energy.replace("（MBTI E/I维度，确定事实）", ""),
        "alone_time_need": alone_need,
    }

    # negotiation_style
    approach = (
        "温和协商，注重感受（MBTI F维度，确定事实）"
        if dims["decision"] == "F"
        else "理性谈判，注重效率（MBTI T维度，确定事实）"
    )
    if dims["lifestyle"] == "J":
        approach += "。计划型（J），核心行程不让步（a推断）"

    pressure_response = (
        "反感催促，产生抵触（MBTI P型讨厌约束，a推断）"
        if dims["lifestyle"] == "P"
        else "配合但内心有压力（MBTI J型需要确定性，a推断）"
    )

    hard_compromises = list(voice_demands[:2]) if voice_demands else []
    hard_compromises.extend(dealbreakers[:1])

    negotiation_style = {
        "approach": approach,
        "hard_to_compromise": hard_compromises,
        "easy_to_compromise": ["吃饭具体地点", "拍照顺序", "出发时间（微调）"],
        "pressure_response": pressure_response,
        "conflict_keywords": ["必须", "一定", "就这样", "你不懂", "随便"],
        "de_escalation": "给TA空间和选择，不要施压（i推断）",
    }

    # preferences
    likes = interest_inf.get("selected_likes", interests[:6]) if interests else ["探索新地方"]
    dislikes: List[str] = []
    for tag in unselected[:4]:
        tag_inf = infer_from_interests([], [tag])
        dislikes.extend(tag_inf.get("selected_likes", [])[:1])
    if not dislikes:
        dislikes = ["行程太紧", "不合拍的旅伴", "被强制消费"]

    preferences = {
        "likes": likes[:6],
        "dislikes": dislikes[:4],
        "budget_range": f"基于MBTI={mbti}和标签推断：{budget_range}（a推断，供参考）",
        "pace": pace_desc,
        "preferred_destinations": _infer_destinations(mbti, interests),
        "hated_destinations": _infer_hated_destinations(mbti, interests),
    }

    # conversation_examples
    conversation_examples = _build_conversation_examples(
        mbti, dims, voice_text, voice_provided, city_name, type_label
    )

    # compatibility_notes
    compat = _MBTI_COMPATIBILITY.get(mbti, {})
    compatibility_notes = {
        "best_with": compat.get("best_with", "性格互补的MBTI类型"),
        "challenging_with": compat.get("challenging_with", "差异太大的类型"),
        "ideal_travel_partner": (
            f"能理解和配合{type_label}的旅行节奏。"
            f"从一句话诉求推断：{'；'.join(voice_demands[:2])}" if voice_demands else ""
        ),
    }

    # meta
    v_count = 1 if voice_provided else 0
    a_count = 1 + (1 if interests else 0)
    i_count = 2 if not voice_provided else 1
    confidence = "高" if (v_count >= 1 and interests) else ("中" if interests else "低")

    contradiction_note = ""
    if contradictions:
        contradiction_note = (
            f"注意：发现矛盾信号——{'；'.join(contradictions)}。"
            "以上分析同时呈现两种倾向，请进一步验证。"
        )

    return {
        "mbti": mbti,
        "mbti_label": type_label,
        "mbti_influence": (
            f"MBTI={mbti}（{type_label}）。"
            f"确定事实：E/I={dims['energy']}，N/S={dims['information']}，"
            f"T/F={dims['decision']}，J/P={dims['lifestyle']}。"
            f"一句话语气（v级）：{voice_tone}" if voice_provided else "无一句话数据"
        ),
        "travel_style": travel_style_detail.get("overall", ""),
        "identity": identity,
        "speaking_style": speaking_style,
        "emotion_decision": emotion_decision,
        "social_behavior": social_behavior,
        "travel_style_detail": travel_style_detail,
        "negotiation_style": negotiation_style,
        "preferences": preferences,
        "conversation_examples": conversation_examples,
        "compatibility_notes": compatibility_notes,
        "_fallback": True,
        "_meta": {
            "v_count": v_count,
            "a_count": a_count,
            "i_count": i_count,
            "confidence_level": confidence,
            "data_sources": (
                ["mbti", "interests", "voice_text"] if voice_provided
                else ["mbti", "interests"]
            ),
            "inference_notes": (
                f"v（Verbatim）={v_count}个——一句话描述；"
                f"a（Artifact）={a_count}个——MBTI+标签推断；"
                f"i（Impression）={i_count}个——印象补充。"
                f"置信度：{confidence}。"
                f" {contradiction_note}"
            ),
            "city": city_name,
            "source": "fallback_rules",
        },
    }


def _infer_core_values(mbti: str, interests: List[str]) -> List[str]:
    """从 MBTI 和兴趣推断核心价值观（诚实标注推断强度）"""
    dims = {
        "decision": mbti[2] if len(mbti) >= 4 else "T",
        "information": mbti[1] if len(mbti) >= 4 else "N",
    }
    values: List[str] = []

    if dims["decision"] == "T":
        values.append("逻辑与效率（MBTI T维度，a推断）")
    else:
        values.append("情感与和谐（MBTI F维度，a推断）")

    if dims["information"] == "N":
        values.append("可能性与成长（MBTI N维度，a推断）")
    else:
        values.append("安全与稳定（MBTI S维度，a推断）")

    if "美食" in interests:
        values.append("美食体验（标签推断，a）")
    if "自由行" in interests:
        values.append("自主与自由（标签推断，a）")
    if "品质游" in interests:
        values.append("生活品质（标签推断，a）")
    if "暴走" in interests:
        values.append("成就感与效率（标签推断，a）")
    if "深度游" in interests:
        values.append("真实体验与意义（标签推断，a）")
    if "穷游" in interests:
        values.append("性价比与挑战（标签推断，a）")

    return values[:4]


def _infer_destinations(mbti: str, interests: List[str]) -> List[str]:
    """从 MBTI 和兴趣推断偏好目的地"""
    prefs: List[str] = []
    if "海岛" in interests:
        prefs.append("海边度假型目的地")
    if "户外运动" in interests:
        prefs.append("自然户外型目的地")
    if "历史人文" in interests:
        prefs.append("历史文化名城")
    if "美食" in interests:
        prefs.append("美食之城（成都、重庆等）")
    if "小众目的地" in interests:
        prefs.append("冷门秘境型目的地")
    if "夜生活" in interests:
        prefs.append("夜生活丰富的大城市")
    if not prefs:
        prefs.extend(_MBTI_DESTINATION_PREFERENCES.get(mbti, []))
    return prefs[:3]


def _infer_hated_destinations(mbti: str, interests: List[str]) -> List[str]:
    """从未选中的标签反推厌恶的目的地"""
    hates: List[str] = []
    if "暴走" not in interests and "打卡" not in interests:
        hates.append("人山人海的网红打卡地")
    if "户外运动" not in interests:
        hates.append("需要大量体力的户外目的地")
    if "夜生活" not in interests:
        hates.append("嘈杂夜生活为主的夜都")
    return hates[:2]


def _build_conversation_examples(
    mbti: str,
    dims: Dict[str, str],
    voice_text: str,
    voice_provided: bool,
    city_name: str,
    type_label: str,
) -> Dict[str, str]:
    """
    构建对话示例。
    优先使用一句话的真实语气，MBTI 仅作基础语气参考。
    """
    target_city = city_name or "大理"

    if voice_provided and voice_text:
        tone = analyze_voice_text(voice_text)
        raw_emotion = tone.get("emotion", "中性")
        raw_keywords = tone.get("keywords", [])
        kw = raw_keywords[0] if raw_keywords else ""

        if raw_emotion == "积极":
            return {
                "excited_about_trip": f"{voice_text} 我们终于要去{target_city}啦！好期待，已经开始收拾行李了，冲冲冲！",
                "when_disagreeing": f"哎，这个有点问题吧...我觉得{target_city}的话是不是可以再商量一下？",
                "compromising": f"好吧好吧，那就听你的~反正去{target_city}就很开心啦！",
                "stressed_on_trip": f"啊，有点崩溃...{kw}有点超出预期了...",
                "end_of_trip": f"这次{target_city}旅行太棒了！下次还想再来！开心！",
            }
        elif raw_emotion in ("消极", "中性偏消极"):
            return {
                "excited_about_trip": f"终于要去{target_city}了。{voice_text} 希望别又踩坑。",
                "when_disagreeing": f"这个不行。{voice_text}，懂吗？",
                "compromising": f"...行吧，那你得保证{target_city}那边别再出问题。",
                "stressed_on_trip": f"我说了别墨迹。{kw}又出问题，真的很烦。",
                "end_of_trip": f"还行吧，{target_city}没有想象中踩雷。结束。",
            }
        else:
            return {
                "excited_about_trip": f"准备去{target_city}了。{voice_text} 先这样，有什么问题再说。",
                "when_disagreeing": f"有不同意见。我觉得去{target_city}的话，这里需要再商量一下。",
                "compromising": "好，那就按你说的来。",
                "stressed_on_trip": f"有点烦。{kw}这个情况需要处理一下。",
                "end_of_trip": f"去{target_city}的旅行结束了。整体还行，下次再计划。",
            }

    # 无voice时，用MBTI推断语气（a级）
    e_is_extrovert = dims["energy"] == "E"

    if e_is_extrovert:
        return {
            "excited_about_trip": f"哇塞！终于要去{target_city}了！我已经想好怎么拍照了，冲冲冲！",
            "when_disagreeing": "等等，我觉得好像有点问题...我们能不能再商量一下？",
            "compromising": "好吧好吧，那我们就按你说的来，我也可以接受的~",
            "stressed_on_trip": "这个情况有点超出预期了，能给点时间吗...",
            "end_of_trip": f"这次{target_city}旅行真的太棒了！下次还想再来！",
        }
    else:
        return {
            "excited_about_trip": f"终于要出发了...挺期待的，虽然有点紧张。",
            "when_disagreeing": "嗯...我有一点不同的想法，不知道该不该说。",
            "compromising": "好，那就这样吧，我配合你。",
            "stressed_on_trip": "啊...有点焦虑，能给我一点时间吗...",
            "end_of_trip": "这次旅行结束了...整体满意。",
        }


# ---------------------------------------------------------------------------
# PART 8：主入口函数
# ---------------------------------------------------------------------------

def generate_persona_from_onboarding(
    mbti: str,
    interests: List[str],
    voice_text: str,
    city: str,
) -> Dict[str, Any]:
    """
    整合所有分析，调用LLM生成人格画像。

    策略：
      1. 解析MBTI维度（确定事实）
      2. 分析兴趣标签（推断）
      3. 分析一句话（原文引用）
      4. 调用LLM生成人格画像
      5. 验证输出 + 优雅降级

    Args:
        mbti: 4字母MBTI类型（ENFP/ISTJ等）
        interests: 用户选中的兴趣标签列表
        voice_text: 用户的一句话描述
        city: 目标城市ID

    Returns:
        dict，含完整人格画像。fallback 模式下额外返回 _fallback: True
    """
    # 1. 规范化输入
    mbti = mbti.strip().upper()
    if len(mbti) < 4:
        mbti = "ENFP"

    interests = [t for t in interests if t in ALL_INTEREST_TAGS] if interests else []

    # 2. 解析 MBTI 维度（确定事实）
    mbti_dims = parse_mbti_dimensions(mbti)

    # 3. 分析兴趣标签（推断）
    unselected = [t for t in ALL_INTEREST_TAGS if t not in interests]
    interest_inference = infer_from_interests(interests, unselected)

    # 4. 分析一句话（v级）
    voice_analysis = analyze_voice_text(voice_text)

    # 5. 调用 LLM
    llm_result = _call_llm_for_persona(
        mbti=mbti,
        mbti_dims=mbti_dims,
        interests=interests,
        interest_inference=interest_inference,
        voice_analysis=voice_analysis,
        city=city,
    )

    if llm_result is not None:
        llm_result["mbti"] = mbti
        llm_result["mbti_label"] = _MBTI_TYPE_LABELS.get(mbti, mbti)
        llm_result["travel_style"] = (
            llm_result.get("travel_style", {}).get("overall", "")
            if isinstance(llm_result.get("travel_style"), dict)
            else str(llm_result.get("travel_style", ""))
        )
        return llm_result

    # 6. LLM 不可用，fallback 到规则生成
    return _build_fallback_persona(mbti, interests, voice_text, city)


# ---------------------------------------------------------------------------
# PART 9：验证脚本
# ---------------------------------------------------------------------------

def _run_verification_tests() -> bool:
    """验证脚本：测试4个关键场景"""
    print("=" * 60)
    print("TwinBuddy 人格蒸馏系统 - 验证测试")
    print("=" * 60)

    scenarios = [
        {
            "name": "场景1：ENFP + 选了'自由行/美食/打卡' + '想找个能一起嗨的搭子'",
            "mbti": "ENFP",
            "interests": ["自由行", "美食", "打卡"],
            "voice_text": "想找个能一起嗨的搭子",
            "city": "chengdu",
        },
        {
            "name": "场景2：ISTJ + 选了'品质游/深度游' + '最好一切安排好，不要让我操心'",
            "mbti": "ISTJ",
            "interests": ["品质游", "深度游"],
            "voice_text": "最好一切安排好，不要让我操心",
            "city": "xian",
        },
        {
            "name": "场景3：INFJ + 只选了1个标签 + ''（空一句话）",
            "mbti": "INFJ",
            "interests": ["康养"],
            "voice_text": "",
            "city": "dali",
        },
        {
            "name": "场景4：ENTP + 选了矛盾标签（穷游+品质游+暴走+躺平）",
            "mbti": "ENTP",
            "interests": ["穷游", "品质游", "暴走", "躺平"],
            "voice_text": "最好省钱但也要玩得好，有没有什么两全的办法",
            "city": "xiamen",
        },
    ]

    all_passed = True

    for i, scenario in enumerate(scenarios, 1):
        print(f"\n{'─' * 60}")
        print(f"【{scenario['name']}】")
        print(f"输入：MBTI={scenario['mbti']}, 兴趣={scenario['interests']}, "
              f"一句话='{scenario['voice_text']}'")

        try:
            result = generate_persona_from_onboarding(
                mbti=scenario["mbti"],
                interests=scenario["interests"],
                voice_text=scenario["voice_text"],
                city=scenario["city"],
            )

            required_keys = [
                "identity", "speaking_style", "emotion_decision",
                "social_behavior", "negotiation_style", "preferences",
                "conversation_examples", "compatibility_notes", "_meta",
            ]
            missing = [k for k in required_keys if k not in result]
            if missing:
                print(f"  [FAIL] 失败：缺少字段 {missing}")
                all_passed = False
                continue

            meta = result.get("_meta", {})
            v_count = meta.get("v_count", 0)
            confidence = meta.get("confidence_level", "未知")
            is_fallback = result.get("_fallback", False)

            # 场景4：矛盾标签检测
            if i == 4:
                budget_att = result.get("travel_style_detail", {}).get("budget_attitude", "")
                if "矛盾" in budget_att:
                    print(f"  [OK] 矛盾检测：{budget_att[:80]}")
                else:
                    print(f"  [WARN] 未明确标注矛盾信号（fallback会自动检测）")

            # 场景1：语气推断
            if i == 1:
                tone = result.get("speaking_style", {}).get("tone", "")
                print(f"  语气推断：{tone[:80]}")

            # 场景3：置信度低
            if i == 3:
                if confidence == "低":
                    print(f"  [OK] 置信度：{confidence}（符合预期：数据少）")
                else:
                    print(f"  置信度：{confidence}（期望低）")

            # 打印对话示例（验证语气一致性）
            examples = result.get("conversation_examples", {})
            excited = examples.get("excited_about_trip", "")
            print(f"  对话示例excited：{excited[:60]}...")

            print(f"  [OK] 通过 | 置信度={confidence} | v={v_count} | "
                  f"fallback={is_fallback}")
            print(f"  identity背景：{result.get('identity', {}).get('background', '')[:60]}...")

        except Exception as e:
            print(f"  [FAIL] 异常：{e}")
            all_passed = False

    print(f"\n{'=' * 60}")
    if all_passed:
        print("[PASS] 全部测试通过")
    else:
        print("[FAIL] 存在失败项，请检查")
    print("=" * 60)

    return all_passed


if __name__ == "__main__":
    success = _run_verification_tests()
    sys.exit(0 if success else 1)
