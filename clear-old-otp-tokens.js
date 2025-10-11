// Clear old OTP tokens to bypass rate limiting during testing
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

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

async function clearOldTokens(email) {
  try {
    // Delete tokens older than 10 minutes (bypass rate limit)
    const [result] = await pool.execute(`
      DELETE FROM OTP_TOKENS
      WHERE email = ?
        AND created_at < DATE_SUB(NOW(), INTERVAL 10 MINUTE)
    `, [email]);

    console.log(`\n✅ Deleted ${result.affectedRows} old OTP tokens for ${email}`);
    console.log(`   (This clears the rate limit for testing)\n`);

  } catch (error) {
    console.error('❌ Error clearing old tokens:', error.message);
  } finally {
    await pool.end();
  }
}

const email = process.argv[2] || 'harshayarlagadda2@gmail.com';
clearOldTokens(email);
