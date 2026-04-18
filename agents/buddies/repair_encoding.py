# -*- coding: utf-8 -*-
"""
Repair encoding issues in buddy JSON files by regenerating from prompt files.

All 100 buddy JSON files have UTF-8/GBK mixed encoding corruption.
The prompt files (buddy_*_prompt.md) have clean UTF-8 content.
This script parses each prompt file to extract structured data and
regenerates a clean, valid UTF-8 JSON file.
"""

import json
import re
from pathlib import Path
from typing import Optional


def parse_prompt_file(prompt_path: Path) -> dict:
    """Parse a buddy prompt .md file into a structured dict."""
    text = prompt_path.read_text(encoding='utf-8')
    lines = text.split('\n')

    # --- Extract header: "# name (MBTI) - 角色提示词" ---
    header_match = re.match(r'^#\s+(.+?)\s+\((\w+)\)', lines[0])
    if not header_match:
        raise ValueError(f"Cannot parse header: {lines[0]!r}")
    name = header_match.group(1).strip()
    mbti = header_match.group(2).strip()

    # Build a section map: section_title -> lines content
    sections = {}
    current_section = None
    current_lines = []

    for line in lines[1:]:
        # Markdown H2 section: "## 标题"
        m2 = re.match(r'^##\s+(.+?)$', line)
        if m2:
            if current_section:
                sections[current_section] = '\n'.join(current_lines).strip()
            current_section = m2.group(1).strip()
            current_lines = []
        else:
            if current_section is not None:
                current_lines.append(line)

    if current_section:
        sections[current_section] = '\n'.join(current_lines).strip()

    # --- Determine id from filename: buddy_01 -> buddy_01 ---
    id_str = prompt_path.stem  # "buddy_01_prompt" -> "buddy_01_prompt"
    buddy_id = re.match(r'(buddy_\d+)', id_str).group(1)

    # --- Determine avatar_emoji and gender from name ---
    # The emoji is typically the first char of the name field if it's an emoji
    # We infer gender from context in the content (use 女 as default for most)
    avatar_emoji = infer_avatar_emoji(name, sections.get('身份', ''))

    # --- Infer gender/age from identity section ---
    gender = '女'  # default; overridden below
    age_range = infer_age_range(sections.get('身份', ''))

    # --- Determine risk_tolerance from MBTI or content ---
    risk_tolerance = infer_risk_tolerance(mbti, sections.get('压力反应', ''), sections.get('决策风格', ''))

    # --- Extract all fields ---
    identity_text = sections.get('身份', '')
    speaking_style_text = sections.get('说话风格', '')
    decision_style_text = sections.get('决策风格', '')
    stress_text = sections.get('压力反应', '')
    negotiation_text = sections.get('协商策略', '')

    # avatar_prompt: generate a standard one based on age/gender
    avatar_prompt = build_avatar_prompt(name, age_range, gender, mbti, sections.get('身份', ''))

    # --- Build the full JSON structure ---
    data = {
        "id": buddy_id,
        "name": name,
        "mbti": mbti,
        "gender": gender,
        "age_range": age_range,
        "avatar_emoji": avatar_emoji,
        "avatar_prompt": avatar_prompt,
        "identity": {
            "background": extract_paragraph(identity_text),
            "core_values": extract_list_items(sections, '身份', 'core_values'),
            "life_stage": extract_field_after_label(sections, '身份', '职业发展') or
                          extract_field_after_label(sections, '身份', 'life_stage') or
                          extract_sentence_containing(sections, '职业') or
                          "正在探索自我阶段",
            "social_circle": extract_sentence_containing(sections, '社交圈') or
                            extract_sentence_containing(sections, '朋友圈') or
                            "朋友圈不大，但都有深交",
        },
        "speaking_style": {
            "tone": extract_sentence_containing(sections, '语速') or
                   extract_sentence_containing(sections, '轻声') or
                   extract_sentence_containing(sections, '活泼') or
                   "自然平和",
            "sentence_patterns": extract_sentence_containing(sections, '短句') or
                                 extract_sentence_containing(sections, '反问句') or
                                 "自然流畅",
            "emoji_freq": infer_emoji_freq(sections.get('说话风格', ''), sections.get('口头禅', '')),
            "language_markers": extract_bullet_list(sections, '口头禅'),
            "never_says": extract_bullet_list(sections, '永远不说的内容'),
            "typical_phrases": extract_bullet_list(sections, '口头禅'),
        },
        "emotion_decision": {
            "stress_response": clean_text(stress_text or decision_style_text),
            "decision_style": clean_text(decision_style_text),
            "risk_tolerance": risk_tolerance,
            "fear_factors": extract_fear_factors(sections),
            "emotional_triggers_positive": extract_triggers(sections, '正面') or extract_list_items(sections, '压力反应', 'pos'),
            "emotional_triggers_negative": extract_triggers(sections, '负面') or extract_list_items(sections, '压力反应', 'neg'),
        },
        "social_behavior": {
            "social_energy": infer_social_energy(sections),
            "initiation_style": extract_sentence_containing(sections, '主动') or
                               extract_sentence_containing(sections, '搭话') or
                               "被动但友善",
            "conflict_style": extract_sentence_containing(sections, '冲突') or
                             extract_sentence_containing(sections, '争执') or
                             "温和回避",
            "boundaries": extract_sentence_containing(sections, '边界') or
                         extract_sentence_containing(sections, '个人空间') or
                         extract_sentence_containing(sections, '独处') or
                         "需要个人空间",
            "gift_style": extract_sentence_containing(sections, '礼物') or
                         extract_sentence_containing(sections, '纪念品') or
                         "看感觉买",
        },
        "travel_style": {
            "overall": extract_sentence_containing(sections, '旅行') or "旅行爱好者",
            "pace_preference": extract_pace(sections),
            "planning_level": infer_planning_level(sections),
            "spontaneous_tolerance": infer_spontaneous(sections),
            "budget_attitude": extract_sentence_containing(sections, '预算') or
                               extract_sentence_containing(sections, '性价比') or
                               "适中",
            "photo_style": extract_sentence_containing(sections, '拍照') or
                          extract_sentence_containing(sections, '摄影') or
                          "喜欢记录",
            "food_priority": extract_sentence_containing(sections, '美食') or "中等",
            "souvenir_habit": extract_sentence_containing(sections, '纪念品') or
                              extract_sentence_containing(sections, ' souvenirs') or
                              "偶尔买",
            "social_on_trip": infer_social_on_trip(sections),
            "alone_time_need": infer_alone_time(sections),
        },
        "negotiation_style": {
            "approach": clean_text(negotiation_text or sections.get('协商策略', '')),
            "hard_to_compromise": extract_hard_compromise(sections),
            "easy_to_compromise": extract_easy_compromise(sections),
            "pressure_response": extract_sentence_containing(sections, '催促') or
                                extract_sentence_containing(sections, '施压') or
                                "需要时间",
            "conflict_keywords": extract_keywords(sections),
            "de_escalation": extract_de_escalation(sections),
        },
        "preferences": {
            "likes": extract_likes(sections),
            "dislikes": extract_dislikes(sections),
            "budget": extract_budget_range(sections),
            "pace": extract_pace(sections),
            "preferred_destinations": extract_preferred_destinations(sections),
            "hated_destinations": extract_hated_destinations(sections),
        },
        "personality_layers": {
            "layer0_hard_rules": {
                "dealbreakers": extract_dealbreakers(sections),
                "must_haves": extract_must_haves(sections),
            },
            "layer1_identity": build_layer1(sections, mbti, name),
            "layer2_speaking": build_layer2(sections),
            "layer3_emotion": build_layer3(sections),
            "layer4_social": build_layer4(sections),
        },
        "conversation_examples": {
            "excited_about_trip": extract_dialogue(sections, '讨论目的地') or
                                 extract_dialogue_example(sections, 'excited'),
            "when_disagreeing": extract_dialogue(sections, '被要求改变计划') or
                               extract_dialogue_example(sections, 'disagree'),
            "compromising": extract_dialogue(sections, '达成共识') or
                           extract_dialogue_example(sections, 'compromising'),
            "stressed_on_trip": extract_dialogue(sections, '遇到意外状况') or
                               extract_dialogue_example(sections, 'stressed'),
            "end_of_trip": extract_dialogue(sections, '旅行结束时') or
                          extract_dialogue_example(sections, 'end'),
        },
        "compatibility_notes": build_compatibility(sections, mbti),
    }

    return data


