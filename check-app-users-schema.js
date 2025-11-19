import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10
});

async function checkAppUsersSchema() {
  let connection;

  try {
    connection = await pool.getConnection();

    console.log('\n=== APP_USERS TABLE SCHEMA ===\n');

    // Get table structure
    const [columns] = await connection.execute('DESCRIBE app_users');

    console.log('Column Details:');
    columns.forEach(col => {
      console.log(`  ${col.Field}:`);
      console.log(`    Type: ${col.Type}`);
      console.log(`    Null: ${col.Null}`);
      console.log(`    Key: ${col.Key}`);
      console.log(`    Default: ${col.Default}`);
      console.log(`    Extra: ${col.Extra}`);
      console.log('');
    });

    // Check recent user IDs to see format
    console.log('\n=== RECENT USER IDs ===\n');
    const [users] = await connection.execute(
      'SELECT id, email, created_at FROM app_users ORDER BY created_at DESC LIMIT 5'
    );

    users.forEach(user => {
      console.log(`  ID: ${user.id} (type: ${typeof user.id}, length: ${String(user.id).length})`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Created: ${user.created_at}`);
      console.log('');
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    if (connection) connection.release();
    await pool.end();
  }
}

checkAppUsersSchema();
