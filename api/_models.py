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


class TwinBuddyProfileRequest(BaseModel):
    user_id: Optional[str] = Field(default=None, description="前端本地用户 ID")
    mbti: str = Field(..., min_length=3, max_length=6)
    travel_range: List[str] = Field(default_factory=list)
    budget: str = Field(..., min_length=1)
    self_desc: str = Field(..., min_length=1, max_length=80)
    city: str = Field(..., min_length=1, max_length=40)

    @field_validator("mbti")
    @classmethod
    def normalize_v2_mbti(cls, value: str) -> str:
        return value.strip().upper()


class TwinBuddyStylePatchRequest(BaseModel):
    style_vector: Dict[str, Any] = Field(default_factory=dict)


class TwinBuddyProfileResponse(BaseModel):
    user_id: str
    nickname: str
    mbti: str
    travel_range: List[str]
    budget: str
    self_desc: str
    city: str
    style_vector: Dict[str, Any] = Field(default_factory=dict)
    is_verified: bool = False
    verification_status: str = "unverified"
    verified_at: Optional[int] = None
    updated_at: int


class TwinBuddyChatSendRequest(BaseModel):
    user_id: str
    message: str = Field(..., min_length=1, max_length=500)
    conversation_id: Optional[str] = None


class TwinBuddyChatMessageResponse(BaseModel):
    id: str
    role: str
    content: str
    created_at: int


class TwinBuddyChatHistoryResponse(BaseModel):
    conversation_id: str
    user_id: str
    items: List[TwinBuddyChatMessageResponse]


class TwinBuddyMessageSendRequest(BaseModel):
    room_id: str
    sender_id: str
    content: str = Field(..., min_length=1, max_length=1000)
    type: str = Field(default="text")


class TwinBuddyProfilePatchRequest(BaseModel):
    budget: Optional[str] = None
    self_desc: Optional[str] = Field(default=None, max_length=80)
    city: Optional[str] = Field(default=None, max_length=40)
    travel_range: Optional[List[str]] = None
    style_vector: Optional[Dict[str, Any]] = None


class TwinBuddySecurityVerifyRequest(BaseModel):
    user_id: str
    legal_name: str = Field(..., min_length=2, max_length=20)
    id_number_tail: str = Field(..., min_length=4, max_length=6)
    face_checked: bool = True


class TwinBuddySecurityStatusResponse(BaseModel):
    user_id: str
    is_verified: bool
    verification_status: str
    real_name_masked: str = ""
    id_number_tail: str = ""
    verified_at: Optional[int] = None


class TwinBuddyTripReportRequest(BaseModel):
    user_a_id: str
    user_b_id: str
    destination: str = Field(..., min_length=1, max_length=40)
    depart_date: str = Field(..., min_length=8, max_length=20)
    return_date: str = Field(..., min_length=8, max_length=20)
    emergency_contact_name: str = Field(..., min_length=2, max_length=20)
    emergency_contact_phone: str = Field(..., min_length=8, max_length=20)


class TwinBuddyTripStatusResponse(BaseModel):
    trip_id: str
    status: str
    destination: str
    depart_date: str
    return_date: str
    emergency_contact_masked: str
    emergency_notification_sent: bool
    created_at: int


class TwinBuddyCommunityPostCreateRequest(BaseModel):
    user_id: str
    content: str = Field(..., min_length=1, max_length=500)
    images: List[str] = Field(default_factory=list)
    tags: List[str] = Field(default_factory=list)
    location: str = Field(..., min_length=1, max_length=40)
    is_travel_plan: bool = False
    trip_date: Optional[str] = None
    trip_days: Optional[int] = None
    trip_budget: Optional[str] = None


class TwinBuddyCommunityCommentRequest(BaseModel):
    user_id: str
    content: str = Field(..., min_length=1, max_length=300)


class TwinBuddyCommunityLikeRequest(BaseModel):
    user_id: str


class TwinBuddyCommunityTwinChatRequest(BaseModel):
    user_id: str


class BlindGameStartRequest(BaseModel):
    user_id: str
    negotiation_id: str


class BlindGameAnswerRequest(BaseModel):
    game_id: str
    round_id: str
    choice: str = Field(..., pattern="^(A|B)$")