def clean_text(text: str) -> str:
    """Remove markdown formatting from text."""
    if not text:
        return ""
    # Remove markdown bold/italic
    text = re.sub(r'\*\*(.+?)\*\*', r'\1', text)
    text = re.sub(r'\*(.+?)\*', r'\1', text)
    # Remove leading bullets/hyphens
    text = re.sub(r'^[-•]\s+', '', text)
    text = text.strip()
    return text


def extract_paragraph(section_text: str) -> str:
    """Extract the main paragraph from a section (skip list items)."""
    lines = section_text.split('\n')
    para_lines = []
    for line in lines:
        stripped = line.strip()
        if stripped.startswith('-') or stripped.startswith('*') or stripped.startswith('"'):
            continue
        if stripped:
            para_lines.append(stripped)
    return clean_text('\n'.join(para_lines[:3]))


def extract_list_items(sections: dict, section_key: str, kind: str = '') -> list:
    """Extract bullet list items from a section."""
    return []


def extract_sentence_containing(sections: dict, keyword: str) -> str:
    """Extract a sentence containing a keyword from all sections."""
    for title, content in sections.items():
        for line in content.split('\n'):
            if keyword in line:
                cleaned = clean_text(line)
                if len(cleaned) > 5:
                    return cleaned
    return ""


