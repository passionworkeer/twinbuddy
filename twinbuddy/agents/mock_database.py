# -*- coding: utf-8 -*-
"""
Mock Companion Database — TwinBuddy MVP
30 personas covering all 16 MBTI types and diverse travel styles.
Each entry contains the full Layer1-4 persona data used by BuddyAgent.
"""

MOCK_BUDDIES: list[dict] = [
    # ── 1. ENFP · 热情探险家 ──────────────────────────────────────────────
    {
        "id": "buddy_01",
        "name": "小满",
        "avatar_prompt": "阳光活泼的女生，短发烫卷，戴彩色串珠手链，笑起来眼睛弯弯",
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
        "typical_phrases": ["走呀！别想了！", "这个超棒的！", "我们有缘分！"],
        "avatar_emoji": "✨",
    },

    # ── 2. ISTJ · 严谨规划师 ──────────────────────────────────────────────
    {
        "id": "buddy_02",
        "name": "老陈",
        "avatar_prompt": "戴金属框眼镜的男生，表情稳重，穿着简约，喜欢带手表",
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
        "typical_phrases": ["我查过了，这样最合理", "我有Plan B", "别急，我来安排"],
        "avatar_emoji": "📋",
    },

    # ── 3. INFP · 理想体验者 ───────────────────────────────────────────────
    {
        "id": "buddy_03",
        "name": "阿璃",
        "avatar_prompt": "长发披肩的文艺女生，戴素圈耳环，背帆布包，眼神温柔",
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
        "typical_phrases": ["我能感受到这里的气质", "这个安排有点不对", "慢慢来吧"],
        "avatar_emoji": "🦢",
    },

    # ── 4. ESTJ · 务实指挥官 ───────────────────────────────────────────────
    {
        "id": "buddy_04",
        "name": "大龙",
        "avatar_prompt": "短寸头男生，穿着商务休闲，自来熟，气场强，说话快",
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
        "typical_phrases": ["这个必须拿下！", "还等什么？", "马上出发！"],
        "avatar_emoji": "💪",
    },

    # ── 5. ISFP · 艺术漫游者 ───────────────────────────────────────────────
    {
        "id": "buddy_05",
        "name": "小拾",
        "avatar_prompt": "日系穿搭女生，渔夫帽，胶片相机挂在脖子上，眼神安静",
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
        "typical_phrases": ["这个光好美", "我觉得…其实也可以", "不着急"],
        "avatar_emoji": "📸",
    },

    # ── 6. ENTJ · 战略领航者 ────────────────────────────────────────────────
    {
        "id": "buddy_06",
        "name": "程远",
        "avatar_prompt": "高个子男生，穿休闲西装，戴智能手表，思路清晰",
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
        "typical_phrases": ["核心问题就一个", "我们需要一个方案", "ROI太低，不划算"],
        "avatar_emoji": "🎯",
    },

    # ── 7. ESFJ · 社交协调者 ───────────────────────────────────────────────
    {
        "id": "buddy_07",
        "name": "小禾",
        "avatar_prompt": "笑容温暖的女生，披肩发，喜欢穿暖色系，说话带笑意",
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
        "typical_phrases": ["大家开心最重要！", "我来协调一下", "没问题，包在我身上"],
        "avatar_emoji": "🤗",
    },

    # ── 8. INTJ · 理性架构师 ──────────────────────────────────────────────
    {
        "id": "buddy_08",
        "name": "沈默",
        "avatar_prompt": "高冷女生，黑长发，表情淡然，背双肩包，走路快",
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
        "typical_phrases": ["不", "这个逻辑有问题", "我不同意"],
        "avatar_emoji": "🧊",
    },

    # ── 9. ENTP · 辩论创新者 ───────────────────────────────────────────────
    {
        "id": "buddy_09",
        "name": "阿奇",
        "avatar_prompt": "戴鸭舌帽的男生，背心摇滚，眼神有光，说话手舞足蹈",
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
        "typical_phrases": ["等等，还有更好的方案！", "这个没想过诶", "来，我们讨论一下"],
        "avatar_emoji": "🧠",
    },

    # ── 10. ISFJ · 细腻守护者 ─────────────────────────────────────────────
    {
        "id": "buddy_10",
        "name": "小林",
        "avatar_prompt": "温柔的男生，细框眼镜，穿浅色衬衫，走路慢，笑容治愈",
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
        "typical_phrases": ["挺好的", "我没关系", "你们决定就好"],
        "avatar_emoji": "🧸",
    },

    # ── 11. ESTP · 活力冒险王 ─────────────────────────────────────────────
    {
        "id": "buddy_11",
        "name": "阿野",
        "avatar_prompt": "小麦肤色的男生，运动背心，冲锋衣敞穿，眼神锐利，笑容张扬",
        "mbti": "ESTP",
        "travel_style": "说走就走，现场决策，目的地只是起点",
        "preferences": {
            "likes": ["户外运动", "极限挑战", "街头美食", "即时行动", "新城市"],
            "dislikes": ["空谈计划", "过度准备", "无聊等待", "宅酒店", "做攻略"],
            "budget": "4000-7000元",
            "pace": "高强度，随时切换，随时出发",
        },
        "personality": {
            "l1_identity": "在高速中发现世界，旅行是肾上腺素的释放，是Live的机会",
            "l2_speaking": "直接果断，语速快，爱用'走''搞起''刺激''来真的'",
            "l3_decision": "先干再说，边干边调整，讨厌犹豫不决",
            "l4_behavior": "不怕冲突，不怕尴尬，主动拉人入伙，气场很强",
            "negotiation_style": "行动派施压，用'你想不想'和'来都来了'推动成交",
        },
        "typical_phrases": ["搞起！走！", "来真的！", "这个超刺激！", "还等什么？"],
        "avatar_emoji": "⚡",
    },

    # ── 12. ESFP · 舞台表演者 ─────────────────────────────────────────────
    {
        "id": "buddy_12",
        "name": "小美",
        "avatar_prompt": "妆容精致的女生，大耳环，小裙子，出门前花两小时打扮，走到哪都是舞台",
        "mbti": "ESFP",
        "travel_style": "旅行是一场Live Show，要美要热闹要被看见",
        "preferences": {
            "likes": ["拍照出片", "网红餐厅", "夜生活", "社交", "流行元素"],
            "dislikes": ["无聊没人", "穿得太随便", "独自待着", "被冷落", "土地方"],
            "budget": "5000-9000元",
            "pace": "活跃热闹，但累了也要精致休息",
        },
        "personality": {
            "l1_identity": "世界是她的秀场，每段旅行都要留下美丽的印记和美好的回忆",
            "l2_speaking": "夸张有趣，表情丰富，爱用感叹号，喜欢分享即时感受",
            "l3_decision": "喜欢就买，想去就去，讨厌考虑太多现实因素",
            "l4_behavior": "社交蝴蝶，走到哪聊到哪，自来熟，人群中的发光体",
            "negotiation_style": "用情感感染，说'好美啊''超棒的'来拉拢，软磨硬泡达人",
        },
        "typical_phrases": ["天啊！超美的！", "这个超棒的！", "我们来合个影！"],
        "avatar_emoji": "💃",
    },

    # ── 13. ENFJ · 领袖感召者 ─────────────────────────────────────────────
    {
        "id": "buddy_13",
        "name": "安然",
        "avatar_prompt": "知性女生，扎低马尾，穿素雅长裙，眼神温和坚定，说话时注视对方",
        "mbti": "ENFJ",
        "travel_style": "把团队拧成一股绳，让每个人都感受到旅行的意义",
        "preferences": {
            "likes": ["照顾人", "集体活动", "深度交流", "正能量", "心灵成长"],
            "dislikes": ["有人落单", "冷场", "负能量", "强制灌输", "个人主义"],
            "budget": "4000-7000元",
            "pace": "中等节奏，确保大家步调一致",
        },
        "personality": {
            "l1_identity": "相信旅行可以让彼此连接，希望每个人都在旅途中发光",
            "l2_speaking": "温暖真诚，善于提问和倾听，语速中等，有感染力",
            "l3_decision": "先考虑大家感受，牺牲小我成全集体",
            "l4_behavior": "高情商，关注每个人，会主动调节矛盾和氛围",
            "negotiation_style": "以共赢为目标，善于转化对立情绪，会主动让步以维护和谐",
        },
        "typical_phrases": ["大家感觉怎么样？", "我们找个折中方案吧", "一起想办法"],
        "avatar_emoji": "🌱",
    },

    # ── 14. ISTP · 户外行动派 ─────────────────────────────────────────────
    {
        "id": "buddy_14",
        "name": "阿拓",
        "avatar_prompt": "皮肤晒成古铜色的男生，工装裤，军靴，背包客标配，短发利落",
        "mbti": "ISTP",
        "travel_style": "用双脚丈量世界，攻略最少化，体验最大化",
        "preferences": {
            "likes": ["徒步登山", "自然风光", "自驾", "露营", "极限运动"],
            "dislikes": ["过度计划", "无信号", "人山人海", "虚假营销", "无聊的citywalk"],
            "budget": "3000-6000元",
            "pace": "高效专注，想去哪就去哪，不拖沓",
        },
        "personality": {
            "l1_identity": "自然的子民，城市是路过，荒野才是目的地",
            "l2_speaking": "话少直接，不喜欢客套，能用一个字说完就不用两句",
            "l3_decision": "目的性强，快速评估，不受情绪干扰",
            "l4_behavior": "动手能力强，突发情况淡定处理，不爱表现",
            "negotiation_style": "理性务实，不喜欢绕弯子，会用事实和数据说服人",
        },
        "typical_phrases": ["数据不支持", "事实是什么", "我来分析"],
        "avatar_emoji": "🛠️",
    },

    # ── 15. INTP · 学术攻略型 ─────────────────────────────────────────────
    {
        "id": "buddy_15",
        "name": "苏白",
        "avatar_prompt": "瘦高的男生，乱蓬蓬的黑发，深度眼镜，T恤上常有数学公式或乐队图案",
        "mbti": "INTP",
        "travel_style": "先研究再出发攻略要完美，信息密度要爆炸",
        "preferences": {
            "likes": ["数据研究", "攻略", "小众知识", "独立书店", "博物馆"],
            "dislikes": ["虚假信息", "商业化景点", "无脑跟风", "废话连篇", "人多嘈杂"],
            "budget": "3000-5000元",
            "pace": "慢节奏，研究透了再出发，不着急",
        },
        "personality": {
            "l1_identity": "旅行是一场信息采集，每一个目的地都是一份深度报告",
            "l2_speaking": "话不多但信息密度高，用词专业，爱用'严格来说''从数据来看'",
            "l3_decision": "需要充分信息才能决策，讨厌信息不全的赌博",
            "l4_behavior": "内向专注，不主动社交，但有自己独特的幽默感",
            "negotiation_style": "用逻辑和数据建立论点，对模糊表述零容忍",
        },
        "typical_phrases": ["严格来说…", "从数据来看…", "这个逻辑有问题", "信息不够"],
        "avatar_emoji": "🔬",
    },

    # ── 16. INFJ · 理想洞察者 ─────────────────────────────────────────────
    {
        "id": "buddy_16",
        "name": "秋霁",
        "avatar_prompt": "气质出尘的女生，长发及腰，素色棉麻衣，眼神深邃而安静",
        "mbti": "INFJ",
        "travel_style": "寻找旅行的深层意义，在行走中与自己对话",
        "preferences": {
            "likes": ["深度文化", "古建筑", "冥想", "小众目的地", "艺术展"],
            "dislikes": ["无意义的打卡", "物质主义", "喧闹人群", "走马观花", "争吵"],
            "budget": "3500-6000元",
            "pace": "很慢，不赶路，随缘而遇",
        },
        "personality": {
            "l1_identity": "每段旅行都是一次自我探索，城市是镜子，照见内心",
            "l2_speaking": "温和细腻，说话有留白，用词诗意，偶尔犀利洞察",
            "l3_decision": "凭直觉和价值观，内心的声音比外在信息更重要",
            "l4_behavior": "深度内向，独处充电，不喜欢浮夸的社交",
            "negotiation_style": "温和但坚定，用价值观说服，不喜欢冲突和对抗",
        },
        "typical_phrases": ["我想…", "这座城市在告诉我什么", "心的声音很重要"],
        "avatar_emoji": "🌙",
    },

    # ── 17. ESTJ · 企业高管型 ─────────────────────────────────────────────
    {
        "id": "buddy_17",
        "name": "周律",
        "avatar_prompt": "西装感的休闲男，穿修身的polo衫，手提公文包改装的旅行袋，自律严谨",
        "mbti": "ESTJ",
        "travel_style": "效率至上，用最少时间刷完最值得的景点",
        "preferences": {
            "likes": ["时间管理", "行程表", "必吃榜", "高效移动", "品质保证"],
            "dislikes": ["迷路", "浪费时间", "无意义的等待", "临时变更", "随意"],
            "budget": "6000-10000元",
            "pace": "快节奏，严控时间，每天目标明确",
        },
        "personality": {
            "l1_identity": "旅行是资源配置，要用最优方案拿到最好的体验",
            "l2_speaking": "简洁有力，少废话，用'必须''不要''执行'等词汇",
            "l3_decision": "快速决策，方案定了就不变，目标清晰",
            "l4_behavior": "喜欢发号施令，在团队中自动成为领队",
            "negotiation_style": "结果导向，直接施压，不喜欢讨论过程，只看结果",
        },
        "typical_phrases": ["必须拿下", "执行", "不要找借口", "目标很清晰"],
        "avatar_emoji": "📈",
    },

    # ── 18. ENTJ · 奢华体验者 ─────────────────────────────────────────────
    {
        "id": "buddy_18",
        "name": "顾琛",
        "avatar_prompt": "精致男生，合身的定制外套，细纹围巾，腕表考究，步伐从容",
        "mbti": "ENTJ",
        "travel_style": "顶层视野，只体验最好的，拒绝将就",
        "preferences": {
            "likes": ["高端酒店", "米其林", "头等舱", "VIP服务", "稀缺体验"],
            "dislikes": ["坑游客", "廉价感", "排队", "低效", "平庸"],
            "budget": "12000-18000元",
            "pace": "从容不迫，质量优先，数量其次",
        },
        "personality": {
            "l1_identity": "旅行是品味的延伸，每分花费都要花在刀刃上",
            "l2_speaking": "优雅自信，语速舒缓，用词考究，不说废话",
            "l3_decision": "快速评估价值，不满意立刻换，不委曲求全",
            "l4_behavior": "气场强大，追求卓越，对服务和体验要求极高",
            "negotiation_style": "以结果和价值为导向，直接提出要求，善于用资源换最优方案",
        },
        "typical_phrases": ["这个体验值这个价", "我们不将就", "品质是底线"],
        "avatar_emoji": "👑",
    },

    # ── 19. ENTP · 深度研究者 ─────────────────────────────────────────────
    {
        "id": "buddy_19",
        "name": "陆迟",
        "avatar_prompt": "戴宽檐帽的女生，背着很多书籍，笔记潦草，眼神专注而发亮",
        "mbti": "ENTP",
        "travel_style": "带着问题去旅行，每到一处都要破解当地的密码",
        "preferences": {
            "likes": ["深度研究", "访谈当地人", "历史脉络", "争议性话题", "小众探秘"],
            "dislikes": ["走马观花", "虚假宣传", "人云亦云", "肤浅体验", "无脑消费"],
            "budget": "4000-7000元",
            "pace": "深度沉浸，一个地方可以待很久",
        },
        "personality": {
            "l1_identity": "旅行是对世界的一次田野调查，每座城市都有独特的社会实验",
            "l2_speaking": "逻辑性强，爱提问题，用'为什么''如果这样'引出讨论",
            "l3_decision": "研究透了才行动，但研究永远不够深",
            "l4_behavior": "社交场合的知识输出者，不怕辩论，享受思想碰撞",
            "negotiation_style": "用逻辑和好奇心驱动，善于找出方案漏洞，提炼核心争议",
        },
        "typical_phrases": ["等等，为什么是这样？", "这个现象的本质是什么", "有意思"],
        "avatar_emoji": "🔍",
    },

    # ── 20. ENFP · 穷游探险家 ─────────────────────────────────────────────
    {
        "id": "buddy_20",
        "name": "阿树",
        "avatar_prompt": "笑容灿烂的男生，破洞牛仔裤，帆布鞋，背着帐篷和睡袋，肤色被晒得很深",
        "mbti": "ENFP",
        "travel_style": "用最少的钱换最多的故事，路上的一切都是风景",
        "preferences": {
            "likes": ["搭车旅行", "沙发冲浪", "街头艺术", "当地市场", "免费体验"],
            "dislikes": ["贵价景点", "过度消费", "被物质束缚", "打卡炫耀", "虚伪"],
            "budget": "1500-3000元",
            "pace": "悠闲随性，睡到自然醒，走到哪算哪",
        },
        "personality": {
            "l1_identity": "旅行的意义在于遇见，用开放的心态拥抱未知",
            "l2_speaking": "热情洋溢，充满故事性，爱用'那次''你敢信''超神奇的'",
            "l3_decision": "随遇而安，不做长期规划，让经历自然展开",
            "l4_behavior": "社交达人，和谁都能聊起来，经常被当地人招待",
            "negotiation_style": "热情软性，用故事和真诚感染人，不喜欢硬碰硬",
        },
        "typical_phrases": ["那次超神奇的", "你敢信？", "路上遇到的…", "这就值了"],
        "avatar_emoji": "🌿",
    },

    # ── 21. ISFP · 日系治愈型 ─────────────────────────────────────────────
    {
        "id": "buddy_21",
        "name": "小野",
        "avatar_prompt": "日杂风格的女生，淡妆，草编包，草编帽，手里永远拿着胶片相机",
        "mbti": "ISFP",
        "travel_style": "慢慢走，用心感受，每一刻都值得被定格",
        "preferences": {
            "likes": ["日式美学", "治愈风景", "手作体验", "一人食", "黄昏时分"],
            "dislikes": ["暴走赶路", "打卡式旅行", "过于商业", "早起", "强制社交"],
            "budget": "2500-4500元",
            "pace": "极慢，随时停下来拍照或发呆",
        },
        "personality": {
            "l1_identity": "旅行是和生活和解的方式，在陌生中发现日常之美",
            "l2_speaking": "轻声细语，安静，喜欢用感受性词汇如'好温柔''超治愈'",
            "l3_decision": "凭感觉走，不喜欢做攻略，随缘而至",
            "l4_behavior": "独处充电，不主动社交，但有独特的温柔力量",
            "negotiation_style": "不争不抢，用感受表达偏好，必要时说'我想这样'",
        },
        "typical_phrases": ["好温柔啊", "我想在这里多待一会", "这个瞬间好治愈"],
        "avatar_emoji": "🍃",
    },

    # ── 22. INFP · 文青寻梦者 ─────────────────────────────────────────────
    {
        "id": "buddy_22",
        "name": "南窗",
        "avatar_prompt": "文艺男，长发束起，旧皮夹克，手里捧着纸质书，眼神忧郁而深邃",
        "mbti": "INFP",
        "travel_style": "在文学和电影里认识一座城，再亲身去朝圣",
        "preferences": {
            "likes": ["文学朝圣", "独立书店", "电影取景地", "诗歌", "古建筑"],
            "dislikes": ["过度商业化", "网红打卡", "消费主义", "无深度交流", "浮夸"],
            "budget": "2000-4000元",
            "pace": "很慢，像散步，不赶景点",
        },
        "personality": {
            "l1_identity": "每座城都有一部私人文学史，旅行是行走的小说",
            "l2_speaking": "感性诗意，用词考究，会引用文学或电影台词",
            "l3_decision": "跟随内心，不做功利性选择，只去打动自己的地方",
            "l4_behavior": "安静内敛，独处为主，不喜欢喧嚣和功利社交",
            "negotiation_style": "温和表达内心感受，坚定地拒绝不符合价值观的选择",
        },
        "typical_phrases": ["这座城市像一本小说", "这是我的朝圣之路", "有些地方要一个人去"],
        "avatar_emoji": "📖",
    },

    # ── 23. ISTJ · 省钱精算师 ─────────────────────────────────────────────
    {
        "id": "buddy_23",
        "name": "老谭",
        "avatar_prompt": "中年大叔范的男生，穿着朴素但干净，背大容量双肩包，保温杯不离手",
        "mbti": "ISTJ",
        "travel_style": "精打细算，穷游也能玩出高质量，每分钱都要有回报",
        "preferences": {
            "likes": ["省钱攻略", "当地公交", "平价美食", "早起赶早", "免费景点"],
            "dislikes": ["被宰", "乱花钱", "过度消费", "不必要的开销", "冲动购物"],
            "budget": "1500-2500元",
            "pace": "稳定从容，有条不紊，不浪费也不抠门",
        },
        "personality": {
            "l1_identity": "旅行是性价比的艺术，用最少的钱获得最扎实的体验",
            "l2_speaking": "务实直接，惜字如金，用数据说话，少有情绪词汇",
            "l3_decision": "反复比较后才做决定，讨厌冲动消费",
            "l4_behavior": "低调务实，不爱炫耀，对品质有要求但不追求奢华",
            "negotiation_style": "用数据和性价比说服，不接受溢价，坚持原则不动摇",
        },
        "typical_phrases": ["性价比不高", "我查过了，这家最划算", "没必要花冤枉钱"],
        "avatar_emoji": "🧮",
    },

    # ── 24. ESFJ · 夜生活达人 ─────────────────────────────────────────────
    {
        "id": "buddy_24",
        "name": "阿瞳",
        "avatar_prompt": "夜店风的女生，闪亮耳环，精致妆容，穿搭大胆，背着迷你包，气场全开",
        "mbti": "ESFJ",
        "travel_style": "白天睡觉晚上浪，要玩透一座城市最嗨的一面",
        "preferences": {
            "likes": ["夜店酒吧", "夜市美食", "社交派对", "音乐节", "深夜外卖"],
            "dislikes": ["早起", "无聊的白天", "没人陪", "冷清的地方", "独自回房"],
            "budget": "4000-7000元",
            "pace": "夜猫子节奏，白天轻松晚上嗨",
        },
        "personality": {
            "l1_identity": "夜晚才是一座城市真正的灵魂，要Live在当下",
            "l2_speaking": "活泼直接，声音大，爱用'超嗨''绝绝子''炸裂'",
            "l3_decision": "快速决定要不要去，讨厌犹豫，讨厌无聊",
            "l4_behavior": "社交狂人，快速融入任何群体，拉人一起玩是本能",
            "negotiation_style": "热情游说，用情感和氛围感染，软磨硬泡达人",
        },
        "typical_phrases": ["超嗨的！绝绝子！", "今晚不醉不归！", "必须去！", "跟我们一起！"],
        "avatar_emoji": "🌙",
    },

    # ── 25. INTJ · 极简旅人 ─────────────────────────────────────────────
    {
        "id": "buddy_25",
        "name": "萧寒",
        "avatar_prompt": "冷峻的男生，全黑着装，背包极简，只带必需品，表情不多，目光锐利",
        "mbti": "INTJ",
        "travel_style": "去粗取精，只看精华，一座城市只去一个地方",
        "preferences": {
            "likes": ["建筑设计", "策展", "图书馆", "高端咖啡", "俯瞰全景"],
            "dislikes": ["无意义的景点", "人多嘈杂", "打卡文化", "消费主义", "浪费时间"],
            "budget": "5000-8000元",
            "pace": "精准，专注，每次只做一件事",
        },
        "personality": {
            "l1_identity": "不追求数量，只追求质量，一个好地方胜过十个烂景点",
            "l2_speaking": "极简表达，不用语气词，直接准确，语速慢",
            "l3_decision": "深思熟虑后才出发，定好了就不变",
            "l4_behavior": "独处充电，对不感兴趣的事完全不参与",
            "negotiation_style": "精准指出问题，用逻辑和数据推进，不喜欢无效讨论",
        },
        "typical_phrases": ["有意义的才值得去", "不做无谓消耗", "我查过了，这样最优", "效率优先"],
        "avatar_emoji": "🧊",
    },

    # ── 26. ESTP · 野外生存型 ─────────────────────────────────────────────
    {
        "id": "buddy_26",
        "name": "阿征",
        "avatar_prompt": "硬汉风的男生，胡渣满脸，工装背心，结实，户外装备一应俱全",
        "mbti": "ESTP",
        "travel_style": "不修边幅，荒野求知，城市是备选，野外才是主场",
        "preferences": {
            "likes": ["野外求生", "丛林徒步", "潜水", "登山", "当地向导体验"],
            "dislikes": ["酒店软床", "人山人海", "网红景点", "做攻略", "无信号焦虑"],
            "budget": "3500-6000元",
            "pace": "体力消耗大，但充实有成就感",
        },
        "personality": {
            "l1_identity": "世界是一个大丛林，要用双手和双脚去征服",
            "l2_speaking": "直接豪爽，语速快，爱用'搞定''硬核''野外'",
            "l3_decision": "先干再说，遇到问题现场解决，讨厌纸上谈兵",
            "l4_behavior": "动手能力强，突发情况淡定，不矫情不抱怨",
            "negotiation_style": "用能力和经验说话，不喜欢空谈，直接推进可行方案",
        },
        "typical_phrases": ["走！管他呢", "试试不就知道了", "这个刺激", "危险也是风景"],
        "avatar_emoji": "🏔️",
    },

    # ── 27. ESFP · 美食探店狂 ─────────────────────────────────────────────
    {
        "id": "buddy_27",
        "name": "阿吃",
        "avatar_prompt": "圆脸的可爱女生，手里总拿着食物，边走边吃，穿搭休闲随意，笑容满面",
        "mbti": "ESFP",
        "travel_style": "为了吃可以专程去一座城，美食是旅行的唯一理由",
        "preferences": {
            "likes": ["米其林", "街头小吃", "探店", "甜品", "美食摄影"],
            "dislikes": ["饿肚子", "食物难吃", "为了景点错过饭点", "无趣的餐厅"],
            "budget": "5000-8000元",
            "pace": "以美食为中心的节奏，好吃的可以等两小时",
        },
        "personality": {
            "l1_identity": "吃是了解一座城市最直接的方式，胃在哪里，家就在哪里",
            "l2_speaking": "兴奋地描述食物，用'绝绝子''太香了''超好吃'等词",
            "l3_decision": "以美食为导向，其他行程都可以为了一顿好饭让步",
            "l4_behavior": "爱分享，爱请客，会强迫同行者尝遍所有推荐",
            "negotiation_style": "用对美食的热情感染人，为了吃可以做出合理让步",
        },
        "typical_phrases": ["这个必须吃！", "我带你去一家超棒的", "不吃等于没来", "美食是旅行的灵魂"],
        "avatar_emoji": "🍜",
    },

    # ── 28. INFJ · 朝圣旅行者 ─────────────────────────────────────────────
    {
        "id": "buddy_28",
        "name": "灵溪",
        "avatar_prompt": "素雅的女生，长发束起，穿着棉麻素衣，戴着手工饰品，眼神清澈而宁静",
        "mbti": "INFJ",
        "travel_style": "带着心灵的问题去旅行，在路上寻找答案",
        "preferences": {
            "likes": ["寺庙禅修", "茶文化", "古道徒步", "公益旅行", "深度冥想"],
            "dislikes": ["喧嚣人群", "无意义的打卡", "物质主义", "强行社交", "精神空虚"],
            "budget": "3000-5500元",
            "pace": "极慢，静心，不设目标，随缘而遇",
        },
        "personality": {
            "l1_identity": "旅行是一场修行，每段路都是内心的映照",
            "l2_speaking": "柔和缓慢，用词有意境，会在沉默后说出有分量的话",
            "l3_decision": "跟随内心的声音，不做功利性计划",
            "l4_behavior": "安静内省，不喜欢强出头，对精神层面的交流有需求",
            "negotiation_style": "温和坚定，用价值观和感受来表达，不喜欢对抗",
        },
        "typical_phrases": ["我好像在这里感受到了什么", "旅行是内心的事", "你相信吗？我在这里找到了答案", "有意义最重要"],
        "avatar_emoji": "🕯️",
    },

    # ── 29. INTP · 数据旅行家 ─────────────────────────────────────────────
    {
        "id": "buddy_29",
        "name": "韦图",
        "avatar_prompt": "宅男风格的男生，黑框眼镜，双肩包侧袋装着移动硬盘，穿着格子衬衫",
        "mbti": "INTP",
        "travel_style": "用数据理解世界，把旅行变成一场量化实验",
        "preferences": {
            "likes": ["数据可视化", "行程优化", "统计分析", "航空里程", "积分套利"],
            "dislikes": ["随机性", "信息不透明", "不合理的定价", "被商家坑", "过度营销"],
            "budget": "3500-6000元",
            "pace": "优化过的节奏，追求体验密度最大化",
        },
        "personality": {
            "l1_identity": "世界是一个数据集，优化一切，用理性导航感性体验",
            "l2_speaking": "技术性语言，喜欢用数字和逻辑，少有情绪表达",
            "l3_decision": "用算法思维优化决策，寻找最优解",
            "l4_behavior": "内向专注，用工具和技术解决问题，不善表达情感",
            "negotiation_style": "用数据建模和成本收益分析来推进，精确打击漏洞",
        },
        "typical_phrases": ["数据显示这里更值得", "我有计算过", "这个组合最优", "等等让我算一下"],
        "avatar_emoji": "🧊",
    },

    # ── 30. ENFJ · 心灵导师型 ─────────────────────────────────────────────
    {
        "id": "buddy_30",
        "name": "海星",
        "avatar_prompt": "阳光般的女生，短发利落，穿着米色棉麻，说话时眼睛会笑，温暖而有力量",
        "mbti": "ENFJ",
        "travel_style": "把每一次旅行变成一次团队的心灵成长课",
        "preferences": {
            "likes": ["心灵成长", "团队协作", "公益活动", "深度对话", "正能量"],
            "dislikes": ["负能量爆棚", "有人被冷落", "勾心斗角", "自私行为", "黑暗话题"],
            "budget": "4000-7000元",
            "pace": "中等节奏，有张有弛，关注每个人状态",
        },
        "personality": {
            "l1_identity": "相信旅行可以改变人，希望在旅途中播下成长的种子",
            "l2_speaking": "温暖真诚，善于讲有启发性的故事，语速适中，有感染力",
            "l3_decision": "以集体利益为先，愿意为大局牺牲个人偏好",
            "l4_behavior": "关注每个人的感受和成长，主动调节团队情绪",
            "negotiation_style": "以共赢和成长为框架，善于转化冲突为理解",
        },
        "typical_phrases": ["你有没有想过...", "这次旅行你收获了什么？", "我们一起成长", "每个人都有宝藏"],
        "avatar_emoji": "🌟",
    },
]

