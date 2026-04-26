#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
MING QQ Data Parser
Parses QQ chat exports in txt and mht formats and extracts linguistic/personality dimensions.
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

from collections import Counter, defaultdict
from dataclasses import dataclass
from datetime import datetime
from typing import Optional

# ─── Encoding setup ────────────────────────────────────────────────────────────


def _open_text(path, mode="r", encoding="utf-8"):
    try:
        return open(path, mode, encoding=encoding)
    except TypeError:
        return codecs.open(path, mode, encoding=encoding)


# ─── Data structure ────────────────────────────────────────────────────────────

@dataclass
class Message:
    sender: str
    content: str
    datetime: Optional[str] = None
    date: Optional[str] = None
    time: Optional[str] = None


# ─── Format detection ──────────────────────────────────────────────────────────

def detect_format(path: str, content: str) -> str:
    ext = os.path.splitext(path)[1].lower()
    if ext == ".mht":
        return "qq-mht"
    if ext == ".html":
        return "qq-html"
    # QQ消息管理器 txt: "2024-01-01 12:34:56"
    if re.match(r"^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}", content):
        return "qq-txt"
    return "plain-text"


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _normalize_datetime(dt_str: str) -> tuple[Optional[str], Optional[str], Optional[str]]:
    dt_str = dt_str.strip()
    for fmt in ("%Y-%m-%d %H:%M:%S", "%Y/%m/%d %H:%M:%S", "%Y年%m月%d日 %H:%M:%S"):
        try:
            dt = datetime.strptime(dt_str, fmt)
            return (dt.strftime("%Y-%m-%d"), dt.strftime("%H:%M"), dt_str)
        except ValueError:
            pass
    return (None, None, dt_str)


# ─── QQ txt parser ─────────────────────────────────────────────────────────────
# QQ消息管理器 format:
#   [2024-01-01 12:34:56] Sender(123456789) 说:
#   内容...
# or
#   2024-01-01 12:34:56 Sender: 内容

_QQ_TXT_PATTERN1 = re.compile(
    r"^\[?(?P<ts>\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})\]?\s*"
    r"(?P<sender>[^\s(（]+?)(?:\([0-9]+\)|（[0-9]+）)?\s*(?:说|:\s*:?)\s*"
    r"(?P<content>.*)$"
)
_QQ_TXT_PATTERN2 = re.compile(
    r"^(?P<ts>\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})\s+(?P<sender>[^:：]+?)[:：]\s*(?P<content>.*)$"
)
_QQ_TXT_TIME_ONLY = re.compile(r"^\[?(?P<ts>\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})\]?\s*$")


def parse_qq_txt(content: str) -> list[Message]:
    messages: list[Message] = []
    lines = content.splitlines()
    i = 0
    pending_dt: Optional[str] = None

    while i < len(lines):
        ln = lines[i].rstrip("\r\n").strip()
        if not ln:
            i += 1
            continue

        m1 = _QQ_TXT_PATTERN1.match(ln)
        if m1:
            ts = m1.group("ts")
            sender = m1.group("sender").strip()
            text = m1.group("content").strip()
            dt_str, time_str, _ = _normalize_datetime(ts)
            messages.append(Message(sender=sender, content=text, datetime=dt_str, date=dt_str, time=time_str))
            pending_dt = None
            i += 1
            continue

        m2 = _QQ_TXT_PATTERN2.match(ln)
        if m2:
            ts = m2.group("ts")
            sender = m2.group("sender").strip()
            text = m2.group("content").strip()
            dt_str, time_str, _ = _normalize_datetime(ts)
            messages.append(Message(sender=sender, content=text, datetime=dt_str, date=dt_str, time=time_str))
            i += 1
            continue

        # Standalone timestamp line
        if _QQ_TXT_TIME_ONLY.match(ln):
            pending_dt = _QQ_TXT_TIME_ONLY.match(ln).group("ts")
            i += 1
            # Next non-empty line is content
            if i < len(lines):
                nxt = lines[i].strip()
                if nxt:
                    dt_str, time_str, _ = _normalize_datetime(pending_dt)
                    # Try to parse sender:content
                    if ":" in nxt or "：" in nxt:
                        sep = ":" if ":" in nxt else "："
                        s, rest = nxt.split(sep, 1)
                        messages.append(Message(sender=s.strip(), content=rest.strip(), datetime=dt_str, date=dt_str, time=time_str))
                    else:
                        messages.append(Message(sender="未知", content=nxt, datetime=dt_str, date=dt_str, time=time_str))
                    i += 1
                    pending_dt = None
            continue

        # Continuation of previous message
        if messages and ln and not messages[-1].content.endswith("\n"):
            messages[-1] = Message(
                sender=messages[-1].sender,
                content=messages[-1].content + "\n" + ln,
                datetime=messages[-1].datetime,
                date=messages[-1].date,
                time=messages[-1].time,
            )
            i += 1
            continue

        i += 1

    return messages


