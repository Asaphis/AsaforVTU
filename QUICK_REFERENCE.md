# 🚀 ASAFOR VTU - QUICK START REFERENCE

## URLs - Copy & Paste Ready

**Frontend (Web)**  
`https://asaforvtu.onrender.com`

**Backend API**  
`https://asaforvtubackend.onrender.com`

**Admin Dashboard**  
`https://asaforadmin.onrender.com`

---

## Brand Info

**Name**: Asafor VTU  
**Tagline**: Instant Digital Services  
**Motto**: Buy airtime, data, pay bills and more with ease

## Brand Colors

```
Primary Blue:    #0B4F6C
Gold Accent:     #C58A17
Success Green:   #4CAF50
```

---

## Key Files by Component

### Frontend
- Config: `web/frontend/src/lib/services.ts`
- API: `web/frontend/src/app/api/`
- Layout: `web/frontend/src/app/layout.tsx`

### Backend
- Config: `backend/src/app.js`
- Controllers: `backend/src/controllers/`
- Services: `backend/src/services/`

### Admin
- Config: `web/admin/client/src/lib/backend.ts`
- Pages: `web/admin/client/src/pages/`

### Mobile
- Main: `mobile/webview_app/lib/main.dart`
- API: `mobile/webview_app/lib/services/api_service.dart`
- Config: `mobile/webview_app/pubspec.yaml`

---

## API Base URLs

```javascript
// Frontend
const backendURL = 'https://asaforvtubackend.onrender.com';

// Backend
const clientOrigins = [
  'https://asaforvtu.onrender.com',
  'https://asaforadmin.onrender.com'
];

// Mobile
const apiBase = 'https://asaforvtubackend.onrender.com/api';
```

---

## Environment Setup

```bash
# Install dependencies
cd backend && npm install
cd web/frontend && npm install
cd web/admin && npm install
cd mobile/webview_app && flutter pub get

# Development URLs
BACKEND_URL=https://asaforvtubackend.onrender.com
FRONTEND_URL=https://asaforvtu.onrender.com
ADMIN_URL=https://asaforadmin.onrender.com
```

---

## API Endpoints

```
/api/payments/initiate    - Start payment
/api/payments/verify      - Verify payment
/api/wallet              - Get wallet balance
/api/wallet/transfer     - Transfer funds
/api/transactions        - Get transactions
/api/admin/*            - Admin functions
/api/webhook            - Payment webhooks
```

---

## Deployment

```bash
# Push to GitHub
git add .
git commit -m "Your message"
git push origin main

# Render Auto Deploys:
# - Asafor-frontend  → https://asaforvtu.onrender.com
# - Asafor-admin     → https://asaforadmin.onrender.com
# - Backend          → https://asaforvtubackend.onrender.com
```

---

## Debug Checklist

✅ URLs using render subdomains?  
✅ CORS configured correctly?  
✅ Environment variables set?  
✅ API responding on render URL?  
✅ Mobile WebView loading?  
✅ Payment webhook firing?  

---

## Documentation Links

📄 [RENDER_SUBDOMAIN_CONFIG.md](./RENDER_SUBDOMAIN_CONFIG.md) - Full configuration  
📄 [RENDER_VERIFICATION_REPORT.md](./RENDER_VERIFICATION_REPORT.md) - Verification checklist  
📄 [README.md](./README.md) - Main documentation  

---

## Support

**GitHub**: https://github.com/Asaphis/AsaforVTU  
**Issues**: Create on GitHub  
**Docs**: Check markdown files in root directory  

---

**Status**: ✅ Production Ready  
**Last Updated**: January 21, 2026
