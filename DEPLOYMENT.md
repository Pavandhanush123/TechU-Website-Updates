# TechU — deployment handoff

Guide for ops / deployment: what this repo contains, how to produce runnable artifacts, and what to configure in production.

## Architecture

| Part | Stack | Production output |
|------|--------|---------------------|
| **Frontend** | Vite + React + TypeScript | Static files under `frontend/dist/` |
| **Backend** | Node.js (ES modules) + Express + Prisma + MySQL | Run from `backend/` with `npm start` |
| **Database** | MySQL | Schema via Prisma migrations in `backend/prisma/migrations/` |

Recommended hosting pattern: reverse proxy (e.g. nginx) serves **`frontend/dist`** for `/` and forwards **`/api`** to the Node process (`PORT`, default **3001**).  
If all HTTP traffic hits Node first, you will see **"Cannot GET /"** until you either follow that pattern or set **`FRONTEND_DIST`** in the backend `.env` to the Vite `dist/` path (Express will then serve the SPA and API together).

### Why ops asks to replace localhost with the staging URL (`https://devserver.techu.in`)

- **Frontend:** Any **`VITE_API_BASE_URL`** like `http://localhost:3001` is baked into the JS bundle. In production/staging, the browser runs on users’ machines — `localhost` would point at **their** PC, not your server. The repo sets **`https://devserver.techu.in`** (no trailing slash) in **`frontend/.env.production`** and **`frontend/.env.example`** so API calls hit the real host.
- **Backend:** **`CORS_ORIGINS`** must include **`https://devserver.techu.in`** so the browser is allowed to call the API with cookies from that origin. See **`backend/.env.example`**.
- **Leave as localhost / 127.0.0.1:** MySQL **`DB_HOST`**, Vite’s **dev-only** proxy target in **`frontend/vite.config.ts`**, and **nginx `proxy_pass http://127.0.0.1:3001`** (Node on the same machine as the proxy) — those are **not** public URLs and should stay on loopback.

**Backend zip without `node_modules`:** run `powershell -ExecutionPolicy Bypass -File scripts/package-backend-for-deploy.ps1` — output: **`deploy-artifacts/TechU-backend-for-deploy.zip`**.

## Prerequisites

- **Node.js** ≥ **20.x** (see `backend/package.json` `engines`)
- **npm** ≥ 10 (for `npm ci`)
- **MySQL** reachable from the backend host
- **Prisma CLI** via `npx` after `npm ci` in `backend/`

## One-command production build

From the **repository root** (`TechU-Website--main`):

**Windows (PowerShell)**

```powershell
.\scripts\build-for-deployment.ps1
```

**Linux / macOS**

```bash
chmod +x ./scripts/build-for-deployment.sh
./scripts/build-for-deployment.sh
```

Optional: skip reinstall when `node_modules` are already fresh:

```powershell
.\scripts\build-for-deployment.ps1 -SkipInstall
```

```bash
SKIP_INSTALL=1 ./scripts/build-for-deployment.sh
```

### What the scripts do

1. **`npm ci`** in `frontend/` and `backend/` (unless skip install).
2. **`npm run build`** in `frontend/` → writes **`frontend/dist/`** (optimized static SPA).
3. **`npx prisma generate`** in `backend/` → generates Prisma Client.
4. Writes **`deploy-artifacts/BUILD_MANIFEST.txt`** with timestamp and Node/npm versions (and git SHA when available).
5. Creates **`deploy-artifacts/techu-deployment-bundle-<timestamp>.zip`** containing:
   - `frontend-dist/` (copy of `frontend/dist`)
   - `DEPLOYMENT.md`
   - `BUILD_MANIFEST.txt`

> The zip is primarily the **prebuilt static frontend** plus documentation. Deploy the backend using **one of the options below**.

## Homepage overview videos (Infrastructure section)

