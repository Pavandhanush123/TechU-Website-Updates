#requires -Version 5.1
<#
.SYNOPSIS
  Zip backend *source* for deployment (no node_modules, no .env secrets).

.DESCRIPTION
  Produces deploy-artifacts/techu-backend-source-<timestamp>.zip with a top-level
  `backend/` folder. The server (or CI) must run `npm ci`, `npx prisma migrate deploy`,
  `npx prisma generate`, and `NODE_ENV=production npm start` — see DEPLOYMENT.md.

  Run from repository root:
    .\scripts\package-backend-artifact.ps1
#>

$ErrorActionPreference = 'Stop'
$Root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$Backend = Join-Path $Root 'backend'
$OutDir = Join-Path $Root 'deploy-artifacts'
$Stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$Stage = Join-Path ([System.IO.Path]::GetTempPath()) "techu-backend-stage-$Stamp"
$StageBackend = Join-Path $Stage 'backend'

if (-not (Test-Path (Join-Path $Backend 'package.json'))) {
    throw "Backend not found at $Backend"
}

New-Item -ItemType Directory -Force -Path $StageBackend | Out-Null

Copy-Item (Join-Path $Backend 'package.json') $StageBackend
Copy-Item (Join-Path $Backend 'package-lock.json') $StageBackend
if (Test-Path (Join-Path $Backend '.env.example')) {
    Copy-Item (Join-Path $Backend '.env.example') $StageBackend
}

Copy-Item (Join-Path $Backend 'prisma') (Join-Path $StageBackend 'prisma') -Recurse
Copy-Item (Join-Path $Backend 'src') (Join-Path $StageBackend 'src') -Recurse

$mjs = Join-Path $Backend 'sync-mentors-cms.mjs'
if (Test-Path $mjs) {
    Copy-Item $mjs $StageBackend
}

New-Item -ItemType Directory -Force -Path $OutDir | Out-Null
$zipName = Join-Path $OutDir "techu-backend-source-$Stamp.zip"
if (Test-Path $zipName) { Remove-Item $zipName -Force }

Compress-Archive -Path (Join-Path $Stage 'backend') -DestinationPath $zipName -CompressionLevel Optimal
Remove-Item -Recurse -Force $Stage

Write-Host "==> Backend source artifact: $zipName"
Write-Host "    Deploy team: npm ci; npx prisma migrate deploy; NODE_ENV=production npm start (see DEPLOYMENT.md)"
