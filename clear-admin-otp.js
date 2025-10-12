import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function clearOTPForEmail(email) {
  try {
    const connection = await pool.getConnection();
    
    // Get all OTPs for the email
    const [rows] = await connection.execute(
      'SELECT * FROM OTP_TOKENS WHERE email = ?',
      [email]
    );
    
    console.log(`\n📋 Found ${rows.length} token(s) for ${email}:`);
    rows.forEach(row => {
      console.log(`   Code: ${row.otp_code}, Attempts: ${row.attempt_count}, Used: ${row.is_used}`);
    });
    
    // Delete all OTPs for the email
    const [result] = await connection.execute(
      'DELETE FROM OTP_TOKENS WHERE email = ?',
      [email]
    );
    
    connection.release();
    
    console.log(`\n✅ Deleted ${result.affectedRows} OTP tokens for ${email}\n`);
  } catch (error) {
    console.error('Error clearing OTP tokens:', error);
  } finally {
    await pool.end();
  }
}

// Clear for admin email
clearOTPForEmail('datta.rajesh@gmail.com');
