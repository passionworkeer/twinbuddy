#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
MING Douyin Parser — 抖音数据解析器
支持：点赞 JSON / 评论 JSON / 个人简介
基于 MING/tools/data_parsers/social.py 扩展
"""
from __future__ import annotations

import json
import re
import sys
from typing import Any, Optional

from .base import BaseParser

# ── Windows UTF-8 ──────────────────────────────────────────────────────────────
from MING.parsers._encoding import *  # noqa: F401,F403

# ─── 常量 ─────────────────────────────────────────────────────────────────────

# 抖音内容分类关键词
CATEGORY_KEYWORDS = {
    "旅行": ["旅行", "旅游", "出行", "机票", "酒店", "景点", "打卡", "攻略"],
    "美食": ["美食", "吃播", "餐厅", "探店", "食谱", "做饭", "好吃", "烹饪"],
    "科技": ["科技", "数码", "手机", "电脑", "AI", "数码", "测评", "开箱"],
    "音乐": ["音乐", "歌曲", "翻唱", "演奏", "乐器", "歌手", "演唱会"],
    "时尚": ["穿搭", "时尚", "美妆", "化妆", "衣服", "品牌", "护肤"],
    "健身": ["健身", "运动", "跑步", "瑜伽", "减肥", "增肌", "体能"],
    "知识": ["知识", "学习", "读书", "干货", "科普", "历史", "财经"],
    "生活": ["日常", "生活", "家居", "vlog", "记录", "随手拍"],
    "萌宠": ["宠物", "猫", "狗", "萌宠", "动物", "可爱"],
    "影视": ["电影", "剧", "综艺", "追剧", "影视", "解说"],
}

# 内容调性关键词
AESTHETIC_PATTERNS = [
    (r"(质感|高级感|小众|简约|INS风|北欧)", "喜欢有质感的内容"),
    (r"(治愈|温暖|温柔|舒服|放松)", "喜欢温暖治愈的内容"),
    (r"(搞笑|段子|沙雕|欢乐|逗比)", "喜欢搞笑娱乐内容"),
    (r"(真实|记录|日常|生活)", "记录生活，分享真实体验"),
    (r"(炫酷|科技感|赛博朋克|未来)", "喜欢科技感和炫酷风格"),
    (r"(唯美|文艺|小清新|清新)", "喜欢唯美文艺的内容"),
]

# 旅行偏好
TRAVEL_PATTERNS = [
    (r"(小众|冷门|秘境)", "小众目的地"),
    (r"(深度|攻略|分享)", "深度游"),
    (r"(美食|吃货|探店)", "美食之旅"),
    (r"(穷游|省钱|背包)", "穷游"),
    (r"(打卡|网红|热门)", "网红打卡地"),
]

# 互动风格推断
ENGAGEMENT_PATTERNS = {
    "like_heavy": "点赞为主，很少评论",
    "comment_heavy": "积极评论互动，分享观点",
    "share_heavy": "经常转发分享给别人",
    "passive": "主要浏览，很少主动互动",
}


# ─── 辅助函数 ────────────────────────────────────────────────────────────────

def _read_content(path_or_text: str | bytes) -> str | dict:
    """读取文件或直接返回字符串/字典。"""
    if isinstance(path_or_text, bytes):
        path_or_text = path_or_text.decode("utf-8", errors="ignore")

    # 尝试作为文件路径读取
    try:
        with open(path_or_text, "r", encoding="utf-8", errors="ignore") as f:
            raw = f.read()
        # 判断是 JSON 还是纯文本
        try:
            return json.loads(raw)
        except Exception:
            return raw
    except Exception:
        # 尝试 JSON 解析
        try:
            return json.loads(path_or_text)
        except Exception:
            return path_or_text


def _extract_categories_from_text(text: str) -> list[str]:
    """从文本中提取内容分类。"""
    categories: list[str] = []
    text_lower = text.lower()
    for cat, kws in CATEGORY_KEYWORDS.items():
        for kw in kws:
            if kw in text:
                if cat not in categories:
                    categories.append(cat)
                break
    return categories


def _extract_aesthetic_preference(text: str) -> str:
    """从文本中推断审美偏好。"""
    matched: list[str] = []
    for pat, label in AESTHETIC_PATTERNS:
        if re.search(pat, text, re.I):
            matched.append(label)
    if matched:
        return matched[0]
    # 默认
    return "内容审美倾向需进一步分析"


def _extract_travel_interests(text: str) -> list[str]:
    """从文本中提取旅行兴趣。"""
    interests: list[str] = []
    for pat, label in TRAVEL_PATTERNS:
        if re.search(pat, text, re.I):
            if label not in interests:
                interests.append(label)
    return interests


def _extract_influencers(text: str) -> list[str]:
    """从文本中提取关注的博主名称。"""
    # 格式: @博主名 / 提到「博主名」
    at_matches = re.findall(r"@([^\s@]{2,20})", text)
    quote_matches = re.findall(r"「([^」]{2,20})」", text)
    return list(dict.fromkeys(at_matches + quote_matches))[:10]


def _infer_engagement_style(likes: int, comments: int, shares: int, videos: int) -> str:
    """根据互动数据推断互动风格。"""
    if videos == 0:
        return ENGAGEMENT_PATTERNS["passive"]
    avg_comments = comments / videos if videos else 0
    avg_shares = shares / videos if videos else 0

    if avg_comments > 5:
        return ENGAGEMENT_PATTERNS["comment_heavy"]
    if avg_shares > 2:
        return ENGAGEMENT_PATTERNS["share_heavy"]
    if likes > 0 and comments < 2:
        return ENGAGEMENT_PATTERNS["like_heavy"]
    return ENGAGEMENT_PATTERNS["passive"]


def _parse_like_list(data: Any) -> tuple[list[dict], list[str]]:
    """解析点赞列表 JSON，返回(条目列表, 文本描述列表)。"""
    items: list[dict] = []
    descriptions: list[str] = []

    if isinstance(data, dict):
        if "like_list" in data:
            data = data["like_list"]
        items = data if isinstance(data, list) else []
    elif isinstance(data, list):
        items = data

    for item in items:
        if isinstance(item, dict):
            desc = str(item.get("desc", item.get("title", item.get("description", ""))))
            if desc:
                descriptions.append(desc)
        elif isinstance(item, str):
            descriptions.append(item)

    return items, descriptions


def _parse_comment_list(data: Any) -> tuple[list[dict], list[str]]:
    """解析评论列表 JSON。"""
    items: list[dict] = []
    comments_text: list[str] = []

    if isinstance(data, dict):
        if "comment_list" in data:
            data = data["comment_list"]
        items = data if isinstance(data, list) else []
    elif isinstance(data, list):
        items = data

    for item in items:
        if isinstance(item, dict):
            text = str(item.get("content", item.get("text", item.get("comment", ""))))
            if text:
                comments_text.append(text)
        elif isinstance(item, str):
            comments_text.append(item)

    return items, comments_text


def _parse_douyin_json(data: dict) -> dict:
    """解析抖音 JSON 导出文件。"""
    all_descriptions: list[str] = []
    all_comments: list[str] = []
    like_count = 0
    comment_count = 0
    share_count = 0
    videos_count = 0

    # 点赞列表
    like_items, like_descs = _parse_like_list(data)
    all_descriptions.extend(like_descs)
    like_count = len(like_items)
    videos_count = like_count  # 点赞列表中的视频数

    # 评论列表
    comment_items, comment_texts = _parse_comment_list(data)
    all_comments.extend(comment_texts)
    comment_count = len(comment_items)

    # 分享数（可能存在）
    share_count = data.get("share_count", data.get("share", 0))
    if isinstance(share_count, dict):
        share_count = 0

    # 个人简介（如果有）
    bio = str(data.get("nickname", data.get("bio", data.get("signature", ""))))

    full_text = " ".join(all_descriptions + all_comments + [bio])

    # 提取分类
    categories = _extract_categories_from_text(full_text)
    if not categories:
        categories = ["生活"]  # 默认

    # 审美偏好
    aesthetic = _extract_aesthetic_preference(full_text)

    # 旅行兴趣
    travel_interests = _extract_travel_interests(full_text)

    # 关注的博主
    influencers = _extract_influencers(full_text)

    # 互动风格
    engagement_style = _infer_engagement_style(like_count, comment_count, share_count, videos_count)

    # 内容调性
    tone = _extract_aesthetic_preference(full_text)

    return {
        "like_count": like_count,
        "comment_count": comment_count,
        "share_count": share_count,
        "videos_engaged": videos_count,
        "categories": categories,
        "descriptions": all_descriptions[:50],  # 保留前 50 条
        "comments": all_comments[:30],
        "bio": bio,
        "engagement_style": engagement_style,
        "aesthetic_preference": aesthetic,
        "travel_interests": travel_interests,
        "influencers": influencers,
        "content_tone": tone,
    }


def _parse_douyin_bio(text: str) -> dict:
    """解析抖音个人简介文本。"""
    categories = _extract_categories_from_text(text)
    aesthetic = _extract_aesthetic_preference(text)
    travel = _extract_travel_interests(text)
    influencers = _extract_influencers(text)

    return {
        "like_count": 0,
        "comment_count": 0,
        "share_count": 0,
        "videos_engaged": 0,
        "categories": categories if categories else ["生活"],
        "descriptions": [],
        "comments": [],
        "bio": text,
        "engagement_style": "passive",
        "aesthetic_preference": aesthetic,
        "travel_interests": travel,
        "influencers": influencers,
        "content_tone": aesthetic,
    }


# ─── Douyin Parser ─────────────────────────────────────────────────────────────

class DouyinParser(BaseParser):
    name = "DouyinParser"
    confidence = 0.65  # 抖音数据完整度不同，置信度中等

    def _detect(self, text_or_data: str | dict) -> bool:
        """检测是否为抖音相关数据。"""
        # dict 输入（来自 process 的 _parse_dict）
        if isinstance(text_or_data, dict):
            data = text_or_data
            return any(k in data for k in ("like_list", "comment_list", "douyin", "aweme"))

        text = text_or_data

        # JSON 格式：包含抖音特征字段
        try:
            data = json.loads(text)
            if isinstance(data, dict):
                if any(k in data for k in ("like_list", "comment_list", "douyin", "aweme")):
                    return True
        except Exception:
            pass

        # 文本格式：包含抖音特征关键词
        douyin_kws = ["抖音", "douyin", "点赞", "评论", "分享", "@", "作品"]
        matches = sum(1 for kw in douyin_kws if kw in text)
        if matches >= 2:
            return True

        # 抖音简介格式：明确提到"简介/签名/个性签名"，或包含"抖音号"且较短
        if re.search(r"简介|签名|个性签名", text) and len(text) < 500:
            return True
        if re.search(r"抖音号", text) and len(text) < 300:
            return True

        return False

    def _parse(self, text: str) -> dict:
        """解析抖音数据。"""
        # 尝试 JSON
        try:
            data = json.loads(text)
            return _parse_douyin_json(data)
        except Exception:
            pass

        # 纯文本简介
        return _parse_douyin_bio(text)

    def _extract_fields(self, parsed: dict) -> dict:
        """从解析结果中提取 Persona 字段。"""
        return {
            "content_categories": parsed.get("categories", []),
            "engagement_style": parsed.get("engagement_style", ""),
            "aesthetic_preference": parsed.get("aesthetic_preference", ""),
            "travel_interests": parsed.get("travel_interests", []),
            "influencer_affinity": parsed.get("influencers", []),
            "content_tone": parsed.get("content_tone", ""),
        }


# ─── 便捷函数 ───────────────────────────────────────────────────────────────

def quick_parse(content: str | bytes | dict) -> dict:
    """快速抖音数据解析。"""
    parser = DouyinParser()
    if isinstance(content, dict):
        return parser.process(json.dumps(content, ensure_ascii=False))
    return parser.process(content)


if __name__ == "__main__":
    import json

    test_cases = [
        # JSON 格式
        json.dumps({
            "like_list": [
                {"desc": "成都旅行攻略分享", "title": "成都旅行"},
                {"desc": "美味探店日记", "title": "探店"},
            ],
            "comment_list": [
                {"content": "好美啊！求攻略"},
                {"content": "这家店我也去过！"},
            ],
            "share_count": 12,
        }),
        # 纯文本简介
        "抖音号：旅行达人 | 喜欢旅行和美食 | 记录生活点滴",
        # 非抖音内容
        "今天天气不错，心情很好",
    ]

    parser = DouyinParser()
    for tc in test_cases:
        print(f"输入: {str(tc)[:60]!r}")
        print(f"  检测: {parser.detect(tc)}")
        persona = parser.process(tc).get("persona")
        if persona:
            print(f"  分类: {persona.get('content_categories', [])}")
            print(f"  审美: {persona.get('aesthetic_preference', '')}")
            print(f"  互动: {persona.get('engagement_style', '')}")
        print()
