# -*- coding: utf-8 -*-
"""
matching_graph.py — TwinBuddy MVP
LangGraph StateGraph for the companion-matching negotiation pipeline.

Graph Flow
──────────
  input_node
      ↓
  parse_preferences
      ↓
  match_candidates
      ↓
  agent_negotiation  ←─┐ (loop up to 3 rounds)
      ↓               │
  output_result       │
  ────────────────────┘ (consensus reached → output)
  (no consensus after 3 rounds → output "未能达成共识")
"""

from __future__ import annotations

import json
import textwrap
from dataclasses import dataclass, field
from typing import Annotated


from buddy_agent import BuddyAgent
from twinbuddy.agents.buddies import get_all_buddies
from twinbuddy.agents.scoring import score_compatibility

# ── Schema ───────────────────────────────────────────────────────────────────

MAX_ROUNDS = 3


@dataclass
class NegotiationRound:
    round_num: int
    proposals: list[dict] = field(default_factory=list)
    """Each dict: {agent_id, agent_name, content}"""
    reactions: list[dict] = field(default_factory=list)
    """Each dict: {from_agent, to_agent, content}"""
    concessions: list[dict] = field(default_factory=list)
    """Each dict: {agent_id, content}"""


@dataclass
class GraphState:
    messages: Annotated[list, add_messages]
    # Input
    user_persona: dict = field(default_factory=dict)
    destination: str = ""
    dates: str = ""
    budget: str = ""
    # Parsed
    parsed_preferences: dict = field(default_factory=dict)
    # Matching
    candidates: list[dict] = field(default_factory=list)
    # Negotiation
    negotiation_round: int = 0
    negotiation_rounds: list[NegotiationRound] = field(default_factory=list)
    consensus_reached: bool = False
    final_plan: str = ""
    # Meta
    error: str = ""


# ── Nodes ────────────────────────────────────────────────────────────────────


def input_node(state: GraphState) -> GraphState:
    """
    Validate and normalise the raw user input payload.
    Accepts a dict with keys: mbti, travel_style, likes, dislikes,
    destination, dates, budget.
    """
    raw = state.user_persona
    if not raw:
        state.error = "user_persona is required"
        return state

    # Ensure required fields
    required = ["mbti", "travel_style", "destination"]
    for key in required:
        if key not in raw or not raw[key]:
            state.error = f"Missing required field: {key}"
            return state  # early return on first missing required field

    # Normalise budget / dates
    if "budget" not in raw or not raw["budget"]:
        raw["budget"] = "3000-5000元"
    if "dates" not in raw or not raw["dates"]:
        raw["dates"] = "待定"

    state.destination = raw["destination"]
    state.dates = raw.get("dates", "待定")
    state.budget = raw.get("budget", "3000-5000元")

    return state


def parse_preferences(state: GraphState) -> GraphState:
    """
    Parse raw MBTI + AI chat record data into a structured preference dict.
    In a real system this would call an LLM. Here we do simple extraction.
    """
    raw = state.user_persona
    parsed = {
        "mbti": raw.get("mbti", ""),
        "travel_style": raw.get("travel_style", ""),
        "likes": raw.get("likes", []),
        "dislikes": raw.get("dislikes", []),
        "budget": raw.get("budget", ""),
        "pace": raw.get("pace", ""),
        "destination": state.destination,
        "dates": state.dates,
    }
    state.parsed_preferences = parsed
    return state


def match_candidates(state: GraphState) -> GraphState:
    """
    Score all buddies against the parsed preferences
    and pick the top 3 candidates.
    """
    prefs = state.parsed_preferences
    buddies = get_all_buddies()
    scored = []
    for buddy in buddies:
        score = score_compatibility(prefs, buddy)
        scored.append((score, buddy))

    # Sort descending, take top 3
    scored.sort(key=lambda x: x[0], reverse=True)
    top3 = [buddy for _, buddy in scored[:3]]

    state.candidates = top3
    return state


