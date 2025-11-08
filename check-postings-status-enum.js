/**
 * Script to check POSTINGS table status enum values
 * This will help us identify if 'archived' is a valid status value
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '.env') });

async function checkPostingsStatusEnum() {
  let connection;
  
  try {
    console.log('Connecting to database...');
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 3306
    });
    
    console.log('Connected successfully.\n');

    // Method 1: DESCRIBE TABLE
    console.log('=== Method 1: DESCRIBE TABLE ===');
    const [describeResult] = await connection.query('DESCRIBE POSTINGS');
    const statusField = describeResult.find(field => field.Field === 'status');
    if (statusField) {
      console.log('Status field found:');
      console.log(JSON.stringify(statusField, null, 2));
      console.log('\nStatus Type:', statusField.Type);
      console.log('Status Null:', statusField.Null);
      console.log('Status Default:', statusField.Default);
    } else {
      console.log('❌ Status field NOT found in POSTINGS table!');
    }

    // Method 2: SHOW CREATE TABLE
    console.log('\n=== Method 2: SHOW CREATE TABLE ===');
    const [createTableResult] = await connection.query('SHOW CREATE TABLE POSTINGS');
    if (createTableResult && createTableResult.length > 0) {
      console.log(createTableResult[0]['Create Table']);
    }

    // Method 3: Check actual status values in use
    console.log('\n=== Method 3: Actual Status Values in Database ===');
    const [statusValues] = await connection.query(`
      SELECT status, COUNT(*) as count 
      FROM POSTINGS 
      GROUP BY status 
      ORDER BY count DESC
    `);
    console.log('Status values currently in use:');
    console.table(statusValues);

    // Method 4: Check if 'archived' status exists in any records
    console.log('\n=== Method 4: Check for archived posts ===');
    const [archivedCount] = await connection.query(`
      SELECT COUNT(*) as count FROM POSTINGS WHERE status = 'archived'
    `);
    console.log('Archived posts count:', archivedCount[0].count);

    // Method 5: Try to find recent posts that might have been archived
    console.log('\n=== Method 5: Recent posts (last 20) ===');
    const [recentPosts] = await connection.query(`
      SELECT id, title, status, created_at, updated_at 
      FROM POSTINGS 
      ORDER BY updated_at DESC 
      LIMIT 20
    `);
    console.table(recentPosts);

  } catch (error) {
    console.error('Error checking postings status enum:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('\nDatabase connection closed.');
    }
  }
}

// Run the check
checkPostingsStatusEnum()
  .then(() => {
    console.log('\n✅ Check completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Check failed:', error);
    process.exit(1);
  });