# ─── QQ mht parser ─────────────────────────────────────────────────────────────

def parse_qq_mht(path: str) -> list[Message]:
    """Parse QQ HTML archive (mht format)."""
    messages: list[Message] = []
    encodings = ["utf-8", "gbk", "gb2312", "utf-8-sig"]
    content = ""

    for enc in encodings:
        try:
            with _open_text(path, encoding=enc) as f:
                content = f.read()
            break
        except UnicodeDecodeError:
            continue
        except Exception:
            break

    if not content:
        return []

    # Extract HTML body from mht
    html_match = re.search(r"------MultipartNextBoundry------.*?(------)", content, re.DOTALL)
    if html_match:
        html_content = content[html_match.start():html_match.end()]
        # Try to find Content-Location or raw HTML
        html_part = re.sub(r"^[A-Za-z-]+:.*$", "", html_content, flags=re.MULTILINE)
        content = html_part.strip()

    # QQ web format: data-sender, data-time attributes
    msg_blocks = re.findall(
        r'<li[^>]*class="[^"]*(?:message|msg|chatmessage)[^"]*"[^>]*>(.*?)</li>',
        content,
        re.DOTALL | re.IGNORECASE,
    )

    if not msg_blocks:
        # Generic div/span approach
        msg_blocks = re.findall(
            r'<div[^>]*class="[^"]*(?:bubble|message-item)[^"]*"[^>]*>(.*?)</div>',
            content,
            re.DOTALL | re.IGNORECASE,
        )

    for block in msg_blocks:
        sender_m = re.search(r'data-sender="([^"]+)"', block)
        content_m = re.search(r'<span[^>]*class="[^"]*(?:content|text|msg)[^"]*"[^>]*>(.*?)</span>', block, re.DOTALL)
        time_m = re.search(r'data-time="([^"]+)"', block)
        name_m = re.search(r'class="[^"]*(?:nickname|sender|name)[^"]*"[^>]*>(.*?)</[^>]+>', block, re.DOTALL)

        sender = sender_m.group(1) if sender_m else (name_m.group(1).strip() if name_m else "未知")
        text = re.sub(r"<[^>]+>", "", content_m.group(1)).strip() if content_m else ""
        time_str = time_m.group(1) if time_m else None

        if text or sender != "未知":
            dt_str, time_parsed, _ = _normalize_datetime(time_str) if time_str else (None, None, None)
            messages.append(Message(sender=sender, content=text, datetime=dt_str, date=dt_str, time=time_parsed))

    # Fallback: simple timestamp + content
    if not messages:
        ts_pattern = re.compile(r"(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})")
        for ln in content.splitlines():
            m = ts_pattern.search(ln)
            if m:
                ts = m.group(1)
                text = ts_pattern.sub("", ln).strip()
                dt_str, time_str, _ = _normalize_datetime(ts)
                messages.append(Message(sender="未知", content=re.sub(r"<[^>]+>", "", text).strip(), datetime=dt_str, date=dt_str, time=time_str))

    return messages


# ─── QQ HTML parser ────────────────────────────────────────────────────────────

