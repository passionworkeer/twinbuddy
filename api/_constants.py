# api/_constants.py
"""全 API 共享常量（城市 emoji / 名称、MBTI 标签 / emoji、默认视频、搭子配置）"""

from __future__ import annotations

from typing import Dict, List

# ---------------------------------------------------------------------------
# 城市
# ---------------------------------------------------------------------------

CITY_EMOJI: Dict[str, str] = {
    "chengdu": "🐼", "chongqing": "🌶️", "dali": "🌊",
    "lijiang": "🏔️", "huangguoshu": "💧", "xian": "🏯",
    "qingdao": "🍺", "guilin": "🎋", "harbin": "❄️", "xiamen": "🌴",
}

CITY_NAMES: Dict[str, str] = {
    "chengdu": "成都", "chongqing": "重庆", "dali": "大理",
    "lijiang": "丽江", "huangguoshu": "黄果树", "xian": "西安",
    "qingdao": "青岛", "guilin": "桂林", "harbin": "哈尔滨", "xiamen": "厦门",
}

# ---------------------------------------------------------------------------
# MBTI
# ---------------------------------------------------------------------------

MBTI_LABELS: Dict[str, str] = {
    "ENFP": "热情开拓者", "ENFJ": "理想领袖", "ENTP": "智多星", "ENTJ": "指挥官",
    "ESFP": "舞台明星", "ESFJ": "主人", "ESTP": "创业者", "ESTJ": "总经理",
    "INFP": "诗意漫游者", "INFJ": "引路人", "INTP": "学者", "INTJ": "战略家",
    "ISFP": "艺术家", "ISFJ": "守护者", "ISTP": "工匠", "ISTJ": "审计师",
}

MBTI_EMOJI: Dict[str, str] = {
    "ENFP": "🌈", "ENFJ": "🌟", "ENTP": "⚡", "ENTJ": "🎯",
    "ESFP": "🎪", "ESFJ": "🤗", "ESTP": "🚀", "ESTJ": "📋",
    "INFP": "🌙", "INFJ": "🔮", "INTP": "📚", "INTJ": "🧠",
    "ISFP": "🎨", "ISFJ": "🛡️", "ISTP": "🔧", "ISTJ": "📐",
}

# ---------------------------------------------------------------------------
# 视频 Mock 数据
# ---------------------------------------------------------------------------

VIDEO_COVERS = [
    "https://images.unsplash.com/photo-1537531383496-f4749c6c3aa2?w=800&q=80",
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
    "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&q=80",
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
    "https://images.unsplash.com/photo-1514924013411-cbf25faa35bb?w=800&q=80",
]

VIDEO_TITLES = [
    "成都火锅的正确打开方式",
    "川西小环线自驾日记",
    "洱海边的日落有多绝",
    "一个人的丽江古城漫游",
    "厦门鼓浪屿的慢生活",
]

DEFAULT_VIDEOS = [
    {"id": "v1", "type": "video",  "cover_url": VIDEO_COVERS[0], "location": "成都", "title": VIDEO_TITLES[0],  "video_url": None, "buddy": None},
    {"id": "v2", "type": "video",  "cover_url": VIDEO_COVERS[1], "location": "川西", "title": VIDEO_TITLES[1],  "video_url": None, "buddy": None},
    {"id": "v3", "type": "twin_card", "cover_url": VIDEO_COVERS[2], "location": "大理", "title": VIDEO_TITLES[2],  "video_url": None, "buddy": None},
    {"id": "v4", "type": "twin_card", "cover_url": VIDEO_COVERS[3], "location": "丽江", "title": VIDEO_TITLES[3],  "video_url": None, "buddy": None},
    {"id": "v5", "type": "twin_card", "cover_url": VIDEO_COVERS[4], "location": "厦门", "title": VIDEO_TITLES[4],  "video_url": None, "buddy": None},
]

# ---------------------------------------------------------------------------
# 搭子 Mock 配置
# ---------------------------------------------------------------------------

BUDDY_CONFIGS: Dict[str, Dict] = {
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
