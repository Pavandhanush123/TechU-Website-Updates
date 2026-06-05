# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

TechU marketing/admissions website: a public React SPA (course pages, lead capture forms, blog) backed by an Express + Prisma/MySQL API. Site content is almost entirely **CMS-driven** — most homepage sections render from editable JSON stored in the DB, edited through an admin dashboard. The repo is split into two independent npm packages: `backend/` and `frontend/` (no root package.json / workspace).

## Commands

Run all commands from within `backend/` or `frontend/` respectively.

### Backend (`backend/`)
- `npm run dev` — start API with `node --watch` and `.env` loaded (port 3001)
- `npm start` — production start (`NODE_ENV=production`)
- `npm run migrate:dev` — create/apply a dev migration (wraps `prisma migrate dev`)
- `npm run migrate:deploy` — apply migrations in production
- `npm run db:generate` — regenerate Prisma client after editing `schema.prisma`
- `npm run db:pull` — introspect the DB back into the schema
- `node --env-file=.env prisma/seed.js` — seed default data (also runs via `prisma db seed`)
- There is **no test runner and no linter** configured for the backend. Ad-hoc scripts live in `backend/scratch/` and root-level `*.mjs` (e.g. `sync-mentors-cms.mjs`, `migrate-isa.mjs`).

### Frontend (`frontend/`)
- `npm run dev` — Vite dev server on port 5173, proxies `/api` → `http://127.0.0.1:3001`
- `npm run build` — production build to `dist/`
- `npm run typecheck` — `tsc --noEmit` (the closest thing to a test gate; run before committing)
- `npm run lint` — ESLint
- `npm run preview` — serve the built bundle on 4173 (also proxies `/api`)
- `npm run optimize:images` — compress images via `scripts/compress-images.mjs`
- No unit-test framework is configured; verification is typecheck + lint + manual.

### Prisma CLI note
Always invoke Prisma through the npm scripts (or `node --env-file=.env ./scripts/prisma-with-env.mjs <cmd>`), **not** bare `npx prisma`. The wrapper runs `ensure-database-url.js` first, which builds `DATABASE_URL` from discrete `DB_HOST`/`DB_USER`/`DB_PASSWORD`/`DB_NAME` env vars when `DATABASE_URL` itself isn't set (Plesk-style hosting).

## Architecture

### Backend (`backend/src/`)
- **`index.js`** — app entry. Validates `AUTH_SECRET` in prod, verifies DB connectivity at boot, configures CORS (allowlist via `CORS_ORIGINS`, plus localhost/LAN auto-allow in dev), security headers, mounts routers under `/api/*`, optionally serves the built SPA + uploads, and does SPA fallback routing. Graceful shutdown on SIGTERM/SIGINT.
- **Routers** (`routes/`) mounted in `index.js`:
  - Public: `auth.js` (`/api/auth`), `leads.js` (`/api/leads`), `cms-public.js` (`/api/cms`), `blogs-public.js` (`/api/blogs`)
  - Admin (auth-gated): `admin.js` + `admin-isa.js` (`/api/admin` — leads dashboards/stats), `cms-admin.js` (`/api/admin/cms`), `blogs-admin.js` (`/api/admin/blogs`), `uploads.js` (`/api/admin/uploads` — multer image uploads to `uploads/`)
