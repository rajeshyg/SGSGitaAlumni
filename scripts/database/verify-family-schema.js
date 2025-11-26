/**
 * FAMILY MEMBER SYSTEM - SCHEMA VERIFICATION SCRIPT
 * 
 * Purpose: Verify that all family member tables and columns exist
 * Run this before migration to ensure schema is ready
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'sgsgita_alumni',
  port: process.env.DB_PORT || 3306
};

const REQUIRED_TABLES = {
  FAMILY_MEMBERS: [
    'id', 'parent_user_id', 'alumni_member_id', 'first_name', 'last_name',
    'display_name', 'birth_date', 'age_at_registration', 'current_age',
    'can_access_platform', 'requires_parent_consent', 'parent_consent_given',
    'parent_consent_date', 'access_level', 'relationship', 'is_primary_contact',
    'profile_image_url', 'bio', 'status', 'created_at', 'updated_at',
    'last_login_at', 'last_consent_check_at'
  ],
  FAMILY_ACCESS_LOG: [
    'id', 'family_member_id', 'parent_user_id', 'access_type',
    'access_timestamp', 'ip_address', 'user_agent', 'device_type', 'session_id'
  ],
  app_users: [
    'is_family_account', 'family_account_type', 'primary_family_member_id'
  ],
  USER_PREFERENCES: [
    'family_member_id'
  ]
};

async function verifySchema() {
  let connection;
  
  try {
    console.log('🔍 Verifying Family Member System schema...\n');
    
    connection = await mysql.createConnection(DB_CONFIG);
    console.log('✅ Connected to database:', DB_CONFIG.database, '\n');
    
    let allValid = true;
    const issues = [];
    
    // Check each table
    for (const [tableName, requiredColumns] of Object.entries(REQUIRED_TABLES)) {
      console.log(`Checking table: ${tableName}`);
      
      // Check if table exists
      const [tables] = await connection.execute(
        `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
        [DB_CONFIG.database, tableName]
      );
      
      if (tables.length === 0) {
        console.log(`  ❌ Table ${tableName} does NOT exist`);
        issues.push(`Missing table: ${tableName}`);
        allValid = false;
        continue;
      }
      
      console.log(`  ✅ Table exists`);
      
      // Check columns
      const [columns] = await connection.execute(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
        [DB_CONFIG.database, tableName]
      );
      
      const existingColumns = columns.map(c => c.COLUMN_NAME);
      const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));
      
      if (missingColumns.length > 0) {
        console.log(`  ❌ Missing columns in ${tableName}:`, missingColumns.join(', '));
        issues.push(`${tableName}: missing columns - ${missingColumns.join(', ')}`);
        allValid = false;
      } else {
        console.log(`  ✅ All required columns present (${requiredColumns.length})`);
      }
      
      console.log('');
    }
    
    // Check foreign keys
    console.log('Checking foreign keys...');
    const [fks] = await connection.execute(
      `SELECT TABLE_NAME, CONSTRAINT_NAME, REFERENCED_TABLE_NAME
       FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
       WHERE TABLE_SCHEMA = ? AND REFERENCED_TABLE_NAME IS NOT NULL
       AND (TABLE_NAME = 'FAMILY_MEMBERS' OR TABLE_NAME = 'FAMILY_ACCESS_LOG' OR TABLE_NAME = 'USER_PREFERENCES')`,
      [DB_CONFIG.database]
    );
    
    console.log(`  Found ${fks.length} foreign key constraints`);
    fks.forEach(fk => {
      console.log(`    ${fk.TABLE_NAME}.${fk.CONSTRAINT_NAME} → ${fk.REFERENCED_TABLE_NAME}`);
    });
    console.log('');
    
    // Check indexes
    console.log('Checking indexes...');
    const [indexes] = await connection.execute(
      `SELECT TABLE_NAME, INDEX_NAME, GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) as COLUMNS
       FROM INFORMATION_SCHEMA.STATISTICS
       WHERE TABLE_SCHEMA = ? AND (TABLE_NAME = 'FAMILY_MEMBERS' OR TABLE_NAME = 'FAMILY_ACCESS_LOG')
       GROUP BY TABLE_NAME, INDEX_NAME`,
      [DB_CONFIG.database]
    );
    
    console.log(`  Found ${indexes.length} indexes`);
    indexes.forEach(idx => {
      console.log(`    ${idx.TABLE_NAME}.${idx.INDEX_NAME} (${idx.COLUMNS})`);
    });
    console.log('');
    
    // Final summary
    console.log('═══════════════════════════════════════════════════════════');
    console.log('SCHEMA VERIFICATION SUMMARY');
    console.log('═══════════════════════════════════════════════════════════');
    
    if (allValid) {
      console.log('✅ Schema is VALID - ready for migration!');
      console.log('\nNext steps:');
      console.log('  1. Run: node scripts/database/migrate-existing-users-to-family.js');
      console.log('  2. Verify migration completed successfully');
      console.log('  3. Test family member functionality');
    } else {
      console.log('❌ Schema has ISSUES - fix before migration\n');
      console.log('Issues found:');
      issues.forEach(issue => console.log(`  - ${issue}`));
      console.log('\nAction required:');
      console.log('  1. Run: mysql -u root -p sgsgita_alumni < scripts/database/migrations/create-family-members-tables.sql');
      console.log('  2. Re-run this verification script');
    }
    console.log('═══════════════════════════════════════════════════════════\n');
    
    return allValid;
    
  } catch (error) {
    console.error('\n❌ Verification failed:', error.message);
    throw error;
    
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run verification
if (require.main === module) {
  verifySchema()
    .then(isValid => {
      process.exit(isValid ? 0 : 1);
    })
    .catch(error => {
      console.error('\n💥 Verification failed:', error);
      process.exit(1);
    });
}

module.exports = { verifySchema };
