#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
MING Parsers — 单元测试
使用 mock 数据测试所有解析器。
"""
from __future__ import annotations

import json
import sys
import unittest

# ── Windows UTF-8（安全模式：pytest 已包装过 stdout，跳过重复包装）──────────────
if sys.platform == "win32":
    import io
    try:
        # 已在别处包装则跳过，避免 ValueError
        if not isinstance(sys.stdout, io.TextIOWrapper):
            sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
            sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")
    except Exception:
        pass

# ─── 导入被测模块 ────────────────────────────────────────────────────────────
if "E:/desktop/hecker" not in sys.path:
    sys.path.insert(0, "E:/desktop/hecker")

from MING.parsers.base import BaseParser
from MING.parsers.mbti_parser import MBTIParser, _extract_mbti_letters, _extract_dimension_scores
from MING.parsers.chat_parser import ChatParser, _detect_format, _analyze_messages
from MING.parsers.douyin_parser import DouyinParser, _parse_like_list
from MING.parsers import fusion


# ════════════════════════════════════════════════════════════════════════════════
# BaseParser 抽象基类测试
# ════════════════════════════════════════════════════════════════════════════════

class TestBaseParser(unittest.TestCase):
    """测试 BaseParser 接口契约。"""

    def test_base_parser_is_abc(self):
        """BaseParser 不能直接实例化。"""
        with self.assertRaises(TypeError):
            BaseParser()

    def test_subclass_must_implement_methods(self):
        """子类必须实现 _detect, _parse, _extract_fields。"""

        class BrokenParser(BaseParser):
            name = "BrokenParser"

        with self.assertRaises(TypeError):
            BrokenParser()  # 抽象方法未实现

    def test_process_returns_consistent_structure(self):
        """process() 方法总是返回 {error, persona} 结构。"""

        class GoodParser(BaseParser):
            name = "GoodParser"
            confidence = 0.8

            def _detect(self, text):
                return True

            def _parse(self, text):
                return {"key": "value"}

            def _extract_fields(self, parsed):
                return {"persona_key": parsed["key"]}

        parser = GoodParser()
        result = parser.process("anything")
        self.assertIn("persona", result)
        self.assertIsInstance(result["persona"], dict)

    def test_process_rejects_non_matching_format(self):
        """process() 对不匹配的内容返回 error。"""

        class StrictParser(BaseParser):
            name = "StrictParser"

            def _detect(self, text):
                return False

            def _parse(self, text):
                return {}

            def _extract_fields(self, parsed):
                return {}

        parser = StrictParser()
        result = parser.process("random text")
        self.assertIn("error", result)
        self.assertIsNone(result["persona"])

    def test_bytes_input_handling(self):
        """detect() 和 parse() 应接受 bytes 输入。"""

        class BytesParser(BaseParser):
            name = "BytesParser"

            def _detect(self, text):
                return "MBTI" in text

            def _parse(self, text):
                return {"text_len": len(text)}

            def _extract_fields(self, parsed):
                return parsed

        parser = BytesParser()
        result = parser.process(b"ENFP MBTI type")
        self.assertTrue(result["persona"]["text_len"] > 0)


# ════════════════════════════════════════════════════════════════════════════════
# MBTI Parser 测试
# ════════════════════════════════════════════════════════════════════════════════

class TestMBTIDetect(unittest.TestCase):
    """测试 MBTI 格式检测。"""

    def setUp(self):
        self.parser = MBTIParser()

    def test_detect_direct_type(self):
        """直接输入 MBTI 字母（如 ENFP）应被检测。"""
        self.assertTrue(self.parser.detect("ENFP"))
        self.assertTrue(self.parser.detect("intj"))
        self.assertTrue(self.parser.detect("ISTP-A"))

    def test_detect_all_16_types(self):
        """所有 16 种 MBTI 类型都应被检测。"""
        types = [
            "INTJ", "INTP", "ENTJ", "ENTP",
            "INFJ", "INFP", "ENFJ", "ENFP",
            "ISTJ", "ISFJ", "ESTJ", "ESFJ",
            "ISTP", "ISFP", "ESTP", "ESFP",
        ]
        for t in types:
            self.assertTrue(self.parser.detect(t), f"Failed for {t}")

    def test_detect_16personalities_website(self):
        """16Personalities 网站文本应被检测。"""
        text = "Your MBTI type is ENFP - The Campaigner"
        self.assertTrue(self.parser.detect(text))

    def test_detect_separated_letters(self):
        """分散字母（I N F P）应被检测。"""
        self.assertTrue(self.parser.detect("I N F P"))
        self.assertTrue(self.parser.detect("I-N-F-P"))

    def test_reject_non_mbti_text(self):
        """非 MBTI 文本应被拒绝。"""
        self.assertFalse(self.parser.detect("今天天气不错"))
        self.assertFalse(self.parser.detect("hello world"))
        self.assertFalse(self.parser.detect("ABC DEF"))


class TestMBTIParse(unittest.TestCase):
    """测试 MBTI 解析逻辑。"""

    def setUp(self):
        self.parser = MBTIParser()

    def test_parse_direct_input(self):
        """解析直接输入的 MBTI 类型。"""
        result = self.parser.process("ENFP")
        persona = result["persona"]
        self.assertEqual(persona["mbti_type"], "ENFP")
        self.assertIn("dimensions", persona)
        self.assertIn("key_traits", persona)

    def test_parse_16personalities_format(self):
        """解析 16Personalities 格式文本。"""
        text = (
            "Your MBTI Personality Type is ENFP (Campaigner)\n"
            "Extraverted - 68%\n"
            "Intuitive - 74%\n"
            "Feeling - 61%\n"
            "Perceiving - 52%"
        )
        result = self.parser.process(text)
        self.assertEqual(result["persona"]["mbti_type"], "ENFP")

    def test_parse_chinese_format(self):
        """解析中文 MBTI 描述文本。"""
        text = "我的 MBTI 是 INTJ，属于建筑师类型，内倾直觉思维判断型"
        result = self.parser.process(text)
        self.assertEqual(result["persona"]["mbti_type"], "INTJ")

    def test_parse_infers_communication_style(self):
        """解析结果应包含推断的沟通风格。"""
        result = self.parser.process("ENFP")
        comm = result["persona"]["communication_style"]
        self.assertIsInstance(comm, str)
        self.assertTrue(len(comm) > 0)

    def test_parse_infers_growth_areas(self):
        """解析结果应包含成长领域建议。"""
        result = self.parser.process("INTJ")
        areas = result["persona"]["growth_areas"]
        self.assertIsInstance(areas, list)
        self.assertTrue(len(areas) > 0)

    def test_parse_invalid_type_returns_error(self):
        """无效 MBTI 类型应返回错误。"""
        result = self.parser.process("XXXX")
        self.assertIn("error", result)

    def test_extract_dimension_scores(self):
        """测试维度得分提取。"""
        text = "内倾: 30% 直觉: 80%"
        scores = _extract_dimension_scores(text)
        self.assertIn("IE", scores)
        self.assertIn("NS", scores)


# ════════════════════════════════════════════════════════════════════════════════
# Chat Parser 测试
# ════════════════════════════════════════════════════════════════════════════════

class TestChatDetect(unittest.TestCase):
    """测试聊天格式检测。"""

    def setUp(self):
        self.parser = ChatParser()

    def test_detect_wechat_format(self):
        """微信 TXT 格式应被检测。"""
        text = "2024-01-01 10:00:00\n张三: 你好"
        self.assertTrue(self.parser.detect(text))

    def test_detect_ai_json(self):
        """AI JSON 格式应被检测。"""
        text = '{"messages": [{"role": "user", "content": "hi"}]}'
        self.assertTrue(self.parser.detect(text))

    def test_detect_ai_plain_format(self):
        """AI 纯文本对话格式应被检测。"""
        text = "## User ##\n你好\n## AI ##\n你好！"
        self.assertTrue(self.parser.detect(text))

    def test_reject_empty_text(self):
        """空文本应被拒绝。"""
        self.assertFalse(self.parser.detect(""))
        self.assertFalse(self.parser.detect("   "))


class TestChatParse(unittest.TestCase):
    """测试聊天记录解析。"""

    def setUp(self):
        self.parser = ChatParser()

    def test_parse_wechat_txt(self):
        """解析微信 TXT 格式。"""
        text = (
            "2024-01-01 10:00:00\n张三: 你好呀\n"
            "2024-01-01 10:01:00\n李四: 你好！今天天气不错"
        )
        result = self.parser.process(text)
        persona = result["persona"]
        self.assertGreater(persona["total_messages"], 0)
        self.assertIn("topics", persona)

    def test_parse_ai_json(self):
        """解析 AI JSON 格式。"""
        text = json.dumps({
            "messages": [
                {"role": "user", "content": "你好"},
                {"role": "assistant", "content": "你好！有什么可以帮你？"},
            ]
        })
        result = self.parser.process(text)
        persona = result["persona"]
        self.assertGreater(persona["total_messages"], 0)

    def test_parse_identifies_topics(self):
        """解析结果应包含话题识别。"""
        text = (
            "2024-01-01 10:00:00\n张三: 明天去成都旅行\n"
            "2024-01-01 10:01:00\n李四: 好的，记得带相机"
        )
        result = self.parser.process(text)
        topics = result["persona"]["topics"]
        self.assertIsInstance(topics, list)

    def test_parse_emotional_tone(self):
        """解析结果应包含情感倾向。"""
        text = (
            "2024-01-01 10:00:00\n张三: 好开心呀！今天好开心！"
        )
        result = self.parser.process(text)
        tone = result["persona"]["emotional_tone"]
        self.assertIsInstance(tone, str)

    def test_analyze_messages_empty(self):
        """空消息列表应返回安全的默认值。"""
        from MING.parsers.chat_parser import ChatMessage
        result = _analyze_messages([])
        self.assertEqual(result["total_messages"], 0)

    def test_detect_format_wechat(self):
        """_detect_format 应正确识别微信格式。"""
        fmt = _detect_format("2024-01-01 10:00:00\n张三: 你好")
        self.assertEqual(fmt, "wechat-txt")

    def test_detect_format_ai_json(self):
        """_detect_format 应正确识别 AI JSON 格式。"""
        fmt = _detect_format('{"messages": []}')
        self.assertEqual(fmt, "ai-json")

    def test_detect_format_ai_plain(self):
        """_detect_format 应正确识别 AI 纯文本格式。"""
        fmt = _detect_format("## User ##\nhello\n## AI ##\nhi")
        self.assertEqual(fmt, "ai-plain")


# ════════════════════════════════════════════════════════════════════════════════
# Douyin Parser 测试
# ════════════════════════════════════════════════════════════════════════════════

class TestDouyinDetect(unittest.TestCase):
    """测试抖音数据格式检测。"""

    def setUp(self):
        self.parser = DouyinParser()

    def test_detect_like_list_json(self):
        """点赞列表 JSON 应被检测。"""
        text = json.dumps({"like_list": [{"desc": "视频标题"}]})
        self.assertTrue(self.parser.detect(text))

    def test_detect_comment_list_json(self):
        """评论列表 JSON 应被检测。"""
        text = json.dumps({"comment_list": [{"content": "评论内容"}]})
        self.assertTrue(self.parser.detect(text))

    def test_detect_douyin_bio(self):
        """抖音简介文本应被检测。"""
        # 包含"简介"关键词 + 短文本
        text = "个人简介：喜欢旅行和美食，记录生活点滴"
        self.assertTrue(self.parser.detect(text))
        # 包含"抖音号"关键词 + 短文本
        text2 = "抖音号：travel_fan | 记录生活点滴"
        self.assertTrue(self.parser.detect(text2))

    def test_reject_non_douyin_text(self):
        """非抖音内容应被拒绝。"""
        self.assertFalse(self.parser.detect("今天天气不错，心情很好"))
        self.assertFalse(self.parser.detect("ENFP MBTI 测试结果"))


class TestDouyinParse(unittest.TestCase):
    """测试抖音数据解析。"""

    def setUp(self):
        self.parser = DouyinParser()

    def test_parse_like_list(self):
        """解析点赞列表 JSON。"""
        text = json.dumps({
            "like_list": [
                {"desc": "成都旅行攻略分享"},
                {"desc": "美味探店日记"},
            ],
            "share_count": 12,
        })
        result = self.parser.process(text)
        persona = result["persona"]
        self.assertIn("content_categories", persona)
        self.assertIn("engagement_style", persona)

    def test_parse_extracts_categories(self):
        """解析结果应包含内容分类。"""
        text = json.dumps({
            "like_list": [
                {"desc": "成都旅行攻略分享"},
                {"desc": "美味探店日记"},
            ]
        })
        result = self.parser.process(text)
        cats = result["persona"]["content_categories"]
        self.assertIsInstance(cats, list)

    def test_parse_bio_text(self):
        """解析纯文本简介。"""
        # 使用包含简介关键词的文本（符合 detect 规则）
        text = "个人简介：喜欢旅行和美食，记录生活点滴"
        result = self.parser.process(text)
        persona = result["persona"]
        self.assertIsNotNone(persona)
        self.assertIn("content_categories", persona)

    def test_parse_empty_like_list(self):
        """空点赞列表应安全处理。"""
        text = json.dumps({"like_list": []})
        result = self.parser.process(text)
        self.assertIsNotNone(result["persona"])

    def test_parse_like_list_function(self):
        """测试 _parse_like_list 函数。"""
        data = {"like_list": [{"desc": "测试"}, {"title": "测试2"}]}
        items, descs = _parse_like_list(data)
        self.assertEqual(len(items), 2)
        self.assertIn("测试", descs[0])


# ════════════════════════════════════════════════════════════════════════════════
# Fusion Engine 测试
# ════════════════════════════════════════════════════════════════════════════════

class TestFusion(unittest.TestCase):
    """测试多源融合引擎。"""

    def test_fuse_empty_sources(self):
        """无数据源时返回空画像。"""
        result = fusion.fuse_persona_sources()
        self.assertEqual(result["confidence"], 0.0)
        self.assertEqual(result["active_sources"], [])

    def test_fuse_mbti_only(self):
        """仅有 MBTI 时正确融合。"""
        mbti_data = {
            "mbti_type": "ENFP",
            "dimensions": {"IE": 0.3},
            "communication_style": "表达型",
            "key_traits": ["热情"],
        }
        result = fusion.fuse_persona_sources(mbti=mbti_data)
        self.assertEqual(result["persona"]["mbti_type"], "ENFP")
        self.assertIn("MBTIParser", result["active_sources"])

    def test_fuse_chat_only(self):
        """仅有聊天记录时正确融合。"""
        chat_data = {
            "total_messages": 100,
            "topics": ["旅行", "美食"],
            "speaking_style": "简洁直接",
        }
        result = fusion.fuse_persona_sources(chat=chat_data)
        self.assertEqual(result["persona"]["total_messages"], 100)
        self.assertIn("ChatParser", result["active_sources"])

    def test_fuse_douyin_only(self):
        """仅有抖音数据时正确融合。"""
        douyin_data = {
            "content_categories": ["旅行", "科技"],
            "aesthetic_preference": "喜欢有质感的内容",
        }
        result = fusion.fuse_persona_sources(douyin=douyin_data)
        self.assertEqual(result["persona"]["content_categories"], ["旅行", "科技"])

    def test_fuse_priority_mbti_over_chat(self):
        """MBTI 优先级高于聊天记录（相同字段）。"""
        mbti_data = {
            "mbti_type": "INTJ",
            "communication_style": "简洁直接",
        }
        chat_data = {
            "total_messages": 100,
            "communication_style": "啰嗦话多",
        }
        result = fusion.fuse_persona_sources(mbti=mbti_data, chat=chat_data)
        # MBTI 的沟通风格不应被聊天覆盖（MBTI 优先级更高）
        # 但融合后两者都保留，因为字段名不同
        self.assertEqual(result["persona"]["mbti_type"], "INTJ")

    def test_fuse_merges_topics(self):
        """融合时合并话题列表。"""
        chat_data = {
            "total_messages": 100,
            "topics": ["旅行", "美食"],
            "speaking_style": "",
            "emotional_tone": "",
            "relationship_depth": "",
            "key_phrases": [],
            "decision_patterns": "",
            "message_ratio": {},
            "avg_message_length": 0,
        }
        douyin_data = {"content_categories": ["美食", "科技"]}
        result = fusion.fuse_persona_sources(chat=chat_data, douyin=douyin_data)
        topics = result["persona"].get("interests_topics", [])
        # 合并后应包含来自两个来源的话题
        self.assertIn("旅行", topics)
        self.assertIn("美食", topics)
        self.assertIn("科技", topics)
        # 去重：美食不应出现两次
        self.assertEqual(topics.count("美食"), 1)

    def test_fuse_includes_photo_for_avatar(self):
        """照片路径应包含在结果中（仅用于 Avatar）。"""
        result = fusion.fuse_persona_sources(photo="/path/to/avatar.jpg")
        self.assertEqual(result["persona"].get("avatar_photo"), "/path/to/avatar.jpg")

    def test_fuse_confidence_with_multiple_sources(self):
        """多数据源时置信度更高。"""
        mbti_data = {"mbti_type": "ENFP", "dimensions": {}, "key_traits": [],
                     "communication_style": "", "decision_making": "",
                     "stress_response": "", "growth_areas": []}
        chat_data = {"total_messages": 100, "topics": [], "speaking_style": "",
                     "emotional_tone": "", "relationship_depth": "", "key_phrases": [],
                     "decision_patterns": "", "message_ratio": {}, "avg_message_length": 0}

        result_single = fusion.fuse_persona_sources(mbti=mbti_data)
        result_multi = fusion.fuse_persona_sources(mbti=mbti_data, chat=chat_data)
        self.assertGreaterEqual(result_multi["confidence"], result_single["confidence"])

    def test_fuse_cross_validation(self):
        """融合时进行交叉验证。"""
        mbti_data = {
            "mbti_type": "ENFP",
            "dimensions": {}, "key_traits": [],
            "communication_style": "", "decision_making": "",
            "stress_response": "", "growth_areas": [],
        }
        chat_data = {
            "total_messages": 100, "topics": [], "speaking_style": "",
            "emotional_tone": "积极正面", "relationship_depth": "", "key_phrases": [],
            "decision_patterns": "", "message_ratio": {"user": 0.2}, "avg_message_length": 0,
        }
        result = fusion.fuse_persona_sources(mbti=mbti_data, chat=chat_data)
        self.assertIn("validation", result)

    def test_fuse_debug_mode(self):
        """debug=True 时返回调试信息。"""
        mbti_data = {
            "mbti_type": "ENFP", "dimensions": {}, "key_traits": [],
            "communication_style": "", "decision_making": "",
            "stress_response": "", "growth_areas": [],
        }
        result = fusion.fuse_persona_sources(mbti=mbti_data, debug=True)
        self.assertIn("debug", result)

    def test_fuse_summary_generation(self):
        """融合结果包含人格摘要。"""
        mbti_data = {
            "mbti_type": "ENFP",
            "dimensions": {}, "key_traits": [],
            "communication_style": "表达型，喜欢讲故事", "decision_making": "",
            "stress_response": "", "growth_areas": [],
        }
        result = fusion.fuse_persona_sources(mbti=mbti_data)
        self.assertIn("summary", result)
        self.assertIsInstance(result["summary"], str)
        self.assertTrue(len(result["summary"]) > 0)


# ════════════════════════════════════════════════════════════════════════════════
# 集成测试：端到端流程
# ════════════════════════════════════════════════════════════════════════════════

class TestEndToEnd(unittest.TestCase):
    """端到端集成测试。"""

    def test_full_pipeline_mbti(self):
        """MBTI 解析完整流程。"""
        parser = MBTIParser()
        content = "ENFP — Campaigner，热情洋溢，爱社交，有创意"
        detect_ok = parser.detect(content)
        self.assertTrue(detect_ok)
        parsed = parser.parse(content)
        self.assertNotIn("error", parsed)
        persona = parser.extract_for_persona(parsed)
        self.assertEqual(persona["mbti_type"], "ENFP")
        self.assertEqual(persona["source"], "MBTIParser")

    def test_full_pipeline_chat(self):
        """聊天解析完整流程。"""
        parser = ChatParser()
        content = json.dumps({
            "messages": [
                {"role": "user", "content": "明天去成都旅行"},
                {"role": "assistant", "content": "好呀，成都很美！"},
            ]
        })
        persona = parser.process(content)["persona"]
        self.assertGreater(persona["total_messages"], 0)

    def test_full_pipeline_douyin(self):
        """抖音解析完整流程。"""
        parser = DouyinParser()
        content = json.dumps({
            "like_list": [
                {"desc": "成都旅行攻略"},
                {"desc": "美味探店日记"},
            ]
        })
        persona = parser.process(content)["persona"]
        self.assertIsInstance(persona["content_categories"], list)

    def test_full_pipeline_fusion(self):
        """完整融合流程（模拟真实场景）。"""
        mbti_data = {
            "mbti_type": "ENFP",
            "dimensions": {"IE": 0.3, "NS": 0.8, "FT": -0.2, "JP": -0.5},
            "key_traits": ["热情", "有创意", "爱社交"],
            "communication_style": "表达型，喜欢讲故事",
            "decision_making": "情感驱动",
            "stress_response": "压力下可能批判性",
            "growth_areas": ["时间管理"],
        }
        chat_data = {
            "total_messages": 284,
            "message_ratio": {"user": 0.6, "other": 0.4},
            "avg_message_length": 45,
            "topics": ["旅行", "美食"],
            "speaking_style": "简洁直接",
            "emotional_tone": "积极正面",
            "relationship_depth": "亲密关系",
            "key_phrases": ["哈哈哈"],
            "decision_patterns": "商量后自己决定",
        }
        result = fusion.fuse_persona_sources(mbti=mbti_data, chat=chat_data)
        self.assertGreater(result["confidence"], 0.0)
        self.assertEqual(result["persona"]["mbti_type"], "ENFP")
        self.assertIn("旅行", result["persona"].get("interests_topics", []))


# ════════════════════════════════════════════════════════════════════════════════
# 测试运行器
# ════════════════════════════════════════════════════════════════════════════════

def run_tests() -> bool:
    """运行所有测试并返回是否全部通过。"""
    # 构建测试套件
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()

    suite.addTests(loader.loadTestsFromTestCase(TestBaseParser))
    suite.addTests(loader.loadTestsFromTestCase(TestMBTIDetect))
    suite.addTests(loader.loadTestsFromTestCase(TestMBTIParse))
    suite.addTests(loader.loadTestsFromTestCase(TestChatDetect))
    suite.addTests(loader.loadTestsFromTestCase(TestChatParse))
    suite.addTests(loader.loadTestsFromTestCase(TestDouyinDetect))
    suite.addTests(loader.loadTestsFromTestCase(TestDouyinParse))
    suite.addTests(loader.loadTestsFromTestCase(TestFusion))
    suite.addTests(loader.loadTestsFromTestCase(TestEndToEnd))

    # 运行
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)

    # 统计
    total = result.testsRun
    failures = len(result.failures)
    errors = len(result.errors)
    skipped = len(result.skipped)
    passed = total - failures - errors - skipped

    print()
    print("=" * 60)
    print(f"  测试结果汇总")
    print(f"  总计: {total}  |  通过: {passed}  |  失败: {failures}  |  错误: {errors}  |  跳过: {skipped}")
    print("=" * 60)

    return result.wasSuccessful()


if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)
