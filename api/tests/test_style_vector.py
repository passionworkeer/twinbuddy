from api.style_vector import extract_style_vector


def test_extract_style_vector_detects_emoji_and_questions():
    result = extract_style_vector(["太棒了！👍", "周末去吗？"])
    assert result["emoji_rate"] > 0
    assert result["question_ratio"] > 0
    assert result["exclamation_ratio"] > 0


def test_extract_style_vector_detects_decision_style_and_keywords():
    result = extract_style_vector(["必须拍照！预算也要控住", "周末直接去海边"])
    assert result["decision_style"] == "decisive"
    assert "拍照" in result["top_keywords"]
    assert "预算" in result["top_keywords"]