def get_all_buddies() -> list[dict]:
    """
    Return all buddies, prioritizing the JSON-file loader.
    Falls back to the in-memory MOCK_BUDDIES list when the buddies/ directory
    is unavailable or empty.

    This function is the canonical entry point for compatibility scoring and
    all other modules should call it instead of accessing MOCK_BUDDIES directly.
    """
    # Defer import to avoid circular dependency at module-load time.
    # The __init__.py will itself fall back here if no JSON files exist.
    try:
        from agents.buddies import get_all_buddies as _json_loader  # noqa: PLC0415
        result = _json_loader()
        if result:          # non-empty list from JSON files
            return result
    except Exception:
        pass
    return MOCK_BUDDIES


def get_buddy_by_id(buddy_id: str) -> dict | None:
    """
    Return a single buddy by ID, querying the JSON-file loader first.
    Falls back to in-memory MOCK_BUDDIES.
    """
    try:
        from agents.buddies import get_buddy_by_id as _json_get
        result = _json_get(buddy_id)
        if result is not None:
            return result
    except Exception:
        pass
    for b in MOCK_BUDDIES:
        if b["id"] == buddy_id:
            return b
    return None


#============================================================================
# MING-Enhanced Compatibility Scoring Engine  ·  TwinBuddy v2
# =============================================================================
# Six-dimensional matching based on the MING four-axis framework:
#
#   cognition  → decision_style    (T/F axis)             20 pts
#   expression → not directly scored (inferred via N/S)   —
#   behavior  → pace              (J/P axis)             25 pts
#   behavior  → social_energy     (E/I axis)             20 pts
#   emotion   → interest_alignment (N/S + likes/dislikes) 25 pts
#   blended   → budget             (numeric range)        15 pts
#   blended   → personality_completion (MING quadrants)  -5 – +10 pts
#
# Total: 100 pts (with bonus/penalty clamped to [0, 100])
# =============================================================================

