#!/usr/bin/env python3
"""
Tw写 public/data/scene-covers.json 给前端 mock 优先读真 Wikimedia 封面。

输出: twinbuddy/frontend/public/data/scene-covers.json
     结构: {"scenes": { scene_id: [ {cover_local, cover_url, attribution}, ... ] }}
"""
from __future__ import annotations
import json
from pathlib import Path
from typing import Any, Dict, List

ROOT = Path(__file__).resolve().parent.parent
ASSET_MANIFEST = ROOT / "api" / "data" / "asset_manifest.json"
OUT = ROOT / "twinbuddy" / "frontend" / "public" / "data" / "scene-covers.json"


def main():
    if not ASSET_MANIFEST.exists():
        print("no asset manifest")
        return
    am = json.loads(ASSET_MANIFEST.read_text(encoding="utf-8"))
    scenes_out: Dict[str, List[Dict[str, Any]]] = {}
    n = 0
    for scene, items in am.get("scenes", {}).items():
        scenes_out[scene] = []
        for it in items:
            thumb = it.get("thumb_url")
            if not thumb:
                continue
            scenes_out[scene].append({
                "thumb_url": thumb,
                "title": it.get("title", "").replace("File:", ""),
                "author": it.get("author", "")[:80],
                "license": it.get("license", ""),
                "license_url": it.get("license_url", ""),
            })
            n += 1

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({"scenes": scenes_out}, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"OK: {OUT} ({n} covers in {len(scenes_out)} scenes)")


if __name__ == "__main__":
    main()
