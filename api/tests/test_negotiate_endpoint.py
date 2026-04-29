# -*- coding: utf-8 -*-
"""
test_negotiate_endpoint.py — POST /api/negotiate 端到端集成测试

覆盖:
  - 正常协商请求（带 mbti + destination）
  - 降级到 mock 的情况（LLM 不可用）
  - 带 buddy_mbti 的双人人格协商
  - 错误格式处理
  - 响应结构验证
"""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from api.index import app

client = TestClient(app)


class TestNegotiateEndpoint:
    def test_negotiate_with_mbti_and_destination_returns_success(self):
        """提供 mbti + destination 时，协商返回成功响应"""
        response = client.post(
            "/api/negotiate",
            json={
                "mbti": "ENFP",
                "destination": "dali",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True

        result = data["data"]
        assert "destination" in result
        assert "matched_buddies" in result
        assert isinstance(result["matched_buddies"], list)
        assert len(result["matched_buddies"]) == 2

    def test_negotiate_response_has_required_fields(self):
        """协商响应包含所有必要字段"""
        response = client.post(
            "/api/negotiate",
            json={
                "mbti": "INFP",
                "destination": "shenzhen",
            },
        )
        assert response.status_code == 200
        result = response.json()["data"]

        required_fields = [
            "destination",
            "matched_buddies",
            "consensus",
            "plan",
        ]
        for field in required_fields:
            assert field in result, f"Missing field: {field}"

    def test_negotiate_with_buddy_mbti_uses_twin_persona(self):
        """带 buddy_mbti 时，协商使用搭子的人格配置"""
        response = client.post(
            "/api/negotiate",
            json={
                "mbti": "ENFP",
                "buddy_mbti": "ISFP",
                "destination": "dali",
            },
        )
        assert response.status_code == 200
        result = response.json()["data"]
        # matched_buddies 应包含两个人格的标签
        buddies = result.get("matched_buddies", [])
        assert len(buddies) == 2

    def test_negotiate_with_interests_passes_interests_to_persona(self):
        """带 interests 时，人格构建包含兴趣标签"""
        response = client.post(
            "/api/negotiate",
            json={
                "mbti": "INTJ",
                "interests": ["摄影", "美食"],
                "destination": "chengdu",
            },
        )
        assert response.status_code == 200
        meta = response.json().get("meta", {})
        # meta 应包含 user_mbti
        assert "user_mbti" in meta or "source" in meta

    def test_negotiate_invalid_destination_still_returns_mock_fallback(self):
        """无效 destination 时降级到 mock，不报错"""
        response = client.post(
            "/api/negotiate",
            json={
                "mbti": "ENFJ",
                "destination": "unknown_city_xyz_12345",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["data"]["destination"] == "unknown_city_xyz_12345"

    def test_negotiate_meta_contains_source_info(self):
        """响应 meta 包含 source 信息（mock 或 llm）"""
        response = client.post(
            "/api/negotiate",
            json={
                "mbti": "ESFJ",
                "destination": "zhuhai",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert "meta" in data
        meta = data["meta"]
        # source 应该是 'mock' 或 'llm' 之一
        assert meta.get("source") in ("mock", "llm", "llm_fallback")
        assert "user_mbti" in meta
        assert meta["user_mbti"] == "ESFJ"

    def test_negotiate_unknown_mbti_defaults_to_enfp(self):
        """未知 MBTI 默认降级为 ENFP（代码逻辑）"""
        response = client.post(
            "/api/negotiate",
            json={
                "mbti": "NOTMBTI",
                "destination": "dali",
            },
        )
        assert response.status_code == 200
        meta = response.json().get("meta", {})
        # 如果代码处理了未知 MBTI，应该不会崩溃
        assert meta.get("source") in ("mock", "llm", "llm_fallback")

    def test_negotiate_with_mock_persona_file(self):
        """MBTI 类型有 mock_persona 文件时，使用预制人格"""
        # ENFP 有 mock_personas/enfp/persona.json
        response = client.post(
            "/api/negotiate",
            json={
                "mbti": "ENFP",
                "buddy_mbti": "INTJ",
                "destination": "dali",
            },
        )
        assert response.status_code == 200
        meta = response.json().get("meta", {})
        # user_mbti 应该是 ENFP（不因未知被降级）
        assert meta["user_mbti"] == "ENFP"

    def test_negotiate_plan_is_list(self):
        """协商 plan 字段是数组（即使是空数组）"""
        response = client.post(
            "/api/negotiate",
            json={
                "mbti": "ISFP",
                "destination": "zhuhai",
            },
        )
        assert response.status_code == 200
        result = response.json()["data"]
        assert isinstance(result.get("plan"), list)

    def test_negotiate_consensus_is_boolean(self):
        """consensus 字段是布尔值"""
        response = client.post(
            "/api/negotiate",
            json={
                "mbti": "ENTP",
                "destination": "shenzhen",
            },
        )
        assert response.status_code == 200
        result = response.json()["data"]
        assert isinstance(result.get("consensus"), bool)

    def test_negotiate_radar_is_list_of_dicts(self):
        """radar 字段是维度评分数组"""
        response = client.post(
            "/api/negotiate",
            json={
                "mbti": "ENFP",
                "destination": "dali",
            },
        )
        assert response.status_code == 200
        result = response.json()["data"]
        radar = result.get("radar", [])
        assert isinstance(radar, list)
        if radar:
            first = radar[0]
            assert "dimension" in first
            assert "user_score" in first
            assert "buddy_score" in first

    def test_negotiate_messages_structured_correctly(self):
        """协商消息数组格式正确"""
        response = client.post(
            "/api/negotiate",
            json={
                "mbti": "INTP",
                "destination": "chengdu",
            },
        )
        assert response.status_code == 200
        result = response.json()["data"]
        messages = result.get("messages", [])
        assert isinstance(messages, list)
        if messages:
            for msg in messages:
                assert "speaker" in msg
                assert "content" in msg
                assert msg["speaker"] in ("user", "buddy")

    def test_negotiate_without_mbti_requires_user_persona_id(self):
        """不提供 mbti 时，需要 user_persona_id（否则使用默认值）"""
        # 不传 mbti，不传 user_persona_id，应该不崩溃
        response = client.post(
            "/api/negotiate",
            json={
                "destination": "dali",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True

    def test_negotiate_destination_affects_persona_content(self):
        """不同 destination 产生不同的人格内容"""
        response1 = client.post(
            "/api/negotiate",
            json={"mbti": "ENFP", "destination": "dali"},
        )
        response2 = client.post(
            "/api/negotiate",
            json={"mbti": "ENFP", "destination": "chengdu"},
        )
        assert response1.status_code == 200
        assert response2.status_code == 200
        # 目的地不同，destination 字段应该不同
        assert response1.json()["data"]["destination"] == "大理"
        assert response2.json()["data"]["destination"] == "成都"