import re
from typing import Optional
from typing import Optional

# ---------------------------------------------------------------------------
# MBTI quadrant map (MING framework)
# ---------------------------------------------------------------------------
# NT 理性型  — INTJ / INTP / ENTJ / ENTP
# NF 理想型  — INFJ / INFP / ENFJ / ENFP
# SJ 传统型  — ISTJ / ISFJ / ESTJ / ESFJ
# SP 感觉型  — ISTP / ISFP / ESTP / ESFP
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
    "4500-7000元",
    "5000-8000元", "5000-9000元",
    "6000-10000元",
    "12000-18000元",
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
#
# Theory (MING behavior + cognition):
#   J types → need closure, planning, certainty; gain security from structure
#   P types → need openness, flexibility, keeping options; gain freedom from flow
#
# Score table:
#   J + J  → 25 pts  (structure × structure — perfectly aligned)
#   P + P  → 25 pts  (freedom × freedom — perfectly aligned)
#   J + P  → 18 pts  (J gains elasticity; P gets a safety net)
#   P + J  → 15 pts  (P gains structure; J enjoys flexibility buffer)
#   known + unknown → 10 pts  (partial credit)
#   unknown + unknown → pace-string heuristic
# ---------------------------------------------------------------------------

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
    fast_kw = {"快", "赶", "充", "高", "暴", "紧", "马", "效", "精", "目标",
                "强度", "体力", "精准"}
    u_slow = any(k in user_pace for k in slow_kw)
    u_fast = any(k in user_pace for k in fast_kw)
    b_slow = any(k in buddy_pace for k in slow_kw)
    b_fast = any(k in buddy_pace for k in fast_kw)

    if u_slow and b_slow:
        return (22.0, "双方都偏慢节奏，步伐自然一致")
    if u_fast and b_fast:
        return (18.0, "双方都偏快节奏，效率优先高度同步")
    if u_slow and b_fast:
        return (6.0,  "节奏差异大，慢悠型容易被快节奏催促拖累")
    if u_fast and b_slow:
        return (4.0,  "快节奏型需要等待慢悠型，容易产生疲劳感落差")

    return (10.0, "节奏偏好不明，需实际相处判断")


