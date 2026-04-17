#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
MING Chat Parser — 通用聊天记录解析器
支持：微信 TXT / AI 对话 JSON / 任意格式对话文本
"""
from __future__ import annotations

import json
import re
import sys
from collections import Counter
from dataclasses import dataclass, asdict
from typing import Optional

from .base import BaseParser

# ── Windows UTF-8 ──────────────────────────────────────────────────────────────
from ._encoding import *  # noqa: F401,F403

# ─── 常量 ─────────────────────────────────────────────────────────────────────

VERBAL_TICS_RE = re.compile(r"[哈嗯哦唉嘛呢吧呀噢呃诶嗨呦哇]")
EMOJI_RE = re.compile(
    "[\U0001F300-\U0001F9FF]"
    "[\U0001FA00-\U0001FAFF]"
    "[\U00002600-\U000027BF]"
    "[\U0001F600-\U0001F64F]"
)
WECHAT_TS_RE = re.compile(r"^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}")
AI_JSON_TS_RE = re.compile(r'"(created|time|timestamp)"\s*:\s*\d+')

# 常见情感词
POSITIVE_WORDS = ["哈哈", "好", "棒", "开心", "喜欢", "赞", "厉害", "可爱", "期待", "幸福", "感动"]
NEGATIVE_WORDS = ["难过", "生气", "失望", "无奈", "讨厌", "委屈", "焦虑", "郁闷", "烦"]
TOPIC_KEYWORDS = {
    "旅行": ["旅行", "旅游", "出行", "机票", "酒店", "景点"],
    "美食": ["吃饭", "餐厅", "好吃", "美食", "做饭", "外卖"],
    "工作": ["工作", "加班", "老板", "同事", "开会", "项目"],
    "情感": ["感情", "喜欢", "约会", "男朋友", "女朋友", "分手"],
    "科技": ["手机", "电脑", "AI", "数码", "软件", "科技"],
    "音乐": ["音乐", "歌", "演唱会", "歌手", "播放"],
    "影视": ["电影", "剧", "综艺", "追剧", "演员"],
    "运动": ["跑步", "健身", "运动", "瑜伽", "游泳"],
    "时尚": ["穿搭", "衣服", "品牌", "化妆", "护肤品"],
    "学习": ["学习", "考试", "课程", "读书", "书"],
}

# ─── 数据结构 ────────────────────────────────────────────────────────────────

@dataclass
class ChatMessage:
    speaker: str
    content: str
    timestamp: Optional[str] = None
    role: Optional[str] = None  # "user" | "assistant" | "other"


# ─── 辅助函数 ────────────────────────────────────────────────────────────────

def _read_content(path_or_text: str | bytes) -> str:
    """读取文件内容或直接返回字符串。"""
    if isinstance(path_or_text, bytes):
        return path_or_text.decode("utf-8", errors="ignore")
    # 尝试作为文件路径读取
    try:
        with open(path_or_text, "r", encoding="utf-8", errors="ignore") as f:
            return f.read()
    except Exception:
        return path_or_text


def _detect_format(text: str) -> str:
    """检测聊天格式类型。"""
    # AI JSON (ChatGPT / Claude 格式)
    if text.strip().startswith(("{")) and "messages" in text:
        try:
            json.loads(text)
            return "ai-json"
        except Exception:
            pass
    if re.search(r'"(role|user|assistant)"\s*:', text):
        return "ai-json"

    # 微信 TXT 格式
    if WECHAT_TS_RE.match(text.strip()):
        return "wechat-txt"

    # AI 纯文本对话格式（--- User --- / ## User ##）
    if re.search(r"(---|#{1,3})\s*(User|Assistant|AI|ChatGPT|Claude)", text, re.I):
        return "ai-plain"

    return "plain-text"


def _parse_wechat_txt(text: str) -> list[ChatMessage]:
    """解析微信 TXT 格式聊天记录。"""
    messages: list[ChatMessage] = []
    lines = text.splitlines()
    i = 0
    current_speaker: Optional[str] = None

    while i < len(lines):
        ln = lines[i].rstrip("\r\n").strip()
        if not ln:
            i += 1
            continue

        # 时间戳行
        ts_match = re.match(r"^(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})\s*$", ln)
        if ts_match:
            i += 1
            if i < len(lines):
                nxt = lines[i].strip()
                if ":" in nxt or "：" in nxt:
                    sep = ":" if ":" in nxt else "："
                    s, rest = nxt.split(sep, 1)
                    current_speaker = s.strip()
                    messages.append(ChatMessage(speaker=current_speaker, content=rest.strip(), timestamp=ts_match.group(1)))
                    i += 1
                continue
            continue

        # 行内时间戳
        m = re.match(
            r"^(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})\s+([^:：]+?)[:：]\s*(.*)$",
            ln
        )
        if m:
            ts, speaker, content = m.group(1), m.group(2).strip(), m.group(3).strip()
            messages.append(ChatMessage(speaker=speaker, content=content, timestamp=ts))
            i += 1
            continue

        # 续行
        if messages and ln:
            messages[-1] = ChatMessage(
                speaker=messages[-1].speaker,
                content=messages[-1].content + "\n" + ln,
                timestamp=messages[-1].timestamp,
            )
        i += 1

    return messages


def _parse_ai_json(text: str) -> list[ChatMessage]:
    """解析 AI 对话 JSON 格式。"""
    try:
        data = json.loads(text)
    except Exception:
        return []

    messages: list[ChatMessage] = []

    # OpenAI / Claude 格式: {"messages": [...]}
    if isinstance(data, dict):
        items = data.get("messages", data.get("conversation", []))
    elif isinstance(data, list):
        items = data
    else:
        return []

    for item in items:
        if not isinstance(item, dict):
            continue
        role = str(item.get("role", "user")).lower()
        content = str(item.get("content", item.get("text", "")))
        ts = str(item.get("created", item.get("time", item.get("timestamp", ""))))

        speaker_map = {"user": "user", "assistant": "ai", "system": "system"}
        speaker = speaker_map.get(role, role)
        messages.append(ChatMessage(speaker=speaker, content=content, timestamp=ts, role=role))

    return messages


def _parse_ai_plain(text: str) -> list[ChatMessage]:
    """解析 --- User --- / ## AI ## 格式的纯文本对话。"""
    messages: list[ChatMessage] = []
    blocks = re.split(r"(?:---|#{1,3})\s*(?:User|Assistant|AI|ChatGPT|Claude|System)", text, flags=re.I)
    for block in blocks:
        block = block.strip()
        if not block:
            continue
        # 第一行通常为发言者
        lines = block.split("\n", 1)
        speaker = lines[0].strip() if lines else "user"
        content = lines[1].strip() if len(lines) > 1 else block
        role = "assistant" if re.search(r"(AI|Assistant|Claude)", speaker, re.I) else "user"
        messages.append(ChatMessage(speaker=speaker, content=content, role=role))
    return messages


