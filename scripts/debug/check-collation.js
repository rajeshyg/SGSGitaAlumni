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

  console.log('Disabling FK checks...');
  await conn.query('SET FOREIGN_KEY_CHECKS = 0');

  console.log('Converting accounts to utf8mb4_0900_ai_ci...');
  await conn.query('ALTER TABLE accounts CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci');
  
  console.log('Converting user_profiles to utf8mb4_0900_ai_ci...');
  await conn.query('ALTER TABLE user_profiles CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci');
  
  console.log('Re-enabling FK checks...');
  await conn.query('SET FOREIGN_KEY_CHECKS = 1');

  console.log('Done! Verifying:');
  const [tables] = await conn.query(`SHOW TABLE STATUS WHERE Name IN ('accounts', 'user_profiles', 'USER_PREFERENCES', 'alumni_members')`);
  tables.forEach(t => console.log(`  ${t.Name}: ${t.Collation}`));

  await conn.end();
}

main().catch(console.error);
