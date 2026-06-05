# TechU — dev deployment handoff (2026-05-15)

This package matches a typical **same-origin** setup: the SPA is served as static files and **`/api` is reverse-proxied** to the Node backend (same as local dev with Vite proxy).

## Contents

| Path | Purpose |
|------|---------|
| `frontend-dist/` | **Pre-built** Vite output. Point the web server document root here (or copy these files into your existing static root). |
| `backend/` | Express + Prisma API — **not** pre-built; install deps and run on the server. |

**Not included (you must configure on the server):** `.env` files, `node_modules/`, database data.

## Requirements

- **Node.js 20+**
- **MySQL** (version supported by Prisma in `backend/prisma/schema.prisma`)
- Process manager (systemd, PM2, or Plesk Node) for the API

## 1. Backend

```bash
cd backend
cp .env.example .env
# Edit .env: DB_HOST, DB_NAME, DB_USER, DB_PASSWORD (and optional DB_PORT), AUTH_SECRET (32+ chars), PORT, CORS_ORIGINS if needed.
# DATABASE_URL is optional — it is built from DB_* when unset.
npm ci
npm run migrate:deploy
npx prisma db seed   # optional: default CMS + admin bootstrap data
npm start
```

Default API listens on **port 3001** (`HOST=0.0.0.0`). Adjust `PORT` in `.env` if required.

**“Cannot GET /”:** Express only had API routes unless you serve the SPA. Fix with **either** nginx/`try_files` + static `dist` as in §2 **or** set **`FRONTEND_DIST`** in backend `.env` to your Vite `dist/` path so Node serves `index.html` and assets on the same port.

**Windows note:** `npm start` uses `NODE_ENV=production` (Unix-style). On Windows use:

`set NODE_ENV=production && node src/index.js` or configure your host to set `NODE_ENV`.

**CMS mentors sync (optional):** from `backend/`, after DB is up: `node sync-mentors-cms.mjs`

## 2. Frontend (static)

The bundle in `frontend-dist/` was built with **`VITE_API_BASE_URL` empty** so the browser calls **`/api/...` on the same host**. Your reverse proxy must forward `/api` to the backend.

### Nginx example

```nginx
server {
  server_name example.com;
  root /var/www/techu/frontend-dist;
  index index.html;

  location /api {
    proxy_pass http://127.0.0.1:3001;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  location / {
    try_files $uri $uri/ /index.html;
  }
}
```

### If the API is on a different origin

Rebuild the frontend with `VITE_API_BASE_URL=https://api.yourdomain.com` (no trailing slash), then replace `frontend-dist/` with the new `dist/` output.

## 3. Admin & uploads

- Admin routes use session cookies; **HTTPS** in production is recommended.
- Uploaded images are stored under the backend’s configured uploads path (see app / `uploads`); ensure that directory exists and is writable and **backed up**.

## 4. Checklist

- [ ] MySQL created; `DATABASE_URL` and `DB_*` set
- [ ] `AUTH_SECRET` set (strong random string)
- [ ] `prisma migrate deploy` succeeded
- [ ] Backend process running and reachable on loopback
- [ ] Nginx (or equivalent) serves `frontend-dist` + proxies `/api`
- [ ] SPA fallback: all non-file routes → `index.html`

---

**Package name:** `TechU-devserver-handoff-2026-05-15`  
**Built:** frontend production bundle; backend source as in repo at handoff time.