# ===== TwinBuddy 懂你行动卡 (依据 docs/action-cards.md §8) =====

SCENE_VALUES = ("trip", "food", "fitness", "study", "event", "shopping")
VARIANT_VALUES = ("hint", "plan", "buddy", "complete")
NEEDS_BUDDY_VALUES = ("required", "optional", "none")
TONE_VALUES = ("casual", "direct", "warm")
KEY_MOMENT_OUTCOME_VALUES = ("agreed", "pending", "escalated")


class ActionCardKeyMoment(BaseModel):
    """1 个关键瞬间（评审要求：不是聊天记录）"""
    speaker: str = Field(..., description="user_twin | buddy_twin | system")
    text: str = Field(..., min_length=1, max_length=200)
    detected_conflict: str = Field(..., min_length=1, max_length=200)
    resolution: str = Field(..., min_length=1, max_length=200)
    outcome: str = Field(..., description="agreed | pending | escalated")


class ActionCardNegotiationSummary(BaseModel):
    """AI 协商摘要：已达成 / 待确认 / 风险 + 关键瞬间 + 推进度"""
    agreed: List[str] = Field(default_factory=list, max_length=4)
    pending: List[str] = Field(default_factory=list, max_length=3)
    risks: List[str] = Field(default_factory=list, max_length=2)
    key_moment: Optional[ActionCardKeyMoment] = None
    progress: int = Field(..., ge=0, lt=100, description="永远 < 100%（PRD §16 红线）")


class ActionCardCandidate(BaseModel):
    id: str
    avatar_url: str
    nickname: str
    match_label: str = Field(..., description="most_match | most_complement | most_interesting")
    match_reason: str
    conflicts: List[str] = Field(default_factory=list)


class ActionCardFollowUp(BaseModel):
    type: str
    label: str


class ActionCard(BaseModel):
    """懂你行动卡（PRD §5.2 全部 10 项）"""
    id: str
    scene: str
    variant: str
    state: str
    title: str
    trigger_reason: str
    intent: str = ""
    plan: str = ""
    needs_buddy: str
    candidates: List[ActionCardCandidate] = Field(default_factory=list)
    negotiation_summary: Optional[ActionCardNegotiationSummary] = None
    risks: List[str] = Field(default_factory=list)
    next_actions: List[Dict[str, Any]] = Field(default_factory=list)
    follow_up: List[ActionCardFollowUp] = Field(default_factory=list)
    invite_text: str = ""
    meta: Dict[str, Any] = Field(default_factory=dict)

    @field_validator("scene")
    @classmethod
    def validate_scene(cls, v: str) -> str:
        if v not in SCENE_VALUES:
            raise ValueError(f"scene must be one of {SCENE_VALUES}, got {v}")
        return v

    @field_validator("variant")
    @classmethod
    def validate_variant(cls, v: str) -> str:
        if v not in VARIANT_VALUES:
            raise ValueError(f"variant must be one of {VARIANT_VALUES}, got {v}")
        return v

    @field_validator("needs_buddy")
    @classmethod
    def validate_needs_buddy(cls, v: str) -> str:
        if v not in NEEDS_BUDDY_VALUES:
            raise ValueError(f"needs_buddy must be one of {NEEDS_BUDDY_VALUES}, got {v}")
        return v


class ActionCardDampenRequest(BaseModel):
    scene: str
    skip_count: int = Field(default=1, ge=1, le=10)


class ActionCardDampenResponse(BaseModel):
    scene: str
    dampened: bool
    expiry: Optional[int] = None  # epoch ms


class ActionCardInviteRequest(BaseModel):
    scene: str
    tone: str = "casual"
    partner_name: Optional[str] = None
    deadline: Optional[str] = None
    follow_up: List[ActionCardFollowUp] = Field(default_factory=list)

    @field_validator("scene")
    @classmethod
    def validate_scene(cls, v: str) -> str:
        if v not in SCENE_VALUES:
            raise ValueError(f"scene must be one of {SCENE_VALUES}")
        return v

    @field_validator("tone")
    @classmethod
    def validate_tone(cls, v: str) -> str:
        if v not in TONE_VALUES:
            raise ValueError(f"tone must be one of {TONE_VALUES}")
        return v


class ActionCardInviteResponse(BaseModel):
    text: str
    scene: str
    tone: str
