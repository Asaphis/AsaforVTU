const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
// API clients expect JSON bodies on every successful request; avoid conditional 304 responses for authenticated data.
app.disable('etag');
const pool = require('./config/database');

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
  'https://vtu.ferixas.com',
  'https://vtuportal.ferixas.com',
  'https://vtuapi.ferixas.com',
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
app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'asaforvtu-backend', time: new Date().toISOString() });
});
// Public services endpoint for user frontend
app.get('/api/services', async (_req, res) => {
  try {
    const { getAllServices } = require('./services/serviceService');
    const services = await getAllServices(true);
    res.json(services.map(service => ({
      ...service,
      enabled: Boolean(service.is_active),
      isActive: Boolean(service.is_active)
    })));
  } catch (e) {
    console.error('Error fetching services:', e);
    res.json([]);
  }
});

app.get('/api/services/:slug', async (req, res) => {
  try {
    const { getServiceBySlug } = require('./services/serviceService');
    const service = await getServiceBySlug(req.params.slug);
    if (!service || !service.is_active) return res.status(404).json({ error: 'Service not found' });
    res.json({ ...service, enabled: Boolean(service.is_active), isActive: Boolean(service.is_active) });
  } catch (e) {
    console.error('Error fetching service:', e);
    res.status(500).json({ error: e.message });
  }
});

// Public plans endpoint for user frontend
app.get('/api/plans', async (req, res) => {
  try {
    const { getServicePlans } = require('./services/serviceService');
    const { type, network } = req.query;
    
    const filters = { active_only: true };
    if (type) filters.type = type;
    if (network) filters.network = network;
    
    const plans = await getServicePlans(filters);
    
    // Transform to match expected format
    const transformedPlans = plans.map(plan => ({
      id: plan.id,
      network: plan.network,
      networkKey: plan.network_key,
      name: plan.name,
      type: plan.type,
      subType: plan.sub_type,
      priceUser: Number(plan.price_user),
      priceApi: Number(plan.price_api),
      active: plan.is_active,
      metadata: plan.metadata,
      createdAt: plan.created_at
    }));
    
    res.json(transformedPlans);
  } catch (e) {
    console.error('Error fetching plans:', e);
    res.json([]);
  }
});

// Public settings for user frontend
app.get('/api/settings', async (_req, res) => {
  try {
    // Get settings from database
    const settingsResult = await pool.query(
      "SELECT key, value FROM settings WHERE key IN ('airtime_networks', 'system_status', 'announcements_enabled')"
    );
    
    const settings = {};
    settingsResult.rows.forEach(row => {
      settings[row.key] = row.value;
    });
    
    const airtimeNetworks = settings.airtime_networks || {
      MTN: { enabled: true, discount: 0 },
      Airtel: { enabled: true, discount: 0 },
      Glo: { enabled: true, discount: 0 },
      "9mobile": { enabled: true, discount: 0 }
    };
    
    const systemStatus = settings.system_status?.status || 'online';
    const announcementsEnabled = settings.announcements_enabled !== false;
    
    res.json({
      airtimeNetworks,
      systemStatus,
      announcementsEnabled
    });
  } catch (e) {
    console.error('Error fetching settings:', e);
    // Return defaults on error
    res.json({
      airtimeNetworks: {
        MTN: { enabled: true, discount: 0 },
        Airtel: { enabled: true, discount: 0 },
        Glo: { enabled: true, discount: 0 },
        "9mobile": { enabled: true, discount: 0 }
      },
      systemStatus: 'online',
      announcementsEnabled: true
    });
  }
});

app.get('/api/announcements', async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM announcements 
       WHERE is_active = true 
       AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
       ORDER BY created_at DESC 
       LIMIT 10`
    );
    
    res.json(result.rows);
  } catch (e) {
    console.error('Error fetching public announcements:', e);
    res.json([]);
  }
});

// Import Routes
const authRoutes = require('./routes/authRoutes');
const walletRoutes = require('./routes/walletRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const adminRoutes = require('./routes/adminRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const webhookRoutes = require('./routes/webhookRoutes');
const supportRoutes = require('./routes/supportRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const referralRoutes = require('./routes/referralRoutes');
const vtuRoutes = require('./routes/vtuRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/webhooks', webhookRoutes);
// Backward-compat alias (some dashboards use singular)
app.use('/api/webhook', webhookRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/vtu', vtuRoutes);

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!', details: err.message });
});

module.exports = app;