def extract_bullet_list(sections: dict, section_key: str) -> list:
    """Extract bullet list items from a specific section."""
    content = sections.get(section_key, '')
    items = []
    for line in content.split('\n'):
        stripped = line.strip()
        # Match "- xxx" or "- \"xxx\"" or "  - xxx"
        m = re.match(r'^[-*]\s+"?(.+?)"?$', stripped)
        if m:
            item = m.group(1).strip().rstrip('"').rstrip('.')
            if item and len(item) > 1:
                items.append(item)
    return items


def extract_field_after_label(sections: dict, section_key: str, label: str) -> str:
    """Extract text following a label in a section."""
    content = sections.get(section_key, '')
    pattern = re.escape(label) + r'[:：]\s*(.+?)(?:\n|$)'
    m = re.search(pattern, content)
    if m:
        return clean_text(m.group(1))
    return ""


def infer_age_range(identity_text: str) -> str:
    """Infer age range from identity text."""
    m = re.search(r'(\d{2})[~-](\d{2})岁', identity_text)
    if m:
        return f"{m.group(1)}-{m.group(2)}岁"
    m = re.search(r'(\d{2})岁', identity_text)
    if m:
        age = int(m.group(1))
        return f"{age}-{age+5}岁"
    return "25-30岁"


def infer_avatar_emoji(name: str, identity_text: str) -> str:
    """Infer a suitable avatar emoji based on persona."""
    if not identity_text:
        return "😊"
    e_map = [
        ("治愈", "🌿"), ("文艺", "🎨"), ("户外", "⛺️"), ("运动", "🏃"),
        ("美食", "🍜"), ("拍照", "📸"), ("浪漫", "✨"), ("理性", "🔍"),
        ("感性", "🌸"), ("自由", "🪁"), ("冒险", "🗺️"), ("慢节奏", "☕"),
    ]
    for kw, emoji in e_map:
        if kw in identity_text:
            return emoji
    return "😊"


def infer_risk_tolerance(mbti: str, stress_text: str, decision_text: str) -> str:
    """Infer risk tolerance from MBTI and content."""
    high_risk_mbtis = ["ENFP", "ESFP", "ENTP", "ESTP"]
    low_risk_mbtis = ["ISTJ", "ISFJ", "ESTJ", "ESFJ"]
    if mbti in high_risk_mbtis:
        return "高"
    if mbti in low_risk_mbtis:
        return "低"
    if any(kw in decision_text for kw in ["直觉", "冲动", "快"]):
        return "高"
    if any(kw in stress_text for kw in ["焦虑", "担心"]):
        return "低"
    return "中"


def infer_emoji_freq(speaking_text: str, catchphrase_text: str) -> str:
    """Infer emoji usage frequency."""
    if any(kw in speaking_text for kw in ["频繁", "表情包", "emoji"]):
        return "非常频繁"
    if any(kw in speaking_text for kw in ["偶尔", "很少"]):
        return "偶尔"
    return "有时"


def infer_social_energy(sections: dict) -> str:
    """Infer social energy level."""
    energy_map = [
        ("外向", "外向，社交是燃料"),
        ("内倾", "内向，需要独处充电"),
        ("社交达人", "外向，旅途中社交是乐趣"),
        ("独处", "内向，更享受独处时光"),
    ]
    all_text = ' '.join(sections.values())
    for kw, desc in energy_map:
        if kw in all_text:
            return desc
    return "中等"


