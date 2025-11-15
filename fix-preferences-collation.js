import db from './config/database.js';

/**
 * Fix collation mismatch in USER_PREFERENCES table
 * 
 * Issue: USER_PREFERENCES.primary_domain_id has utf8mb4_0900_ai_ci collation
 *        DOMAINS.id has utf8mb4_unicode_ci collation
 *        This causes JOIN operations to fail with collation mismatch error
 * 
 * Solution: Align all char(36) UUID columns to use utf8mb4_unicode_ci
 */

async function fixCollation() {
  try {
    console.log('\n🔧 Starting collation fix for USER_PREFERENCES table...\n');

    // 1. Check current collation
    console.log('1. Checking current collation of columns...');
    const [columns] = await db.execute(`
      SELECT COLUMN_NAME, COLLATION_NAME, DATA_TYPE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'USER_PREFERENCES'
        AND DATA_TYPE = 'char'
    `);
    
    console.log('Current char columns:');
    columns.forEach(col => {
      console.log(`  - ${col.COLUMN_NAME}: ${col.COLLATION_NAME}`);
    });

    // 2. Check DOMAINS table collation for comparison
    console.log('\n2. Checking DOMAINS.id collation...');
    const [domainsCol] = await db.execute(`
      SELECT COLUMN_NAME, COLLATION_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'DOMAINS'
        AND COLUMN_NAME = 'id'
    `);
    
    console.log(`DOMAINS.id collation: ${domainsCol[0].COLLATION_NAME}`);

    const targetCollation = domainsCol[0].COLLATION_NAME;

    // 3. Drop foreign key constraints temporarily
    console.log('\n3. Dropping foreign key constraints...');
    try {
      await db.execute('ALTER TABLE USER_PREFERENCES DROP FOREIGN KEY fk_family_member_preferences');
      console.log('  ✅ Dropped fk_family_member_preferences');
    } catch (error) {
      if (error.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
        console.log('  ℹ️  Foreign key fk_family_member_preferences does not exist');
      } else {
        throw error;
      }
    }

    // 4. Fix USER_PREFERENCES columns
    console.log(`\n4. Fixing USER_PREFERENCES columns to use ${targetCollation}...`);
    
    const columnsToFix = [
      'id',
      'family_member_id',
      'primary_domain_id'
    ];

    for (const columnName of columnsToFix) {
      console.log(`  - Fixing ${columnName}...`);
      await db.execute(`
        ALTER TABLE USER_PREFERENCES
        MODIFY COLUMN ${columnName} CHAR(36)
        CHARACTER SET utf8mb4
        COLLATE ${targetCollation}
        ${columnName === 'id' ? 'NOT NULL' : 'NULL'}
      `);
      console.log(`    ✅ ${columnName} fixed`);
    }

    // 5. Recreate foreign key constraints
    console.log('\n5. Recreating foreign key constraints...');
    try {
      await db.execute(`
        ALTER TABLE USER_PREFERENCES
        ADD CONSTRAINT fk_family_member_preferences
        FOREIGN KEY (family_member_id)
        REFERENCES FAMILY_MEMBERS(id)
        ON DELETE SET NULL
      `);
      console.log('  ✅ Recreated fk_family_member_preferences');
    } catch (error) {
      if (error.code === 'ER_DUP_KEYNAME') {
        console.log('  ℹ️  Foreign key already exists');
      } else {
        throw error;
      }
    }

    // 6. Verify the fix
    console.log('\n6. Verifying collation fix...');
    const [fixedColumns] = await db.execute(`
      SELECT COLUMN_NAME, COLLATION_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'USER_PREFERENCES'
        AND DATA_TYPE = 'char'
      ORDER BY ORDINAL_POSITION
    `);
    
    console.log('Fixed columns:');
    fixedColumns.forEach(col => {
      const status = col.COLLATION_NAME === targetCollation ? '✅' : '❌';
      console.log(`  ${status} ${col.COLUMN_NAME}: ${col.COLLATION_NAME}`);
    });

    // 7. Test the JOIN query
    console.log('\n7. Testing JOIN query...');
    const [testResult] = await db.execute(`
      SELECT
        up.id,
        up.user_id,
        up.primary_domain_id,
        pd.name as primary_domain_name
      FROM USER_PREFERENCES up
      LEFT JOIN DOMAINS pd ON up.primary_domain_id = pd.id
      LIMIT 1
    `);
    
    console.log('✅ JOIN query successful!');
    if (testResult.length > 0) {
      console.log('Sample result:', testResult[0]);
    }

    console.log('\n✅ Collation fix completed successfully!');
    console.log('\n📝 Summary:');
    console.log(`   - Fixed ${columnsToFix.length} columns in USER_PREFERENCES`);
    console.log(`   - All char(36) columns now use ${targetCollation}`);
    console.log('   - JOIN operations with DOMAINS table now work correctly');

  } catch (error) {
    console.error('\n❌ Error during collation fix:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

fixCollation();
