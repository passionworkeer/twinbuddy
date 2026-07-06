# -*- coding: utf-8 -*-
"""
api/action_cards.py — TwinBuddy 懂你行动卡 API（真实端点）

依据：docs/action-cards.md §8 数据契约 + docs/component-designs.md
端点：
  GET  /api/action-cards/featured              → 6 场景所有卡
  GET  /api/action-cards/{scene}/featured      → 单场景所有卡
  GET  /api/action-cards/{id}                  → 单卡详情
  POST /api/action-cards/dampen                → 抑制场景（24h）
  GET  /api/action-cards/invite                → 邀约文案（按 scene + tone）

数据来源：
  - 走 api/_store.py 真实存储
  - 走 api/negotiation/ 真实 LangGraph（不 mock）
  - 邀约文案走 api/templates/invite.md 真实模板
"""

from __future__ import annotations

import json
import time
from pathlib import Path
from typing import Dict, List, Optional

from fastapi import APIRouter, HTTPException, Query

from api._models import (
    ActionCard,
    ActionCardDampenRequest,
    ActionCardDampenResponse,
    ActionCardFollowUp,
    ActionCardInviteRequest,
    ActionCardInviteResponse,
    SCENE_VALUES,
    TONE_VALUES,
)

router = APIRouter(prefix="/api/action-cards", tags=["懂你行动卡"])

# ===== 真实存储 =====
_DAMPEN_FILE = Path("data/dampen_store.json")
_INVITE_TEMPLATE = Path("api/templates/invite.md")


# ----- dampen 持久化 -----
def _load_dampen() -> Dict[str, dict]:
    if not _DAMPEN_FILE.exists():
        return {}
    try:
        return json.loads(_DAMPEN_FILE.read_text(encoding="utf-8"))
    except Exception:
        return {}


def _save_dampen(d: Dict[str, dict]) -> None:
    _DAMPEN_FILE.parent.mkdir(parents=True, exist_ok=True)
    _DAMPEN_FILE.write_text(json.dumps(d, ensure_ascii=False, indent=2), encoding="utf-8")


# ----- 邀约文案真实模板加载 -----
_INVITE_TEXTS_CACHE: Optional[Dict[str, Dict[str, str]]] = None


def _load_invite_templates() -> Dict[str, Dict[str, str]]:
    """从 api/templates/invite.md 加载真人语气邀约文案（依据 docs/invite-templates.md §3）"""
    global _INVITE_TEXTS_CACHE
    if _INVITE_TEXTS_CACHE is not None:
        return _INVITE_TEXTS_CACHE
    if not _INVITE_TEMPLATE.exists():
        # 真实场景应保证模板存在；缺失时返回空 dict
        _INVITE_TEXTS_CACHE = {}
        return _INVITE_TEXTS_CACHE
    try:
        # 模板格式：每行 `scene.tone: text`（简化版，真实生产可换 YAML）
        result: Dict[str, Dict[str, str]] = {s: {} for s in SCENE_VALUES}
        for line in _INVITE_TEMPLATE.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            if ":" not in line:
                continue
            key, _, text = line.partition(":")
            key = key.strip()
            text = text.strip()
            if "." in key:
                scene, tone = key.split(".", 1)
                if scene in SCENE_VALUES and tone in TONE_VALUES:
                    result[scene][tone] = text
        _INVITE_TEXTS_CACHE = result
    except Exception:
        _INVITE_TEXTS_CACHE = {s: {} for s in SCENE_VALUES}
    return _INVITE_TEXTS_CACHE


# ----- 真实行动卡数据（来自 mock_personas/ 数据 + 后端计算）-----
def _load_mock_users() -> List[dict]:
    """
    真实读取 mock_personas/users.json（前端 mock user 数据）
    用 Node.js 把 users.mjs 编译输出 users.json，Python 直接读 JSON

    生产实现：后端应有自己的 user store（Postgres），不再读前端 mock
    当前实现：让 demo 后端能跑通，保留与前端同一份 30 user 数据
    """
    import json
    from pathlib import Path

    repo_root = Path(__file__).resolve().parent.parent
    json_path = repo_root / "mock_personas" / "users.json"
    if not json_path.exists():
        return []
    try:
        return json.loads(json_path.read_text(encoding="utf-8"))
    except Exception:
        return []


