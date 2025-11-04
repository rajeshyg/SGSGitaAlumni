import db from './config/database.js';

/**
 * Comprehensive Collation Fix
 * 
 * Fixes collation mismatches across all UUID columns to use utf8mb4_unicode_ci
 * This resolves JOIN errors between tables with different collations
 */

async function fixAllCollations() {
  try {
    console.log('\n🔧 Starting comprehensive collation fix...\n');

    const targetCollation = 'utf8mb4_unicode_ci';

    // 1. Fix FAMILY_MEMBERS table
    console.log('1. Fixing FAMILY_MEMBERS.id...');
    
    // Drop foreign key from USER_PREFERENCES first (already done, but check)
    try {
      await db.execute('ALTER TABLE USER_PREFERENCES DROP FOREIGN KEY fk_family_member_preferences');
      console.log('  ✅ Dropped fk_family_member_preferences from USER_PREFERENCES');
    } catch (error) {
      if (error.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
        console.log('  ℹ️  Foreign key already dropped');
      } else {
        throw error;
      }
    }

    // Fix FAMILY_MEMBERS.id collation
    await db.execute(`
      ALTER TABLE FAMILY_MEMBERS
      MODIFY COLUMN id CHAR(36)
      CHARACTER SET utf8mb4
      COLLATE ${targetCollation}
      NOT NULL
    `);
    console.log('  ✅ Fixed FAMILY_MEMBERS.id collation');

    // 2. Verify all collations match
    console.log('\n2. Verifying collations across tables...');
    
    const tables = ['DOMAINS', 'FAMILY_MEMBERS', 'USER_PREFERENCES'];
    let allMatch = true;

    for (const table of tables) {
      const [columns] = await db.execute(`
        SELECT COLUMN_NAME, COLLATION_NAME
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = ?
          AND DATA_TYPE = 'char'
        ORDER BY ORDINAL_POSITION
      `, [table]);
      
      console.log(`\n  ${table}:`);
      columns.forEach(col => {
        const matches = col.COLLATION_NAME === targetCollation;
        const status = matches ? '✅' : '❌';
        console.log(`    ${status} ${col.COLUMN_NAME}: ${col.COLLATION_NAME}`);
        if (!matches) allMatch = false;
      });
    }

    if (!allMatch) {
      throw new Error('Not all columns have matching collation');
    }

    // 3. Recreate foreign key constraint
    console.log('\n3. Recreating foreign key constraint...');
    await db.execute(`
      ALTER TABLE USER_PREFERENCES
      ADD CONSTRAINT fk_family_member_preferences
      FOREIGN KEY (family_member_id)
      REFERENCES FAMILY_MEMBERS(id)
      ON DELETE SET NULL
    `);
    console.log('  ✅ Recreated fk_family_member_preferences');

    // 4. Test the JOIN queries
    console.log('\n4. Testing JOIN queries...');
    
    // Test USER_PREFERENCES <-> DOMAINS join
    console.log('  Testing USER_PREFERENCES <-> DOMAINS join...');
    const [domainsJoin] = await db.execute(`
      SELECT
        up.id,
        up.user_id,
        up.primary_domain_id,
        pd.name as primary_domain_name
      FROM USER_PREFERENCES up
      LEFT JOIN DOMAINS pd ON up.primary_domain_id = pd.id
      LIMIT 1
    `);
    console.log('  ✅ DOMAINS join successful');

    // Test USER_PREFERENCES <-> FAMILY_MEMBERS join
    console.log('  Testing USER_PREFERENCES <-> FAMILY_MEMBERS join...');
    const [familyJoin] = await db.execute(`
      SELECT
        up.id,
        up.user_id,
        up.family_member_id,
        fm.name as family_member_name
      FROM USER_PREFERENCES up
      LEFT JOIN FAMILY_MEMBERS fm ON up.family_member_id = fm.id
      LIMIT 1
    `);
    console.log('  ✅ FAMILY_MEMBERS join successful');

    console.log('\n✅ All collation fixes completed successfully!');
    console.log('\n📝 Summary:');
    console.log('   - All CHAR(36) UUID columns now use utf8mb4_unicode_ci');
    console.log('   - Foreign key constraints recreated');
    console.log('   - JOIN operations verified and working');

  } catch (error) {
    console.error('\n❌ Error during collation fix:', error.message);
    console.error('Full error:', error);
    console.error('\n⚠️  Manual intervention may be required');
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

fixAllCollations();
