from fastapi.testclient import TestClient

from api.index import app

client = TestClient(app)


def _seed_profile() -> str:
    response = client.post(
        "/api/profiles",
        json={
            "mbti": "INFJ",
            "travel_range": ["国内"],
            "budget": "舒适",
            "self_desc": "想找节奏稳、聊得来、又能一起吃饭的搭子",
            "city": "深圳",
        },
    )
    user_id = response.json()["data"]["user_id"]
    client.post(
        "/api/security/verify",
        json={
            "user_id": user_id,
            "legal_name": "测试用户",
            "id_number_tail": "7788",
            "face_checked": True,
        },
    )
    return user_id


def test_buddy_inbox_returns_items_for_existing_profile():
    user_id = _seed_profile()
    response = client.get(f"/api/buddies/inbox?user_id={user_id}&page=1")
    assert response.status_code == 200
    items = response.json()["data"]["items"]
    assert len(items) >= 3
    assert items[0]["negotiation_id"].startswith("neg-")


def test_buddy_card_returns_negotiation_summary_and_radar():
    response = client.get("/api/buddies/buddy-001/card?negotiation_id=neg-001")
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["profile"]["buddy_id"] == "buddy-001"
    assert len(data["radar_chart"]) >= 4
    assert data["negotiation_summary"]["match_score"] > 0
