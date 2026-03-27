# AetherOS - Premium DevSecOps Dashboard

A high-fidelity command center for secure deployments with glassmorphism aesthetic and AI-powered insights.

## Features

- **Authentication**: Google Sign-in with persistent sessions
- **Deployment Hub**: GitHub URL input and cloud provider selection
- **AI Brain Analysis**: Real-time security scores, performance metrics, and insights
- **Terminal**: Real-time deployment logs with syntax highlighting
- **Admin Dashboard**: System settings, user management, and statistics
- **AI Reasoning**: View deployment decisions and AI agent reasoning
- **Smooth Animations**: Page transitions and interactive effects with Framer Motion

## Quick Start

1. The app redirects unauthenticated users to `/login`
2. Sign in with Google (mock implementation for demo)
3. Navigate to the main dashboard at `/dashboard`
4. Explore Terminal, AI Reasoning, and Admin pages from the sidebar

## Project Structure

```
app/
├── page.tsx                  # Home page (redirects to login/dashboard)
├── login/page.tsx           # Login page
├── dashboard/
│   ├── page.tsx            # Main dashboard
│   ├── terminal/page.tsx    # Terminal logs
│   ├── ai-reasoning/page.tsx # AI decisions
│   └── admin/page.tsx       # Admin panel

components/
├── providers/               # Auth context and providers
├── auth/                   # Login form
├── dashboard/              # Dashboard components
├── terminal/              # Terminal components
├── admin/                 # Admin components
├── ai-reasoning/          # AI reasoning components
└── layout/                # Sidebar, navigation

lib/
├── auth-types.ts          # TypeScript types
└── utils.ts               # Utility functions
```

## Design System

**Color Palette**:
- Primary: Aether Violet (#7c3aed)
- Background: Black (#000000)
- Cards: Dark Gray (#111111)
- Accents: Cyan, Purple, Blue shades

**Effects**:
- Glassmorphism with backdrop blur
- Smooth animations and transitions
- Hover effects on interactive elements
- Gradient borders and glows

## Key Components

### Login Page
Beautiful login interface with animated background grid and glassmorphic card design.

### Dashboard Hub
- Deployment Hub: Input GitHub URL and select cloud provider
- AI Brain Analysis: Tabbed view of insights (All, Security, Performance, General)

### Terminal
Real-time deployment logs with colored output (success, warning, error, log types).

### Admin Dashboard (God Mode)
- Stats Cards: Total users, active deployments, success rate
- System Toggles: Maintenance mode, free tier, subscription settings
- User Management: Ban/unban users, upgrade plans, search functionality

### AI Reasoning
Expandable cards showing deployment decisions with confidence scores and detailed reasoning.

## Environment Variables

None required for the demo (uses mock authentication and data).

## Technologies Used

- **Framework**: Next.js 16 with App Router
- **Styling**: Tailwind CSS with custom theme
- **Animations**: Framer Motion
- **UI Components**: shadcn/ui
- **Icons**: Lucide React
- **Forms**: React Hook Form + Zod
- **Notifications**: Sonner

## Future Enhancements

- Real Firebase authentication
- Backend API integration
- Real-time WebSocket updates
- Database persistence
- Advanced user roles and permissions
- Email notifications
- Deployment history tracking
