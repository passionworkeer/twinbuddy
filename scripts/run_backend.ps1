$ErrorActionPreference = "Stop"

Set-Location (Join-Path $PSScriptRoot "..")
python -m uvicorn api.index:app --reload --port 8000
