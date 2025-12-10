import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  console.log('=== Switching Preferences FK to user_profiles ===\n');

  try {
    console.log('1. Disabling FK checks...');
    await conn.query('SET FOREIGN_KEY_CHECKS = 0');

    console.log('2. Dropping existing FK constraints (if they exist)...');
    
    const tables = [
      { name: 'USER_PREFERENCES', fk: 'fk_user_preferences_account' },
      { name: 'USER_NOTIFICATION_PREFERENCES', fk: 'fk_user_notification_preferences_account' },
      { name: 'USER_PRIVACY_SETTINGS', fk: 'fk_user_privacy_settings_account' },
      // Also try dropping the old 'user' FKs just in case
      { name: 'USER_PREFERENCES', fk: 'fk_user_preferences_user' }
    ];

    for (const { name, fk } of tables) {
      try {
        await conn.query(`ALTER TABLE ${name} DROP FOREIGN KEY ${fk}`);
        console.log(`   ✅ Dropped ${fk} from ${name}`);
      } catch (e) {
        console.log(`   ℹ️  Could not drop ${fk} from ${name} (might not exist)`);
      }
    }

    console.log('3. Truncating tables to remove invalid references...');
    await conn.query('TRUNCATE TABLE USER_PREFERENCES');
    await conn.query('TRUNCATE TABLE USER_NOTIFICATION_PREFERENCES');
    await conn.query('TRUNCATE TABLE USER_PRIVACY_SETTINGS');
    console.log('   ✅ Tables truncated');

    console.log('4. Adding new FK constraints to user_profiles...');
    
    try {
      await conn.query(`
        ALTER TABLE USER_PREFERENCES
        ADD CONSTRAINT fk_user_preferences_profile 
        FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE
      `);
      console.log('   ✅ Added fk_user_preferences_profile');
    } catch (e) {
      console.error('   ❌ Failed to add fk_user_preferences_profile:', e.message);
    }

    try {
      await conn.query(`
        ALTER TABLE USER_NOTIFICATION_PREFERENCES
        ADD CONSTRAINT fk_user_notification_preferences_profile 
        FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE
      `);
      console.log('   ✅ Added fk_user_notification_preferences_profile');
    } catch (e) {
      console.error('   ❌ Failed to add fk_user_notification_preferences_profile:', e.message);
    }

    try {
      await conn.query(`
        ALTER TABLE USER_PRIVACY_SETTINGS
        ADD CONSTRAINT fk_user_privacy_settings_profile 
        FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE
      `);
      console.log('   ✅ Added fk_user_privacy_settings_profile');
    } catch (e) {
      console.error('   ❌ Failed to add fk_user_privacy_settings_profile:', e.message);
    }

    console.log('5. Re-enabling FK checks...');
    await conn.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log('\nVerifying FK constraints...');
    const [constraints] = await conn.query(`
      SELECT 
          TABLE_NAME, 
          CONSTRAINT_NAME, 
          COLUMN_NAME, 
          REFERENCED_TABLE_NAME, 
          REFERENCED_COLUMN_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
      WHERE TABLE_NAME IN ('USER_PREFERENCES', 'USER_NOTIFICATION_PREFERENCES', 'USER_PRIVACY_SETTINGS')
      AND REFERENCED_TABLE_NAME IS NOT NULL
    `);

    console.table(constraints);

  } catch (error) {
    console.error('❌ Error executing migration:', error);
  } finally {
    await conn.end();
  }
}

main();
