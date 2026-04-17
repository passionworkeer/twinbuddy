"""
Minimal langgraph.graph stub — sufficient for matching_graph.py to run demo
in environments without network.  Replace with real langgraph via pip install.
"""
from __future__ import annotations

import sys as _sys
from typing import Callable, Any

# ── add_messages reducer ──────────────────────────────────────────────────────


class add_messages:
    """Minimal add_messages reducer (list-append semantics)."""
    def __call__(self, existing: list, updates: list) -> list:
        return (existing or []) + (updates or [])


# ── StateGraph builder ───────────────────────────────────────────────────────


class StateGraph:
    def __init__(self, state_schema: type):
        self.state_schema = state_schema
        self.nodes: dict[str, Callable] = {}
        self.edges: dict[str, list[str]] = {}
        self.conditional_edges: dict[str, dict] = {}

    def add_node(self, name: str, fn: Callable) -> None:
        self.nodes[name] = fn

    def add_edge(self, from_node: str, to_node: str) -> None:
        self.edges.setdefault(from_node, []).append(to_node)

    def add_conditional_edges(
        self,
        from_node: str,
        condition_fn: Callable,
        routing_map: dict[str, str],
    ) -> None:
        self.conditional_edges[from_node] = {
            "fn": condition_fn,
            "map": routing_map,
        }

    def compile(self) -> "CompiledGraph":
        return CompiledGraph(self)


# ── Compiled graph runner ────────────────────────────────────────────────────


class CompiledGraph:
    """
    Sequential graph simulator — walks the graph node-by-node,
    applies conditional routing, accumulates state changes.
    """

    def __init__(self, builder: StateGraph):
        self.builder = builder

    def invoke(self, state: Any) -> Any:
        nodes = self.builder.nodes
        edges = self.builder.edges
        cond_edges = self.builder.conditional_edges

        # Find root nodes (nodes with no incoming edges)
        incoming: dict[str, list[str]] = {}
        for _from, targets in edges.items():
            for t in targets:
                incoming.setdefault(t, []).append(_from)
        for cfrom in cond_edges:
            for t in cond_edges[cfrom]["map"].values():
                incoming.setdefault(t, []).append(cfrom)

        root_nodes = [
            n for n in nodes
            if n != START and n != END and n not in incoming
        ]
        if not root_nodes:
            root_nodes = [list(nodes.keys())[0]]

        queue: list[str] = list(root_nodes)
        visited: set[str] = set()

        while queue:
            node = queue.pop(0)
            if node in visited or node == END or node not in nodes:
                continue
            visited.add(node)

            fn = nodes[node]
            state = fn(state)

            # Route to next node(s)
            next_nodes: list[str] = []
            if node in edges:
                next_nodes = list(edges[node])
            elif node in cond_edges:
                cfg = cond_edges[node]
                key = cfg["fn"](state)
                mapped = cfg["map"].get(key, key)
                next_nodes = [mapped] if isinstance(mapped, str) else list(mapped)
            else:
                next_nodes = []

            queue = next_nodes + queue

        return state


# ── Constants ─────────────────────────────────────────────────────────────────

START = "__start__"
END = "__end__"