def parse_qq_html(content: str) -> list[Message]:
    messages: list[Message] = []
    # Look for message divs/spans with timestamps
    msg_pattern = re.compile(
        r'<div[^>]*class="[^"]*(?:message|msg|chatmsg)[^"]*"[^>]*>(.*?)</div>',
        re.DOTALL | re.IGNORECASE,
    )
    for block in msg_pattern.findall(content):
        sender_m = re.search(r'<span[^>]*class="[^"]*(?:nickname|sender|name)[^"]*"[^>]*>(.*?)</span>', block, re.DOTALL | re.IGNORECASE)
        content_m = re.search(r'<span[^>]*class="[^"]*(?:content|msg-text)[^"]*"[^>]*>(.*?)</span>', block, re.DOTALL | re.IGNORECASE)
        time_m = re.search(r'<span[^>]*class="[^"]*time[^"]*"[^>]*>(.*?)</span>', block, re.DOTALL | re.IGNORECASE)

        sender = re.sub(r"<[^>]+>", "", sender_m.group(1)).strip() if sender_m else "未知"
        text = re.sub(r"<[^>]+>", "", content_m.group(1)).strip() if content_m else ""
        time_str = re.sub(r"<[^>]+>", "", time_m.group(1)).strip() if time_m else None

        if text:
            dt_str, time_parsed, _ = _normalize_datetime(time_str) if time_str else (None, None, None)
            messages.append(Message(sender=sender, content=text, datetime=dt_str, date=dt_str, time=time_parsed))

    return messages


# ─── Main parser dispatch ─────────────────────────────────────────────────────

def parse_qq(path: str) -> tuple[str, list[Message]]:
    ext = os.path.splitext(path)[1].lower()

    if ext == ".mht":
        return ("qq-mht", parse_qq_mht(path))

    # Read content for format detection
    encodings = ["utf-8", "utf-8-sig", "gbk", "gb2312"]
    content = ""
    for enc in encodings:
        try:
            with _open_text(path, encoding=enc) as f:
                content = f.read()
            break
        except UnicodeDecodeError:
            continue
        except Exception:
            break

    fmt = detect_format(path, content)

    if fmt == "qq-txt":
        return (fmt, parse_qq_txt(content))
    elif fmt == "qq-html":
        return (fmt, parse_qq_html(content))
    else:
        return (fmt, parse_qq_txt(content))


# ─── Shared analysis engine ───────────────────────────────────────────────────

VERBAL_TICS_RE = re.compile(r"[哈嗯哦唉嘛呢吧呀噢]")
EMOJI_RE = re.compile(
    "[\U0001F300-\U0001F9FF]"
    "[\U0001FA00-\U0001FAFF]"
    "[\U00002600-\U000027BF]"
)
PUNCT_RE = re.compile(r"[。！？…]+")


