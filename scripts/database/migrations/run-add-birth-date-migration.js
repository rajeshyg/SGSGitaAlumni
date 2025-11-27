/**
 * Migration Script: Add birth_date column to alumni_members table
 * 
 * Purpose: Enable admin to store actual birth dates for COPPA compliance
 * Falls back to estimated age from graduation year (batch - 22)
 * 
 * Run: node scripts/database/migrations/run-add-birth-date-migration.js
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '..', '..', '.env') });

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'alumni_network',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

async function runMigration() {
  let connection;

  try {
    console.log('🚀 Starting migration: Add birth_date to alumni_members...\n');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database:', dbConfig.database);

    // Check if columns already exist
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'alumni_members' 
      AND COLUMN_NAME IN ('birth_date', 'estimated_birth_year')
    `, [dbConfig.database]);

    const existingColumns = columns.map(c => c.COLUMN_NAME);
    console.log('📋 Existing columns:', existingColumns.length > 0 ? existingColumns.join(', ') : 'none');

    await connection.beginTransaction();

    // Step 1: Add birth_date column if not exists
    if (!existingColumns.includes('birth_date')) {
      console.log('\n1️⃣ Adding birth_date column...');
      await connection.execute(`
        ALTER TABLE alumni_members 
        ADD COLUMN birth_date DATE NULL COMMENT 'Birth date for age calculation (admin-populated)'
      `);
      console.log('   ✅ birth_date column added');
    } else {
      console.log('\n1️⃣ birth_date column already exists, skipping...');
    }

    // Step 2: Add estimated_birth_year column if not exists
    if (!existingColumns.includes('estimated_birth_year')) {
      console.log('\n2️⃣ Adding estimated_birth_year column...');
      await connection.execute(`
        ALTER TABLE alumni_members 
        ADD COLUMN estimated_birth_year INT NULL COMMENT 'Estimated birth year from graduation year'
      `);
      console.log('   ✅ estimated_birth_year column added');
    } else {
      console.log('\n2️⃣ estimated_birth_year column already exists, skipping...');
    }

    // Step 3: Populate estimated_birth_year from batch
    console.log('\n3️⃣ Populating estimated_birth_year from graduation year (batch)...');
    const [updateResult] = await connection.execute(`
      UPDATE alumni_members 
      SET estimated_birth_year = batch - 22 
      WHERE batch IS NOT NULL AND estimated_birth_year IS NULL
    `);
    console.log(`   ✅ Updated ${updateResult.affectedRows} records with estimated birth year`);

    // Step 4: Verify migration
    console.log('\n4️⃣ Verifying migration...');
    const [stats] = await connection.execute(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN birth_date IS NOT NULL THEN 1 ELSE 0 END) as with_birth_date,
        SUM(CASE WHEN estimated_birth_year IS NOT NULL THEN 1 ELSE 0 END) as with_estimated_year,
        SUM(CASE WHEN batch IS NOT NULL THEN 1 ELSE 0 END) as with_batch
      FROM alumni_members
    `);

    console.log('\n📊 Migration Statistics:');
    console.log(`   Total alumni members:       ${stats[0].total}`);
    console.log(`   With actual birth_date:     ${stats[0].with_birth_date}`);
    console.log(`   With estimated birth year:  ${stats[0].with_estimated_year}`);
    console.log(`   With graduation year:       ${stats[0].with_batch}`);

    await connection.commit();

    console.log('\n✅ Migration completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('   1. Admin can now update alumni_members.birth_date via admin panel');
    console.log('   2. When sending invitations, birth_date will be included in invitation_data');
    console.log('   3. If birth_date is NULL, system uses estimated age from graduation year');

  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error('\n❌ Migration failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

runMigration().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
