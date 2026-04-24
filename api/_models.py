# api/_models.py
"""全 API 共享 Pydantic 模型"""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field, field_validator


class OnboardingDataRequest(BaseModel):
    """POST /api/onboarding 请求体"""
    mbti: str = Field(..., min_length=3, max_length=6, description="MBTI 类型")
    interests: List[str] = Field(default_factory=list, description="兴趣标签数组")
    voiceText: str = Field(default="", description="语音转文字内容")
    city: str = Field(default="", description="向往城市ID")
    completed: bool = Field(default=True, description="是否完成引导")

    @field_validator("mbti")
    @classmethod
    def normalize_mbti(cls, v: str) -> str:
        return v.strip().upper()


class PersonaResponse(BaseModel):
    """GET /api/persona 响应体"""
    persona_id: str
    name: str
    avatar_prompt: str
    avatar_emoji: str
    layer0_hard_rules: List[str]
    identity: Dict[str, Any]
    speaking_style: Dict[str, Any]
    emotion_decision: Dict[str, Any]
    social_behavior: Dict[str, Any]
    travel_style: str
    mbti_influence: str
    soul_fingerprint: str


class VideoItemResponse(BaseModel):
    """Feed 中的单个视频卡片"""
    id: str
    type: str
    cover_url: str
    location: str
    title: str
    video_url: Optional[str] = None
    buddy: Optional[Dict[str, Any]] = None


class NegotiationRequest(BaseModel):
    """POST /api/negotiate 请求体"""
    user_id: Optional[str] = None
    user_persona_id: Optional[str] = None
    buddy_mbti: Optional[str] = None
    mbti: Optional[str] = None
    interests: Optional[List[str]] = None
    voice_text: Optional[str] = None
    destination: str = Field(..., description="目的地城市ID")
