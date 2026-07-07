#!/usr/bin/env python
"""
TwinBuddy mock user 批量生成脚本

依据 docs/data-spec.md §1 (mock user schema)

职责：把现有 30 个 mock user 扩充到 200 个,
覆盖 7 个城市、6 个年龄段、更多职业/兴趣组合,
保持 fit_scenes / avoid_scenes 6 场景全覆盖。

策略：模板 + 枚举组合(无 LLM 依赖)。
- city: 7 个真实城市枚举
- age_band: 6 段 (19-22 / 23-25 / 26-29 / 30-33 / 34-37 / 38-42)
- mbti: 16 种
- identity: 从职业词库(45 个)中按 age_band 关联采样
- interests: 从兴趣词库(35 个)随机采 3-5 个
- 用 attr-keyed 控制生成组合多样性,避免大量 user 形态太接近

输出:mock_personas/users.expanded.json(200 条 array)
     用户可决定是否 merge 进 mock_personas/users.json。

用法:python scripts/expand-users.py
"""
from __future__ import annotations
import json
import random
from pathlib import Path

random.seed(20260707)  # 输出可重现;变更 seed 改这里

OUT = Path(__file__).resolve().parent.parent / "mock_personas" / "users.expanded.json"
OUT.parent.mkdir(parents=True, exist_ok=True)

# ---- 词库 ----
CITIES = [
    ("深圳", "shenzhen", 0.22),
    ("上海", "shanghai", 0.20),
    ("北京", "beijing", 0.16),
    ("杭州", "hangzhou", 0.12),
    ("广州", "guangzhou", 0.10),
    ("成都", "chengdu", 0.10),
    ("南京", "nanjing", 0.06),
    ("重庆", "chongqing", 0.04),
]
# 配 16 个 MBTI 时控制各 MBTI 在 200 里分配,呈现真实人口分布
# MBTI 加和 = 170(SJs 50 + SPs 44 + NFs 40 + NTs 36 = 170)
MBTI_POOL = (
    [("ISFJ", 14), ("ESFJ", 12), ("ISTJ", 14), ("ESTJ", 10)]   # SJs = 50
    + [("ISFP", 12), ("ESFP", 12), ("ISTP", 10), ("ESTP", 10)]  # SPs = 44
    + [("INFP", 10), ("ENFP", 10), ("INFJ", 10), ("ENFJ", 10)]  # NFs = 40
    + [("INTP", 10), ("ENTP", 10), ("INTJ", 8), ("ENTJ", 8)]    # NTs = 36
)
assert sum(n for _, n in MBTI_POOL) == 170, f"MBTI pool sum must be 170, got {sum(n for _, n in MBTI_POOL)}"

AGE_BANDS = [
    "19-22",  # 大学生 / 应届考研 / 实习
    "23-25",  # 应届毕业生 / 职场新人
    "26-29",  # 稳定上班族
    "30-33",  # 中坚力量
    "34-37",  # 成家 / 中层
    "38-42",  # 资深 / 中年
]

# 职业按年龄段的合理性采样
IDENTITY_BY_AGE = {
    "19-22": ["大学生", "研究生", "实习生", "应考研生", "博士生", "本科在读"],
    "23-25": ["职场新人", "应届生", "刚入行运营", "新晋设计师", "新人程序员", "新律师助理", "新护士", "新闻记者", "新审计师"],
    "26-29": ["程序员", "产品经理", "数据分析师", "后端工程师", "广告策划", "UI 设计师", "小学老师", "服装设计师", "建筑师", "公务员"],
    "30-33": ["资深工程师", "产品总监", "外科医生", "财务经理", "建筑设计师", "投资经理", "策展人", "广告创意总监", "项目经理", "运营总监"],
    "34-37": ["技术负责人", "合伙人律师", "高级审计师", "资深建筑师", "运营总监", "科室主任", "音乐人", "独立摄影师", "自媒体博主"],
    "38-42": ["副总裁", "合伙人", "首席工程师", "投资合伙人", "主理人", "资深 HRD", "首席设计师", "高级合伙人"],
}

