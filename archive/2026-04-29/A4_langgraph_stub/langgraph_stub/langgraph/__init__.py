# -*- coding: utf-8 -*-
"""
Minimal langgraph stub package — sufficient for matching_graph.py to import
and run demo in environments without network access.
Replace with:  pip install langgraph langchain-core langchain-community
"""
from .graph import StateGraph, START, END, add_messages

__all__ = ["StateGraph", "START", "END", "add_messages"]