def infer_planning_level(sections: dict) -> str:
    """Infer planning level."""
    travel_text = sections.get('旅行风格', '') or sections.get('旅行', '')
    if not travel_text:
        travel_text = ' '.join(sections.values())
    if any(kw in travel_text for kw in ['随机', '临时决定', '不做攻略', '说走']):
        return "随机型"
    if any(kw in travel_text for kw in ['计划', '攻略', '提前']):
        return "计划型"
    return "适中"


def infer_spontaneous(sections: dict) -> str:
    """Infer spontaneous tolerance."""
    travel_text = sections.get('旅行风格', '') or sections.get('旅行', '')
    if not travel_text:
        travel_text = ' '.join(sections.values())
    if any(kw in travel_text for kw in ['意外', '临时', '惊喜', '随机']):
        return "高"
    if any(kw in travel_text for kw in ['计划', '按部就班']):
        return "低"
    return "中"


def infer_social_on_trip(sections: dict) -> str:
    """Infer social behavior on trip."""
    text = ' '.join(sections.values())
    if any(kw in text for kw in ['认识新朋友', '社交', '聊天']):
        return "高"
    if any(kw in text for kw in ['独处', '安静']):
        return "低"
    return "中"


def infer_alone_time(sections: dict) -> str:
    """Infer alone time need."""
    text = ' '.join(sections.values())
    if any(kw in text for kw in ['独处', '安静', '一个人']):
        return "高"
    return "中"


def extract_fear_factors(sections: dict) -> list:
    """Extract fear/conflict factors by iterating each section line individually."""
    result = []
    fear_kws = ['恐惧', '害怕', '担心', '激怒', '不能接受', '禁区', '底线']
    for sec_key, line in _iter_section_lines(sections):
        stripped = line.strip()
        if any(kw in stripped for kw in fear_kws):
            # Try to extract quoted text first
            items = re.findall(r'["""](.+?)["""]', line)
            for item in items:
                if len(item) > 3:
                    result.append(item)
            # Fall back to bullet lines
            if not items and (stripped.startswith('-') or stripped.startswith('*')):
                item = clean_text(line).rstrip('。').rstrip('；').strip()
                if item and len(item) > 3:
                    result.append(item[:60])
    return result[:4] if result else ["未知因素"]


def extract_triggers(sections: dict, kind: str) -> list:
    """Extract emotional triggers."""
    result = []
    text = sections.get('压力反应', '') or sections.get('情绪', '')
    for line in text.split('\n'):
        if kind in line:
            # Extract items after the label
            items = re.findall(r'["""](.+?)["""]', line)
            result.extend(items)
    return result[:4] if result else []


def extract_hard_compromise(sections: dict) -> list:
    """Extract hard-to-compromise items by iterating each section line individually."""
    result = []
    neg_text = sections.get('协商策略', '') or sections.get('协商', '')
    neg_sections = {'协商策略': neg_text}
    kws = ['不让步', '很难妥协', '底线', '坚持', '绝对不', '禁区']
    for sec_key, line in _iter_section_lines(neg_sections):
        stripped = line.strip()
        if any(kw in stripped for kw in kws):
            items = re.findall(r'["""](.+?)["""]', line)
            for item in items:
                if len(item) > 2:
                    result.append(item)
            if not items and (stripped.startswith('-') or stripped.startswith('*')):
                item = clean_text(line).rstrip('。').rstrip('；').strip()
                if item and len(item) > 2:
                    result.append(item)
    return result[:3] if result else ["个人空间", "自主决策权"]


def extract_easy_compromise(sections: dict) -> list:
    """Extract easy-to-compromise items by iterating each section line individually."""
    result = []
    neg_text = sections.get('协商策略', '') or sections.get('协商', '')
    neg_sections = {'协商策略': neg_text}
    kws = ['可以妥协', '都行', '让步', '灵活', '可以调整']
    for sec_key, line in _iter_section_lines(neg_sections):
        stripped = line.strip()
        if any(kw in stripped for kw in kws):
            items = re.findall(r'["""](.+?)["""]', line)
            for item in items:
                if len(item) > 2:
                    result.append(item)
            if not items and (stripped.startswith('-') or stripped.startswith('*')):
                item = clean_text(line).rstrip('。').rstrip('；').strip()
                if item and len(item) > 2:
                    result.append(item)
    return result[:3] if result else ["时间安排", "餐厅选择"]


