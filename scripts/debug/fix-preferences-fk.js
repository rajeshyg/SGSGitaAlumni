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

  console.log('=== Fixing USER_PREFERENCES FK Constraint ===\n');

  try {
    console.log('1. Disabling FK checks...');
    await conn.query('SET FOREIGN_KEY_CHECKS = 0');

    console.log('2. Fixing collation on notification/privacy tables...');
    await conn.query('ALTER TABLE USER_NOTIFICATION_PREFERENCES CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci');
    console.log('   ✅ Converted USER_NOTIFICATION_PREFERENCES to utf8mb4_0900_ai_ci');
    await conn.query('ALTER TABLE USER_PRIVACY_SETTINGS CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci');
    console.log('   ✅ Converted USER_PRIVACY_SETTINGS to utf8mb4_0900_ai_ci');

    console.log('3. Dropping broken FK constraint to app_users...');
    try {
      await conn.query('ALTER TABLE USER_PREFERENCES DROP FOREIGN KEY fk_user_preferences_user');
      console.log('   ✅ Dropped fk_user_preferences_user');
    } catch (e) {
      console.log(`   ⚠️  FK constraint may not exist: ${e.message}`);
    }
    
    // Also drop the new account FK if it exists (so we can re-add it cleanly)
    try {
      await conn.query('ALTER TABLE USER_PREFERENCES DROP FOREIGN KEY fk_user_preferences_account');
      console.log('   ✅ Dropped fk_user_preferences_account');
    } catch (e) {
      console.log(`   ⚠️  FK constraint may not exist: ${e.message}`);
    }

    console.log('4. Dropping potential broken FKs on notification/privacy tables...');
    for (const table of ['USER_NOTIFICATION_PREFERENCES', 'USER_PRIVACY_SETTINGS']) {
      try {
        const [fks] = await conn.query(`
          SELECT CONSTRAINT_NAME 
          FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
          WHERE TABLE_NAME = ? AND REFERENCED_TABLE_NAME IS NOT NULL
        `, [table]);
        for (const fk of fks) {
          try {
            await conn.query(`ALTER TABLE ${table} DROP FOREIGN KEY ${fk.CONSTRAINT_NAME}`);
            console.log(`   ✅ Dropped ${fk.CONSTRAINT_NAME} from ${table}`);
          } catch (e) {
            console.log(`   ⚠️  Could not drop ${fk.CONSTRAINT_NAME}: ${e.message}`);
          }
        }
      } catch (e) {
        console.log(`   ⚠️  Error checking ${table}: ${e.message}`);
      }
    }

    console.log('5. Adding correct FK constraints to accounts table...');
    
    // USER_PREFERENCES
    try {
      await conn.query(`
        ALTER TABLE USER_PREFERENCES
        ADD CONSTRAINT fk_user_preferences_account 
        FOREIGN KEY (user_id) REFERENCES accounts(id) ON DELETE CASCADE
      `);
      console.log('   ✅ Added fk_user_preferences_account');
    } catch (e) {
      if (e.code === 'ER_DUP_KEY' || e.message.includes('Duplicate')) {
        console.log('   ⚠️  fk_user_preferences_account already exists');
      } else {
        console.log(`   ❌ Failed to add FK: ${e.message}`);
      }
    }

    // USER_NOTIFICATION_PREFERENCES
    try {
      await conn.query(`
        ALTER TABLE USER_NOTIFICATION_PREFERENCES
        ADD CONSTRAINT fk_user_notification_preferences_account 
        FOREIGN KEY (user_id) REFERENCES accounts(id) ON DELETE CASCADE
      `);
      console.log('   ✅ Added fk_user_notification_preferences_account');
    } catch (e) {
      if (e.code === 'ER_DUP_KEY' || e.message.includes('Duplicate')) {
        console.log('   ⚠️  fk_user_notification_preferences_account already exists');
      } else {
        console.log(`   ❌ Failed to add FK: ${e.message}`);
      }
    }

    // USER_PRIVACY_SETTINGS
    try {
      await conn.query(`
        ALTER TABLE USER_PRIVACY_SETTINGS
        ADD CONSTRAINT fk_user_privacy_settings_account 
        FOREIGN KEY (user_id) REFERENCES accounts(id) ON DELETE CASCADE
      `);
      console.log('   ✅ Added fk_user_privacy_settings_account');
    } catch (e) {
      if (e.code === 'ER_DUP_KEY' || e.message.includes('Duplicate')) {
        console.log('   ⚠️  fk_user_privacy_settings_account already exists');
      } else {
        console.log(`   ❌ Failed to add FK: ${e.message}`);
      }
    }

    console.log('6. Re-enabling FK checks...');
    await conn.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log('\n=== Verifying FK Constraints ===');
    const [fks] = await conn.query(`
      SELECT TABLE_NAME, CONSTRAINT_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
      WHERE TABLE_NAME IN ('USER_PREFERENCES', 'USER_NOTIFICATION_PREFERENCES', 'USER_PRIVACY_SETTINGS')
      AND REFERENCED_TABLE_NAME IS NOT NULL
    `);
    fks.forEach(fk => console.log(`  ${fk.TABLE_NAME}.${fk.COLUMN_NAME} -> ${fk.REFERENCED_TABLE_NAME} (${fk.CONSTRAINT_NAME})`));

    console.log('\n✅ Migration complete!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await conn.end();
  }
}

main().catch(console.error);