def _parse_plain_text(text: str) -> list[ChatMessage]:
    """通用纯文本解析：尝试识别对话模式。"""
    messages: list[ChatMessage] = []
    lines = text.splitlines()
    current_speaker = "unknown"
    current_content = ""

    for ln in lines:
        ln = ln.strip()
        if not ln:
            continue
        # 说话者切换
        m = re.match(r"^(我|对方|他|她|用户)\s*[:：]\s*(.*)$", ln)
        if m:
            if current_content:
                messages.append(ChatMessage(speaker=current_speaker, content=current_content.strip()))
            current_speaker = m.group(1)
            current_content = m.group(2)
            continue
        if current_content:
            current_content += " " + ln
        else:
            current_content = ln

    if current_content:
        messages.append(ChatMessage(speaker=current_speaker, content=current_content.strip()))

    return messages


def _analyze_messages(messages: list[ChatMessage]) -> dict:
    """对消息列表进行统计分析。"""
    total = len(messages)
    if total == 0:
        return {
            "total_messages": 0,
            "message_ratio": {},
            "avg_message_length": 0,
            "topics": [],
            "emotional_tone": "未知",
            "key_phrases": [],
        }

    texts = [m.content for m in messages if m.content]
    full_text = " ".join(texts)

    # 消息比例
    speaker_counter = Counter(m.speaker for m in messages)
    total_msgs = sum(speaker_counter.values())
    ratio = {s: round(c / total_msgs, 3) for s, c in speaker_counter.items()}

    # 平均消息长度
    lengths = [len(t) for t in texts]
    avg_len = round(sum(lengths) / len(lengths), 1) if lengths else 0

    # 话题检测
    topics: list[str] = []
    for topic, kws in TOPIC_KEYWORDS.items():
        for kw in kws:
            if kw in full_text:
                if topic not in topics:
                    topics.append(topic)
                break

    # 情感分析
    pos_count = sum(1 for w in POSITIVE_WORDS if w in full_text)
    neg_count = sum(1 for w in NEGATIVE_WORDS if w in full_text)
    if pos_count > neg_count * 2:
        emotional_tone = "积极正面，很少负面情绪表达"
    elif neg_count > pos_count * 2:
        emotional_tone = "偶尔有负面情绪，但整体中性"
    else:
        emotional_tone = "情感表达中性，较为理性"

    # 高频短语（中文 bigram）
    chinese_chars = re.findall(r"[\u4e00-\u9fff]", full_text)
    bigram_counter: dict[str, int] = {}
    for i in range(len(chinese_chars) - 1):
        bg = chinese_chars[i] + chinese_chars[i + 1]
        if len(bg) == 2:
            bigram_counter[bg] = bigram_counter.get(bg, 0) + 1
    top_bigrams = [c for c, _ in sorted(bigram_counter.items(), key=lambda x: -x[1])[:10]]

    # 语气词
    tics = re.findall(VERBAL_TICS_RE, full_text)
    top_tics = [t for t, _ in Counter(tics).most_common(5)]

    # 说话风格推断
    short_ratio = sum(1 for l in lengths if l <= 10) / len(lengths) if lengths else 0
    emoji_count = len(EMOJI_RE.findall(full_text))

    if avg_len < 15:
        style_base = "简洁直接"
    elif avg_len > 80:
        style_base = "长篇大论，喜欢详细表达"
    else:
        style_base = "中等长度，表达清晰"

    style_parts = [style_base]
    if emoji_count > total * 0.1:
        style_parts.append("频繁使用表情包")
    elif emoji_count > total * 0.03:
        style_parts.append("偶尔用表情包")
    if top_tics:
        style_parts.append(f"常用语气词: {', '.join(top_tics[:3])}")

    speaking_style = "，".join(style_parts)

    # 关系深度
    private_kws = ["秘密", "心里", "隐私", "想你", "爱你", "感情", "心事"]
    private_score = sum(1 for kw in private_kws if kw in full_text)
    if private_score >= 3:
        relationship_depth = "亲密关系，有私人话题分享"
    elif private_score >= 1:
        relationship_depth = "关系较好，有一定私人交流"
    else:
        relationship_depth = "普通关系，交流以日常话题为主"

    # 决策模式
    decision_kws = ["你觉得", "怎么办", "帮我决定", "商量", "你觉得呢"]
    if any(kw in full_text for kw in decision_kws):
        decision_patterns = "喜欢商量，会征询对方意见"
    elif re.search(r"(我想|我要|我决定|自己|决定了)", full_text):
        decision_patterns = "喜欢自己做决定，有主见"
    else:
        decision_patterns = "决策模式需进一步分析"

    return {
        "total_messages": total,
        "message_ratio": ratio,
        "avg_message_length": avg_len,
        "topics": topics,
        "speaking_style": speaking_style,
        "emotional_tone": emotional_tone,
        "relationship_depth": relationship_depth,
        "key_phrases": top_bigrams,
        "decision_patterns": decision_patterns,
        "short_message_ratio": round(short_ratio, 3),
        "emoji_density": round(emoji_count / total, 3) if total else 0,
    }


