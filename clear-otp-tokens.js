// Clear OTP tokens for testing
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function clearOTPTokens() {
  const email = process.argv[2] || 'harshayarlagadda2@gmail.com';
  
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  // First, show what we have
  const [tokens] = await connection.execute(
    'SELECT otp_code, attempt_count, is_used, created_at FROM OTP_TOKENS WHERE email = ?',
    [email]
  );
  
  if (tokens.length > 0) {
    console.log(`\n📋 Found ${tokens.length} token(s) for ${email}:`);
    tokens.forEach(t => {
      console.log(`   Code: ${t.otp_code}, Attempts: ${t.attempt_count}, Used: ${t.is_used}`);
    });
  }

  const [result] = await connection.execute(
    'DELETE FROM OTP_TOKENS WHERE email = ?',
    [email]
  );

  console.log(`\n✅ Deleted ${result.affectedRows} OTP tokens for ${email}\n`);
  
  await connection.end();
}

clearOTPTokens().catch(console.error);