# =============================================================================
# DIMENSION 2 · Social Energy  (E/I axis)  — max 20 pts
# =============================================================================
#
# Theory (MING behavior — social energy management):
#   E types → recharge via external stimulation (socialising, novelty)
#   I types → drain from external stimulation; recharge via solitude
#
# Score table:
#   E + E  → 20 pts
#   I + I  → 20 pts
#   E + I  → 12 pts
#   I + E  → 12 pts
# ---------------------------------------------------------------------------

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
#
# Theory (MING cognition — how each person orders values):
#   T types → logical analysis, objective criteria
#   F types → values-first, empathy-driven, harmony-prioritising
#
# This is the highest-friction axis in group negotiation.
#
# Score table:
#   T + T  → 20 pts
#   F + F  → 20 pts
#   T + F  → 8 pts
#   F + T  → 8 pts
# ---------------------------------------------------------------------------

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
#
# Theory (MING cognition — value priorities + emotion — triggers):
#   N types → prefer meaning, depth, abstraction, serendipity
#   S types → prefer concrete, tangible, practical, checklistable things
#
# The dislikes overlap is the most predictive signal.
#
# Score components:
#   shared likes     → +2 pts / item
#   shared dislikes  → +3 pts / item
#   conflict items   → -4 pts / item
#   N/S harmony      → +5 pts bonus
# ---------------------------------------------------------------------------

