import db from './config/database.js';

async function debugPreferences() {
  try {
    const userId = 8;
    
    console.log(`\n🔍 Debugging preferences for userId: ${userId}`);
    
    // Check if USER_PREFERENCES table exists
    console.log('\n1. Checking USER_PREFERENCES table structure...');
    const [tableInfo] = await db.execute('DESCRIBE USER_PREFERENCES');
    console.log('Table structure:');
    tableInfo.forEach(col => {
      console.log(`  - ${col.Field} (${col.Type})`);
    });
    
    // Check if user exists in app_users
    console.log(`\n2. Checking if user ${userId} exists in app_users...`);
    const [users] = await db.execute('SELECT id, email FROM app_users WHERE id = ?', [userId]);
    if (users.length === 0) {
      console.log('❌ User not found!');
      process.exit(1);
    }
    console.log('✅ User found:', users[0]);
    
    // Try to fetch preferences
    console.log(`\n3. Fetching preferences for userId ${userId}...`);
    const [preferences] = await db.execute(`
      SELECT
        up.*,
        pd.name as primary_domain_name,
        pd.icon as primary_domain_icon,
        pd.color_code as primary_domain_color
      FROM USER_PREFERENCES up
      LEFT JOIN DOMAINS pd ON up.primary_domain_id = pd.id
      WHERE up.user_id = ?
    `, [userId]);
    
    if (preferences.length === 0) {
      console.log('⚠️  No preferences found for user');
    } else {
      console.log('✅ Preferences found:');
      console.log(JSON.stringify(preferences[0], null, 2));
    }
    
    // Check if DOMAINS table exists and has data
    console.log('\n4. Checking DOMAINS table...');
    const [domains] = await db.execute('SELECT COUNT(*) as count FROM DOMAINS');
    console.log(`✅ DOMAINS table has ${domains[0].count} records`);
    
    // Check notification preferences
    console.log('\n5. Checking USER_NOTIFICATION_PREFERENCES...');
    const [notifPrefs] = await db.execute('SELECT * FROM USER_NOTIFICATION_PREFERENCES WHERE user_id = ?', [userId]);
    if (notifPrefs.length === 0) {
      console.log('⚠️  No notification preferences found');
    } else {
      console.log('✅ Notification preferences exist');
    }
    
    // Check privacy settings
    console.log('\n6. Checking USER_PRIVACY_SETTINGS...');
    const [privacySettings] = await db.execute('SELECT * FROM USER_PRIVACY_SETTINGS WHERE user_id = ?', [userId]);
    if (privacySettings.length === 0) {
      console.log('⚠️  No privacy settings found');
    } else {
      console.log('✅ Privacy settings exist');
    }
    
    console.log('\n✅ Debug complete!');
  } catch (error) {
    console.error('\n❌ Error during debug:', error.message);
    console.error('Full error:', error);
  } finally {
    process.exit(0);
  }
}

debugPreferences();