# ─── Chat Parser ─────────────────────────────────────────────────────────────

class ChatParser(BaseParser):
    name = "ChatParser"
    confidence = 0.7  # 聊天记录置信度中等（取决于数据完整性）

    def _detect(self, text: str) -> bool:
        """检测是否为聊天记录格式。"""
        fmt = _detect_format(text)
        return fmt != "plain-text" or len(text) > 50

    def _parse(self, text: str) -> dict:
        """解析聊天记录，返回结构化数据。"""
        fmt = _detect_format(text)

        if fmt == "wechat-txt":
            messages = _parse_wechat_txt(text)
        elif fmt == "ai-json":
            messages = _parse_ai_json(text)
        elif fmt == "ai-plain":
            messages = _parse_ai_plain(text)
        else:
            messages = _parse_plain_text(text)

        stats = _analyze_messages(messages)

        return {
            "format": fmt,
            "messages_count": len(messages),
            "stats": stats,
        }

    def _extract_fields(self, parsed: dict) -> dict:
        """从聊天分析结果中提取 Persona 字段。"""
        stats = parsed.get("stats", {})
        return {
            "total_messages": stats.get("total_messages", 0),
            "message_ratio": stats.get("message_ratio", {}),
            "avg_message_length": stats.get("avg_message_length", 0),
            "topics": stats.get("topics", []),
            "speaking_style": stats.get("speaking_style", ""),
            "emotional_tone": stats.get("emotional_tone", ""),
            "relationship_depth": stats.get("relationship_depth", ""),
            "key_phrases": stats.get("key_phrases", []),
            "decision_patterns": stats.get("decision_patterns", ""),
        }


# ─── 便捷函数 ───────────────────────────────────────────────────────────────

def quick_parse(content: str | bytes) -> dict:
    """快速聊天记录解析。"""
    parser = ChatParser()
    return parser.process(content)


if __name__ == "__main__":
    import json

    test_cases = [
        # 微信格式
        "2024-01-01 10:00:00\n张三: 你好呀\n2024-01-01 10:01:00\n李四: 你好！今天天气不错",
        # AI JSON 格式
        '{"messages": [{"role": "user", "content": "你好"}, {"role": "assistant", "content": "你好！有什么可以帮你？"}]}',
        # AI 纯文本格式
        "## User ##\n你好\n## AI ##\n你好呀！我是 AI 助手。\n## User ##\n今天天气怎样",
        # 纯文本
        "我: 今天的饭好好吃\n对方: 是的！那家餐厅确实不错",
    ]

    parser = ChatParser()
    for tc in test_cases:
        result = parser.process(tc)
        print(f"[{_detect_format(tc)}] -> total={result.get('persona', {}).get('total_messages', 'N/A')}, topics={result.get('persona', {}).get('topics', [])}")
    print()
    print("测试 16Personalities 文本误识别:", parser.detect("ENFP 热情洋溢 MBTI"))
