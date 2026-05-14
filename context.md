System Architecture (Context Ready)
Frontend: frontend/ is a React + Vite SPA using TanStack Router.
Backend: backend/ is an Express API in JavaScript, using Prisma ORM against MySQL.
Contract boundary: frontend only communicates via HTTP (/api/*), no direct DB access.
State/auth model: backend manages auth/session (cookie-based), validation, persistence, and security middleware.
Static assets: uploaded media is served from /uploads/* by backend.
Primary Route Map (Current)
Public frontend routes: /, /courses, /course-detail, /blog, /blog/$slug
Admin frontend routes: /admin, /admin/leads, /admin/content, /admin/blogs, /admin/settings (with /admin/login behavior in routing)
Backend API domains:
/api/auth/*
/api/leads/*
/api/cms/* (public)
/api/blogs/* (public)
/api/admin/* (admin leads/stats)
/api/admin/cms/*
/api/admin/blogs/*
/api/admin/uploads/*
/api/health
Ready for your first specific change request.