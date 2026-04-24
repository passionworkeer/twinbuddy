# api/tests/test_index_entry.py
"""验证 api/index.py 是可用的 FastAPI 入口"""
import pytest
from fastapi.testclient import TestClient


def test_index_app_has_all_routes():
    """验证 index.py 注册了所有必要路由"""
    from api.index import app

    routes = [route.path for route in app.routes]
    assert "/api/feed" in routes, f"缺少 /api/feed，当前路由: {routes}"
    assert "/api/buddies" in routes, f"缺少 /api/buddies，当前路由: {routes}"
    assert "/api/negotiate" in routes, f"缺少 /api/negotiate，当前路由: {routes}"


def test_stt_routes_registered():
    """验证 STT 路由已注册无双前缀"""
    from api.index import app
    routes = {route.path for route in app.routes}
    assert "/api/api/stt/recognize" not in routes, "STT 路由有双前缀 /api/api/"
    assert "/api/stt/recognize" in routes or "/api/stt/ws" in routes
