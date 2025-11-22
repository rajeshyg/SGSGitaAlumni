import db from './config/database.js';

async function checkInvitationsSchema() {
  try {
    const [columns] = await db.execute('DESCRIBE USER_INVITATIONS');
    console.log('USER_INVITATIONS table structure:');
    columns.forEach(col => {
      console.log(`  ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    process.exit(0);
  }
}

checkInvitationsSchema();