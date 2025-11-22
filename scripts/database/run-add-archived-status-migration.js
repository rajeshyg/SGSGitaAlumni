/**
 * Script to add 'archived' status to POSTINGS table enum
 * This will fix the E2E test archive workflow failure
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
    const sqlPath = join(__dirname, 'scripts', 'database', 'add-archived-status-to-postings.sql');
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

    // Verify the change
    console.log('\n=== Final Verification ===');
    const [statusCheck] = await connection.query(`
      SELECT status, COUNT(*) as count 
      FROM POSTINGS 
      GROUP BY status 
      ORDER BY count DESC
    `);
    console.log('Current status distribution:');
    console.table(statusCheck);

    const [describeResult] = await connection.query('DESCRIBE POSTINGS');
    const statusField = describeResult.find(field => field.Field === 'status');
    console.log('\nStatus enum definition:');
    console.log(statusField.Type);

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
