#!/usr/bin/env bash
# TechU — production build artifact for handoff to deployment.
# Run from repository root, or: bash scripts/build-for-deployment.sh

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

SKIP_INSTALL="${SKIP_INSTALL:-0}"
STAMP="$(date +%Y%m%d-%H%M%S)"
OUT_DIR="$ROOT/deploy-artifacts"
STAGE="$(mktemp -d)"
GIT_SHA=""
if command -v git >/dev/null 2>&1 && git -C "$ROOT" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  GIT_SHA="$(git -C "$ROOT" rev-parse --short HEAD 2>/dev/null || true)"
fi

echo "==> TechU deployment build (root: $ROOT)"

if [[ "$SKIP_INSTALL" != "1" ]]; then
  echo "==> npm ci (frontend)"
  (cd "$ROOT/frontend" && npm ci)
  echo "==> npm ci (backend)"
  (cd "$ROOT/backend" && npm ci)
else
  echo "==> SKIP_INSTALL=1 — skipping npm ci"
fi

echo "==> frontend: npm run build"
(cd "$ROOT/frontend" && npm run build)

echo "==> backend: npx prisma generate"
(cd "$ROOT/backend" && npx prisma generate)

mkdir -p "$OUT_DIR"

MANIFEST="$OUT_DIR/BUILD_MANIFEST.txt"
{
  echo "TechU build manifest"
  echo "==================="
  echo "Timestamp (UTC): $(date -u '+%Y-%m-%dT%H:%M:%SZ')"
  echo "Stamp: $STAMP"
  echo "Node: $(node -v 2>/dev/null || echo unknown)"
  echo "npm: $(npm -v 2>/dev/null || echo unknown)"
  echo "Git SHA: ${GIT_SHA:-n/a}"
  echo ""
  echo "Artifacts:"
  echo "  - frontend/dist/  (production static site)"
  echo "  - Backend: run from backend/ with NODE_ENV=production (see DEPLOYMENT.md)"
} >"$MANIFEST"

cp "$MANIFEST" "$STAGE/BUILD_MANIFEST.txt"
cp "$ROOT/DEPLOYMENT.md" "$STAGE/DEPLOYMENT.md"
cp -R "$ROOT/frontend/dist" "$STAGE/frontend-dist"

ZIP_NAME="$OUT_DIR/techu-deployment-bundle-${STAMP}.zip"
(
  cd "$STAGE"
  zip -r "$ZIP_NAME" .
)
rm -rf "$STAGE"

echo "==> Done."
echo "    Manifest: $MANIFEST"
echo "    Zip:      $ZIP_NAME"
