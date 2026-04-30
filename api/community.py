from __future__ import annotations

import time
import uuid
from typing import Any, Dict, List

from fastapi import APIRouter, HTTPException, Query

from api._models import (
    TwinBuddyCommunityCommentRequest,
    TwinBuddyCommunityLikeRequest,
    TwinBuddyCommunityPostCreateRequest,
    TwinBuddyCommunityTwinChatRequest,
)
from api._store import get_post, get_profile, list_posts, save_post

router = APIRouter(prefix="/api", tags=["CommunityV2"])

_DEFAULT_POSTS: List[Dict[str, Any]] = [
    {
        "id": "post_seed_shenzhen",
        "user_id": "seed_user_1",
        "author": {"nickname": "Momo", "mbti": "ISFP"},
        "content": "周末想在深圳周边找个能一起慢慢逛、顺便吃点好吃的搭子。",
        "images": [],
        "tags": ["深圳", "周末", "美食"],
        "location": "深圳",
        "is_travel_plan": True,
        "trip_date": "2026-04-27",
        "trip_days": 2,
        "trip_budget": "经济",
        "likes_count": 3,
        "comments_count": 1,
        "liked_user_ids": [],
        "comments": [
            {
                "id": "comment_seed_1",
                "user_id": "seed_user_2",
                "author_nickname": "阿杰",
                "content": "这个节奏挺舒服的，我也不喜欢赶景点。",
                "created_at": int(time.time() * 1000) - 60000,
            }
        ],
        "created_at": int(time.time() * 1000) - 120000,
    },
    {
        "id": "post_seed_guangzhou",
        "user_id": "seed_user_3",
        "author": {"nickname": "小满", "mbti": "ENFJ"},
        "content": "五月想去潮汕吃喝两天，想找会做一点攻略但别太卷的搭子。",
        "images": [],
        "tags": ["潮汕", "美食", "五一"],
        "location": "广州",
        "is_travel_plan": True,
        "trip_date": "2026-05-01",
        "trip_days": 3,
        "trip_budget": "舒适",
        "likes_count": 5,
        "comments_count": 0,
        "liked_user_ids": [],
        "comments": [],
        "created_at": int(time.time() * 1000) - 180000,
    },
    {
        "id": "post_seed_shunde",
        "user_id": "seed_user_4",
        "author": {"nickname": "栗子", "mbti": "ESFJ"},
        "content": "五一想在顺德慢慢吃，白天逛街区，晚上留白散步，找一个能一起商量但别太赶的搭子。",
        "images": [],
        "tags": ["顺德", "五一", "慢节奏"],
        "location": "深圳",
        "is_travel_plan": True,
        "trip_date": "2026-05-01",
        "trip_days": 3,
        "trip_budget": "舒适",
        "likes_count": 7,
        "comments_count": 2,
        "liked_user_ids": [],
        "comments": [
            {
                "id": "comment_seed_2",
                "user_id": "seed_user_5",
                "author_nickname": "Momo",
                "content": "这个节奏我可以，尤其喜欢晚上散步那种安排。",
                "created_at": int(time.time() * 1000) - 42000,
            },
            {
                "id": "comment_seed_3",
                "user_id": "seed_user_6",
                "author_nickname": "Ryan",
                "content": "如果能把第一天预算先卡住，后面就很好聊。",
                "created_at": int(time.time() * 1000) - 28000,
            },
        ],
        "created_at": int(time.time() * 1000) - 90000,
    },
    {
        "id": "post_seed_huizhou",
        "user_id": "seed_user_7",
        "author": {"nickname": "阿杰", "mbti": "INTP"},
        "content": "端午考虑惠州海边两天一夜，只想找不内耗、能各自有一点空间的搭子。",
        "images": [],
        "tags": ["惠州", "海边", "端午"],
        "location": "广州",
        "is_travel_plan": True,
        "trip_date": "2026-06-08",
        "trip_days": 2,
        "trip_budget": "经济",
        "likes_count": 4,
        "comments_count": 1,
        "liked_user_ids": [],
        "comments": [
            {
                "id": "comment_seed_4",
                "user_id": "seed_user_8",
                "author_nickname": "南枝",
                "content": "我也喜欢各自留一点空间，这个描述挺舒服。",
                "created_at": int(time.time() * 1000) - 18000,
            }
        ],
        "created_at": int(time.time() * 1000) - 150000,
    },
]


