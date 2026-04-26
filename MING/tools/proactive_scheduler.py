"""
proactive_scheduler.py — MING 主动行为调度器

在安静时刻，MING 主动向用户发送有意义的提醒。
支持节日问候、天气关心、纪念日提醒和随机想念。
"""

import argparse
import json
import os
import sys
import hashlib
from datetime import datetime, date, timedelta
from pathlib import Path
from typing import Optional

# ── Windows UTF-8 兼容 ────────────────────────────────────────────────────────
if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

# ---------------------------------------------------------------------------
# Lunar Calendar — 1900-2099 农历转换（简化查表法）
# ---------------------------------------------------------------------------

# 1900-2099 年春节对应的公历日期（正月初一）
LUNAR_NEW_YEAR = {
    1900: (1, 31), 1901: (2, 19), 1902: (2, 8), 1903: (1, 29),
    1904: (2, 16), 1905: (2, 5), 1906: (1, 25), 1907: (2, 13),
    1908: (2, 2), 1909: (1, 22), 1910: (2, 10), 1911: (1, 30),
    1912: (2, 18), 1913: (2, 7), 1914: (1, 27), 1915: (2, 14),
    1916: (2, 3), 1917: (1, 23), 1918: (2, 11), 1919: (2, 1),
    1920: (2, 20), 1921: (2, 8), 1922: (1, 28), 1923: (2, 16),
    1924: (2, 5), 1925: (1, 25), 1926: (2, 13), 1927: (2, 2),
    1928: (1, 23), 1929: (2, 10), 1930: (1, 30), 1931: (2, 17),
    1932: (2, 6), 1933: (1, 26), 1934: (2, 14), 1935: (2, 3),
    1936: (1, 24), 1937: (2, 11), 1938: (2, 1), 1939: (2, 19),
    1940: (2, 8), 1941: (1, 27), 1942: (2, 15), 1943: (2, 5),
    1944: (1, 25), 1945: (2, 13), 1946: (2, 2), 1947: (1, 22),
    1948: (2, 10), 1949: (1, 29), 1950: (2, 17), 1951: (2, 6),
    1952: (1, 27), 1953: (2, 14), 1954: (2, 5), 1955: (1, 24),
    1956: (2, 12), 1957: (2, 2), 1958: (1, 21), 1959: (2, 9),
    1960: (1, 28), 1961: (2, 15), 1962: (2, 5), 1963: (1, 25),
    1964: (2, 13), 1965: (2, 3), 1966: (1, 21), 1967: (2, 9),
    1968: (1, 30), 1969: (2, 17), 1970: (2, 6), 1971: (1, 27),
    1972: (2, 15), 1973: (2, 3), 1974: (1, 23), 1975: (2, 11),
    1976: (2, 1), 1977: (1, 21), 1978: (2, 8), 1979: (1, 28),
    1980: (2, 16), 1981: (2, 5), 1982: (1, 25), 1983: (2, 13),
    1984: (2, 2), 1985: (1, 22), 1986: (2, 9), 1987: (1, 29),
    1988: (2, 17), 1989: (2, 6), 1990: (1, 27), 1991: (2, 15),
    1992: (2, 4), 1993: (1, 23), 1994: (2, 10), 1995: (1, 31),
    1996: (2, 19), 1997: (2, 7), 1998: (1, 28), 1999: (2, 16),
    2000: (2, 5), 2001: (1, 24), 2002: (2, 12), 2003: (2, 1),
    2004: (1, 22), 2005: (2, 9), 2006: (1, 29), 2007: (2, 18),
    2008: (2, 7), 2009: (1, 26), 2010: (2, 14), 2011: (2, 3),
    2012: (1, 23), 2013: (2, 10), 2014: (1, 31), 2015: (2, 19),
    2016: (2, 8), 2017: (1, 28), 2018: (2, 16), 2019: (2, 5),
    2020: (1, 25), 2021: (2, 12), 2022: (2, 1), 2023: (1, 22),
    2024: (2, 10), 2025: (1, 29), 2026: (2, 17), 2027: (2, 6),
    2028: (1, 26), 2029: (2, 13), 2030: (2, 3), 2031: (1, 23),
    2032: (2, 11), 2033: (1, 31), 2034: (2, 19), 2035: (2, 8),
    2036: (1, 28), 2037: (2, 15), 2038: (2, 5), 2039: (1, 25),
    2040: (2, 12), 2041: (2, 1), 2042: (1, 22), 2043: (2, 10),
    2044: (1, 30), 2045: (2, 17), 2046: (2, 6), 2047: (1, 26),
    2048: (2, 14), 2049: (2, 3), 2050: (1, 24), 2051: (2, 11),
    2052: (1, 31), 2053: (2, 19), 2054: (2, 8), 2055: (1, 28),
    2056: (2, 15), 2057: (2, 5), 2058: (1, 25), 2059: (2, 12),
    2060: (2, 1), 2061: (1, 22), 2062: (2, 10), 2063: (1, 30),
    2064: (2, 17), 2065: (2, 6), 2066: (1, 26), 2067: (2, 14),
    2068: (2, 3), 2069: (1, 23), 2070: (2, 11), 2071: (1, 31),
    2072: (2, 19), 2073: (2, 7), 2074: (1, 27), 2075: (2, 15),
    2076: (2, 5), 2077: (1, 25), 2078: (2, 12), 2079: (2, 1),
    2080: (1, 22), 2081: (2, 9), 2082: (1, 29), 2083: (2, 17),
    2084: (2, 6), 2085: (1, 26), 2086: (2, 14), 2087: (2, 3),
    2088: (1, 23), 2089: (2, 10), 2090: (1, 30), 2091: (2, 18),
    2092: (2, 7), 2093: (1, 27), 2094: (2, 14), 2095: (2, 3),
    2096: (1, 24), 2097: (2, 11), 2098: (2, 1), 2099: (1, 21),
}