def agent_negotiation(state: GraphState) -> GraphState:
    """
    Run one round of multi-agent negotiation.
    Each candidate becomes a BuddyAgent, proposes a plan,
    evaluates others, and responds to pressure.
    Results are accumulated in negotiation_rounds.
    """
    state.negotiation_round += 1
    round_num = state.negotiation_round

    candidates = state.candidates
    if not candidates:
        state.error = "No candidates to negotiate with"
        return state

    # Instantiate BuddyAgents
    agents = {b["id"]: BuddyAgent(b) for b in candidates}

    # Build context for proposals
    context = {
        "destination": state.destination,
        "user_preferences": state.parsed_preferences,
        "other_proposals": [],
        "dates": state.dates,
        "budget": state.budget,
    }

    round_record = NegotiationRound(round_num=round_num)

    # ── Phase 1: Each agent proposes ──────────────────────────────────────
    proposals = []
    for buddy in candidates:
        agent = agents[buddy["id"]]
        proposal_text = agent.propose(context, round_num)
        proposals.append({
            "agent_id": buddy["id"],
            "agent_name": buddy["name"],
            "content": proposal_text,
        })
        round_record.proposals.append({
            "agent_id": buddy["id"],
            "agent_name": buddy["name"],
            "content": proposal_text,
        })
        # Update context so later agents see earlier proposals
        context["other_proposals"] = proposals.copy()

    # ── Phase 2: Each agent evaluates all others ──────────────────────────
    reactions = []
    for buddy in candidates:
        agent = agents[buddy["id"]]
        for other in candidates:
            if other["id"] == buddy["id"]:
                continue
            # Find the other agent's proposal
            other_proposal = next(
                (p["content"] for p in proposals if p["agent_id"] == other["id"]),
                "",
            )
            reaction = agent.evaluate(
                other_proposal, other["name"], round_num
            )
            reactions.append({
                "from_agent": buddy["id"],
                "from_name": buddy["name"],
                "to_agent": other["id"],
                "to_name": other["name"],
                "content": reaction,
            })
            round_record.reactions.append({
                "from_agent": buddy["id"],
                "from_name": buddy["name"],
                "to_agent": other["id"],
                "to_name": other["name"],
                "content": reaction,
            })

    # ── Phase 3: Pressure round (if consensus not reached) ────────────────
    concessions = []
    # Simulate pressure: agents in higher-pressure environments concede
    pressure_map = {
        "ENFP": "快做决定吧我不想一直讨论！",
        "ISTJ": "时间不多了，请给出最终立场。",
        "INFP": "大家有分歧怎么办…",
        "ESTJ": "现在！给我最终方案！",
        "ISFP": "你们别吵了…",
        "ENTJ": "我们需要快速决策。",
        "ESFJ": "别吵别吵，我们和好吧！",
        "INTJ": "逻辑上讲，我们需要共识。",
        "ENTP": "出新招！看看你们还跟不跟！",
        "ISFJ": "大家都退一步好不好…",
    }

    # Only trigger concessions in rounds 2+
    if round_num >= 2:
        for buddy in candidates:
            agent = agents[buddy["id"]]
            pressure = pressure_map.get(buddy["mbti"], "请给出最终回应。")
            concession = agent.concede(pressure, round_num)
            concessions.append({
                "agent_id": buddy["id"],
                "agent_name": buddy["name"],
                "content": concession,
            })
            round_record.concessions.append({
                "agent_id": buddy["id"],
                "agent_name": buddy["name"],
                "content": concession,
            })

    # ── Check consensus ──────────────────────────────────────────────────
    # Simple heuristic: no agent strongly rejected another's proposal
    # AND at least 2 agents accepted others' plans
    acceptance_count = sum(
        1 for r in reactions
        if any(kw in r["content"] for kw in ["同意", "没问题", "没问题", "喜欢", "支持"])
    )
    rejection_count = sum(
        1 for r in reactions
        if any(kw in r["content"] for kw in ["不接受", "不行", "接受不了", "拒绝", "不可以"])
    )

    # Consensus: majority accepts, few rejections
    if acceptance_count >= len(candidates) and rejection_count == 0:
        state.consensus_reached = True
        state.final_plan = _build_final_plan(state.destination, state.dates, state.budget, candidates)
    else:
        state.consensus_reached = False
        if round_num >= MAX_ROUNDS:
            state.final_plan = _build_no_consensus_plan(state.destination, candidates)

    state.negotiation_rounds.append(round_record)
    return state


