# TwinBuddy Deploy Runbook

## Backend: Railway

The backend deploys from the repository root.

Start command:

```text
uvicorn api.index:app --host 0.0.0.0 --port $PORT
```

The same command is declared in:

- `railway.toml`
- `Procfile`

Recommended Railway variables:

```text
MINIMAX_API_KEY=...
XFYUN_APP_ID=...
XFYUN_API_KEY=...
XFYUN_API_SECRET=...
```

Optional additional MiniMax keys:

```text
MINIMAX_API_KEY_1=...
MINIMAX_API_KEY_2=...
```

Verify:

```powershell
curl https://<railway-domain>/api/health
```

Expected:

```json
{"status":"healthy","service":"twinbuddy-api"}
```

## Frontend: Vercel

Set Vercel Root Directory to:

```text
twinbuddy/frontend
```

Build command:

```text
npm run build
```

Output directory:

```text
dist
```

Recommended Vercel variables:

```text
VITE_API_BASE=https://<railway-domain>
VITE_WS_BASE=wss://<railway-domain>
```

Do not use the repository root as the Vercel frontend root. The root-level Node package was retired because the active frontend is `twinbuddy/frontend`.

The active frontend is a Vue/Vite graft of [`zyronon/douyin`](https://github.com/zyronon/douyin). Keep the bundled GPL-3.0 license and upstream attribution intact.

## Local Predeploy Checks

Backend:

```powershell
python -m pytest api/tests -q
```

Frontend:

```powershell
cd twinbuddy/frontend
npm run test   # smoke build
npm run build
```

## Database

CI applies Alembic migrations with:

```powershell
alembic -c api/alembic.ini upgrade head
```

For local infrastructure:

```powershell
docker compose up -d
```

The running local development app still uses `api/_store.py` unless code is changed to point specific features at Postgres.
