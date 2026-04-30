from __future__ import annotations

import re
from collections import Counter
from typing import Any, Dict, Iterable, List

_EMOJI_RE = re.compile(
    "["
    "\U0001F300-\U0001FAFF"
    "\U00002700-\U000027BF"
    "\U0001F1E6-\U0001F1FF"
    "]+",
    flags=re.UNICODE,
)

_KEYWORDS = ["美食", "拍照", "徒步", "周末", "预算", "慢节奏", "自由", "海边", "城市", "攻略"]
_DECISIVE_WORDS = ["必须", "一定", "直接", "马上", "安排"]
_FLEXIBLE_WORDS = ["随便", "都可以", "再说", "看看", "慢慢来"]


def _safe_ratio(numerator: float, denominator: float) -> float:
    if denominator <= 0:
        return 0.0
    return round(numerator / denominator, 3)


def extract_style_vector(messages: Iterable[str]) -> Dict[str, Any]:
    texts = [text.strip() for text in messages if text and text.strip()]
    if not texts:
        return {
            "emoji_rate": 0.0,
            "question_ratio": 0.0,
            "exclamation_ratio": 0.0,
            "avg_length": 0.0,
            "decision_style": "balanced",
            "top_keywords": [],
        }

    all_text = "".join(texts)
    emoji_count = len(_EMOJI_RE.findall(all_text))
    question_count = sum(text.count("?") + text.count("？") for text in texts)
    exclamation_count = sum(text.count("!") + text.count("！") for text in texts)
    decisive_hits = sum(sum(word in text for word in _DECISIVE_WORDS) for text in texts)
    flexible_hits = sum(sum(word in text for word in _FLEXIBLE_WORDS) for text in texts)

    keyword_counter: Counter[str] = Counter()
    for keyword in _KEYWORDS:
      keyword_counter[keyword] = sum(keyword in text for text in texts)

    if decisive_hits > flexible_hits:
        decision_style = "decisive"
    elif flexible_hits > decisive_hits:
        decision_style = "flexible"
    else:
        decision_style = "balanced"

    return {
        "emoji_rate": _safe_ratio(emoji_count, max(len(all_text), 1)),
        "question_ratio": _safe_ratio(question_count, len(texts)),
        "exclamation_ratio": _safe_ratio(exclamation_count, len(texts)),
        "avg_length": round(sum(len(text) for text in texts) / len(texts), 1),
        "decision_style": decision_style,
        "top_keywords": [keyword for keyword, count in keyword_counter.most_common(5) if count > 0],
    }
