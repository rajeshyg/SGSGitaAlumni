/**
 * Check current APP_USERS and FAMILY_MEMBERS data
 * to identify what to keep for testing
 */

import db from './config/database.js';

async function checkCurrentData() {
  try {
    console.log('\n📊 CHECKING CURRENT DATABASE STATE\n');
    console.log('=' .repeat(80));

    // Check APP_USERS
    console.log('\n👥 app_users TABLE:');
    console.log('-'.repeat(80));
    const [users] = await db.execute(`
      SELECT 
        id, 
        email, 
        role, 
        is_family_account,
        family_account_type,
        is_active,
        first_name,
        last_name
      FROM app_users 
      ORDER BY 
        CASE 
          WHEN role = 'admin' THEN 1 
          WHEN role = 'moderator' THEN 2 
          ELSE 3 
        END,
        is_family_account DESC,
        email
      LIMIT 30
    `);

    console.log(`\nTotal users found: ${users.length}\n`);
    
    let adminCount = 0;
    let familyCount = 0;
    let individualCount = 0;

    users.forEach(user => {
      const familyFlag = user.is_family_account ? '👨‍👩‍👧‍👦' : '👤';
      const activeFlag = user.is_active ? '✅' : '❌';
      const roleIcon = user.role === 'admin' ? '👑' : user.role === 'moderator' ? '⚖️' : '📝';
      
      console.log(`${familyFlag} ${roleIcon} ${activeFlag} [${user.id}] ${user.email}`);
      console.log(`   Role: ${user.role} | Family: ${user.is_family_account || 0} | Type: ${user.family_account_type || 'N/A'}`);
      console.log(`   Name: ${user.first_name || 'N/A'} ${user.last_name || 'N/A'}`);
      console.log('');

      if (user.role === 'admin') adminCount++;
      if (user.is_family_account) familyCount++;
      else individualCount++;
    });

    console.log(`\nSummary: ${adminCount} admin(s), ${familyCount} family account(s), ${individualCount} individual(s)`);

    // Check FAMILY_MEMBERS
    console.log('\n' + '='.repeat(80));
    console.log('\n👨‍👩‍👧 FAMILY_MEMBERS TABLE:');
    console.log('-'.repeat(80));
    
    const [familyMembers] = await db.execute(`
      SELECT 
        fm.id,
        fm.parent_user_id,
        au.email as parent_email,
        fm.first_name,
        fm.last_name,
        fm.current_age,
        fm.access_level,
        fm.can_access_platform,
        fm.is_primary_contact,
        fm.status
      FROM FAMILY_MEMBERS fm
      LEFT JOIN app_users au ON fm.parent_user_id = au.id
      ORDER BY fm.parent_user_id, fm.is_primary_contact DESC, fm.id
      LIMIT 50
    `);

    if (familyMembers.length === 0) {
      console.log('\n⚠️  No family members found in database\n');
    } else {
      console.log(`\nTotal family members found: ${familyMembers.length}\n`);
      
      let currentParent = null;
      familyMembers.forEach(member => {
        if (currentParent !== member.parent_user_id) {
          currentParent = member.parent_user_id;
          console.log(`\n📧 Parent User: ${member.parent_email} (ID: ${member.parent_user_id})`);
          console.log('-'.repeat(60));
        }
        
        const accessIcon = member.can_access_platform ? '✅' : '🚫';
        const primaryIcon = member.is_primary_contact ? '⭐' : '  ';
        
        console.log(`  ${primaryIcon} ${accessIcon} ${member.first_name} ${member.last_name} (Age: ${member.current_age || 'N/A'})`);
        console.log(`     Access: ${member.access_level} | Status: ${member.status}`);
      });
    }

    // Get family account statistics
    console.log('\n' + '='.repeat(80));
    console.log('\n📈 STATISTICS:');
    console.log('-'.repeat(80));
    
    const [stats] = await db.execute(`
      SELECT 
        au.email,
        au.is_family_account,
        COUNT(fm.id) as member_count,
        SUM(CASE WHEN fm.can_access_platform = 1 THEN 1 ELSE 0 END) as accessible_members
      FROM app_users au
      LEFT JOIN FAMILY_MEMBERS fm ON au.id = fm.parent_user_id
      WHERE au.is_family_account = 1
      GROUP BY au.id, au.email
      ORDER BY member_count DESC
    `);

    if (stats.length > 0) {
      console.log('\nFamily Accounts with Members:');
      stats.forEach(stat => {
        console.log(`  ${stat.email}: ${stat.member_count} members (${stat.accessible_members} accessible)`);
      });
    } else {
      console.log('\n⚠️  No family accounts with members found');
    }

    console.log('\n' + '='.repeat(80));
    console.log('\n💡 RECOMMENDATIONS FOR TEST DATA:');
    console.log('-'.repeat(80));
    console.log(`
1. Keep Admin: datta.rajesh@gmail.com (if exists)
2. Keep 2-3 family accounts with the most family members
3. Keep 3-4 individual member accounts
4. Total: ~20-30 records max (users + family members)
    `);

    // Show recommended accounts to keep
    console.log('\n🎯 RECOMMENDED ACCOUNTS TO KEEP:\n');
    
    const adminUser = users.find(u => u.email === 'datta.rajesh@gmail.com' || u.role === 'admin');
    if (adminUser) {
      console.log(`✅ Admin: ${adminUser.email}`);
    } else {
      console.log(`⚠️  Admin account datta.rajesh@gmail.com not found`);
    }

    const familyAccounts = users.filter(u => u.is_family_account).slice(0, 3);
    console.log(`\n✅ Family Accounts (${familyAccounts.length}):`);
    familyAccounts.forEach(u => console.log(`   - ${u.email}`));

    const individualAccounts = users.filter(u => !u.is_family_account && u.role !== 'admin').slice(0, 4);
    console.log(`\n✅ Individual Accounts (${individualAccounts.length}):`);
    individualAccounts.forEach(u => console.log(`   - ${u.email}`));

    console.log('\n' + '='.repeat(80));

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
}

checkCurrentData();
