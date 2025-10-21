/**
 * Check preferences data for user 10025
 * Diagnostic script for preferences persistence investigation
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const DB_CONFIG = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT || '3306'),
  connectTimeout: 60000,
};

async function checkPreferences() {
  let connection;

  try {
    console.log('🔍 Connecting to database...');
    connection = await mysql.createConnection(DB_CONFIG);
    console.log('✅ Connected successfully\n');

    const userId = '10025';

    // Check USER_PREFERENCES
    console.log('=== USER_PREFERENCES ===');
    const [userPrefs] = await connection.execute(
      'SELECT * FROM USER_PREFERENCES WHERE user_id = ?',
      [userId]
    );
    
    if (userPrefs.length === 0) {
      console.log('❌ No records found for user_id:', userId);
    } else {
      console.log('✅ Found', userPrefs.length, 'record(s)');
      console.log(JSON.stringify(userPrefs[0], null, 2));
    }

    // Check USER_NOTIFICATION_PREFERENCES
    console.log('\n=== USER_NOTIFICATION_PREFERENCES ===');
    const [notifPrefs] = await connection.execute(
      'SELECT * FROM USER_NOTIFICATION_PREFERENCES WHERE user_id = ?',
      [userId]
    );
    
    if (notifPrefs.length === 0) {
      console.log('❌ No records found for user_id:', userId);
    } else {
      console.log('✅ Found', notifPrefs.length, 'record(s)');
      console.log(JSON.stringify(notifPrefs[0], null, 2));
    }

    // Check USER_PRIVACY_SETTINGS
    console.log('\n=== USER_PRIVACY_SETTINGS ===');
    const [privacySettings] = await connection.execute(
      'SELECT * FROM USER_PRIVACY_SETTINGS WHERE user_id = ?',
      [userId]
    );
    
    if (privacySettings.length === 0) {
      console.log('❌ No records found for user_id:', userId);
    } else {
      console.log('✅ Found', privacySettings.length, 'record(s)');
      console.log(JSON.stringify(privacySettings[0], null, 2));
    }

    // Check if user exists in app_users
    console.log('\n=== APP_USERS ===');
    const [appUsers] = await connection.execute(
      'SELECT id, email, first_name, last_name, is_active FROM app_users WHERE id = ?',
      [userId]
    );
    
    if (appUsers.length === 0) {
      console.log('❌ No user found with id:', userId);
    } else {
      console.log('✅ User exists:');
      console.log(JSON.stringify(appUsers[0], null, 2));
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

checkPreferences();

