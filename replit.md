# Asafor VTU Platform

## Overview
Asafor is a VTU (Virtual Top-Up) platform with a Next.js frontend, Express.js backend, and admin dashboard.

## Project Structure
- `web/frontend/` - Next.js customer-facing frontend (port 5000)
- `web/admin/` - Vite + Express admin dashboard
- `backend/` - Express.js API server
- `mobile/` - Flutter mobile app

## Current State
- Frontend is configured and running on port 5000
- Uses Firebase for authentication and storage
- Next.js 16 with Turbopack

## Development
The frontend workflow runs:
```bash
cd web/frontend && npm run dev
```

## Environment Variables
The project expects Firebase configuration environment variables (see render.yaml for reference).

## Architecture
- Frontend: Next.js with TypeScript, TailwindCSS, Radix UI components
- Backend: Express.js with Firebase Admin SDK
- Authentication: Firebase Auth
- Storage: Firebase Storage
