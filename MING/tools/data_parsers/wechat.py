#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
MING WeChat Data Parser
Parses WeChat chat exports in multiple formats and extracts linguistic/personality dimensions.
"""
from __future__ import annotations

import argparse
import codecs
import csv
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
from dataclasses import dataclass, asdict
from datetime import datetime
from typing import Optional

# ─── Encoding setup ────────────────────────────────────────────────────────────
PYTHONIOENCODING = "utf-8"

ENABLE_UTF8_WRITER = True


def _open_text(path, mode="r", encoding="utf-8"):
    """Open with UTF-8 encoding handling across Python versions."""
    try:
        return open(path, mode, encoding=encoding)
    except TypeError:
        return codecs.open(path, mode, encoding=encoding)


# ─── Data structures ──────────────────────────────────────────────────────────


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
    if ext == ".html":
        return "wechat-msg-html"
    if ext == ".csv":
        return "wechat-msg-csv"
    if ext == ".json":
        return "liuhen-json"
    if ext in (".db", ".sqlite", ".sqlite3"):
        return "pywxdump-sqlite"

    # Heuristic: WeChatMsg txt format
    if re.match(r"^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}", content):
        return "wechat-msg-txt"

    return "plain-text"


# ─── Parser helpers ───────────────────────────────────────────────────────────


def _normalize(msg: str) -> str:
    """Strip control chars but preserve Chinese and emoji."""
    return msg


def _split_lines(raw: str) -> list[str]:
    return [ln.rstrip("\r\n") for ln in raw.splitlines()]


def _normalize_datetime(dt_str: str) -> tuple[Optional[str], Optional[str], Optional[str]]:
    """Return (date_str, time_str, datetime_str) from a datetime string."""
    dt_str = dt_str.strip()
    try:
        dt = datetime.strptime(dt_str, "%Y-%m-%d %H:%M:%S")
        return (dt.strftime("%Y-%m-%d"), dt.strftime("%H:%M"), dt_str)
    except ValueError:
        pass
    try:
        dt = datetime.strptime(dt_str, "%Y/%m/%d %H:%M:%S")
        return (dt.strftime("%Y-%m-%d"), dt.strftime("%H:%M"), dt_str)
    except ValueError:
        pass
    return (None, None, dt_str)


# ─── WeChatMsg txt parser ─────────────────────────────────────────────────────
# Format:
#   2024-01-01 12:34:56
#   Sender: 内容
# or
#   2024-01-01 12:34:56  Sender: 内容

_WECHATMSG_TXT_PATTERN = re.compile(
    r"^(?P<ts>\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})"
    r"(?:\s+(?P<sender>[^:：]+?)[:：]\s*(?P<content>.*))?$"
)

_MULTI_SENDER_LINE = re.compile(
    r"^(?P<ts>\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})"
    r"\s+(?P<sender>[^:：\s]+)[:：]\s*(?P<content>.*)$"
)


def parse_wechatmsg_txt(content: str) -> list[Message]:
    messages: list[Message] = []
    current_sender: Optional[str] = None
    current_dt: Optional[str] = None
    lines = _split_lines(content)

    i = 0
    while i < len(lines):
        ln = lines[i].strip()
        if not ln:
            i += 1
            continue

        # Try standalone timestamp line
        ts_match = re.match(r"^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}$", ln)
        if ts_match:
            current_dt = ln
            i += 1
            # Check if next non-empty line is sender:content
            if i < len(lines):
                nxt = lines[i].strip()
                multi = _MULTI_SENDER_LINE.match(nxt)
                if multi:
                    _, time_str, _ = _normalize_datetime(current_dt)
                    messages.append(Message(
                        sender=multi.group("sender").strip(),
                        content=multi.group("content").strip(),
                        datetime=current_dt,
                        time=time_str,
                    ))
                    i += 1
                    current_sender = None
                    current_dt = None
                    continue
                elif ":" in nxt or "：" in nxt:
                    sep = ":" if ":" in nxt else "："
                    sender_raw, rest = nxt.split(sep, 1)
                    current_sender = sender_raw.strip()
                    messages.append(Message(
                        sender=current_sender,
                        content=rest.strip(),
                        datetime=current_dt,
                    ))
                    i += 1
                    current_sender = None
                    current_dt = None
                    continue
            continue

        # Multi-sender inline line
        multi = _MULTI_SENDER_LINE.match(ln)
        if multi:
            _, time_str, _ = _normalize_datetime(multi.group("ts"))
            messages.append(Message(
                sender=multi.group("sender").strip(),
                content=multi.group("content").strip(),
                datetime=multi.group("ts"),
                time=time_str,
            ))
            i += 1
            continue

        # Content continuation (no timestamp)
        if current_sender and messages and messages[-1].sender == current_sender:
            messages[-1] = Message(
                sender=messages[-1].sender,
                content=messages[-1].content + "\n" + ln,
                datetime=messages[-1].datetime,
                time=messages[-1].time,
            )
            i += 1
            continue

        i += 1

    return messages


# ─── WeChatMsg html parser ─────────────────────────────────────────────────────

_HTML_MSG_BLOCK = re.compile(
    r'<div[^>]*class="[^"]*\b(message|msg|chat)[^"]*"[^>]*>(.*?)</div>',
    re.DOTALL | re.IGNORECASE,
)
_HTML_SENDER = re.compile(
    r'<[^>]*class="[^"]*\b(nickname|sender|name|user)[^"]*"[^>]*>(.*?)</[^>]+>',
    re.DOTALL | re.IGNORECASE,
)
_HTML_CONTENT = re.compile(
    r'<div[^>]*class="[^"]*\b(content|text|message)[^"]*"[^>]*>(.*?)</div>',
    re.DOTALL | re.IGNORECASE,
)
_HTML_TIME = re.compile(
    r'<[^>]*class="[^"]*\b(time|date|timestamp)[^"]*"[^>]*>(.*?)</[^>]+>',
    re.DOTALL | re.IGNORECASE,
)


def _strip_tags(html: str) -> str:
    return re.sub(r"<[^>]+>", "", html).strip()


def parse_wechatmsg_html(content: str) -> list[Message]:
    messages: list[Message] = []
    # Try structured HTML parsing
    blocks = _HTML_MSG_BLOCK.findall(content)
    for _, block in blocks:
        sender_m = _HTML_SENDER.search(block)
        content_m = _HTML_CONTENT.search(block)
        time_m = _HTML_TIME.search(block)

        sender = _strip_tags(sender_m.group(2)) if sender_m else "未知"
        text = _strip_tags(content_m.group(2)) if content_m else ""
        time_str = _strip_tags(time_m.group(2)) if time_m else None

        if text or sender:
            dt_parsed = None
            time_parsed = None
            if time_str:
                dt_parsed, time_parsed, _ = _normalize_datetime(time_str)
            messages.append(Message(sender=sender, content=text, datetime=dt_parsed, time=time_parsed))

    # Fallback: simple time+content scan
    if not messages:
        time_pattern = re.compile(r"(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})")
        for ln in content.splitlines():
            m = time_pattern.search(ln)
            if m:
                ts = m.group(1)
                # Strip timestamp from content
                text = time_pattern.sub("", ln).strip()
                dt_str, time_str, _ = _normalize_datetime(ts)
                messages.append(Message(sender="未知", content=text, datetime=dt_str, time=time_str))

    return messages


# ─── WeChatMsg csv parser ─────────────────────────────────────────────────────

def parse_wechatmsg_csv(path: str) -> list[Message]:
    messages: list[Message] = []
    encodings = ["utf-8", "utf-8-sig", "gbk", "gb2312", "utf-16"]
    for enc in encodings:
        try:
            with _open_text(path, encoding=enc) as f:
                reader = csv.DictReader(f)
                for row in reader:
                    sender = row.get("sender", row.get("nickname", row.get("user", "未知")))
                    content = row.get("content", row.get("message", row.get("text", "")))
                    ts = row.get("time", row.get("datetime", row.get("date", "")))
                    dt_str, time_str, _ = _normalize_datetime(ts) if ts else (None, None, None)
                    messages.append(Message(sender=sender, content=content, datetime=dt_str, time=time_str))
            break
        except UnicodeDecodeError:
            continue
        except Exception:
            break
    return messages


# ─── Liuhen JSON parser ───────────────────────────────────────────────────────

def parse_liuhen_json(path: str) -> list[Message]:
    messages: list[Message] = []
    encodings = ["utf-8", "utf-8-sig", "gbk"]
    for enc in encodings:
        try:
            with _open_text(path, encoding=enc) as f:
                data = json.load(f)
            break
        except UnicodeDecodeError:
            continue
        except Exception:
            return []

    # Try list of messages
    if isinstance(data, list):
        items = data
    elif isinstance(data, dict):
        items = data.get("messages", data.get("data", []))
    else:
        return []

    for item in items:
        if isinstance(item, dict):
            sender = str(item.get("sender", item.get("nickname", item.get("user", "未知"))))
            content = str(item.get("content", item.get("message", item.get("text", ""))))
            ts = str(item.get("time", item.get("datetime", item.get("date", ""))))
            dt_str, time_str, _ = _normalize_datetime(ts) if ts else (None, None, None)
            messages.append(Message(sender=sender, content=content, datetime=dt_str, time=time_str))
    return messages


# ─── PyWxDump sqlite parser ───────────────────────────────────────────────────

def parse_pywxdump_sqlite(path: str) -> list[Message]:
    try:
        import sqlite3
    except ImportError:
        print("[warn] sqlite3 not available, skipping .db parse", file=sys.stderr)
        return []

    messages: list[Message] = []
    try:
        conn = sqlite3.connect(path)
        cur = conn.cursor()
        # Try common table names
        for table in ("message", "messages", "chatmsg", "ChatMsg"):
            try:
                cur.execute(f"SELECT nickname, strContent, strTime FROM {table} LIMIT 1")
                break
            except Exception:
                continue
        else:
            # List tables
            cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
            tables = [r[0] for r in cur.fetchall()]
            if not tables:
                conn.close()
                return []
            table = tables[0]
            cur.execute(f"PRAGMA table_info({table})")
            cols = [r[1] for r in cur.fetchall()]
            sender_col = next((c for c in cols if c in ("nickname", "sender", "strNickName")), cols[0])
            content_col = next((c for c in cols if c in ("strContent", "content", "message", "strMessage")), cols[1] if len(cols) > 1 else cols[0])
            time_col = next((c for c in cols if c in ("strTime", "time", "datetime", "CreateTime")), cols[-1])

        cur.execute(f"SELECT {sender_col}, {content_col}, {time_col} FROM {table}")
        for row in cur.fetchall():
            sender, content, ts = row
            dt_str, time_str, _ = _normalize_datetime(str(ts)) if ts else (None, None, None)
            messages.append(Message(sender=str(sender), content=str(content), datetime=dt_str, time=time_str))
        conn.close()
    except Exception as e:
        print(f"[warn] sqlite parse error: {e}", file=sys.stderr)
    return messages


# ─── Plain text fallback ─────────────────────────────────────────────────────

def parse_plain_text(content: str) -> list[Message]:
    messages: list[Message] = []
    lines = _split_lines(content)
    current_sender: Optional[str] = None
    current_dt: Optional[str] = None

    for ln in lines:
        ln = ln.strip()
        if not ln:
            continue
        # Timestamp pattern
        m = re.match(r"^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}", ln)
        if m:
            current_dt = m.group(0)
            text = ln[m.end():].strip()
            if text.startswith("-"):
                text = text.lstrip("- ").strip()
            if text:
                dt_str, time_str, _ = _normalize_datetime(current_dt)
                messages.append(Message(sender="未知", content=text, datetime=dt_str, time=time_str))
        elif ln.startswith("我:") or ln.startswith("我："):
            messages.append(Message(sender="我", content=ln[ln.index(":") + 1:].strip() if ":" in ln else ln[ln.index("：") + 1:].strip()))
        elif ln.startswith("对方:") or ln.startswith("对方："):
            messages.append(Message(sender="对方", content=ln[ln.index(":") + 1:].strip() if ":" in ln else ln[ln.index("：") + 1:].strip()))
        elif messages:
            # Continuation
            messages[-1] = Message(
                sender=messages[-1].sender,
                content=messages[-1].content + " " + ln,
                datetime=messages[-1].datetime,
                time=messages[-1].time,
            )
    return messages


# ─── Main parser dispatch ────────────────────────────────────────────────────

def parse_wechat(path: str) -> tuple[str, list[Message]]:
    with _open_text(path, encoding="utf-8") as f:
        content = f.read()

    fmt = detect_format(path, content)

    if fmt == "wechat-msg-txt":
        msgs = parse_wechatmsg_txt(content)
    elif fmt == "wechat-msg-html":
        msgs = parse_wechatmsg_html(content)
    elif fmt == "wechat-msg-csv":
        msgs = parse_wechatmsg_csv(path)
    elif fmt == "liuhen-json":
        msgs = parse_liuhen_json(path)
    elif fmt == "pywxdump-sqlite":
        msgs = parse_pywxdump_sqlite(path)
    else:
        msgs = parse_plain_text(content)

    return fmt, msgs


# ─── Analysis functions ────────────────────────────────────────────────────────

VERBAL_TICS_RE = re.compile(r"[哈嗯哦唉嘛呢吧呀噢]")
EMOJI_RE = re.compile(
    "[\U0001F300-\U0001F9FF]"
    "[\U0001FA00-\U0001FAFF]"
    "[\U00002600-\U000027BF]"
    "[\U0001F600-\U0001F64F]"
)


def count_verbal_tics(text: str) -> Counter:
    return Counter(c for c in text if VERBAL_TICS_RE.match(c))


def count_emoji(text: str) -> list[str]:
    return EMOJI_RE.findall(text)


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
        vtic_counter.update(count_verbal_tics(txt))

    # Emoji
    emoji_list: list[str] = []
    for txt in texts:
        emoji_list.extend(count_emoji(txt))
    emoji_counter = Counter(emoji_list)

    # Punctuation
    punct_raw = PUNCT_RE.findall(full_text)
    punct_counter: dict[str, int] = {}
    for p in punct_raw:
        key = p[0] if len(p) == 1 else p
        key = {"…": "...", "！": "！"}.get(key, key)
        punct_counter[key] = punct_counter.get(key, 0) + 1
    # Simplify multi-char punct
    for p in ["。", "！", "？", "…"]:
        if p not in punct_counter:
            punct_counter[p] = 0

    # Message length
    lengths = [len(m.content) for m in messages if m.content]
    avg_len = sum(lengths) / len(lengths) if lengths else 0
    short_count = sum(1 for l in lengths if l <= 5)
    short_ratio = short_count / total if total else 0

    # Chinese character n-grams (bigrams)
    chinese_chars = re.findall(r"[\u4e00-\u9fff]", full_text)
    bigram_counter: dict[str, int] = {}
    for i in range(len(chinese_chars) - 1):
        bg = chinese_chars[i] + chinese_chars[i + 1]
        bigram_counter[bg] = bigram_counter.get(bg, 0) + 1
    top_chinese = sorted(bigram_counter.items(), key=lambda x: -x[1])[:50]
    top_chinese = [{"char": c, "count": n} for c, n in top_chinese]

    # English words
    eng_words = re.findall(r"\b[a-zA-Z]{3,}\b", full_text)
    eng_counter = Counter(w.lower() for w in eng_words)
    top_english = sorted(eng_counter.items(), key=lambda x: -x[1])[:30]
    top_english = [{"word": w, "count": n} for w, n in top_english]

    # Sample messages (first 20 per sender)
    sender_samples: dict[str, list] = defaultdict(list)
    for m in messages:
        if len(sender_samples[m.sender]) < 20:
            sender_samples[m.sender].append({
                "sender": m.sender,
                "content": m.content[:200],
                "time": m.time or "",
            })

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
    dates = [m.date for m in messages if m.date]
    date_range = {}
    if dates:
        dates_sorted = sorted(dates)
        date_range = {"first": dates_sorted[0], "last": dates_sorted[-1]}
    else:
        date_range = {"first": None, "last": None}

    # Sender stats
    sender_counts: dict[str, int] = {}
    for m in messages:
        sender_counts[m.sender] = sender_counts.get(m.sender, 0) + 1

    return {
        "format": "unknown",
        "date_range": date_range,
        "total_messages": total,
        "sender_counts": sender_counts,
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

def format_json(data: dict) -> str:
    return json.dumps(data, ensure_ascii=False, indent=2)


def format_md(data: dict) -> str:
    lines = [
        f"# WeChat Chat Analysis",
        f"",
        f"**Format:** {data.get('format', 'unknown')}",
        f"**Total messages:** {data.get('total_messages', 0)}",
        f"**Date range:** {data.get('date_range', {}).get('first', 'N/A')} → {data.get('date_range', {}).get('last', 'N/A')}",
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
            lines.append(f"- {em} `{em}`: {cnt}")
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


# ─── CLI commands ──────────────────────────────────────────────────────────────

def cmd_analyze(args: argparse.Namespace) -> None:
    path = os.path.abspath(args.file)
    if not os.path.exists(path):
        print(f"[error] File not found: {path}", file=sys.stderr)
        sys.exit(1)

    fmt, messages = parse_wechat(path)
    result = analyze_messages(messages)
    result["format"] = fmt

    output = args.output.upper()
    if output == "JSON":
        print(format_json(result))
    else:
        print(format_md(result))


def cmd_stats(args: argparse.Namespace) -> None:
    path = os.path.abspath(args.file)
    if not os.path.exists(path):
        print(f"[error] File not found: {path}", file=sys.stderr)
        sys.exit(1)

    fmt, messages = parse_wechat(path)
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

    fmt, messages = parse_wechat(path)
    count = args.count
    shown = 0
    for m in messages:
        if shown >= count:
            break
        time_str = m.time or ""
        print(f"[{m.sender}] {time_str}: {m.content[:100]}")
        shown += 1


# ─── Entry point ───────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(
        prog="wechat.py",
        description="MING WeChat data parser — extracts linguistic/personality dimensions from chat exports.",
    )
    sub = parser.add_subparsers(dest="cmd", required=True)

    p_analyze = sub.add_parser("analyze", help="Full analysis with linguistic dimensions")
    p_analyze.add_argument("file", help="Path to WeChat export file")
    p_analyze.add_argument("--output", choices=["json", "md"], default="md",
                            help="Output format (default: md)")

    p_stats = sub.add_parser("stats", help="Quick statistics summary")
    p_stats.add_argument("file", help="Path to WeChat export file")

    p_samples = sub.add_parser("samples", help="Print sample messages")
    p_samples.add_argument("file", help="Path to WeChat export file")
    p_samples.add_argument("--count", type=int, default=20, help="Number of samples (default: 20)")

    args = parser.parse_args()

    if args.cmd == "analyze":
        cmd_analyze(args)
    elif args.cmd == "stats":
        cmd_stats(args)
    elif args.cmd == "samples":
        cmd_samples(args)


if __name__ == "__main__":
    main()
