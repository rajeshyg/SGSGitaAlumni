import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true
  });

  console.log('=== Switching Preferences FK to user_profiles ===\n');

  try {
    const migrationPath = path.join(__dirname, '../../migrations/2025-12-10-002-switch-preferences-to-profiles.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('Executing migration script...');
    await conn.query(sql);
    console.log('✅ Migration executed successfully.');

    console.log('\nVerifying FK constraints...');
    const [constraints] = await conn.query(`
      SELECT 
          TABLE_NAME, 
          CONSTRAINT_NAME, 
          COLUMN_NAME, 
          REFERENCED_TABLE_NAME, 
          REFERENCED_COLUMN_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
      WHERE TABLE_NAME IN ('USER_PREFERENCES', 'USER_NOTIFICATION_PREFERENCES', 'USER_PRIVACY_SETTINGS')
      AND REFERENCED_TABLE_NAME IS NOT NULL
    `);

    console.table(constraints);

  } catch (error) {
    console.error('❌ Error executing migration:', error);
  } finally {
    await conn.end();
  }
}

main();