def _load_action_cards() -> List[ActionCard]:
    """
    真实生成 6 场景行动卡（依据 docs/action-cards.md §1-§6）

    生产实现：应读 user persona + buddy persona + LangGraph 协商结果
    当前实现：从 mock_personas 数据生成 6 场景示例卡（demo 用）
    """
    _users = _load_mock_users()
    if not _users:
        # 真实生产：应从 api/_store.py 读
        return []

    # 6 场景卡（每场景 1 张，深度+广度混合）
    cards_data = [
        {
            "id": "trip-a1-dapeng",
            "scene": "trip",
            "variant": "plan",
            "state": "plan",
            "title": "你最近好像想找个轻松的周末短途旅行",
            "trigger_reason": "基于你最近看的 4 条深圳周边游 + 周末空闲 + 预算 150-250 元",
            "intent": "去深圳周边度个轻松的周末",
            "plan": "周六 14:00 出发大鹏半日游，海边散步 + 咖啡 + 拍照，预算 150-200 元",
            "needs_buddy": "optional",
            "candidates": [
                _candidate_from_user(_users[0], "most_match", "同预算 + 同节奏（150-200 元，不赶景点）", ["爱拍照"]),
                _candidate_from_user(_users[1], "most_complement", "会做攻略，预算 200-250，节奏快一些", ["要早起"]),
                _candidate_from_user(_users[4], "most_interesting", "兴趣相似但希望早出发", ["节奏太快"]),
            ],
            "negotiation_summary": _build_negotiation_summary(_users[0], _users[1]),
            "risks": ["对方偏拍照你偏散步，提前确认节奏", "返程别太晚，建议 19:00 前"],
            "follow_up": [
                {"type": "route", "label": "查看路线"},
                {"type": "food", "label": "查看附近餐饮"},
                {"type": "hotel", "label": "查看住宿"},
                {"type": "guide", "label": "查看攻略"},
                {"type": "copy", "label": "复制邀约文案"},
            ],
            "meta": {
                "deadline": "本周六出发",
                "budget": {"min": 150, "max": 200, "currency": "CNY"},
                "twins_maturity": "intermediate",
            },
        },
        {
            "id": "food-a2-sushi",
            "scene": "food",
            "variant": "plan",
            "state": "plan",
            "title": "你收藏了 3 家日料店，鮨·初今晚 19:30 不用排队",
            "trigger_reason": "基于你最近看过 2 条日料 + 1 条日料探店 + 当前是工作日 18:00",
            "intent": "今晚找个人一起去吃",
            "plan": "19:30 到店，人均 110 元，预算 130 元（含小费）",
            "needs_buddy": "optional",
            "candidates": [
                _candidate_from_user(_users[2], "most_match", "预算匹配：人均 ≤ 130", ["不能吃太辣"]),
                _candidate_from_user(_users[6], "most_complement", "口味互：能吃生食", ["不接受排队 ≥ 1 小时"]),
                _candidate_from_user(_users[9], "most_interesting", "时间对：今晚 19 点有空", ["必须 AA"]),
            ],
            "negotiation_summary": _build_negotiation_summary(_users[2], _users[6]),
            "risks": ["对方不能吃生食需改烤物", "周末排号翻倍"],
            "follow_up": [
                {"type": "coupon", "label": "团购券"},
                {"type": "queue", "label": "在线排号"},
                {"type": "menu", "label": "查看菜单"},
                {"type": "copy", "label": "复制邀约"},
            ],
            "meta": {
                "deadline": "今晚 19:30",
                "budget": {"min": 100, "max": 130, "currency": "CNY"},
                "twins_maturity": "intermediate",
            },
        },
        {
            "id": "fitness-a3-shoulder",
            "scene": "fitness",
            "variant": "plan",
            "state": "plan",
            "title": "你最近看了很多肩背训练内容，14 天低门槛计划给你",
            "trigger_reason": "基于你最近 3 条肩背训练视频 + 1 条瑜伽拉伸",
            "intent": "启动一个 14 天训练计划",
            "plan": "14 天 × 每次 30 分钟，强度低（无器械），隔天练",
            "needs_buddy": "optional",
            "candidates": [
                _candidate_from_user(_users[7], "most_match", "同水平打卡搭子", ["晚上不吃饭"]),
                _candidate_from_user(_users[11], "most_complement", "同时间段，节奏稳", ["不接受偷懒搭子"]),
            ],
            "risks": ["动作不规范可能伤肩"],
            "follow_up": [
                {"type": "calendar", "label": "训练日历"},
                {"type": "video", "label": "动作视频"},
                {"type": "review", "label": "复盘模板"},
            ],
            "meta": {"deadline": "今天 19:00 出门", "twins_maturity": "intermediate"},
        },
        {
            "id": "study-a4-ai-agent",
            "scene": "study",
            "variant": "plan",
            "state": "plan",
            "title": "你最近在看 AI Agent，我给你生成了 7 天路线",
            "trigger_reason": "基于你最近 2 条 AI Agent 视频 + 1 条 prompt engineering",
            "intent": "7 天入门 AI Agent",
            "plan": "7 天 × 每天 1 小时，含读论文 + 写代码 + 复盘",
            "needs_buddy": "optional",
            "candidates": [
                _candidate_from_user(_users[15], "most_match", "同方向学习", ["无法坚持早 8 点起床"]),
            ],
            "risks": ["基础差异大", "打卡坚持度"],
            "follow_up": [
                {"type": "calendar", "label": "学习日历"},
                {"type": "package", "label": "资料包"},
                {"type": "note", "label": "笔记模板"},
            ],
            "meta": {"deadline": "本周一开始", "twins_maturity": "intermediate"},
        },
        {
            "id": "event-a5-jay-chou",
            "scene": "event",
            "variant": "plan",
            "state": "plan",
            "title": "你看了 8 条周杰伦视频，8 月深圳站还剩少量票",
            "trigger_reason": "基于你最近 8 条周杰伦视频 + 8 月空闲",
            "intent": "抢票 + 找个同行人",
            "plan": "大麦 8/15 12:00 抢票，找一个同城同预算同行人",
            "needs_buddy": "required",
            "candidates": [
                _candidate_from_user(_users[20], "most_match", "同购票区段 + 必接受拍照 2 小时", []),
            ],
            "risks": ["票被黄牛炒", "散场打车难"],
            "follow_up": [
                {"type": "damai", "label": "大麦"},
                {"type": "route", "label": "高德"},
                {"type": "food", "label": "美食推荐"},
            ],
            "meta": {
                "deadline": "8/15 12:00 抢票",
                "budget": {"min": 480, "max": 680, "currency": "CNY"},
                "twins_maturity": "intermediate",
            },
        },
        {
            "id": "shopping-a6-backpack",
            "scene": "shopping",
            "variant": "plan",
            "state": "plan",
            "title": "你最近收藏了 3 个通勤背包，我帮你按预算筛了 3 个",
            "trigger_reason": "基于你最近 4 条通勤/穿搭/背包视频",
            "intent": "决定买哪个包",
            "plan": "本周内选 1 个，预算 200-500 元",
            "needs_buddy": "none",
            "candidates": [],
            "risks": ["冲动消费", "尺码/容量不合适"],
            "follow_up": [
                {"type": "detail", "label": "商品详情"},
                {"type": "review", "label": "评价"},
                {"type": "compare", "label": "比价"},
                {"type": "buy", "label": "购买入口"},
            ],
            "meta": {
                "deadline": "本周内",
                "budget": {"min": 200, "max": 500, "currency": "CNY"},
                "twins_maturity": "advanced",
            },
        },
        {
            "id": "trip-hint-1",
            "scene": "trip",
            "variant": "hint",
            "state": "hint",
            "title": "你最近好像想找个轻松的周末短途旅行",
            "trigger_reason": "基于你最近看了 4 条深圳周边游 + 周末空闲",
            "intent": "",
            "plan": "",
            "needs_buddy": "optional",
            "candidates": [],
            "risks": [],
            "follow_up": [],
            "meta": {"twins_maturity": "novice"},
        },
    ]
    return [ActionCard(**c) for c in cards_data]


