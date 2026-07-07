#!/usr/bin/env python3
"""
TwinBuddy real image fetch:从 Wikimedia Commons + Picsum 抓真图元数据

依据:docs/data-spec.md §2 (real assets)

策略:
  1. Wikimedia Commons: search public-domain JPG by scene keyword,
     拿元数据(thumbnail URL、author、license、attribution URL);
  2. Picsum:seed + scene key 拿 720x1280 随机可商用 cover image;
  3. 元数据 + 下载后的本地路径写入 api/data/asset_manifest.json,
     后端 _load_mock_users / _load_action_cards 优先从这个 manifest
     读 cover_url,失败则 fallback Picsum。

下载目录:twinbuddy/frontend/public/assets/scenes/<scene>/*.jpg
  — 已存在的静态文件可被前端直接 fetch,不经后端。
"""
from __future__ import annotations
import json
import socket
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "twinbuddy" / "frontend" / "public" / "assets" / "scenes"
META_PATH = ROOT / "api" / "data" / "asset_manifest.json"

SOCKET_TIMEOUT = 15
COMMON_HEADERS = {
    "User-Agent": "twinbuddy-asset-fetcher/1.0 (https://github.com/passionworkeer/twinbuddy)"
}

# scene → 关键词列表(Wikimedia search 用)
SCENE_KEYWORDS = {
    "trip": ["Dapeng peninsula", "Shenzhen bay sunset", "Wutong mountain", "Yantian coastline", "Hiking China"],
    "food": ["Sushi platter", "Hotpot Chinese", "Ramen noodles", "Cantonese dim sum", "Street food"],
    "fitness": ["Yoga practice", "Running coastal", "Gym dumbbell", "Pilates studio", "Cycling trail"],
    "study": ["Laptop focus", "Notebook study", "Coffee reading", "Library books", "Coding workspace"],
    "event": ["Concert lights", "Live music", "Art gallery", "Street performance", "Theatre stage"],
    "shopping": ["Backpack commute", "Mechanical keyboard", "Coffee maker pour over", "Skin care bottle", "Sneakers"],
    "noise": ["City street", "Cat pet", "Sunset commute", "Coffee morning", "Convenience store"],
}

# 每场景要几张(总共 ≈ 50 张不同图,扫 feed 时不重复)
PER_SCENE_COUNT = 8


def http_get(url: str, *, timeout: int = SOCKET_TIMEOUT, retries: int = 2):
    last_err = None
    for i in range(retries + 1):
        try:
            req = urllib.request.Request(url, headers=COMMON_HEADERS)
            with urllib.request.urlopen(req, timeout=timeout) as r:
                return r.status, r.read(), dict(r.headers)
        except Exception as e:
            last_err = e
            if i < retries:
                time.sleep(1 + i)
    raise last_err


def wikimedia_search(query: str, limit: int = 5) -> list[dict]:
    """用 Wikimedia Commons API 搜索公开域图"""
    api = "https://commons.wikimedia.org/w/api.php"
    params = {
        "action": "query",
        "format": "json",
        "list": "search",
        "srsearch": query + " filetype:bitmap",
        "srnamespace": "6",  # File namespace
        "srlimit": str(limit),
    }
    url = api + "?" + urllib.parse.urlencode(params)
    try:
        _, body, _ = http_get(url)
        data = json.loads(body.decode("utf-8"))
        return [hit["title"] for hit in data.get("query", {}).get("search", [])]
    except Exception:
        return []


def wikimedia_thumb_url(title: str, width: int = 720) -> tuple[str | None, dict]:
    """取文件标题的缩略图 URL + 元数据"""
    api = "https://commons.wikimedia.org/w/api.php"
    params = {
        "action": "query",
        "format": "json",
        "prop": "imageinfo",
        "iiprop": "url|mime|extmetadata|size",
        "iiurlwidth": str(width),
        "titles": title,
    }
    try:
        _, body, _ = http_get(api + "?" + urllib.parse.urlencode(params))
        data = json.loads(body.decode("utf-8"))
        pages = data.get("query", {}).get("pages", {})
        for _, page in pages.items():
            infos = page.get("imageinfo", [])
            if not infos:
                continue
            info = infos[0]
            thumb = info.get("thumburl")
            ext_meta = info.get("extmetadata", {})
            author = (ext_meta.get("Artist", {}).get("value", "") or "").strip()
            license_short = (ext_meta.get("LicenseShortName", {}).get("value", "") or "").strip()
            license_url = (ext_meta.get("LicenseUrl", {}).get("value", "") or "").strip()
            return thumb, {
                "title": title,
                "source": "wikimedia_commons",
                "thumb_url": thumb,
                "author": _strip_html(author),
                "license": license_short,
                "license_url": license_url,
                "width": info.get("thumbwidth"),
                "height": info.get("thumbheight"),
            }
    except Exception:
        pass
    return None, {}