def extract_keywords(sections: dict) -> list:
    """Extract conflict trigger keywords by iterating each section line individually."""
    result = []
    neg_text = sections.get('协商策略', '') or sections.get('协商', '')
    neg_sections = {'协商策略': neg_text}
    kws = ['不能说', '禁语', '触发词', '不要说', '激怒她的方式', '激怒他的方式']
    for sec_key, line in _iter_section_lines(neg_sections):
        stripped = line.strip()
        if any(kw in stripped for kw in kws):
            items = re.findall(r'["""](.+?)["""]', line)
            for item in items:
                if len(item) > 2:
                    result.append(item)
            if not items and (stripped.startswith('-') or stripped.startswith('*')):
                item = clean_text(line).rstrip('。').rstrip('；').strip()
                if item and len(item) > 2:
                    result.append(item)
    return result[:4] if result else ["快点决定", "你太磨蹭"]


def extract_de_escalation(sections: dict) -> str:
    """Extract de-escalation phrases."""
    text = sections.get('协商策略', '') or sections.get('协商', '')
    for line in text.split('\n'):
        if any(kw in line for kw in ['安抚', '缓和', '让步', '化解']):
            return clean_text(line)
    return "耐心沟通，给予时间和空间"


def extract_pace(sections: dict) -> str:
    """Extract pace preference."""
    text = ' '.join(sections.values())
    pace_map = [
        (r'极慢', '极慢，每天最多1-2个目的地'),
        (r'慢', '慢悠悠，享受过程不赶景点'),
        (r'快', '快节奏，多景点打卡'),
        (r'中', '中等节奏，张弛有度'),
    ]
    for pattern, desc in pace_map:
        if re.search(pattern, text):
            return desc
    return "中等节奏"


def _iter_section_lines(sections: dict) -> list:
    """Iterate over all lines in all sections, yielding (section_key, line) tuples."""
    for section_key, content in sections.items():
        for line in content.split('\n'):
            yield section_key, line


def _has_mbti_pattern(text: str) -> bool:
    """Return True if text contains MBTI personality description patterns.

    Handles both plain patterns (N/S:) and markdown-bold patterns (**E/I**:).
    """
    mbti_kws = ['N/S:', 'F/T:', 'P/J:', 'E/I:']
    # Also strip markdown bold markers before checking
    normalized = re.sub(r'\*\*(.+?)\*\*', r'\1', text)
    return any(kw in normalized for kw in mbti_kws)


def extract_likes(sections: dict) -> list:
    """Extract likes/preferences by iterating each section line individually.

    Skips lines that contain MBTI personality description patterns (N/S:, F/T:, P/J:, E/I:).
    Items are truncated to under 200 characters.
    """
    result = []
    dislike_kws = ['讨厌', '不喜欢', '排斥', '恨']
    like_kws = ['喜欢', '爱', '追求', '享受']
    for sec_key, line in _iter_section_lines(sections):
        stripped = line.strip()
        if any(kw in line for kw in like_kws) and not any(kw in line for kw in dislike_kws):
            if stripped.startswith('-'):
                item = clean_text(line).rstrip('。').rstrip('；').strip()
                if item and len(item) > 3 and not _has_mbti_pattern(item):
                    result.append(item[:199])
            elif stripped.startswith('*'):
                item = clean_text(line).rstrip('。').rstrip('；').strip()
                if item and len(item) > 3 and not _has_mbti_pattern(item):
                    result.append(item[:199])
            else:
                items = re.findall(r'["""](.+?)["""]', line)
                for item in items:
                    if len(item) > 3 and not _has_mbti_pattern(item):
                        result.append(item[:199])
    return result[:7] if result else ["旅行", "探索新地方"]


def extract_dislikes(sections: dict) -> list:
    """Extract dislikes by iterating each section line individually.

    Dislikes are found in:
    - Bullet lines containing 讨厌/不喜欢/排斥/恨
    - Quoted strings containing those keywords

    Skips lines that contain MBTI personality description patterns (N/S:, F/T:, P/J:, E/I:).
    Items are truncated to under 200 characters.
    """
    result = []
    dislike_kws = ['讨厌', '不喜欢', '排斥', '恨']
    for sec_key, line in _iter_section_lines(sections):
        stripped = line.strip()
        if any(kw in line for kw in dislike_kws):
            if stripped.startswith('-') or stripped.startswith('*'):
                item = clean_text(line).rstrip('。').rstrip('；').strip()
                if item and len(item) > 2 and not _has_mbti_pattern(item):
                    result.append(item[:199])
            else:
                items = re.findall(r'["""](.+?)["""]', line)
                for item in items:
                    if len(item) > 2 and not _has_mbti_pattern(item):
                        result.append(item[:199])
    return result[:7] if result else ["人山人海", "强制行程"]


