from unittest.mock import patch

from fastapi.testclient import TestClient

from api.index import app

client = TestClient(app)


def _create_profile() -> str:
    response = client.post(
        "/api/profiles",
        json={
            "mbti": "ENFP",
            "travel_range": ["周边城市"],
            "budget": "经济",
            "self_desc": "周末想出去走走，也想吃好吃的",
            "city": "深圳",
        },
    )
    return response.json()["data"]["user_id"]


def test_chat_send_returns_sse_and_persists_history():
    user_id = _create_profile()
    with patch('api.chat.llm_client.chat', return_value='周末可以考虑从深圳出发做一个 2 天 1 夜的轻量路线。'):
        response = client.post(
            "/api/chat/send",
            json={"user_id": user_id, "message": "周末预算 2000 左右怎么玩？"},
        )
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/event-stream")
    assert '"type": "message"' in response.text
    assert '"type": "done"' in response.text

    conversation_id = None
    for line in response.text.splitlines():
        if '"conversation_id"' in line:
            conversation_id = line.split('"conversation_id": "')[1].split('"')[0]
            break
    assert conversation_id

    history = client.get(f"/api/chat/history/{conversation_id}")
    assert history.status_code == 200
    items = history.json()["data"]["items"]
    assert len(items) == 2
    assert items[0]["role"] == "user"
    assert items[1]["role"] == "assistant"


def test_chat_send_uses_llm_reply_when_available():
    user_id = _create_profile()
    with patch('api.chat.llm_client.chat', return_value='可以考虑从深圳出发做一个 2 天 1 夜的顺德慢节奏美食路线。'):
        response = client.post(
            "/api/chat/send",
            json={"user_id": user_id, "message": "第一次见面适合去哪里？"},
        )

    assert response.status_code == 200
    assert '顺德慢节奏美食路线' in response.text


def test_chat_send_falls_back_when_llm_fails():
    user_id = _create_profile()
    with patch('api.chat.llm_client.chat', side_effect=RuntimeError('llm down')):
        response = client.post(
            "/api/chat/send",
            json={"user_id": user_id, "message": "周末预算 2000 左右怎么玩？"},
        )

    assert response.status_code == 200
    assert '预算习惯' in response.text or '预算' in response.text
