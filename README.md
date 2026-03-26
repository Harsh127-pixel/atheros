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

## Security & Auth
This platform uses a shared secret API key for secure communication between the frontend (Server Actions) and the Render API.
- `RENDER_API_KEY` must match on both services.
- `VERCEL_URL` should be added to the backend's CORS configuration.

## MCP Foundation
Looking to extend with AI tools? The `/mcp-tools` directory is primed for your custom Model Context Protocol servers.

---
© 2026 AetherOS Technologies. 
Built with Next.js 15, Node.js, Prisma, and ❤️.
