/* CommonJS copy of create-test-moderator.js for projects with "type":"module" */

// Load environment variables for DB access when running this script directly
require('dotenv').config();
const bcrypt = require('bcrypt');

async function createTestModerator() {
  const { getPool } = await import('./utils/database.js');
  const pool = getPool();
  const connection = await pool.getConnection();
  
  try {
    const email = process.argv[2];
    
    if (email) {
      // Upgrade existing user to moderator
      console.log(`Upgrading user ${email} to moderator role...`);
      
      const [result] = await connection.query(
        `UPDATE app_users SET role = 'moderator' WHERE email = ?`,
        [email]
      );
      
      if (result.affectedRows === 0) {
        console.log(`❌ User with email ${email} not found`);
        process.exit(1);
      }
      
      console.log(`✅ User ${email} upgraded to moderator role`);
      
      // Show user details
      const [users] = await connection.query(
        `SELECT id, email, first_name, last_name, role FROM app_users WHERE email = ?`,
        [email]
      );
      
      console.log('\nUser Details:');
      console.log(users[0]);
      
    } else {
      // Create new test moderator
      console.log('Creating new test moderator account...');
      
      // Check if test moderator already exists
      const [existing] = await connection.query(
        `SELECT id, email FROM app_users WHERE email = 'moderator@test.com'`
      );
      
      if (existing.length > 0) {
        console.log('❌ Test moderator (moderator@test.com) already exists');
        console.log('To upgrade an existing user, provide their email:');
        console.log('  node create-test-moderator.js user@example.com');
        process.exit(1);
      }
      
      // Hash password
      const passwordHash = await bcrypt.hash('TestMod123!', 10);
      
      // Create moderator user
      const [result] = await connection.query(
        `INSERT INTO app_users 
         (id, email, first_name, last_name, password_hash, role, email_verified, created_at)
         VALUES (UUID(), ?, ?, ?, ?, 'moderator', 1, NOW())`,
        ['moderator@test.com', 'Test', 'Moderator', passwordHash]
      );
      
      console.log('✅ Test moderator account created successfully!');
      console.log('\nLogin Credentials:');
      console.log('  Email: moderator@test.com');
      console.log('  Password: TestMod123!');
      console.log('  Role: moderator');
      
      // Get the created user
      const [users] = await connection.query(
        `SELECT id, email, first_name, last_name, role FROM app_users WHERE email = 'moderator@test.com'`
      );
      
      console.log('\nUser Details:');
      console.log(users[0]);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    connection.release();
    process.exit(0);
  }
}

// Run the script
createTestModerator();
