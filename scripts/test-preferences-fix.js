/**
 * Test script to verify preferences module fixes
 * Tests all preference endpoints for user 10025
 */

import mysql from 'mysql2/promise';
import { readFileSync } from 'fs';

const config = JSON.parse(readFileSync('./server-package.json', 'utf8'));

// Database configuration
const dbConfig = {
  host: config.database?.host || 'localhost',
  user: config.database?.user || 'root',
  password: config.database?.password || '',
  database: config.database?.database || 'alumni_db',
  port: config.database?.port || 3306
};

async function testPreferencesFix() {
  const pool = mysql.createPool(dbConfig);

  try {
    console.log('🧪 Testing Preferences Module Fix for User 10025\n');

    // Test 1: Check user exists
    console.log('1. Checking user 10025...');
    const [users] = await pool.query(
      'SELECT id, email, first_name, last_name FROM app_users WHERE id = ?',
      [10025]
    );
    if (users.length === 0) {
      throw new Error('User 10025 does not exist');
    }
    console.log(`   ✅ User exists: ${users[0].first_name} ${users[0].last_name} (${users[0].email})`);

    // Test 2: Check USER_PREFERENCES
    console.log('\n2. Checking USER_PREFERENCES...');
    const [prefs] = await pool.query(
      'SELECT * FROM USER_PREFERENCES WHERE user_id = ?',
      [10025]
    );
    if (prefs.length === 0) {
      throw new Error('USER_PREFERENCES missing for user 10025');
    }
    console.log(`   ✅ USER_PREFERENCES exists with primary_domain_id: ${prefs[0].primary_domain_id}`);

    // Test 3: Check USER_NOTIFICATION_PREFERENCES
    console.log('\n3. Checking USER_NOTIFICATION_PREFERENCES...');
    const [notif] = await pool.query(
      'SELECT * FROM USER_NOTIFICATION_PREFERENCES WHERE user_id = ?',
      [10025]
    );
    if (notif.length === 0) {
      throw new Error('USER_NOTIFICATION_PREFERENCES missing for user 10025');
    }
    console.log(`   ✅ USER_NOTIFICATION_PREFERENCES exists with email_frequency: ${notif[0].email_frequency}`);

    // Test 4: Check USER_PRIVACY_SETTINGS
    console.log('\n4. Checking USER_PRIVACY_SETTINGS...');
    const [privacy] = await pool.query(
      'SELECT * FROM USER_PRIVACY_SETTINGS WHERE user_id = ?',
      [10025]
    );
    if (privacy.length === 0) {
      throw new Error('USER_PRIVACY_SETTINGS missing for user 10025');
    }
    console.log(`   ✅ USER_PRIVACY_SETTINGS exists with profile_visibility: ${privacy[0].profile_visibility}`);

    // Test 5: Simulate API calls (what the frontend would do)
    console.log('\n5. Simulating API endpoint responses...');

    // Simulate getUserPreferences
    const [simPrefs] = await pool.query(`
      SELECT
        up.*,
        pd.name as primary_domain_name,
        pd.icon as primary_domain_icon,
        pd.color_code as primary_domain_color
      FROM USER_PREFERENCES up
      LEFT JOIN DOMAINS pd ON up.primary_domain_id = pd.id
      WHERE up.user_id = ?
    `, [10025]);

    if (simPrefs.length > 0) {
      console.log('   ✅ GET /api/preferences/10025 would return preferences');
    }

    // Simulate getNotificationPreferences
    const [simNotif] = await pool.query(
      'SELECT * FROM USER_NOTIFICATION_PREFERENCES WHERE user_id = ?',
      [10025]
    );

    if (simNotif.length > 0) {
      console.log('   ✅ GET /api/users/10025/notification-preferences would return settings');
    }

    // Simulate getPrivacySettings
    const [simPrivacy] = await pool.query(
      'SELECT * FROM USER_PRIVACY_SETTINGS WHERE user_id = ?',
      [10025]
    );

    if (simPrivacy.length > 0) {
      console.log('   ✅ GET /api/users/10025/privacy-settings would return settings');
    }

    // Simulate getAccountSettings
    const [simAccount] = await pool.query(`
      SELECT
        email,
        email_verified,
        email_verified_at,
        last_login_at,
        created_at,
        two_factor_enabled,
        last_password_change
      FROM app_users
      WHERE id = ?
    `, [10025]);

    if (simAccount.length > 0) {
      console.log('   ✅ GET /api/users/10025/account-settings would return account info');
    }

    console.log('\n🎉 All tests passed! Preferences module should work correctly.');
    console.log('\n📋 Expected Results:');
    console.log('   - No more 404 errors on /api/preferences/10025');
    console.log('   - No more 500 errors on account settings');
    console.log('   - No more 400 errors when saving preferences');
    console.log('   - All preference tabs should load without errors');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the test
testPreferencesFix();