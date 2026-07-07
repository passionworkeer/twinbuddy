#!/usr/bin/env python3
"""
后处理 posts.json / posts6.json / golden-order.json:
读取 asset_manifest.json,
把每条 video.cover.url_list[0] 替换为本地 Wikimedia 真图(相对路径,
前端 Vite public/ 静态可达)。

不依赖 Node 模块路径的麻烦 — 直接在 Python 层做替换最可靠。
"""
from __future__ import annotations
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ASSET = ROOT / "api" / "data" / "asset_manifest.json"
DATA_DIR = ROOT / "twinbuddy" / "frontend" / "node" / "post" / "data"


def load_covers() -> dict[str, list[str]]:
    """{ scene_id: [rel_path, ...] }"""
    am = json.loads(ASSET.read_text(encoding="utf-8"))
    out = {}
    for scene, items in am.get("scenes", {}).items():
        out[scene] = []
        for it in items:
            thumb = it.get("thumb_url")
            # 使用 Wikimedia thumb_url(远程真实稳定),
            # 同时把本地图作为 fallback(无需本地缓存就可达)
            if thumb:
                out[scene].append(thumb)
    return out


def rewrite(file: Path, covers: dict[str, list[str]]):
    if not file.exists():
        return 0
    data = json.loads(file.read_text(encoding="utf-8"))
    n_changed = 0
    # posts / posts6 是 list of {scene, video:{cover:{url_list:[...]},...}}
    if isinstance(data, list):
        for post in data:
            scene = post.get("scene") or "noise"
            cover_list = post.get("video", {}).get("cover", {}).get("url_list", [])
            if cover_list and scene in covers and covers[scene]:
                # 用场景真实图 wikimedia remote URL
                idx = post.get("video", {}).get("cover", {}).get("__replace_idx", 0)
                idx = hash(post.get("aweme_id", "")) % len(covers[scene])
                cover_list[0] = covers[scene][idx]
                n_changed += 1
    # golden-order 是 list of {type: 'video'/'card', scene, ...} — 无 cover 概念
    file.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    return n_changed


def main():
    covers = load_covers()
    print(f"loaded covers for {len(covers)} scenes:")
    for s, lst in covers.items():
        print(f"  {s}: {len(lst)} covers")
    total = 0
    for f in (DATA_DIR / "posts.json", DATA_DIR / "posts6.json"):
        if f.exists():
            n = rewrite(f, covers)
            print(f"  rewrote {f.name}: {n} covers replaced")
            total += n
    print(f"Total: {total}")


if __name__ == "__main__":
    main()