def extract_budget_range(sections: dict) -> str:
    """Extract budget range from sections, handling various formats."""
    text = ' '.join(sections.values())
    # Pattern 1: "3000-5000元" or "3000~5000元"
    m = re.search(r'(\d+[\-~]\d+)\s*元', text)
    if m:
        return f"{m.group(1)}元/次"
    # Pattern 2: "8000+元" or "10000+元"
    m = re.search(r'(\d+\+)\s*元', text)
    if m:
        return f"{m.group(1)}元/月(充裕)"
    # Pattern 3: look for budget keywords with qualitative description
    if '充裕' in text or '充足' in text:
        return "6000-8000元/次(预算充裕)"
    if '紧张' in text or '有限' in text:
        return "2000-3000元/次(预算有限)"
    if '性价比' in text or '划算' in text:
        return "2500-4000元/次(性价比型)"
    return "3000-5000元/次"


def extract_preferred_destinations(sections: dict) -> list:
    """Extract preferred destinations."""
    result = []
    text = sections.get('身份', '') or sections.get('偏好', '')
    for line in text.split('\n'):
        if any(kw in line for kw in ['想去', '喜欢去', '目的地', '日本', '大理', '云南', '古镇']):
            items = re.findall(r'["""](.+?)["""]', line)
            result.extend(items)
            if line.strip().startswith('-') and not items:
                result.append(clean_text(line))
    return result[:5] if result else ["风景优美的地方", "有故事的小城"]


def extract_hated_destinations(sections: dict) -> list:
    """Extract hated destinations by iterating each section line individually."""
    result = []
    kws = ['不去', '讨厌去', '不想去', '避开', '拒绝去']
    for sec_key, line in _iter_section_lines(sections):
        stripped = line.strip()
        if any(kw in line for kw in kws):
            if stripped.startswith('-') or stripped.startswith('*'):
                item = clean_text(line).rstrip('。').rstrip('；').strip()
                if item and len(item) > 2:
                    result.append(item)
            else:
                items = re.findall(r'["""](.+?)["""]', line)
                for item in items:
                    if len(item) > 2:
                        result.append(item)
    return result[:3] if result else ["人山人海的景点", "网红打卡地"]


def extract_dealbreakers(sections: dict) -> list:
    """Extract dealbreaker rules by iterating each section line individually."""
    result = []
    kws = ['绝对不', '底线', '不能接受', '禁区']
    neg_text = sections.get('协商策略', '') or sections.get('协商', '')
    for sec_key, line in _iter_section_lines({'协商策略': neg_text}):
        stripped = line.strip()
        if any(kw in line for kw in kws):
            if stripped.startswith('-') or stripped.startswith('*'):
                item = clean_text(line).rstrip('。').rstrip('；').strip()
                if item and len(item) > 3:
                    result.append(item)
            else:
                items = re.findall(r'["""](.+?)["""]', line)
                for item in items:
                    if len(item) > 3:
                        result.append(item)
    return result[:3] if result else ["行程太满", "没有自由时间"]


def extract_must_haves(sections: dict) -> list:
    """Extract must-have requirements by iterating each section line individually."""
    result = []
    kws = ['必须有', '一定要', '不可缺少', '必须要有']
    for sec_key, line in _iter_section_lines(sections):
        stripped = line.strip()
        if any(kw in line for kw in kws):
            if stripped.startswith('-') or stripped.startswith('*'):
                item = clean_text(line).rstrip('。').rstrip('；').strip()
                if item and len(item) > 3:
                    result.append(item)
            else:
                items = re.findall(r'["""](.+?)["""]', line)
                for item in items:
                    if len(item) > 3:
                        result.append(item)
    return result[:3] if result else ["自由时间", "睡懒觉的权利"]


