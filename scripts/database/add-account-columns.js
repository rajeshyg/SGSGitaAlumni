import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT || '3306')
});

async function addColumns() {
  try {
    console.log('🔧 Adding missing columns to app_users table...\n');
    
    const conn = await pool.getConnection();
    
    // Check if two_factor_enabled exists
    const [cols1] = await conn.query(`
      SELECT COUNT(*) as count
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'app_users' AND COLUMN_NAME = 'two_factor_enabled'
    `, [process.env.DB_NAME]);
    
    if (cols1[0].count === 0) {
      console.log('Adding two_factor_enabled column...');
      await conn.query('ALTER TABLE app_users ADD COLUMN two_factor_enabled TINYINT(1) DEFAULT 0 AFTER login_count');
      console.log('✅ Added two_factor_enabled\n');
    } else {
      console.log('⚠️  two_factor_enabled already exists\n');
    }
    
    // Check if last_password_change exists
    const [cols2] = await conn.query(`
      SELECT COUNT(*) as count
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'app_users' AND COLUMN_NAME = 'last_password_change'
    `, [process.env.DB_NAME]);
    
    if (cols2[0].count === 0) {
      console.log('Adding last_password_change column...');
      await conn.query('ALTER TABLE app_users ADD COLUMN last_password_change TIMESTAMP NULL AFTER two_factor_enabled');
      console.log('✅ Added last_password_change\n');
    } else {
      console.log('⚠️  last_password_change already exists\n');
    }
    
    // Verify final schema
    console.log('📋 Verifying columns:\n');
    const [finalCols] = await conn.query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'app_users'
      AND COLUMN_NAME IN ('two_factor_enabled', 'last_password_change')
      ORDER BY ORDINAL_POSITION
    `, [process.env.DB_NAME]);
    
    if (finalCols.length === 2) {
      console.log('✅ Both columns exist:');
      finalCols.forEach(col => {
        console.log(`   ${col.COLUMN_NAME.padEnd(25)} ${col.DATA_TYPE.padEnd(15)} ${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'}`);
      });
    } else {
      console.log('❌ Missing columns!');
    }
    
    conn.release();
    await pool.end();
    
    console.log('\n✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

addColumns();

