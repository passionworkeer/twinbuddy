# -*- coding: utf-8 -*-
"""
fusion_engine.py - TwinBuddy Fixed-Weight Fusion Engine
"""
from __future__ import annotations
import math
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Dict, List, Tuple

@dataclass(frozen=True)
class FusionInput:
    mbti: str
    bio: str
    chat_history: str
    mbti_weight: float = 0.9
    speaking_style_weight: float = 0.8
    interest_weight: float = 0.7
    decay_rate: float = 0.1

    @classmethod
    def from_raw(cls, mbti="", bio="", chat_history="",
                 mbti_weight=0.9, speaking_style_weight=0.8,
                 interest_weight=0.7, decay_rate=0.1):
        return cls(
            mbti=str(mbti or "").strip().upper(),
            bio=str(bio or "").strip(),
            chat_history=str(chat_history or "").strip(),
            mbti_weight=mbti_weight,
            speaking_style_weight=speaking_style_weight,
            interest_weight=interest_weight,
            decay_rate=decay_rate,
        )

DIMENSION_WEIGHTS: Dict[str, Tuple[str, float]] = {
    "cognition":  ("mbti", 0.9),
    "behavior":   ("mbti", 0.9),
    "emotion":    ("mbti", 0.9),
    "expression": ("speaking_style", 0.8),
    "preference": ("interest", 0.7),
}

def extract_mbti_dimensions(mbti: str) -> Dict[str, Any]:
    if len(mbti) < 4:
        return {"energy": "unknown", "information": "unknown",
                "decision": "unknown", "lifestyle": "unknown"}
    e, n, t, j = mbti[:4]
    return {
        "energy": "extrovert" if e == "E" else "introvert",
        "information": "intuition" if n == "N" else "sensing",
        "decision": "thinking" if t == "T" else "feeling",
        "lifestyle": "judging" if j == "J" else "perceiving",
    }

def extract_speaking_style(bio: str, chat: str) -> Dict[str, Any]:
    text = f"{bio} {chat}"
    sentences = max(1, text.count(".") + text.count("!") + text.count("?"))
    words = text.split()
    avg_len = round(len(words) / sentences, 2) if sentences > 0 else 0.0
    return {
        "has_emoji": any(c in text for c in "☺😂😊"),
        "has_question": "?" in text,
        "is_verbose": avg_len > 10,
        "avg_sentence_length": avg_len,
        "formality": "casual" if avg_len > 10 else "balanced",
    }

def extract_interests(bio: str, chat: str) -> List[str]:
    text = (bio + " " + chat).lower()
    kw_map = {
        "travel":  ["旅行","旅游","travel","trip"],
        "food":    ["美食","吃","food","餐厅"],
        "sports":  ["运动","停步","sports","gym","假日"],
        "music":   ["音乐","喜欔","music","乐器"],
        "reading": ["读书","阅读","reading","书"],
        "gaming":  ["游戏","gaming","打游戏"],
        "art":     ["艺术","画画","art","摄影"],
        "social":  ["社交","朋友","social","聚会"],
        "tech":    ["编程","coding","科技","python","AI"],
        "nature":  ["自然","nature","户外","露营"],
    }
    return [k for k, kws in kw_map.items() if any(ki in text for ki in kws)]

def compute_weight_decay(base: float, dist: float, rate: float=0.1) -> float:
    return round(base * math.exp(-dist * rate), 4)

def _build_dimension(dim: str, mbti_d, style_d, interest_d, inp: FusionInput) -> Dict[str, Any]:
    src, bw = DIMENSION_WEIGHTS.get(dim, ("mbti", 0.9))
    if src == "mbti": val, s, dist = mbti_d, "mbti", 0.0
    elif src == "speaking_style": val, s, dist = style_d, "speaking_style", 1.0
    else: val, s, dist = interest_d, "interest", 2.0
    wd = compute_weight_decay(bw, dist, inp.decay_rate)
    conf = round(wd * 0.9 + (1-wd) * 0.5, 4)
    return {"dimension": dim, "value": val, "source": s,
            "weight": bw, "distance_from_source": dist,
            "weight_decay": wd, "confidence": conf}

def fuse_persona(mbti="", bio="", chat_history="",
                 mbti_weight=0.9, speaking_style_weight=0.8,
                 interest_weight=0.7, decay_rate=0.1) -> Dict[str, Any]:
    inp = FusionInput.from_raw(mbti, bio, chat_history,
                               mbti_weight, speaking_style_weight,
                               interest_weight, decay_rate)
    mbti_d = extract_mbti_dimensions(inp.mbti)
    style_d = extract_speaking_style(inp.bio, inp.chat_history)
    int_d = extract_interests(inp.bio, inp.chat_history)
    dims = ["cognition","behavior","emotion","expression","preference"]
    fused = {d: _build_dimension(d, mbti_d, style_d, int_d, inp) for d in dims}
    total = round(sum(f["confidence"] for f in fused.values()) / len(dims), 4)
    sources = ["mbti"]
    if len(inp.bio) >= 5: sources.append("bio")
    if len(inp.chat_history) > 100: sources.append("chat_history")
    return {
        "fused_at": datetime.now(timezone.utc).isoformat(),
        "input_summary": {"mbti": inp.mbti, "bio_len": len(inp.bio), "chat_len": len(inp.chat_history)},
        "sources_used": sources,
        "weights_applied": {"mbti": inp.mbti_weight, "speaking_style": inp.speaking_style_weight,
                           "interest": inp.interest_weight, "decay_rate": inp.decay_rate},
        "dimensions": fused,
        "overall_confidence": total,
        "mbti_dimension_evidence": mbti_d,
        "speaking_style_evidence": style_d,
        "interest_tags": int_d,
    }
