# TechU Website

Professional platform for TechU, featuring course applications, brochure requests, and a content management system (CMS).

## 🚀 Technology Stack

### Frontend
- **Framework**: React 18 with Vite
- **Styling**: Tailwind CSS
- **State Management**: React Hooks
- **Form Validation**: Zod
- **Icons**: Lucide React
- **Animations**: Framer Motion

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MySQL (hosted on DigitalOcean/AWS)
- **ORM**: Prisma
- **Validation**: Zod
- **Authentication**: Iron Session (Cookie-based)

## 📁 Project Structure

```text
TechU-Website/
├── backend/               # Express server & Prisma ORM
│   ├── prisma/            # Database schema & migrations
│   └── src/               # Server logic (routes, middleware, schemas)
├── frontend/              # Vite + React application
│   ├── src/               # Components, pages, and hooks
│   └── public/            # Static assets
└── docs/                  # Project documentation
```

## 🛠️ Development Setup

### Prerequisites
- Node.js >= 20
- MySQL Server

### 1. Backend Setup
```bash
cd backend
npm install
# Configure .env (DATABASE_URL, SESSION_PASSWORD)
npx prisma migrate dev
npm run dev
```

### 2. Frontend Setup
```bash
cd frontend
npm install
# Configure .env — for staging frontend builds see VITE_API_BASE_URL=https://devserver.techu.in in .env.production / .env.example
npm run dev
```

## 🌐 Deployment

The project is designed for high performance and scalability.

- **Frontend**: Deployed on Vercel/Netlify for fast edge delivery.
- **Backend**: Deployed on a VPS (DigitalOcean Droplet/AWS EC2) using PM2.
- **Database**: Managed MySQL instance with strict security rules.

## 📄 License
Private project for TechU. All rights reserved.
