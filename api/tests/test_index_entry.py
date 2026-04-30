# api/tests/test_index_entry.py
"""验证 api/index.py 是可用的 FastAPI 入口"""
import pytest
from fastapi.testclient import TestClient


def test_index_app_has_all_routes():
    """验证 index.py 注册了所有必要路由"""
    from api.index import app

    routes = [route.path for route in app.routes]
    assert "/api/buddies" in routes, f"缺少 /api/buddies，当前路由: {routes}"
    assert "/api/buddies/inbox" in routes, f"缺少 /api/buddies/inbox，当前路由: {routes}"
    assert "/api/games/blind/start" in routes, f"缺少 /api/games/blind/start，当前路由: {routes}"
    assert "/api/chat/send" in routes, f"缺少 /api/chat/send，当前路由: {routes}"
    assert "/api/conversations" in routes, f"缺少 /api/conversations，当前路由: {routes}"
    assert "/api/messages/{room_id}" in routes, f"缺少 /api/messages/{{room_id}}，当前路由: {routes}"
    assert "/api/security/verify" in routes, f"缺少 /api/security/verify，当前路由: {routes}"
    assert "/api/security/status/{user_id}" in routes, f"缺少 /api/security/status/{{user_id}}，当前路由: {routes}"
    assert "/api/trips/report" in routes, f"缺少 /api/trips/report，当前路由: {routes}"
    assert "/api/trips/{trip_id}/status" in routes, f"缺少 /api/trips/{{trip_id}}/status，当前路由: {routes}"
    assert "/api/posts/feed" in routes, f"缺少 /api/posts/feed，当前路由: {routes}"
    assert "/api/posts/{post_id}/comments" in routes, f"缺少 /api/posts/{{post_id}}/comments，当前路由: {routes}"
    assert "/api/persona" in routes, f"缺少 /api/persona，当前路由: {routes}"
    assert "/api/profiles" in routes, f"缺少 /api/profiles，当前路由: {routes}"
    assert "/api/negotiate" in routes, f"缺少 /api/negotiate，当前路由: {routes}"
    assert "/api/health" in routes, f"缺少 /api/health，当前路由: {routes}"


def test_stt_routes_registered():
    """验证 STT 路由已注册无双前缀"""
    from api.index import app
    routes = {route.path for route in app.routes}
    assert "/api/api/stt/recognize" not in routes, "STT 路由有双前缀 /api/api/"
    assert "/api/stt/recognize" in routes or "/api/stt/ws" in routes
