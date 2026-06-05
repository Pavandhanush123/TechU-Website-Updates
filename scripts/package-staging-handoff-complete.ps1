#requires -Version 5.1
<#
.SYNOPSIS
  Creates a clearly named staging handoff: built frontend + backend, neither with node_modules.

.DESCRIPTION
  1. Runs `npm run build` in frontend/ (uses frontend/.env.production → VITE_API_BASE_URL).
  2. Writes under deploy-artifacts/:
     - Folder: TechU-Staging-Handoff_devserver-techu.in_<date>/
         01-frontend-static-VITE-devserver-techu.in/   ← Vite dist (no node_modules)
         02-backend-no-node_modules/                    ← API source (no node_modules, no uploads, no .env)
     - Zip:  same folder name zipped (entire handoff)
     - Zip:  TechU-Staging-01-frontend-only_devserver-techu.in_<date>.zip
     - Zip:  TechU-Staging-02-backend-only_no-node-modules_<date>.zip

  Run from repository root:
    .\scripts\package-staging-handoff-complete.ps1
  Skip frontend rebuild (use existing frontend/dist):
    .\scripts\package-staging-handoff-complete.ps1 -SkipFrontendBuild
#>
param(
    [switch] $SkipFrontendBuild
)

$ErrorActionPreference = "Stop"
$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$stamp = Get-Date -Format "yyyy-MM-dd"
$handoffName = "TechU-Staging-Handoff_devserver-techu.in_$stamp"
$outRoot = Join-Path $root "deploy-artifacts"
$handoffDir = Join-Path $outRoot $handoffName

$frontendDist = Join-Path $root "frontend\dist"
$frontendOut = Join-Path $handoffDir "01-frontend-static-VITE-devserver-techu.in"
$backendSrc = Join-Path $root "backend"
$backendOut = Join-Path $handoffDir "02-backend-no-node_modules"

if (-not (Test-Path $backendSrc)) {
    throw "backend not found: $backendSrc"
}

New-Item -ItemType Directory -Force -Path $outRoot | Out-Null
Remove-Item $handoffDir -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force -Path $handoffDir | Out-Null

if (-not $SkipFrontendBuild) {
    Write-Host "==> frontend: npm run build (uses frontend/.env.production)"
    Push-Location (Join-Path $root "frontend")
    npm run build
    if ($LASTEXITCODE -ne 0) { throw "frontend build failed" }
    Pop-Location
} else {
    Write-Host "==> skipping frontend build (-SkipFrontendBuild)"
}

if (-not (Test-Path $frontendDist)) {
    throw "frontend dist missing: $frontendDist - run build first"
}

Write-Host "==> copy frontend dist -> $frontendOut"
New-Item -ItemType Directory -Force -Path $frontendOut | Out-Null
$rc = & robocopy $frontendDist $frontendOut /E /NFL /NDL /NJH /NJS /nc /ns /np
if ($rc -ge 8) { throw "robocopy frontend failed: $rc" }

Write-Host "==> copy backend (exclude node_modules, uploads, .env) -> $backendOut"
New-Item -ItemType Directory -Force -Path $backendOut | Out-Null
$rc = & robocopy $backendSrc $backendOut /E /XD node_modules uploads /XF .env /NFL /NDL /NJH /NJS /nc /ns /np
if ($rc -ge 8) { throw "robocopy backend failed: $rc" }

$readmePath = Join-Path $handoffDir "README.txt"
@(
    "TechU staging handoff - devserver.techu.in ($stamp)",
    "====================================================",
    "",
    "01-frontend-static-VITE-devserver-techu.in",
    "  Vite production build. API: https://devserver.techu.in (from frontend/.env.production).",
    "  No node_modules - deploy as static site root.",
    "",
    "02-backend-no_node_modules",
    "  On server: npm ci; npx prisma migrate deploy; npm start",
    "  Copy .env from .env.example. No node_modules or uploads included here.",
    "",
    "Archives in deploy-artifacts:",
    "  - ${handoffName}.zip (full folder)",
    "  - TechU-Staging-01-frontend-only_devserver-techu.in_${stamp}.zip",
    "  - TechU-Staging-02-backend-only_no-node-modules_${stamp}.zip"
) | Set-Content -Path $readmePath -Encoding UTF8

$zipAll = Join-Path $outRoot "$handoffName.zip"
$zipFe  = Join-Path $outRoot "TechU-Staging-01-frontend-only_devserver-techu.in_$stamp.zip"
$zipBe  = Join-Path $outRoot "TechU-Staging-02-backend-only_no-node-modules_$stamp.zip"

foreach ($z in @($zipAll, $zipFe, $zipBe)) {
    if (Test-Path $z) { Remove-Item $z -Force }
}

Write-Host "==> zip: full handoff"
Compress-Archive -Path $handoffDir -DestinationPath $zipAll -CompressionLevel Optimal -Force

Write-Host "==> zip: frontend only"
Compress-Archive -Path $frontendOut -DestinationPath $zipFe -CompressionLevel Optimal -Force

Write-Host "==> zip: backend only"
Compress-Archive -Path $backendOut -DestinationPath $zipBe -CompressionLevel Optimal -Force

Write-Host ""
Write-Host "Done."
Write-Host "  Folder: $handoffDir"
Write-Host "  Zip (all):   $zipAll"
Write-Host "  Zip (front): $zipFe"
Write-Host "  Zip (back):  $zipBe"
