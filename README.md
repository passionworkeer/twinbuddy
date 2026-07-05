# TwinBuddy

TwinBuddy (孪生搭子) is a travel-buddy product prototype where a user's distilled digital twin negotiates with another user's twin before the user sees a swipeable "understands-you" card.

The current running stack is:

- Backend: FastAPI, Python, LangGraph-style negotiation helpers, MiniMax LLM integration with mock fallback
- Frontend: Vue 3, Vite, TypeScript, Less, Pinia, Vue Router, based on `zyronon/douyin`
- Persona: root-level `persona_generator.py` and `persona_layers.py`
- Data: local JSON-backed in-memory store for development, Postgres schema and Alembic migrations for production

## Repository Map

```text
.
├── api/                    # FastAPI app and backend tests
│   ├── index.py            # Backend entry: uvicorn api.index:app
│   ├── frontend_api.py     # Aggregates feature routers
│   ├── negotiation/        # Negotiation prompt, LLM, state, and graph helpers
│   ├── migrations/         # Alembic migrations
│   └── tests/              # Pytest suite
├── persona_generator.py    # Active persona distillation entrypoint
├── persona_layers.py       # Active persona layer rendering helpers
├── twinbuddy/
│   ├── agents/             # Buddy persona data and scoring logic
│   └── frontend/           # Active Vue/Vite Douyin frontend
├── database/schema/        # Postgres DDL pack
├── docs/                   # Current architecture, API, deploy, and reports
│   └── reports/            # Historical test and issue reports still worth keeping
├── MING/                   # Standalone digital-twin framework materials
└── archive/                # Historical and retired files
```

The root `package.json` and stale batch scripts were retired because the real frontend lives in `twinbuddy/frontend/`. The legacy `persona_engine.py` was retired because the active backend imports `persona_generator.py` directly.

The active frontend is now a full Vue/Vite graft of [`zyronon/douyin`](https://github.com/zyronon/douyin). Keep its GPL-3.0 license and upstream attribution intact when changing or deploying it.

## Backend

Install dependencies from the repo root:

```powershell
pip install -r requirements.txt
pip install -r api/requirements.txt
```

Run locally:

```powershell
python -m uvicorn api.index:app --reload --port 8000
```

Useful checks:

```powershell
python -m pytest api/tests -q
python -m pytest api/tests/test_negotiate_endpoint.py -v
```

The local app loads a repo-root `.env` when present. Common backend variables:

- `MINIMAX_API_KEY`
- `MINIMAX_API_KEY_1`
- `MINIMAX_API_KEY_2`
- `XFYUN_APP_ID`
- `XFYUN_API_KEY`
- `XFYUN_API_SECRET`

## Frontend

Run from the real frontend directory:

```powershell
cd twinbuddy/frontend
npm install
npm run dev
```

The Vite dev server runs on `http://localhost:5173` and proxies `/api` plus `/api/stt/ws` to `http://localhost:8000`.

Useful checks:

```powershell
cd twinbuddy/frontend
npm run test   # smoke build
npm run build
```

## API Shape

The FastAPI app is created in `api/index.py`. It includes:

- `frontend_router`, aggregated by `api/frontend_api.py`
- `stt_router`, mounted from `api/stt_api.py`
- `/api/health`

Each feature router owns its own `/api` prefix. Add new endpoints in `api/*.py`, then register the router in `api/frontend_api.py`.

Current feature areas:

- Profiles: `/api/profiles`
- Persona: `/api/persona`
- Buddies: `/api/buddies`, `/api/buddies/inbox`
- Negotiation: `/api/negotiate`
- Chat: `/api/chat/send`, `/api/chat/history/{conversation_id}`
- Messages: `/api/conversations`, `/api/messages`
- Security: `/api/security`
- Blind game: `/api/games/blind`
- Trips: `/api/trips`
- Community: `/api/posts`
- STT: `/api/stt`

## Deployment

Backend deployment targets Railway:

```text
uvicorn api.index:app --host 0.0.0.0 --port $PORT
```

Frontend deployment targets Vercel with root directory:

```text
twinbuddy/frontend
```

See `docs/DEPLOY.md` for the current runbook.

## Development Branch

The active development branch is `codex/project-structure-cleanup` — the line that
onboarded the `zyronon/douyin` Vue shell and archived the old React frontend.
GitHub's default branch is still `main` (which points at the deployed codebase);
after cloning, switch to the active dev branch:

```bash
git checkout codex/project-structure-cleanup
```

See `BRANCHES.md` at the repo root for the full branch map, naming conventions, and SSH / merge notes (kept fresh by `wang`).

## Current Cleanup Rule

Keep active code in the live paths above. Move stale experiments, duplicate entrypoints, old generated apps, and superseded docs into `archive/` with a dated folder. Do not add new root-level app entrypoints unless deployment or CI is changed at the same time.
