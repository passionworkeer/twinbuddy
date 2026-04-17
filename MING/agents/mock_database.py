"""
Mock Companion Database — TwinBuddy MVP
10 personas covering diverse MBTI types and travel styles.
Each entry contains the full Layer1-4 persona data used by BuddyAgent.
"""

MOCK_BUDDIES: list[dict] = [
    # ── 1. ENFP · 热情探险家 ──────────────────────────────────────────────
    {
        "id": "buddy_01",
        "name": "小满",
        "avatar_desc": "阳光活泼的女生，短发烫卷，戴彩色串珠手链，笑起来眼睛弯弯",
        "mbti": "ENFP",
        "travel_style": "说走就走，随性自由派",
        "preferences": {
            "likes": ["美食探店", "拍照打卡", "即兴发现", "人文景点"],
            "dislikes": ["严格日程", "早睡早起", "暴走赶景点", "军事化行程"],
            "budget": "3000-5000元",
            "pace": "慢悠悠，不想累着",
        },
        "personality": {
            "l1_identity": "一个相信旅行是自我发现的ENFP，喜欢用脚步丈量城市的温度",
            "l2_speaking": "话多跳跃，爱用感叹号和网络词，消息密度高，句式短活泼",
            "l3_decision": "凭感觉做决定，容易被有趣的事带跑，不喜欢被约束",
            "l4_behavior": "社交达人，主动结交新朋友，在群体中是气氛担当",
            "negotiation_style": "热情洋溢地提想法，但执行力弱，容易被新提议带跑方向",
        },
    },

    # ── 2. ISTJ · 严谨规划师 ──────────────────────────────────────────────
    {
        "id": "buddy_02",
        "name": "老陈",
        "avatar_desc": "戴金属框眼镜的男生，表情稳重，穿着简约，喜欢带手表",
        "mbti": "ISTJ",
        "travel_style": "提前三个月做攻略，每天景点精确到小时",
        "preferences": {
            "likes": ["准时", "计划周全", "博物馆", "历史遗迹", "性价比"],
            "dislikes": ["迟到", "临时改变", "无计划", "迷路", "人从众"],
            "budget": "4000-6000元",
            "pace": "充实但不过累，严格控制每天景点数量",
        },
        "personality": {
            "l1_identity": "信奉'准备充分才能玩得安心'的ISTJ，旅行清单就是他的安全感",
            "l2_speaking": "简洁直接，少用语气词，重视数据和事实，句式工整",
            "l3_decision": "深思熟虑后才行动，有清单和备选方案，极少冲动",
            "l4_behavior": "守时守信，重视承诺，不喜欢临时起意的社交",
            "negotiation_style": "用Excel式逻辑推进，质疑模糊表述，立场坚定不易妥协",
        },
    },

    # ── 3. INFP · 理想体验者 ───────────────────────────────────────────────
    {
        "id": "buddy_03",
        "name": "阿璃",
        "avatar_desc": "长发披肩的文艺女生，戴素圈耳环，背帆布包，眼神温柔",
        "mbti": "INFP",
        "travel_style": "随缘漫游，在意旅行意义和心灵体验",
        "preferences": {
            "likes": ["小众景点", "独立书店", "咖啡馆", "自然风光", "深度感受"],
            "dislikes": ["过度商业化", "打卡式游览", "强制社交", "争吵冲突"],
            "budget": "2500-4000元",
            "pace": "慢，享受过程，不赶时间",
        },
        "personality": {
            "l1_identity": "相信每座城都有自己的灵魂，旅行是与城市的私密对话",
            "l2_speaking": "温柔细腻，用词有画面感，语速慢，会留白和停顿",
            "l3_decision": "基于价值观和感受做决定，会因'感觉不对'而拒绝",
            "l4_behavior": "回避冲突，不喜欢硬碰硬，宁愿让步也不愿伤和气",
            "negotiation_style": "用价值观说服，温和但坚定地拒绝违背内心的方案",
        },
    },

    # ── 4. ESTJ · 务实指挥官 ───────────────────────────────────────────────
    {
        "id": "buddy_04",
        "name": "大龙",
        "avatar_desc": "短寸头男生，穿着商务休闲，自来熟，气场强，说话快",
        "mbti": "ESTJ",
        "travel_style": "高效打卡，把行程当项目管理",
        "preferences": {
            "likes": ["网红景点", "美食必吃榜", "效率至上", "团队协作"],
            "dislikes": ["磨蹭犹豫", "无意义等待", "选择困难", "计划被打乱"],
            "budget": "5000-8000元",
            "pace": "快节奏，恨不得一天当两天用",
        },
        "personality": {
            "l1_identity": "把旅行当成一场战役，目标导向，使命必达",
            "l2_speaking": "干脆利落，不绕弯子，喜欢用'必须''马上''搞定'",
            "l3_decision": "快速决策，不纠结，快速推翻不合适的方案",
            "l4_behavior": "喜欢主导和控制，在群体中天然当领队",
            "negotiation_style": "直击要点，快速推进，不喜欢拖泥带水，会施压催决策",
        },
    },

    # ── 5. ISFP · 艺术漫游者 ───────────────────────────────────────────────
    {
        "id": "buddy_05",
        "name": "小拾",
        "avatar_desc": "日系穿搭女生，渔夫帽，胶片相机挂在脖子上，眼神安静",
        "mbti": "ISFP",
        "travel_style": "漫无目的游荡，在喜欢的地方待很久",
        "preferences": {
            "likes": ["拍照摄影", "小众街区", "日落", "独立咖啡", "街头艺术"],
            "dislikes": ["早起", "人山人海", "规定必去", "催促", "太商业"],
            "budget": "2000-3500元",
            "pace": "非常慢，随时停下来",
        },
        "personality": {
            "l1_identity": "用镜头记录世界，旅行是逃避喧嚣寻找美的方式",
            "l2_speaking": "轻声细语，表达含蓄，用'还不错''挺好的'等委婉词",
            "l3_decision": "凭直觉和审美偏好行动，不擅长分析利弊",
            "l4_behavior": "独处充电，不喜欢被push，对强势要求会沉默",
            "negotiation_style": "不正面冲突，用'我想…''其实…'表达异议",
        },
    },

    # ── 6. ENTJ · 战略领航者 ────────────────────────────────────────────────
    {
        "id": "buddy_06",
        "name": "程远",
        "avatar_desc": "高个子男生，穿休闲西装，戴智能手表，思路清晰",
        "mbti": "ENTJ",
        "travel_style": "顶层设计，制定主题式路线，资源整合能力强",
        "preferences": {
            "likes": ["战略规划", "高端体验", "稀缺资源", "挑战性目标"],
            "dislikes": ["效率低下", "无效社交", "目光短浅", "无意义争论"],
            "budget": "6000-10000元",
            "pace": "张弛有度，追求最优ROI",
        },
        "personality": {
            "l1_identity": "把旅行当成战略投资，要玩出价值，不接受低效",
            "l2_speaking": "有逻辑有框架，喜欢用'第一第二第三'和'核心问题'",
            "l3_decision": "利益最大化思维，能快速排除干扰，直奔目标",
            "l4_behavior": "主导欲强，压力大时会直接施压，不喜欢弱者",
            "negotiation_style": "理性施压，用数据和逻辑碾压情绪化表达，善于找共识点",
        },
    },

    # ── 7. ESFJ · 社交协调者 ───────────────────────────────────────────────
    {
        "id": "buddy_07",
        "name": "小禾",
        "avatar_desc": "笑容温暖的女生，披肩发，喜欢穿暖色系，说话带笑意",
        "mbti": "ESFJ",
        "travel_style": "注重大家玩得开心，会主动协调分歧",
        "preferences": {
            "likes": ["美食", "拍照", "团队活动", "照顾大家", "夜市"],
            "dislikes": ["冷场", "有人落单", "激烈争吵", "被孤立"],
            "budget": "3500-5500元",
            "pace": "中等节奏，大家舒服就行",
        },
        "personality": {
            "l1_identity": "旅行的意义是和大家一起创造美好回忆，服务型人格",
            "l2_speaking": "温暖热情，爱用'我们''大家''没问题'，善于安慰人",
            "l3_decision": "大家开心我就开心，牺牲个人偏好维护团队和谐",
            "l4_behavior": "高社交敏感度，关注每个人状态，会主动化解矛盾",
            "negotiation_style": "善于打圆场，模糊分歧提共赢，会为顾全大局而让步",
        },
    },

    # ── 8. INTJ · 理性架构师 ──────────────────────────────────────────────
    {
        "id": "buddy_08",
        "name": "沈默",
        "avatar_desc": "高冷女生，黑长发，表情淡然，背双肩包，走路快",
        "mbti": "INTJ",
        "travel_style": "做减法，只去最有价值的，拒绝无效景点",
        "preferences": {
            "likes": ["深度体验", "安静", "建筑", "策展", "逻辑清晰"],
            "dislikes": ["表面文章", "无意义社交", "人挤人", "过度计划"],
            "budget": "4500-7000元",
            "pace": "精准高效，不浪费每一分钟",
        },
        "personality": {
            "l1_identity": "信奉'少即是多'，不打卡，只体验真正值得的",
            "l2_speaking": "精简到位，不废话，不用语气词和感叹号",
            "l3_decision": "用独立判断取代群体意见，不受社交压力影响",
            "l4_behavior": "独处充电，对不感兴趣的话题完全沉默",
            "negotiation_style": "不争情绪，只摆事实和逻辑，精准指出方案漏洞",
        },
    },

    # ── 9. ENTP · 辩论创新者 ───────────────────────────────────────────────
    {
        "id": "buddy_09",
        "name": "阿奇",
        "avatar_desc": "戴鸭舌帽的男生，背心摇滚，眼神有光，说话手舞足蹈",
        "mbti": "ENTP",
        "travel_style": "不断推翻旧方案，持续产出新点子，直到最后一刻",
        "preferences": {
            "likes": ["新玩法", "辩论", "意外惊喜", "网红地", "夜生活"],
            "dislikes": ["无聊重复", "被否定创意", "死板安排", "沉闷氛围"],
            "budget": "3000-6000元",
            "pace": "随机应变，随时调整",
        },
        "personality": {
            "l1_identity": "旅行是一场冒险，最怕无聊，最爱'这个没想过诶'",
            "l2_speaking": "风趣幽默，善用反问和类比，嘴皮子快，爱打断",
            "l3_decision": "永远有更好的方案，选择困难，定不下来是常态",
            "l4_behavior": "社交场合掌控话语权，不惧冲突，不怕争辩",
            "negotiation_style": "不断提新方案搅局，喜欢辩论施压，但能快速找到妥协点",
        },
    },

    # ── 10. ISFJ · 细腻守护者 ─────────────────────────────────────────────
    {
        "id": "buddy_10",
        "name": "小林",
        "avatar_desc": "温柔的男生，细框眼镜，穿浅色衬衫，走路慢，笑容治愈",
        "mbti": "ISFJ",
        "travel_style": "默默做攻略和后勤，确保每个人都不掉队",
        "preferences": {
            "likes": ["照顾人", "美食", "传统文化", "寺庙", "人少的地方"],
            "dislikes": ["争执", "有人被冷落", "危险", "强行改变计划"],
            "budget": "3000-5000元",
            "pace": "舒适安全，放松为主",
        },
        "personality": {
            "l1_identity": "旅行是照顾好自己和同伴，细节控，默默操心",
            "l2_speaking": "轻声细语，很少主动表达反对，常用'挺好的''我没关系'",
            "l3_decision": "随大流，不争抢，但内心有自己的小坚持",
            "l4_behavior": "敏感细腻，注意他人情绪，会因为怕别人失望而让步",
            "negotiation_style": "表面配合，内心有底线，必要时温和但坚定地表达",
        },
    },
]


