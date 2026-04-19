# -*- coding: utf-8 -*-
"""
真实调用 MiniMax API 生成 20 条 mock 协商数据。
使用双 Key 轮换，每次调用串行生成。
"""
import os
import sys
import json
import time
import random

# 先设置 key（必须在 import llm_client 之前）
os.environ['MINIMAX_API_KEY'] = 'MINIMAX_API_KEY_REDACTED'
os.environ['MINIMAX_API_KEY_1'] = 'MINIMAX_API_KEY_REDACTED'

import negotiation.llm_client as lc
import importlib
importlib.reload(lc)

from negotiation.graph import _build_persona_block, _get_negotiation_style, _score_rule
from negotiation.nodes import TOPICS, TOPIC_LABELS, PROPOSALS, _trait

llm = lc.llm_client

# ── 20 个场景配置 ──────────────────────────────────────────────────────────
SCENARIOS = [
    {"destination": "大理", "user_mbti": "ENFP", "buddy_mbti": "ISFP"},
    {"destination": "成都", "user_mbti": "ENTJ", "buddy_mbti": "INFP"},
    {"destination": "厦门", "user_mbti": "ESFP", "buddy_mbti": "ISTJ"},
    {"destination": "重庆", "user_mbti": "ENTP", "buddy_mbti": "ISFJ"},
    {"destination": "丽江", "user_mbti": "ISFP", "buddy_mbti": "ENFJ"},
    {"destination": "西安", "user_mbti": "ISTP", "buddy_mbti": "ENFP"},
    {"destination": "青岛", "user_mbti": "ESTP", "buddy_mbti": "INFJ"},
    {"destination": "哈尔滨", "user_mbti": "ESFP", "buddy_mbti": "INTJ"},
    {"destination": "桂林", "user_mbti": "ENFP", "buddy_mbti": "INFP"},
    {"destination": "大理", "user_mbti": "ENFP", "buddy_mbti": "INTJ"},
    {"destination": "成都", "user_mbti": "ENFP", "buddy_mbti": "ISTP"},
    {"destination": "厦门", "user_mbti": "INTJ", "buddy_mbti": "ENFP"},
    {"destination": "青岛", "user_mbti": "ENFP", "buddy_mbti": "ISTJ"},
    {"destination": "西安", "user_mbti": "ENTJ", "buddy_mbti": "ISFP"},
    {"destination": "大理", "user_mbti": "ISTJ", "buddy_mbti": "ENFP"},
    {"destination": "成都", "user_mbti": "INFP", "buddy_mbti": "ESFP"},
    {"destination": "厦门", "user_mbti": "ESFJ", "buddy_mbti": "INTP"},
    {"destination": "重庆", "user_mbti": "ISTJ", "buddy_mbti": "ENFJ"},
    {"destination": "丽江", "user_mbti": "INFP", "buddy_mbti": "ESTJ"},
    {"destination": "西安", "user_mbti": "ENTP", "buddy_mbti": "ISFP"},
]

# ── MBTI → 简要人格描述 ───────────────────────────────────────────────────
MBTI_PROFILES = {
    "ENFP": {
        "tone": "热情活泼，话多爱表达",
        "phrases": ["太棒了", "冲冲冲", "绝绝子", "超期待的"],
        "style": "E人风格，爱用感叹号和emoji，口语化"
    },
    "ISFP": {
        "tone": "温和细腻，话少但有主见",
        "phrases": ["好的", "嗯嗯", "可以呀", "其实我想"],
        "style": "I人风格，文字简洁，不爱用感叹号"
    },
    "ISTJ": {
        "tone": "严谨务实，计划性强",
        "phrases": ["按计划来", "安全第一", "我查过了"],
        "style": "J人风格，条理清晰，不喜欢意外"
    },
    "INFP": {
        "tone": "浪漫理想主义，注重感受",
        "phrases": ["我觉得", "其实", "我们一起"],
        "style": "F人风格，共情能力强，语气柔和"
    },
    "ENTJ": {
        "tone": "果断高效，目标导向",
        "phrases": ["我决定", "效率最高", "照着走"],
        "style": "J人风格，强势直接，喜欢掌控节奏"
    },
    "INTJ": {
        "tone": "理性独立，喜欢提前规划",
        "phrases": ["我分析过", "理论上", "有个方案"],
        "style": "J人风格，逻辑清晰，不轻易妥协"
    },
    "ESFP": {
        "tone": "活泼开朗，享受当下",
        "phrases": ["冲冲冲", "太美了", "必须要"],
        "style": "E人风格，爱拍照打卡，行动力强"
    },
    "ISFJ": {
        "tone": "体贴细心，照顾对方感受",
        "phrases": ["都可以", "听你的", "我来安排"],
        "style": "I人风格，配合度高，但有底线"
    },
    "ENFJ": {
        "tone": "热情包容，善于协调",
        "phrases": ["没问题", "一起", "我们都"],
        "style": "E人风格，照顾所有人情绪，容易妥协"
    },
    "INFJ": {
        "tone": "温柔有深度，关注内心感受",
        "phrases": ["我理解", "其实不必", "慢慢来"],
        "style": "I人风格，尊重边界，不爱冲突"
    },
    "ESTP": {
        "tone": "务实灵活，喜欢即兴",
        "phrases": ["干了再说", "走一步看一步", "管他的"],
        "style": "S人风格，关注眼前，不爱空谈"
    },
    "ISTP": {
        "tone": "冷静理性，喜欢动手做事",
        "phrases": ["让我想想", "其实不然", "我来试试"],
        "style": "I人风格，话不多但精准，不爱社交"
    },
    "ESFJ": {
        "tone": "热情周到，喜欢照顾人",
        "phrases": ["交给我", "我来安排", "大家一起"],
        "style": "E人风格，服务型人格，配合度高"
    },
    "INTP": {
        "tone": "理性好奇，喜欢深度思考",
        "phrases": ["理论上", "我觉得", "有个疑问"],
        "style": "I人风格，爱分析，话少但有洞见"
    },
    "ENTP": {
        "tone": "机智灵活，爱挑战和辩论",
        "phrases": ["等等", "其实不然", "我有个新想法"],
        "style": "E人风格，爱抬杠但不失幽默"
    },
    "ESTJ": {
        "tone": "务实高效，喜欢制定规则",
        "phrases": ["按流程来", "效率最高", "我来负责"],
        "style": "J人风格，执行力强，不喜欢拖沓"
    },
}