- **Auth** (`auth.js` + `middleware/auth.js`) — cookie sessions via **iron-session** (encrypted cookie `techu_session`, no server session store). Passwords hashed with Node `scrypt` (`scrypt$salt$hash` format). `requireAuth` / `requireAdmin` middleware read the session and attach `req.userId/email/isAdmin`. The first admin is bootstrapped from `ADMIN_EMAIL`/`ADMIN_PASSWORD` via `POST /api/auth/ensure-admin`.
- **CMS** (`cms.js`) — the heart of the content model. `CMS_SECTION_KEYS` lists every editable section; `DEFAULTS` holds the seed/fallback JSON for each. Each section is one row in the `site_content` table (`sectionKey` → arbitrary `data` JSON). `getSection`/`listSections`/`upsertSection` are the only accessors. **When adding a CMS section, update `CMS_SECTION_KEYS` + `DEFAULTS` here, the `CmsSectionKey` union + data type in `frontend/src/lib/api.ts`, and the editor in `CmsFieldEditor.tsx`.**
- **Validation** — all request bodies validated with **Zod** schemas in `schemas/index.js` via the `validate()` middleware. Indian phone normalization lives in `util/indianPhone.js`.
- **Rate limiting** (`rate-limit.js`) — in-memory token-bucket per `action:ip`, keyed off `X-Forwarded-For`. Note: in-memory only, so it resets on restart and isn't shared across processes/instances.
- **Error handling** — async route handlers wrapped in `middleware/asyncHandler.js`; centralized `middleware/errorHandler.js` is the last middleware. API responses use a uniform `{ ok: boolean, ... }` / `{ ok: false, error }` shape.
- **Prisma** — single shared client in `prisma.js` (globalThis singleton in dev to avoid hot-reload connection leaks). Schema at `prisma/schema.prisma`: `User`/`UserRole` (RBAC enum), `DemoRequest` (leads — `source` is application/brochure/demo), `IsaLead`, `SiteContent` (CMS), `BlogPost`. Note: much of the codebase still has the **old raw-SQL `mysql2` implementation commented out** alongside the new Prisma code — the Prisma path is the live one.

### Frontend (`frontend/src/`)
- **Routing** — **TanStack Router** with file-based routes in `src/routes/` and an auto-generated `routeTree.gen.ts` (do not hand-edit; the Vite plugin regenerates it). Public routes: `index` (landing), `courses`, `course-detail`, `blog*`. Admin routes: `admin.*` (login, dashboard, leads, isa-leads, content, blogs, settings).
- **API client** — `src/lib/api.ts` is the single typed gateway. Everything goes through `apiFetch` (sends `credentials: "include"` for session cookies, unifies the `ApiResult<T>` shape). It deliberately **ignores `VITE_API_BASE_URL` on localhost/LAN dev hosts** and forces same-origin `/api` (through the Vite proxy) so admin session cookies stay first-party — this is intentional, see the comments in `resolveApiBase`. `resolveAssetUrl` resolves `/uploads/...` paths against the API base.
- **CMS consumption** — `hooks/useCmsSection.ts` fetches a section by key with a module-level cache + in-flight dedupe, and refetches on `invalidateCmsSectionCache` (after admin saves), cross-tab `storage` events, and tab re-focus. Components always pass a `fallback` (typically the same defaults as the backend) so they render before/without the network.
- **Components** — `components/landing/` (homepage sections, each typically backed by a CMS section), `components/course-detail/`, `components/courses/`, `components/admin/` (`AdminShell`, `CmsFieldEditor`, `CommandPalette`), `components/forms/`, and `components/ui/` (Radix + shadcn-style primitives, Tailwind v4). Static course data that isn't in the CMS lives in `src/data/courses.ts`.
- **Styling** — Tailwind CSS v4 via `@tailwindcss/vite`, Framer-Motion-style animations, Lucide icons. Path alias `@/` → `src/` (via `vite-tsconfig-paths`).

### Request flow (typical lead submit)
Form component → `submitX()` in `lib/api.ts` → `POST /api/leads/*` → `validate(zodSchema)` → `rateLimit()` → phone normalization → `prisma.demoRequest.create` → uniform `{ ok }` JSON. Admin later reads/manages it under `/api/admin/leads` (gated by `requireAdmin`).

## Configuration & Deployment
- Backend env (`.env`, see `backend/.env.example`): `AUTH_SECRET` (32+ chars, **required in prod**), DB creds (`DATABASE_URL` or discrete `DB_*`), `ADMIN_EMAIL`/`ADMIN_PASSWORD`, `CORS_ORIGINS`, `PORT`/`HOST`, optional `FRONTEND_DIST` (serve SPA from Express on one port), optional `RESET_ADMIN_PASSWORD`.
- Frontend env (`.env`, see `frontend/.env.example`): only `VITE_*` values ship to the browser — never put secrets here. `VITE_API_BASE_URL` for cross-origin prod builds.
- Two deployment shapes are supported: (a) same-origin — Express serves `frontend/dist/` and `/api` together (`FRONTEND_DIST` set); (b) split — SPA on a static host, API elsewhere with `CORS_ORIGINS` allowlisting the SPA origin. See `DEPLOYMENT.md`.
