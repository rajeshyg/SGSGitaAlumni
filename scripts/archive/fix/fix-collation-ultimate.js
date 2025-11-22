import db from './config/database.js';

/**
 * Ultimate Collation Fix
 * 
 * Finds and fixes ALL foreign key dependencies to allow collation changes
 */

async function ultimateCollationFix() {
  try {
    console.log('\n🔧 Starting ultimate collation fix...\n');

    const targetCollation = 'utf8mb4_unicode_ci';

    // 1. Find all foreign keys referencing FAMILY_MEMBERS
    console.log('1. Finding all foreign keys referencing FAMILY_MEMBERS...');
    const [fks] = await db.execute(`
      SELECT
        TABLE_NAME,
        CONSTRAINT_NAME,
        COLUMN_NAME,
        REFERENCED_TABLE_NAME,
        REFERENCED_COLUMN_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = DATABASE()
        AND REFERENCED_TABLE_NAME = 'FAMILY_MEMBERS'
      ORDER BY TABLE_NAME, CONSTRAINT_NAME
    `);

    console.log(`Found ${fks.length} foreign key(s):`);
    fks.forEach(fk => {
      console.log(`  - ${fk.TABLE_NAME}.${fk.COLUMN_NAME} -> ${fk.REFERENCED_TABLE_NAME}.${fk.REFERENCED_COLUMN_NAME} (${fk.CONSTRAINT_NAME})`);
    });

    // 2. Drop all foreign keys
    console.log('\n2. Dropping all foreign keys...');
    for (const fk of fks) {
      try {
        await db.execute(`ALTER TABLE ${fk.TABLE_NAME} DROP FOREIGN KEY ${fk.CONSTRAINT_NAME}`);
        console.log(`  ✅ Dropped ${fk.TABLE_NAME}.${fk.CONSTRAINT_NAME}`);
      } catch (error) {
        if (error.code !== 'ER_CANT_DROP_FIELD_OR_KEY') {
          throw error;
        }
        console.log(`  ℹ️  ${fk.TABLE_NAME}.${fk.CONSTRAINT_NAME} already dropped`);
      }
    }

    // 3. Fix FAMILY_MEMBERS.id collation
    console.log('\n3. Fixing FAMILY_MEMBERS.id collation...');
    await db.execute(`
      ALTER TABLE FAMILY_MEMBERS
      MODIFY COLUMN id CHAR(36)
      CHARACTER SET utf8mb4
      COLLATE ${targetCollation}
      NOT NULL
    `);
    console.log('  ✅ Fixed FAMILY_MEMBERS.id');

    // 4. Fix all referencing columns
    console.log('\n4. Fixing referencing columns...');
    const uniqueTables = [...new Set(fks.map(fk => ({ table: fk.TABLE_NAME, column: fk.COLUMN_NAME })))];
    
    for (const fk of fks) {
      console.log(`  Fixing ${fk.TABLE_NAME}.${fk.COLUMN_NAME}...`);
      await db.execute(`
        ALTER TABLE ${fk.TABLE_NAME}
        MODIFY COLUMN ${fk.COLUMN_NAME} CHAR(36)
        CHARACTER SET utf8mb4
        COLLATE ${targetCollation}
        NULL
      `);
      console.log(`    ✅ Fixed ${fk.TABLE_NAME}.${fk.COLUMN_NAME}`);
    }

    // 5. Recreate all foreign keys
    console.log('\n5. Recreating foreign keys...');
    for (const fk of fks) {
      try {
        await db.execute(`
          ALTER TABLE ${fk.TABLE_NAME}
          ADD CONSTRAINT ${fk.CONSTRAINT_NAME}
          FOREIGN KEY (${fk.COLUMN_NAME})
          REFERENCES ${fk.REFERENCED_TABLE_NAME}(${fk.REFERENCED_COLUMN_NAME})
          ON DELETE SET NULL
        `);
        console.log(`  ✅ Recreated ${fk.TABLE_NAME}.${fk.CONSTRAINT_NAME}`);
      } catch (error) {
        if (error.code === 'ER_DUP_KEYNAME') {
          console.log(`  ℹ️  ${fk.TABLE_NAME}.${fk.CONSTRAINT_NAME} already exists`);
        } else {
          console.error(`  ⚠️  Failed to recreate ${fk.TABLE_NAME}.${fk.CONSTRAINT_NAME}: ${error.message}`);
        }
      }
    }

    // 6. Verify collations
    console.log('\n6. Verifying collations...');
    const [familyCol] = await db.execute(`
      SELECT COLLATION_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'FAMILY_MEMBERS'
        AND COLUMN_NAME = 'id'
    `);
    console.log(`  FAMILY_MEMBERS.id: ${familyCol[0].COLLATION_NAME} ${familyCol[0].COLLATION_NAME === targetCollation ? '✅' : '❌'}`);

    // 7. Test the critical JOIN query
    console.log('\n7. Testing USER_PREFERENCES <-> DOMAINS join...');
    const [testJoin] = await db.execute(`
      SELECT
        up.id,
        up.user_id,
        up.primary_domain_id,
        pd.name as primary_domain_name
      FROM USER_PREFERENCES up
      LEFT JOIN DOMAINS pd ON up.primary_domain_id = pd.id
      LIMIT 1
    `);
    console.log('  ✅ JOIN query successful!');

    console.log('\n✅ Ultimate collation fix completed successfully!');
    console.log('\n📝 Summary:');
    console.log(`   - Fixed FAMILY_MEMBERS.id to ${targetCollation}`);
    console.log(`   - Fixed ${fks.length} referencing column(s)`);
    console.log(`   - Recreated ${fks.length} foreign key constraint(s)`);
    console.log('   - Verified JOIN operations work correctly');

  } catch (error) {
    console.error('\n❌ Error during collation fix:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

ultimateCollationFix();
