# Builds TechU-backend-for-deploy.zip under deploy-artifacts/ (gitignored).
# Excludes: node_modules, uploads/, .env — includes .env.example, prisma/, src/, package.json, etc.

$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
$backendSrc = Join-Path $root "backend"
$outRoot = Join-Path $root "deploy-artifacts"
$bundleName = "backend"
$bundlePath = Join-Path $outRoot $bundleName
$zipPath = Join-Path $outRoot "TechU-backend-for-deploy.zip"

if (-not (Test-Path $backendSrc)) {
  throw "backend folder not found: $backendSrc"
}

New-Item -ItemType Directory -Force -Path $outRoot | Out-Null
Remove-Item $bundlePath -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force -Path $bundlePath | Out-Null

# /E recurse, /XD exclude dirs, /XF exclude files, quiet stats
$rc = & robocopy $backendSrc $bundlePath /E /XD node_modules uploads /XF .env /NFL /NDL /NJH /NJS /nc /ns /np
if ($rc -ge 8) {
  throw "robocopy failed with exit code $rc"
}

if (Test-Path $zipPath) {
  Remove-Item $zipPath -Force
}
Compress-Archive -Path $bundlePath -DestinationPath $zipPath -CompressionLevel Optimal -Force
Remove-Item $bundlePath -Recurse -Force

Write-Host "Wrote $zipPath (no node_modules, no uploads, no .env)"