def analyze_messages(messages: list[Message]) -> dict:
    total = len(messages)
    if total == 0:
        return _empty_analysis()

    texts = [m.content for m in messages]
    full_text = " ".join(texts)

    # Verbal tics
    vtic_counter = Counter()
    for txt in texts:
        vtic_counter.update(c for c in txt if VERBAL_TICS_RE.match(c))

    # Emoji
    emoji_list: list[str] = []
    for txt in texts:
        emoji_list.extend(EMOJI_RE.findall(txt))
    emoji_counter = Counter(emoji_list)

    # Punctuation
    punct_raw = PUNCT_RE.findall(full_text)
    punct_counter: dict[str, int] = {}
    for p in punct_raw:
        key = p[0] if len(p) == 1 else p
        punct_counter[key] = punct_counter.get(key, 0) + 1

    # Message length
    lengths = [len(m.content) for m in messages if m.content]
    avg_len = sum(lengths) / len(lengths) if lengths else 0
    short_ratio = sum(1 for l in lengths if l <= 5) / total if total else 0

    # Chinese bigrams
    chinese_chars = re.findall(r"[\u4e00-\u9fff]", full_text)
    bigram_counter: dict[str, int] = {}
    for i in range(len(chinese_chars) - 1):
        bg = chinese_chars[i] + chinese_chars[i + 1]
        bigram_counter[bg] = bigram_counter.get(bg, 0) + 1
    top_chinese = [{"char": c, "count": n} for c, n in sorted(bigram_counter.items(), key=lambda x: -x[1])[:50]]

    # English words
    eng_words = re.findall(r"\b[a-zA-Z]{3,}\b", full_text)
    eng_counter = Counter(w.lower() for w in eng_words)
    top_english = [{"word": w, "count": n} for w, n in sorted(eng_counter.items(), key=lambda x: -x[1])[:30]]

    # Samples
    sender_samples: dict[str, list] = defaultdict(list)
    for m in messages:
        if len(sender_samples[m.sender]) < 20:
            sender_samples[m.sender].append({"sender": m.sender, "content": m.content[:200], "time": m.time or ""})
    samples = []
    for sender in sorted(sender_samples.keys()):
        samples.extend(sender_samples[sender][:20])

    # Time distribution
    hour_counter: dict[str, int] = {f"{h:02d}": 0 for h in range(24)}
    for m in messages:
        if m.time:
            h = m.time.split(":")[0]
            if h in hour_counter:
                hour_counter[h] += 1

    # Date range
    dates = sorted([m.date for m in messages if m.date])
    date_range = {"first": dates[0], "last": dates[-1]} if dates else {"first": None, "last": None}

    # Sender stats
    sender_counts = Counter(m.sender for m in messages)

    return {
        "format": "unknown",
        "date_range": date_range,
        "total_messages": total,
        "sender_counts": dict(sender_counts),
        "verbal_tics": dict(vtic_counter),
        "emoji": dict(emoji_counter.most_common(30)),
        "punctuation": punct_counter,
        "avg_message_length": round(avg_len, 1),
        "short_burst_ratio": round(short_ratio, 3),
        "top_chinese_words": top_chinese,
        "top_english_words": top_english,
        "samples": samples[:50],
        "time_distribution": hour_counter,
    }


def _empty_analysis() -> dict:
    return {
        "format": "unknown",
        "date_range": {"first": None, "last": None},
        "total_messages": 0,
        "sender_counts": {},
        "verbal_tics": {},
        "emoji": {},
        "punctuation": {},
        "avg_message_length": 0,
        "short_burst_ratio": 0,
        "top_chinese_words": [],
        "top_english_words": [],
        "samples": [],
        "time_distribution": {f"{h:02d}": 0 for h in range(24)},
    }


# ─── Output formatters ────────────────────────────────────────────────────────

def format_md(data: dict) -> str:
    lines = [
        f"# QQ Chat Analysis",
        f"",
        f"**Format:** {data.get('format', 'unknown')}",
        f"**Total messages:** {data.get('total_messages', 0)}",
        f"**Date range:** {data['date_range'].get('first', 'N/A')} → {data['date_range'].get('last', 'N/A')}",
        f"**Avg message length:** {data.get('avg_message_length', 0)} chars",
        f"**Short burst ratio:** {data.get('short_burst_ratio', 0):.1%}",
        f"",
    ]
    if data.get("sender_counts"):
        lines.append("## Senders")
        for s, c in sorted(data["sender_counts"].items(), key=lambda x: -x[1]):
            lines.append(f"- **{s}:** {c} messages")
        lines.append("")
    if data.get("verbal_tics"):
        lines.append("## Verbal Tics")
        for tic, cnt in sorted(data["verbal_tics"].items(), key=lambda x: -x[1])[:10]:
            lines.append(f"- `{tic}`: {cnt}")
        lines.append("")
    if data.get("emoji"):
        lines.append("## Emoji")
        for em, cnt in sorted(data["emoji"].items(), key=lambda x: -x[1])[:10]:
            lines.append(f"- {em}: {cnt}")
        lines.append("")
    if data.get("punctuation"):
        lines.append("## Punctuation")
        for p, cnt in sorted(data["punctuation"].items(), key=lambda x: -x[1]):
            lines.append(f"- `{p}`: {cnt}")
        lines.append("")
    if data.get("top_chinese_words"):
        lines.append("## Top Chinese Bigrams")
        for item in data["top_chinese_words"][:20]:
            lines.append(f"- {item['char']}: {item['count']}")
        lines.append("")
    if data.get("top_english_words"):
        lines.append("## Top English Words")
        for item in data["top_english_words"][:20]:
            lines.append(f"- {item['word']}: {item['count']}")
        lines.append("")
    if data.get("samples"):
        lines.append("## Sample Messages")
        for s in data["samples"][:20]:
            lines.append(f"> [{s['sender']}] {s['time']}: {s['content'][:80]}")
        lines.append("")
    return "\n".join(lines)


