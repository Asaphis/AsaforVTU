const fs = require('fs');
const path = require('path');
const pool = require('../src/config/database');

async function runMigration() {
  try {
    console.log('[Migration] Starting database migration...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, '../migrations/001_initial_schema.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('[Migration] Executing schema...');
    await pool.query(migrationSQL);
    
    console.log('[Migration] ✅ Migration completed successfully!');
    console.log('[Migration] Database schema created with all tables and indexes.');
    
    process.exit(0);
  } catch (error) {
    console.error('[Migration] ❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
