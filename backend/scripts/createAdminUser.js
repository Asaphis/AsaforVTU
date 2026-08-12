const pool = require('../src/config/database');
const { hashPassword } = require('../src/services/authService');

async function createAdminUser() {
  try {
    const email = process.argv[2];
    const password = process.argv[3];
    const fullName = process.argv[4] || 'Admin User';

    if (!email || !password) {
      console.log('Usage: node createAdminUser.js <email> <password> [full_name]');
      process.exit(1);
    }

    console.log('[Admin User Creation] Starting...');
    console.log(`[Admin User Creation] Email: ${email}`);
    console.log(`[Admin User Creation] Full Name: ${fullName}`);

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id, email FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      console.log('[Admin User Creation] User already exists');
      const user = existingUser.rows[0];
      
      // Update to admin if not already
      await pool.query(
        'UPDATE users SET is_admin = true, role = $1 WHERE id = $2',
        ['admin', user.id]
      );
      
      console.log('[Admin User Creation] ✅ User updated to admin role');
      console.log(`[Admin User Creation] User ID: ${user.id}`);
      process.exit(0);
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Insert admin user
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, full_name, is_admin, role, email_verified)
       VALUES ($1, $2, $3, true, 'admin', true)
       RETURNING id, email, full_name, is_admin, role`,
      [email.toLowerCase(), passwordHash, fullName]
    );

    const user = result.rows[0];

    // Create wallet for admin
    await pool.query(
      'INSERT INTO wallets (user_id) VALUES ($1)',
      [user.id]
    );

    console.log('[Admin User Creation] ✅ Admin user created successfully');
    console.log(`[Admin User Creation] User ID: ${user.id}`);
    console.log(`[Admin User Creation] Email: ${user.email}`);
    console.log(`[Admin User Creation] Full Name: ${user.full_name}`);
    console.log(`[Admin User Creation] Role: ${user.role}`);
    console.log(`[Admin User Creation] Is Admin: ${user.is_admin}`);

    process.exit(0);
  } catch (error) {
    console.error('[Admin User Creation] ❌ Error:', error);
    process.exit(1);
  }
}

createAdminUser();