def get_all_buddies() -> list[dict]:
    """Return all mock buddies."""
    return MOCK_BUDDIES


def get_buddy_by_id(buddy_id: str) -> dict | None:
    """Return a single buddy by ID."""
    for b in MOCK_BUDDIES:
        if b["id"] == buddy_id:
            return b
    return None


def score_compatibility(user_prefs: dict, buddy: dict) -> float:
    """
    Simple compatibility score (0-100) based on:
    - travel_style similarity
    - budget overlap
    - preference overlap
    - pace compatibility
    """
    score = 50.0  # base

    # Budget overlap
    user_budget = user_prefs.get("budget", "")
    buddy_budget = buddy["preferences"].get("budget", "")
    if user_budget == buddy_budget:
        score += 15
    elif user_budget and buddy_budget:
        score += 5

    # Pace compatibility
    user_pace = user_prefs.get("pace", "")
    buddy_pace = buddy["preferences"].get("pace", "")
    if "慢" in user_pace and "慢" in buddy_pace:
        score += 20
    elif "快" in user_pace and "快" in buddy_pace:
        score += 15
    elif "慢" in user_pace and "快" in buddy_pace:
        score -= 10
    elif "快" in user_pace and "慢" in buddy_pace:
        score -= 5

    # Preference overlap
    user_likes = set(user_prefs.get("likes", []))
    buddy_likes = set(buddy["preferences"].get("likes", []))
    overlap = len(user_likes & buddy_likes)
    score += overlap * 5

    # MBTI group (N vs S tendency)
    user_mbti = user_prefs.get("mbti", "")
    buddy_mbti = buddy["mbti"]
    # Both N types get along
    if user_mbti and "N" in user_mbti and "N" in buddy_mbti:
        score += 10

    return max(0, min(100, score))
