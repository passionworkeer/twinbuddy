#!/usr/bin/env python
"""
合并 mock_personas/users.json(30 原) + users.expanded.json(170 新)= 200,
输出到 mock_personas/users.json。原有 30 一字不改,新 170 编号 mock-031..200。

依据 docs/data-spec.md §1 — 保留旧 user 是为了尊重原作者 commit 历史,
不破坏 dafc869 引用的数据契约(原来 7 张行动卡 cert fit_users[0..4]).
"""
from __future__ import annotations
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ORIG = ROOT / "mock_personas" / "users.json"
EXPANDED = ROOT / "mock_personas" / "users.expanded.json"
OUT = ROOT / "mock_personas" / "users.json"

with open(ORIG, encoding="utf-8") as f:
    orig = json.load(f)
with open(EXPANDED, encoding="utf-8") as f:
    expanded = json.load(f)

print(f"orig:   {len(orig)} user")
print(f"expanded: {len(expanded)} user")
assert len(orig) == 30, f"expected 30 original, got {len(orig)}"
assert len(expanded) == 170, f"expected 170 expanded, got {len(expanded)}"

merged = orig + expanded
assert len(merged) == 200

with open(OUT, "w", encoding="utf-8") as f:
    json.dump(merged, f, ensure_ascii=False, indent=2)

# 汇总
from collections import Counter
city = Counter(u.get("city") for u in merged)
mbti = Counter(u["mbti"] for u in merged)
age = Counter(u["age_band"] for u in merged)
print(f"merged: {len(merged)} user → {OUT}")
print(f"  city: {dict(city.most_common())}")
print(f"  mbti: {dict(mbti.most_common())}")
print(f"  age:  {dict(age.most_common())}")
