# TechU Website Architecture & Repository Map

## 1. System Overview
The TechU project is a lead-capture website and admin dashboard for TechU Innovation Labs. It is divided into two cleanly separated tiers:
- **Frontend**: A React + Vite Single Page Application (SPA).
- **Backend**: A Node.js + Express REST API.

The two systems communicate exclusively via HTTP (JSON over `fetch`). The frontend is completely stateless and devoid of secrets, while the backend handles all secure operations (database queries, authentication, session management, and payload validation).

---

## 2. Directory Structure

```text
TechU-Website--main/
├── frontend/                # React + Vite SPA
│   ├── index.html           # HTML entry point
│   ├── vite.config.ts       # Vite config (proxies /api to backend in dev)
│   ├── package.json         # Frontend dependencies (React, TanStack Router, Tailwind)
│   └── src/
│       ├── main.tsx         # React bootstrap
│       ├── routes/          # TanStack Router (file-based routing)
│       │   ├── index.tsx, courses.tsx, blog.tsx (Public Pages)
│       │   └── admin.*.tsx  # Admin dashboard routes
│       ├── components/      # UI components (shadcn/ui, Radix UI)
│       ├── lib/
│       │   ├── api.ts       # Typed API client (THE ONLY network entry)
│       │   ├── api-schemas.ts # Zod schemas for API payload validation
│       │   └── seo.ts, markdown.ts # Utilities for SEO and Markdown parsing
│       └── styles.css       # Global styles (Tailwind CSS v4)
│
├── backend/                 # Node.js + Express REST API
│   ├── package.json         # Backend dependencies (express, mysql2, iron-session, zod)
│   └── src/
│       ├── index.js         # Express app setup, middleware, and server initialization
│       ├── db.js            # MySQL connection pool and database helper functions
│       ├── auth.js          # Authentication logic (scrypt hashing, iron-session helpers)
│       ├── schemas.js       # Zod validation schemas for incoming requests
│       ├── rate-limit.js    # Rate limiting configuration to prevent abuse
│       ├── middleware/      # Custom middleware (e.g., requireAdmin)
│       └── routes/          # API endpoint handlers
│           ├── auth.js      # Login, logout, session management
│           ├── leads.js     # Public lead generation forms (demo, application, brochure)
│           ├── admin.js     # Admin-only operations for managing leads
│           ├── blogs-*.js   # Blog management (admin vs. public)
│           ├── cms-*.js     # CMS (Content Management System) endpoints
│           └── uploads.js   # File upload handling
```

---

## 3. Frontend Architecture

### Core Technologies
- **Framework**: React 19 + Vite 7
- **Routing**: `@tanstack/react-router` (File-based routing ensures strict type-safety for links and params).
- **Styling**: Tailwind CSS v4 + `shadcn/ui` (built on top of `@radix-ui` primitives).
- **Forms**: `react-hook-form` integrated with `zod` for client-side validation.

### Design Principles
- **No Direct DB Access**: The frontend does not have any database clients, SQL queries, or ORMs.
- **Strict Network Boundary**: All external data is fetched via `src/lib/api.ts`, which makes standard `fetch` calls to `/api/*`.
- **Environment Variables**: Only safe variables (prefixed with `VITE_`) are included in the frontend build. No secrets exist here.

---

## 4. Backend Architecture

### Core Technologies
- **Framework**: Express 4.x running on Node.js (>=20.0.0).
- **Database**: MySQL, utilizing `mysql2/promise` with connection pooling.
- **Validation**: `zod` is used aggressively to validate all incoming request bodies and parameters.
- **Authentication**: Cookie-based sessions using `iron-session` (no JWTs, which reduces token-theft vectors). Password hashing is done via Node's native `crypto.scrypt`.

### Design Principles
- **Total Data Ownership**: The backend is the source of truth. It manages the database schema and all secret material (e.g., `AUTH_SECRET`, `ADMIN_PASSWORD`).
- **Security First**: 
  - Sessions are managed with `httpOnly` encrypted cookies.
  - Endpoints validate input structure using `zod` before any business logic is executed.
  - Critical endpoints are protected by rate-limiting (e.g., 10 req/min for login).
- **Graceful Error Handling**: Requests respond with `{ ok: true, data: ... }` on success and `{ ok: false, error: ... }` on failure, creating a predictable contract for the frontend.

---

## 5. Deployment & Execution Flow

### Local Development
- Two separate development servers run in parallel:
  - **Backend** runs on `http://localhost:3001` (local dev).
  - **Frontend** runs on `http://localhost:5173` (local dev).
- The Vite dev server proxies `/api/*` to `http://127.0.0.1:3001` during development.
- **Staging builds** use **`https://devserver.techu.in`** as **`VITE_API_BASE_URL`** (`frontend/.env.production`). **`CORS_ORIGINS`** on the server must list that origin (`backend/.env.example`).

### Production
- The frontend is compiled into static assets (`frontend/dist/`).
- The Node.js application serves the API endpoints.
- A reverse proxy (e.g., Nginx via Plesk) routes traffic:
  - Any request starting with `/api/` goes to the backend application.
  - All other requests serve `index.html` from the frontend dist folder (supporting SPA routing).

---

## 6. Key Data Flows

1. **Lead Submission**:
   - User fills a form on the frontend (`course-detail.tsx` or `index.tsx`).
   - `lib/api.ts` posts the data to `/api/leads/demo` or `/api/leads/application`.
   - Backend `src/routes/leads.js` validates the JSON body with `zod`.
   - Data is stored in MySQL via `src/db.js`.
   - Success response is sent to the frontend, which shows a confirmation message via `sonner` toast.

2. **Admin Login**:
   - Admin submits credentials at `/admin/login`.
   - Request to `/api/auth/login`. Backend `auth.js` hashes the password and compares it against the database.
   - If successful, an `iron-session` cookie is securely attached to the response.
   - Frontend is redirected to the dashboard, now carrying the `httpOnly` cookie for subsequent `/api/admin/*` calls.

This architecture ensures high security, clear separation of concerns, and robust scalability for the TechU platform.