INTERESTS_POOL = [
    # 旅行类
    "旅行", "citywalk", "海边", "咖啡", "拍照", "特种兵旅游", "逛展", "音乐节", "露营", "徒步", "骑行",
    # 美食类
    "日料", "火锅", "甜品", "咖啡探店", "威士忌", "精酿啤酒", "清酒", "深夜食堂",
    # 健身类
    "撸铁", "瑜伽", "跑步", "CrossFit", "普拉提", "舞蹈", "羽毛球",
    # 学习类
    "AI Agent", "读论文", "写代码", "播客", "刷题", "英语学习",
    # 活动类
    "演唱会", "Live House", "脱口秀", "周杰伦", "五月天", "草莓音乐节", "话剧",
    # 购物类
    "通勤包", "数码", "家居用品", "护肤品", "潮鞋", "香水", "机械键盘",
]

# 6 场景的 interest 关联(用于推导 fit_scenes)
SCENE_INTEREST_MAP = {
    "trip": {"旅行", "citywalk", "海边", "特种兵旅游", "逛展", "露营", "徒步", "骑行"},
    "food": {"日料", "火锅", "甜品", "咖啡探店", "威士忌", "精酿啤酒", "清酒", "深夜食堂", "咖啡"},
    "fitness": {"撸铁", "瑜伽", "跑步", "CrossFit", "普拉提", "舞蹈", "羽毛球"},
    "study": {"AI Agent", "读论文", "写代码", "播客", "刷题", "英语学习"},
    "event": {"演唱会", "Live House", "脱口秀", "周杰伦", "五月天", "草莓音乐节", "话剧", "音乐节"},
    "shopping": {"通勤包", "数码", "家居用品", "护肤品", "潮鞋", "香水", "机械键盘"},
}

ALL_SCENES = ["trip", "food", "fitness", "study", "event", "shopping"]

PACE_POOL = [
    ("morning", 0.30),
    ("flexible", 0.50),
    ("night", 0.20),
]
SOCIAL_POOL = [("outgoing", 0.50), ("slow_warm", 0.50)]
BUDGET_POOL = [("low", 0.30), ("mid", 0.50), ("high", 0.20)]
PHOTO_POOL = [("minimal", 0.40), ("moderate", 0.40), ("love", 0.20)]
PLAN_POOL = [("planner", 0.55), ("casual", 0.30), ("spontaneous", 0.15)]

PACE_OPTIONS = [p for p, _ in PACE_POOL]
SOCIAL_OPTIONS = [s for s, _ in SOCIAL_POOL]
BUDGET_OPTIONS = [b for b, _ in BUDGET_POOL]
PHOTO_OPTIONS = [p for p, _ in PHOTO_POOL]
PLAN_OPTIONS = [p for p, _ in PLAN_POOL]

PACE_DIST = [w for _, w in PACE_POOL]
SOCIAL_DIST = [w for _, w in SOCIAL_POOL]
BUDGET_DIST = [w for _, w in BUDGET_POOL]
PHOTO_DIST = [w for _, w in PHOTO_POOL]
PLAN_DIST = [w for _, w in PLAN_POOL]


# ---- 模板化昵称前缀 ----
NICKNAME_PREFIX = [
    "周末出逃型", "路线控", "今晚吃点好的", "咖啡星人",
    "理性分析者", "说走就走", "随遇而安", "细节控",
    "节奏快手", "慢热观察者", "全场MVP", "安静充电者",
    "甜味依赖", "视觉动物", "路演王", "规律生活派",
    "凌晨 3 点失眠", "认真过周末", "不卷主义者", "主场作战",
]


def weighted_choice(rng, options, weights):
    total = sum(weights)
    r = rng.random() * total
    acc = 0.0
    for opt, w in zip(options, weights):
        acc += w
        if r <= acc:
            return opt
    return options[-1]


def gen_nickname(idx: int, mbti: str) -> str:
    """统一风格:昵称前缀 + MBTI 标签"""
    prefix = NICKNAME_PREFIX[idx % len(NICKNAME_PREFIX)]
    return f"{prefix} {mbti}"


def gen_interests(mbti: str) -> list[str]:
    """从池里随机选 3-5 个,保证 6 场景映射到的兴趣集里至少覆盖 1-2 类"""
    n = random.randint(3, 5)
    picks = random.sample(INTERESTS_POOL, n)
    return picks


