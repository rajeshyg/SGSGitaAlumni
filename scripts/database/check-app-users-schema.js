import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT || '3306')
});

async function checkSchema() {
  try {
    const conn = await pool.getConnection();
    
    console.log('=== app_users table columns ===\n');
    const [cols] = await conn.query('DESCRIBE app_users');
    cols.forEach(c => {
      console.log(`${c.Field.padEnd(30)} ${c.Type.padEnd(20)} ${c.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    conn.release();
    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkSchema();

