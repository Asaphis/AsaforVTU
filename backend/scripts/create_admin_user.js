const path = require('path');
const dotenv = require('dotenv');
const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });
const pool = require('../src/config/database');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

async function createAdminUser(email, password) {
  if (!email || !password) {
    console.error('Usage: node scripts/create_admin_user.js <email> <password>');
    process.exit(1);
  }
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Check if user exists
    const userResult = await client.query(
      'SELECT id, is_admin FROM users WHERE email = $1',
      [email.toLowerCase()]
    );
    
    let userId;
    
    if (userResult.rows.length > 0) {
      userId = userResult.rows[0].id;
      console.log('User already exists, updating to admin...');
      
      // Update password if provided
      const hashedPassword = await bcrypt.hash(password, 10);
      await client.query(
        'UPDATE users SET password_hash = $1, is_admin = true, role = $2, email_verified = true WHERE id = $3',
        [hashedPassword, 'admin', userId]
      );
    } else {
      // Create new user
      userId = uuidv4();
      const hashedPassword = await bcrypt.hash(password, 10);
      
      await client.query(
        `INSERT INTO users (id, email, password_hash, full_name, username, is_admin, role, email_verified, is_active)
         VALUES ($1, $2, $3, $4, $5, true, $6, true, true)`,
        [userId, email.toLowerCase(), hashedPassword, email.split('@')[0], email.split('@')[0], 'admin']
      );
      
      // Create wallet
      await client.query(
        'INSERT INTO wallets (user_id, main_balance, cashback_balance, referral_balance) VALUES ($1, 0, 0, 0)',
        [userId]
      );
    }
    
    await client.query('COMMIT');
    
    console.log(JSON.stringify({ success: true, userId, email }, null, 2));
    process.exit(0);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error && error.message ? error.message : String(error));
    process.exit(1);
  } finally {
    client.release();
  }
}

const [email, password] = process.argv.slice(2);
createAdminUser(email, password);
