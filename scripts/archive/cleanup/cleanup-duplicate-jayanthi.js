import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function cleanupDuplicates() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });
  
  console.log('Deleting duplicate jayanthi236@gmail.com accounts...\n');
  
  // Keep User ID 8 (the family account), delete the others
  const [result] = await connection.execute(
    'DELETE FROM app_users WHERE email = ? AND id NOT IN (8)',
    ['jayanthi236@gmail.com']
  );
  
  console.log(`Deleted ${result.affectedRows} duplicate account(s)\n`);
  
  // Verify only one account remains
  const [users] = await connection.execute(
    'SELECT id, email, is_family_account, family_account_type FROM app_users WHERE email = ?',
    ['jayanthi236@gmail.com']
  );
  
  console.log('Remaining account:');
  console.log(JSON.stringify(users[0], null, 2));
  
  await connection.end();
}

cleanupDuplicates().catch(console.error);
