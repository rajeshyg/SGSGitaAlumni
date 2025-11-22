import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config();

async function checkRoles() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306
  });

  try {
    const [rows] = await pool.query('SELECT id, email, role FROM app_users WHERE role IN ("moderator", "admin") LIMIT 10');
    console.log('Users with moderator/admin roles:');
    rows.forEach(row => console.log(`  ${row.email}: ${row.role} (id: ${row.id})`));

    if (rows.length === 0) {
      console.log('No users found with moderator or admin roles!');
    }
  } catch (error) {
    console.error('Database error:', error);
  } finally {
    await pool.end();
  }
}

checkRoles();