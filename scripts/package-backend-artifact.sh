#!/usr/bin/env bash
# Zip backend *source* for deployment (no node_modules, no .env).
# Run from repository root: bash scripts/package-backend-artifact.sh

set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND="$ROOT/backend"
STAMP="$(date +%Y%m%d-%H%M%S)"
OUT="$ROOT/deploy-artifacts"
STAGE="$(mktemp -d)"
trap 'rm -rf "$STAGE"' EXIT

if [[ ! -f "$BACKEND/package.json" ]]; then
  echo "Backend not found at $BACKEND" >&2
  exit 1
fi

mkdir -p "$STAGE/backend"
cp "$BACKEND/package.json" "$BACKEND/package-lock.json" "$STAGE/backend/"
[[ -f "$BACKEND/.env.example" ]] && cp "$BACKEND/.env.example" "$STAGE/backend/"
cp -R "$BACKEND/prisma" "$STAGE/backend/"
cp -R "$BACKEND/src" "$STAGE/backend/"
[[ -f "$BACKEND/sync-mentors-cms.mjs" ]] && cp "$BACKEND/sync-mentors-cms.mjs" "$STAGE/backend/"

mkdir -p "$OUT"
ZIP="$OUT/techu-backend-source-$STAMP.zip"
( cd "$STAGE" && zip -r "$ZIP" backend )

echo "==> Backend source artifact: $ZIP"
echo "    (Deploy team: npm ci && npx prisma migrate deploy && NODE_ENV=production npm start — see DEPLOYMENT.md)"
