import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT || '3306'),
  multipleStatements: true
});

async function runMigration() {
  try {
    console.log('🔧 Adding missing columns to app_users table...\n');
    
    const conn = await pool.getConnection();
    
    // Read and execute the SQL file
    const sqlPath = path.join(__dirname, 'database', 'add-missing-app-users-columns.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Split by semicolons and execute each statement
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('USE'));
    
    for (const statement of statements) {
      if (statement.includes('SELECT') && statement.includes('information_schema')) {
        // This is a verification query, show results
        const [rows] = await conn.query(statement);
        if (rows.length > 0) {
          console.log('✅ Columns verified:');
          rows.forEach(row => {
            console.log(`   ${row.COLUMN_NAME} (${row.DATA_TYPE}) - Default: ${row.COLUMN_DEFAULT || 'NULL'}`);
          });
        }
      } else {
        // Execute the statement
        await conn.query(statement);
      }
    }
    
    console.log('\n✅ Migration completed successfully!\n');
    
    // Verify the final schema
    console.log('📋 Final app_users schema (relevant columns):\n');
    const [cols] = await conn.query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'app_users'
      AND COLUMN_NAME IN ('email_verified', 'email_verified_at', 'last_login_at', 
                          'login_count', 'two_factor_enabled', 'last_password_change')
      ORDER BY ORDINAL_POSITION
    `, [process.env.DB_NAME]);
    
    cols.forEach(col => {
      console.log(`   ${col.COLUMN_NAME.padEnd(25)} ${col.DATA_TYPE.padEnd(15)} ${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    conn.release();
    await pool.end();
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();

