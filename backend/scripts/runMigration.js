const fs = require('fs');
const path = require('path');
const pool = require('../src/config/database');

const MIGRATION_TABLE = 'schema_migrations';

async function migrationWasApplied(fileName) {
  const result = await pool.query(`SELECT 1 FROM ${MIGRATION_TABLE} WHERE file_name = $1`, [fileName]);
  return result.rows.length > 0;
}

async function markApplied(fileName) {
  await pool.query(`INSERT INTO ${MIGRATION_TABLE} (file_name) VALUES ($1) ON CONFLICT (file_name) DO NOTHING`, [fileName]);
}

async function initialSchemaAlreadyExists() {
  const result = await pool.query(`SELECT to_regclass('public.users') AS users_table, to_regclass('public.wallets') AS wallets_table`);
  return Boolean(result.rows[0]?.users_table && result.rows[0]?.wallets_table);
}

async function runMigration() {
  try {
    console.log('[Migration] Starting database migrations...');
    await pool.query(`CREATE TABLE IF NOT EXISTS ${MIGRATION_TABLE} (
      file_name VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`);

    const migrationDirectory = path.join(__dirname, '../migrations');
    const files = fs.readdirSync(migrationDirectory)
      .filter(file => /^\d+_.*\.sql$/i.test(file))
      .sort((left, right) => left.localeCompare(right, undefined, { numeric: true }));

    for (const file of files) {
      if (await migrationWasApplied(file)) {
        console.log(`[Migration] Skipping already-applied ${file}.`);
        continue;
      }

      if (file === '001_initial_schema.sql' && await initialSchemaAlreadyExists()) {
        console.log('[Migration] Existing database schema detected; recording 001_initial_schema.sql as the baseline.');
        await markApplied(file);
        continue;
      }

      console.log(`[Migration] Applying ${file}...`);
      const sql = fs.readFileSync(path.join(migrationDirectory, file), 'utf8');
      await pool.query(sql);
      await markApplied(file);
      console.log(`[Migration] Applied ${file}.`);
    }

    console.log('[Migration] Database migrations completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('[Migration] Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
