# api/tests/test_negotiate_request.py
"""验证 NegotiationRequest 接收前端传来的 mbti/interests/voice_text 字段"""
import pytest
from fastapi.testclient import TestClient
from api.frontend_api import router
from fastapi import FastAPI

app = FastAPI()
app.include_router(router)
client = TestClient(app)


def test_negotiate_accepts_mbti_field():
    """验证后端接收 mbti 字段（当前会返回 422 或字段被丢弃）"""
    response = client.post(
        "/api/negotiate",
        json={"mbti": "ENFP", "destination": "chengdu", "buddy_mbti": "INFP"},
    )
    # 如果 422 说明 Pydantic 拒绝了这个字段（bug）
    assert response.status_code == 200, f"mbti 字段被拒绝: {response.json()}"


def test_negotiate_accepts_interests_field():
    """验证后端接收 interests 字段"""
    response = client.post(
        "/api/negotiate",
        json={
            "mbti": "ENFP",
            "interests": ["美食", "摄影"],
            "destination": "chengdu",
            "buddy_mbti": "INFP",
        },
    )
    assert response.status_code == 200


def test_negotiate_accepts_voice_text_field():
    """验证后端接收 voice_text 字段"""
    response = client.post(
        "/api/negotiate",
        json={
            "mbti": "ENFP",
            "voice_text": "我喜欢慢旅行",
            "destination": "chengdu",
            "buddy_mbti": "INFP",
        },
    )
    assert response.status_code == 200


def test_negotiate_uses_mbti_to_build_persona():
    """验证当传入 mbti 时，handler 使用该 mbti 而非默认值 ENFP"""
    response = client.post(
        "/api/negotiate",
        json={"mbti": "INTJ", "destination": "chengdu", "buddy_mbti": "ENFP"},
    )
    assert response.status_code == 200
    result = response.json()
    # meta 里应该有 user_mbti: INTJ
    assert result.get("meta", {}).get("user_mbti") == "INTJ", \
        f"期望 user_mbti=INTJ，实际={result.get('meta')}"
