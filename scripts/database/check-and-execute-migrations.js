/**
 * Check migration status and execute pending migrations
 */
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function checkAndExecuteMigrations() {
  let connection;
  
  try {
    console.log('Connecting to database...');
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      multipleStatements: true
    });

    console.log('✓ Connected to database\n');

    // Check current schema state
    console.log('=== CHECKING CURRENT SCHEMA STATE ===\n');
    
    // Check for old tables
    const [oldTables] = await connection.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = ? 
      AND table_name IN ('app_users', 'FAMILY_MEMBERS', 'FAMILY_INVITATIONS', 'FAMILY_ACCESS_LOG')
    `, [process.env.DB_NAME]);
    
    console.log('Old tables still present:', oldTables.map(t => t.table_name).join(', ') || 'None');

    // Check for new tables
    const [newTables] = await connection.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = ? 
      AND table_name IN ('accounts', 'user_profiles')
    `, [process.env.DB_NAME]);
    
    console.log('New tables present:', newTables.map(t => t.table_name).join(', ') || 'None');

    // Check for YOB column in alumni_members
    const [yobColumn] = await connection.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = ? 
      AND table_name = 'alumni_members' 
      AND column_name = 'year_of_birth'
    `, [process.env.DB_NAME]);
    
    console.log('year_of_birth column exists:', yobColumn.length > 0);
    console.log('\n');

    // Determine if migrations need to be executed
    const needsMigration = oldTables.length > 0 || newTables.length === 0;

    if (!needsMigration) {
      console.log('✓ Migrations appear to be already executed.');
      console.log('Database schema is up to date.\n');
      return;
    }

    console.log('⚠ Migrations need to be executed.\n');

    // Ask for confirmation
    console.log('This will:');
    console.log('1. DELETE all test data');
    console.log('2. DROP old tables (app_users, FAMILY_MEMBERS, etc.)');
    console.log('3. CREATE new tables (accounts, user_profiles)');
    console.log('4. Add COPPA columns to alumni_members');
    console.log('\n⚠ WARNING: This is a destructive operation!\n');

    // Execute migrations
    const migrationsDir = path.join(__dirname, '../../migrations');
    const migrationFiles = [
      '2025-12-07-001-delete-test-data.sql',
      '2025-12-07-002-add-coppa-columns.sql',
      '2025-12-07-003-create-accounts-table.sql',
      '2025-12-07-004-create-user-profiles-table.sql',
      '2025-12-07-005-create-parent-consent-table.sql',
      '2025-12-07-006-update-foreign-keys.sql',
      '2025-12-07-007-verify-migration.sql'
    ];

    console.log('=== EXECUTING MIGRATIONS ===\n');

    for (const file of migrationFiles) {
      const filePath = path.join(migrationsDir, file);
      console.log(`Executing: ${file}...`);
      
      try {
        const sql = await fs.readFile(filePath, 'utf-8');
        
        // Skip verification script (007) from execution, just report
        if (file.includes('007-verify')) {
          console.log('  ✓ Skipped (verification only)');
          continue;
        }

        await connection.query(sql);
        console.log('  ✓ Success\n');
      } catch (error) {
        console.error(`  ✗ Error: ${error.message}\n`);
        throw error;
      }
    }

    console.log('=== VERIFICATION ===\n');

    // Verify new schema
    const [finalTables] = await connection.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = ? 
      ORDER BY table_name
    `, [process.env.DB_NAME]);
    
    console.log('All tables:', finalTables.map(t => t.table_name).join(', '));

    // Verify accounts table
    const [accountsCheck] = await connection.query(`
      SELECT COUNT(*) as cnt 
      FROM information_schema.tables 
      WHERE table_schema = ? AND table_name = 'accounts'
    `, [process.env.DB_NAME]);
    
    console.log('✓ accounts table exists:', accountsCheck[0].cnt > 0);

    // Verify user_profiles table
    const [profilesCheck] = await connection.query(`
      SELECT COUNT(*) as cnt 
      FROM information_schema.tables 
      WHERE table_schema = ? AND table_name = 'user_profiles'
    `, [process.env.DB_NAME]);
    
    console.log('✓ user_profiles table exists:', profilesCheck[0].cnt > 0);

    // Verify year_of_birth column
    const [yobCheck] = await connection.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = ? 
      AND table_name = 'alumni_members' 
      AND column_name IN ('year_of_birth', 'current_center', 'profile_image_url')
    `, [process.env.DB_NAME]);
    
    console.log('✓ COPPA columns added:', yobCheck.map(c => c.column_name).join(', '));

    console.log('\n✅ MIGRATIONS COMPLETED SUCCESSFULLY!\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed.');
    }
  }
}

// Run the script
checkAndExecuteMigrations();
