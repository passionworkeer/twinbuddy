#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
MING Photo Analyzer
Extracts EXIF metadata and optional content analysis from photo directories.
"""
from __future__ import annotations

import argparse
import codecs
import json
import math
import os
import re
import sys

# ── Windows UTF-8 ─────────────────────────────────────────────────────────────
if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

from collections import defaultdict
from dataclasses import dataclass, asdict
from datetime import datetime
from pathlib import Path
from typing import Optional

# ─── Encoding ─────────────────────────────────────────────────────────────────

def _open_text(path, mode="r", encoding="utf-8"):
    try:
        return open(path, mode, encoding=encoding)
    except TypeError:
        return codecs.open(path, mode, encoding=encoding)


# ─── Data structure ───────────────────────────────────────────────────────────

@dataclass
class PhotoEntry:
    file: str
    date: Optional[str] = None
    time: Optional[str] = None
    has_gps: bool = False
    gps: Optional[dict] = None
    location_cluster: Optional[str] = None
    note: Optional[str] = None
    width: Optional[int] = None
    height: Optional[int] = None
    camera_make: Optional[str] = None
    camera_model: Optional[str] = None


# ─── EXIF extraction ──────────────────────────────────────────────────────────

def get_pillow_exif(path: str) -> dict:
    """Extract EXIF using Pillow with graceful fallback."""
    try:
        from PIL import Image
        from PIL.ExifTags import TAGS
    except ImportError:
        return {}

    try:
        img = Image.open(path)
        exif_data = img._getexif()
        if not exif_data:
            return {}
        result = {}
        for tag_id, value in exif_data.items():
            tag = TAGS.get(tag_id, tag_id)
            result[tag] = value
        return result
    except Exception:
        return {}


def _convert_gps(gps_data: tuple, ref: str) -> Optional[float]:
    """Convert GPS coordinates from (deg, min, sec) to decimal degrees."""
    try:
        deg, min_, sec = gps_data
        decimal = deg + min_ / 60.0 + sec / 3600.0
        if ref in ("S", "W"):
            decimal = -decimal
        return round(decimal, 6)
    except (TypeError, ValueError, IndexError):
        return None


def extract_gps(exif: dict) -> Optional[dict]:
    """Extract GPS coordinates from EXIF dict."""
    try:
        gps_ifd = exif.get("GPSInfo", {}) if isinstance(exif.get("GPSInfo"), dict) else {}
        if not gps_ifd:
            return None

        lat = _convert_gps(gps_ifd.get(2), gps_ifd.get(1, "N"))
        lng = _convert_gps(gps_ifd.get(4), gps_ifd.get(3, "E"))

        if lat is not None and lng is not None:
            # Approximate place name using reverse geocoding stub
            place = _approximate_place(lat, lng)
            return {"lat": lat, "lng": lng, "place": place}
    except Exception:
        pass
    return None


def _approximate_place(lat: float, lng: float) -> str:
    """Coarse GPS → place name lookup (stub). Real implementation would use a geocoding API."""
    # Very rough China city approximation
    known_cities = [
        (31.2304, 121.4737, "上海"),
        (39.9042, 116.4074, "北京"),
        (22.5431, 114.0579, "深圳"),
        (23.1291, 113.2644, "广州"),
        (30.5728, 104.0668, "成都"),
        (29.5630, 106.5516, "重庆"),
        (32.0603, 118.7969, "南京"),
        (30.2741, 120.1551, "杭州"),
        (31.2989, 120.5853, "苏州"),
        (37.5665, 126.9780, "首尔"),
        (35.6762, 139.6503, "东京"),
        (1.3521, 103.8198, "新加坡"),
    ]
    min_dist = float("inf")
    nearest = "未知"
    for clat, clng, name in known_cities:
        d = math.sqrt((lat - clat) ** 2 + (lng - clng) ** 2)
        if d < min_dist:
            min_dist = d
            nearest = name
    # Threshold: ~0.5 degree ~ 50km
    if min_dist < 0.5:
        return nearest
    return "异地"


def _parse_exif_datetime(dt_str: Optional[str]) -> tuple[Optional[str], Optional[str]]:
    """Parse EXIF DateTimeOriginal (format: 'YYYY:MM:DD HH:MM:SS')."""
    if not dt_str:
        return None, None
    dt_str = str(dt_str)
    # Fix separator if needed
    dt_str = dt_str.replace("/", "-")
    try:
        dt = datetime.strptime(dt_str[:19], "%Y:%m:%d %H:%M:%S")
        return dt.strftime("%Y-%m-%d"), dt.strftime("%H:%M:%S")
    except ValueError:
        try:
            dt = datetime.strptime(dt_str[:19], "%Y-%m-%d %H:%M:%S")
            return dt.strftime("%Y-%m-%d"), dt.strftime("%H:%M:%S")
        except ValueError:
            pass
    return None, None


def _get_exif_date(exif: dict) -> tuple[Optional[str], Optional[str]]:
    """Try DateTimeOriginal, then DateTime, then ModifyDate."""
    for key in ("DateTimeOriginal", "DateTime", "DateTimeDigitized"):
        val = exif.get(key)
        if val:
            dt, tm = _parse_exif_datetime(val)
            if dt:
                return dt, tm
    return None, None


def _get_image_dimensions(path: str) -> tuple[Optional[int], Optional[int]]:
    """Get image width/height using Pillow or os.path.getsize heuristic."""
    try:
        from PIL import Image
        with Image.open(path) as img:
            return img.width, img.height
    except Exception:
        return None, None


def _get_camera_info(exif: dict) -> tuple[Optional[str], Optional[str]]:
    make = exif.get("Make")
    model = exif.get("Model")
    if make:
        make = str(make).strip()
    if model:
        model = str(model).strip()
    return make, model


# ─── Face detection ───────────────────────────────────────────────────────────

def detect_faces(path: str) -> dict:
    """Detect faces using OpenCV. Returns face count or '需人工确认'."""
    try:
        import cv2
        face_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
        )
        gray = cv2.imread(path, cv2.IMREAD_GRAYSCALE)
        if gray is None:
            return {"faces_detected": "需人工确认", "count": None}
        faces = face_cascade.detectMultiScale(gray, 1.1, 4)
        return {"faces_detected": "是" if len(faces) > 0 else "否", "count": int(len(faces))}
    except ImportError:
        return {"faces_detected": "需人工确认", "count": None}
    except Exception:
        return {"faces_detected": "需人工确认", "count": None}


# ─── Photo scanning ───────────────────────────────────────────────────────────

SUPPORTED_IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif", ".bmp", ".tiff", ".gif"}


def scan_photos(directory: str) -> list[PhotoEntry]:
    """Scan directory recursively for photos and extract EXIF."""
    entries: list[PhotoEntry] = []
    root = Path(directory)

    for path in sorted(root.rglob("*")):
        if not path.is_file():
            continue
        if path.suffix.lower() not in SUPPORTED_IMAGE_EXTS:
            continue

        exif = get_pillow_exif(str(path))
        date_str, time_str = _get_exif_date(exif)
        gps = extract_gps(exif)
        width, height = _get_image_dimensions(str(path))
        make, model = _get_camera_info(exif)

        # Fallback: use file modification time
        if not date_str:
            try:
                mtime = datetime.fromtimestamp(path.stat().st_mtime)
                date_str = mtime.strftime("%Y-%m-%d")
                time_str = mtime.strftime("%H:%M:%S")
            except Exception:
                pass

        entry = PhotoEntry(
            file=str(path),
            date=date_str,
            time=time_str,
            has_gps=gps is not None,
            gps=gps,
            location_cluster=gps["place"] if gps else None,
            width=width,
            height=height,
            camera_make=make,
            camera_model=model,
            note="",
        )
        entries.append(entry)

    return entries


# ─── Location clustering ──────────────────────────────────────────────────────

def cluster_locations(entries: list[PhotoEntry]) -> list[str]:
    """Simple clustering: group by approximate city using GPS."""
    clusters: dict[str, list] = defaultdict(list)
    for e in entries:
        if e.gps and e.gps.get("place"):
            clusters[e.gps["place"]].append(e)

    # Sort by count descending
    return [place for place, _ in sorted(clusters.items(), key=lambda x: -len(x[1]))]


# ─── Timeline ─────────────────────────────────────────────────────────────────

def build_timeline(entries: list[PhotoEntry]) -> list[dict]:
    """Group photos by date."""
    by_date: dict[str, list[PhotoEntry]] = defaultdict(list)
    for e in entries:
        if e.date:
            by_date[e.date].append(e)

    timeline = []
    for date in sorted(by_date.keys()):
        photos = by_date[date]
        timeline.append({
            "date": date,
            "count": len(photos),
            "files": [os.path.basename(p.file) for p in photos[:5]],
            "locations": list(set(p.gps["place"] for p in photos if p.gps and p.gps.get("place"))),
        })
    return timeline


# ─── Face analysis ────────────────────────────────────────────────────────────

def analyze_faces(entries: list[PhotoEntry]) -> dict:
    """Run face detection on all entries."""
    face_entries: list[dict] = []
    people_count = 0
    for e in entries:
        result = detect_faces(e.file)
        if result["count"] and result["count"] > 0:
            people_count += result["count"]
        face_entries.append({
            "file": os.path.basename(e.file),
            "date": e.date,
            **result,
        })
    return {
        "entries": face_entries,
        "total_people_detected": people_count if people_count > 0 else None,
        "people_note": "需人工确认" if people_count == 0 else None,
    }


# ─── CLI commands ─────────────────────────────────────────────────────────────

def cmd_scan(args: argparse.Namespace) -> None:
    directory = os.path.abspath(args.directory)
    if not os.path.isdir(directory):
        print(f"[error] Directory not found: {directory}", file=sys.stderr)
        sys.exit(1)

    print(f"Scanning: {directory}", file=sys.stderr)
    entries = scan_photos(directory)

    if args.faces:
        print("Running face detection...", file=sys.stderr)
        face_result = analyze_faces(entries)

    result = {
        "photos": [asdict(e) for e in entries],
        "timeline": build_timeline(entries),
        "location_clusters": cluster_locations(entries),
        "date_range": {
            "first": min((e.date for e in entries if e.date), default=None),
            "last": max((e.date for e in entries if e.date), default=None),
        },
        "photo_count": len(entries),
    }

    if args.faces:
        result["face_analysis"] = face_result

    if args.output.upper() == "JSON":
        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        print(format_photo_md(result))


def cmd_timeline(args: argparse.Namespace) -> None:
    directory = os.path.abspath(args.directory)
    entries = scan_photos(directory)
    timeline = build_timeline(entries)

    for day in timeline:
        locs = ", ".join(day["locations"]) if day["locations"] else ""
        print(f"{day['date']}  ({day['count']} photos)  {locs}")


def cmd_locations(args: argparse.Namespace) -> None:
    directory = os.path.abspath(args.directory)
    entries = scan_photos(directory)
    clusters = cluster_locations(entries)

    for place in clusters:
        count = sum(1 for e in entries if e.gps and e.gps.get("place") == place)
        print(f"{place}: {count} photos")


# ─── Output formatter ─────────────────────────────────────────────────────────

def format_photo_md(data: dict) -> str:
    lines = [
        f"# Photo Analysis",
        f"",
        f"**Total photos:** {data.get('photo_count', 0)}",
        f"**Date range:** {data.get('date_range', {}).get('first', 'N/A')} → {data.get('date_range', {}).get('last', 'N/A')}",
        f"",
    ]

    if data.get("location_clusters"):
        lines.append("## Location Clusters")
        clusters = data["location_clusters"]
        for place in clusters:
            count = sum(1 for p in data["photos"] if p.get("gps") and p["gps"].get("place") == place)
            lines.append(f"- **{place}:** {count} photos")
        lines.append("")

    if data.get("timeline"):
        lines.append("## Timeline")
        for day in data["timeline"][:30]:
            locs = ", ".join(day["locations"]) if day["locations"] else ""
            lines.append(f"- {day['date']} ({day['count']} photos) {locs}")
        lines.append("")

    if data.get("face_analysis"):
        fa = data["face_analysis"]
        note = fa.get("people_note") or f"检测到 {fa.get('total_people_detected', 0)} 人"
        lines.append(f"## Face Detection\n{note}\n")

    return "\n".join(lines)


# ─── Entry point ──────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(
        prog="photo.py",
        description="MING Photo Analyzer — EXIF extraction, GPS clustering, face detection.",
    )
    sub = parser.add_subparsers(dest="cmd", required=True)

    p_scan = sub.add_parser("scan", help="Full photo scan with metadata")
    p_scan.add_argument("directory", help="Directory containing photos")
    p_scan.add_argument("--output", choices=["json", "md"], default="md")
    p_scan.add_argument("--faces", action="store_true", help="Enable face detection (requires opencv)")

    p_timeline = sub.add_parser("timeline", help="Photo timeline by date")
    p_timeline.add_argument("directory", help="Directory containing photos")

    p_locations = sub.add_parser("locations", help="List location clusters")
    p_locations.add_argument("directory", help="Directory containing photos")

    args = parser.parse_args()

    if args.cmd == "scan":
        cmd_scan(args)
    elif args.cmd == "timeline":
        cmd_timeline(args)
    elif args.cmd == "locations":
        cmd_locations(args)


if __name__ == "__main__":
    main()
