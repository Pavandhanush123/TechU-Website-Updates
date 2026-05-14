# TechU

Production lead-capture website and admin dashboard for TechU Innovation Labs.

This repository contains:

- `frontend/`: React + Vite SPA (public site + admin UI).
- `backend/`: Node.js Express API with Prisma and MySQL.

For full product and technical details, see `docs/PRODUCT_DEVELOPMENT.md`.

## Architecture

```text
Frontend SPA (React + Vite + TanStack Router)
        |
        | HTTP requests to /api/*
        v
Backend API (Express + Prisma)
        |
        v
MySQL database
```

Rules:

- Frontend never talks to MySQL directly.
- Frontend only calls backend APIs (`/api/*`).
- Backend owns auth, validation, business logic, and persistence.

## Repository Layout

```text
.
├── frontend/
│   ├── package.json
│   ├── .env.example
│   └── src/
│       ├── routes/
│       ├── components/
│       └── lib/api.ts
├── backend/
│   ├── package.json
│   ├── .env.example
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.js
│   └── src/
│       ├── index.js
│       ├── routes/
│       ├── middleware/
│       └── rate-limit.js
└── docs/
    └── PRODUCT_DEVELOPMENT.md
```

## API Overview

### Public

- `GET /api/health`
- `POST /api/leads/demo`
- `POST /api/leads/application`
- `POST /api/leads/brochure`
- `GET /api/cms/sections`
- `GET /api/cms/sections/:key`
- `GET /api/blogs`
- `GET /api/blogs/:slug`

### Auth

- `POST /api/auth/ensure-admin`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/session`
- `POST /api/auth/change-password`

### Admin

- `GET /api/admin/leads`
- `GET /api/admin/stats`
- `PATCH /api/admin/leads/:id/status`
- `PATCH /api/admin/leads/:id/notes`
- `DELETE /api/admin/leads/:id`
- `POST /api/admin/leads/bulk-status`
- `POST /api/admin/leads/bulk-delete`
- `GET /api/admin/cms/sections`
- `GET /api/admin/cms/sections/:key`
- `PUT /api/admin/cms/sections/:key`
- `GET /api/admin/blogs`
- `GET /api/admin/blogs/:id`
- `POST /api/admin/blogs`
- `PATCH /api/admin/blogs/:id`
- `DELETE /api/admin/blogs/:id`
- `POST /api/admin/uploads/image`
- `GET /uploads/:filename` (static file serving)

## Environment Variables

### Backend (`backend/.env`)

```env
NODE_ENV=production
AUTH_SECRET=<at least 32 chars>

DB_HOST=localhost
DB_PORT=3306
DB_NAME=techu
DB_USER=techu_app
DB_PASSWORD=<strong-password>

# Required by Prisma schema
DATABASE_URL=mysql://techu_app:<strong-password>@localhost:3306/techu

ADMIN_EMAIL=admin@techu.in
ADMIN_PASSWORD=<temporary-initial-password>
# RESET_ADMIN_PASSWORD=true

PORT=3001
HOST=0.0.0.0
CORS_ORIGINS=http://localhost:5173,http://localhost:4173
```

Notes:

- `AUTH_SECRET` is mandatory in production. Startup fails if missing/too short.
- `DATABASE_URL` is required by Prisma (`backend/prisma/schema.prisma`).
- `ADMIN_PASSWORD` should be rotated after first login.

### Frontend (`frontend/.env`)

```env
VITE_API_BASE_URL=
```

Dev override (`frontend/.env.local`):

```env
VITE_DEV_API_PROXY=http://localhost:3001
```

## Local Development

Backend terminal:

```bash
cd backend
cp .env.example .env
# fill required env vars, including DATABASE_URL
npm install
npm run dev
```

Frontend terminal:

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Default local URLs:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3001`

## Scripts

### Backend (`backend/package.json`)

- `npm run dev` - watch mode: `node --watch --env-file=.env src/index.js`
- `npm start` - production mode: `NODE_ENV=production node src/index.js`

### Frontend (`frontend/package.json`)

- `npm run dev`
- `npm run build`
- `npm run preview`
- `npm run typecheck`
- `npm run lint`

## Production Deployment Notes

Minimum requirements:

- Node.js 20+
- MySQL accessible from backend
- `AUTH_SECRET` and `DATABASE_URL` configured
- Reverse proxy for `/api/*` to backend
- SPA fallback to `/index.html`

Recommended topology:

1. Build frontend (`frontend/dist`) and serve as static files.
2. Run backend process from `backend/` using `npm start`.
3. Proxy `/api/*` to backend and keep frontend + API same-origin where possible.
4. Persist and back up MySQL data and uploaded files under `backend/uploads`.

## Security and Operations

- Session auth uses `iron-session` cookies (`httpOnly`).
- Validation is enforced server-side with Zod schemas.
- Rate-limiting is token-bucket by client IP:
  - login: 10/min
  - demo: 5/min
  - application: 5/min
  - brochure: 10/min
- Health endpoint: `GET /api/health`

## Admin Password Reset

To rotate admin password through env:

1. Set `ADMIN_EMAIL` to the existing admin.
2. Set `ADMIN_PASSWORD` to new value.
3. Set `RESET_ADMIN_PASSWORD=true`.
4. Restart backend.
5. Call `/api/auth/ensure-admin` once.
6. Remove `RESET_ADMIN_PASSWORD` and restart.

## License

UNLICENSED - internal property of TechU Innovation Labs.
