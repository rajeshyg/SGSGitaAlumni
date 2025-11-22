import db from './config/database.js';

async function showTables() {
  try {
    const [tables] = await db.execute('SHOW TABLES');
    console.log('\n📋 Tables in database:');
    tables.forEach(t => {
      const tableName = Object.values(t)[0];
      console.log(`  - ${tableName}`);
    });
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    process.exit(0);
  }
}

showTables();