# 固定农历节日（正月初一 至 大年三十）
LUNAR_FESTIVALS = {
    (1, 1): "春节",
    (1, 15): "元宵节",
    (5, 5): "端午节",
    (7, 7): "七夕节",
    (8, 15): "中秋节",
    (9, 9): "重阳节",
    (12, 8): "腊八节",
}

# 公历固定节日
GREGORIAN_FESTIVALS = {
    (1, 1): "元旦",
    (2, 14): "情人节",
    (3, 8): "妇女节",
    (4, 1): "愚人节",
    (5, 1): "劳动节",
    (5, 4): "青年节",
    (6, 1): "儿童节",
    (7, 1): "建党节",
    (9, 10): "教师节",
    (10, 1): "国庆节",
    (12, 25): "圣诞节",
}


def get_lunar_date(year: int, month: int, day: int) -> Optional[tuple]:
    """将公历转换为农历日期 (month, day)。超出范围返回 None。"""
    if year < 1900 or year > 2099:
        return None
    ny_month, ny_day = LUNAR_NEW_YEAR.get(year, (None, None))
    if ny_month is None:
        return None
    try:
        ny = date(year, ny_month, ny_day)
        target = date(year, month, day)
        days_diff = (target - ny).days
        # 粗略估算：每年约 354-384 天，用累积天数映射
        # 这里用简化方法：维护一个大致映射
        lunar_months_days = [29, 30] * 6  # 假设平均月长
        offset = days_diff
        m, d = 1, 1
        for lm in range(1, 13):
            ld = lunar_months_days[(lm - 1) % 12]
            if offset < ld:
                d = offset + 1
                m = lm
                break
            offset -= ld
        return (m, d)
    except Exception:
        return None


def get_festival_today(today: date) -> list:
    """获取今天的所有节日名称列表。"""
    festivals = []
    # 公历节日
    key = (today.month, today.day)
    if key in GREGORIAN_FESTIVALS:
        festivals.append(GREGORIAN_FESTIVALS[key])
    # 农历节日
    lunar = get_lunar_date(today.year, today.month, today.day)
    if lunar and lunar in LUNAR_FESTIVALS:
        festivals.append(LUNAR_FESTIVALS[lunar])
    return festivals


