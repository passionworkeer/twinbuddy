from fastapi.testclient import TestClient

from api.index import app

client = TestClient(app)


def _seed_profile() -> str:
    response = client.post(
        "/api/profiles",
        json={
            "mbti": "ENFP",
            "travel_range": ["国内"],
            "budget": "经济",
            "self_desc": "想找能一起边走边聊的搭子",
            "city": "深圳",
        },
    )
    return response.json()["data"]["user_id"]


def test_conversations_and_messages_flow():
    user_id = _seed_profile()
    conversations = client.get(f"/api/conversations?user_id={user_id}")
    assert conversations.status_code == 200
    items = conversations.json()["data"]["items"]
    assert len(items) >= 1

    room_id = items[0]["room_id"]
    history = client.get(f"/api/messages/{room_id}?page=1")
    assert history.status_code == 200
    assert len(history.json()["data"]["items"]) >= 1

    sent = client.post(
        "/api/messages",
        json={"room_id": room_id, "sender_id": user_id, "content": "这周末我都可以，想先看路线。", "type": "text"},
    )
    assert sent.status_code == 200
    assert sent.json()["data"]["sender_id"] == user_id