def output_result(state: GraphState) -> GraphState:
    """
    Final formatting node — produces the structured itinerary output.
    """
    if state.error:
        state.messages = [
            {"role": "system", "content": f"Error: {state.error}"}
        ]
        return state

    output = _format_output(state)
    state.messages = [{"role": "system", "content": output}]
    return state


# ── Conditional routing ──────────────────────────────────────────────────────


def should_continue_negotiation(state: GraphState) -> str:
    """
    Route after agent_negotiation:
      - consensus reached → output_result
      - rounds < MAX_ROUNDS → agent_negotiation (loop)
      - rounds >= MAX_ROUNDS → output_result
    """
    if state.consensus_reached:
        return "output_result"
    if state.negotiation_round >= MAX_ROUNDS:
        return "output_result"
    return "agent_negotiation"


# ── Graph assembly ────────────────────────────────────────────────────────────


def build_matching_graph() -> StateGraph:
    """Build and return the compiled matching StateGraph."""
    try:
        from langgraph.graph import StateGraph, END
        from langgraph.graph import add_messages
    except ImportError:
        from twinbuddy.agents.langgraph_stub.langgraph.graph import StateGraph, END
        from twinbuddy.agents.langgraph_stub.langgraph.graph import add_messages
    builder = StateGraph(GraphState)

    builder.add_node("input_node", input_node)
    builder.add_node("parse_preferences", parse_preferences)
    builder.add_node("match_candidates", match_candidates)
    builder.add_node("agent_negotiation", agent_negotiation)
    builder.add_node("output_result", output_result)

    builder.add_edge(START, "input_node")
    builder.add_edge("input_node", "parse_preferences")
    builder.add_edge("parse_preferences", "match_candidates")
    builder.add_edge("match_candidates", "agent_negotiation")

    builder.add_conditional_edges(
        "agent_negotiation",
        should_continue_negotiation,
        {
            "agent_negotiation": "agent_negotiation",
            "output_result": "output_result",
        },
    )

    builder.add_edge("output_result", END)
    return builder


# ── Output formatters ─────────────────────────────────────────────────────────


def _build_final_plan(
    destination: str, dates: str, budget: str, candidates: list[dict]
) -> str:
    names = ", ".join(b["name"] for b in candidates)
    plan = textwrap.dedent(f"""\
        ===============================================
        搭子协商完成 · 达成共识！
        ===============================================

        目的地：{destination}
        出发日期：{dates}
        预算：{budget}
        搭子：{names}

        ── 行程安排 ───────────────────────────────────

        D1 抵达日
        • 接机/接站 → 入住春熙路/太古里附近
        • 傍晚：宽窄巷子闲逛，感受成都慢生活
        • 晚上：蜀九香/大龙燚火锅，品尝正宗川味

        D2 熊猫线
        • 08:00 熊猫基地（建议提前预约）
        • 12:00 东郊记忆（文艺园区，拍照好机位）
        • 晚上：339电视塔/玉林路小酒馆

        D3 文化线
        • 上午：武侯祠（红墙竹影，超出片）
        • 下午：锦里古街（人从众，但值得一看）
        • 晚上：九眼桥/安顺廊桥夜景

        D4 周边游
        • 方案A：都江堰青城山（世界遗产，文化之旅）
        • 方案B：三星堆博物馆（神秘古蜀文明）
        • 晚上：建设路小吃街 / 回程

        D5 返程日
        • 睡到自然醒 → 人民公园鹤鸣茶社喝盖碗茶
        • 买点伴手礼（张飞牛肉、郫县豆瓣）
        • 返程

        ── 注意事项 ───────────────────────────────────
        • 成都夏季多雨，随身带伞
        • 火锅微辣以上，外地朋友提前准备肠胃药
        • 熊猫基地早上去熊猫最活跃
        • 锦里晚上去更有氛围
        ===============================================
        """).strip()
    return plan


