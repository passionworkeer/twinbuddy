# test_card_engine.py
import pytest, sys, os, json
sys.path.insert(0, os.path.dirname(__file__))
from card_engine import (
    should_trigger_card, is_normal_video,
    get_video_data, build_feed_response,
    TRIGGER_VIDEO_IDS, NORMAL_VIDEO_IDS, MOCK_VIDEOS
)

class TestShouldTriggerCard:
    def test_video_1_normal(self): assert should_trigger_card(1) is False
    def test_video_2_normal(self): assert should_trigger_card(2) is False
    def test_video_3_triggers(self): assert should_trigger_card(3) is True
    def test_video_4_triggers(self): assert should_trigger_card(4) is True
    def test_video_5_triggers(self): assert should_trigger_card(5) is True
    def test_video_0_normal(self): assert should_trigger_card(0) is False
    def test_video_99_normal(self): assert should_trigger_card(99) is False

class TestIsNormalVideo:
    def test_1_normal(self): assert is_normal_video(1) is True
    def test_2_normal(self): assert is_normal_video(2) is True
    def test_3_not_normal(self): assert is_normal_video(3) is False
    def test_4_not_normal(self): assert is_normal_video(4) is False
    def test_5_not_normal(self): assert is_normal_video(5) is False

class TestGetVideoData:
    def test_video_1_exists(self):
        v = get_video_data(1)
        assert v is not None
        assert v["video_id"] == 1
        assert v["trigger_card"] is False
    def test_video_3_trigger(self):
        v = get_video_data(3)
        assert v is not None
        assert v["trigger_card"] is True
    def test_nonexistent_returns_none(self):
        assert get_video_data(999) is None
    def test_video_5_trigger(self):
        v = get_video_data(5)
        assert v is not None
        assert v["trigger_card"] is True

class TestBuildFeedResponse:
    def test_normal_video_response(self):
        r = build_feed_response(1)
        assert r["status"] == 200
        assert r["trigger_card"] is False
        assert r["card_content"] is None
        assert r["negotiation_result"] is None
    def test_trigger_video_response(self):
        r = build_feed_response(3)
        assert r["status"] == 200
        assert r["trigger_card"] is True
        assert r["card_content"] is not None
        assert "card_type" in r["card_content"]
        assert "title" in r["card_content"]
    def test_nonexistent_video(self):
        r = build_feed_response(999)
        assert r["status"] == 404
        assert "error" in r
    def test_all_five_videos(self):
        for vid in range(1, 6):
            r = build_feed_response(vid)
            assert r["status"] == 200
            assert r["video_id"] == vid

class TestMockVideos:
    def test_five_videos_defined(self): assert len(MOCK_VIDEOS) == 5
    def test_trigger_ids(self): assert TRIGGER_VIDEO_IDS == {3, 4, 5}
    def test_normal_ids(self): assert NORMAL_VIDEO_IDS == {1, 2}
    def test_each_video_has_required_fields(self):
        for v in MOCK_VIDEOS.values():
            assert "video_id" in v
            assert "title" in v
            assert "category" in v
            assert "trigger_card" in v

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
