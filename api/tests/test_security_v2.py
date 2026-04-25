from fastapi.testclient import TestClient

from api.index import app

client = TestClient(app)


def _create_profile(mbti: str = "INFJ") -> str:
    response = client.post(
        "/api/profiles",
        json={
            "mbti": mbti,
            "travel_range": ["国内"],
            "budget": "舒适",
            "self_desc": "想找一个节奏稳定又好沟通的旅行搭子",
            "city": "深圳",
        },
    )
    return response.json()["data"]["user_id"]


def test_buddy_inbox_requires_verification():
    user_id = _create_profile()
    response = client.get(f"/api/buddies/inbox?user_id={user_id}&page=1")
    assert response.status_code == 403
    assert "实名认证" in response.json()["detail"]


def test_security_verify_updates_profile_and_status():
    user_id = _create_profile("ENFP")
    verify_response = client.post(
        "/api/security/verify",
        json={
            "user_id": user_id,
            "legal_name": "王小明",
            "id_number_tail": "1234",
            "face_checked": True,
        },
    )
    assert verify_response.status_code == 200
    payload = verify_response.json()["data"]
    assert payload["is_verified"] is True
    assert payload["real_name_masked"].startswith("王")

    status_response = client.get(f"/api/security/status/{user_id}")
    assert status_response.status_code == 200
    status_payload = status_response.json()["data"]
    assert status_payload["verification_status"] == "verified"
    assert status_payload["id_number_tail"] == "1234"

    inbox_response = client.get(f"/api/buddies/inbox?user_id={user_id}&page=1")
    assert inbox_response.status_code == 200
    assert len(inbox_response.json()["data"]["items"]) >= 1
