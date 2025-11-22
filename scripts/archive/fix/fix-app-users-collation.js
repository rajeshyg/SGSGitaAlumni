/**
 * Fix collation mismatch for app_users.primary_family_member_id
 * 
 * Issue: Illegal mix of collations when JOINing app_users with FAMILY_MEMBERS
 * - app_users.primary_family_member_id: utf8mb4_0900_ai_ci
 * - FAMILY_MEMBERS.id: utf8mb4_unicode_ci
 * 
 * This causes /api/auth/refresh to fail with 500 error.
 * 
 * Solution: Change app_users.primary_family_member_id collation to utf8mb4_unicode_ci
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function fixAppUsersCollation() {
  const connection = await pool.getConnection();
  
  try {
    console.log('🔧 Fixing app_users.primary_family_member_id collation mismatch...\n');
    
    // Step 1: Check current collation
    console.log('Step 1: Checking current collation...');
    const [currentCol] = await connection.execute(`
      SELECT COLUMN_NAME, COLLATION_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ? 
        AND TABLE_NAME = 'app_users'
        AND COLUMN_NAME = 'primary_family_member_id'
    `, [process.env.DB_NAME]);
    
    console.log('Current:', currentCol[0]);
    
    if (currentCol[0].COLLATION_NAME === 'utf8mb4_unicode_ci') {
      console.log('✅ Collation already correct! No changes needed.');
      connection.release();
      await pool.end();
      return;
    }
    
    // Step 2: Check for foreign key constraints
    console.log('\nStep 2: Checking foreign key constraints...');
    const [fks] = await connection.execute(`
      SELECT CONSTRAINT_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = ?
        AND TABLE_NAME = 'app_users'
        AND COLUMN_NAME = 'primary_family_member_id'
        AND REFERENCED_TABLE_NAME IS NOT NULL
    `, [process.env.DB_NAME]);
    
    console.log('Foreign keys found:', fks.length);
    if (fks.length > 0) {
      console.table(fks);
    }
    
    // Step 3: Drop foreign key constraint if exists
    if (fks.length > 0) {
      console.log('\nStep 3: Dropping foreign key constraint...');
      const fkName = fks[0].CONSTRAINT_NAME;
      await connection.execute(`ALTER TABLE app_users DROP FOREIGN KEY ${fkName}`);
      console.log(`✅ Dropped foreign key: ${fkName}`);
    } else {
      console.log('\nStep 3: No foreign key to drop');
    }
    
    // Step 4: Change column collation
    console.log('\nStep 4: Changing column collation...');
    await connection.execute(`
      ALTER TABLE app_users 
      MODIFY COLUMN primary_family_member_id CHAR(36) 
      CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `);
    console.log('✅ Column collation changed to utf8mb4_unicode_ci');
    
    // Step 5: Recreate foreign key constraint if it existed
    if (fks.length > 0) {
      console.log('\nStep 5: Recreating foreign key constraint...');
      await connection.execute(`
        ALTER TABLE app_users
        ADD CONSTRAINT ${fks[0].CONSTRAINT_NAME}
        FOREIGN KEY (primary_family_member_id)
        REFERENCES FAMILY_MEMBERS(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
      `);
      console.log(`✅ Foreign key recreated: ${fks[0].CONSTRAINT_NAME}`);
    } else {
      console.log('\nStep 5: No foreign key to recreate');
    }
    
    // Step 6: Verify the change
    console.log('\nStep 6: Verifying the change...');
    const [newCol] = await connection.execute(`
      SELECT COLUMN_NAME, COLLATION_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ? 
        AND TABLE_NAME = 'app_users'
        AND COLUMN_NAME = 'primary_family_member_id'
    `, [process.env.DB_NAME]);
    
    console.log('New collation:', newCol[0]);
    
    // Step 7: Test the JOIN query
    console.log('\nStep 7: Testing JOIN query...');
    const [testRows] = await connection.execute(`
      SELECT 
        u.id, u.email, u.primary_family_member_id,
        fm.first_name as family_first_name
      FROM app_users u
      LEFT JOIN FAMILY_MEMBERS fm ON u.primary_family_member_id = fm.id
      WHERE u.id = 4600 AND u.is_active = true
    `);
    
    console.log('✅ JOIN query successful!');
    console.log('Test query returned', testRows.length, 'row(s)');
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ COLLATION FIX COMPLETE');
    console.log('='.repeat(60));
    console.log('\nNext step: Test /api/auth/refresh endpoint');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('SQL State:', error.sqlState);
    throw error;
  } finally {
    connection.release();
    await pool.end();
  }
}

// Run the fix
fixAppUsersCollation().catch(error => {
  console.error('Failed to fix collation:', error);
  process.exit(1);
});
