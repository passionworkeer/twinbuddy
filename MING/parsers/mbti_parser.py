#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
MING MBTI Parser — MBTI 人格类型文本解析器
支持 16Personalities 网站结果 / 字母直接输入 / 其他 MBTI 测试导出
"""
from __future__ import annotations

import re
import sys
from typing import Optional

from .base import BaseParser

# ── Windows UTF-8 ──────────────────────────────────────────────────────────────
from MING.parsers._encoding import *  # noqa: F401,F403

# ─── 常量 ─────────────────────────────────────────────────────────────────────

# 16 种 MBTI 类型
VALID_TYPES = {
    "INTJ", "INTP", "ENTJ", "ENTP",
    "INFJ", "INFP", "ENFJ", "ENFP",
    "ISTJ", "ISFJ", "ESTJ", "ESFJ",
    "ISTP", "ISFP", "ESTP", "ESFP",
}

# MBTI 字母 → 维度名
DIMENSION_LABELS = {
    "I": "内倾 (Introversion)",
    "E": "外倾 (Extraversion)",
    "N": "直觉 (Intuition)",
    "S": "感觉 (Sensing)",
    "T": "思维 (Thinking)",
    "F": "情感 (Feeling)",
    "J": "判断 (Judging)",
    "P": "知觉 (Perceiving)",
}

# 各维度关键词（用于从描述文本中提取）
DIMENSION_KEYWORDS = {
    "I": ["内向", "内敛", "安静", "独处", "深思", "内省", "保守"],
    "E": ["外向", "开朗", "社交", "活跃", "爱交际", "热情", "健谈"],
    "N": ["直觉", "创意", "想象", "抽象", "宏观", "可能", "灵感"],
    "S": ["感觉", "实际", "具体", "细节", "传统", "经验", "踏实"],
    "T": ["理性", "逻辑", "客观", "公正", "原则", "批判"],
    "F": ["情感", "共情", "温柔", "体贴", "和谐", "价值", "感受"],
    "J": ["判断", "计划", "组织", "决断", "果断", "有序", "掌控"],
    "P": ["知觉", "灵活", "适应", "开放", "自发", "随性", "好奇"],
}

# 类型描述关键词
TYPE_TRAIT_KEYWORDS = {
    "INTJ": ["独立", "战略", "理性", "自主", "追求知识", "批判性思维"],
    "INTP": ["逻辑", "创新", "抽象", "分析", "内省", "理论"],
    "ENTJ": ["领导力", "决断", "战略", "高效", "自信", "指挥"],
    "ENTP": ["机智", "创意", "辩论", "好奇", "多才多艺", "挑战权威"],
    "INFJ": ["理想主义", "洞察", "共情", "忠诚", "安静", "使命"],
    "INFP": ["理想主义", "创意", "真诚", "价值观", "同理心", "内在"],
    "ENFJ": ["魅力", "领导", "激励", "热情", "使命感", "善于交际"],
    "ENFP": ["热情", "创意", "自由", "灵感", "乐观", "探索"],
    "ISTJ": ["责任", "可靠", "实际", "传统", "有序", "忠诚"],
    "ISFJ": ["温暖", "关怀", "忠诚", "可靠", "实际", "勤奋"],
    "ESTJ": ["务实", "组织", "领导", "传统", "可靠", "果断"],
    "ESFJ": ["热情", "合作", "关怀", "社交", "传统", "责任感"],
    "ISTP": ["分析", "实际", "灵活", "动手", "独立", "冒险"],
    "ISFP": ["敏感", "艺术", "灵活", "善良", "现在", "审美"],
    "ESTP": ["活力", "现实", "适应", "社交", "自发", "大胆"],
    "ESFP": ["热情", "自发", "社交", "享乐", "艺术", "当下"],
}

# ─── 辅助函数 ────────────────────────────────────────────────────────────────

def _extract_mbti_letters(text: str) -> Optional[str]:
    """
    从文本中提取 MBTI 类型字母组合。
    匹配格式: ENFP / I N F P / I-N-F-P / ENFP-A (带警觉后缀)
    """
    text_upper = text.upper()
    # 精确匹配: 4 个连续字母
    m = re.search(r"\b([IE][NS][FT][JP])(?:-[A-Z]+)?\b", text_upper)
    if m:
        return m.group(1)
    # 分散字母: I N F P / I-N-F-P
    m = re.search(
        r"\b([IE])\s*[-]?\s*([NS])\s*[-]?\s*([FT])\s*[-]?\s*([JP])\b",
        text_upper
    )
    if m:
        return m.group(1) + m.group(2) + m.group(3) + m.group(4)
    return None


def _extract_dimension_scores(text: str) -> dict[str, float]:
    """
    从文本中提取维度得分。
    尝试匹配: "I: 30%" / "内倾 60%" / "Introversion: 60%"
    返回 dict: {"IE": 0.3, "NS": 0.8, "FT": -0.2, "JP": -0.5}
    值范围 [-1.0, 1.0]
    """
    scores: dict[str, float] = {}

    # I/E vs E/I → IE 维度
    m_ie = re.search(
        r"(?:内倾|Introversion|I)\s*[:：]?\s*(\d{1,3})\s*%?|"
        r"内倾.*?(\d{1,3})\s*%",
        text, re.IGNORECASE
    )
    if m_ie:
        val = int(m_ie.group(1) or m_ie.group(2))
        scores["IE"] = (val - 50) / 50.0  # 0–100 → -1.0–1.0

    # E 分值
    m_ee = re.search(
        r"(?:外倾|Extraversion|E)\s*[:：]?\s*(\d{1,3})\s*%?|"
        r"外倾.*?(\d{1,3})\s*%",
        text, re.IGNORECASE
    )
    if m_ee:
        val = int(m_ee.group(1) or m_ee.group(2))
        if "IE" not in scores:
            scores["IE"] = (val - 50) / 50.0

    # N/S
    m_ns = re.search(
        r"(?:直觉|Intuition|N)\s*[:：]?\s*(\d{1,3})\s*%?|"
        r"(?:感觉|Sensing|S)\s*[:：]?\s*(\d{1,3})\s*%?",
        text, re.IGNORECASE
    )
    if m_ns:
        val = int(m_ns.group(1) or m_ns.group(2) or "50")
        scores["NS"] = (val - 50) / 50.0

    # F/T
    m_ft = re.search(
        r"(?:情感|Feeling|F)\s*[:：]?\s*(\d{1,3})\s*%?|"
        r"(?:思维|Thinking|T)\s*[:：]?\s*(\d{1,3})\s*%?",
        text, re.IGNORECASE
    )
    if m_ft:
        val = int(m_ft.group(1) or m_ft.group(2) or "50")
        scores["FT"] = (val - 50) / 50.0

    # J/P
    m_jp = re.search(
        r"(?:判断|Judging|J)\s*[:：]?\s*(\d{1,3})\s*%?|"
        r"(?:知觉|Perceiving|P)\s*[:：]?\s*(\d{1,3})\s*%?",
        text, re.IGNORECASE
    )
    if m_jp:
        val = int(m_jp.group(1) or m_jp.group(2) or "50")
        scores["JP"] = (val - 50) / 50.0

    return scores


def _extract_type_traits(mbti_type: str, text: str) -> list[str]:
    """从文本和已知关键词中提取类型特质描述。"""
    traits: list[str] = []
    if mbti_type in TYPE_TRAIT_KEYWORDS:
        traits.extend(TYPE_TRAIT_KEYWORDS[mbti_type])

    # 从文本中匹配维度关键词
    for letter in mbti_type:
        for kw in DIMENSION_KEYWORDS.get(letter, []):
            if kw in text:
                if kw not in traits:
                    traits.append(kw)

    # 通用描述词提取（情感类 / 思维类等）
    general_patterns = [
        (r"情感型|情感.*?主导", "情感驱动"),
        (r"思维型|理性.*?主导", "理性思维"),
        (r"直觉型|创意", "善于创意"),
        (r"感觉型|实际", "脚踏实地"),
        (r"内倾型|内向", "内向内敛"),
        (r"外倾型|外向", "外向开朗"),
        (r"判断型|有计划", "有计划性"),
        (r"知觉型|灵活", "灵活适应"),
    ]
    for pat, label in general_patterns:
        if re.search(pat, text):
            if label not in traits:
                traits.append(label)

    return traits


def _infer_communication_style(mbti_type: str) -> str:
    """根据 MBTI 类型推断沟通风格。"""
    styles = {
        "INTJ": "简洁直接，偏好书面表达，不喜欢闲聊",
        "INTP": "逻辑严谨，喜欢解释背景，但可能忽略情感",
        "ENTJ": "果断直接，目标导向，喜欢掌控谈话",
        "ENTP": "善于辩论，机智幽默，喜欢挑战",
        "INFJ": "温和细腻，倾听为主，表达有深度",
        "INFP": "真诚有温度，重视价值观表达",
        "ENFJ": "热情洋溢，善于讲故事，有感染力",
        "ENFP": "表达型，爱讲故事和分享感受，富有热情",
        "ISTJ": "稳重简洁，有条理，注重事实",
        "ISFJ": "温柔体贴，关注他人感受，保守内敛",
        "ESTJ": "务实直接，注重效率和时间",
        "ESFJ": "亲切热情，喜欢社交和分享日常",
        "ISTP": "简洁务实，喜欢动手解决问题",
        "ISFP": "柔和敏感，审美品位高，话语轻盈",
        "ESTP": "活泼开朗，善于即兴，喜欢现场感",
        "ESFP": "热情活泼，爱分享生活细节，表达力强",
    }
    return styles.get(mbti_type, "沟通风格需进一步分析")


def _infer_decision_making(mbti_type: str) -> str:
    """根据 MBTI 类型推断决策模式。"""
    if mbti_type[2] == "T":
        return "理性驱动，基于逻辑和原则做决定"
    return "情感驱动，重视个人价值和他人感受"


def _infer_stress_response(mbti_type: str) -> str:
    """根据 MBTI 类型推断压力反应。"""
    if mbti_type[1] == "N":
        return "在压力下可能变得过度分析或拖延决断"
    if mbti_type[2] == "F":
        return "在压力下可能变得情绪化或过度自我反省"
    return "在压力下可能变得批判性或回避社交"


def _infer_growth_areas(mbti_type: str) -> list[str]:
    """根据 MBTI 类型推断成长领域。"""
    areas = {
        "INTJ": ["时间管理", "跟进细节", "表达情感"],
        "INTP": ["时间管理", "实践落地", "社交技能"],
        "ENTJ": ["倾听他人意见", "接受不完美", "情绪管理"],
        "ENTP": ["跟进项目", "专注深度", "接受批评"],
        "INFJ": ["设定边界", "自我关怀", "接受现实"],
        "INFP": ["行动力", "接受不完美", "时间管理"],
        "ENFJ": ["设定边界", "接受批评", "独处时间"],
        "ENFP": ["跟进细节", "时间管理", "专注执行"],
        "ISTJ": ["接受变化", "灵活思维", "表达感受"],
        "ISFJ": ["设定边界", "接受变化", "自我主张"],
        "ESTJ": ["倾听不同意见", "接受批评", "情绪表达"],
        "ESFJ": ["接受批评", "独处时间", "设定边界"],
        "ISTP": ["长期规划", "表达感受", "社交主动"],
        "ISFP": ["长期规划", "自我主张", "接受变化"],
        "ESTP": ["长期规划", "专注深度", "自我反省"],
        "ESFP": ["跟进细节", "长期规划", "自我反省"],
    }
    return areas.get(mbti_type, ["自我认识", "情绪管理"])


# ─── MBTI Parser ─────────────────────────────────────────────────────────────

class MBTIParser(BaseParser):
    name = "MBTIParser"
    confidence = 0.9  # MBTI 结果通常来自测试，置信度较高

    def _detect(self, text: str) -> bool:
        """检测是否为 MBTI 相关文本。"""
        mbti = _extract_mbti_letters(text)
        if mbti and mbti in VALID_TYPES:
            return True
        # 16Personalities 网站特征
        if re.search(r"16personalities|16种人格|MBTI", text, re.IGNORECASE):
            return True
        return False

    def _parse(self, text: str) -> dict:
        """
        解析 MBTI 文本，提取类型和维度信息。
        """
        mbti_type = _extract_mbti_letters(text)

        if not mbti_type:
            return {"error": "未找到有效的 MBTI 类型", "partial": False}

        if mbti_type not in VALID_TYPES:
            return {"error": f"无效的 MBTI 类型: {mbti_type}", "partial": False}

        # 提取维度得分
        dim_scores = _extract_dimension_scores(text)

        # 若无明确得分，根据字母推算
        if not dim_scores:
            dim_scores = {
                "IE": 0.5 if mbti_type[0] == "E" else -0.5,
                "NS": 0.5 if mbti_type[1] == "N" else -0.5,
                "FT": 0.5 if mbti_type[2] == "F" else -0.5,
                "JP": 0.5 if mbti_type[3] == "P" else -0.5,
            }

        # 提取特质关键词
        traits = _extract_type_traits(mbti_type, text)

        # 推断维度标签
        ie_label = "外倾 (E)" if mbti_type[0] == "E" else "内倾 (I)"
        ns_label = "直觉 (N)" if mbti_type[1] == "N" else "感觉 (S)"
        ft_label = "情感 (F)" if mbti_type[2] == "F" else "思维 (T)"
        jp_label = "知觉 (P)" if mbti_type[3] == "P" else "判断 (J)"

        # 来源判断
        source = "unknown"
        if re.search(r"16personalities", text, re.IGNORECASE):
            source = "16Personalities"
        elif len(text) < 10:
            source = "direct_input"

        return {
            "mbti_type": mbti_type,
            "dimensions": dim_scores,
            "dimension_labels": {
                "IE": ie_label,
                "NS": ns_label,
                "FT": ft_label,
                "JP": jp_label,
            },
            "key_traits": traits,
            "source": source,
        }

    def _extract_fields(self, parsed: dict) -> dict:
        """从解析结果中提取 Persona 字段。"""
        mbti_type = parsed.get("mbti_type", "UNKNOWN")
        return {
            "mbti_type": mbti_type,
            "dimensions": parsed.get("dimensions", {}),
            "key_traits": parsed.get("key_traits", []),
            "communication_style": _infer_communication_style(mbti_type),
            "decision_making": _infer_decision_making(mbti_type),
            "stress_response": _infer_stress_response(mbti_type),
            "growth_areas": _infer_growth_areas(mbti_type),
        }


# ─── 便捷函数 ───────────────────────────────────────────────────────────────

def quick_parse(text: str) -> dict:
    """快速 MBTI 解析（检测+解析+提取一步到位）。"""
    parser = MBTIParser()
    return parser.process(text)


if __name__ == "__main__":
    import json

    test_cases = [
        "ENFP",
        "INTJ - 建筑师",
        "我是 ENFP，热情洋溢，喜欢创意工作，直觉型",
        "MBTI 结果: I N F J，内倾直觉情感判断型",
        "您的 MBTI 人格类型是 ENTP (辩论家)",
        "16Personalities 测试结果：ISFJ - 守护者",
    ]

    parser = MBTIParser()
    for tc in test_cases:
        result = parser.process(tc)
        print(f"输入: {tc!r}")
        print(f"  检测: {parser.detect(tc)}")
        print(f"  结果: {json.dumps(result, ensure_ascii=False, indent=2)}")
        print()
