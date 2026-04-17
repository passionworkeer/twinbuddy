# -*- coding: utf-8 -*-
"""
Mock Companion Database — TwinBuddy MVP
10 personas covering diverse MBTI types and travel styles.
Each entry contains the full personality data with rich, realistic details.

New fields added:
  - avatar_prompt      : 3D digital avatar generation prompt
  - typical_phrases    : Authentic verbal habits / catchphrases
  - real_interest_detail: Specific interests, not generic categories
  - travel_story       : A real-sounding travel anecdote that reveals character
"""

MOCK_BUDDIES: list[dict] = [
    # ── 1. ENFP · 小满 ──────────────────────────────────────────────────────
    {
        "id": "buddy_01",
        "name": "小满",
        "avatar_prompt": "ENFP young woman, curly short hair, colorful bead bracelets stacked on wrist, bright laughing eyes, phone case with collage style, wearing oversized denim jacket, energetic posture",
        "mbti": "ENFP",
        "travel_style": "说走就走，随性自由派",
        "typical_phrases": [
            "这个可以有！！！",
            "等等等等我突然想到一个超棒的 idea！",
            "啊？？不会吧！",
            "那我们去……！（眼睛亮了）",
            "我不想做攻略了，到时再说好不好！",
        ],
        "real_interest_detail": "成都的火锅（不是网红店，是玉林老小区里的老灶火锅）、在青旅跟陌生人聊到凌晨三点、为了一张好看的日落照片等一个半小时、在市集上淘奇怪的手工艺品然后不知道放哪里",
        "travel_story": "去年一个人去大理，在双廊青旅遇到一群西班牙背包客，大家语言不通但靠比手画脚聊了整晚人生，第二天直接睡到下午两点把骑车环洱海的计划废了，但她说那是那次旅行最值的两小时。",
        "preferences": {
            "likes": ["美食探店", "拍照打卡", "即兴发现", "人文景点", "青旅社交"],
            "dislikes": ["严格日程", "早睡早起", "暴走赶景点", "军事化行程"],
            "budget": "3000-5000元",
            "pace": "慢悠悠，不想累着",
        },
        "personality": {
            "l1_identity": "一个相信旅行是自我发现的ENFP，喜欢用脚步丈量城市的温度，也相信最珍贵的回忆往往来自计划外的相遇",
            "l2_speaking": "话多跳跃，爱用感叹号和网络词，消息密度高，句式短活泼，打字飞快经常打错别字然后用括号纠正",
            "l3_decision": "凭感觉做决定，容易被有趣的事带跑，不喜欢被约束，情绪来了立刻出发，情绪过了重新规划",
            "l4_behavior": "社交达人，主动结交新朋友，在群体中是气氛担当，但三分钟热度，热情来得快去得也快",
            "negotiation_style": "热情洋溢地提想法，用'这个感觉超棒的！'说服人，但执行力弱，容易被新提议带跑方向",
        },
        "flaw": "经常迟到 10-20 分钟，说'马上到'之后往往还要 40 分钟",
    },

    # ── 2. ISTJ · 老陈 ──────────────────────────────────────────────────────
    {
        "id": "buddy_02",
        "name": "老陈",
        "avatar_prompt": "ISTJ male, metal frame glasses, neat short hair, dark casual blazer, silver mechanical watch on wrist, composed calm expression, black backpack with organized pouches, walking with measured pace",
        "mbti": "ISTJ",
        "travel_style": "提前三个月做攻略，每天景点精确到小时",
        "typical_phrases": [
            "我查过了，周一闭馆。",
            "按原计划走，不变了。",
            "嗯，合理的。",
            "我整理了一份文档，晚点发你。",
            "提前45分钟出发，宁可等也不赶。",
            "这个地方值得专门来一次。",
        ],
        "real_interest_detail": "博物馆和历史遗迹（提前查好讲解器有没有中文）、每个城市的城市规划展览馆、当地排名第一的菜市场（观察城市运转逻辑）、用 Notion 做详细旅行表格",
        "travel_story": "有一年十一去西安，凌晨5点起床赶秦始皇兵马俑第一批入场，整整等了两个小时——不是因为他不知道人会多，而是他专门查了人流量数据，发现10点后人潮是9点的3倍。他说那天早上8点站在空旷的俑坑前，觉得一切都值了。",
        "preferences": {
            "likes": ["准时", "计划周全", "博物馆", "历史遗迹", "性价比", "备份方案"],
            "dislikes": ["迟到", "临时改变", "无计划", "迷路", "人从众"],
            "budget": "4000-6000元",
            "pace": "充实但不过累，严格控制每天景点数量（不超过3个）",
        },
        "personality": {
            "l1_identity": "信奉'准备充分才能玩得安心'的ISTJ，旅行清单就是他的安全感，完美主义但不自知",
            "l2_speaking": "简洁直接，少用语气词，重视数据和事实，句式工整像写报告，惜字如金",
            "l3_decision": "深思熟虑后才行动，有清单和备选方案，极少冲动，但偶尔会过度规划反而累了自己",
            "l4_behavior": "守时守信，重视承诺，不喜欢临时起意的社交，在陌生人多的场合反而会主动维持秩序",
            "negotiation_style": "用Excel式逻辑推进，质疑模糊表述，立场坚定不易妥协，但对方理由充分时会认真让步",
        },
        "flaw": "当旅伴表现出典型的ENFP特质（'到时候再说嘛'）时会忍不住皱眉头，虽然不会说出来",
    },

    # ── 3. INFP · 阿璃 ──────────────────────────────────────────────────────
    {
        "id": "buddy_03",
        "name": "阿璃",
        "avatar_prompt": "INFP female, long straight hair, delicate silver huggie earrings, canvas tote bag, gentle melancholic eyes, wearing linen earth-tone dress and canvas shoes, holding an old worn book, looks like she just woke from a long dream",
        "mbti": "INFP",
        "travel_style": "随缘漫游，在意旅行意义和心灵体验",
        "typical_phrases": [
            "嗯……我也不知道该怎么说，就是感觉……",
            "我们可以在这里坐一会儿吗？不做什么。",
            "这个地方让我想起以前读的一本书……",
            "你有没有那种，突然被什么打到了的感觉？",
            "其实我不太确定我想不想去……让我想想。",
        ],
        "real_interest_detail": "独立旧书店（不是连锁品牌）、有年代感的老居民区街道、在咖啡馆里读半天书、看街头老人下棋或者发呆、一个人迹稀少的寺庙或者废墟",
        "travel_story": "有一年在京都，找一家Tabelog上4.2分的咖喱饭，在祇园的小巷子里走了40分钟，最后发现那天店休。她没有抱怨，在旁边的鸭川河边坐了一个小时，看一只白鹭站着一动不动。她说那一个小时是整趟旅行最值钱的一小时。",
        "preferences": {
            "likes": ["小众景点", "独立书店", "咖啡馆", "自然风光", "深度感受", "慢节奏"],
            "dislikes": ["过度商业化", "打卡式游览", "强制社交", "争吵冲突", "人山人海"],
            "budget": "2500-4000元",
            "pace": "慢，享受过程，不赶时间，宁可少看几个地方也要看进去",
        },
        "personality": {
            "l1_identity": "相信每座城都有自己的灵魂，旅行是与城市的私密对话，不打卡，只记录感受",
            "l2_speaking": "温柔细腻，用词有画面感，语速慢，会留白和停顿，不爱主动发起话题但深聊时突然很长",
            "l3_decision": "基于价值观和感受做决定，会因'感觉不对'而拒绝一个大多数人都推荐的地方，自己也说不清原因",
            "l4_behavior": "回避冲突，不喜欢硬碰硬，宁愿让步也不愿伤和气，但这种忍让有时让自己很累",
            "negotiation_style": "用价值观说服，温和但坚定地拒绝违背内心的方案，很难说'不'所以有时勉强答应之后会后悔",
        },
        "flaw": "经常因为'感觉还没准备好'而错过一些机会，事后又后悔自己不够勇敢",
    },

    # ── 4. ESTJ · 大龙 ──────────────────────────────────────────────────────
    {
        "id": "buddy_04",
        "name": "大龙",
        "avatar_prompt": "ESTJ male, crew cut hair, business casual outfit, confident body language, speaks quickly with direct eye contact, holding a travel itinerary printout, leather messenger bag, walks fast",
        "mbti": "ESTJ",
        "travel_style": "高效打卡，把行程当项目管理",
        "typical_phrases": [
            "这个必须今天搞定。",
            "别磨叽了，我们走！",
            "我来分工，大家各司其职。",
            "这个地方到底值不值得去？给我一个理由。",
            "好了好了，就这么定了，不要再改了。",
        ],
        "real_interest_detail": "网红景点必打卡（不做攻略的人才会去的地方他都觉得没意思）、大众点评当地榜单TOP10、商务宴请级别的餐厅、带一点竞争性质的体验（密室逃脱、高尔夫练习场）",
        "travel_story": "有一年带家人去日本，七天跑了六个城市，每天早上7点集合，晚上10点回酒店做总结复盘。他妹妹在朋友圈发'跟大龙旅行的七天，瘦了三斤'，他看了觉得是夸奖。",
        "preferences": {
            "likes": ["网红景点", "美食必吃榜", "效率至上", "团队协作", "清晰分工"],
            "dislikes": ["磨蹭犹豫", "无意义等待", "选择困难", "计划被打乱", "迟到"],
            "budget": "5000-8000元",
            "pace": "快节奏，恨不得一天当两天用，体力惊人，同行人经常跟不上",
        },
        "personality": {
            "l1_identity": "把旅行当成一场战役，目标导向，使命必达，执行力极强，是天生的领队",
            "l2_speaking": "干脆利落，不绕弯子，喜欢用'必须''马上''搞定'，说话快且果断，很少用问句",
            "l3_decision": "快速决策，不纠结，快速推翻不合适的方案，决策速度让身边的人有时跟不上节奏",
            "l4_behavior": "喜欢主导和控制，在群体中天然当领队，对拖后腿的同伴会直接施压但出发点是为大家好",
            "negotiation_style": "直击要点，快速推进，不喜欢拖泥带水，会施压催决策，但被有效反驳后也会调整计划",
        },
        "flaw": "太追求效率而忽略同行人的感受，有人累了会说'再坚持一下'，其实是体力最好但不自知",
    },

    # ── 5. ISFP · 小拾 ──────────────────────────────────────────────────────
    {
        "id": "buddy_05",
        "name": "小拾",
        "avatar_prompt": "ISFP female, Japanese streetwear style, bucket hat, film camera hanging around neck, quiet contemplative eyes, wearing vintage denim jacket, standing alone on a quiet street corner taking photos",
        "mbti": "ISFP",
        "travel_style": "漫无目的游荡，在喜欢的地方待很久",
        "typical_phrases": [
            "嗯……还挺不错的。",
            "我想在这里再待一会儿。",
            "你有没有听到什么声音？",
            "哦，我就是随便走走。",
            "挺好的呀，我没意见。",
        ],
        "real_interest_detail": "胶片摄影（每次旅行只带三卷，每卷36张所以要很谨慎地按快门）、日落时刻的老街区巷弄、独立小众咖啡馆（不网红的那种）、有涂鸦的老厂房或者废弃火车站",
        "travel_story": "在厦门曾厝垵，所有人都在拍网红墙，她在旁边一条无人的小巷里站了半小时，拍一棵长在破墙缝里的三角梅。旁边一个拿着单反的大叔问她'你怎么找到这里的'，她说'我没有找，它就在这里'。",
        "preferences": {
            "likes": ["拍照摄影", "小众街区", "日落", "独立咖啡", "街头艺术", "独处时间"],
            "dislikes": ["早起", "人山人海", "规定必去", "催促", "太商业化", "时间表"],
            "budget": "2000-3500元",
            "pace": "非常慢，随时停下来，不知道下一秒会去哪里",
        },
        "personality": {
            "l1_identity": "用镜头记录世界，旅行是逃避喧嚣寻找美的方式，美学优先于效率",
            "l2_speaking": "轻声细语，表达含蓄，用'还不错''挺好的'等委婉词，很少主动表达反对，被催促时会沉默但不会反抗",
            "l3_decision": "凭直觉和审美偏好行动，不擅长分析利弊，决定往往是'这里让我有感觉'而不是'这里性价比高'",
            "l4_behavior": "独处充电，不喜欢被push，对强势要求会沉默但内心有坚持，不会正面冲突",
            "negotiation_style": "不正面冲突，用'我想……''其实……'表达异议，必要时温和地拒绝但说不出理由",
        },
        "flaw": "经常因为'在等一个对的时刻'而错过已经计划好的行程，比如为了一场日落错过了高铁",
    },

    # ── 6. ENTJ · 程远 ─────────────────────────────────────────────────────
    {
        "id": "buddy_06",
        "name": "程远",
        "avatar_prompt": "ENTJ male, tall, casual blazer with smart watch, sharp analytical eyes, confident stance, MacBook Air under arm, speaks with structured logical sentences, travels for business frequently",
        "mbti": "ENTJ",
        "travel_style": "顶层设计，制定主题式路线，资源整合能力强",
        "typical_phrases": [
            "核心问题是什么？我们先把这个理清楚。",
            "第一，第二，第三。",
            "这个ROI不够高，换一个方案。",
            "我来做，你们执行就行。",
            "我们来复盘一下今天的效率。",
        ],
        "real_interest_detail": "战略咨询级别的行程规划、高端特色体验（如米其林预约、幕后参观）、稀缺资源获取（订不到的位置他总能搞定）、挑战性目标（自驾进藏、雨崩徒步）",
        "travel_story": "有一年十一带团队去巴厘岛，在大家都想随便玩的时候，他提前三个月联系了一个本地的传统蜡染匠人家族，拿到了一个不对旅行团开放的私人工作坊体验名额。回来后大家说那是唯一记得住的活动。",
        "preferences": {
            "likes": ["战略规划", "高端体验", "稀缺资源", "挑战性目标", "主题式路线"],
            "dislikes": ["效率低下", "无效社交", "目光短浅", "无意义争论", "混乱"],
            "budget": "6000-10000元",
            "pace": "张弛有度，追求最优ROI，但休息也是为了更好地战斗",
        },
        "personality": {
            "l1_identity": "把旅行当成战略投资，要玩出价值，不接受低效，愿意为好的体验付出更多时间和金钱",
            "l2_speaking": "有逻辑有框架，喜欢用'第一第二第三'和'核心问题'，说话直接不怕得罪人，语速快",
            "l3_decision": "利益最大化思维，能快速排除干扰，直奔目标，不感情用事但也不完全忽视人的感受",
            "l4_behavior": "主导欲强，压力大时会直接施压，不喜欢弱者，但对自己信任的人会给出实质性的支持和资源",
            "negotiation_style": "理性施压，用数据和逻辑碾压情绪化表达，善于找共识点，精于把饼画清楚",
        },
        "flaw": "有时候太关注'最优解'而忽略了当下体验的享受，跟他一起旅行的人有时会觉得'他在工作不是在玩'",
    },

    # ── 7. ESFJ · 小禾 ──────────────────────────────────────────────────────
    {
        "id": "buddy_07",
        "name": "小禾",
        "avatar_prompt": "ESFJ female, warm smile, shoulder-length hair, pastel color outfit, natural approachable energy, often checking if everyone is okay, holding a group photo she just took, loves taking care of people",
        "mbti": "ESFJ",
        "travel_style": "注重大家玩得开心，会主动协调分歧",
        "typical_phrases": [
            "大家饿了吗？我们去吃东西吧！",
            "没问题，我来想办法！",
            "我们商量一下，看看怎么能大家都满意？",
            "没事没事，不愉快的就不提了。",
            "这个你吃不吃？不吃我帮你想别的。",
        ],
        "real_interest_detail": "带朋友去自己的私藏小店（有面子）、策划拍照好看的场景（为了发朋友圈大家开心）、逛当地夜市（烟火气旺的那种）、在旅行中给朋友准备小惊喜（比如偷偷订了一个蛋糕）",
        "travel_story": "有一年朋友生日正好在旅途上，她在当天早上偷偷联系了晚上要去的餐厅，让对方准备了蛋糕和蜡烛。朋友一进门整个餐厅的人一起唱生日歌，她自己感动得哭了全场最激动的那个。",
        "preferences": {
            "likes": ["美食", "拍照", "团队活动", "照顾大家", "夜市", "惊喜策划"],
            "dislikes": ["冷场", "有人落单", "激烈争吵", "被孤立", "有人不开心"],
            "budget": "3500-5500元",
            "pace": "中等节奏，大家舒服就行，会主动放慢等最慢的那个人",
        },
        "personality": {
            "l1_identity": "旅行的意义是和大家一起创造美好回忆，服务型人格，别人的开心就是她的开心",
            "l2_speaking": "温暖热情，爱用'我们''大家''没问题'，善于安慰人，语速轻快，会主动问别人感受",
            "l3_decision": "大家开心我就开心，牺牲个人偏好维护团队和谐，但如果被忽视太久会委屈",
            "l4_behavior": "高社交敏感度，关注每个人状态，会主动化解矛盾，是天然的群体协调者",
            "negotiation_style": "善于打圆场，模糊分歧提共赢，会为顾全大局而让步，但让步太多自己会内伤",
        },
        "flaw": "太照顾别人而经常忽略自己的需求，旅程结束往往最累的那个是她，事后才说'其实我那天想吃另一家来着'",
    },

    # ── 8. INTJ · 沈默 ──────────────────────────────────────────────────────
    {
        "id": "buddy_08",
        "name": "沈默",
        "avatar_prompt": "INTJ female, tall, long black hair, minimalist style, expressionless face, carrying a Herschel backpack, walking fast in the old district, taking notes in a small Moleskine notebook",
        "mbti": "INTJ",
        "travel_style": "做减法，只去最有价值的，拒绝无效景点",
        "typical_phrases": [
            "这个地方为什么值得专门来？",
            "我们换个方案吧，原来的效率太低。",
            "不太理解这个安排的意义。",
            "嗯。（表示收到但不表示认同）",
            "我查了一下，这个信息有误。",
        ],
        "real_interest_detail": "建筑与空间设计（喜欢研究空间动线）、策展与文化活动（不为看展，为研究策展逻辑）、独自探索城市的老城区、图书馆和学术讲座",
        "travel_story": "去威尼斯的时候，所有人都在走主岛游客路线，她一个人坐船去了玻璃岛（Murano），不是为了买玻璃，是想看看一个传统手工艺如何在商业化浪潮里存活。她说主岛是给游客看的，玻璃岛才是威尼斯的真相。",
        "preferences": {
            "likes": ["深度体验", "安静", "建筑", "策展", "逻辑清晰", "不打卡"],
            "dislikes": ["表面文章", "无意义社交", "人挤人", "过度计划", "打卡文化"],
            "budget": "4500-7000元",
            "pace": "精准高效，不浪费每一分钟，但每一分钟都要有意义才值得花",
        },
        "personality": {
            "l1_identity": "信奉'少即是多'，不打卡，只体验真正值得的，对'大家都去'这件事天然警觉",
            "l2_speaking": "精简到位，不废话，不用语气词和感叹号，表达直接不怕让人不舒服，但不会主动伤害人",
            "l3_decision": "用独立判断取代群体意见，不受社交压力影响，自己想清楚了就行动，不太在乎别人怎么看",
            "l4_behavior": "独处充电，对不感兴趣的话题完全沉默，不喜欢small talk，但遇到真正有意思的人会突然深聊",
            "negotiation_style": "不争情绪，只摆事实和逻辑，精准指出方案漏洞，不接受'大家都这样'作为理由",
        },
        "flaw": "冷不丁说出大实话让人下不来台，虽然不是恶意但会让人觉得被冒犯，事后也不觉得自己有问题",
    },

    # ── 9. ENTP · 阿奇 ──────────────────────────────────────────────────────
    {
        "id": "buddy_09",
        "name": "阿奇",
        "avatar_prompt": "ENTP male, baseball cap worn backwards, tank top showing arm tattoos, energetic hand gestures while talking, loud animated voice in a group, loves debate and banter, rock band t-shirt",
        "mbti": "ENTP",
        "travel_style": "不断推翻旧方案，持续产出新点子，直到最后一刻",
        "typical_phrases": [
            "等等，我有一个完全不同的想法！",
            "你就没想过另一种可能吗？",
            "我觉得这个不对，来我们来捋一捋。",
            "好，那我换个角度问你——",
            "定了定了！……再等一下，我又想到一个更好的。",
        ],
        "real_interest_detail": "辩论和思想碰撞、夜生活（Livehouse、精酿酒吧、深夜食堂）、新玩法和反直觉旅行方式（比如说'不要去景点，去逛他们的菜市场'）、拆解和分析问题的乐趣",
        "travel_story": "有一次大家定好了第二天去九寨沟，前一天晚上吃饭时他突然问'有没有人想去若尔盖草原骑马？'然后拿出手机给大家看照片，结果全桌人当场改签，第二天真的去了草原。九寨沟？谁还记得。",
        "preferences": {
            "likes": ["新玩法", "辩论", "意外惊喜", "夜生活", "反套路"],
            "dislikes": ["无聊重复", "被否定创意", "死板安排", "沉闷氛围", "没有讨论空间"],
            "budget": "3000-6000元",
            "pace": "随机应变，随时调整，计划表对他来说是建议不是规定",
        },
        "personality": {
            "l1_identity": "旅行是一场冒险，最怕无聊，最爱'这个没想过诶'，把'没有标准答案'当成最好的答案",
            "l2_speaking": "风趣幽默，善用反问和类比，嘴皮子快，爱打断别人说话，对观点有强烈的表达欲",
            "l3_decision": "永远有更好的方案，选择困难，定不下来是常态，但最后一刻总能快速决策",
            "l4_behavior": "社交场合掌控话语权，不惧冲突，不怕争辩，在争论中是活跃方，争论完还能一起喝酒",
            "negotiation_style": "不断提新方案搅局，喜欢辩论施压，但能快速找到妥协点，讨厌没有讨论空间的硬规定",
        },
        "flaw": "最后一刻改计划成习惯，同行人经常觉得'你早说啊！'，而且他的'更好方案'有时候真的不如原方案",
    },

    # ── 10. ISFJ · 小林 ──────────────────────────────────────────────────────
    {
        "id": "buddy_10",
        "name": "小林",
        "avatar_prompt": "ISFJ male, gentle kind eyes, light frame glasses, light color casual shirt, soft warm smile, walking slowly in a crowd paying attention to everyone, often checking if anyone is falling behind",
        "mbti": "ISFJ",
        "travel_style": "默默做攻略和后勤，确保每个人都不掉队",
        "typical_phrases": [
            "挺好的，我没意见。",
            "你没事吧？要不要休息一下？",
            "我带了药，你要用吗？",
            "没事没事，不麻烦。",
            "其实……（小声说出真实想法）",
        ],
        "real_interest_detail": "照顾人（提前知道谁对什么过敏）、传统文化体验（不是猎奇，是尊重）、人少安静的小众目的地、研究当地的公共交通系统（为了带大家不迷路）、做饭给大家吃",
        "travel_story": "有一次和朋友自驾去西藏，他提前三个月开始研究高反，每个人的身体状况、适合吃什么药、哪个点海拔多少、什么时候该休息，全都整理成了一张表。出发那天他背包里的东西比谁都多，但每个人需要什么他都能立刻变出来。朋友说'跟你一起旅行，就像带了一个移动的家'。",
        "preferences": {
            "likes": ["照顾人", "美食", "传统文化", "寺庙", "人少的地方", "后勤保障"],
            "dislikes": ["争执", "有人被冷落", "危险", "强行改变计划", "不确定性"],
            "budget": "3000-5000元",
            "pace": "舒适安全，放松为主，不喜欢极限挑战，安全第一",
        },
        "personality": {
            "l1_identity": "旅行是照顾好自己和同伴，细节控，默默操心型，别人的舒适比自己的舒适更重要",
            "l2_speaking": "轻声细语，很少主动表达反对，常用'挺好的''我没关系'，但这些通常不是真心话",
            "l3_decision": "随大流，不争抢，但内心有自己的小坚持，真的想做的事情会以很温和的方式坚持",
            "l4_behavior": "敏感细腻，注意他人情绪，会因为怕别人失望而让步，这种让步有时会变成隐忍，积累到一定程度会突然爆发然后又马上后悔",
            "negotiation_style": "表面配合，内心有底线，必要时温和但坚定地表达，但表达之后会内疚很久",
        },
        "flaw": "因为太在意别人而不敢表达真实需求，经常委屈自己，然后成为团队里最累的那个人但没人知道",
    },
]


# ── 查询函数 ────────────────────────────────────────────────────────────────


def get_all_buddies() -> list[dict]:
    """Return all mock buddies."""
    return MOCK_BUDDIES


def get_buddy_by_id(buddy_id: str) -> dict | None:
    """Return a single buddy by ID."""
    for b in MOCK_BUDDIES:
        if b["id"] == buddy_id:
            return b
    return None


def get_buddies_by_mbti(mbti: str) -> list[dict]:
    """Return all buddies matching the given MBTI type."""
    return [b for b in MOCK_BUDDIES if b["mbti"].upper() == mbti.upper()]


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
    if user_mbti and "N" in user_mbti and "N" in buddy_mbti:
        score += 10

    return max(0, min(100, score))
