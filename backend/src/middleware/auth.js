const { auth, db, firebaseInitialized } = require('../config/firebase');

const verifyToken = async (req, res, next) => {
  try {
    // Check if Firebase auth is available
    if (!auth) {
      console.error('[Auth Middleware] Firebase Auth not available');
      return res.status(503).json({ 
        error: 'Authentication service unavailable',
        details: 'Firebase Auth is not initialized. Please ensure FIREBASE_* environment variables are correctly set in the environment.',
        code: 'FIREBASE_NOT_INITIALIZED'
      });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split('Bearer ')[1];

    // TEMPORARY: Test Token for E2E Testing
    if (token === 'TEST_TOKEN_B1Xb1wb13tNNUpG7nbai7GeSwyR2') {
      req.user = { 
        uid: 'B1Xb1wb13tNNUpG7nbai7GeSwyR2', 
        email: 'test_user@Asafor.com',
        email_verified: true
      };
      return next();
    }

    try {
      const decodedToken = await auth.verifyIdToken(token);
      req.user = decodedToken;
      next();
    } catch (verifyError) {
      console.error('[Auth Middleware] Token verification failed:', {
        code: verifyError.code,
        message: verifyError.message,
      });
      
      if (verifyError.code === 'auth/id-token-expired') {
        return res.status(401).json({ error: 'Unauthorized: Token expired' });
      }
      
      // Check if it's an invalid API key error from Firebase
      if (verifyError.code === 'auth/invalid-api-key' || verifyError.message?.includes('invalid-api-key')) {
        return res.status(503).json({ 
          error: 'Authentication service error',
          details: 'Invalid Firebase API key. Server configuration issue.',
          code: 'FIREBASE_INVALID_API_KEY'
        });
      }
      
      return res.status(403).json({ error: 'Unauthorized: Invalid token' });
    }
  } catch (error) {
    console.error('[Auth Middleware] Unexpected error:', error);
    return res.status(500).json({ 
      error: 'Authentication error',
      details: error.message 
    });
  }
};

const isAdmin = async (req, res, next) => {
  try {
    if (!db) {
      console.error('[Admin Check] Firebase Firestore not available');
      return res.status(503).json({ 
        error: 'Authorization service unavailable',
        code: 'FIREBASE_NOT_INITIALIZED'
      });
    }

    const allowed = (process.env.ADMIN_EMAILS || 'osglimited7@gmail.com')
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    const email = (req.user && req.user.email || '').toLowerCase();
    if (
      req.user &&
      (
        req.user.admin === true ||
        (req.user.customClaims && req.user.customClaims.admin === true) ||
        (email && allowed.includes(email))
      )
    ) {
      return next();
    }
    const uid = req.user && req.user.uid;
    if (!uid) return res.status(403).json({ error: 'Forbidden: Admins only' });
    
    try {
      const userDoc = await db.collection('users').doc(uid).get();
      const role = userDoc.exists ? (userDoc.data().role || userDoc.data().roles) : null;
      const isRoleAdmin = role === 'admin' || (Array.isArray(role) && role.includes('admin'));
      if (isRoleAdmin) {
        return next();
      }
    } catch (dbError) {
      console.error('[Admin Check] Database error:', dbError);
      return res.status(500).json({ error: 'Admin check failed', details: dbError.message });
    }
    
    return res.status(403).json({ error: 'Forbidden: Admins only' });
  } catch (e) {
    console.error('[Admin Check] Unexpected error:', e);
    return res.status(500).json({ error: 'Admin check failed', details: e.message });
  }
};

module.exports = { verifyToken, isAdmin };

