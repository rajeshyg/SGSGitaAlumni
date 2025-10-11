// Quick script to check OTP tokens in database
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

async function checkOTPTokens(email) {
  try {
    const [rows] = await pool.execute(`
      SELECT 
        id,
        email,
        otp_code,
        token_type,
        expires_at,
        is_used,
        attempt_count,
        created_at,
        CASE 
          WHEN expires_at < NOW() THEN 'EXPIRED'
          WHEN is_used = TRUE THEN 'USED'
          ELSE 'VALID'
        END as status
      FROM OTP_TOKENS
      WHERE email = ?
      ORDER BY created_at DESC
      LIMIT 5
    `, [email]);

    console.log(`\n${'='.repeat(80)}`);
    console.log(`OTP TOKENS for ${email}`);
    console.log('='.repeat(80));
    
    if (rows.length === 0) {
      console.log('❌ NO TOKENS FOUND IN DATABASE');
    } else {
      rows.forEach((token, index) => {
        console.log(`\n--- Token ${index + 1} ---`);
        console.log(`ID: ${token.id}`);
        console.log(`OTP Code: ${token.otp_code}`);
        console.log(`Token Type: ${token.token_type}`);
        console.log(`Status: ${token.status}`);
        console.log(`Expires At: ${token.expires_at}`);
        console.log(`Is Used: ${token.is_used}`);
        console.log(`Attempt Count: ${token.attempt_count}`);
        console.log(`Created At: ${token.created_at}`);
      });
    }
    
    console.log(`\n${'='.repeat(80)}\n`);

  } catch (error) {
    console.error('❌ Error checking OTP tokens:', error.message);
  } finally {
    await pool.end();
  }
}

const email = process.argv[2] || 'harshayarlagadda2@gmail.com';
checkOTPTokens(email);