def get_lunar_new_year_date(year: int) -> Optional[date]:
    """获取指定年的农历新年日期。"""
    if year < 1900 or year > 2099:
        return None
    ny = LUNAR_NEW_YEAR.get(year)
    if ny is None:
        return None
    try:
        return date(year, ny[0], ny[1])
    except Exception:
        return None


# ---------------------------------------------------------------------------
# State Management
# ---------------------------------------------------------------------------

def get_profile_dir(slug: str) -> Path:
    base = Path(__file__).parent.parent / "profiles" / slug
    base.mkdir(parents=True, exist_ok=True)
    return base


def get_state_path(slug: str) -> Path:
    return get_profile_dir(slug) / "proactive_state.json"


def load_state(slug: str) -> dict:
    path = get_state_path(slug)
    if path.exists():
        try:
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {
        "slug": slug,
        "enabled_features": ["festival", "weather", "anniversary", "recall"],
        "custom_dates": [],
        "last_message_at": None,
        "messages_7d": 0,
        "messages_7d_dates": [],
        "random_recalls_this_month": 0,
        "random_recalls_month": None,
    }


def save_state(slug: str, state: dict) -> None:
    path = get_state_path(slug)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(state, f, ensure_ascii=False, indent=2)


def is_quiet_hours() -> bool:
    """检查当前是否在安静时段（22:30 - 08:30）。"""
    now = datetime.now()
    hour, minute = now.hour, now.minute
    current_minutes = hour * 60 + minute
    quiet_start = 22 * 60 + 30  # 22:30
    quiet_end = 8 * 60 + 30      # 08:30
    if quiet_start > quiet_end:
        # 跨夜
        return current_minutes >= quiet_start or current_minutes <= quiet_end
    return False


