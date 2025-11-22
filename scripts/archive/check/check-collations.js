import db from './config/database.js';

async function checkCollations() {
  try {
    console.log('\n🔍 Checking collations across related tables...\n');

    const tables = ['DOMAINS', 'FAMILY_MEMBERS', 'USER_PREFERENCES'];

    for (const table of tables) {
      console.log(`\n${table}:`);
      const [columns] = await db.execute(`
        SELECT COLUMN_NAME, DATA_TYPE, COLLATION_NAME
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = ?
          AND COLUMN_NAME IN ('id', 'family_member_id', 'primary_domain_id', 'parent_domain_id')
        ORDER BY ORDINAL_POSITION
      `, [table]);
      
      columns.forEach(col => {
        console.log(`  - ${col.COLUMN_NAME} (${col.DATA_TYPE}): ${col.COLLATION_NAME || 'N/A'}`);
      });
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
}

checkCollations();
