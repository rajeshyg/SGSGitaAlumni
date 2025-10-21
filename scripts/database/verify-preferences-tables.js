/**
 * Verify Preferences Tables
 * Checks if USER_PREFERENCES, USER_NOTIFICATION_PREFERENCES, USER_PRIVACY_SETTINGS tables exist
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

async function verifyPreferencesTables() {
  let connection;
  
  try {
    console.log('🔌 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database\n');
    
    // Check for preferences tables
    console.log('📋 Checking preferences tables...');
    
    const [tables] = await connection.query(`
      SELECT TABLE_NAME, TABLE_ROWS
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME IN (
        'USER_PREFERENCES',
        'USER_NOTIFICATION_PREFERENCES', 
        'USER_PRIVACY_SETTINGS'
      )
    `, [process.env.DB_NAME]);
    
    const tableNames = tables.map(t => t.TABLE_NAME);
    
    console.log('Found tables:');
    tables.forEach(table => {
      console.log(`  ✅ ${table.TABLE_NAME} (${table.TABLE_ROWS} rows)`);
    });
    console.log('');
    
    // Check for missing tables
    const requiredTables = ['USER_PREFERENCES', 'USER_NOTIFICATION_PREFERENCES', 'USER_PRIVACY_SETTINGS'];
    const missingTables = requiredTables.filter(t => !tableNames.includes(t));
    
    if (missingTables.length > 0) {
      console.log('❌ Missing tables:');
      missingTables.forEach(table => {
        console.log(`  - ${table}`);
      });
      console.log('\nRun: node scripts/database/run-task-7-migrations.js\n');
      process.exit(1);
    }
    
    // Check table structures
    console.log('📋 Verifying table structures...\n');
    
    // USER_PREFERENCES structure
    console.log('USER_PREFERENCES columns:');
    const [prefColumns] = await connection.query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'USER_PREFERENCES'
      ORDER BY ORDINAL_POSITION
    `, [process.env.DB_NAME]);
    
    prefColumns.forEach(col => {
      console.log(`  - ${col.COLUMN_NAME} (${col.DATA_TYPE})`);
    });
    console.log('');
    
    // USER_NOTIFICATION_PREFERENCES structure
    console.log('USER_NOTIFICATION_PREFERENCES columns:');
    const [notifColumns] = await connection.query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'USER_NOTIFICATION_PREFERENCES'
      ORDER BY ORDINAL_POSITION
    `, [process.env.DB_NAME]);
    
    notifColumns.forEach(col => {
      console.log(`  - ${col.COLUMN_NAME} (${col.DATA_TYPE})`);
    });
    console.log('');
    
    // USER_PRIVACY_SETTINGS structure
    console.log('USER_PRIVACY_SETTINGS columns:');
    const [privacyColumns] = await connection.query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'USER_PRIVACY_SETTINGS'
      ORDER BY ORDINAL_POSITION
    `, [process.env.DB_NAME]);
    
    privacyColumns.forEach(col => {
      console.log(`  - ${col.COLUMN_NAME} (${col.DATA_TYPE})`);
    });
    console.log('');
    
    // Check for user 10026
    console.log('📋 Checking user 10026...');
    const [users] = await connection.query(`
      SELECT id, email, first_name, last_name, role
      FROM app_users
      WHERE id = 10026
    `);
    
    if (users.length === 0) {
      console.log('❌ User 10026 not found!');
      console.log('Available users:');
      const [allUsers] = await connection.query(`
        SELECT id, email, first_name, last_name, role
        FROM app_users
        ORDER BY id
        LIMIT 10
      `);
      allUsers.forEach(u => {
        console.log(`  - ID: ${u.id}, Email: ${u.email}, Name: ${u.first_name} ${u.last_name}`);
      });
    } else {
      const user = users[0];
      console.log('✅ User found:');
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Name: ${user.first_name} ${user.last_name}`);
      console.log(`   Role: ${user.role}\n`);
      
      // Check if user has preferences
      const [userPrefs] = await connection.query(`
        SELECT * FROM USER_PREFERENCES WHERE user_id = ?
      `, [10026]);
      
      if (userPrefs.length === 0) {
        console.log('⚠️  User has no preferences record');
      } else {
        console.log('✅ User has preferences record');
        console.log(`   Primary Domain ID: ${userPrefs[0].primary_domain_id || 'Not set'}`);
        console.log(`   Secondary Domains: ${userPrefs[0].secondary_domain_ids || 'Not set'}`);
      }
      
      // Check notification preferences
      const [notifPrefs] = await connection.query(`
        SELECT * FROM USER_NOTIFICATION_PREFERENCES WHERE user_id = ?
      `, [10026]);
      
      if (notifPrefs.length === 0) {
        console.log('⚠️  User has no notification preferences');
      } else {
        console.log('✅ User has notification preferences');
      }
      
      // Check privacy settings
      const [privacySettings] = await connection.query(`
        SELECT * FROM USER_PRIVACY_SETTINGS WHERE user_id = ?
      `, [10026]);
      
      if (privacySettings.length === 0) {
        console.log('⚠️  User has no privacy settings');
      } else {
        console.log('✅ User has privacy settings');
      }
    }
    
    console.log('\n✅ Preferences tables verification complete!');
    
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

verifyPreferencesTables();

