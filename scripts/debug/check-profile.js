import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  const profileId = '56bc72b1-59d0-4921-b4e2-b369ca1f05f7';

  try {
    const [rows] = await conn.query('SELECT * FROM user_profiles WHERE id = ?', [profileId]);
    console.log(`Profile ${profileId} found:`, rows.length > 0);
    if (rows.length > 0) {
      console.log(rows[0]);
    } else {
      // Check if it exists in accounts just in case
      const [accounts] = await conn.query('SELECT * FROM accounts WHERE id = ?', [profileId]);
      console.log(`Account ${profileId} found:`, accounts.length > 0);
    }
  } catch (error) {
    console.error(error);
  } finally {
    await conn.end();
  }
}

main();
