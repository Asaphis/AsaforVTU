const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  verifyEmail,
  requestPasswordReset,
  resetPassword,
  getUserById,
  updateUserProfile,
  changePassword,
  resendVerificationEmail,
  verifyPin,
  changePin
} = require('../services/authService');
const { authenticate } = require('../middleware/auth');

// Register new user
router.post('/register', async (req, res) => {
  try {
    const result = await registerUser(req.body);
    res.status(201).json(result);
  } catch (error) {
    console.error('[Auth Routes] Register error:', error);
    const status = error.code === 'EMAIL_NOT_VERIFIED' ? 409 : 400;
    res.status(status).json({ error: error.message, code: error.code, email: error.email, username: error.username });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await loginUser(email, password);
    res.json(result);
  } catch (error) {
    console.error('[Auth Routes] Login error:', error);
    res.status(error.code === 'EMAIL_NOT_VERIFIED' ? 403 : 401).json({ error: error.message, code: error.code });
  }
});

// Refresh access token
router.post('/refresh', async (req, res) => {
  try {
    const { refresh_token } = req.body;
    
    if (!refresh_token) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    const result = await refreshAccessToken(refresh_token);
    res.json(result);
  } catch (error) {
    console.error('[Auth Routes] Refresh error:', error);
    res.status(401).json({ error: error.message });
  }
});

// Logout user
router.post('/logout', async (req, res) => {
  try {
    const { refresh_token } = req.body;
    
    if (refresh_token) {
      await logoutUser(refresh_token);
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('[Auth Routes] Logout error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Resend verification email. The response is intentionally generic.
router.post('/resend-verification', async (req, res) => {
  try {
    const result = await resendVerificationEmail(req.body?.email);
    res.json(result);
  } catch (error) {
    console.error('[Auth Routes] Resend verification error:', error);
    res.json({ success: true, message: 'If the account exists, a verification link has been sent' });
  }
});

// Verify email
router.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ error: 'Verification token is required' });
    }

    const result = await verifyEmail(token);
    res.json(result);
  } catch (error) {
    console.error('[Auth Routes] Verify email error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Request password reset
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const result = await requestPasswordReset(email);
    res.json(result);
  } catch (error) {
    console.error('[Auth Routes] Forgot password error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Reset password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, new_password } = req.body;
    
    if (!token || !new_password) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    const result = await resetPassword(token, new_password);
    res.json(result);
  } catch (error) {
    console.error('[Auth Routes] Reset password error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get current user
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await getUserById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('[Auth Routes] Get user error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update user profile
router.put('/profile', authenticate, async (req, res) => {
  try {
    const user = await updateUserProfile(req.user.id, req.body);
    res.json(user);
  } catch (error) {
    console.error('[Auth Routes] Update profile error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Verify transaction PIN without returning the stored hash.
router.post('/verify-pin', authenticate, async (req, res) => {
  try {
    const valid = await verifyPin(req.user.id, req.body?.pin);
    if (!valid) return res.status(401).json({ success: false, error: 'Invalid transaction PIN' });
    res.json({ success: true });
  } catch (error) {
    console.error('[Auth Routes] Verify PIN error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/change-pin', authenticate, async (req, res) => {
  try {
    if (req.body?.pin !== req.body?.confirm_pin) {
      return res.status(400).json({ success: false, error: 'PINs do not match' });
    }
    res.json(await changePin(req.user.id, req.body?.current_pin, req.body?.pin));
  } catch (error) {
    console.error('[Auth Routes] Change PIN error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

// Change password
router.post('/change-password', authenticate, async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    
    if (!current_password || !new_password) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }

    const result = await changePassword(req.user.id, current_password, new_password);
    res.json(result);
  } catch (error) {
    console.error('[Auth Routes] Change password error:', error);
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
