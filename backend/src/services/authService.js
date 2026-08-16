const bcrypt = require('bcrypt');
const crypto = require('crypto');
const pool = require('../config/database');
const { generateToken, generateRefreshToken } = require('../middleware/auth');
const { sendVerificationEmail, sendPasswordResetEmail, sendReferralSignupEmail, sendAccountSecurityEmail } = require('./emailService');

const SALT_ROUNDS = 10;

// Hash password
const hashPassword = async (password) => {
  return await bcrypt.hash(password, SALT_ROUNDS);
};

// Compare password
const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

// Generate referral code
const generateReferralCode = () => {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
};

// Register new user
const registerUser = async (userData) => {
  const input = userData || {};
  const email = String(input.email || '').trim().toLowerCase();
  const password = String(input.password || '');
  const full_name = String(input.full_name ?? input.fullName ?? '').trim();
  const username = String(input.username || '').trim().toLowerCase();
  const phone = String(input.phone || '').trim() || null;
  const pin = String(input.pin ?? input.transactionPin ?? '').trim();
  const referral_code = input.referral_code ?? input.referralUsername;

  if (!email || !password || !full_name || !username) {
    const error = new Error('Email, password, full name, and username are required');
    error.code = 'INVALID_REGISTRATION';
    throw error;
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error('Enter a valid email address');
  if (password.length < 8) throw new Error('Password must be at least 8 characters');
  if (!/^\d{4,6}$/.test(pin)) throw new Error('Transaction PIN must contain 4 to 6 digits');

  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Check if email already exists
    const emailCheck = await client.query(
      'SELECT id, email_verified FROM users WHERE lower(trim(email)) = $1 LIMIT 1',
      [email]
    );

    if (emailCheck.rows.length > 0) {
      const error = emailCheck.rows[0].email_verified
        ? new Error('Email already registered')
        : new Error('This email is already registered but not verified. Please request a new verification email.');
      error.code = emailCheck.rows[0].email_verified ? 'EMAIL_EXISTS' : 'EMAIL_NOT_VERIFIED';
      error.email = email;
      throw error;
    }

    // Check if username already exists
    if (username) {
      const usernameCheck = await client.query(
        'SELECT id FROM users WHERE lower(trim(username)) = $1 LIMIT 1',
        [username]
      );

      if (usernameCheck.rows.length > 0) {
        const error = new Error('Username already taken');
        error.code = 'USERNAME_EXISTS';
        error.username = username;
        throw error;
      }
    }

    // Handle referral; the stable referral code is canonical, while username remains a supported legacy alias.
    let referredBy = null;
    let referralReferrer = null;
    if (referral_code) {
      const referralCheck = await client.query(
        'SELECT id, email, full_name, referral_code FROM users WHERE upper(referral_code) = upper($1) OR lower(username) = lower($1) LIMIT 1',
        [String(referral_code).trim()]
      );

      if (referralCheck.rows.length > 0) {
        referredBy = referralCheck.rows[0].referral_code;
        referralReferrer = referralCheck.rows[0];
      }
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Hash PIN if provided
    let pinHash = null;
    if (pin) {
      pinHash = await hashPassword(pin);
    }

    // Generate referral code for new user
    const userReferralCode = generateReferralCode();

    // Insert user
    const userResult = await client.query(
      `INSERT INTO users (email, password_hash, full_name, username, phone, pin_hash, referral_code, referred_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, email, full_name, username, phone, referral_code, created_at`,
      [email, passwordHash, full_name, username || null, phone, pinHash, userReferralCode, referredBy]
    );

    const user = userResult.rows[0];

    if (referralReferrer) {
      await client.query(
        `INSERT INTO referrals (referrer_id, referred_id, referral_code, reward_amount, is_paid)
         VALUES ($1, $2, $3, 0, false)
         ON CONFLICT (referrer_id, referred_id) DO NOTHING`,
        [referralReferrer.id, user.id, referredBy]
      );
    }

    // Create wallet for user
    await client.query(
      'INSERT INTO wallets (user_id) VALUES ($1)',
      [user.id]
    );

    // Handle referral reward
    if (referredBy) {
      const referrerResult = await client.query(
        'SELECT id FROM users WHERE referral_code = $1',
        [referredBy]
      );

      if (referrerResult.rows.length > 0) {
        const referrerId = referrerResult.rows[0].id;

        // Record referral
        await client.query(
          `INSERT INTO referrals (referrer_id, referred_id, referral_code)
           VALUES ($1, $2, $3)`,
          [referrerId, user.id, referredBy]
        );
      }
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await client.query(
      `INSERT INTO email_verification_tokens (user_id, token, expires_at)
       VALUES ($1, $2, $3)`,
      [user.id, verificationToken, verificationExpiresAt]
    );

    await client.query('COMMIT');

    let verificationSent = false;
    try {
      await sendVerificationEmail({ email: user.email, token: verificationToken });
      verificationSent = true;
    } catch (emailError) {
      console.error('[Auth] Verification email delivery failed:', emailError.message);
    }

    if (referralReferrer) {
      try {
        await sendReferralSignupEmail({ email: referralReferrer.email, name: referralReferrer.full_name, referredName: user.full_name });
      } catch (emailError) {
        console.error('[Auth] Referral signup email failed:', emailError.message);
      }
      try {
        await require('./notificationService').sendNotification(
          referralReferrer.id,
          'Referral joined',
          `${user.full_name} registered using your referral. Any reward remains subject to the active campaign rules.`,
          'referral',
          { referredUserId: user.id, referralCode: referredBy }
        );
      } catch (notificationError) {
        console.error('[Auth] Referral signup notification failed:', notificationError.message);
      }
    }

    const accessToken = generateToken(user.id, user.email, 'user');
    const refreshToken = await generateRefreshToken(user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        username: user.username,
        phone: user.phone,
        referral_code: user.referral_code,
        email_verified: false,
        created_at: user.created_at
      },
      verification_sent: verificationSent,
      tokens: {
        access_token: accessToken,
        refresh_token: refreshToken
      }
    };
  } catch (error) {
    await client.query('ROLLBACK');
    if (error?.code === '23505') {
      const duplicate = new Error(String(error.constraint || '').toLowerCase().includes('username') ? 'Username already taken' : 'Email already registered');
      duplicate.code = String(error.constraint || '').toLowerCase().includes('username') ? 'USERNAME_EXISTS' : 'EMAIL_EXISTS';
      throw duplicate;
    }
    throw error;
  } finally {
    client.release();
  }
};

// Login user
const loginUser = async (email, password) => {
  console.log('[loginUser] Login attempt for email:', email);
  
  const client = await pool.connect();
  
  try {
    // Find user by email
    const userResult = await client.query(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    console.log('[loginUser] User found:', userResult.rows.length > 0);

    if (userResult.rows.length === 0) {
      console.log('[loginUser] User not found');
      throw new Error('Invalid credentials');
    }

    const user = userResult.rows[0];
    console.log('[loginUser] User ID:', user.id, 'is_active:', user.is_active, 'is_admin:', user.is_admin);
    
    // Check if user is active
    if (!user.is_active) {
      console.log('[loginUser] User account deactivated');
      throw new Error('Account is deactivated');
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.password_hash);
    console.log('[loginUser] Password valid:', isValidPassword);

    if (!isValidPassword) {
      console.log('[loginUser] Invalid password');
      throw new Error('Invalid credentials');
    }

    if (!user.email_verified) {
      const verificationError = new Error('Please verify your email before signing in');
      verificationError.code = 'EMAIL_NOT_VERIFIED';
      throw verificationError;
    }

    // Update last login
    await client.query(
      'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    console.log('[loginUser] Last login updated');

    try {
      const notificationService = require('./notificationService');
      await notificationService.sendNotification(
        user.id,
        'Welcome back',
        'You signed in successfully. Review your wallet, activity, and support updates.',
        'account',
        { event: 'login', login_at: new Date().toISOString() }
      );
    } catch (notificationError) {
      console.error('[Auth] Login notification failed:', notificationError.message);
    }

    // Generate tokens
    const accessToken = generateToken(user.id, user.email, user.role);
    const refreshToken = await generateRefreshToken(user.id);
    
    console.log('[loginUser] Tokens generated');

    // Get user wallet
    const walletResult = await client.query(
      'SELECT * FROM wallets WHERE user_id = $1',
      [user.id]
    );

    const wallet = walletResult.rows[0] || null;

    const result = {
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        username: user.username,
        phone: user.phone,
        role: user.role,
        is_admin: user.is_admin,
        email_verified: user.email_verified,
        referral_code: user.referral_code,
        avatar_url: user.avatar_url,
        pin_set: Boolean(user.pin_hash),
        created_at: user.created_at,
        wallet: wallet ? {
          main_balance: wallet.main_balance,
          cashback_balance: wallet.cashback_balance,
          referral_balance: wallet.referral_balance
        } : null
      },
      tokens: {
        access_token: accessToken,
        refresh_token: refreshToken
      }
    };
    
    console.log('[loginUser] Returning result with user:', result.user.email, 'is_admin:', result.user.is_admin);
    return result;
  } finally {
    client.release();
  }
};

// Refresh token
const refreshAccessToken = async (refreshToken) => {
  const client = await pool.connect();
  
  try {
    // Check if refresh token exists and is valid
    const tokenResult = await client.query(
      `SELECT rt.*, u.id, u.email, u.role, u.is_active
       FROM refresh_tokens rt
       JOIN users u ON rt.user_id = u.id
       WHERE rt.token = $1 AND rt.revoked_at IS NULL AND rt.expires_at > CURRENT_TIMESTAMP`,
      [refreshToken]
    );

    if (tokenResult.rows.length === 0) {
      throw new Error('Invalid or expired refresh token');
    }

    const tokenData = tokenResult.rows[0];

    if (!tokenData.is_active) {
      throw new Error('User account is deactivated');
    }

    // Generate new access token
    const accessToken = generateToken(tokenData.id, tokenData.email, tokenData.role);

    return {
      access_token: accessToken
    };
  } finally {
    client.release();
  }
};

// Logout user
const logoutUser = async (refreshToken) => {
  await pool.query(
    'UPDATE refresh_tokens SET revoked_at = CURRENT_TIMESTAMP WHERE token = $1',
    [refreshToken]
  );
};

// Verify email
const verifyEmail = async (token) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Find valid verification token
    const tokenResult = await client.query(
      `SELECT user_id, expires_at FROM email_verification_tokens
       WHERE token = $1 AND verified_at IS NULL AND expires_at > CURRENT_TIMESTAMP`,
      [token]
    );

    if (tokenResult.rows.length === 0) {
      throw new Error('Invalid or expired verification token');
    }

    const { user_id } = tokenResult.rows[0];

    // Mark user as verified
    await client.query(
      'UPDATE users SET email_verified = TRUE WHERE id = $1',
      [user_id]
    );

    // Mark token as verified
    await client.query(
      'UPDATE email_verification_tokens SET verified_at = CURRENT_TIMESTAMP WHERE token = $1',
      [token]
    );

    await client.query('COMMIT');

    return { success: true, message: 'Email verified successfully' };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const resendVerificationEmail = async (email) => {
  const normalizedEmail = String(email || '').toLowerCase().trim();
  if (!normalizedEmail) return { success: true, message: 'If the account exists, a verification link has been sent' };

  const client = await pool.connect();
  try {
    const userResult = await client.query(
      'SELECT id, email, email_verified FROM users WHERE email = $1',
      [normalizedEmail]
    );
    if (userResult.rows.length === 0 || userResult.rows[0].email_verified) {
      return { success: true, message: 'If the account exists, a verification link has been sent' };
    }

    const user = userResult.rows[0];
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await client.query('UPDATE email_verification_tokens SET verified_at = CURRENT_TIMESTAMP WHERE user_id = $1 AND verified_at IS NULL', [user.id]);
    await client.query(
      `INSERT INTO email_verification_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)`,
      [user.id, token, expiresAt]
    );
    try {
      await sendVerificationEmail({ email: user.email, token });
    } catch (emailError) {
      console.error('[Auth] Resend verification email failed:', emailError.message);
    }
    return { success: true, message: 'If the account exists, a verification link has been sent' };
  } finally {
    client.release();
  }
};

// Request password reset
const requestPasswordReset = async (email) => {
  const client = await pool.connect();
  
  try {
    // Find user by email
    const userResult = await client.query(
      'SELECT id, email FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (userResult.rows.length === 0) {
      // Don't reveal if user exists
      return { success: true, message: 'If the email exists, a reset link has been sent' };
    }

    const user = userResult.rows[0];

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour

    // Store reset token
    await client.query(
      `INSERT INTO password_reset_tokens (user_id, token, expires_at)
       VALUES ($1, $2, $3)`,
      [user.id, resetToken, expiresAt]
    );

    try {
      await sendPasswordResetEmail({ email: user.email, token: resetToken });
    } catch (emailError) {
      console.error('[Auth] Password reset email delivery failed:', emailError.message);
    }

    return {
      success: true,
      message: 'If the email exists, a reset link has been sent'
    };
  } finally {
    client.release();
  }
};

// Reset password
const resetPassword = async (token, newPassword) => {
  if (typeof newPassword !== 'string' || newPassword.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Find valid reset token
    const tokenResult = await client.query(
      `SELECT prt.user_id, prt.expires_at, u.email, u.full_name
       FROM password_reset_tokens prt JOIN users u ON u.id = prt.user_id
       WHERE prt.token = $1 AND prt.used_at IS NULL AND prt.expires_at > CURRENT_TIMESTAMP`,
      [token]
    );

    if (tokenResult.rows.length === 0) {
      throw new Error('Invalid or expired reset token');
    }

    const { user_id, email, full_name } = tokenResult.rows[0];

    // Hash new password
    const passwordHash = await hashPassword(newPassword);

    // Update user password
    await client.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [passwordHash, user_id]
    );

    // Mark token as used
    await client.query(
      'UPDATE password_reset_tokens SET used_at = CURRENT_TIMESTAMP WHERE token = $1',
      [token]
    );

    // Revoke all refresh tokens for security
    await client.query(
      'UPDATE refresh_tokens SET revoked_at = CURRENT_TIMESTAMP WHERE user_id = $1',
      [user_id]
    );

    await client.query('COMMIT');
    try {
      await sendAccountSecurityEmail({ email, name: full_name, action: 'password reset' });
    } catch (emailError) {
      console.error('[Auth] Password reset security email failed:', emailError.message);
    }

    return { success: true, message: 'Password reset successfully' };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// Get user by ID
const getUserById = async (userId) => {
  const result = await pool.query(
    'SELECT id, email, full_name, username, phone, email_verified, is_active, is_admin, role, pin_hash, referral_code, avatar_url, created_at, last_login_at FROM users WHERE id = $1',
    [userId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const user = result.rows[0];
  
  console.log('[getUserById] User from DB:', { id: user.id, email: user.email, is_admin: user.is_admin, role: user.role });

  // Get user wallet
  const walletResult = await pool.query(
    'SELECT * FROM wallets WHERE user_id = $1',
    [userId]
  );

  const wallet = walletResult.rows[0] || null;

  return {
    ...user,
    pin_set: Boolean(user.pin_hash),
    wallet: wallet ? {
      main_balance: Number(wallet.main_balance),
      cashback_balance: Number(wallet.cashback_balance),
      referral_balance: Number(wallet.referral_balance)
    } : null
  };
};

// Verify transaction PIN server-side. The stored hash never leaves the backend.
const verifyPin = async (userId, pin) => {
  if (!/^\d{4,6}$/.test(String(pin || ''))) return false;
  const result = await pool.query('SELECT pin_hash FROM users WHERE id = $1', [userId]);
  if (result.rows.length === 0 || !result.rows[0].pin_hash) return false;
  return bcrypt.compare(String(pin), result.rows[0].pin_hash);
};

const changePin = async (userId, currentPin, pin) => {
  if (!/^\d{4,6}$/.test(String(pin || ''))) {
    throw new Error('PIN must contain 4 to 6 digits');
  }
  const existing = await pool.query('SELECT pin_hash, email, full_name FROM users WHERE id = $1', [userId]);
  if (existing.rows.length === 0) throw new Error('User not found');
  if (existing.rows[0].pin_hash && !(await bcrypt.compare(String(currentPin || ''), existing.rows[0].pin_hash))) {
    throw new Error('Current transaction PIN is incorrect');
  }
  const pinHash = await hashPassword(String(pin));
  await pool.query('UPDATE users SET pin_hash = $1 WHERE id = $2', [pinHash, userId]);
  try {
    await sendAccountSecurityEmail({ email: existing.rows[0].email, name: existing.rows[0].full_name, action: 'transaction PIN' });
  } catch (emailError) {
    console.error('[Auth] PIN security email failed:', emailError.message);
  }
  return { success: true, message: 'Transaction PIN changed successfully' };
};

// Update user profile
const updateUserProfile = async (userId, updates) => {
  const allowedFields = ['full_name', 'username', 'phone', 'avatar_url'];
  const updateFields = [];
  const updateValues = [];
  let paramIndex = 1;

  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      updateFields.push(`${field} = $${paramIndex}`);
      updateValues.push(updates[field]);
      paramIndex++;
    }
  }

  if (updateFields.length === 0) {
    throw new Error('No valid fields to update');
  }

  updateValues.push(userId);

  const query = `
    UPDATE users 
    SET ${updateFields.join(', ')} 
    WHERE id = $${paramIndex}
    RETURNING id, email, full_name, username, phone, avatar_url
  `;

  const result = await pool.query(query, updateValues);

  if (result.rows.length === 0) {
    throw new Error('User not found');
  }

  try {
    await sendAccountSecurityEmail({ email: result.rows[0].email, name: result.rows[0].full_name, action: 'profile details' });
  } catch (emailError) {
    console.error('[Auth] Profile security email failed:', emailError.message);
  }
  return result.rows[0];
};

// Change password
const changePassword = async (userId, currentPassword, newPassword) => {
  if (typeof newPassword !== 'string' || newPassword.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    // Get current password hash
    const userResult = await client.query(
      'SELECT password_hash, email, full_name FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      throw new Error('User not found');
    }

    const user = userResult.rows[0];

    // Verify current password
    const isValidPassword = await comparePassword(currentPassword, user.password_hash);

    if (!isValidPassword) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const passwordHash = await hashPassword(newPassword);

    // Update password
    await client.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [passwordHash, userId]
    );

    // Revoke all refresh tokens for security
    await client.query(
      'UPDATE refresh_tokens SET revoked_at = CURRENT_TIMESTAMP WHERE user_id = $1',
      [userId]
    );

    await client.query('COMMIT');
    try {
      await sendAccountSecurityEmail({ email: user.email, name: user.full_name, action: 'password' });
    } catch (emailError) {
      console.error('[Auth] Password security email failed:', emailError.message);
    }
    return { success: true, message: 'Password changed successfully' };
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  verifyEmail,
  resendVerificationEmail,
  requestPasswordReset,
  resetPassword,
  getUserById,
  updateUserProfile,
  changePassword,
  verifyPin,
  changePin,
  hashPassword,
  comparePassword
};