def _ensure_seed_posts() -> None:
    if list_posts():
        return
    for post in _DEFAULT_POSTS:
        save_post(post["id"], post)


def _sort_posts(posts: List[Dict[str, Any]], city: str) -> List[Dict[str, Any]]:
    return sorted(
        posts,
        key=lambda item: (0 if item.get("location") == city else 1, -int(item.get("created_at", 0))),
    )


@router.get("/posts/feed")
async def get_posts_feed(
    user_id: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
) -> Dict[str, Any]:
    _ensure_seed_posts()
    city = ""
    if user_id:
        profile = get_profile(user_id)
        if profile:
            city = profile.get("city", "")
    items = _sort_posts(list(list_posts().values()), city)
    return {"success": True, "data": {"items": items, "page": page, "has_more": False}}


@router.post("/posts")
async def create_post(req: TwinBuddyCommunityPostCreateRequest) -> Dict[str, Any]:
    profile = get_profile(req.user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    post = {
        "id": f"post_{uuid.uuid4().hex[:10]}",
        "user_id": req.user_id,
        "author": {"nickname": profile.get("nickname", "TwinBuddy 用户"), "mbti": profile.get("mbti", "")},
        "content": req.content,
        "images": req.images,
        "tags": req.tags,
        "location": req.location,
        "is_travel_plan": req.is_travel_plan,
        "trip_date": req.trip_date,
        "trip_days": req.trip_days,
        "trip_budget": req.trip_budget,
        "likes_count": 0,
        "comments_count": 0,
        "liked_user_ids": [],
        "comments": [],
        "created_at": int(time.time() * 1000),
    }
    save_post(post["id"], post)
    return {"success": True, "data": post}


@router.get("/posts/{post_id}")
async def get_post_detail(post_id: str) -> Dict[str, Any]:
    _ensure_seed_posts()
    post = get_post(post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return {"success": True, "data": post}


@router.post("/posts/{post_id}/comments")
async def add_post_comment(post_id: str, req: TwinBuddyCommunityCommentRequest) -> Dict[str, Any]:
    post = get_post(post_id)
    profile = get_profile(req.user_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    comment = {
        "id": f"comment_{uuid.uuid4().hex[:10]}",
        "user_id": req.user_id,
        "author_nickname": profile.get("nickname", "TwinBuddy 用户"),
        "content": req.content,
        "created_at": int(time.time() * 1000),
    }
    post.setdefault("comments", []).append(comment)
    post["comments_count"] = len(post["comments"])
    save_post(post_id, post)
    return {"success": True, "data": comment}


@router.post("/posts/{post_id}/like")
async def toggle_post_like(post_id: str, req: TwinBuddyCommunityLikeRequest) -> Dict[str, Any]:
    post = get_post(post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    liked_user_ids = set(post.get("liked_user_ids", []))
    if req.user_id in liked_user_ids:
        liked_user_ids.remove(req.user_id)
        liked = False
    else:
        liked_user_ids.add(req.user_id)
        liked = True
    post["liked_user_ids"] = sorted(liked_user_ids)
    post["likes_count"] = len(liked_user_ids)
    save_post(post_id, post)
    return {"success": True, "data": {"post_id": post_id, "liked": liked, "likes_count": post["likes_count"]}}


@router.post("/posts/{post_id}/twin-chat")
async def trigger_twin_chat(post_id: str, req: TwinBuddyCommunityTwinChatRequest) -> Dict[str, Any]:
    post = get_post(post_id)
    profile = get_profile(req.user_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    summary = f"数字分身已为你向帖子作者发起代聊，重点围绕 {', '.join(post.get('tags', [])[:2]) or '旅行偏好'}。"
    return {
        "success": True,
        "data": {
            "post_id": post_id,
            "status": "queued",
            "summary": summary,
            "negotiation_preview": {
                "match_score": 79,
                "consensus": ["预算预期接近", "都偏好不赶行程"],
            },
        },
    }
