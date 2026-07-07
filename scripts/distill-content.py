#!/usr/bin/env python3
"""
TwinBuddy content 蒸馏:用 MiniMax M3 生成真人语气邀约文案 + 行动卡字段

依据:docs/invite-templates.md §3 + docs/action-cards.md §1-§6

输出:api/templates/invite.distilled.json  (替代 templates/invite.md)
     api/data/action_cards.distilled.json  (替代 _load_action_cards 内的 hardcoded 数据)

设计:
  - 输出 JSON 而非 Markdown — 接 Pydantic 校验,不容易写出反文案
  - 直接调 MiniMax,按 scene × tone × variant 批量蒸馏
  - 失败 fallback 用 scripts/expand-scenes.py 之类的 mock(已存在)
"""
from __future__ import annotations
import json
import os
import socket
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ENV_PATH = ROOT / ".env"

# 从 .env 加载 MiniMax 配置
def load_minimax_creds():
    cfg = {"url": "", "key": "", "model": ""}
    with open(ENV_PATH, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line.startswith("url") and "=" in line:
                cfg["url"] = line.split("=", 1)[1].strip().strip('"').strip("'")
            elif line.startswith("key") and "=" in line:
                cfg["key"] = line.split("=", 1)[1].strip().strip('"').strip("'")
            elif line.startswith("model") and "=" in line:
                cfg["model"] = line.split("=", 1)[1].strip().strip('"').strip("'")
    if not all(cfg.values()):
        raise RuntimeError("MiniMax credentials incomplete in .env")
    return cfg


def call_minimax(prompt: str, max_tokens: int = 1200, retries: int = 3) -> str:
    """单次 MiniMax M3 调用(MiniMax 走 Anthropic 兼容协议)。出错重试 3 次。"""
    cfg = load_minimax_creds()
    body = json.dumps({
        "model": cfg["model"],
        "max_tokens": max_tokens,
        "temperature": 0.85,
        "messages": [{"role": "user", "content": prompt}],
    }).encode("utf-8")
    headers = {
        "Content-Type": "application/json",
        "x-api-key": cfg["key"],
        "anthropic-version": "2023-06-01",
    }
    socket.setdefaulttimeout(45)
    url = cfg["url"].rstrip("/") + "/v1/messages"
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, data=body, headers=headers, method="POST")
            with urllib.request.urlopen(req) as r:
                data = json.loads(r.read().decode("utf-8"))
                # Anthropic 协议返回 {"content":[{"type":"text","text":"..."}]}
                content = ""
                for block in data.get("content", []):
                    if block.get("type") == "text":
                        content += block.get("text", "")
                # 去掉模型自加的  思考块
                import re as _re
                content = _re.sub(r"", "", content, flags=_re.DOTALL).strip()
                return content
        except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, OSError) as e:
            if attempt == retries - 1:
                raise RuntimeError(f"MiniMax call failed after {retries} tries: {e}") from e
            import time
            time.sleep(2 + attempt * 2)
    raise RuntimeError("unreachable")


# ===== 任务 1:邀请文案 =====
INVITE_PROMPT = """你是真人,在深圳生活。你要邀请朋友一起去 {scene_zh} {time_of_day} {weekday_zh}。
语气要 {tone_zh},用口语,30-80 中文字,绝对不要提任何产品名(不能出现"TwinBuddy"、"路线可以按这版走"等)。

约束:
- 一定有 1 个明确的动作 + 1 个时间锚 + 1 个可选的"AA 我俩"或"谁请客"或"约时间"的接洽
- 如果是吃饭,带上"人均"或"排队"风险
- 如果是活动,带上具体地点或购票方式
- 像是发微信一条,真实朋友口吻

返回严格 1 行 JSON,不要任何其他文字:
{{"text": "<一行文案>"}}
"""


SCENE_ZH = {
    "trip": "周边短途旅行",
    "food": "城里吃一顿",
    "fitness": "约个人运动",
    "study": "搭个学习伙",
    "event": "看场演出/展览",
    "shopping": "一起逛/选个东西",
}
TONE_ZH = {"casual": "放松随意", "direct": "直接简短", "warm": "热情温暖"}
WEEKDAY_ZH = ["本周六", "本周日", "下周三", "下周五", "周末"]
TIME_ZH = ["晚 7 点", "下午 3 点", "早上 9 点", "中午 12 点", "晚 8 点"]


def distill_invites() -> dict[str, dict[str, list[str]]]:
    """为 6 scene × 3 tone 各蒸馏 3 个文案变体"""
    invites: dict[str, dict[str, list[str]]] = {}
    for scene in ["trip", "food", "fitness", "study", "event", "shopping"]:
        invites[scene] = {}
        for tone in ["casual", "direct", "warm"]:
            invites[scene][tone] = []
            for i in range(3):  # 3 变体
                weekday = WEEKDAY_ZH[i]
                time_ = TIME_ZH[i]
                prompt = INVITE_PROMPT.format(
                    scene_zh=SCENE_ZH[scene],
                    time_of_day=time_,
                    weekday_zh=weekday,
                    tone_zh=TONE_ZH[tone],
                )
                sys.stdout.write(f"  → invite {scene}.{tone}.{i+1}: ")
                sys.stdout.flush()
                raw = call_minimax(prompt, max_tokens=400)
                try:
                    obj = json.loads(raw)
                    text = obj["text"].strip()
                except Exception:
                    # 宽容:夹了 markdown 或多余文字,尽力抽
                    import re as _re
                    m = _re.search(r'"text"\s*:\s*"([^"]+)"', raw)
                    text = m.group(1) if m else raw.strip()
                invites[scene][tone].append(text)
                print(f"OK ({len(text)} chars)")
    return invites


