import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  const userId = '56bc72b1-59d0-4921-b4e2-b369ca1f05f7';

  try {
    console.log(`Attempting to create default preferences for user ${userId}...`);

    let preferenceId;

    const [existingPreferences] = await conn.query(
      'SELECT id FROM USER_PREFERENCES WHERE user_id = ?',
      [userId]
    );

    if (existingPreferences.length === 0) {
      preferenceId = uuidv4();
      console.log(`Creating USER_PREFERENCES...`);
      await conn.query(`
        INSERT INTO USER_PREFERENCES (
          id, user_id,
          preference_type, max_postings,
          notification_settings, privacy_settings, interface_settings,
          is_professional, education_status
        ) VALUES (
          ?, ?,
          'both', 5,
          '{"email_notifications": true, "push_notifications": true, "frequency": "daily"}',
          '{"profile_visibility": "alumni_only", "show_email": false, "show_phone": false}',
          '{"theme": "system", "language": "en", "timezone": "UTC"}',
          FALSE, 'professional'
        )
      `, [preferenceId, userId]);
      console.log(`✅ Created USER_PREFERENCES`);
    } else {
      preferenceId = existingPreferences[0].id;
      console.log(`ℹ️  USER_PREFERENCES already exist`);
    }

    // Create USER_NOTIFICATION_PREFERENCES
    console.log(`Ensuring USER_NOTIFICATION_PREFERENCES...`);
    await conn.query(`
      INSERT INTO USER_NOTIFICATION_PREFERENCES (
        user_id, email_notifications, email_frequency, posting_updates,
        connection_requests, event_reminders, weekly_digest, push_notifications
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE user_id = VALUES(user_id)
    `, [userId, true, 'daily', true, true, true, true, false]);
    console.log(`✅ USER_NOTIFICATION_PREFERENCES ready`);

    // Create USER_PRIVACY_SETTINGS
    console.log(`Ensuring USER_PRIVACY_SETTINGS...`);
    await conn.query(`
      INSERT INTO USER_PRIVACY_SETTINGS (
        user_id, profile_visibility, show_email, show_phone, show_location,
        searchable_by_name, searchable_by_email, allow_messaging
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE user_id = VALUES(user_id)
    `, [userId, 'alumni_only', false, false, true, true, false, 'alumni_only']);
    console.log(`✅ USER_PRIVACY_SETTINGS ready`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await conn.end();
  }
}

main();
