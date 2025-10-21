/**
 * Populate Preferences for User 10026
 * Creates test preference data for the current logged-in user
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined
};

async function populateUserPreferences() {
  let connection;
  
  try {
    console.log('🔌 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database\n');
    
    const userId = '10026';
    
    // ========================================================================
    // STEP 1: Verify User Exists and Update Name if Needed
    // ========================================================================
    console.log('📋 Step 1: Verifying user 10026...');
    
    const [users] = await connection.query(`
      SELECT id, email, first_name, last_name, role
      FROM app_users
      WHERE id = ?
    `, [userId]);
    
    if (users.length === 0) {
      console.error('❌ User 10026 not found!');
      process.exit(1);
    }
    
    const user = users[0];
    console.log('✅ User found:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.first_name} ${user.last_name}`);
    console.log(`   Role: ${user.role}\n`);
    
    // Update user name if null
    if (!user.first_name || user.first_name === 'null') {
      console.log('⚠️  Updating user name...');
      await connection.query(`
        UPDATE app_users
        SET first_name = 'Test', last_name = 'Alumni'
        WHERE id = ?
      `, [userId]);
      console.log('✅ User name updated to: Test Alumni\n');
    }
    
    // ========================================================================
    // STEP 2: Get Available Domains
    // ========================================================================
    console.log('📋 Step 2: Fetching available domains...');
    
    const [primaryDomains] = await connection.query(`
      SELECT id, name, domain_level
      FROM DOMAINS
      WHERE domain_level = 'primary' AND is_active = TRUE
      ORDER BY display_order, name
      LIMIT 1
    `);
    
    if (primaryDomains.length === 0) {
      console.error('❌ No primary domains found!');
      console.log('Please ensure DOMAINS table has data.');
      process.exit(1);
    }
    
    const primaryDomain = primaryDomains[0];
    console.log(`✅ Primary domain: ${primaryDomain.name} (ID: ${primaryDomain.id})\n`);
    
    // Get secondary domains for this primary
    const [secondaryDomains] = await connection.query(`
      SELECT id, name, parent_domain_id
      FROM DOMAINS
      WHERE domain_level = 'secondary' 
        AND parent_domain_id = ?
        AND is_active = TRUE
      ORDER BY display_order, name
      LIMIT 2
    `, [primaryDomain.id]);
    
    console.log(`✅ Found ${secondaryDomains.length} secondary domains`);
    secondaryDomains.forEach(d => {
      console.log(`   - ${d.name} (ID: ${d.id})`);
    });
    console.log('');
    
    const secondaryIds = secondaryDomains.map(d => d.id);
    
    // Get areas of interest
    let areaIds = [];
    if (secondaryIds.length > 0) {
      const [areas] = await connection.query(`
        SELECT id, name, parent_domain_id
        FROM DOMAINS
        WHERE domain_level = 'area_of_interest'
          AND parent_domain_id IN (?)
          AND is_active = TRUE
        ORDER BY display_order, name
        LIMIT 5
      `, [secondaryIds]);
      
      areaIds = areas.map(a => a.id);
      console.log(`✅ Found ${areas.length} areas of interest`);
      areas.forEach(a => {
        console.log(`   - ${a.name} (ID: ${a.id})`);
      });
      console.log('');
    }
    
    // ========================================================================
    // STEP 3: Create USER_PREFERENCES
    // ========================================================================
    console.log('📋 Step 3: Creating user preferences...');
    
    // Check if preferences already exist
    const [existingPrefs] = await connection.query(`
      SELECT id FROM USER_PREFERENCES WHERE user_id = ?
    `, [userId]);
    
    if (existingPrefs.length > 0) {
      console.log('⚠️  User preferences already exist, updating...');
      await connection.query(`
        UPDATE USER_PREFERENCES
        SET
          primary_domain_id = ?,
          secondary_domain_ids = ?,
          areas_of_interest_ids = ?,
          preference_type = 'both',
          max_postings = 5,
          updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
      `, [
        primaryDomain.id,
        JSON.stringify(secondaryIds),
        JSON.stringify(areaIds),
        userId
      ]);
      console.log('✅ User preferences updated\n');
    } else {
      const prefId = uuidv4();
      await connection.query(`
        INSERT INTO USER_PREFERENCES (
          id, user_id, primary_domain_id, secondary_domain_ids, areas_of_interest_ids,
          preference_type, max_postings, notification_settings, privacy_settings,
          interface_settings, is_professional, education_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        prefId,
        userId,
        primaryDomain.id,
        JSON.stringify(secondaryIds),
        JSON.stringify(areaIds),
        'both',
        5,
        JSON.stringify({ email_notifications: true, push_notifications: true, frequency: 'daily' }),
        JSON.stringify({ profile_visibility: 'alumni_only', show_email: false, show_phone: false }),
        JSON.stringify({ theme: 'system', language: 'en', timezone: 'UTC' }),
        false,
        'professional'
      ]);
      console.log('✅ User preferences created\n');
    }
    
    // ========================================================================
    // STEP 4: Create USER_NOTIFICATION_PREFERENCES
    // ========================================================================
    console.log('📋 Step 4: Creating notification preferences...');
    
    const [existingNotif] = await connection.query(`
      SELECT user_id FROM USER_NOTIFICATION_PREFERENCES WHERE user_id = ?
    `, [userId]);
    
    if (existingNotif.length > 0) {
      console.log('⚠️  Notification preferences already exist, skipping...\n');
    } else {
      await connection.query(`
        INSERT INTO USER_NOTIFICATION_PREFERENCES (
          user_id, email_notifications, email_frequency, posting_updates,
          connection_requests, event_reminders, weekly_digest, push_notifications
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [userId, true, 'daily', true, true, true, true, false]);
      console.log('✅ Notification preferences created\n');
    }
    
    // ========================================================================
    // STEP 5: Create USER_PRIVACY_SETTINGS
    // ========================================================================
    console.log('📋 Step 5: Creating privacy settings...');
    
    const [existingPrivacy] = await connection.query(`
      SELECT user_id FROM USER_PRIVACY_SETTINGS WHERE user_id = ?
    `, [userId]);
    
    if (existingPrivacy.length > 0) {
      console.log('⚠️  Privacy settings already exist, skipping...\n');
    } else {
      await connection.query(`
        INSERT INTO USER_PRIVACY_SETTINGS (
          user_id, profile_visibility, show_email, show_phone, show_location,
          searchable_by_name, searchable_by_email, allow_messaging
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [userId, 'alumni_only', false, false, true, true, false, 'alumni_only']);
      console.log('✅ Privacy settings created\n');
    }
    
    // ========================================================================
    // STEP 6: Verify All Data
    // ========================================================================
    console.log('📋 Step 6: Verifying all preferences...');
    
    const [finalPrefs] = await connection.query(`
      SELECT * FROM USER_PREFERENCES WHERE user_id = ?
    `, [userId]);
    
    const [finalNotif] = await connection.query(`
      SELECT * FROM USER_NOTIFICATION_PREFERENCES WHERE user_id = ?
    `, [userId]);
    
    const [finalPrivacy] = await connection.query(`
      SELECT * FROM USER_PRIVACY_SETTINGS WHERE user_id = ?
    `, [userId]);
    
    console.log('✅ Verification complete:');
    console.log(`   - User Preferences: ${finalPrefs.length > 0 ? 'EXISTS' : 'MISSING'}`);
    console.log(`   - Notification Preferences: ${finalNotif.length > 0 ? 'EXISTS' : 'MISSING'}`);
    console.log(`   - Privacy Settings: ${finalPrivacy.length > 0 ? 'EXISTS' : 'MISSING'}\n`);
    
    if (finalPrefs.length > 0) {
      console.log('📊 User Preferences Summary:');
      console.log(`   Primary Domain: ${primaryDomain.name}`);
      console.log(`   Secondary Domains: ${secondaryIds.length} selected`);
      console.log(`   Areas of Interest: ${areaIds.length} selected`);
      console.log(`   Preference Type: ${finalPrefs[0].preference_type}`);
      console.log(`   Max Postings: ${finalPrefs[0].max_postings}\n`);
    }
    
    console.log('✅ All preferences populated successfully!');
    console.log('\n🎉 User 10026 is ready to use the preferences module!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

populateUserPreferences();

