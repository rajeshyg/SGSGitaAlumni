import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function checkAllDuplicates() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });
  
  const testAccounts = [
    { email: 'saikveni6@gmail.com', familyAccountId: 9 },
    { email: 'gangadherade@gmail.com', familyAccountId: 92 },
    { email: 'srinidhi.anand@yahoo.com', familyAccountId: 2 }
  ];
  
  for (const account of testAccounts) {
    const [users] = await connection.execute(
      'SELECT id FROM app_users WHERE email = ?',
      [account.email]
    );
    
    if (users.length > 1) {
      console.log(`❌ ${account.email} has ${users.length} duplicates!`);
      console.log(`   Deleting all except family account ID ${account.familyAccountId}...`);
      
      const [result] = await connection.execute(
        'DELETE FROM app_users WHERE email = ? AND id != ?',
        [account.email, account.familyAccountId]
      );
      
      console.log(`   Deleted ${result.affectedRows} duplicate(s)\n`);
    } else {
      console.log(`✅ ${account.email} - No duplicates\n`);
    }
  }
  
  await connection.end();
}

checkAllDuplicates().catch(console.error);