def get_user_desc(mbti: str) -> str:
    p = MBTI_PROFILES.get(mbti, MBTI_PROFILES["ENFP"])
    return f"MBTI={mbti}，说话语气{p['tone']}，口头禅有{'、'.join(p['phrases'][:2])}，风格是{p['style']}"


def get_buddy_desc(mbti: str) -> str:
    return get_user_desc(mbti)


def get_topic_preference(mbti: str, topic: str) -> str:
    """根据 MBTI 给出某话题的偏好描述"""
    # 简化：直接返回规则算法算出的偏好
    from negotiation.nodes import _trait
    # 构造临时 persona
    temp = {"mbti_type": mbti}
    trait = _trait(temp, topic)
    return PROPOSALS.get(topic, {}).get(trait, "有自己独特的偏好")


def generate_single_scenario(dest: str, user_mbti: str, buddy_mbti: str) -> dict:
    """为一个场景调用 LLM，生成完整的协商数据"""

    user_profile = get_user_desc(user_mbti)
    buddy_profile = get_buddy_desc(buddy_mbti)

    topics_text = "\n".join([
        f"  - {TOPIC_LABELS.get(t, t)}：user={get_topic_preference(user_mbti, t)}，buddy={get_topic_preference(buddy_mbti, t)}"
        for t in TOPICS
    ])

    prompt = f"""两个旅行搭子（user 和 buddy）正在线上协商一起去{dest}旅行的计划。

【user 人格】{user_profile}
【buddy 人格】{buddy_profile}

【他们在讨论三个话题】（双方偏好如下）
{topics_text}

请模拟两个人真实聊天，生成完整的协商对话。要求：
1. 对话要真实自然，像两个真人在微信上聊天
2. 每个人的说话风格要符合其MBTI性格
3. 口语化，有口头禅，有情绪，有小争论，有妥协
4. 整体 5-10 条消息即可，不要太长

然后请用 JSON 返回结果：
{{
  "rounds": [
    {{
      "topic": "travel_rhythm",
      "topic_label": "旅行节奏",
      "proposer_message": "user说的第一句话，10-30字，口语化，符合user性格",
      "evaluator_message": "buddy的回应，10-30字，口语化，符合buddy性格",
      "evaluator_score": 0.0-1.0的数字，双方偏好越接近越高",
      "consensus_reached": true或false
    }},
    {{"topic": "food", "topic_label": "美食偏好", ...}},
    {{"topic": "budget", "topic_label": "预算范围", ...}}
  ],
  "overall_score": 0.0-1.0,
  "strengths": ["匹配好的话题1", "匹配好的话题2"],
  "challenges": ["有分歧的话题1"]
}}

请直接返回 JSON，不要有其他文字。
"""

    # 带重试的调用
    for attempt in range(3):
        try:
            result = llm.chat(prompt, system_prompt="你是一个旅行搭子协商AI，直接返回JSON，不要有其他文字。")
            if result and result.strip():
                data = json.loads(result.strip())
                return data
        except json.JSONDecodeError as e:
            print(f"  [Attempt {attempt+1}] JSON 解析失败: {e}, 重试...")
            time.sleep(1)
        except Exception as e:
            print(f"  [Attempt {attempt+1}] 调用失败: {e}, 重试...")
            time.sleep(2)

    print(f"  [FAIL] 3次重试均失败，使用规则兜底")
    return None