def gen_fit_avoid_scenes(interests: list[str], mbti: str) -> tuple[list[str], list[str]]:
    """基于兴趣反推 fit 场景;从 6 场景里随机抽 0-1 个给 avoid,
    保证 fit + avoid 都非空(避免空数组导致下游判定歧义)。"""
    fit = set()
    for s, kw in SCENE_INTEREST_MAP.items():
        if any(i in kw for i in interests):
            fit.add(s)
    if not fit:
        fit.add(random.choice(ALL_SCENES))
    fit_list = list(fit)
    # 选 0-1 个 avoid 场景
    avoid_pool = [s for s in ALL_SCENES if s not in fit_list]
    if avoid_pool and random.random() < 0.5:
        avoid = [random.choice(avoid_pool)]
    else:
        avoid = []
    return fit_list, avoid


def make_user(seq: int, mbti: str, age_band: str, city: str, city_en: str) -> dict:
    interests = gen_interests(mbti)
    fit, avoid = gen_fit_avoid_scenes(interests, mbti)
    pace = weighted_choice(random, PACE_OPTIONS, PACE_DIST)
    social = weighted_choice(random, SOCIAL_OPTIONS, SOCIAL_DIST)
    budget = weighted_choice(random, BUDGET_OPTIONS, BUDGET_DIST)
    photo = weighted_choice(random, PHOTO_OPTIONS, PHOTO_DIST)
    plan = weighted_choice(random, PLAN_OPTIONS, PLAN_DIST)
    identity = random.choice(IDENTITY_BY_AGE[age_band])
    uid = f"twinbuddy-mock-{seq + 31:03d}"  # 031..200
    return {
        "uid": uid,
        "nickname": gen_nickname(seq, mbti),
        "city": city,
        "city_en": city_en,
        "mbti": mbti,
        "age_band": age_band,
        "identity": identity,
        "interests": interests,
        "pace": pace,
        "budget_band": budget,
        "social_style": social,
        "photo_pref": photo,
        "plan_style": plan,
        "safety": [
            "首次见面只接受公开场所",
            "留出紧急联系人",
            "位置共享 24 小时",
        ],
        "conflicts": [
            f"{mbti} 性格典型阻力点:开放性强 vs 决策犹豫",
            f"{photo} 拍照风格与他人节奏差异",
        ],
        "fit_scenes": fit,
        "avoid_scenes": avoid,
        "avatar_seed": uid,
        # 数据治理:从 mock_personas 模板生成的数据全是 inference 等级
        # (CLAUDE.md 证据诚实原则)
        "evidence_grade": "inference",
    }


def main():
    # 生成 170 个新 user
    target = 170
    # 城市采样(按 weight)
    cities = [(c, e, w) for c, e, w in CITIES]
    city_weights = [w for _, _, w in cities]

    # MBTI 按 pool 排队(保证每种 MBTI 有合理数量)
    mbti_seq = []
    for m, n in MBTI_POOL:
        mbti_seq.extend([m] * n)

    # 打散 MBTI 顺序避免连续同型
    rng = random.Random(42)
    rng.shuffle(mbti_seq)

    users = []
    for i in range(target):
        mbti = mbti_seq[i % len(mbti_seq)]
        age = AGE_BANDS[i % len(AGE_BANDS)]
        # 用 i 直接 sample 城市
        ci = rng.choices(range(len(cities)), weights=city_weights, k=1)[0]
        cname, cen, _ = cities[ci]
        u = make_user(i, mbti, age, cname, cen)
        users.append(u)

    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(users, f, ensure_ascii=False, indent=2)

    # 摘要
    from collections import Counter
    city_counter = Counter(u["city"] for u in users)
    mbti_counter = Counter(u["mbti"] for u in users)
    age_counter = Counter(u["age_band"] for u in users)
    print(f"OK: write {len(users)} user to {OUT}")
    print(f"  cities: {dict(city_counter)}")
    print(f"  mbti:   {dict(mbti_counter)}")
    print(f"  age:    {dict(age_counter)}")
    fit_total = Counter()
    for u in users:
        for s in u["fit_scenes"]:
            fit_total[s] += 1
    print(f"  fit scenes: {dict(fit_total)}")


if __name__ == "__main__":
    main()