`TechuOverviewVideo` plays **two** self-hosted clips in order: the first plays when the user interacts; when it ends, the second loads and plays automatically (user can press play again if autoplay is blocked).

| Deployed URL | Playback order | Notes |
|---|---|---|
| `/videos/techu-overview-part2.mp4` | **1st** | Exported from repo `video/Techu .mp4` |
| `/videos/techu-overview.mp4` | **2nd** | Original overview edit |

Source files live under **`frontend/public/videos/`** (copied to `frontend/dist/` on build).

**Avoid slow page loads:** the component attaches **`preload="none"`** and waits until the player is near the viewport (Intersection Observer) before setting `video.src`. Do not bump to `preload="auto"` without testing.

**Re-encode** for the web (example: 1280×720 cap, 30 fps, H.264 CRF 26, AAC 96 k, `moov` at start):

```powershell
ffmpeg -y -i "video/Techu .mp4" -c:v libx264 -profile:v main -preset medium -crf 26 -vf "scale='min(1280,iw)':-2,fps=30" -c:a aac -ac 2 -b:a 96k -movflags +faststart "frontend/public/videos/techu-overview-part2.mp4"
```

**Poster (first clip thumbnail):** `frontend/public/images/techu-overview-first-poster.jpg` — regen after changing the first-played MP4:

```powershell
ffmpeg -y -ss 00:00:01 -i "frontend/public/videos/techu-overview-part2.mp4" -frames:v 1 -q:v 2 "frontend/public/images/techu-overview-first-poster.jpg"
```

## Sending the backend to deployment

The API is Node source + Prisma—it is **not** inside the frontend bundle. Use any of these handoff methods:

### Option A — Backend source zip (simple handoff)

From the repo root, create a zip **without** `node_modules` and **without** `.env` (secrets stay off email/Slack):

**Windows**

```powershell
.\scripts\package-backend-artifact.ps1
```

**Linux / macOS**

```bash
chmod +x ./scripts/package-backend-artifact.sh
./scripts/package-backend-artifact.sh
```

Output: **`deploy-artifacts/techu-backend-source-<timestamp>.zip`** with a **`backend/`** folder containing:

- `package.json`, `package-lock.json`, `.env.example`
- `prisma/` (schema + migrations + seed)
- `src/` (application code)

**What deployment does after unzip**

1. `cd backend` (inside the unpacked tree)
2. Create **`.env`** on the server (copy from `.env.example`). Prefer **`DB_HOST`**, **`DB_PORT`**, **`DB_NAME`**, **`DB_USER`**, **`DB_PASSWORD`** — the app builds **`DATABASE_URL`** automatically for Prisma + MySQL. You can still set **`DATABASE_URL`** directly if the panel gives one string.
3. `npm ci`
4. **`npm run migrate:deploy`** (wraps Prisma so credentials work without pasting `DATABASE_URL`; equivalent to migrate after URL resolution)
5. `npx prisma generate` (if not already satisfied by `npm ci` postinstall — usually not needed separately)
6. `NODE_ENV=production npm start` (or **`node src/index.js`** with `NODE_ENV` set)

They still need **MySQL** and a process manager / reverse proxy as in the rest of this doc.

### Option B — Git tag / tarball of the repo

Preferable if they use CI: tag a release and let their pipeline **`git clone`**, run the same **`npm ci` + migrate + start** steps on `backend/`.

### Option C — Include backend in CI artifact

ZIP or tarball the **`backend/`** directory from checkout (excluding `node_modules`, `.env`, `uploads/`) — same payload as Option A.

**Do not** zip `backend/node_modules` from your laptop unless the server is the **same OS and CPU**; native Prisma/MySQL binaries may not transfer.

## Manual build (same as CI)

### Frontend

```bash
cd frontend
npm ci
npm run build
```

Output: **`frontend/dist/`**. Optional pipeline step: **`npm run typecheck`** and **`npm run lint`**.

Optional asset pass (lossless/smaller raster sources): **`npm run optimize:images`** (before `npm run build`).

