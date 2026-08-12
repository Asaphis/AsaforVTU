# Firebase to Neon PostgreSQL Migration Guide

This guide will help you migrate your AsaforVTU system from Firebase to Neon PostgreSQL.

## What Was Changed

### Complete System Refactor
- **Removed**: Firebase Authentication, Firebase Firestore, Firebase Admin SDK
- **Added**: JWT-based authentication, PostgreSQL database (Neon), comprehensive API services

### New Database Schema
- Users table (replaces Firebase Auth)
- Wallets table (replaces Firebase wallets collection)
- Wallet Transactions table (replaces Firebase wallet_transactions collection)
- Services table (replaces Firebase services collection)
- Service Plans table (replaces Firebase service_plans collection)
- Transactions table (replaces Firebase transactions collection)
- Payments table (replaces Firebase payments collection)
- Support Tickets & Messages tables (replaces Firebase support collections)
- Announcements table (replaces Firebase announcements collection)
- Settings table (replaces Firebase settings collection)
- Referrals table (replaces Firebase referrals collection)
- Notifications table (replaces Firebase notifications collection)
- Admin Audit Log table (replaces Firebase admin_audit collection)
- Password Reset Tokens table
- Email Verification Tokens table
- Refresh Tokens table (for JWT authentication)

## Step-by-Step Migration

### 1. Set Up Neon PostgreSQL Database

1. Go to [Neon Console](https://console.neon.tech)
2. Create a new project
3. Copy the connection string (it looks like: `postgresql://username:password@ep-xxxxx.aws.neon.tech/neondb?sslmode=require`)

### 2. Update Backend Environment Variables

Create or update the `.env` file in the `backend` directory:

```bash
# PostgreSQL Database Configuration
DATABASE_URL=your-neon-connection-string

# JWT Authentication Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production-min-32-chars
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_EXPIRES_IN=30d

# Server Configuration
PORT=5000
NODE_ENV=production

# CORS Configuration
CORS_ALLOWED_ORIGINS=https://vtu.ferixas.com,https://vtuportal.ferixas.com,https://vtuapi.ferixas.com

# Admin Emails
ADMIN_EMAILS=admin@example.com,osglimited7@gmail.com

# VTU Provider Configuration
VTU_PROVIDER_URL=https://iacafe.com.ng/devapi/v1
VTU_PROVIDER_API_KEY=your_provider_api_key

# Flutterwave Payment Configuration
FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_TEST-xxxxx
FLUTTERWAVE_SECRET_KEY=FLWSECK_TEST-xxxxx
FLW_SECRET_HASH=whsec_xxxxx
FLW_REDIRECT_URL=https://vtu.ferixas.com/payment-complete
```

### 3. Install New Dependencies

```bash
cd backend
npm install
```

This will install the new dependencies:
- `pg` (PostgreSQL client)
- `bcrypt` (Password hashing)
- `jsonwebtoken` (JWT authentication)

### 4. Run Database Migration

```bash
cd backend
npm run migrate
```

This will create all the database tables and indexes defined in `migrations/001_initial_schema.sql`.

### 5. Create Admin User

```bash
cd backend
node scripts/createAdminUser.js admin@example.com YourSecurePassword123 "Admin User"
```

Replace with your actual admin email and password.

### 6. Update Admin Panel Environment Variables

Create or update the `.env` file in the `web/admin` directory:

```bash
# Backend API URL
VITE_VTU_BACKEND_URL=https://vtuapi.ferixas.com
VITE_VTU_BACKEND_URL_LOCAL=http://localhost:3001

# Admin Emails
VITE_ADMIN_EMAILS=admin@example.com,osglimited7@gmail.com

# CORS Configuration
ADMIN_ORIGIN=https://vtuportal.ferixas.com
VITE_ADMIN_ORIGIN=https://vtuportal.ferixas.com

# Server Configuration
PORT=3002
NODE_ENV=production
```

### 7. Update Customer Frontend Environment Variables

Create or update the `.env.local` file in the `web/frontend` directory:

```bash
NEXT_PUBLIC_API_URL=https://vtuapi.ferixas.com
```

### 8. Build and Deploy

#### Backend:
```bash
cd backend
npm install
npm start
```

#### Admin Panel:
```bash
cd web/admin
npm install
npm run build
npm start
```

#### Customer Frontend:
```bash
cd web/frontend
npm install
npm run build
npm start
```

## Testing the Migration

### 1. Test Admin Login
- Go to https://vtuportal.ferixas.com
- Login with the admin credentials you created
- Verify you can access the dashboard

### 2. Test User Registration
- Go to https://vtu.ferixas.com
- Try to register a new user
- Verify email verification process

### 3. Test User Login
- Login with the registered user
- Verify wallet creation and balance display

### 4. Test Services
- Check if services are loading correctly
- Verify service plans are displayed

## Data Migration (If you have existing Firebase data)

If you have existing data in Firebase that you want to migrate, you'll need to:

1. Export data from Firebase
2. Transform the data to match the new PostgreSQL schema
3. Import the data into Neon PostgreSQL

This is a separate process that would need to be custom-written based on your specific data structure.

## Troubleshooting

### Database Connection Issues
- Verify your `DATABASE_URL` is correct
- Check if your Neon database is active
- Ensure SSL is enabled in the connection string

### Authentication Issues
- Verify `JWT_SECRET` is set and at least 32 characters
- Check that admin user was created successfully
- Verify admin email is in `ADMIN_EMAILS` list

### API Issues
- Check backend logs for errors
- Verify CORS configuration includes your domains
- Ensure backend is running on the correct port

## Rollback Plan

If you need to rollback to Firebase:

1. Revert the git commit: `git revert HEAD`
2. Restore Firebase environment variables
3. Reinstall Firebase dependencies: `npm install firebase-admin`
4. Restart the services

## Support

If you encounter any issues during migration:
1. Check the logs in your backend console
2. Verify all environment variables are set correctly
3. Ensure database migration completed successfully
4. Test database connectivity separately

## Next Steps

After successful migration:
1. Remove any remaining Firebase-related code
2. Update any external integrations that were using Firebase
3. Update monitoring and logging to work with PostgreSQL
4. Set up database backups in Neon
5. Monitor performance and optimize queries if needed