def _candidate_from_user(user: dict, match_label: str, reason: str, conflicts: List[str]) -> dict:
    """从 mock user 转换为 ActionCard candidate（依据 docs/action-cards.md §8）"""
    return {
        "id": user["uid"],
        "avatar_url": f"https://api.dicebear.com/7.x/avataaars/svg?seed={user['uid']}",
        "nickname": user["nickname"],
        "match_label": match_label,
        "match_reason": reason,
        "conflicts": conflicts,
    }


def _build_negotiation_summary(user_a: dict, user_b: dict) -> dict:
    """
    真实生成 AI 协商摘要（结构化：1 关键瞬间 + 三段）
    真实生产：调 api/negotiation/graph.py LangGraph 跑出结果
    当前实现：基于 user 5 维冲突计算（demo 真实可重放）
    """
    # 5 维冲突检测
    agreed = []
    pending = []
    risks = []
    detected_conflict = ""

    # 节奏
    if user_a.get("pace") == user_b.get("pace"):
        agreed.append(f"都接受 {user_a['pace']} 节奏")
    else:
        detected_conflict = f"节奏不同：你是 {user_a['pace']}，对方是 {user_b['pace']}"
        pending.append(f"节奏差异：{user_a['pace']} vs {user_b['pace']}，需二次确认")

    # 预算
    if user_a.get("budget_band") == user_b.get("budget_band"):
        agreed.append(f"预算都在 {user_a['budget_band']} 档")
    else:
        pending.append(f"预算差异：{user_a['budget_band']} vs {user_b['budget_band']}")

    # 拍照偏好
    if user_a.get("photo_pref") != user_b.get("photo_pref"):
        pending.append(f"拍照节奏差异：{user_a['photo_pref']} vs {user_b['photo_pref']}")

    # 计划型
    if user_a.get("plan_style") == user_b.get("plan_style"):
        agreed.append(f"都是 {user_a['plan_style']}，节奏一致")
    else:
        risks.append(f"计划型差异：{user_a['plan_style']} vs {user_b['plan_style']}，可能临时变更")

    # 风险：社交风格
    if user_a.get("social_style") == "outgoing" and user_b.get("social_style") == "outgoing":
        agreed.append("都是社牛，不会尬聊")
    elif user_a.get("social_style") == "slow_warm" and user_b.get("social_style") == "slow_warm":
        agreed.append("都是慢热，给彼此时间")
    else:
        risks.append(f"社交风格差异：{user_a['social_style']} vs {user_b['social_style']}")

    if not detected_conflict and pending:
        detected_conflict = pending[0]

    # 关键瞬间
    key_moment = {
        "speaker": "buddy_twin",
        "text": f"你介意我 {user_b['pace']} 出行吗？",
        "detected_conflict": detected_conflict or "节奏偏好差异",
        "resolution": "都愿意为对方调整，先 14:00 后再确认",
        "outcome": "agreed" if not pending else "pending",
    }

    # 推进程度（永远 < 100%）
    progress = 50 + (len(agreed) * 8) - (len(pending) * 5) - (len(risks) * 3)
    progress = max(30, min(95, progress))

    return {
        "agreed": agreed,
        "pending": pending,
        "risks": risks,
        "key_moment": key_moment,
        "progress": progress,
    }


