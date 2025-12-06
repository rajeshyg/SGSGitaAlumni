// ============================================================================
// LINK FAMILY MEMBERS FOR USER
// ============================================================================
// This script finds all alumni members with the same email as an existing user
// and creates FAMILY_MEMBERS records for any that are missing.
// 
// Usage: node scripts/database/link-family-members-for-user.js <email>
// Example: node scripts/database/link-family-members-for-user.js kishoredola9@gmail.com

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '..', '.env') });

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

// Get email from command line argument or use default
const EMAIL = process.argv[2] || 'kishoredola9@gmail.com';

/**
 * Calculate age and COPPA access fields based on birth date or batch (graduation year)
 */
function calculateAgeAndAccess(alumniMember) {
  let birthDate = alumniMember.birth_date || null;
  let currentAge = null;
  let canAccess = true;
  let requiresConsent = false;
  let accessLevel = 'full';

  if (birthDate) {
    // Calculate age from actual birth date
    const today = new Date();
    const birth = new Date(birthDate);
    currentAge = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      currentAge--;
    }
    birthDate = birth.toISOString().split('T')[0];
  } else if (alumniMember.batch) {
    // Fallback: estimate from batch/graduation year (typical age 22 at graduation)
    const estimatedBirthYear = alumniMember.batch - 22;
    currentAge = new Date().getFullYear() - estimatedBirthYear;
    birthDate = `${estimatedBirthYear}-01-01`;
  }

  // COPPA compliance: determine access level based on age
  if (currentAge !== null) {
    if (currentAge < 14) {
      canAccess = false;
      accessLevel = 'blocked';
    } else if (currentAge < 18) {
      requiresConsent = true;
      accessLevel = 'supervised';
      canAccess = false; // Needs parent consent first
    }
  }

  return { birthDate, currentAge, canAccess, requiresConsent, accessLevel };
}

