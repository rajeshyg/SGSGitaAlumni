// Check for real invitation tokens in the database
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const DB_CONFIG = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT || '3306'),
  connectTimeout: 60000,
  acquireTimeout: 60000,
  timeout: 60000,
};

console.log('Checking for real invitation tokens in database...');

async function checkInvitationTokens() {
  let connection;
  try {
    console.log('1. Creating connection pool...');
    const pool = mysql.createPool(DB_CONFIG);

    console.log('2. Getting database connection...');
    connection = await pool.getConnection();

    console.log('3. Querying invitation tokens...');
    const [rows] = await connection.execute(
      'SELECT invitation_token, email, status, created_at, expires_at FROM invitations ORDER BY created_at DESC LIMIT 5'
    );

    console.log(`Found ${rows.length} invitation tokens:`);
    rows.forEach((row, index) => {
      console.log(`${index + 1}. Token: ${row.invitation_token}`);
      console.log(`   Email: ${row.email}`);
      console.log(`   Status: ${row.status}`);
      console.log(`   Created: ${row.created_at}`);
      console.log(`   Expires: ${row.expires_at}`);
      console.log('---');
    });

    connection.release();
    await pool.end();

  } catch (error) {
    if (connection) connection.release();
    console.error('❌ Error checking invitation tokens:', error.message);
    console.error('Error code:', error.code);
  }
}

checkInvitationTokens();