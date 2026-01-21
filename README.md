# 🚀 Asafor VTU

> **A Modern Digital Services Platform for Instant VTU Transactions**

[![Repository](https://img.shields.io/badge/GitHub-Asaphis%2FAsaforVTU-blue?style=flat-square&logo=github)](https://github.com/Asaphis/AsaforVTU)
[![Status](https://img.shields.io/badge/Status-Active%20Development-green?style=flat-square)]()
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)]()

---

## 📋 Overview

Asafor VTU is a comprehensive digital services platform that enables users to:
- 💳 **Buy Airtime** - Instant airtime delivery across all networks
- 📡 **Purchase Data** - Various data bundle options
- 💡 **Pay Utility Bills** - Electricity, water, and more
- 📺 **Cable TV Subscriptions** - Multiple providers
- 🎓 **Exam Pins** - Educational exam registration
- 💰 **Wallet Services** - Secure fund management
- 🔄 **Money Transfer** - Quick fund transfers

**Built with**:
- Frontend: Next.js, React, TypeScript, Tailwind CSS
- Backend: Node.js, Express, Firebase
- Mobile: Flutter WebView
- Admin: React + Vite

---

## 🌐 Live Services

| Service | URL | Status |
|---------|-----|--------|
| **Frontend** | https://asaforvtu.onrender.com | ✅ Active |
| **Backend API** | https://asaforvtubackend.onrender.com | ✅ Active |
| **Admin Panel** | https://asaforadmin.onrender.com | ✅ Active |
| **Mobile App** | Flutter WebView | 📱 Ready |

---

## 📁 Project Structure

```
AsaforVTU/
├── backend/                  # Node.js Express API
│   ├── src/
│   │   ├── controllers/     # Business logic
│   │   ├── services/        # External service integrations
│   │   ├── routes/          # API endpoints
│   │   └── middleware/      # Auth, CORS, etc.
│   └── package.json
│
├── web/
│   ├── frontend/            # Next.js customer portal
│   │   ├── src/
│   │   │   ├── app/        # Pages and routes
│   │   │   ├── components/ # React components
│   │   │   └── lib/        # Utilities and services
│   │   └── package.json
│   │
│   └── admin/              # Admin dashboard (Vite + React)
│       ├── client/         # Frontend code
│       └── server/         # Backend server
│
├── mobile/
│   └── webview_app/        # Flutter WebView app
│       ├── lib/            # Dart code
│       ├── android/        # Android build
│       ├── ios/            # iOS build
│       └── pubspec.yaml
│
├── scripts/                 # Utility scripts
└── render.yaml             # Render deployment config
```

---

## 🎨 Brand Identity

### Brand Name
**Asafor VTU** - Modern digital services for everyone

### Brand Colors
```
🔵 Primary Blue:   #0B4F6C
🟡 Gold Accent:    #C58A17
🟢 Green Accent:   #4CAF50
```

### Design Philosophy
Modern, minimal, professional - suitable for a global technology organization with African roots

---

## 🚀 Getting Started

### Prerequisites
- Node.js >= 18.18.0
- Flutter SDK (for mobile)
- npm or yarn
- Firebase account

### Installation

#### Backend
```bash
cd backend
npm install
npm run dev
```

#### Frontend
```bash
cd web/frontend
npm install
npm run dev
```

#### Admin Panel
```bash
cd web/admin
npm install
npm run dev
```

#### Mobile App
```bash
cd mobile/webview_app
flutter pub get
flutter run
```

---

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```
PORT=5000
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY=your_private_key
CORS_ALLOWED_ORIGINS=https://asaforvtu.onrender.com,https://asaforadmin.onrender.com
```

#### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=https://asaforvtubackend.onrender.com
NEXT_PUBLIC_APP_URL=https://asaforvtu.onrender.com
```

#### Admin (.env.local)
```
VITE_API_URL=https://asaforvtubackend.onrender.com
VITE_ADMIN_URL=https://asaforadmin.onrender.com
```

---

## 📚 Documentation

Comprehensive documentation available:

| Document | Purpose |
|----------|---------|
| [REBRANDING_COMPLETED.md](./REBRANDING_COMPLETED.md) | Complete rebranding from OSGHub to Asafor VTU |
| [BRANDING_QUICK_REFERENCE.md](./BRANDING_QUICK_REFERENCE.md) | Quick reference for brand guidelines |
| [ASSET_MANAGEMENT_GUIDE.md](./ASSET_MANAGEMENT_GUIDE.md) | Asset locations and replacement guide |

---

## 🔄 Recent Rebranding (Jan 2026)

### Major Changes ✅
- ✅ **Branding**: OSGHub → Asafor VTU (500+ text replacements)
- ✅ **URLs**: All services now use Render subdomains exclusively
- ✅ **Configuration**: Updated all config files and environment references
- ✅ **API Endpoints**: All pointing to new render subdomains
- ✅ **Email**: support@osghub.com → support@asaforvtu.com

### Why Render Subdomains?
- **Reliability**: Render subdomains have excellent uptime
- **Simplicity**: No domain registration complexities
- **Production-ready**: Automatic SSL and CDN
- **No dependency**: Domain issues won't affect service

---

## 🛠️ API Endpoints

### Authentication
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/verify-email
GET    /api/auth/me
```

### Wallet
```
GET    /api/wallet
POST   /api/wallet/fund
POST   /api/wallet/transfer
GET    /api/wallet/history
```

### Transactions
```
POST   /api/transactions/purchase
GET    /api/transactions/{id}
GET    /api/transactions
```

### Services
```
GET    /api/services
POST   /api/services/verify
```

See [API Documentation](./backend/README.md) for detailed endpoints.

---

## 👥 User Roles

### 1. **Regular Users**
- Access: Frontend portal
- Features: Buy services, manage wallet, view history

### 2. **Admins**
- Access: Admin dashboard
- Features: Manage users, monitor transactions, configure services

### 3. **Service Providers**
- Access: API integration
- Features: Integrate and manage service offerings

---

## 🔐 Security

### Implemented
- ✅ JWT Authentication
- ✅ CORS protection
- ✅ Helmet.js security headers
- ✅ Firebase authentication
- ✅ Rate limiting (recommended)
- ✅ HTTPS/SSL (Render managed)

### Best Practices
- Never commit `.env` files
- Use environment variables for secrets
- Regular security audits
- Keep dependencies updated

---

## 📊 Tech Stack

### Frontend
- **Framework**: Next.js 14
- **UI Library**: React 18
- **Styling**: Tailwind CSS
- **State**: Context API
- **Build**: Webpack (Next.js)

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: Firebase Realtime DB
- **Auth**: Firebase Auth & JWT
- **API**: RESTful

### Mobile
- **Framework**: Flutter 3.10+
- **Rendering**: WebView
- **Language**: Dart
- **Platforms**: Android, iOS, Web

### Admin
- **Framework**: React + Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **Build**: Vite

---

## 📱 Mobile App Features

- ✅ WebView-based Flutter app
- ✅ Deep linking support
- ✅ Offline capability
- ✅ Native feel
- ✅ Fast loading
- ✅ Secure authentication

---

## 🚀 Deployment

### Frontend (Render)
```bash
Service: Asafor-frontend
Build: npm install && npm run build
Start: npm run start
```

### Backend (Render)
```bash
Service: Deploy separately
Build: npm install
Start: node src/server.js
```

### Admin (Render)
```bash
Service: Asafor-admin
Build: npm install && npm run build
Start: npm run start
```

### Mobile
- Build APK: `flutter build apk --release`
- Build IPA: `flutter build ios --release`
- Deploy to stores following platform guidelines

---

## 🤝 Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

See [CONTRIBUTING.md](./CONTRIBUTING.md) for details.

---

## 📞 Support

**Email**: support@asaforvtu.com

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Built with**: Next.js, React, Express, Flutter
- **Hosted on**: Render
- **Database**: Firebase
- **Team**: Asaphis Development

---

## 📈 Roadmap

- [ ] Enhanced analytics dashboard
- [ ] Multi-currency support
- [ ] Advanced user verification
- [ ] API v2 with GraphQL
- [ ] Mobile app store releases
- [ ] SMS notifications
- [ ] WhatsApp integration
- [ ] Referral program enhancements

---

## 🔗 Quick Links

- **GitHub**: https://github.com/Asaphis/AsaforVTU
- **Frontend**: https://asaforvtu.onrender.com
- **Admin**: https://asaforadmin.onrender.com
- **API**: https://asaforvtubackend.onrender.com

---

**Last Updated**: January 21, 2026
**Status**: ✅ Active & Maintained
**Rebranding Status**: ✅ Complete

---

*For detailed information on the recent rebranding effort, see [REBRANDING_COMPLETED.md](./REBRANDING_COMPLETED.md)*
