// Check if users have is_family_account flag set
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function checkFamilyAccountFlags() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'sgsgitaalumni'
  });

  try {
    console.log('\n=== Checking Family Account Flags ===\n');

    // Check test emails
    const testEmails = ['jayanthi236@gmail.com', 'saikveni6@gmail.com', 'gangadherade@gmail.com'];
    
    for (const email of testEmails) {
      const [users] = await connection.execute(
        `SELECT id, email, first_name, last_name, is_family_account, 
                family_account_type, primary_family_member_id 
         FROM app_users 
         WHERE email = ?`,
        [email]
      );
      
      console.log(`\n📧 ${email}:`);
      if (users.length > 0) {
        const user = users[0];
        console.log(`   ✅ User ID: ${user.id}`);
        console.log(`   👤 Name: ${user.first_name} ${user.last_name}`);
        console.log(`   👨‍👩‍👧‍👦 is_family_account: ${user.is_family_account} (type: ${typeof user.is_family_account})`);
        console.log(`   📋 family_account_type: ${user.family_account_type}`);
        console.log(`   🔗 primary_family_member_id: ${user.primary_family_member_id}`);
        
        // Check family members for this account
        const [familyMembers] = await connection.execute(
          `SELECT id, member_name, relationship, age, is_minor 
           FROM FAMILY_MEMBERS 
           WHERE account_id = ?`,
          [user.id]
        );
        
        console.log(`   👥 Family Members: ${familyMembers.length}`);
        if (familyMembers.length > 0) {
          familyMembers.forEach(member => {
            console.log(`      - ${member.member_name} (${member.relationship}, age: ${member.age}, minor: ${member.is_minor})`);
          });
        }
      } else {
        console.log(`   ❌ User not found`);
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

checkFamilyAccountFlags();