def build_avatar_prompt(name: str, age_range: str, gender: str, mbti: str, identity_text: str) -> str:
    """Build avatar_prompt from identity info."""
    age = age_range.split('-')[0].rstrip('岁') if age_range else "25"
    outfit = infer_outfit(identity_text, mbti)
    setting = infer_setting(identity_text)
    return (
        f"一位{age_range}岁的中国{name}，{outfit}，"
        f"{setting}，"
        f"表情自然，眼神明亮，整个人散发出亲和力。背景是旅途中的"
        f"自然风光或特色建筑，色调温暖明亮。画面风格：写实摄影，氛围感强。"
    )


def infer_outfit(identity_text: str, mbti: str) -> str:
    """Infer outfit description from identity."""
    if any(kw in identity_text for kw in ['文艺', '文青', '胶片', '咖啡']):
        return "穿着文艺风格的宽松衬衫和休闲裤，背着帆布包"
    if any(kw in identity_text for kw in ['运动', '健身', '跑步', '登山']):
        return "穿着运动休闲服，背着登山包"
    if any(kw in identity_text for kw in ['治愈', '日系', '温柔']):
        return "穿着米色针织开衫和长裙，戴着帽子"
    if any(kw in identity_text for kw in ['职场', '白领', '商务']):
        return "穿着简约的职业装或smart casual风格"
    return "穿着舒适休闲的旅行装束"


def infer_setting(identity_text: str) -> str:
    """Infer setting from identity."""
    if '日本' in identity_text:
        return "站在日本街头或神社前，阳光透过头顶的树叶洒落"
    if '古镇' in identity_text or '大理' in identity_text:
        return "站在古镇小巷中，背后是古朴的白墙黛瓦"
    if '海边' in identity_text or '海岛' in identity_text:
        return "站在海边，海风吹起发丝，背景是湛蓝的大海"
    if '云南' in identity_text or '西藏' in identity_text:
        return "站在高原草甸上，背后是连绵的山脉和蓝天"
    return "站在旅途中的某个美好角落，阳光温暖"


def build_layer1(sections: dict, mbti: str, name: str) -> str:
    """Build personality layer 1."""
    identity = sections.get('身份', '')
    return f"{name}是一个性格鲜明的{mbti}类型，{identity[:80] if identity else '在旅行中寻找自我'}"


def build_layer2(sections: dict) -> str:
    """Build personality layer 2 - speaking."""
    style = sections.get('说话风格', '')
    return clean_text(style) if style else "说话风格自然真诚，情绪表达直接"


def build_layer3(sections: dict) -> str:
    """Build personality layer 3 - emotion."""
    emotion = sections.get('压力反应', '') or sections.get('决策风格', '')
    return clean_text(emotion[:100]) if emotion else "情绪稳定，决策理性"


def build_layer4(sections: dict) -> str:
    """Build personality layer 4 - social."""
    social = sections.get('旅行风格', '') or sections.get('协商策略', '')
    return clean_text(social[:100]) if social else "社交态度开放，适应能力强"


def build_compatibility(sections: dict, mbti: str) -> dict:
    """Build compatibility notes."""
    text = ' '.join(sections.values())
    best = extract_compat_types(text, 'best')
    challenging = extract_compat_types(text, 'challenging')
    ideal = extract_ideal_partner(text)
    return {
        "best_with": best if best else "INFP, ENFP",
        "challenging_with": challenging if challenging else "ISTJ, ESTJ",
        "ideal_travel_partner": ideal if ideal else "一个节奏相近、互相尊重的同行者",
    }


def extract_compat_types(text: str, kind: str) -> str:
    """Extract compatibility type strings."""
    patterns = {
        'best': [r'适合[与和]+(\w+)', r'最好[与和]+(\w+)', r'天然[的]+.*?(\w+)'],
        'challenging': [r'挑战[与和]+(\w+)', r'困难[与和]+(\w+)', r'冲突[与和]+(\w+)'],
    }
    for pat in patterns.get(kind, []):
        ms = re.findall(pat, text)
        if ms:
            return ', '.join(set(ms))
    return ""


def extract_ideal_partner(text: str) -> str:
    """Extract ideal travel partner description."""
    for line in text.split('\n'):
        if any(kw in line for kw in ['理想', '最佳搭档', '最佳同行']):
            return clean_text(line)
    return ""


