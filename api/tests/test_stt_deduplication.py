# api/tests/test_stt_deduplication.py
"""验证 STT 端点从 stt_api.py 提供（而非 frontend_api.py）"""
import pytest
from fastapi.testclient import TestClient


def test_stt_health_works():
    """验证 STT 健康检查端点存在且不返回 404"""
    from api.index import app
    client = TestClient(app)
    response = client.get("/api/stt/health")
    # 不期望 404（说明端点存在）
    assert response.status_code != 404, f"STT health 端点返回 404: {response.json()}"
    # 应该返回配置状态
    data = response.json()
    assert "status" in data, f"STT health 响应缺少 status: {data}"


def test_no_duplicate_stt_in_frontend_api():
    """验证 frontend_api.py 中没有重复的 /stt 端点"""
    import inspect
    from api import frontend_api

    source = inspect.getsource(frontend_api)
    # 不应该包含 @router.post("/stt")
    assert '@router.post("/stt")' not in source, \
        "frontend_api.py 中仍有重复的 @router.post('/stt') 端点"