def _strip_html(s: str) -> str:
    """剥掉 wikimedia 返回值里嵌的 HTML"""
    import re as _re
    return _re.sub(r"<[^>]+>", "", s).strip()


def download(url: str, dest: Path) -> tuple[int, str | None]:
    """下载 url 到 dest;返回 (size, mime)"""
    try:
        _, body, headers = http_get(url)
        mime = headers.get("Content-Type", "").split(";")[0]
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(body)
        return len(body), mime
    except Exception as e:
        return 0, str(e)


def picsum_url(seed: str, w: int = 720, h: int = 1280) -> tuple[str, dict]:
    """Picsum 是肯定可达的可商用图,seed 化后语义无关但每次相同 seed 相同图"""
    return (
        f"https://picsum.photos/seed/{urllib.parse.quote(seed)}/{w}/{h}",
        {"source": "picsum", "seed": seed},
    )


def fetch_scene(scene: str) -> list[dict]:
    """返回 scene 的 manifest 列表 — Wikimedia 优先,Picsum fallback"""
    keywords = SCENE_KEYWORDS.get(scene, [scene])
    items: list[dict] = []
    out_scene_dir = OUT_DIR / scene
    for i in range(PER_SCENE_COUNT):
        # 1) Wikimedia 实际搜索
        kw = keywords[i % len(keywords)]
        titles = wikimedia_search(kw, limit=3)
        picked = None
        for title in titles:
            thumb, meta = wikimedia_thumb_url(title, width=720)
            if thumb and thumb.endswith((".jpg", ".jpeg", ".png")):
                # 下载到本地
                ext = ".jpg" if ".jpg" in thumb.lower() else ".png"
                dest = out_scene_dir / f"wm_{i:02d}{ext}"
                size, err = download(thumb, dest)
                if size > 1024:  # 至少 1KB
                    meta["local_path"] = dest.relative_to(ROOT.parent if False else ROOT).as_posix()
                    meta["size_bytes"] = size
                    items.append(meta)
                    picked = "wikimedia"
                    break
        if picked:
            continue
        # 2) Picsum fallback(永远可用)
        seed = f"twinbuddy-{scene}-{i:02d}"
        url, meta = picsum_url(seed)
        meta["fallback_url"] = url  # 前端可直接用这个 URL,无需下载
        meta["fallback_seed"] = seed
        items.append(meta)
    return items


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    META_PATH.parent.mkdir(parents=True, exist_ok=True)
    # 增量加载已存在的 manifest,这样分批跑不会丢
    scenes = sys.argv[1:] or list(SCENE_KEYWORDS.keys())
    if META_PATH.exists():
        manifest = json.loads(META_PATH.read_text(encoding="utf-8"))
    else:
        manifest = {"scenes": {}, "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ")}
    manifest.setdefault("scenes", {})
    for scene in scenes:
        if scene not in SCENE_KEYWORDS:
            print(f"unknown scene: {scene}")
            continue
        print(f"[{scene}] fetching up to {PER_SCENE_COUNT} images...")
        items = fetch_scene(scene)
        manifest["scenes"][scene] = items
        n_wm = sum(1 for i in items if i.get("source") == "wikimedia_commons")
        n_picsum = len(items) - n_wm
        print(f"  {len(items)} total: wikimedia={n_wm}, picsum_fallback={n_picsum}")
        # 每跑完一个 scene 就立刻落盘,避免长跑中途崩盘丢数据
        META_PATH.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"OK: manifest -> {META_PATH}")


if __name__ == "__main__":
    main()
