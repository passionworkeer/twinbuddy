# TwinBuddy API

Base path: `/api`

The backend entrypoint is `api.index:app`. Locally, run:

```powershell
python -m uvicorn api.index:app --reload --port 8000
```

## Health

- `GET /api/health`

Returns:

```json
{"status":"healthy","service":"twinbuddy-api"}
```

## V1 Persona And Matching

- `GET /api/persona`
- `GET /api/buddies`
- `POST /api/negotiate`

`GET /api/persona` accepts either `user_id` or generation parameters such as `mbti`, `interests`, `city`, and `voice_text`.

`POST /api/negotiate` accepts a destination plus persona hints, then returns a negotiation result. The endpoint falls back to mock output when LLM negotiation is unavailable.

## V2 Product APIs

Profiles:

- `POST /api/profiles`
- `GET /api/profiles/{user_id}`
- `PATCH /api/profiles/{user_id}`
- `PATCH /api/profiles/{user_id}/style`

Buddies:

- `GET /api/buddies/inbox`
- `GET /api/buddies/{buddy_id}/card`
- `POST /api/buddies/{buddy_id}/accept`
- `POST /api/buddies/{buddy_id}/skip`
- `POST /api/buddies/{buddy_id}/decide`

Chat:

- `POST /api/chat/send`
- `GET /api/chat/history/{conversation_id}`

Messages:

- `GET /api/conversations`
- `GET /api/messages/{room_id}`
- `POST /api/messages`

Security:

- `GET /api/security/status/{user_id}`
- `POST /api/security/verify`

Blind game:

- `POST /api/games/blind/start`
- `POST /api/games/blind/answer`
- `GET /api/games/blind/{game_id}/report`

Trips:

- `POST /api/trips/report`
- `GET /api/trips/{trip_id}/status`

Community:

- `GET /api/posts/feed`
- `POST /api/posts`
- `GET /api/posts/{post_id}`
- `POST /api/posts/{post_id}/comments`
- `POST /api/posts/{post_id}/like`
- `POST /api/posts/{post_id}/twin-chat`

Speech to text:

- `WS /api/stt/ws`
- `GET /api/stt/health`

## Response Convention

Most application endpoints return:

```json
{"success":true,"data":{}}
```

or:

```json
{"success":false,"error":"message"}
```

FastAPI validation errors still use the standard FastAPI error shape.
