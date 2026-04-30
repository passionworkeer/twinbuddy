from fastapi.testclient import TestClient

from api.index import app

client = TestClient(app)


def test_create_and_get_profile_v2():
    create_response = client.post(
        "/api/profiles",
        json={
            "mbti": "enfp",
            "travel_range": ["周边城市", "国内"],
            "budget": "经济",
            "self_desc": "想找能一起做攻略也能留白的搭子",
            "city": "深圳",
        },
    )
    assert create_response.status_code == 200
    payload = create_response.json()["data"]
    assert payload["mbti"] == "ENFP"
    assert payload["style_vector"]["avg_length"] > 0

    get_response = client.get(f"/api/profiles/{payload['user_id']}")
    assert get_response.status_code == 200
    assert get_response.json()["data"]["city"] == "深圳"


def test_patch_profile_style_v2():
    create_response = client.post(
        "/api/profiles",
        json={
            "mbti": "infj",
            "travel_range": ["同城"],
            "budget": "舒适",
            "self_desc": "喜欢安静但有内容的路线",
            "city": "广州",
        },
    )
    user_id = create_response.json()["data"]["user_id"]

    patch_response = client.patch(
        f"/api/profiles/{user_id}/style",
        json={"style_vector": {"decision_style": "flexible", "top_keywords": ["慢节奏"]}},
    )
    assert patch_response.status_code == 200
    assert patch_response.json()["data"]["style_vector"]["decision_style"] == "flexible"


def test_patch_profile_v2_base_fields():
    create_response = client.post(
        "/api/profiles",
        json={
            "mbti": "enfp",
            "travel_range": ["周边城市"],
            "budget": "经济",
            "self_desc": "旧描述",
            "city": "深圳",
        },
    )
    user_id = create_response.json()["data"]["user_id"]
    patch_response = client.patch(
        f"/api/profiles/{user_id}",
        json={"budget": "舒适", "self_desc": "新描述", "city": "广州"},
    )
    assert patch_response.status_code == 200
    payload = patch_response.json()["data"]
    assert payload["budget"] == "舒适"
    assert payload["self_desc"] == "新描述"
    assert payload["city"] == "广州"
