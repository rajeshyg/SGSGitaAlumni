// Migrate test accounts to family accounts with multiple members
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

async function migrateToFamilyAccounts() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'sgsgitaalumni'
  });

  try {
    console.log('\n=== Migrating Test Accounts to Family Accounts ===\n');

    // Test families configuration
    const families = [
      {
        email: 'jayanthi236@gmail.com',
        members: [
          { firstName: 'Jayanthi', lastName: 'Reddy', relationship: 'self', age: 42, isPrimary: 1 },
          { firstName: 'Ravi', lastName: 'Reddy', relationship: 'spouse', age: 45, isPrimary: 0 },
          { firstName: 'Priya', lastName: 'Reddy', relationship: 'child', age: 15, isPrimary: 0 },
          { firstName: 'Arjun', lastName: 'Reddy', relationship: 'child', age: 12, isPrimary: 0 }
        ]
      },
      {
        email: 'saikveni6@gmail.com',
        members: [
          { firstName: 'Sai', lastName: 'Kveni', relationship: 'self', age: 38, isPrimary: 1 },
          { firstName: 'Lakshmi', lastName: 'Kveni', relationship: 'spouse', age: 36, isPrimary: 0 },
          { firstName: 'Krishna', lastName: 'Kveni', relationship: 'child', age: 10, isPrimary: 0 }
        ]
      },
      {
        email: 'gangadherade@gmail.com',
        members: [
          { firstName: 'Gangadhar', lastName: 'Ade', relationship: 'self', age: 50, isPrimary: 1 },
          { firstName: 'Sarita', lastName: 'Ade', relationship: 'spouse', age: 48, isPrimary: 0 },
          { firstName: 'Vikram', lastName: 'Ade', relationship: 'child', age: 20, isPrimary: 0 },
          { firstName: 'Neha', lastName: 'Ade', relationship: 'child', age: 18, isPrimary: 0 }
        ]
      },
      {
        email: 'srinidhi.anand@yahoo.com',
        members: [
          { firstName: 'Srinidhi', lastName: 'Anand', relationship: 'self', age: 35, isPrimary: 1 },
          { firstName: 'Aditya', lastName: 'Anand', relationship: 'child', age: 8, isPrimary: 0 }
        ]
      }
    ];

    for (const family of families) {
      console.log(`\n📧 Processing ${family.email}...`);

      // Get user ID
      const [users] = await connection.execute(
        'SELECT id, first_name, last_name FROM app_users WHERE email = ?',
        [family.email]
      );

      if (users.length === 0) {
        console.log(`   ❌ User not found, skipping`);
        continue;
      }

      const user = users[0];
      const userId = user.id;
      console.log(`   ✅ Found user ID: ${userId}`);

      // Update user to be a family account
      await connection.execute(
        `UPDATE app_users 
         SET is_family_account = 1, 
             family_account_type = 'parent',
             updated_at = NOW()
         WHERE id = ?`,
        [userId]
      );
      console.log(`   ✅ Updated is_family_account = 1, family_account_type = 'parent'`);

      // Check if family members already exist
      const [existingMembers] = await connection.execute(
        'SELECT COUNT(*) as count FROM FAMILY_MEMBERS WHERE parent_user_id = ?',
        [userId]
      );

      if (existingMembers[0].count > 0) {
        console.log(`   ⚠️  Found ${existingMembers[0].count} existing family members, deleting...`);
        await connection.execute(
          'DELETE FROM FAMILY_MEMBERS WHERE parent_user_id = ?',
          [userId]
        );
      }

      // Create family members
      let primaryMemberId = null;
      for (const member of family.members) {
        const memberId = uuidv4();
        
        // Determine access level and consent requirements
        const canAccess = member.age >= 13 ? 1 : 0;
        const requiresConsent = member.age < 18 ? 1 : 0;
        const consentGiven = requiresConsent ? 1 : 0; // Auto-approve for testing
        const accessLevel = member.age >= 13 ? 'full' : 'supervised';

        await connection.execute(
          `INSERT INTO FAMILY_MEMBERS (
            id, parent_user_id, first_name, last_name, display_name,
            current_age, can_access_platform, requires_parent_consent,
            parent_consent_given, parent_consent_date, access_level,
            relationship, is_primary_contact, status, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            memberId,
            userId,
            member.firstName,
            member.lastName,
            `${member.firstName} ${member.lastName}`,
            member.age,
            canAccess,
            requiresConsent,
            consentGiven,
            consentGiven ? new Date() : null,
            accessLevel,
            member.relationship,
            member.isPrimary,
            'active'
          ]
        );

        if (member.isPrimary) {
          primaryMemberId = memberId;
        }

        console.log(`   👤 Added: ${member.firstName} ${member.lastName} (${member.relationship}, age ${member.age}, access: ${accessLevel})`);
      }

      // Update primary_family_member_id
      if (primaryMemberId) {
        await connection.execute(
          'UPDATE app_users SET primary_family_member_id = ? WHERE id = ?',
          [primaryMemberId, userId]
        );
        console.log(`   🔗 Set primary_family_member_id: ${primaryMemberId}`);
      }

      console.log(`   ✅ Successfully migrated ${family.email} with ${family.members.length} members`);
    }

    console.log('\n=== Migration Summary ===\n');

    // Show summary
    for (const family of families) {
      const [users] = await connection.execute(
        `SELECT id, email, is_family_account, family_account_type, primary_family_member_id
         FROM app_users WHERE email = ?`,
        [family.email]
      );

      if (users.length > 0) {
        const user = users[0];
        const [members] = await connection.execute(
          `SELECT first_name, last_name, relationship, current_age, access_level, is_primary_contact
           FROM FAMILY_MEMBERS WHERE parent_user_id = ? ORDER BY is_primary_contact DESC, current_age DESC`,
          [user.id]
        );

        console.log(`\n📧 ${family.email}:`);
        console.log(`   User ID: ${user.id}`);
        console.log(`   is_family_account: ${user.is_family_account}`);
        console.log(`   family_account_type: ${user.family_account_type}`);
        console.log(`   primary_family_member_id: ${user.primary_family_member_id}`);
        console.log(`   Family Members (${members.length}):`);
        members.forEach(m => {
          const primaryFlag = m.is_primary_contact ? '⭐' : '  ';
          console.log(`   ${primaryFlag} ${m.first_name} ${m.last_name} (${m.relationship}, age ${m.current_age}, ${m.access_level})`);
        });
      }
    }

    console.log('\n✅ Migration completed successfully!\n');

  } catch (error) {
    console.error('\n❌ Migration error:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

migrateToFamilyAccounts();
