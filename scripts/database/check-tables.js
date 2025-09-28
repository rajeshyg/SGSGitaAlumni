import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT || '3306'),
});

async function checkTables() {
  try {
    const connection = await pool.getConnection();

    // Get all table names
    const [rows] = await connection.execute('SHOW TABLES');

    console.log('Available tables:');
    rows.forEach(row => {
      const tableName = Object.values(row)[0];
      console.log(`- ${tableName}`);
    });

    connection.release();
  } catch (error) {
    console.error('Error checking tables:', error);
  } finally {
    await pool.end();
  }
}

checkTables();