def _build_no_consensus_plan(
    destination: str, candidates: list[dict]
) -> str:
    names = ", ".join(b["name"] for b in candidates)
    return textwrap.dedent(f"""\
        ===============================================
        未能达成共识
        ===============================================

        经过 {MAX_ROUNDS} 轮协商，{names} 未能就【{destination}】的行程达成完全一致。

        建议：可由主用户基于各搭子的最终立场，
        手动协调或再次发起讨论。

        各搭子最终立场摘要：
        {chr(10).join(f'  • {b["name"]}（{b["mbti"]}）: {b.get("negotiation_style", "")}' for b in candidates)}
        ===============================================
        """).strip()


def _format_output(state: GraphState) -> str:
    """Format the complete negotiation transcript + final result."""
    lines = ["=" * 54, "TwinBuddy · 搭子协商系统 · 完整报告", "=" * 54]

    # Candidates
    lines.append(f"\n【匹配结果】Top {len(state.candidates)} 候选搭子：")
    for i, b in enumerate(state.candidates, 1):
        lines.append(
            f"  {i}. {b['name']} | MBTI: {b['mbti']} | "
            f"风格: {b['travel_style']}"
        )
        lines.append(f"     喜欢: {', '.join(b['preferences']['likes'][:3])}")

    # Negotiation rounds
    for rnd in state.negotiation_rounds:
        lines.append(f"\n{'─' * 54}")
        lines.append(f"【第 {rnd.round_num} 轮协商】")
        lines.append(f"\n  ▼ 提案阶段：")
        for p in rnd.proposals:
            lines.append(f"\n  [{p['agent_name']}] 提出：")
            # Indent proposal content
            for line in p["content"].split("\n"):
                lines.append(f"    {line}")

        if rnd.reactions:
            lines.append(f"\n  ▼ 评价阶段：")
            for r in rnd.reactions:
                lines.append(
                    f"    {r['from_name']} → {r['to_name']}: "
                    f"{r['content'][:80]}"
                )

        if rnd.concessions:
            lines.append(f"\n  ▼ 让步/压力阶段：")
            for c in rnd.concessions:
                lines.append(f"    [{c['agent_name']}]: {c['content'][:80]}")

    # Final plan
    lines.append(f"\n{'=' * 54}")
    lines.append("【最终输出】")
    lines.append(state.final_plan)
    return "\n".join(lines)


# ── Demo ──────────────────────────────────────────────────────────────────────


def demo_negotiation():
    """
    Hardcoded demo: ENFP user + 成都.
    Runs the full graph and prints the negotiation transcript + result.
    """
    # ENFP user persona — likes food & photos, dislikes rushing
    user_persona = {
        "mbti": "ENFP",
        "travel_style": "慢悠悠旅游，喜欢美食和拍照，不喜欢暴走赶景点",
        "likes": ["美食", "拍照", "咖啡馆", "人文景点", "夜市"],
        "dislikes": ["暴走", "早起", "军事化行程", "无意义的排队"],
        "budget": "4000-6000元",
        "pace": "慢悠悠，不想累着",
        "destination": "成都",
        "dates": "2024-07-15 ~ 2024-07-19",
    }

    initial_state = GraphState(user_persona=user_persona)

    graph = build_matching_graph()
    compiled = graph.compile()

    print("\n" + "=" * 54)
    print("TwinBuddy 搭子协商系统 · 演示")
    print("=" * 54)
    print(f"用户: ENFP | 目的地: 成都 | 预算: {user_persona['budget']}")
    print(f"偏好: {', '.join(user_persona['likes'][:3])}")
    print(f"不喜: {', '.join(user_persona['dislikes'][:2])}")
    print("=" * 54 + "\n")

    result = compiled.invoke(initial_state)

    print(result["messages"][-1]["content"])
    return result


if __name__ == "__main__":
    demo_negotiation()
