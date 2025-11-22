import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function checkUsers() {
  try {
    const [rows] = await pool.execute(
      'SELECT id, email, role, is_active FROM app_users WHERE role IN ("admin", "moderator") LIMIT 5'
    );
    
    console.log('Admin/Moderator Users:');
    console.table(rows);
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkUsers();
