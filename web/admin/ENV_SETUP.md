# Admin Panel Environment Variables Setup

The admin panel requires the following environment variables to be set on your server. These are NOT committed to the repository for security reasons.

## Backend API Configuration (CRITICAL - MUST BE SET)

```bash
VITE_VTU_BACKEND_URL=https://vtuapi.ferixas.com
VITE_VTU_BACKEND_URL_LOCAL=http://localhost:3001
```

**IMPORTANT**: If `VITE_VTU_BACKEND_URL` is not set, the admin panel will default to `https://vtuapi.ferixas.com` which is correct for your setup.

## Admin Authorization

```bash
VITE_ADMIN_EMAILS=admin@example.com,osglimited7@gmail.com
```

## CORS Configuration

```bash
ADMIN_ORIGIN=https://vtuportal.ferixas.com
VITE_ADMIN_ORIGIN=https://vtuportal.ferixas.com
```

## Server Configuration

```bash
PORT=3002
NODE_ENV=production
```

## Setting up on your server

Create a `.env` file in the `web/admin` directory with all the above variables set to your actual values.

## Troubleshooting Login Issues

If you're experiencing "Unauthorized" or "Invalid credentials" errors:

1. **Check Backend URL**: Ensure `VITE_VTU_BACKEND_URL` points to the correct backend API
2. **Check Admin Emails**: Ensure your email is in `VITE_ADMIN_EMAILS`
3. **Check CORS**: Ensure `ADMIN_ORIGIN` matches your admin panel URL
4. **Database Connection**: Ensure the backend can connect to your Neon PostgreSQL database
5. **User Creation**: Ensure admin users exist in the database with correct credentials

## Current Production URLs

- Customer Frontend: https://vtu.ferixas.com
- Admin Panel: https://vtuportal.ferixas.com  
- Backend API: https://vtuapi.ferixas.com

## Migration from Firebase

This system has been completely migrated from Firebase to Neon PostgreSQL. No Firebase configuration is needed anymore. The authentication now uses JWT tokens instead of Firebase Auth.

## Database Setup

The backend requires a PostgreSQL database (Neon recommended). You need to:

1. Create a Neon PostgreSQL project
2. Get the connection string
3. Set `DATABASE_URL` in the backend `.env` file
4. Run the database migration: `npm run migrate`

## Backend Environment Variables

The backend also requires these environment variables:

```bash
DATABASE_URL=postgresql://username:password@ep-cool-region-123456.aws.neon.tech/neondb?sslmode=require
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_EXPIRES_IN=30d
ADMIN_EMAILS=admin@example.com,osglimited7@gmail.com
```
