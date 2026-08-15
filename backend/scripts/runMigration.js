const fs = require('fs');
const path = require('path');
const pool = require('../src/config/database');

async function runMigration() {
  try {
    console.log('[Migration] Starting database migrations...');
    const migrationDirectory = path.join(__dirname, '../migrations');
    const files = fs.readdirSync(migrationDirectory)
      .filter(file => /^\d+_.*\.sql$/i.test(file))
      .sort((left, right) => left.localeCompare(right, undefined, { numeric: true }));
    for (const file of files) {
      console.log(`[Migration] Applying ${file}...`);
      await pool.query(fs.readFileSync(path.join(migrationDirectory, file), 'utf8'));
    }
    console.log('[Migration] Database migrations completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('[Migration] Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
