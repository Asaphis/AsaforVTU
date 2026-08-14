const jwt = require('jsonwebtoken');
const pool = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '30d';

const generateToken = (userId, email, role = 'user') => jwt.sign(
  { userId, email, role },
  JWT_SECRET,
  { expiresIn: JWT_EXPIRES_IN }
);

const generateRefreshToken = async (userId) => {
  const token = jwt.sign({ userId, type: 'refresh' }, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await pool.query(
    'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
    [userId, token, expiresAt]
  );
  return token;
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (_) {
    return null;
  }
};

const getAuthenticatedUser = async (userId) => {
  const result = await pool.query(
    `SELECT id, email, role, is_admin, is_active, email_verified
     FROM users WHERE id = $1`,
    [userId]
  );
  if (result.rows.length === 0) return null;
  const user = result.rows[0];
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    is_admin: Boolean(user.is_admin),
    is_active: Boolean(user.is_active),
    email_verified: Boolean(user.email_verified)
  };
};

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized', message: 'No token provided' });
    }

    const decoded = verifyToken(authHeader.slice(7));
    if (!decoded || !decoded.userId || decoded.type === 'refresh') {
      return res.status(401).json({ error: 'Unauthorized', message: 'Invalid or expired token' });
    }

    const user = await getAuthenticatedUser(decoded.userId);
    if (!user) return res.status(401).json({ error: 'Unauthorized', message: 'User not found' });
    if (!user.is_active) return res.status(403).json({ error: 'Forbidden', message: 'User account is deactivated' });

    req.user = user;
    return next();
  } catch (error) {
    console.error('[Auth Middleware] Error:', error);
    return res.status(500).json({ error: 'Authentication error', message: error.message });
  }
};

const authenticateAdmin = async (req, res, next) => {
  return authenticate(req, res, () => {
    const allowedAdminEmails = (process.env.ADMIN_EMAILS || 'asaphis.org@gmail.com')
      .split(',').map(email => email.trim().toLowerCase()).filter(Boolean);
    const isAdmin = req.user.is_admin || req.user.role === 'admin' || allowedAdminEmails.includes(req.user.email.toLowerCase());
    if (!isAdmin) return res.status(403).json({ error: 'Forbidden', message: 'Admin access required' });
    return next();
  });
};

const optionalAuth = async (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }
    const decoded = verifyToken(authHeader.slice(7));
    const user = decoded && decoded.type !== 'refresh' ? await getAuthenticatedUser(decoded.userId) : null;
    req.user = user && user.is_active ? user : null;
    return next();
  } catch (_) {
    req.user = null;
    return next();
  }
};

module.exports = {
  generateToken,
  generateRefreshToken,
  verifyToken,
  authenticate,
  authenticateAdmin,
  requireAdmin: authenticateAdmin,
  optionalAuth,
  getAuthenticatedUser
};
