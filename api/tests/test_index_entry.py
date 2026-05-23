from __future__ import annotations

import importlib
import os
import sys

from fastapi.middleware.cors import CORSMiddleware


def _reload_index_module(monkeypatch, origins: str | None = None, vercel: str | None = None):
    if origins is None:
        monkeypatch.delenv("CORS_ALLOW_ORIGINS", raising=False)
    else:
        monkeypatch.setenv("CORS_ALLOW_ORIGINS", origins)

    if vercel is None:
        monkeypatch.delenv("VERCEL", raising=False)
    else:
        monkeypatch.setenv("VERCEL", vercel)

    sys.modules.pop("api.index", None)
    module = importlib.import_module("api.index")
    return module


def _get_cors_origins(app):
    for middleware in app.user_middleware:
        if middleware.cls is CORSMiddleware:
            return middleware.kwargs["allow_origins"]
    raise AssertionError("CORSMiddleware not found")


def test_index_app_has_all_routes():
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
    from api.index import app

    routes = {route.path for route in app.routes}
    assert "/api/api/stt/recognize" not in routes, "STT 路由有双前缀 /api/api/"
    assert "/api/stt/recognize" in routes or "/api/stt/ws" in routes


def test_cors_defaults_to_local_dev_origins(monkeypatch):
    module = _reload_index_module(monkeypatch)
    origins = _get_cors_origins(module.app)

    assert origins == [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]


def test_cors_uses_configured_origins(monkeypatch):
    module = _reload_index_module(
        monkeypatch,
        origins="https://app.example.com, https://admin.example.com",
    )
    origins = _get_cors_origins(module.app)

    assert origins == [
        "https://app.example.com",
        "https://admin.example.com",
    ]


def test_cors_does_not_fallback_to_wildcard_on_vercel(monkeypatch):
    module = _reload_index_module(monkeypatch, vercel="1")
    origins = _get_cors_origins(module.app)

    assert origins == []
    assert "*" not in origins
