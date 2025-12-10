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

  console.log('=== Fixing POSTINGS Table Collation ===\n');

  console.log('1. Disabling FK checks...');
  await conn.query('SET FOREIGN_KEY_CHECKS = 0');

  console.log('2. Converting POSTINGS to utf8mb4_0900_ai_ci...');
  await conn.query('ALTER TABLE POSTINGS CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci');
  console.log('   ✅ Done');

  console.log('3. Re-enabling FK checks...');
  await conn.query('SET FOREIGN_KEY_CHECKS = 1');

  console.log('\n=== Verifying Table Collations ===');
  const [tables] = await conn.query(`
    SELECT TABLE_NAME, TABLE_COLLATION 
    FROM INFORMATION_SCHEMA.TABLES 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME IN ('POSTINGS', 'user_profiles', 'accounts', 'alumni_members')
  `);
  tables.forEach(t => console.log(`  ${t.TABLE_NAME}: ${t.TABLE_COLLATION}`));

  await conn.end();
}

main().catch(console.error);