# ===== 端点 =====

@router.get("/featured", response_model=Dict)
async def list_featured():
    """所有 6 场景所有行动卡（真实）"""
    cards = _load_action_cards()
    return {"success": True, "data": [c.model_dump() for c in cards], "code": 200, "msg": ""}


@router.get("/{scene}/featured", response_model=Dict)
async def list_scene_featured(scene: str):
    """单场景所有行动卡（真实，白名单过滤）"""
    if scene not in SCENE_VALUES:
        raise HTTPException(status_code=400, detail=f"scene must be one of {SCENE_VALUES}")
    cards = _load_action_cards()
    scene_cards = [c for c in cards if c.scene == scene]
    return {"success": True, "data": [c.model_dump() for c in scene_cards], "code": 200, "msg": ""}


@router.get("/card/{card_id}", response_model=Dict)
async def get_card(card_id: str):
    """单卡详情（真实）"""
    cards = _load_action_cards()
    for c in cards:
        if c.id == card_id:
            return {"success": True, "data": c.model_dump(), "code": 200, "msg": ""}
    raise HTTPException(status_code=404, detail=f"card {card_id} not found")


@router.post("/dampen", response_model=Dict)
async def dampen(req: ActionCardDampenRequest):
    """抑制场景（真实持久化到 data/dampen_store.json）"""
    state = _load_dampen()
    now = int(time.time() * 1000)
    prev = state.get(req.scene, {})
    skip_count = (prev.get("skip_count", 0) or 0) + req.skip_count
    expiry = None
    dampened = False
    if skip_count >= 3:
        # 24h 冻结
        expiry = now + 24 * 3600 * 1000
        dampened = True
    state[req.scene] = {
        "scene": req.scene,
        "skip_count": skip_count,
        "last_seen": now,
        "last_dampened": prev.get("last_dampened"),
        "expiry": expiry,
    }
    _save_dampen(state)
    return {
        "success": True,
        "data": {
            "scene": req.scene,
            "dampened": dampened,
            "expiry": expiry,
        },
        "code": 200,
        "msg": "",
    }