### Backend

```bash
cd backend
npm ci
npx prisma generate
```

On the server, after configuring **`.env`** (see below):

```bash
npm run migrate:deploy   # applies migrations (builds DATABASE_URL from DB_* if needed)
NODE_ENV=production npm start   # Unix
```

On Windows, set `NODE_ENV=production` in the environment, then **`node src/index.js`** from `backend/`, or use a process manager that injects env vars.

### Environment variables

**Frontend** (`frontend/.env.production` or host env at **build time**):

| Variable | Purpose |
|----------|---------|
| `VITE_API_BASE_URL` | If empty, browser calls **`/api` on same origin**. Set to absolute API URL only if frontend and API differ by origin. |

See `frontend/.env.example`.

**Backend** (`backend/.env` on the server; never commit):

| Variable | Purpose |
|----------|---------|
| `NODE_ENV` | Use `production` for live. |
| `AUTH_SECRET` | **Required in production:** 32+ character secret for sessions. |
| `DATABASE_URL` | **Optional** if **`DB_*`** are set — the app composes a MySQL URL at startup. Set directly if your host supplies a single connection string only. |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | **Preferred on Plesk / panels:** separate fields. Required **unless** `DATABASE_URL` is set. |
| `PORT`, `HOST` | HTTP listen (defaults **3001** / **0.0.0.0**). |
| `CORS_ORIGINS` | Comma-separated browser origins when frontend and API are on different hosts. |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Bootstrap admin (see `backend/.env.example`). |

See **`backend/.env.example`**. You do **not** need to duplicate the same database twice: either discrete **`DB_*`** **or** **`DATABASE_URL`**.

Production guard: backend **refuses to start** if `NODE_ENV=production` and `AUTH_SECRET` is missing or too short.

### MySQL: credentials vs `DATABASE_URL`

Prisma’s schema still references `env("DATABASE_URL")`, but **`backend/src/ensure-database-url.js`** sets it from **`DB_HOST`**, **`DB_PORT`** (default 3306), **`DB_USER`**, **`DB_PASSWORD`**, and **`DB_NAME`** when it is missing — so ops can use **only** the fields their server UI provides. Use **`npm run migrate:deploy`** from `backend/` so migrations run after the same resolution. Raw `npx prisma migrate deploy` only works if **`DATABASE_URL`** is already in the environment or `.env`.

### First-time database

1. Configure MySQL in **`backend/.env`** (`DB_*` or `DATABASE_URL`).
2. Run **`npm run migrate:deploy`** from `backend/`.
3. Optional seed / CMS defaults: **`npx prisma db seed`**

## Health checks

- **Backend**: HTTP server listens on **`PORT`**; ensure reverse proxy mounts **`/api`** to it (see Express mount path in `backend/src/index.js`).
- **Frontend**: SPA — configure the web server so unknown paths fallback to **`index.html`** for client-side routing.

## Support files in this repo

| Path | Role |
|------|------|
| `scripts/build-for-deployment.ps1` | Windows: frontend build + zip handoff |
| `scripts/build-for-deployment.sh` | Unix: frontend build + zip handoff |
| `scripts/package-backend-artifact.ps1` | Windows: **backend source** zip (no secrets) |
| `scripts/package-backend-artifact.sh` | Unix: **backend source** zip (no secrets) |
| `deploy-artifacts/` | Generated zips + manifest (**gitignored**) |

---

## Troubleshooting

- **`npx prisma generate` fails on Windows with EPERM / rename on the query-engine DLL:** Another process (antivirus, IDE, or a running `node` server) may be locking Prisma’s engine. Stop the backend dev server, pause real-time AV for the repo folder, or run the script again; Linux CI agents typically do not hit this.

- **Questions for deployment** should reference **`BUILD_MANIFEST.txt`** timestamp and the **`techu-deployment-bundle-*.zip`** name.
