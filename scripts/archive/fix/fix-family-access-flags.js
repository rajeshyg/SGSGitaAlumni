import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function fixFamilyAccessFlags() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });
  
  console.log('🔍 Checking for family members with consent but no platform access...\n');
  
  // Find members with parent_consent_given = 1 but can_access_platform = 0
  const [inconsistentMembers] = await connection.execute(`
    SELECT 
      fm.id, 
      fm.first_name, 
      fm.last_name, 
      fm.can_access_platform, 
      fm.parent_consent_given, 
      fm.status,
      au.email
    FROM FAMILY_MEMBERS fm
    JOIN app_users au ON fm.parent_user_id = au.id
    WHERE fm.parent_consent_given = 1 
      AND fm.can_access_platform = 0
  `);
  
  if (inconsistentMembers.length === 0) {
    console.log('✅ No inconsistencies found! All members are correctly configured.');
    await connection.end();
    return;
  }
  
  console.log(`⚠️  Found ${inconsistentMembers.length} member(s) with consent but no platform access:\n`);
  inconsistentMembers.forEach(member => {
    console.log(`  - ${member.first_name} ${member.last_name} (${member.email})`);
    console.log(`    Status: ${member.status}, Consent: ${member.parent_consent_given}, Access: ${member.can_access_platform}`);
  });
  
  console.log('\n🔧 Fixing inconsistencies...');
  
  const [result] = await connection.execute(`
    UPDATE FAMILY_MEMBERS
    SET can_access_platform = 1
    WHERE parent_consent_given = 1 
      AND can_access_platform = 0
  `);
  
  console.log(`✅ Fixed ${result.affectedRows} member(s)`);
  
  // Verify the fix
  console.log('\n📋 Verification - All family members:');
  const [allMembers] = await connection.execute(`
    SELECT 
      fm.first_name, 
      fm.last_name, 
      fm.can_access_platform, 
      fm.parent_consent_given,
      fm.requires_parent_consent,
      fm.status,
      fm.current_age,
      au.email
    FROM FAMILY_MEMBERS fm
    JOIN app_users au ON fm.parent_user_id = au.id
    ORDER BY au.email, fm.first_name
  `);
  
  let currentEmail = '';
  allMembers.forEach(member => {
    if (member.email !== currentEmail) {
      console.log(`\n${member.email}:`);
      currentEmail = member.email;
    }
    const accessIcon = member.can_access_platform ? '✅' : '❌';
    const consentStatus = member.requires_parent_consent 
      ? (member.parent_consent_given ? '[Consent ✓]' : '[Consent ✗]')
      : '[No consent needed]';
    console.log(`  ${accessIcon} ${member.first_name} ${member.last_name} (age ${member.current_age}) - ${member.status} ${consentStatus}`);
  });
  
  await connection.end();
  console.log('\n✅ All done!');
}

fixFamilyAccessFlags().catch(console.error);