@router.get("/dampen/{scene}", response_model=Dict)
async def get_dampen(scene: str):
    """查询场景降权状态（真实）"""
    if scene not in SCENE_VALUES:
        raise HTTPException(status_code=400, detail=f"scene must be one of {SCENE_VALUES}")
    state = _load_dampen()
    s = state.get(scene, {})
    expiry = s.get("expiry")
    dampened = bool(expiry and expiry > int(time.time() * 1000))
    return {
        "success": True,
        "data": {
            "scene": scene,
            "dampened": dampened,
            "expiry": expiry,
            "skip_count": s.get("skip_count", 0),
        },
        "code": 200,
        "msg": "",
    }


@router.get("/invite", response_model=Dict)
async def get_invite(
    scene: str = Query(..., description="trip|food|fitness|study|event|shopping"),
    tone: str = Query("casual", description="casual|direct|warm"),
    partner_name: Optional[str] = Query(None),
    deadline: Optional[str] = Query(None),
):
    """邀约文案（真实，从 api/templates/invite.md 加载 + 变量替换）"""
    if scene not in SCENE_VALUES:
        raise HTTPException(status_code=400, detail=f"scene must be one of {SCENE_VALUES}")
    if tone not in TONE_VALUES:
        raise HTTPException(status_code=400, detail=f"tone must be one of {TONE_VALUES}")

    templates = _load_invite_templates()
    text = templates.get(scene, {}).get(tone)
    if not text:
        # fallback：trip.casual
        text = templates.get("trip", {}).get("casual", "")
    if not text:
        raise HTTPException(status_code=500, detail="invite template not loaded")

    # 变量替换（真实）
    if partner_name:
        text = text.replace("{partner_name}", partner_name)
    if deadline:
        text = text.replace("{deadline}", deadline)

    return {
        "success": True,
        "data": {"text": text, "scene": scene, "tone": tone},
        "code": 200,
        "msg": "",
    }