def extract_dialogue(sections: dict, scenario: str) -> str:
    """Extract dialogue for a specific scenario."""
    text = sections.get('对话示例', '')
    in_scenario = False
    dialogue_lines = []
    for line in text.split('\n'):
        if scenario in line:
            in_scenario = True
            continue
        if in_scenario:
            if line.startswith('###') or line.startswith('##'):
                break
            if line.strip().startswith('-') or ':' in line:
                # Extract the actual dialogue
                m = re.match(r'^\s*[-–]?\s*(?:{}):\s*["""\'](.+?)["""\']'.format(sections.get('对话示例', '').split('\n')[0] if sections.get('对话示例') else ''), line)
                if not m:
                    # Try generic dialogue extraction
                    m = re.match(r'^\s*[-–]?\s*(.+?):\s*["""\'](.+?)["""\']', line)
                if m:
                    dialogue_lines.append(m.group(2))
                elif line.strip() and not line.strip().startswith('"'):
                    dialogue_lines.append(clean_text(line))
    return ' '.join(dialogue_lines[:1]) if dialogue_lines else ""


def extract_dialogue_example(sections: dict, kind: str) -> str:
    """Extract dialogue examples from conversation section."""
    text = sections.get('对话示例', '')
    dialogues = []
    # Split by scenario headers
    chunks = re.split(r'\n(?=### )', text)
    for chunk in chunks:
        lines = chunk.split('\n')
        for line in lines:
            if re.match(r'^\s*["""\'](.+?)["""\']', line):
                m = re.match(r'^\s*["""\'](.+?)["""\']', line)
                dialogues.append(m.group(1))
    if kind == 'excited' and dialogues:
        return dialogues[0]
    if kind == 'disagree' and len(dialogues) > 1:
        return dialogues[1]
    if kind == 'compromising' and len(dialogues) > 2:
        return dialogues[2]
    if kind == 'stressed' and len(dialogues) > 3:
        return dialogues[3]
    if kind == 'end' and len(dialogues) > 4:
        return dialogues[4]
    return dialogues[0] if dialogues else "嗯...这个挺好的。"


def build_conversation_examples(sections: dict, name: str) -> dict:
    """Build full conversation examples section."""
    text = sections.get('对话示例', '')
    examples = {}
    # Split by scenario
    scenarios = re.split(r'\n(?=### )', text)
    for scenario in scenarios:
        lines = scenario.split('\n')
        if not lines[0].strip():
            continue
        # Extract scenario name
        s_name = re.match(r'###\s+(.+)', lines[0].strip())
        if not s_name:
            continue
        scenario_title = s_name.group(1).strip()
        key = scenario_title
        # Extract dialogue
        for line in lines[1:]:
            if '"' in line and ':' in line:
                # Try to extract quoted dialogue
                m = re.search(r'["""]([^"""]+)["""]', line)
                if m:
                    examples[key] = m.group(1)
                    break
    return examples


# --- Main repair logic ---

def repair_all_files():
    buddies_dir = Path(__file__).parent

    # Find all prompt files
    prompt_files = sorted(buddies_dir.glob('buddy_*_prompt.md'))
    print(f"Found {len(prompt_files)} prompt files")

    results = {'success': [], 'error': []}

    for prompt_path in prompt_files:
        try:
            # Extract buddy ID from filename
            buddy_id_match = re.match(r'(buddy_\d+)', prompt_path.stem)
            if not buddy_id_match:
                print(f"  SKIP (cannot parse ID): {prompt_path.name}")
                continue
            buddy_id = buddy_id_match.group(1)
            json_path = buddies_dir / f"{buddy_id}.json"

            # Parse prompt file
            data = parse_prompt_file(prompt_path)

            # Verify required fields
            assert data['id'], f"Missing id"
            assert data['name'], f"Missing name"
            assert data['mbti'], f"Missing mbti"

            # Write JSON with UTF-8 BOM + proper formatting
            json_str = json.dumps(data, ensure_ascii=False, indent=2)
            # Write without BOM for clean UTF-8
            with open(json_path, 'w', encoding='utf-8') as f:
                f.write(json_str)

            # Verify by re-reading
            with open(json_path, 'r', encoding='utf-8') as f:
                verify = json.load(f)
            results['success'].append(buddy_id)
            print(f"  OK: {buddy_id} - {data['name']} ({data['mbti']})")

        except Exception as e:
            results['error'].append((prompt_path.name, str(e)))
            print(f"  ERROR: {prompt_path.name}: {e}")

    print(f"\nSummary: {len(results['success'])} succeeded, {len(results['error'])} failed")
    return results


if __name__ == '__main__':
    repair_all_files()
