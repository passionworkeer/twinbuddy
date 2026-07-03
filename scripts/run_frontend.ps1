$ErrorActionPreference = "Stop"

Set-Location (Join-Path $PSScriptRoot "..\twinbuddy\frontend")
npm run dev