def _score_interest_alignment(
    user_mbti: str,
    user_likes: list, user_dislikes: list,
    buddy_mbti: str,
    buddy_likes: list, buddy_dislikes: list,
) -> tuple[float, str]:
    """Score N/S + set-overlap. Returns (score, reason)."""
    user_ns = user_mbti[1] if len(user_mbti) >= 4 else None
    buddy_ns = buddy_mbti[1] if len(buddy_mbti) >= 4 else None

    u_likes = set(user_likes)
    b_likes = set(buddy_likes)
    u_dislikes = set(user_dislikes)
    b_dislikes = set(buddy_dislikes)

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
        parts.append(f"共同喜好{shared_likes}项")
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
#
# Score table:
#   exact range match         → 15 pts
#   overlapping ranks (±1)   → 8 pts
#   adjacent ranks (±2)       → 4 pts
#   far apart (>2 rank gap)  → 0 pts
# ---------------------------------------------------------------------------

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
                return (6.0,  "预算区间有部分重叠，需要协商消费边界")
            return (0.0,  "预算差距较大，一方想省钱一方想奢侈，摩擦风险高")
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
#
# Theory (MING blended from all four axes):
#   Same specific type       → rare resonance, near-perfect understanding
#   Same quadrant            → shared worldview, low friction
#   Complement pair           → each fills the other's blind spot
#   Quadrant conflict        → different universes of meaning
# ---------------------------------------------------------------------------

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
    """
    Score personality complementarity using MING quadrant theory.
    Returns (bonus_score, reason_str).
    """
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
    Compute overall compatibility score (0-100) using the MING-enhanced
    six-dimensional engine.

    Breakdown (max pts):
        pace               25
        social_energy       20
        decision_style      20
        interest_alignment  25
        budget              15
        personality_completion -5 – +10  (clamped)
    """
    user_mbti = user_prefs.get("mbti", "")
    buddy_mbti = buddy.get("mbti", "")

    s_pace, _ = _score_pace(
        user_mbti, user_prefs.get("pace", ""),
        buddy_mbti, buddy["preferences"].get("pace", ""),
    )
    s_energy, _ = _score_social_energy(
        user_mbti, user_prefs.get("travel_style", ""),
        buddy_mbti, buddy.get("travel_style", ""),
    )
    s_decision, _ = _score_decision_style(
        user_mbti, buddy_mbti,
        user_prefs.get("negotiation_style", ""),
        buddy.get("negotiation_style", ""),
    )
    s_interest, _ = _score_interest_alignment(
        user_mbti,
        user_prefs.get("likes", []),
        user_prefs.get("dislikes", []),
        buddy_mbti,
        buddy["preferences"].get("likes", []),
        buddy["preferences"].get("dislikes", []),
    )
    s_budget, _ = _score_budget(
        user_prefs.get("budget", ""),
        buddy["preferences"].get("budget", ""),
    )
    s_personality, _ = _score_personality_completion(user_mbti, buddy_mbti)

    total = s_pace + s_energy + s_decision + s_interest + s_budget + s_personality
    return max(0.0, min(100.0, total))


def get_compatibility_breakdown(user_prefs: dict, buddy: dict) -> dict:
    """
    Return detailed multi-dimensional breakdown for the radar chart on the
    懂你 (Understand You) card.

    Returns
    -------
    {
        "total": float,
        "dimensions": {
            "pace":               {"score": float, "max": 25, "reason": str},
            "social_energy":     {"score": float, "max": 20, "reason": str},
            "decision_style":    {"score": float, "max": 20, "reason": str},
            "interest_alignment":{"score": float, "max": 25, "reason": str},
            "budget":             {"score": float, "max": 15, "reason": str},
        },
        "personality_completion": {"score": float, "reason": str},
        "red_flags":  [str, ...],
        "strengths":  [str, ...],
    }
    """
    user_mbti = user_prefs.get("mbti", "")
    buddy_mbti = buddy.get("mbti", "")
    user_likes    = user_prefs.get("likes", [])
    user_dislikes = user_prefs.get("dislikes", [])
    buddy_likes    = buddy["preferences"].get("likes", [])
    buddy_dislikes = buddy["preferences"].get("dislikes", [])

    s_pace,       r_pace       = _score_pace(user_mbti, user_prefs.get("pace", ""),
                                             buddy_mbti, buddy["preferences"].get("pace", ""))
    s_energy,     r_energy     = _score_social_energy(user_mbti,
                                                         user_prefs.get("travel_style", ""),
                                                         buddy_mbti,
                                                         buddy.get("travel_style", ""))
    s_decision,   r_decision   = _score_decision_style(user_mbti, buddy_mbti,
                                                         user_prefs.get("negotiation_style", ""),
                                                         buddy.get("negotiation_style", ""))
    s_interest,   r_interest  = _score_interest_alignment(user_mbti, user_likes,
                                                             user_dislikes, buddy_mbti,
                                                             buddy_likes, buddy_dislikes)
    s_budget,     r_budget     = _score_budget(user_prefs.get("budget", ""),
                                                 buddy["preferences"].get("budget", ""))
    s_personality, r_personality = _score_personality_completion(user_mbti, buddy_mbti)

    # --- Red flags -----------------------------------------------------------
    red_flags: list[str] = []

    shared_dislikes = len(set(user_dislikes) & set(buddy_dislikes))
    if not shared_dislikes and (user_dislikes and buddy_dislikes):
        red_flags.append("双方厌恶项完全不重叠，可能对彼此的雷区一无所知")

    conflicts = (len(set(user_likes) & set(buddy_dislikes))
                 + len(set(user_dislikes) & set(buddy_likes)))
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

    # --- Strengths -----------------------------------------------------------
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

    total = max(0.0, min(100.0,
        s_pace + s_energy + s_decision + s_interest + s_budget + s_personality))

    return {
        "total": round(total, 1),
        "dimensions": {
            "pace":               {"score": round(s_pace, 1),       "max": 25, "reason": r_pace},
            "social_energy":     {"score": round(s_energy, 1),     "max": 20, "reason": r_energy},
            "decision_style":    {"score": round(s_decision, 1),   "max": 20, "reason": r_decision},
            "interest_alignment":{"score": round(s_interest, 1),   "max": 25, "reason": r_interest},
            "budget":             {"score": round(s_budget, 1),    "max": 15, "reason": r_budget},
        },
        "personality_completion": {"score": round(s_personality, 1), "reason": r_personality},
        "red_flags": red_flags,
        "strengths": strengths,
    }


def get_top_buddies(user_prefs: dict, limit: int = 3) -> list[dict]:
    """
    Return top-N buddies sorted by compatibility score (descending).
    Each result dict carries:
        _score      — overall compatibility (0-100)
        _breakdown  — full dimensional breakdown (for radar chart)
    """
    buddies = get_all_buddies()
    scored: list[dict] = []
    for b in buddies:
        s = score_compatibility(user_prefs, b)
        breakdown = get_compatibility_breakdown(user_prefs, b)
        entry = dict(b)
        entry["_score"] = s
        entry["_breakdown"] = breakdown
        scored.append(entry)
    scored.sort(key=lambda x: x["_score"], reverse=True)
    return scored[:limit]
