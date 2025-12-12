import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getPool } from '../../utils/database.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function applyMigration() {
  const pool = getPool();
  console.log('🚀 Applying collation fix migration...');

  try {
    const migrationPath = path.join(__dirname, '../../migrations/2025-12-11-001-fix-posting-related-collations.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    // Split queries by semicolon (simple split, assumes valid SQL file structure)
    const queries = sql.split(';').filter(q => q.trim().length > 0);

    for (const query of queries) {
      if (query.trim()) {
        console.log(`Executing: ${query.substring(0, 50)}...`);
        await pool.query(query);
      }
    }

    console.log('✅ Migration applied successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    process.exit(0);
  }
}

applyMigration();
