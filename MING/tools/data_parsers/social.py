#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
MING Social Media Parser
Scans a directory for text and image files, categorizes them, and provides content previews.
"""
from __future__ import annotations

import argparse
import codecs
import json
import os
import re
import sys

# ── Windows UTF-8 ─────────────────────────────────────────────────────────────
if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

from collections import defaultdict
from datetime import datetime
from pathlib import Path
from typing import Optional

# ─── Encoding ─────────────────────────────────────────────────────────────────

def _open_text(path, mode="r", encoding="utf-8"):
    try:
        return open(path, mode, encoding=encoding)
    except TypeError:
        return codecs.open(path, mode, encoding=encoding)


# ─── File type categorization ────────────────────────────────────────────────

TEXT_EXTS = {".txt", ".md", ".markdown", ".rst"}
IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".bmp", ".gif", ".heic", ".heif", ".tiff"}
DOC_EXTS = {".docx", ".pdf", ".doc", ".odt"}

# Unicode emoji ranges for optional detection
EMOJI_RE = re.compile(
    "[\U0001F300-\U0001F9FF]"
    "[\U0001FA00-\U0001FAFF]"
    "[\U00002600-\U000027BF]"
)


def categorize_file(path: str) -> str:
    ext = Path(path).suffix.lower()
    if ext in IMAGE_EXTS:
        return "image"
    if ext in TEXT_EXTS:
        return "text"
    if ext in DOC_EXTS:
        return "document"
    # Heuristic by reading first bytes
    try:
        with open(path, "rb") as f:
            header = f.read(8)
        # PNG
        if header[:8] == b"\x89PNG\r\n\x1a\n":
            return "image"
        # JPEG
        if header[:2] == b"\xff\xd8":
            return "image"
        # GIF
        if header[:6] in (b"GIF87a", b"GIF89a"):
            return "image"
        # PDF
        if header[:5] == b"%PDF-":
            return "document"
        # ZIP
        if header[:4] == b"PK\x03\x04":
            return "archive"
    except Exception:
        pass
    return "other"


# ─── Content reading ──────────────────────────────────────────────────────────

def read_text_preview(path: str, max_chars: int = 500) -> str:
    encodings = ["utf-8", "utf-8-sig", "gbk", "gb2312", "latin-1"]
    for enc in encodings:
        try:
            with _open_text(path, encoding=enc) as f:
                content = f.read(max_chars)
            return content
        except (UnicodeDecodeError, LookupError):
            continue
        except Exception:
            break
    return "[无法读取文件内容]"


def get_image_info(path: str) -> dict:
    """Get basic image dimensions using Pillow."""
    info = {
        "size_bytes": os.path.getsize(path),
        "width": None,
        "height": None,
        "note": "Claude Read 可提供视觉内容分析",
    }
    try:
        from PIL import Image
        with Image.open(path) as img:
            info["width"] = img.width
            info["height"] = img.height
            info["format"] = img.format
    except ImportError:
        info["note"] = "需安装 Pillow 以获取尺寸信息"
    except Exception:
        pass
    return info


def get_file_size_formatted(size_bytes: int) -> str:
    """Format file size in human-readable form."""
    for unit in ["B", "KB", "MB", "GB"]:
        if size_bytes < 1024:
            return f"{size_bytes:.1f} {unit}"
        size_bytes /= 1024
    return f"{size_bytes:.1f} TB"


def get_text_stats(text: str) -> dict:
    """Extract basic stats from text."""
    chinese_chars = len(re.findall(r"[\u4e00-\u9fff]", text))
    english_chars = len(re.findall(r"[a-zA-Z]", text))
    emoji_count = len(EMOJI_RE.findall(text))
    line_count = text.count("\n") + 1
    word_count = len(re.findall(r"\S+", text))

    return {
        "chinese_chars": chinese_chars,
        "english_chars": english_chars,
        "emoji_count": emoji_count,
        "line_count": line_count,
        "word_count": word_count,
        "char_count": len(text),
    }


def get_doc_preview(path: str) -> dict:
    """Try to extract text from docx/pdf."""
    ext = Path(path).suffix.lower()
    preview = ""
    note = "Claude Read 可提供完整内容分析"

    if ext == ".docx":
        try:
            from zipfile import ZipFile
            with ZipFile(path) as z:
                with z.open("word/document.xml") as f:
                    xml = f.read().decode("utf-8", errors="ignore")
                    text = re.sub(r"<[^>]+>", "", xml)
                    preview = text.strip()[:500]
                    note = "docx 文本提取"
        except Exception:
            preview = "[docx 解析失败]"
    elif ext == ".pdf":
        try:
            import subprocess
            result = subprocess.run(
                ["pdftotext", path, "-"],
                capture_output=True,
                text=True,
                timeout=10,
            )
            if result.returncode == 0:
                preview = result.stdout[:500]
                note = "pdf 文本提取"
            else:
                preview = "[pdf 解析失败]"
        except FileNotFoundError:
            preview = "[pdftotext 未安装]"
        except Exception:
            preview = "[pdf 解析失败]"

    return {"preview": preview, "note": note}


# ─── Main scan ────────────────────────────────────────────────────────────────

def scan_directory(directory: str, max_depth: int = 10) -> dict:
    """Scan directory recursively and categorize all files."""
    root = Path(directory)
    if not root.is_dir():
        return {"error": f"Directory not found: {directory}"}

    images: list[dict] = []
    texts: list[dict] = []
    documents: list[dict] = []
    others: list[dict] = []

    skipped_dirs = {".git", "__pycache__", "node_modules", ".DS_Store", "Thumbs.db"}

    for path in sorted(root.rglob("*")):
        # Depth check
        try:
            rel = path.relative_to(root)
            if len(rel.parts) > max_depth:
                continue
        except ValueError:
            continue

        if not path.is_file():
            continue
        if path.name in skipped_dirs or path.parts[0] in skipped_dirs:
            continue

        cat = categorize_file(str(path))
        size = os.path.getsize(path)
        size_fmt = get_file_size_formatted(size)
        rel_path = str(path.relative_to(root))

        try:
            mtime = datetime.fromtimestamp(path.stat().st_mtime).strftime("%Y-%m-%d %H:%M")
        except Exception:
            mtime = "unknown"

        if cat == "image":
            img_info = get_image_info(str(path))
            images.append({
                "file": rel_path,
                "size": size_fmt,
                "size_bytes": size,
                "mtime": mtime,
                "width": img_info.get("width"),
                "height": img_info.get("height"),
                "note": img_info.get("note", ""),
            })
        elif cat == "text":
            preview = read_text_preview(str(path), max_chars=500)
            stats = get_text_stats(preview)
            texts.append({
                "file": rel_path,
                "size": size_fmt,
                "size_bytes": size,
                "mtime": mtime,
                "preview": preview,
                "stats": stats,
            })
        elif cat == "document":
            doc_info = get_doc_preview(str(path))
            documents.append({
                "file": rel_path,
                "size": size_fmt,
                "size_bytes": size,
                "mtime": mtime,
                "preview": doc_info.get("preview", ""),
                "note": doc_info.get("note", ""),
            })
        else:
            others.append({
                "file": rel_path,
                "type": cat,
                "size": size_fmt,
                "size_bytes": size,
                "mtime": mtime,
            })

    total = len(images) + len(texts) + len(documents) + len(others)

    return {
        "images": images,
        "texts": texts,
        "documents": documents,
        "others": others,
        "total_files": total,
        "image_count": len(images),
        "text_count": len(texts),
        "document_count": len(documents),
        "other_count": len(others),
        "scan_timestamp": datetime.now().isoformat(),
        "scan_directory": str(root.resolve()),
    }


# ─── Output formatters ────────────────────────────────────────────────────────

def format_scan_json(data: dict) -> str:
    return json.dumps(data, ensure_ascii=False, indent=2)


def format_scan_md(data: dict) -> str:
    lines = [
        f"# Social Media Scan",
        f"",
        f"**Directory:** {data.get('scan_directory', 'N/A')}",
        f"**Total files:** {data.get('total_files', 0)}",
        f"**Scanned at:** {data.get('scan_timestamp', 'N/A')}",
        f"",
    ]

    if data.get("images"):
        lines.append(f"## Images ({data['image_count']})")
        for img in data["images"][:30]:
            dims = f"{img['width']}x{img['height']}" if img.get("width") else ""
            lines.append(f"- `{img['file']}` {img['size']} {dims} {img.get('note', '')}".strip())
        if data["image_count"] > 30:
            lines.append(f"  ... and {data['image_count'] - 30} more")
        lines.append("")

    if data.get("texts"):
        lines.append(f"## Text Files ({data['text_count']})")
        for txt in data["texts"][:20]:
            stats = txt.get("stats", {})
            preview = txt.get("preview", "")[:80].replace("\n", " ")
            lines.append(f"- `{txt['file']}` {txt['size']} ({stats.get('chinese_chars', 0)} 中文, {stats.get('english_chars', 0)} 英文)")
            if preview:
                lines.append(f"  > {preview}")
        if data["text_count"] > 20:
            lines.append(f"  ... and {data['text_count'] - 20} more")
        lines.append("")

    if data.get("documents"):
        lines.append(f"## Documents ({data['document_count']})")
        for doc in data["documents"][:10]:
            lines.append(f"- `{doc['file']}` {doc['size']} — {doc.get('note', '')}")
        lines.append("")

    if data.get("others"):
        lines.append(f"## Other Files ({data['other_count']})")
        for oth in data["others"][:20]:
            lines.append(f"- `{oth['file']}` {oth['size']} ({oth.get('type', 'unknown')})")
        if data["other_count"] > 20:
            lines.append(f"  ... and {data['other_count'] - 20} more")
        lines.append("")

    return "\n".join(lines)


# ─── CLI ──────────────────────────────────────────────────────────────────────

def cmd_scan(args: argparse.Namespace) -> None:
    directory = os.path.abspath(args.directory)
    if not os.path.isdir(directory):
        print(f"[error] Directory not found: {directory}", file=sys.stderr)
        sys.exit(1)

    print(f"Scanning: {directory}", file=sys.stderr)
    result = scan_directory(directory)

    if args.output.upper() == "JSON":
        print(format_scan_json(result))
    else:
        print(format_scan_md(result))


def main() -> None:
    parser = argparse.ArgumentParser(
        prog="social.py",
        description="MING Social Media Parser — categorizes and analyzes files from social media exports.",
    )
    sub = parser.add_subparsers(dest="cmd", required=True)

    p_scan = sub.add_parser("scan", help="Scan directory for text and image files")
    p_scan.add_argument("directory", help="Directory to scan")
    p_scan.add_argument("--output", choices=["json", "md"], default="md",
                        help="Output format (default: md)")

    args = parser.parse_args()

    if args.cmd == "scan":
        cmd_scan(args)


if __name__ == "__main__":
    main()
