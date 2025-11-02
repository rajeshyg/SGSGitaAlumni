/**
 * FAMILY MEMBER SYSTEM - DATA MIGRATION SCRIPT
 * 
 * Purpose: Migrate existing app_users to family member system
 * Strategy: Create one family member profile per existing user (as "self")
 * 
 * This migration:
 * 1. Marks all app_users as individual (non-family) accounts initially
 * 2. Creates a FAMILY_MEMBERS record for each user (relationship = 'self')
 * 3. Links the family member back to the user's app_users.primary_family_member_id
 * 4. Migrates existing USER_PREFERENCES to link to the family member
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'sgsgita_alumni',
  port: process.env.DB_PORT || 3306
};

async function migrateUsersToFamilySystem() {
  let connection;
  
  try {
    console.log('🚀 Starting migration to Family Member System...\n');
    
    // Connect to database
    connection = await mysql.createConnection(DB_CONFIG);
    console.log('✅ Connected to database:', DB_CONFIG.database);
    
    // Start transaction for data integrity
    await connection.beginTransaction();
    console.log('📝 Transaction started\n');
    
    // Step 1: Get all existing users
    const [users] = await connection.execute(
      'SELECT id, email, first_name, last_name FROM app_users ORDER BY id'
    );
    console.log(`📊 Found ${users.length} existing users to migrate\n`);
    
    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    
    // Step 2: Process each user
    for (const user of users) {
      try {
        console.log(`Processing user ${user.id}: ${user.email}...`);
        
        // Update app_users table
        await connection.execute(`
          UPDATE app_users 
          SET is_family_account = FALSE,
              family_account_type = 'individual'
          WHERE id = ?
        `, [user.id]);
        
        // Create family member record (self)
        const [result] = await connection.execute(`
          INSERT INTO FAMILY_MEMBERS (
            parent_user_id,
            alumni_member_id,
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
          ) VALUES (?, NULL, ?, ?, ?, 'self', TRUE, TRUE, FALSE, FALSE, 'full', 'active')
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
        
        if (familyMembers.length === 0) {
          throw new Error('Failed to create family member record');
        }
        
        const familyMemberId = familyMembers[0].id;
        
        // Link family member back to app_users
        await connection.execute(`
          UPDATE app_users 
          SET primary_family_member_id = ?
          WHERE id = ?
        `, [familyMemberId, user.id]);
        
        // Migrate existing preferences
        await connection.execute(`
          UPDATE USER_PREFERENCES
          SET family_member_id = ?
          WHERE user_id = ?
        `, [familyMemberId, user.id]);
        
        console.log(`  ✅ Created family member: ${familyMemberId}`);
        successCount++;
        
      } catch (error) {
        console.error(`  ❌ Error processing user ${user.id}:`, error.message);
        errorCount++;
        errors.push({ userId: user.id, email: user.email, error: error.message });
      }
    }
    
    // Commit transaction
    await connection.commit();
    console.log('\n✅ Transaction committed successfully\n');
    
    // Summary
    console.log('═══════════════════════════════════════════════════════════');
    console.log('MIGRATION SUMMARY');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`Total Users:     ${users.length}`);
    console.log(`✅ Successful:   ${successCount}`);
    console.log(`❌ Failed:       ${errorCount}`);
    console.log('═══════════════════════════════════════════════════════════\n');
    
    if (errors.length > 0) {
      console.log('ERRORS:');
      errors.forEach(err => {
        console.log(`  User ${err.userId} (${err.email}): ${err.error}`);
      });
      console.log('');
    }
    
    // Verify results
    const [familyMemberCount] = await connection.execute(
      'SELECT COUNT(*) as count FROM FAMILY_MEMBERS WHERE relationship = "self"'
    );
    const [linkedUsersCount] = await connection.execute(
      'SELECT COUNT(*) as count FROM app_users WHERE primary_family_member_id IS NOT NULL'
    );
    const [migratedPrefsCount] = await connection.execute(
      'SELECT COUNT(*) as count FROM USER_PREFERENCES WHERE family_member_id IS NOT NULL'
    );
    
    console.log('VERIFICATION:');
    console.log(`  Family members created:        ${familyMemberCount[0].count}`);
    console.log(`  Users linked to family member: ${linkedUsersCount[0].count}`);
    console.log(`  Preferences migrated:          ${migratedPrefsCount[0].count}`);
    console.log('');
    
    console.log('✅ Migration completed successfully!');
    console.log('📌 Next step: Users can now add additional family members through the UI\n');
    
  } catch (error) {
    console.error('\n❌ MIGRATION FAILED:', error.message);
    
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

// Run migration
migrateUsersToFamilySystem()
  .then(() => {
    console.log('\n✨ All done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Migration failed:', error);
    process.exit(1);
  });
