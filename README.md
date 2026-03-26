# AetherOS: AI-Driven Cloud-Native DevSecOps

Welcome to the future of cloud-native deployments. AetherOS connects your codebase seamlessly to Vercel (frontend) and Render (backend), with AI-powered security scans and automated database management via Neon.tech.

## Project Structure

- `/frontend`: Next.js 15 (App Router) - Deployed on Vercel.
- `/backend`: [AetherOS Engine (Live)](https://atheros.onrender.com) - Deployed on Render.
- `/mcp-tools`: Placeholder for Model Context Protocol server logic.

## Getting Started

### 1. Prerequisites
- Node.js (v18+ or later)
- PostgreSQL (Recommended: Neon.tech)

### 2. Backend Setup
```bash
cd backend
npm install
# Copy .env.example to .env and fill in your DATABASE_URL and RENDER_API_KEY
npx prisma generate
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
# Copy .env.local and update RENDER_BACKEND_URL and RENDER_API_KEY
npm run dev
```

## Security & Auth (v2.0: Firebase Identity)
AetherOS now uses Firebase Authentication for secure user identities and RBAC (Role-Based Access Control).
- **Frontend**: Integrates Firebase Client SDK for Google Social Login and Email/Password.
- **Backend**: Uses `firebase-admin` middleware to verify Bearer tokens on every request.
- **RBAC**: Users are synced to the Prisma `User` table. Default role is `USER`. `ADMIN` role can view all deployments.
- **Real-Time Logs**: Secured via JWT tokens passed as query parameters for `EventSource`.

### Environment Variables Required:
**Backend (`.env`)**:
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

**Frontend (`.env.local`)**:
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- ... (see `.env.local` for more)

## MCP Foundation
Looking to extend with AI tools? The `/mcp-tools` directory is primed for your custom Model Context Protocol servers.

---
© 2026 AetherOS Technologies. 
Built with Next.js 15, Node.js, Prisma, and ❤️.
