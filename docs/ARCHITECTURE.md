# TwinBuddy Architecture

This document describes the current running architecture after the July 2026 structure cleanup.

## Product Loop

1. The user enters the Vue mobile feed shell.
2. The frontend stores onboarding state locally and can create a backend profile.
3. The backend distills onboarding fields into a travel persona.
4. Buddy persona data is scored against the user persona.
5. The negotiation endpoint asks the user twin and buddy twin to negotiate travel preferences.
6. The frontend renders the result as buddy cards, reports, blind-game flows, chat, and community surfaces.

## Active Backend

`api/index.py` is the only backend app entrypoint. It builds a FastAPI app, loads `.env` from the repo root, enables permissive CORS for development, and registers:

- `api.frontend_router`
- `api.stt_router`
- `/api/health`

`api/frontend_api.py` only aggregates routers. Feature routers keep their own `prefix="/api"`.

The active HTTP surface is split by feature:

- `api/profiles.py`
- `api/persona.py`
- `api/buddies.py`
- `api/buddies_v2.py`
- `api/negotiate.py`
- `api/chat.py`
- `api/messages.py`
- `api/security.py`
- `api/blind_game.py`
- `api/trips.py`
- `api/community.py`
- `api/stt_api.py`

## Persona And Negotiation

The active persona distillation code is:

- `persona_generator.py`
- `persona_layers.py`

The retired `persona_engine.py` was moved to archive because it imports the missing `persona_distiller` module.

Negotiation is exposed by `api/negotiate.py`. It builds or loads the user persona, loads the buddy persona, then attempts MiniMax-backed negotiation through `api/negotiation/graph.py`. If MiniMax is unavailable, slow, or misconfigured, the endpoint returns a mock negotiation result with metadata explaining the fallback source.

## Frontend

The active frontend is `twinbuddy/frontend/`. It is a full Vue/Vite graft of [`zyronon/douyin`](https://github.com/zyronon/douyin), kept as the product shell for the next TwinBuddy-specific card, recommendation, and settings work.

Important files:

- `src/main.ts`
- `src/App.vue`
- `src/router/*`
- `src/store/pinia.ts`
- `src/pages/home/*`
- `src/components/slide/*`
- `src/mock/index.ts`

The root-level Node package was archived because it did not represent the running frontend. The previous React frontend was also archived under `archive/2026-07-03-structure-cleanup/react-frontend/`.

## Data And Persistence

Development persistence uses `api/_store.py`. It keeps in-process dictionaries and writes JSON snapshots under the repo-root `data/` directory, which is ignored by git.

Production persistence is represented by:

- `database/schema/*.sql`
- `api/migrations/versions/*.py`
- `api/alembic.ini`

When adding persisted entities, update both the development store and the Postgres migration path.

## Buddy Data And Scoring

Buddy persona data and scoring live under `twinbuddy/agents/`.

The scoring engine is `twinbuddy/agents/scoring.py`. Backend modules load buddy data through `twinbuddy.agents.buddies` or compatibility helpers exposed from `api/mock_database.py`.

## MING

`MING/` is a standalone digital-twin framework folder. It is conceptually related to the product and useful as source material, but the running backend does not import it directly.

## CI

`.github/workflows/ci.yml` runs two jobs:

- Backend: install `api/requirements.txt`, run Alembic migrations, run `pytest api/tests -q`
- Frontend: `npm ci`, `npm run test` smoke build, `npm run build` in `twinbuddy/frontend`

## Archive Policy

Use `archive/YYYY-MM-DD-<reason>/` for retired files. Prefer archiving over deletion when the file contains historical implementation context, old deployment commands, or prior design work.

Historical reports that are still useful but not canonical live in `docs/reports/`.
