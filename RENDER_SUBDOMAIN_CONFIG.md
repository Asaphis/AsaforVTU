# Render Subdomain Configuration - Asafor VTU

## Overview
This document outlines the complete render subdomain configuration for the Asafor VTU platform. The system exclusively uses Render.com subdomains for maximum reliability and consistency.

## Frontend URLs

### Production Frontend
- **URL**: `https://asaforvtu.onrender.com`
- **Service Name**: Asafor-frontend
- **Environment**: Node.js
- **Root Directory**: web/frontend
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm run start`

### Frontend API Endpoints
All frontend API requests proxy through Next.js route handlers to the backend:
- Backend URL: `https://asaforvtubackend.onrender.com`
- Configured in: `web/frontend/src/lib/services.ts`

#### API Routes (Web Frontend)
- `/api/payments/initiate` → Backend: `/payments/initiate`
- `/api/payments/verify` → Backend: `/payments/verify`
- `/api/wallet` → Backend: `/wallet`
- `/api/wallet/transfer` → Backend: `/wallet/transfer`
- `/api/wallet/history` → Backend: `/wallet/history`
- `/api/transactions/purchase` → Backend: `/transactions/purchase`

---

## Backend API URLs

### Production Backend
- **URL**: `https://asaforvtubackend.onrender.com`
- **API Base**: `/api`
- **Environment**: Node.js
- **Technology**: Express.js with Firebase integration
- **CORS Allowed Origins**: 
  - `https://asaforvtu.onrender.com` (Frontend)
  - `https://asaforadmin.onrender.com` (Admin Panel)
  - Mobile WebView URLs (localhost development)

### Backend Configuration
- Configured in: `backend/src/app.js`
- CORS Origins List: Lines 16-19

### Backend API Endpoints
- **Payments**: `https://asaforvtubackend.onrender.com/api/payments/*`
- **Wallet**: `https://asaforvtubackend.onrender.com/api/wallet/*`
- **Transactions**: `https://asaforvtubackend.onrender.com/api/transactions/*`
- **Admin**: `https://asaforvtubackend.onrender.com/api/admin/*`
- **Webhook**: `https://asaforvtubackend.onrender.com/api/webhook`

---

## Admin Panel URLs

### Production Admin Dashboard
- **URL**: `https://asaforadmin.onrender.com`
- **Service Name**: Asafor-admin
- **Environment**: Node.js
- **Root Directory**: web/admin
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm run start`

### Admin Backend Configuration
- Configured in: `web/admin/client/src/lib/backend.ts`
- Backend URL: `https://asaforvtubackend.onrender.com`

---

## Mobile App (Flutter WebView)

### Frontend URL
- **WebView URL**: `https://asaforvtu.onrender.com/login`
- **Configured in**: `mobile/webview_app/lib/main.dart` (Line 177)
- **Fallback Routes**: Handles deep linking and app launch URLs

### Mobile API Service
- **Backend URL**: `https://asaforvtubackend.onrender.com/api`
- **Configured in**: `mobile/webview_app/lib/services/api_service.dart` (Line 6)

### Mobile App Configuration
**pubspec.yaml**:
```yaml
name: asafor_vtu
description: "Asafor VTU - Instant Digital Services. Buy airtime, data, pay bills and more with ease."
```

**Android (AndroidManifest.xml)**:
```xml
<application android:label="Asafor VTU" ... />
```

**iOS (Info.plist)**:
```xml
<key>CFBundleDisplayName</key>
<string>Asafor VTU</string>
<key>CFBundleName</key>
<string>Asafor VTU</string>
```

**Web Manifest (manifest.json)**:
```json
{
  "name": "Asafor VTU",
  "short_name": "Asafor",
  "start_url": "https://asaforvtu.onrender.com/",
  "background_color": "#0B4F6C",
  "theme_color": "#0B4F6C"
}
```

---

## Webhook Configuration

### Flutterwave Payment Webhook
- **Endpoint**: `https://asaforvtubackend.onrender.com/api/webhook`
- **Purpose**: Handle payment verification callbacks
- **Configured in**:
  - `backend/src/services/flutterwaveService.js`
  - `backend/src/controllers/paymentController.js`

### Redirect URLs
- **Payment Complete**: `https://asaforvtu.onrender.com/payment-complete`
- **Admin Login Redirect**: `https://asaforvtu.onrender.com/login`

---

## Development Environment

### Local Development
- **Frontend Dev**: `http://localhost:3000`
- **Backend Dev**: `http://localhost:5000`
- **Admin Dev**: `http://localhost:5173`
- **Mobile Dev**: WebView loads local/remote URLs based on configuration

### Environment Variables
Backend should configure:
- `FLW_REDIRECT_URL`: Flutterwave redirect URL (defaults to `https://asaforvtu.onrender.com`)
- `BACKEND_URL`: Backend service URL
- `FRONTEND_URL`: Frontend service URL

---

## Brand Colors

The application uses the following brand color palette:

| Element | Color Code | Usage |
|---------|-----------|-------|
| Primary | #0B4F6C | Main brand color (dark blue) |
| Secondary | #C58A17 | Accent color (gold) |
| Success | #4CAF50 | Success/positive actions (green) |

---

## Security Considerations

✅ **Implemented**:
- All traffic uses HTTPS (render subdomains)
- CORS properly configured
- Environment variables for sensitive data
- JWT-based authentication
- Firebase security rules

✅ **No Custom Domain Dependency**:
- Eliminates DNS issues
- No domain registration required
- Render automatic SSL/TLS
- Consistent subdomain naming

---

## File Locations for URL Configuration

### Frontend
- `web/frontend/src/lib/services.ts` - Backend URL for frontend
- `web/frontend/src/app/api/*/route.ts` - API proxy routes

### Backend
- `backend/src/app.js` - CORS configuration
- `backend/src/services/flutterwaveService.js` - Payment redirects

### Admin
- `web/admin/client/src/lib/backend.ts` - Backend URL for admin

### Mobile
- `mobile/webview_app/lib/main.dart` - WebView URL
- `mobile/webview_app/lib/services/api_service.dart` - API service URL
- `mobile/webview_app/pubspec.yaml` - App metadata
- `mobile/webview_app/android/app/src/main/AndroidManifest.xml` - Android config
- `mobile/webview_app/ios/Runner/Info.plist` - iOS config
- `mobile/webview_app/web/manifest.json` - Web manifest

---

## Deployment & Monitoring

### Render Deployment
1. Frontend service automatically deploys from GitHub
2. Backend service automatically deploys from GitHub
3. Admin service automatically deploys from GitHub
4. Services communicate via render subdomains

### Health Checks
- Frontend: `https://asaforvtu.onrender.com/` should return 200
- Backend: `https://asaforvtubackend.onrender.com/` should return API health status
- Admin: `https://asaforadmin.onrender.com/` should return 200

### Status Monitoring
Monitor Render dashboard for:
- Service health and uptime
- Deployment status
- Error logs
- Performance metrics

---

## Summary

✅ **Frontend**: `https://asaforvtu.onrender.com`
✅ **Backend**: `https://asaforvtubackend.onrender.com`
✅ **Admin**: `https://asaforadmin.onrender.com`
✅ **Mobile**: WebView → Frontend URL
✅ **All URLs**: Exclusively use render subdomains
✅ **No custom domains required**
✅ **Full HTTPS/SSL**: Automatic with Render

---

**Last Updated**: January 21, 2026
**Status**: ✅ Production Ready
