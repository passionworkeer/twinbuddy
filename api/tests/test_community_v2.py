from fastapi.testclient import TestClient

from api.index import app

client = TestClient(app)


def _create_profile() -> str:
    response = client.post(
        "/api/profiles",
        json={
            "mbti": "ISFP",
            "travel_range": ["周边城市", "国内"],
            "budget": "经济",
            "self_desc": "喜欢边走边拍，也愿意留一点自由时间",
            "city": "深圳",
        },
    )
    return response.json()["data"]["user_id"]


def test_community_feed_prefers_same_city_posts():
    user_id = _create_profile()
    response = client.get(f"/api/posts/feed?user_id={user_id}&page=1")
    assert response.status_code == 200
    items = response.json()["data"]["items"]
    assert len(items) >= 2
    assert items[0]["location"] == "深圳"


def test_create_like_comment_and_twin_chat_for_post():
    user_id = _create_profile()
    create_response = client.post(
        "/api/posts",
        json={
            "user_id": user_id,
            "content": "五一想去顺德吃吃逛逛，找一个不赶行程的搭子。",
            "images": [],
            "tags": ["顺德", "美食", "五一"],
            "location": "深圳",
            "is_travel_plan": True,
            "trip_date": "2026-05-01",
            "trip_days": 3,
            "trip_budget": "舒适",
        },
    )
    assert create_response.status_code == 200
    post_id = create_response.json()["data"]["id"]

    like_response = client.post(f"/api/posts/{post_id}/like", json={"user_id": user_id})
    assert like_response.status_code == 200
    assert like_response.json()["data"]["liked"] is True

    comment_response = client.post(
        f"/api/posts/{post_id}/comments",
        json={"user_id": user_id, "content": "我也偏向吃饭优先，节奏别太赶。"},
    )
    assert comment_response.status_code == 200
    assert comment_response.json()["data"]["content"].startswith("我也")

    twin_chat_response = client.post(f"/api/posts/{post_id}/twin-chat", json={"user_id": user_id})
    assert twin_chat_response.status_code == 200
    twin_payload = twin_chat_response.json()["data"]
    assert twin_payload["status"] == "queued"
    assert "代聊" in twin_payload["summary"]
