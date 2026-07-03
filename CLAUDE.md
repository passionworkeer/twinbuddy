# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

TwinBuddy (孪生搭子) — a Douyin-hackathon product where a user's "digital twin" (a distilled persona) finds and negotiates with another user's twin to produce a travel-buddy itinerary, surfaced as a swipeable "懂你卡片" (understands-you card). Stack: React + Vite frontend, FastAPI + LangGraph backend, MiniMax LLM, MING personality-distillation framework.

## Repo layout (read this first — it's non-obvious)

The repo root holds **both** the backend and the frontend, plus loose top-level Python modules the backend imports:

```
.
├── api/                     # FastAPI backend (the deployed app)
│   ├── index.py             # ENTRY: uvicorn api.index:app
│   ├── frontend_api.py      # merges every sub-router into one `router`
│   ├── _store.py            # in-memory state, JSON-backed (dev)
│   ├── negotiate.py         # /api/negotiate — persona gen + negotiation
│   ├── negotiation/         # LangGraph state machine (state/nodes/graph/llm_*)
│   ├── migrations/          # Alembic (Postgres, prod)
│   └── tests/               # pytest
├── persona_generator.py     # LIVE: imported by api/negotiate.py & api/persona_doc.py
├── persona_layers.py        # LIVE: imported by persona_generator
├── persona_engine.py        # LEGACY/DEAD — imports nonexistent persona_distiller; do not rely on it
├── twinbuddy/frontend/      # React + Vite app (the real frontend)
├── MING/                    # standalone "skill" framework for personality distillation (own prompts/memory)
├── database/schema/         # Postgres DDL (numbered .sql files)
├── docs/                    # api-frontend.md, api-backend.md, DEPLOY.md, test reports
├── requirements.txt         # backend deps incl. langgraph/numpy/scipy (negotiation layer)
├── api/requirements.txt     # backend deps incl. sqlalchemy/alembic/psycopg2 (DB layer) — used by CI
└── docker-compose.yml       # postgres + redis + qdrant for local infra
```

