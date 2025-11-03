import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function checkDuplicates() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });
  
  const [users] = await connection.execute(
    'SELECT id, email, is_family_account, family_account_type, created_at FROM app_users WHERE email = ? ORDER BY id',
    ['jayanthi236@gmail.com']
  );
  
  console.log(`Found ${users.length} user(s) with email jayanthi236@gmail.com:\n`);
  
  users.forEach(user => {
    console.log(`User ID: ${user.id}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  is_family_account: ${user.is_family_account}`);
    console.log(`  family_account_type: ${user.family_account_type}`);
    console.log(`  created_at: ${user.created_at}\n`);
  });
  
  await connection.end();
}

checkDuplicates().catch(console.error);
