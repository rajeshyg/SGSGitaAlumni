/**
 * FAMILY MEMBER SYSTEM - DEV DATABASE SETUP
 * 
 * Purpose: Setup family member system with minimal test data for development
 * Strategy: Create family members for just a few test users
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const DB_CONFIG = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306
};

async function setupDevFamilyData() {
  let connection;
  
  try {
    console.log('🚀 Setting up Family Member System for DEV environment...\n');
    
    connection = await mysql.createConnection(DB_CONFIG);
    console.log('✅ Connected to database:', DB_CONFIG.database);
    
    await connection.beginTransaction();
    console.log('📝 Transaction started\n');
    
    // Step 1: Update all users to be individual accounts (default state)
    console.log('Setting all users to individual account type...');
    await connection.execute(`
      UPDATE app_users 
      SET is_family_account = FALSE,
          family_account_type = 'individual'
    `);
    console.log('✅ All users set to individual accounts\n');
    
    // Step 2: Get a few test users to create family members for
    const [testUsers] = await connection.execute(`
      SELECT id, email, first_name, last_name 
      FROM app_users 
      WHERE id IN (2, 10025)
      ORDER BY id
    `);
    
    console.log(`📊 Creating family members for ${testUsers.length} test users:\n`);
    
    for (const user of testUsers) {
      console.log(`Processing user ${user.id}: ${user.email}...`);
      
      // Create family member record (self)
      await connection.execute(`
        INSERT INTO FAMILY_MEMBERS (
          parent_user_id,
          first_name,
          last_name,
          display_name,
          relationship,
          is_primary_contact,
          can_access_platform,
          requires_parent_consent,
          parent_consent_given,
          access_level,
          status
        ) VALUES (?, ?, ?, ?, 'self', TRUE, TRUE, FALSE, FALSE, 'full', 'active')
      `, [
        user.id,
        user.first_name || 'User',
        user.last_name || user.id.toString(),
        `${user.first_name || 'User'} ${user.last_name || user.id.toString()}`
      ]);
      
      // Get the created family member ID
      const [familyMembers] = await connection.execute(
        'SELECT id FROM FAMILY_MEMBERS WHERE parent_user_id = ? AND relationship = "self"',
        [user.id]
      );
      
      const familyMemberId = familyMembers[0].id;
      
      // Link family member back to app_users
      await connection.execute(`
        UPDATE app_users 
        SET primary_family_member_id = ?
        WHERE id = ?
      `, [familyMemberId, user.id]);
      
      // Migrate existing preferences if any
      const [prefsUpdated] = await connection.execute(`
        UPDATE USER_PREFERENCES
        SET family_member_id = ?
        WHERE user_id = ?
      `, [familyMemberId, user.id]);
      
      console.log(`  ✅ Created family member: ${familyMemberId}`);
      console.log(`  ✅ Updated ${prefsUpdated.affectedRows} preferences\n`);
    }
    
    // Commit transaction
    await connection.commit();
    console.log('✅ Transaction committed successfully\n');
    
    // Summary
    console.log('═══════════════════════════════════════════════════════════');
    console.log('DEV SETUP SUMMARY');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`Test users with families: ${testUsers.length}`);
    console.log(`All other users:          Individual accounts (no migration needed)`);
    console.log('═══════════════════════════════════════════════════════════\n');
    
    // Verify results
    const [familyMemberCount] = await connection.execute(
      'SELECT COUNT(*) as count FROM FAMILY_MEMBERS'
    );
    const [linkedUsersCount] = await connection.execute(
      'SELECT COUNT(*) as count FROM app_users WHERE primary_family_member_id IS NOT NULL'
    );
    
    console.log('VERIFICATION:');
    console.log(`  Family members created:        ${familyMemberCount[0].count}`);
    console.log(`  Users linked to family member: ${linkedUsersCount[0].count}`);
    console.log('');
    
    console.log('✅ DEV setup completed successfully!');
    console.log('📌 Ready for Phase 2: Backend Services implementation\n');
    
  } catch (error) {
    console.error('\n❌ SETUP FAILED:', error.message);
    
    if (connection) {
      await connection.rollback();
      console.log('🔄 Transaction rolled back');
    }
    
    throw error;
    
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run setup
setupDevFamilyData()
  .then(() => {
    console.log('\n✨ All done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Setup failed:', error);
    process.exit(1);
  });
