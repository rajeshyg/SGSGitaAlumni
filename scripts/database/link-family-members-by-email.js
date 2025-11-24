// ============================================================================
// LINK FAMILY MEMBERS BY EMAIL
// ============================================================================
// This script finds alumni members with the same email and links them as a family

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'alumni_network',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const EMAIL = 'sankarijv@gmail.com';

async function linkFamilyMembers() {
  let connection;

  try {
    console.log('🔍 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database\n');

    await connection.beginTransaction();

    // 1. Find the parent user account
    const [users] = await connection.execute(
      `SELECT id, email, first_name, last_name, primary_family_member_id
       FROM app_users
       WHERE email = ?`,
      [EMAIL]
    );

    if (users.length === 0) {
      console.log('❌ No user account found with email:', EMAIL);
      return;
    }

    const parentUser = users[0];
    console.log('📋 Found parent user:');
    console.log(`   ID: ${parentUser.id}`);
    console.log(`   Name: ${parentUser.first_name} ${parentUser.last_name}`);
    console.log(`   Primary Family Member ID: ${parentUser.primary_family_member_id}\n`);

    // 2. Find all alumni members with this email
    const [alumniMembers] = await connection.execute(
      `SELECT id, first_name, last_name, email, phone, batch, status
       FROM alumni_members
       WHERE email = ?
       ORDER BY first_name ASC`,
      [EMAIL]
    );

    console.log(`📊 Found ${alumniMembers.length} alumni member(s) with this email:\n`);
    alumniMembers.forEach((member, index) => {
      console.log(`   ${index + 1}. ${member.first_name} ${member.last_name}`);
      console.log(`      ID: ${member.id}`);
      console.log(`      Batch: ${member.batch}`);
      console.log(`      Status: ${member.status}\n`);
    });

    // 3. Find existing family members
    const [existingFamilyMembers] = await connection.execute(
      `SELECT id, first_name, last_name, relationship, alumni_member_id
       FROM FAMILY_MEMBERS
       WHERE parent_user_id = ?`,
      [parentUser.id]
    );

    console.log(`👨‍👩‍👧‍👦 Existing family members: ${existingFamilyMembers.length}\n`);
    existingFamilyMembers.forEach((member, index) => {
      console.log(`   ${index + 1}. ${member.first_name} ${member.last_name} (${member.relationship})`);
      console.log(`      Alumni Member ID: ${member.alumni_member_id || 'none'}\n`);
    });

    // 4. Determine which alumni members need to be linked
    const existingAlumniIds = new Set(
      existingFamilyMembers.map(m => m.alumni_member_id).filter(Boolean)
    );

    const membersToLink = alumniMembers.filter(
      am => !existingAlumniIds.has(am.id)
    );

    if (membersToLink.length === 0) {
      console.log('✅ All alumni members are already linked to family members!');
      await connection.commit();
      return;
    }

    console.log(`🔗 Need to create ${membersToLink.length} new family member(s):\n`);

    // 5. Create family member records for unlinked alumni
    for (const alumniMember of membersToLink) {
      const familyMemberId = uuidv4();
      const displayName = `${alumniMember.first_name} ${alumniMember.last_name}`;

      // Determine relationship (first one is 'self', others are 'child')
      const relationship = existingFamilyMembers.length === 0 ? 'self' : 'child';

      console.log(`   Creating family member: ${displayName}`);
      console.log(`   Relationship: ${relationship}`);
      console.log(`   Family Member ID: ${familyMemberId}\n`);

      await connection.execute(
        `INSERT INTO FAMILY_MEMBERS (
          id,
          parent_user_id,
          alumni_member_id,
          first_name,
          last_name,
          display_name,
          birth_date,
          age_at_registration,
          current_age,
          can_access_platform,
          requires_parent_consent,
          access_level,
          relationship,
          profile_image_url,
          status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          familyMemberId,
          parentUser.id,
          alumniMember.id,
          alumniMember.first_name,
          alumniMember.last_name,
          displayName,
          null, // birth_date unknown
          null, // age_at_registration unknown
          null, // current_age unknown
          true, // can_access_platform (assume yes for now)
          false, // requires_parent_consent
          'full', // access_level
          relationship,
          null, // profile_image_url
          'active' // status
        ]
      );

      console.log(`   ✅ Created family member record`);

      // If this is the primary member, update app_users
      if (relationship === 'self' && !parentUser.primary_family_member_id) {
        await connection.execute(
          `UPDATE app_users
           SET primary_family_member_id = ?,
               is_family_account = TRUE,
               family_account_type = 'alumni'
           WHERE id = ?`,
          [familyMemberId, parentUser.id]
        );
        console.log(`   ✅ Updated user primary_family_member_id\n`);
      } else {
        console.log('');
      }
    }

    await connection.commit();

    console.log('='.repeat(60));
    console.log('✅ Family linking completed successfully!');
    console.log('='.repeat(60));
    console.log('\n📋 Summary:');
    console.log(`   Parent User: ${parentUser.first_name} ${parentUser.last_name}`);
    console.log(`   Total Alumni Members: ${alumniMembers.length}`);
    console.log(`   Family Members Before: ${existingFamilyMembers.length}`);
    console.log(`   Family Members Created: ${membersToLink.length}`);
    console.log(`   Family Members After: ${existingFamilyMembers.length + membersToLink.length}`);
    console.log('\n✅ All family members with email', EMAIL, 'are now linked!');
    console.log('🔄 Refresh the profile selector to see all profiles.\n');

  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error('\n❌ Error during family linking:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

linkFamilyMembers().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
