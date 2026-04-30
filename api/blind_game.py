from __future__ import annotations

import hashlib
import time
import uuid
from typing import Any, Dict, List

from fastapi import APIRouter, HTTPException

from api._models import BlindGameAnswerRequest, BlindGameStartRequest
from api._store import get_blind_game, save_blind_game

router = APIRouter(prefix="/api", tags=["BlindGameV2"])

_ROUND_DEFINITIONS = [
    {"dimension": "作息节奏", "option_a": "早睡早起", "option_b": "晚睡晚起"},
    {"dimension": "行程风格", "option_a": "计划周全", "option_b": "随性自由"},
    {"dimension": "消费态度", "option_a": "省钱第一", "option_b": "体验至上"},
    {"dimension": "拍照态度", "option_a": "必须出片", "option_b": "随缘记录"},
    {"dimension": "社交强度", "option_a": "社交达人", "option_b": "安静独处"},
    {"dimension": "美食追求", "option_a": "深度美食游", "option_b": "景点为主"},
]

_DIMENSION_WEIGHTS = {
    "作息节奏": 0.25,
    "消费态度": 0.25,
    "行程风格": 0.20,
    "美食追求": 0.15,
    "社交强度": 0.10,
    "拍照态度": 0.05,
}


def _buddy_choice(negotiation_id: str, round_id: str) -> str:
    digest = hashlib.md5(f"{negotiation_id}:{round_id}".encode("utf-8")).hexdigest()
    return "A" if int(digest[:2], 16) % 2 == 0 else "B"


def _match_score(rounds: List[Dict[str, Any]], user_choices: Dict[str, str], buddy_choices: Dict[str, str]) -> float:
    score = 0.0
    for round_data in rounds:
        dimension = round_data["dimension"]
        weight = _DIMENSION_WEIGHTS[dimension]
        if user_choices.get(round_data["id"]) == buddy_choices.get(round_data["id"]):
            score += weight * 1.0
        else:
            score += weight * 0.2
    return round(score * 100, 1)


def _analysis(score: float) -> str:
    if score >= 85:
        return "你们在旅行节奏和决策偏好上非常接近，适合直接推进正式认识。"
    if score >= 60:
        return "你们有明确共识，也有需要协商的点，适合看完报告后再决定。"
    return "你们存在多处高频冲突点，建议谨慎推进，先从轻量沟通开始。"


@router.post("/games/blind/start")
async def start_blind_game(req: BlindGameStartRequest) -> Dict[str, Any]:
    game_id = f"game_{uuid.uuid4().hex[:10]}"
    rounds = [
        {
          "id": f"round_{index + 1}",
          "dimension": item["dimension"],
          "option_a": item["option_a"],
          "option_b": item["option_b"],
        }
        for index, item in enumerate(_ROUND_DEFINITIONS)
    ]
    game = {
        "game_id": game_id,
        "user_id": req.user_id,
        "negotiation_id": req.negotiation_id,
        "rounds": rounds,
        "user_choices": {},
        "created_at": int(time.time() * 1000),
    }
    save_blind_game(game_id, game)
    return {"success": True, "data": {"game_id": game_id, "rounds": rounds}}


@router.post("/games/blind/answer")
async def answer_blind_game(req: BlindGameAnswerRequest) -> Dict[str, Any]:
    game = get_blind_game(req.game_id)
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")

    round_ids = {item["id"] for item in game["rounds"]}
    if req.round_id not in round_ids:
        raise HTTPException(status_code=404, detail="Round not found")

    game["user_choices"][req.round_id] = req.choice
    save_blind_game(req.game_id, game)
    completed = len(game["user_choices"]) == len(game["rounds"])
    return {
        "success": True,
        "data": {
            "done": completed,
            "rounds_completed": len(game["user_choices"]),
            "game_id": req.game_id,
        },
    }


@router.get("/games/blind/{game_id}/report")
async def get_blind_game_report(game_id: str) -> Dict[str, Any]:
    game = get_blind_game(game_id)
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    if len(game["user_choices"]) < len(game["rounds"]):
        raise HTTPException(status_code=409, detail="Game not complete")

    buddy_choices = {
        round_data["id"]: _buddy_choice(game["negotiation_id"], round_data["id"])
        for round_data in game["rounds"]
    }
    score = _match_score(game["rounds"], game["user_choices"], buddy_choices)
    per_round_result = []
    for round_data in game["rounds"]:
        user_choice = game["user_choices"][round_data["id"]]
        buddy_choice = buddy_choices[round_data["id"]]
        per_round_result.append(
            {
                "round_id": round_data["id"],
                "dimension": round_data["dimension"],
                "user_choice": user_choice,
                "buddy_choice": buddy_choice,
                "user_label": round_data["option_a"] if user_choice == "A" else round_data["option_b"],
                "buddy_label": round_data["option_a"] if buddy_choice == "A" else round_data["option_b"],
                "matched": user_choice == buddy_choice,
            }
        )

    return {
        "success": True,
        "data": {
            "user_choices": game["user_choices"],
            "buddy_choices": buddy_choices,
            "per_round_result": per_round_result,
            "match_score": score,
            "analysis": _analysis(score),
        },
    }