Notes:
- The stray root `package.json` (React 19 / router v7) is **not** the frontend. The real frontend is `twinbuddy/frontend/package.json` (React 18, router v6).
- The nested `twinbuddy/CLAUDE.md` is an older spec with stale `hecker/` paths and an inaccurate router-version claim; prefer this file.
- Many files still reference `E:\desktop\hecker\...` (the project's former name/location). Those paths are stale; the repo now lives at `D:\Data\Desktop\twinbuddy`.

## Commands

### Backend (run from repo root)

```bash
pip install -r requirements.txt          # langgraph/numpy/scipy — needed for negotiation
pip install -r api/requirements.txt       # sqlalchemy/alembic/psycopg2 — needed for DB/CI
python -m uvicorn api.index:app --reload --port 8000   # → http://localhost:8000/docs

# Tests
python -m pytest api/tests -q
python -m pytest api/tests/test_negotiate_endpoint.py -v          # one file
python -m pytest api/tests/test_negotiation.py::test_name -v      # one test

# DB migrations (only when targeting Postgres, not the in-memory store)
alembic -c api/alembic.ini upgrade head

# Local infra (Postgres/Redis/Qdrant)
docker compose up -d
```

### Frontend (run from `twinbuddy/frontend/`)

```bash
npm install
npm run dev          # → http://localhost:5173  (proxies /api → :8000)
npm run build        # tsc && vite build
npm test             # vitest (watch)
npm run test -- --run                       # vitest single run (what CI uses)
npm run test -- src/__tests__/Foo.test.tsx  # one file
npm run lint
npx playwright test                              # E2E (all)
npx playwright test e2e/twinbuddy-e2e.spec.ts    # one spec
npx playwright test --ui                         # interactive
```

CI (`.github/workflows/ci.yml`) triggers on `main` and `feat/**`, `fix/**`, `chores/**` branches and runs: backend `pytest api/tests` (with a Postgres service + alembic migrate), frontend `vitest --run` + `npm run build`. **Use `npm`, not `pnpm**` — CI and `package-lock.json` are npm-based (the README's `pnpm` reference is stale).

## Architecture

### Backend: single FastAPI app, merged routers

`api/index.py` creates the app and includes exactly two routers: `frontend_router` and `stt_router`. `frontend_api.py` is a pure aggregation layer — it imports every feature router (`buddies`, `buddies_v2`, `blind_game`, `chat`, `community`, `messages`, `negotiate`, `persona`, `profiles`, `security`, `trips`) and merges them. **Every sub-router owns its own `prefix="/api"`**, so `frontend_api` adds no extra prefix. To add an endpoint, create a router in a new/existing `api/*.py` with `prefix="/api"`, then register it in `frontend_api.py`.

- `/api/health` is the liveness check.
- `/docs` and `/redoc` are disabled when `VERCEL` env is set.
- STT (speech-to-text) lives in `stt_api.py` under `/api/stt`, including a WebSocket at `/api/stt/ws` proxied by Vite.

### Negotiation: LangGraph state machine

`api/negotiation/` implements the twin-vs-twin negotiation as a LangGraph (`state.py` → `nodes.py`/`llm_nodes.py` → `graph.py`). `NegotiationPhase` enum drives transitions: `IDLE → PROPOSE → PERSONA_INIT → CHAT_ROUND → (CONFLICT_DETECTED → NEGOTIATION)* → CONSENSUS_FOUND → REPORT_GENERATED`. The LLM nodes call MiniMax via `llm_client.py`. Up to 3 rounds; each round is generated dialogue, not templates. `api/negotiate.py` is the HTTP surface (`POST /api/negotiate`) that builds personas and runs the graph.

### Persona distillation (MING four-dimension model)

`persona_generator.py` distills a travel persona from onboarding fields (MBTI + interests + one-liner + city) using an evidence-grading discipline: `v`=verbatim quote (≥60%), `a`=reasonable inference (≤30%), `i`=impression (≥10%); never fabricate occupation/age/specific experiences. `persona_layers.py` renders the distilled result into Layer0–Layer4 structured JSON (Layer0 = immutable hard rules / negative constraints). The `MING/` directory is a larger, standalone "digital-twin skill" framework (its own `SKILL.md`, `prompts/`, `memory/`) — conceptually related but not imported by the backend.

### Storage: in-memory now, Postgres in prod

Dev state is held in process-memory dicts in `api/_store.py`, each backed by a JSON file under repo-root `data/` (gitignored, auto-created). This is what the running app uses locally. Postgres is the production target: DDL in `database/schema/` (numbered files), Alembic migrations in `api/migrations/`. When adding a new persisted entity, extend `_store.py` for dev and add a migration + schema file for prod.

### Frontend: routing, onboarding gate, offline mocks

`src/main.tsx` → `App.tsx`. `react-router-dom` v6. `/` redirects to `/onboarding` unless `localStorage` flag `completed` is set (see `HomeRedirect` + `useLocalStorage` + `VITE_STORAGE_KEYS`), otherwise `/home`. Authed pages share `components/layout/AppLayout`. Pages live in `src/pages/v2/` (Home/Buddies/BlindGame/Community/Messages/Profile/Onboarding). Path alias `@` → `src/`. The client (`src/api/client.ts`) reads `VITE_API_BASE` (defaults to `/api`, proxied by Vite). `src/mocks/` holds fixture data so the UI can run without the backend.

### Conventions

- **Immutability**: state updates return new objects (`{...obj, field}`), never mutate in place — the frontend relies on this for re-renders.
- **Evidence honesty in persona code**: inferences must carry hedges and evidence grades; do not assert fabricated facts.
- **Commit messages**: write them in Chinese (subject + body), keeping the English conventional-commit prefix — see the global `~/.claude/CLAUDE.md`. Branch names stay English/kebab-case.

## Environment variables

Backend (Railway): `MINIMAX_API_KEY`, `XFYUN_APP_ID` / `XFYUN_API_KEY` / `XFYUN_API_SECRET` (iFlytek STT). Local: a repo-root `.env` is auto-loaded by `api/index.py` (it's gitignored).

Frontend (Vercel): `VITE_API_BASE` (e.g. `https://twinbuddy-production.up.railway.app`), `VITE_WS_BASE`. Locally these are optional — Vite proxies `/api` to `:8000`.

## Deployment

Backend → Railway (Railpack builder; start cmd in `railway.toml`/`Procfile`: `uvicorn api.index:app --host 0.0.0.0 --port $PORT`). Frontend → Vercel with Root Directory `twinbuddy/frontend/`. Full runbook in `docs/DEPLOY.md` (note: it contains stale `E:\desktop\hecker` paths).