async function linkFamilyMembers() {
  let connection;

  try {
    connection = await mysql.createConnection(dbConfig);

    await connection.beginTransaction();

    const [users] = await connection.execute(
      `SELECT id, email, first_name, last_name, primary_family_member_id, alumni_member_id
       FROM app_users
       WHERE email = ?`,
      [EMAIL]
    );

    if (users.length === 0) {
      await connection.end();
      return null;
    }

    const parentUser = users[0];

    // 2. Find all alumni members with this email
    // Note: The actual schema uses 'batch' for graduation year, 'result' for degree, 'center_name' for program
    const [alumniMembers] = await connection.execute(
      `SELECT id, first_name, last_name, email, phone, batch, status, birth_date,
              result, center_name
       FROM alumni_members
       WHERE email = ?
       ORDER BY first_name ASC`,
      [EMAIL]
    );

    console.log(`📊 Found ${alumniMembers.length} alumni member(s) with this email:\n`);
    alumniMembers.forEach((member, index) => {
      const ageInfo = calculateAgeAndAccess(member);
      console.log(`   ${index + 1}. ${member.first_name} ${member.last_name}`);
      console.log(`      ID: ${member.id}`);
      console.log(`      Batch: ${member.batch || 'N/A'}`);
      console.log(`      Birth Date: ${member.birth_date || 'N/A'}`);
      console.log(`      Estimated Age: ${ageInfo.currentAge || 'N/A'}`);
      console.log(`      Access Level: ${ageInfo.accessLevel}\n`);
    });

    // 3. Find existing family members
    const [existingFamilyMembers] = await connection.execute(
      `SELECT id, first_name, last_name, relationship, alumni_member_id, is_primary_contact
       FROM FAMILY_MEMBERS
       WHERE parent_user_id = ?`,
      [parentUser.id]
    );

    console.log(`👨‍👩‍👧‍👦 Existing family members: ${existingFamilyMembers.length}\n`);
    existingFamilyMembers.forEach((member, index) => {
      console.log(`   ${index + 1}. ${member.first_name} ${member.last_name} (${member.relationship})`);
      console.log(`      Alumni Member ID: ${member.alumni_member_id || 'none'}`);
      console.log(`      Primary: ${member.is_primary_contact ? 'Yes' : 'No'}\n`);
    });

    // 4. Determine which alumni members need to be linked
    // Check by alumni_member_id AND by name to avoid duplicates
    const existingAlumniIds = new Set(
      existingFamilyMembers.map(m => m.alumni_member_id).filter(Boolean)
    );
    const existingNames = new Set(
      existingFamilyMembers.map(m => `${m.first_name} ${m.last_name}`.toLowerCase())
    );

    const membersToLink = alumniMembers.filter(am => {
      const alreadyLinkedById = existingAlumniIds.has(am.id);
      const alreadyExistsByName = existingNames.has(`${am.first_name} ${am.last_name}`.toLowerCase());
      
      if (alreadyLinkedById) {
        console.log(`   ⏭️  Skipping ${am.first_name} ${am.last_name} - already linked by alumni_member_id`);
        return false;
      }
      if (alreadyExistsByName) {
        // Check if we should update the existing record with alumni_member_id instead
        const existingMember = existingFamilyMembers.find(
          m => `${m.first_name} ${m.last_name}`.toLowerCase() === `${am.first_name} ${am.last_name}`.toLowerCase()
        );
        if (existingMember && !existingMember.alumni_member_id) {
          console.log(`   🔗 Found existing ${am.first_name} ${am.last_name} without alumni_member_id - will link to ${am.id}`);
          // Mark for linking (not creating)
          am._existingFamilyMemberId = existingMember.id;
          return true; // Include but will update instead of insert
        }
        console.log(`   ⏭️  Skipping ${am.first_name} ${am.last_name} - already exists by name`);
        return false;
      }
      return true;
    });

    if (membersToLink.length === 0) {
      console.log('✅ All alumni members are already linked to family members!');
      await connection.commit();
      return;
    }

    console.log(`\n🔗 Need to process ${membersToLink.length} alumni member(s):\n`);

    // Check if we have a primary member already
    const hasPrimary = existingFamilyMembers.some(m => m.is_primary_contact);

    // 5. Create or update family member records
    for (let i = 0; i < membersToLink.length; i++) {
      const alumniMember = membersToLink[i];
      const displayName = `${alumniMember.first_name} ${alumniMember.last_name}`;
      const ageInfo = calculateAgeAndAccess(alumniMember);

      // If this alumni has an existing family member to link to, update instead of insert
      if (alumniMember._existingFamilyMemberId) {
        console.log(`   Linking existing ${displayName} to alumni_member_id ${alumniMember.id}...`);
        await connection.execute(
          `UPDATE FAMILY_MEMBERS SET alumni_member_id = ? WHERE id = ?`,
          [alumniMember.id, alumniMember._existingFamilyMemberId]
        );
        console.log(`   ✅ Linked existing family member to alumni record\n`);
        continue;
      }

      const familyMemberId = uuidv4();

      // Determine relationship
      // If user's alumni_member_id matches this one, it's 'self'
      // If no primary member exists and this is first one, make it 'self' and primary
      // Otherwise, use 'family_member'
      let relationship = 'family_member';
      let isPrimary = false;

      if (alumniMember.id === parentUser.alumni_member_id) {
        relationship = 'self';
        isPrimary = !hasPrimary;
      } else if (!hasPrimary && i === 0 && existingFamilyMembers.length === 0) {
        relationship = 'self';
        isPrimary = true;
      }

      console.log(`   Creating family member: ${displayName}`);
      console.log(`   Relationship: ${relationship}`);
      console.log(`   Primary: ${isPrimary}`);
      console.log(`   Access Level: ${ageInfo.accessLevel}`);
      console.log(`   Family Member ID: ${familyMemberId}\n`);

      // Create alumni data snapshot
      const alumniSnapshot = JSON.stringify({
        alumniId: alumniMember.id,
        data: {
          id: alumniMember.id,
          firstName: alumniMember.first_name,
          lastName: alumniMember.last_name,
          email: alumniMember.email,
          phone: alumniMember.phone,
          graduationYear: alumniMember.batch,
          program: alumniMember.center_name,
          degree: alumniMember.result
        },
        capturedAt: new Date().toISOString()
      });

      await connection.execute(
        `INSERT INTO FAMILY_MEMBERS (
          id, parent_user_id, alumni_member_id, first_name, last_name, display_name,
          birth_date, current_age, can_access_platform, requires_parent_consent,
          parent_consent_given, access_level, relationship, is_primary_contact, status,
          graduation_year, program, alumni_data_snapshot, phone,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          familyMemberId,
          parentUser.id,
          alumniMember.id,
          alumniMember.first_name,
          alumniMember.last_name,
          displayName,
          ageInfo.birthDate,
          ageInfo.currentAge,
          ageInfo.canAccess ? 1 : 0,
          ageInfo.requiresConsent ? 1 : 0,
          0, // parent_consent_given
          ageInfo.accessLevel,
          relationship,
          isPrimary ? 1 : 0,
          ageInfo.canAccess ? 'active' : (ageInfo.requiresConsent ? 'pending_consent' : 'blocked'),
          alumniMember.batch || null,
          alumniMember.center_name || null,
          alumniSnapshot,
          alumniMember.phone || null
        ]
      );

      console.log(`   ✅ Created family member record`);

      // If this should be the primary member and user doesn't have one, update app_users
      if (isPrimary && !parentUser.primary_family_member_id) {
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
    console.log(`   Email: ${EMAIL}`);
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
