import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function checkAllTestAccounts() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });
  
  const testEmails = [
    'jayanthi236@gmail.com',
    'saikveni6@gmail.com',
    'gangadherade@gmail.com',
    'srinidhi.anand@yahoo.com'
  ];
  
  console.log('Checking all test family accounts:\n');
  
  for (const email of testEmails) {
    const [users] = await connection.execute(
      'SELECT id, email, is_family_account, family_account_type, primary_family_member_id FROM app_users WHERE email = ?',
      [email]
    );
    
    if (users.length > 0) {
      const user = users[0];
      console.log(`${email}:`);
      console.log(`  User ID: ${user.id}`);
      console.log(`  is_family_account: ${user.is_family_account}`);
      console.log(`  family_account_type: ${user.family_account_type}`);
      console.log(`  primary_family_member_id: ${user.primary_family_member_id}`);
      
      // Check family members
      const [members] = await connection.execute(
        'SELECT COUNT(*) as count FROM FAMILY_MEMBERS WHERE parent_user_id = ?',
        [user.id]
      );
      console.log(`  Family members in DB: ${members[0].count}\n`);
    } else {
      console.log(`${email}: NOT FOUND\n`);
    }
  }
  
  await connection.end();
}

checkAllTestAccounts().catch(console.error);