def can_send_message(state: dict) -> tuple:
    """检查是否可以发送消息。返回 (can_send, reason)。"""
    today_str = datetime.now().strftime("%Y-%m-%d")

    # 安静时段
    if is_quiet_hours():
        return False, "安静时段（22:30-08:30）"

    # 24小时限制
    last = state.get("last_message_at")
    if last:
        try:
            last_dt = datetime.fromisoformat(last)
            if datetime.now() - last_dt < timedelta(hours=24):
                return False, "24小时内已发过消息"
        except Exception:
            pass

    # 7天限制
    state_7d = state.get("messages_7d_dates", [])
    state_7d = [d for d in state_7d if d >= (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d")]
    if len(state_7d) >= 2:
        return False, "7天内已达2条消息上限"

    return True, ""


def record_message(state: dict) -> dict:
    """记录已发送消息，更新状态。"""
    today_str = datetime.now().strftime("%Y-%m-%d")
    now = datetime.now().isoformat()

    state["last_message_at"] = now

    state_7d = state.get("messages_7d_dates", [])
    state_7d = [d for d in state_7d if d >= (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d")]
    state_7d.append(today_str)
    state["messages_7d_dates"] = state_7d

    return state


# ---------------------------------------------------------------------------
# Message Generation
# ---------------------------------------------------------------------------

def generate_festival_message(slug: str, festival: str) -> str:
    return f"[{festival}快乐] 今天是{festival}，{slug}，愿你今天过得特别。"


def generate_weather_message(slug: str, temp: float, prev_temp: float) -> str:
    diff = abs(temp - prev_temp)
    if temp < prev_temp:
        return f"[天气关心] {slug}，今天降温{diff:.0f}度，记得添衣。"
    else:
        return f"[天气关心] {slug}，今天升温{diff:.0f}度，注意防晒。"


def generate_anniversary_message(slug: str, label: str, days_until: int) -> str:
    if days_until == 0:
        return f"[纪念日] {slug}，今天是「{label}」，记得吗？"
    elif days_until == 1:
        return f"[纪念日] {slug}，明天是「{label}」，要提前准备哦。"
    else:
        return f"[纪念日] {slug}，还有{days_until}天是「{label}」。"


def generate_recall_message(slug: str) -> str:
    return f"[想念] {slug}，想起你了。你最近还好吗？"


def generate_message(slug: str, msg_type: str, **kwargs) -> str:
    generators = {
        "festival": lambda: generate_festival_message(slug, kwargs.get("festival", "")),
        "weather": lambda: generate_weather_message(slug, kwargs.get("temp", 0), kwargs.get("prev_temp", 0)),
        "anniversary": lambda: generate_anniversary_message(slug, kwargs.get("label", ""), kwargs.get("days_until", 0)),
        "recall": lambda: generate_recall_message(slug),
    }
    return generators.get(msg_type, lambda: "[MING]")()


# ---------------------------------------------------------------------------
# Check Logic
# ---------------------------------------------------------------------------

def check_festival(state: dict, slug: str) -> Optional[str]:
    """检查节日问候。"""
    if "festival" not in state.get("enabled_features", []):
        return None
    today = date.today()
    festivals = get_festival_today(today)
    if festivals:
        return generate_message(slug, "festival", festival=festivals[0])
    return None


def check_weather(state: dict, slug: str) -> Optional[str]:
    """检查天气关心（需要外部天气数据）。"""
    if "weather" not in state.get("enabled_features", []):
        return None
    # 尝试读取缓存的天气数据
    cache_path = get_profile_dir(slug) / "weather_cache.json"
    if not cache_path.exists():
        return None  # 无数据，静默跳过
    try:
        with open(cache_path, "r", encoding="utf-8") as f:
            cache = json.load(f)
        today_str = date.today().strftime("%Y-%m-%d")
        if cache.get("date") != today_str:
            return None  # 数据过期
        temp = cache.get("temp")
        prev_temp = cache.get("prev_temp")
        if temp is not None and prev_temp is not None and abs(temp - prev_temp) >= 8:
            return generate_message(slug, "weather", temp=temp, prev_temp=prev_temp)
    except Exception:
        pass
    return None


def check_anniversary(state: dict, slug: str) -> Optional[str]:
    """检查纪念日。"""
    if "anniversary" not in state.get("enabled_features", []):
        return None
    today = date.today()
    custom_dates = state.get("custom_dates", [])
    for item in custom_dates:
        try:
            ann = date.fromisoformat(item["date"])
            days_until = (ann - today).days
            if days_until in (-1, 0, 1):
                return generate_message(slug, "anniversary", label=item.get("label", "纪念日"), days_until=days_until)
        except Exception:
            continue
    return None


def check_recall(state: dict, slug: str) -> Optional[str]:
    """检查随机想念。"""
    if "recall" not in state.get("enabled_features", []):
        return None

    current_month = datetime.now().strftime("%Y-%m")
    recalls_month = state.get("random_recalls_month", "")

    if recalls_month != current_month:
        state["random_recalls_this_month"] = 0
        state["random_recalls_month"] = current_month

    if state.get("random_recalls_this_month", 0) >= 2:
        return None  # 本月已达上限

    # 检查 14 天冷却期
    last = state.get("last_message_at")
    if last:
        try:
            last_dt = datetime.fromisoformat(last)
            if datetime.now() - last_dt < timedelta(days=14):
                return None
        except Exception:
            pass

    # 概率触发（约 30%）
    import random
    if random.random() < 0.3:
        state["random_recalls_this_month"] = state.get("random_recalls_this_month", 0) + 1
        return generate_message(slug, "recall")
    return None


def run_check(slug: str, dry_run: bool = False) -> None:
    """执行主动消息检查。"""
    state = load_state(slug)

    # 收集所有候选消息
    candidates = []
    msg = check_festival(state, slug)
    if msg:
        candidates.append(("festival", msg))

    msg = check_weather(state, slug)
    if msg:
        candidates.append(("weather", msg))

    msg = check_anniversary(state, slug)
    if msg:
        candidates.append(("anniversary", msg))

    msg = check_recall(state, slug)
    if msg:
        candidates.append(("recall", msg))

    if not candidates:
        print("[proactive_scheduler] 无待发送消息。")
        return

    # 全局限制检查
    for msg_type, msg_content in candidates:
        can_send, reason = can_send_message(state)
        if not can_send:
            print(f"[proactive_scheduler] 跳过 ({reason}): {msg_content}")
            continue

        if dry_run:
            print(f"[DRY-RUN] 本应发送: {msg_content}")
        else:
            print(f"[proactive_scheduler] 发送: {msg_content}")
            state = record_message(state)
            save_state(slug, state)


# ---------------------------------------------------------------------------
# CLI Commands
# ---------------------------------------------------------------------------

def cmd_check(slug: str, dry_run: bool) -> None:
    run_check(slug, dry_run=dry_run)


def cmd_list(slug: str) -> None:
    state = load_state(slug)
    print(f"=== {slug} 主动调度状态 ===")
    print(f"启用功能: {state.get('enabled_features', [])}")
    print(f"上次消息: {state.get('last_message_at', '从未发送')}")
    print(f"7天内消息数: {len([d for d in state.get('messages_7d_dates', []) if d >= (datetime.now() - timedelta(days=7)).strftime('%Y-%m-%d')])}")
    print(f"本月随机想念: {state.get('random_recalls_this_month', 0)}/2")
    print(f"自定义纪念日: {len(state.get('custom_dates', []))} 个")
    for item in state.get("custom_dates", []):
        print(f"  - {item['date']}: {item['label']}")


def cmd_config(slug: str, enable: Optional[str], disable: Optional[str]) -> None:
    state = load_state(slug)
    features = set(state.get("enabled_features", []))

    if enable:
        features.add(enable)
        print(f"已启用: {enable}")
    if disable:
        if disable in features:
            features.remove(disable)
        print(f"已禁用: {disable}")

    state["enabled_features"] = sorted(list(features))
    save_state(slug, state)
    print(f"当前启用功能: {state['enabled_features']}")


def cmd_add_date(slug: str, date_str: str, label: str) -> None:
    state = load_state(slug)
    # 验证日期格式
    try:
        parsed = date.fromisoformat(date_str)
    except ValueError:
        print(f"错误: 日期格式无效，请使用 YYYY-MM-DD")
        sys.exit(1)

    custom_dates = state.get("custom_dates", [])
    # 检查是否已存在
    for item in custom_dates:
        if item["date"] == date_str:
            item["label"] = label
            print(f"已更新: {date_str} -> {label}")
            state["custom_dates"] = custom_dates
            save_state(slug, state)
            return

    custom_dates.append({"date": date_str, "label": label})
    state["custom_dates"] = custom_dates
    save_state(slug, state)
    print(f"已添加纪念日: {date_str} ({label})")


# ---------------------------------------------------------------------------
# CLI Entry Point
# ---------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(description="MING 主动行为调度器")
    sub = parser.add_subparsers(dest="command", required=True)

    # check
    p_check = sub.add_parser("check", help="检查并发送主动消息")
    p_check.add_argument("slug", help="MING slug")
    p_check.add_argument("--dry-run", action="store_true", help="仅预览，不发送")

    # list
    p_list = sub.add_parser("list", help="查看调度状态")
    p_list.add_argument("slug", help="MING slug")

    # config
    p_cfg = sub.add_parser("config", help="配置功能开关")
    p_cfg.add_argument("slug", help="MING slug")
    p_cfg.add_argument("--enable", choices=["festival", "weather", "anniversary", "recall"], help="启用功能")
    p_cfg.add_argument("--disable", choices=["festival", "weather", "anniversary", "recall"], help="禁用功能")

    # add-date
    p_date = sub.add_parser("add-date", help="添加自定义纪念日")
    p_date.add_argument("slug", help="MING slug")
    p_date.add_argument("--date", required=True, help="日期 YYYY-MM-DD")
    p_date.add_argument("--label", required=True, help="纪念日名称")

    args = parser.parse_args()

    if args.command == "check":
        cmd_check(args.slug, args.dry_run)
    elif args.command == "list":
        cmd_list(args.slug)
    elif args.command == "config":
        if not args.enable and not args.disable:
            parser.error("至少需要 --enable 或 --disable")
        cmd_config(args.slug, args.enable, args.disable)
    elif args.command == "add-date":
        cmd_add_date(args.slug, args.date, args.label)


if __name__ == "__main__":
    main()
