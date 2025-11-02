/**
 * Execute SQL schema for family members (simple version)
 */
import mysql from 'mysql2/promise';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const DB_CONFIG = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  multipleStatements: true
};

async function createTables() {
  let connection;
  
  try {
    console.log('📂 Reading SQL file...');
    const sqlFile = path.join(__dirname, 'create-family-tables-simple.sql');
    const sqlContent = await fs.readFile(sqlFile, 'utf8');
    
    console.log('🔌 Connecting to database...');
    connection = await mysql.createConnection(DB_CONFIG);
    console.log('✅ Connected to:', DB_CONFIG.database);
    
    console.log('⚙️  Creating tables...\n');
    const [results] = await connection.query(sqlContent);
    
    console.log('✅ Tables created successfully!\n');
    
    // Now add columns to existing tables one by one
    console.log('➕ Adding columns to app_users...');
    
    try {
      await connection.execute(`
        ALTER TABLE app_users 
        ADD COLUMN is_family_account BOOLEAN DEFAULT FALSE AFTER email
      `);
      console.log('  ✅ Added is_family_account');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('  ⏭️  is_family_account already exists');
      } else throw e;
    }
    
    try {
      await connection.execute(`
        ALTER TABLE app_users 
        ADD COLUMN family_account_type ENUM('individual', 'parent', 'shared') DEFAULT 'individual' 
        AFTER is_family_account
      `);
      console.log('  ✅ Added family_account_type');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('  ⏭️  family_account_type already exists');
      } else throw e;
    }
    
    try {
      await connection.execute(`
        ALTER TABLE app_users 
        ADD COLUMN primary_family_member_id CHAR(36) NULL AFTER family_account_type
      `);
      console.log('  ✅ Added primary_family_member_id');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('  ⏭️  primary_family_member_id already exists');
      } else throw e;
    }
    
    console.log('\n➕ Adding column to USER_PREFERENCES...');
    
    try {
      await connection.execute(`
        ALTER TABLE USER_PREFERENCES 
        ADD COLUMN family_member_id CHAR(36) NULL AFTER user_id
      `);
      console.log('  ✅ Added family_member_id');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('  ⏭️  family_member_id already exists');
      } else throw e;
    }
    
    console.log('\n🔗 Adding foreign key constraints...');
    
    try {
      await connection.execute(`
        ALTER TABLE USER_PREFERENCES 
        ADD CONSTRAINT fk_family_member_preferences 
        FOREIGN KEY (family_member_id) REFERENCES FAMILY_MEMBERS(id) ON DELETE CASCADE
      `);
      console.log('  ✅ Added FK: USER_PREFERENCES → FAMILY_MEMBERS');
    } catch (e) {
      if (e.code === 'ER_DUP_KEYNAME') {
        console.log('  ⏭️  Foreign key already exists');
      } else throw e;
    }
    
    console.log('\n📊 Adding indexes...');
    
    try {
      await connection.execute(`
        ALTER TABLE USER_PREFERENCES 
        ADD INDEX idx_family_member_preferences (family_member_id)
      `);
      console.log('  ✅ Added index on USER_PREFERENCES.family_member_id');
    } catch (e) {
      if (e.code === 'ER_DUP_KEYNAME') {
        console.log('  ⏭️  Index already exists');
      } else throw e;
    }
    
    try {
      await connection.execute(`
        ALTER TABLE app_users 
        ADD INDEX idx_family_account (is_family_account)
      `);
      console.log('  ✅ Added index on app_users.is_family_account');
    } catch (e) {
      if (e.code === 'ER_DUP_KEYNAME') {
        console.log('  ⏭️  Index already exists');
      } else throw e;
    }
    
    try {
      await connection.execute(`
        ALTER TABLE app_users 
        ADD INDEX idx_family_type (family_account_type)
      `);
      console.log('  ✅ Added index on app_users.family_account_type');
    } catch (e) {
      if (e.code === 'ER_DUP_KEYNAME') {
        console.log('  ⏭️  Index already exists');
      } else throw e;
    }
    
    console.log('\n✨ Schema setup completed successfully!');
    console.log('\n📌 Next step: Run node scripts/database/migrate-existing-users-to-family.js');
    
    return true;
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
    
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

createTables()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('\n💥 Failed:', error);
    process.exit(1);
  });
