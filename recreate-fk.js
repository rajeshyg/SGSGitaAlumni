import db from './config/database.js';

async function recreateFK() {
  try {
    await db.execute(`
      ALTER TABLE USER_PREFERENCES
      ADD CONSTRAINT fk_family_member_preferences
      FOREIGN KEY (family_member_id)
      REFERENCES FAMILY_MEMBERS(id)
      ON DELETE SET NULL
    `);
    console.log('✅ Foreign key fk_family_member_preferences recreated');
  } catch (error) {
    if (error.code === 'ER_DUP_KEYNAME') {
      console.log('✅ Foreign key already exists');
    } else {
      throw error;
    }
  } finally {
    process.exit(0);
  }
}

recreateFK();