def rules_fallback(dest: str, user_mbti: str, buddy_mbti: str) -> dict:
    """规则兜底：3个话题各返回一条模拟对话"""
    from negotiation.nodes import _trait
    rounds = []
    total = 0
    for topic in TOPICS:
        ut = _trait({"mbti_type": user_mbti}, topic)
        bt = _trait({"mbti_type": buddy_mbti}, topic)
        score = round(_score_rule({"mbti_type": user_mbti}, {"mbti_type": buddy_mbti}, topic), 3)
        total += score
        rounds.append({
            "topic": topic,
            "topic_label": TOPIC_LABELS.get(topic, topic),
            "proposer_message": f"（规则兜底）我对{TOPIC_LABELS.get(topic)}的看法是{ut}",
            "evaluator_message": f"（规则兜底）我的偏好是{bt}",
            "evaluator_score": score,
            "consensus_reached": score >= 0.6
        })
    avg = round(total / 3, 3)
    return {
        "destination": dest,
        "user_mbti": user_mbti,
        "buddy_mbti": buddy_mbti,
        "overall_score": avg,
        "strengths": [TOPIC_LABELS[t] for t in TOPICS if _score_rule({"mbti_type": user_mbti}, {"mbti_type": buddy_mbti}, t) >= 0.7],
        "challenges": [TOPIC_LABELS[t] for t in TOPICS if _score_rule({"mbti_type": user_mbti}, {"mbti_type": buddy_mbti}, t) < 0.6],
        "rounds": rounds
    }


# ── 主流程 ─────────────────────────────────────────────────────────────────

BASE = r'E:\desktop\hecker\mock_personas'
os.makedirs(BASE, exist_ok=True)

# 清理旧文件
import glob
for old in glob.glob(os.path.join(BASE, '*', '*.json')):
    os.remove(old)

results = []
total_time = 0

for i, s in enumerate(SCENARIOS):
    dest = s["destination"]
    user = s["user_mbti"]
    buddy = s["buddy_mbti"]
    pair_key = f"{user.lower()}_{buddy.lower()}"
    dir_path = os.path.join(BASE, user.lower())
    os.makedirs(dir_path, exist_ok=True)

    city_pinyin = dest[:2]
    file_path = os.path.join(dir_path, f"compatibility_{pair_key}_{city_pinyin}.json")

    print(f"\n[{i+1}/20] {dest} | {user}+{buddy}")

    start = time.time()
    raw = generate_single_scenario(dest, user, buddy)
    elapsed = (time.time() - start) * 1000
    total_time += elapsed

    if raw is None or "rounds" not in raw:
        print(f"  -> 使用规则兜底")
        record = rules_fallback(dest, user, buddy)
    else:
        record = {
            "destination": dest,
            "user_mbti": user,
            "buddy_mbti": buddy,
            "overall_score": raw.get("overall_score", 0.7),
            "strengths": raw.get("strengths", []),
            "challenges": raw.get("challenges", []),
            "rounds": raw.get("rounds", []),
        }
        # 补充缺失字段
        for r in record["rounds"]:
            if "evaluator_score" not in r:
                r["evaluator_score"] = 0.6
            if "consensus_reached" not in r:
                r["consensus_reached"] = r["evaluator_score"] >= 0.6

    # 写文件
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(record, f, ensure_ascii=False, indent=2)

    # 展示结果
    score = record["overall_score"]
    msgs = [r["proposer_message"][:25] for r in record["rounds"]]
    sys.stdout.buffer.write((f"  elapsed={elapsed:.0f}ms score={score:.2f}\n").encode('utf-8'))
    for m in msgs:
        sys.stdout.buffer.write((f"    - {m}...\n").encode('utf-8'))

    results.append(record)

    # 每次调用后稍等，避免触发限流
    time.sleep(0.5)

print(f"\n=== 完成 ===")
print(f"总耗时: {total_time/1000:.1f}s")
print(f"平均每次: {total_time/20/1000:.1f}s")
print(f"文件数: {len(results)}")

# 统计
files = glob.glob(os.path.join(BASE, '*', '*.json'))
print(f"实际文件: {len(files)}")
dest_stats = {}
for r in results:
    dest_stats[r["destination"]] = dest_stats.get(r["destination"], 0) + 1
for d, c in sorted(dest_stats.items()):
    print(f"  {d}: {c}条")
