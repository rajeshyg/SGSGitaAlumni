import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

async function check() {
  try {
    // Get real users from app_users
    const [users] = await pool.query(`
      SELECT id, first_name, last_name, email 
      FROM app_users 
      WHERE first_name IS NOT NULL 
        AND last_name IS NOT NULL
        AND first_name != 'Anonymous'
      LIMIT 10
    `);

    console.log('\nReal users in database:\n');
    users.forEach((u, i) => {
      console.log(`${i+1}. ${u.first_name} ${u.last_name} (${u.email})`);
      console.log(`   ID: ${u.id}`);
    });

  } catch (err) {
    console.error('ERROR:', err);
  } finally {
    await pool.end();
  }
}

check();
