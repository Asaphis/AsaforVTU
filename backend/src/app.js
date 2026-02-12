const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const { db } = require('./config/firebase');

// Middleware
app.use(helmet());
const originsEnv = process.env.CORS_ALLOWED_ORIGINS;
const defaultOrigins = [
  'https://asaforvtu.onrender.com',
  'https://www.Asafor.com',
  'https://asaforvtu.onrender.com',
  'https://asaforadmin.onrender.com',
  'https://asaforvtuadminpanel.onrender.com',
  'https://asaforvtubackend.onrender.com',
  'http://localhost:3000',
  'http://localhost:5000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://localhost:5001'
];

// Add current replit host dynamically if available
if (process.env.REPLIT_DEV_DOMAIN) {
  const devHost = process.env.REPLIT_DEV_DOMAIN;
  defaultOrigins.push(`https://${devHost}`);
  defaultOrigins.push(`https://${devHost.replace('-5000.', '-3001.')}`);
  defaultOrigins.push(`https://${devHost.replace('-5000.', '-3002.')}`);
}
const envOrigins = originsEnv ? originsEnv.split(',').map(s => s.trim()).filter(Boolean) : [];
const origins = Array.from(new Set([...defaultOrigins, ...envOrigins]));
const corsOptions = {
  origin: (origin, callback) => {
    // In development/replit, allow all origins
    if (!origin || origin.includes('.replit.app') || origin.includes('.replit.dev') || origin.includes('localhost')) {
      return callback(null, true);
    }
    
    let isAllowed = origins.includes(origin);
    if (!isAllowed && origin) {
      try {
        const host = new URL(origin).hostname.toLowerCase();
        if (host === 'asafor.com' || host.endsWith('.asafor.com')) {
          isAllowed = true;
        }
      } catch {}
    }
    return isAllowed ? callback(null, true) : callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  exposedHeaders: ['Content-Length', 'Content-Type'],
  maxAge: 86400,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
// Ensure preflight requests are handled early with the same options
app.options('*', cors(corsOptions));
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.get('/', (req, res) => {
  res.status(200).json({ message: 'Asafor VTU Backend is running' });
});
// Public Plans endpoint for user frontend
app.get('/api/plans', async (_req, res) => {
  try {
    if (!db) return res.json([]);
    const snap = await db.collection('service_plans').get();
    const rows = snap.docs.map(d => {
      const x = d.data() || {};
      return {
        id: d.id,
        network: x.network || '',
        name: x.name || '',
        priceUser: Number(x.priceUser || x.price_user || 0),
        priceApi: Number(x.priceApi || x.price_api || 0),
        active: x.active !== false,
        metadata: x.metadata || null,
        createdAt: x.createdAt || new Date(),
      };
    }).filter(r => r.active);
    res.json(rows);
  } catch (e) {
    res.json([]);
  }
});

// Public settings for user frontend
app.get('/api/settings', async (_req, res) => {
  try {
    if (!db) return res.json({});
    const doc = await db.collection('settings').doc('global').get();
    if (!doc.exists) return res.json({});
    const data = doc.data();
    // Only expose non-sensitive fields
    res.json({
      airtimeNetworks: data.airtimeNetworks || {},
      systemStatus: data.systemStatus || 'online',
      announcementsEnabled: data.announcementsEnabled !== false
    });
  } catch (e) {
    res.json({});
  }
});

app.get('/api/announcements', async (_req, res) => {
  try {
    if (!db) return res.json([]);
    
    // Fetch active announcements. 
    // We avoid complex orderBy in Firestore to prevent index requirements.
    const snap = await db.collection('announcements')
      .where('active', '==', true)
      .limit(50)
      .get();
      
    let rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    
    // Sort in memory by createdAt descending
    rows.sort((a, b) => {
      const getTime = (val) => {
        if (!val) return 0;
        if (typeof val === 'number') return val;
        if (val.toDate) return val.toDate().getTime();
        if (val.seconds) return val.seconds * 1000;
        return new Date(val).getTime() || 0;
      };
      return getTime(b.createdAt) - getTime(a.createdAt);
    });
    
    res.json(rows.slice(0, 10));
  } catch (e) {
    console.error('Error fetching public announcements:', e);
    res.json([]);
  }
});

// Import Routes
const walletRoutes = require('./routes/walletRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const adminRoutes = require('./routes/adminRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const webhookRoutes = require('./routes/webhookRoutes');
const supportRoutes = require('./routes/supportRoutes');

app.use('/api/wallet', walletRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/support', supportRoutes);

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!', details: err.message });
});

module.exports = app;