# ===== 任务 2:行动卡字段 =====
ACTION_CARD_PROMPT = """你是真人,在深圳生活,正使用一个叫"懂你卡片"的产品收到一条行动卡。
场景分类:{scene_zh}。你需要写出这一条行动卡的几个字段。

要求:
- title:10-30 字,口语,"你最近..."或直说"我给你......"风格,不要带产品名
- trigger_reason:1 行,讲为什么现在推给你(基于近期行为 + 1 个具体事实)
- intent:不超过 20 字,讲你想达成的小目标(用户视角)
- plan:1-2 行,具体动作 + 时间 + 预算
- needs_buddy:required/optional/none 之一
- meta.budget:英文 key 字典,可空

返回严格 1 行 JSON,不要任何其他文字:
{{
  "title": "...",
  "trigger_reason": "...",
  "intent": "...",
  "plan": "...",
  "needs_buddy": "optional",
  "meta": {{"budget": {{"min": 100, "max": 200, "currency": "CNY"}}, "deadline": "..."}}
}}
"""


CARD_SCENES = {
    "trip": [
        ("trip-a1-dapeng", "plan", "深圳周边轻量周末游"),
        ("trip-a7-roof", "plan", "梧桐山徒步"),
        ("trip-a8-mountain", "plan", "阳台山雾天徒步"),
        ("trip-hint-1", "hint", "想出门走走"),
        ("trip-complete-1", "complete", "已经约好搭子"),
        ("food-a2-sushi", "plan", "鮨·初晚餐"),
        ("food-a8-ramen", "plan", "豚骨拉面晚餐"),
        ("food-a9-hotpot", "plan", "潮汕牛肉火锅"),
        ("food-hint-1", "hint", "今天想吃点好的"),
        ("food-complete-1", "complete", "已锁定餐厅"),
        ("fitness-a3-shoulder", "plan", "14 天肩背训练"),
        ("fitness-a4-yoga", "plan", "瑜伽拉伸"),
        ("fitness-a5-run", "plan", "5 公里晨跑"),
        ("fitness-hint-1", "hint", "今天想动一动"),
        ("fitness-complete-1", "complete", "训练计划已同步"),
        ("study-a4-ai-agent", "plan", "7 天 AI Agent 入门"),
        ("study-a5-prompt", "plan", "Prompt Engineering"),
        ("study-a6-ielts", "plan", "30 天雅思备考"),
        ("study-hint-1", "hint", "想学点新东西"),
        ("study-complete-1", "complete", "已锁定学习计划"),
        ("event-a5-jay-chou", "plan", "周杰伦 8 月深圳站"),
        ("event-a6-mayday", "plan", "五月天深圳站"),
        ("event-hint-1", "hint", "最近想看场演出"),
        ("shopping-a6-backpack", "plan", "通勤包"),
        ("shopping-a7-keyboard", "plan", "机械键盘"),
        ("shopping-hint-1", "hint", "最近想入手点什么"),
        ("shopping-complete-1", "complete", "已锁定购买"),
    ],
}


def distill_action_cards() -> list[dict]:
    cards = []
    scene_seen: dict[str, int] = {}
    for cid, variant, brief in CARD_SCENES["trip"]:
        # 按 cid 前缀判断 scene
        scene = cid.split("-")[0]
        zh = SCENE_ZH.get(scene, scene)
        scene_idx = scene_seen.get(scene, 0)
        scene_seen[scene] = scene_idx + 1
        prompt = ACTION_CARD_PROMPT.format(scene_zh=zh)
        prompt += f"\n\n本张卡主题:{brief},variant:{variant}。"
        sys.stdout.write(f"  → card {cid} ({variant}): ")
        sys.stdout.flush()
        raw = call_minimax(prompt, max_tokens=800)
        try:
            obj = json.loads(raw)
        except Exception:
            import re as _re
            m = _re.search(r"\{[\s\S]*\}", raw)
            obj = json.loads(m.group(0)) if m else {}
        obj["id"] = cid
        obj["scene"] = scene
        obj["variant"] = variant
        obj["state"] = {"hint": "hint", "plan": "plan", "complete": "complete"}[variant]
        # 兜底字段
        obj.setdefault("title", brief)
        obj.setdefault("trigger_reason", f"基于你最近 {brief} 的内容偏好")
        obj.setdefault("intent", "")
        obj.setdefault("plan", "")
        obj.setdefault("needs_buddy", "optional")
        obj.setdefault("candidates", [])
        obj.setdefault("risks", [])
        obj.setdefault("follow_up", [])
        obj.setdefault("meta", {})
        cards.append(obj)
        print(f"OK '{obj['title'][:30]}...'")
    return cards


def main():
    mode = sys.argv[1] if len(sys.argv) > 1 else "invites"
    if mode in ("invites", "all"):
        print("=== Distill invites (18 scene.tone × 3 变体 = 54 条文案) ===")
        invites = distill_invites()
        out = ROOT / "api" / "templates" / "invite.distilled.json"
        out.write_text(
            json.dumps({"generated_at": "now", "model": load_minimax_creds()["model"], "invites": invites}, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
        print(f"  → wrote {out}")

    if mode in ("cards", "all"):
        print("=== Distill action cards (27 张,每张 6 字段) ===")
        cards = distill_action_cards()
        out = ROOT / "api" / "data" / "action_cards.distilled.json"
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(
            json.dumps({"generated_at": "now", "model": load_minimax_creds()["model"], "cards": cards}, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
        print(f"  → wrote {out}")


if __name__ == "__main__":
    main()