def format_json(data: dict) -> str:
    return json.dumps(data, ensure_ascii=False, indent=2)


# ─── CLI commands ─────────────────────────────────────────────────────────────

def cmd_analyze(args: argparse.Namespace) -> None:
    path = os.path.abspath(args.file)
    if not os.path.exists(path):
        print(f"[error] File not found: {path}", file=sys.stderr)
        sys.exit(1)

    fmt, messages = parse_qq(path)
    result = analyze_messages(messages)
    result["format"] = fmt

    if args.output.upper() == "JSON":
        print(format_json(result))
    else:
        print(format_md(result))


def cmd_stats(args: argparse.Namespace) -> None:
    path = os.path.abspath(args.file)
    if not os.path.exists(path):
        print(f"[error] File not found: {path}", file=sys.stderr)
        sys.exit(1)

    fmt, messages = parse_qq(path)
    result = analyze_messages(messages)
    result["format"] = fmt

    print(f"Format:        {fmt}")
    print(f"Total:         {result['total_messages']} messages")
    dr = result["date_range"]
    print(f"Date range:    {dr.get('first', 'N/A')} → {dr.get('last', 'N/A')}")
    print(f"Avg length:    {result['avg_message_length']} chars")
    print(f"Short burst:   {result['short_burst_ratio']:.1%}")
    print()
    print("Senders:")
    for s, c in sorted(result.get("sender_counts", {}).items(), key=lambda x: -x[1]):
        print(f"  {s}: {c}")
    print()
    print("Verbal tics (top 10):")
    for tic, cnt in sorted(result["verbal_tics"].items(), key=lambda x: -x[1])[:10]:
        print(f"  {tic}: {cnt}")
    print()
    print("Emoji (top 10):")
    for em, cnt in sorted(result["emoji"].items(), key=lambda x: -x[1])[:10]:
        print(f"  {em}: {cnt}")


def cmd_samples(args: argparse.Namespace) -> None:
    path = os.path.abspath(args.file)
    if not os.path.exists(path):
        print(f"[error] File not found: {path}", file=sys.stderr)
        sys.exit(1)

    _, messages = parse_qq(path)
    count = args.count
    for i, m in enumerate(messages[:count]):
        print(f"[{m.sender}] {m.time or ''}: {m.content[:100]}")


# ─── Entry point ──────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(
        prog="qq.py",
        description="MING QQ data parser — extracts linguistic/personality dimensions from QQ chat exports.",
    )
    sub = parser.add_subparsers(dest="cmd", required=True)

    p_analyze = sub.add_parser("analyze", help="Full analysis with linguistic dimensions")
    p_analyze.add_argument("file", help="Path to QQ export file")
    p_analyze.add_argument("--output", choices=["json", "md"], default="md")

    p_stats = sub.add_parser("stats", help="Quick statistics summary")
    p_stats.add_argument("file", help="Path to QQ export file")

    p_samples = sub.add_parser("samples", help="Print sample messages")
    p_samples.add_argument("file", help="Path to QQ export file")
    p_samples.add_argument("--count", type=int, default=20)

    args = parser.parse_args()

    if args.cmd == "analyze":
        cmd_analyze(args)
    elif args.cmd == "stats":
        cmd_stats(args)
    elif args.cmd == "samples":
        cmd_samples(args)


if __name__ == "__main__":
    main()
