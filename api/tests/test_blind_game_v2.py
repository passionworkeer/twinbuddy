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
            "self_desc": "想找能一起吃饭也能一起散步的搭子",
            "city": "深圳",
        },
    )
    return response.json()["data"]["user_id"]


def test_blind_game_flow_report_available_after_all_answers():
    user_id = _seed_profile()
    start = client.post(
        "/api/games/blind/start",
        json={"user_id": user_id, "negotiation_id": "neg-001"},
    )
    assert start.status_code == 200
    rounds = start.json()["data"]["rounds"]
    game_id = start.json()["data"]["game_id"]
    assert len(rounds) == 6

    for round_data in rounds:
        answer = client.post(
            "/api/games/blind/answer",
            json={"game_id": game_id, "round_id": round_data["id"], "choice": "A"},
        )
        assert answer.status_code == 200

    report = client.get(f"/api/games/blind/{game_id}/report")
    assert report.status_code == 200
    data = report.json()["data"]
    assert data["match_score"] >= 0
    assert len(data["per_round_result"]) == 6
