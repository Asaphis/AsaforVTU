# Admin Panel Environment Variables Setup

The admin panel requires the following environment variables to be set on your server. These are NOT committed to the repository for security reasons.

## Firebase Client SDK Configuration (Required for Login)

These variables are needed for the Firebase client-side authentication in the admin panel:

```bash
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

**How to get these values:**
1. Go to Firebase Console > Project Settings > General
2. Scroll to "Your apps" section
3. Select or create a Web app
4. Copy the configuration values

## Backend API Configuration (CRITICAL - MUST BE SET)

```bash
VITE_VTU_BACKEND_URL=https://vtuapi.ferixas.com
VITE_VTU_BACKEND_URL_LOCAL=http://localhost:3001
```

**IMPORTANT**: If `VITE_VTU_BACKEND_URL` is not set, the admin panel will default to `https://asaforvtubackend.onrender.com` which is likely incorrect for your setup. This will cause authentication failures.

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

## Firebase Admin SDK (Server-side)

```bash
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BA...\n-----END PRIVATE KEY-----"
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
```

**Alternative:** You can use a service account JSON instead:
```bash
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"...","private_key_id":"...","private_key":"...","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}
```

## Setting up on your server

Create a `.env` file in the `web/admin` directory with all the above variables set to your actual values.

## Troubleshooting Login Issues

If you're experiencing "Unauthorized" or "Invalid credentials" errors:

1. **Check Firebase Client Config**: Ensure `VITE_FIREBASE_*` variables are set correctly
2. **Check Admin Emails**: Ensure your email is in `VITE_ADMIN_EMAILS`
3. **Check CORS**: Ensure `ADMIN_ORIGIN` matches your admin panel URL
4. **Check Backend URL**: Ensure `VITE_VTU_BACKEND_URL` points to the correct backend API
5. **Firebase Auth User**: Ensure the user exists in Firebase Authentication with the correct email/password

## Current Production URLs

- Customer Frontend: https://vtu.ferixas.com
- Admin Panel: https://vtuportal.ferixas.com  
- Backend API: https://vtuapi.ferixas.com
