const jwt = require('jsonwebtoken');
const pool = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '30d';

// Generate JWT token
const generateToken = (userId, email, role = 'user') => {
  return jwt.sign(
    { userId, email, role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

// Generate refresh token
const generateRefreshToken = async (userId) => {
  const token = jwt.sign(
    { userId, type: 'refresh' },
    JWT_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
  );
  
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  
  await pool.query(
    'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
    [userId, token, expiresAt]
  );
  
  return token;
};

// Verify JWT token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

// Authentication middleware
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'No token provided' 
      });
    }

    const token = authHeader.split('Bearer ')[1];
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Invalid or expired token' 
      });
    }

    // Check if user exists and is active
    const userResult = await pool.query(
      'SELECT id, email, role, is_active FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'User not found' 
      });
    }

    const user = userResult.rows[0];

    if (!user.is_active) {
      return res.status(403).json({ 
        error: 'Forbidden',
        message: 'User account is deactivated' 
      });
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role
    };

    next();
  } catch (error) {
    console.error('[Auth Middleware] Error:', error);
    return res.status(500).json({ 
      error: 'Authentication error',
      message: error.message 
    });
  }
};

// Admin authentication middleware
const authenticateAdmin = async (req, res, next) => {
  try {
    await authenticate(req, res, () => {});

    const allowedAdminEmails = (process.env.ADMIN_EMAILS || 'asaphis.org@gmail.com')
      .split(',')
      .map(email => email.trim().toLowerCase())
      .filter(Boolean);

    const isAdmin = req.user.role === 'admin' || 
                   req.user.is_admin || 
                   allowedAdminEmails.includes(req.user.email.toLowerCase());

    if (!isAdmin) {
      return res.status(403).json({ 
        error: 'Forbidden',
        message: 'Admin access required' 
      });
    }

    next();
  } catch (error) {
    console.error('[Admin Auth Middleware] Error:', error);
    return res.status(500).json({ 
      error: 'Admin authentication error',
      message: error.message 
    });
  }
};

// Optional authentication (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    const token = authHeader.split('Bearer ')[1];
    const decoded = verifyToken(token);

    if (decoded) {
      const userResult = await pool.query(
        'SELECT id, email, role, is_active FROM users WHERE id = $1',
        [decoded.userId]
      );

      if (userResult.rows.length > 0 && userResult.rows[0].is_active) {
        req.user = {
          id: userResult.rows[0].id,
          email: userResult.rows[0].email,
          role: userResult.rows[0].role
        };
      }
    }

    req.user = req.user || null;
    next();
  } catch (error) {
    req.user = null;
    next();
  }
};

module.exports = {
  generateToken,
  generateToken,
  generateRefreshToken,
  verifyToken,
  authenticate,
  authenticateAdmin,
  requireAdmin: authenticateAdmin,
  optionalAuth
};
