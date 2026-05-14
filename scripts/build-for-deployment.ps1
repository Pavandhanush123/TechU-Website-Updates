#requires -Version 5.1
<#
.SYNOPSIS
  Production build for TechU (frontend dist + Prisma client) and a zip handoff for deployment.

.DESCRIPTION
  Run from the repository root:
    .\scripts\build-for-deployment.ps1
  Skip npm ci when node_modules are already fresh:
    .\scripts\build-for-deployment.ps1 -SkipInstall
#>
param(
    [switch] $SkipInstall
)

$ErrorActionPreference = 'Stop'
$Root = Resolve-Path (Join-Path $PSScriptRoot '..')
Set-Location $Root

$Stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$OutDir = Join-Path $Root 'deploy-artifacts'
$Stage = Join-Path ([System.IO.Path]::GetTempPath()) "techu-deploy-stage-$Stamp"

$RootPath = $Root.Path
$gitSha = ''
if (Test-Path (Join-Path $RootPath '.git')) {
    try {
        $gitSha = (git -C $RootPath rev-parse --short HEAD).Trim()
    } catch {
        $gitSha = ''
    }
}

Write-Host "==> TechU deployment build (root: $RootPath)"

if (-not $SkipInstall) {
    Write-Host '==> npm ci (frontend)'
    Push-Location (Join-Path $Root 'frontend')
    npm ci
    if ($LASTEXITCODE -ne 0) { throw "npm ci (frontend) failed (exit $LASTEXITCODE)" }
    Pop-Location

    Write-Host '==> npm ci (backend)'
    Push-Location (Join-Path $Root 'backend')
    npm ci
    if ($LASTEXITCODE -ne 0) { throw "npm ci (backend) failed (exit $LASTEXITCODE)" }
    Pop-Location
} else {
    Write-Host '==> -SkipInstall — skipping npm ci'
}

Write-Host '==> frontend: npm run build'
Push-Location (Join-Path $Root 'frontend')
npm run build
if ($LASTEXITCODE -ne 0) { throw "frontend build failed (exit $LASTEXITCODE)" }
Pop-Location

Write-Host '==> backend: npx prisma generate'
Push-Location (Join-Path $Root 'backend')
npx prisma generate
if ($LASTEXITCODE -ne 0) { throw "prisma generate failed (exit $LASTEXITCODE). On Windows, close apps using the DB engine or retry; on Linux/CI this should succeed cleanly." }
Pop-Location

New-Item -ItemType Directory -Force -Path $OutDir | Out-Null
New-Item -ItemType Directory -Force -Path $Stage | Out-Null

$nodeV = (& node -v 2>$null)
if (-not $nodeV) { $nodeV = 'unknown' }
$npmV = (& npm -v 2>$null)
if (-not $npmV) { $npmV = 'unknown' }

$manifestPath = Join-Path $OutDir 'BUILD_MANIFEST.txt'
$manifest = @"
TechU build manifest
===================
Timestamp (UTC): $($(Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ'))
Stamp: $Stamp
Node: $nodeV
npm: $npmV
Git SHA: $(if ($gitSha) { $gitSha } else { 'n/a' })

Artifacts:
  - frontend/dist/  (production static site)
  - Backend: run from backend/ with NODE_ENV=production (see DEPLOYMENT.md)
"@
Set-Content -Path $manifestPath -Value $manifest -Encoding utf8

Copy-Item $manifestPath (Join-Path $Stage 'BUILD_MANIFEST.txt')
Copy-Item (Join-Path $Root 'DEPLOYMENT.md') (Join-Path $Stage 'DEPLOYMENT.md')
Copy-Item -Recurse (Join-Path $Root 'frontend\dist') (Join-Path $Stage 'frontend-dist')

$zipName = Join-Path $OutDir "techu-deployment-bundle-$Stamp.zip"
if (Test-Path $zipName) { Remove-Item $zipName -Force }
Compress-Archive -Path (Join-Path $Stage '*') -DestinationPath $zipName -CompressionLevel Optimal
Remove-Item -Recurse -Force $Stage

Write-Host '==> Done.'
Write-Host "    Manifest: $manifestPath"
Write-Host "    Zip:      $zipName"
