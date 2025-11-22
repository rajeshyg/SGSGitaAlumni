/**
 * Clean up test data and reload with fresh data from alumni_members
 * - Keep only admin user: datta.rajesh@gmail.com
 * - Create 10 family accounts with family members
 * - Create 3-4 individual member accounts
 * - All data sourced from alumni_members table
 */

import db from './config/database.js';
import bcrypt from 'bcrypt';

async function cleanupTestData() {
  try {
    console.log('\n🧹 CLEANING UP TEST DATA\n');
    console.log('=' .repeat(80));

    // Step 1: Backup admin user
    console.log('\n1. Backing up admin user...');
    const [adminUser] = await db.execute(`
      SELECT id, email, password_hash, first_name, last_name, role
      FROM app_users
      WHERE email = 'datta.rajesh@gmail.com'
    `);

    if (adminUser.length === 0) {
      console.log('❌ Admin user datta.rajesh@gmail.com not found!');
      return;
    }

    const adminData = adminUser[0];
    console.log(`✅ Found admin: ${adminData.email} (ID: ${adminData.id})`);

    // Step 2: Clear all existing data
    console.log('\n2. Clearing existing data...');

    // Clear family members first (due to foreign key constraints)
    await db.execute('DELETE FROM FAMILY_MEMBERS');
    console.log('✅ Cleared FAMILY_MEMBERS');

    // Clear user-related tables
    await db.execute('DELETE FROM USER_INVITATIONS');
    await db.execute('DELETE FROM OTP_TOKENS');
    await db.execute('DELETE FROM USER_PREFERENCES');
    await db.execute('DELETE FROM USER_PRIVACY_SETTINGS');
    await db.execute('DELETE FROM user_profiles');
    await db.execute('DELETE FROM ACTIVITY_FEED');
    await db.execute('DELETE FROM FEED_ENGAGEMENT');
    await db.execute('DELETE FROM POSTINGS');
    await db.execute('DELETE FROM POSTING_COMMENTS');
    await db.execute('DELETE FROM POSTING_LIKES');
    console.log('✅ Cleared user-related tables');

    // Clear all app_users except admin
    await db.execute('DELETE FROM app_users WHERE email != ?', [adminData.email]);
    console.log('✅ Cleared all users except admin');

    // Step 3: Select 10 alumni for family accounts
    console.log('\n3. Selecting alumni for family accounts...');
    const [familyAlumni] = await db.execute(`
      SELECT id, first_name, last_name, email, phone, batch, center_name, student_id
      FROM alumni_members
      WHERE first_name IS NOT NULL AND last_name IS NOT NULL
      AND email IS NOT NULL AND email != ''
      ORDER BY RAND()
      LIMIT 10
    `);

    console.log(`✅ Selected ${familyAlumni.length} alumni for family accounts:`);
    familyAlumni.forEach((alum, i) => {
      console.log(`   ${i+1}. ${alum.first_name} ${alum.last_name} (${alum.email})`);
    });

    // Step 4: Select 4 alumni for individual accounts
    console.log('\n4. Selecting alumni for individual accounts...');
    const [individualAlumni] = await db.execute(`
      SELECT id, first_name, last_name, email, phone, batch, center_name, student_id
      FROM alumni_members
      WHERE first_name IS NOT NULL AND last_name IS NOT NULL
      AND email IS NOT NULL AND email != ''
      AND id NOT IN (${familyAlumni.map(a => a.id).join(',')})
      ORDER BY RAND()
      LIMIT 4
    `);

    console.log(`✅ Selected ${individualAlumni.length} alumni for individual accounts:`);
    individualAlumni.forEach((alum, i) => {
      console.log(`   ${i+1}. ${alum.first_name} ${alum.last_name} (${alum.email})`);
    });

    // Step 5: Create family accounts
    console.log('\n5. Creating family accounts...');
    const familyAccounts = [];

    for (const alum of familyAlumni) {
      // Create family account
      const familyEmail = `family.${alum.email}`;
      const hashedPassword = await bcrypt.hash('Test@123!', 10);

      const [result] = await db.execute(`
        INSERT INTO app_users (
          email, password_hash, first_name, last_name, role,
          is_family_account, family_account_type, is_active,
          alumni_member_id, status, email_verified, email_verified_at
        ) VALUES (?, ?, ?, ?, 'member', 1, 'parent', 1, ?, 'active', 1, NOW())
      `, [familyEmail, hashedPassword, alum.first_name, alum.last_name, alum.id]);

      const familyUserId = result.insertId;
      familyAccounts.push({ userId: familyUserId, alumni: alum });

      console.log(`✅ Created family account: ${familyEmail} (ID: ${familyUserId})`);

      // Create 2-4 family members for each family
      const numMembers = Math.floor(Math.random() * 3) + 2; // 2-4 members
      for (let i = 1; i <= numMembers; i++) {
        const memberFirstName = `Child${i}`;
        const memberLastName = alum.last_name;
        const birthYear = 2010 + Math.floor(Math.random() * 10); // Ages 14-23
        const currentAge = new Date().getFullYear() - birthYear;

        await db.execute(`
          INSERT INTO FAMILY_MEMBERS (
            parent_user_id, first_name, last_name, current_age,
            access_level, can_access_platform, is_primary_contact, status
          ) VALUES (?, ?, ?, ?, 'full', ?, 0, 'active')
        `, [familyUserId, memberFirstName, memberLastName, currentAge, Math.random() > 0.3]); // 70% can access
      }

      console.log(`   📝 Added ${numMembers} family members`);
    }

    // Step 6: Create individual accounts
    console.log('\n6. Creating individual accounts...');
    for (const alum of individualAlumni) {
      const hashedPassword = await bcrypt.hash('Test@123!', 10);

      const [result] = await db.execute(`
        INSERT INTO app_users (
          email, password_hash, first_name, last_name, role,
          is_family_account, is_active, alumni_member_id, status,
          email_verified, email_verified_at
        ) VALUES (?, ?, ?, ?, 'member', 0, 1, ?, 'active', 1, NOW())
      `, [alum.email, hashedPassword, alum.first_name, alum.last_name, alum.id]);

      console.log(`✅ Created individual account: ${alum.email} (ID: ${result.insertId})`);
    }

    // Step 7: Create user profiles and preferences for all new users
    console.log('\n7. Creating user profiles and preferences...');

    // Get all newly created users
    const [newUsers] = await db.execute(`
      SELECT id, email, first_name, last_name, alumni_member_id
      FROM app_users
      WHERE email != ?
    `, [adminData.email]);

    for (const user of newUsers) {
      // Create user profile
      await db.execute(`
        INSERT INTO user_profiles (
          user_id, first_name, last_name, phone, bio, created_at, updated_at
        ) VALUES (?, ?, ?, ?, 'Test user profile', NOW(), NOW())
      `, [user.id, user.first_name, user.last_name, '555-0100']);

      // Create user preferences
      await db.execute(`
        INSERT INTO USER_PREFERENCES (
          id, user_id, notification_settings, privacy_settings, interface_settings, created_at, updated_at
        ) VALUES (UUID(), ?, ?, ?, ?, NOW(), NOW())
      `, [
        user.id,
        JSON.stringify({ email_notifications: true, push_notifications: true, frequency: 'daily' }),
        JSON.stringify({ profile_visibility: 'alumni_only', show_email: false, show_phone: false }),
        JSON.stringify({ theme: 'system', language: 'en', timezone: 'UTC' })
      ]);

      // Create privacy settings
      await db.execute(`
        INSERT INTO USER_PRIVACY_SETTINGS (
          user_id, profile_visibility, show_email, show_phone, searchable_by_email,
          allow_messaging, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, [user.id, 'alumni_only', false, false, true, 'alumni_only']);
    }

    console.log(`✅ Created profiles and preferences for ${newUsers.length} users`);

    // Step 8: Final verification
    console.log('\n8. Final verification...');
    const [finalUsers] = await db.execute(`
      SELECT
        COUNT(*) as total_users,
        SUM(CASE WHEN is_family_account = 1 THEN 1 ELSE 0 END) as family_accounts,
        SUM(CASE WHEN is_family_account = 0 AND role != 'admin' THEN 1 ELSE 0 END) as individual_accounts
      FROM app_users
    `);

    const [finalFamilies] = await db.execute(`
      SELECT COUNT(*) as total_family_members
      FROM FAMILY_MEMBERS
    `);

    console.log('\n📊 FINAL DATABASE STATE:');
    console.log(`   👑 Admin users: 1 (datta.rajesh@gmail.com)`);
    console.log(`   👨‍👩‍👧‍👦 Family accounts: ${finalUsers[0].family_accounts}`);
    console.log(`   👤 Individual accounts: ${finalUsers[0].individual_accounts}`);
    console.log(`   👶 Family members: ${finalFamilies[0].total_family_members}`);
    console.log(`   📧 Total users: ${finalUsers[0].total_users}`);

    console.log('\n🎯 TEST LOGIN CREDENTIALS:');
    console.log(`   Admin: datta.rajesh@gmail.com / Admin@123!`);
    console.log(`   All others: [their email] / Test@123!`);

    console.log('\n✅ CLEANUP COMPLETE!');

  } catch (error) {
    console.error('❌ Error during cleanup:', error.message);
    console.error(error.stack);
  } finally {
    process.exit(0);
  }
}

cleanupTestData();