/**
 * Script to add is_group column to CONVERSATIONS table
 * Task 8.12: Posts-Chat Integration - Fix group conversation detection
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '.env') });

async function runMigration() {
  let connection;

  try {
    console.log('Connecting to database...');
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 3306,
      multipleStatements: true
    });

    console.log('Connected successfully.\n');

    // Read and execute the migration SQL
    const sqlPath = join(__dirname, 'scripts', 'database', 'add-is-group-to-conversations.sql');
    const sql = readFileSync(sqlPath, 'utf8');

    console.log('Executing migration...\n');
    const [results] = await connection.query(sql);

    // Process results (MySQL returns array of results for multiple statements)
    if (Array.isArray(results)) {
      results.forEach((result, index) => {
        if (Array.isArray(result) && result.length > 0) {
          console.log(`\n--- Result ${index + 1} ---`);
          console.table(result);
        }
      });
    }

    console.log('\n✅ Migration executed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('\nDatabase connection closed.');
    }
  }
}

// Run the migration
runMigration()
  .then(() => {
    console.log('\n✅ Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  });