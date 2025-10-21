/**
 * Direct Preferences Tables Creation Script
 * Creates USER_NOTIFICATION_PREFERENCES and USER_PRIVACY_SETTINGS tables
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined
};

async function createPreferencesTables() {
  let connection;
  
  try {
    console.log('🔌 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database\n');
    
    // Create USER_NOTIFICATION_PREFERENCES table
    console.log('📋 Creating USER_NOTIFICATION_PREFERENCES table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS USER_NOTIFICATION_PREFERENCES (
        user_id VARCHAR(36) PRIMARY KEY,
        email_notifications BOOLEAN DEFAULT TRUE,
        email_frequency ENUM('instant', 'daily', 'weekly') DEFAULT 'daily',
        posting_updates BOOLEAN DEFAULT TRUE,
        connection_requests BOOLEAN DEFAULT TRUE,
        event_reminders BOOLEAN DEFAULT TRUE,
        weekly_digest BOOLEAN DEFAULT TRUE,
        push_notifications BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_user_notifications (user_id),
        INDEX idx_email_frequency (email_frequency),
        INDEX idx_push_enabled (push_notifications)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ USER_NOTIFICATION_PREFERENCES table created\n');
    
    // Create USER_PRIVACY_SETTINGS table
    console.log('📋 Creating USER_PRIVACY_SETTINGS table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS USER_PRIVACY_SETTINGS (
        user_id VARCHAR(36) PRIMARY KEY,
        profile_visibility ENUM('public', 'alumni_only', 'connections_only', 'private') DEFAULT 'alumni_only',
        show_email BOOLEAN DEFAULT FALSE,
        show_phone BOOLEAN DEFAULT FALSE,
        show_location BOOLEAN DEFAULT TRUE,
        searchable_by_name BOOLEAN DEFAULT TRUE,
        searchable_by_email BOOLEAN DEFAULT FALSE,
        allow_messaging ENUM('everyone', 'alumni_only', 'connections_only') DEFAULT 'alumni_only',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_user_privacy (user_id),
        INDEX idx_profile_visibility (profile_visibility),
        INDEX idx_searchable (searchable_by_name, searchable_by_email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ USER_PRIVACY_SETTINGS table created\n');
    
    // Verify tables
    console.log('🔍 Verifying tables...');
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME IN ('USER_NOTIFICATION_PREFERENCES', 'USER_PRIVACY_SETTINGS')
    `, [dbConfig.database]);
    
    console.log('✅ Tables created:');
    tables.forEach(table => {
      console.log(`   - ${table.TABLE_NAME}`);
    });
    
    console.log('\n✅ All preferences tables created successfully!');
    
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

createPreferencesTables();

