from fastapi.testclient import TestClient

from api.index import app

client = TestClient(app)


def _create_verified_profile() -> str:
    response = client.post(
        "/api/profiles",
        json={
            "mbti": "INFJ",
            "travel_range": ["国内"],
            "budget": "舒适",
            "self_desc": "想找一个节奏稳定又能一起吃饭的搭子",
            "city": "深圳",
        },
    )
    user_id = response.json()["data"]["user_id"]
    client.post(
        "/api/security/verify",
        json={
            "user_id": user_id,
            "legal_name": "陈小雨",
            "id_number_tail": "5678",
            "face_checked": True,
        },
    )
    return user_id


def test_trip_report_can_be_created_and_queried():
    user_a_id = _create_verified_profile()
    user_b_id = _create_verified_profile()

    report_response = client.post(
        "/api/trips/report",
        json={
            "user_a_id": user_a_id,
            "user_b_id": user_b_id,
            "destination": "顺德",
            "depart_date": "2026-05-01",
            "return_date": "2026-05-03",
            "emergency_contact_name": "李阿姨",
            "emergency_contact_phone": "13800138000",
        },
    )
    assert report_response.status_code == 200
    payload = report_response.json()["data"]
    assert payload["emergency_notification_sent"] is True
    assert payload["destination"] == "顺德"

    status_response = client.get(f"/api/trips/{payload['trip_id']}/status")
    assert status_response.status_code == 200
    status_payload = status_response.json()["data"]
    assert status_payload["status"] == "reported"
    assert status_payload["emergency_contact_masked"].endswith("8000")
