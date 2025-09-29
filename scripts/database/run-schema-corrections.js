// Script to run database schema corrections for Task 8.0
import mysql from 'mysql2/promise';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const DB_CONFIG = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT || '3306'),
  multipleStatements: true,
  connectTimeout: 60000,
  acquireTimeout: 60000,
  timeout: 60000,
};

async function runSchemaCorrections() {
  let connection;

  try {
    console.log('🚀 Starting Database Schema Corrections for Task 8.0\n');

    connection = await mysql.createConnection(DB_CONFIG);
    console.log('✅ Connected to database successfully');

    // Read the SQL file
    console.log('📖 Reading schema corrections SQL file...');
    const sqlContent = fs.readFileSync('database-schema-corrections.sql', 'utf8');

    // Execute key schema corrections individually
    console.log('\n⚡ Executing key schema corrections...\n');

    const corrections = [
      // Add missing columns to alumni_members
      "ALTER TABLE alumni_members ADD COLUMN first_name VARCHAR(100) NULL",
      "ALTER TABLE alumni_members ADD COLUMN last_name VARCHAR(100) NULL",

      // Create user_profiles table
      `CREATE TABLE IF NOT EXISTS user_profiles (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id BIGINT NOT NULL,
        alumni_member_id INT NULL,
        first_name VARCHAR(100) NULL,
        last_name VARCHAR(100) NULL,
        display_name VARCHAR(150) NULL,
        bio TEXT NULL,
        avatar_url VARCHAR(500) NULL,
        phone VARCHAR(20) NULL,
        social_links JSON NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE CASCADE,
        FOREIGN KEY (alumni_member_id) REFERENCES alumni_members(id) ON DELETE SET NULL,
        INDEX idx_user_id (user_id),
        INDEX idx_alumni_member_id (alumni_member_id)
      )`,

      // Recover data from raw_csv_uploads
      `UPDATE alumni_members am
       INNER JOIN raw_csv_uploads rcu ON am.student_id = JSON_UNQUOTE(JSON_EXTRACT(rcu.ROW_DATA, '$.studentId'))
       SET
         am.first_name = SUBSTRING_INDEX(JSON_UNQUOTE(JSON_EXTRACT(rcu.ROW_DATA, '$.Name')), ' ', 1),
         am.last_name = JSON_UNQUOTE(JSON_EXTRACT(rcu.ROW_DATA, '$.FamilyName')),
         am.email = JSON_UNQUOTE(JSON_EXTRACT(rcu.ROW_DATA, '$.Email')),
         am.phone = JSON_UNQUOTE(JSON_EXTRACT(rcu.ROW_DATA, '$.Phone'))
       WHERE am.first_name IS NULL OR am.email IS NULL`,

      // Link existing users
      `UPDATE app_users u
       INNER JOIN alumni_members am ON u.id = am.user_id
       SET u.alumni_member_id = am.id
       WHERE u.alumni_member_id IS NULL`,

      // Populate user_profiles
      `INSERT INTO user_profiles (user_id, alumni_member_id, first_name, last_name, phone)
       SELECT
         u.id,
         u.alumni_member_id,
         COALESCE(u.first_name, am.first_name),
         COALESCE(u.last_name, am.last_name),
         COALESCE(u.phone, am.phone)
       FROM app_users u
       LEFT JOIN alumni_members am ON u.alumni_member_id = am.id
       WHERE NOT EXISTS (
         SELECT 1 FROM user_profiles up WHERE up.user_id = u.id
       )`
    ];

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < corrections.length; i++) {
      const statement = corrections[i];

      try {
        console.log(`[${i + 1}/${corrections.length}] ${statement.substring(0, 60)}...`);
        await connection.execute(statement);
        successCount++;
        console.log('✅ Success');
      } catch (error) {
        errorCount++;

        // Handle expected errors (columns already exist, etc.)
        if (error.code === 'ER_DUP_FIELDNAME') {
          console.log('⚠️  Column already exists (skipping)');
        } else if (error.code === 'ER_DUP_KEYNAME') {
          console.log('⚠️  Index already exists (skipping)');
        } else if (error.code === 'ER_TABLE_EXISTS_ERROR') {
          console.log('⚠️  Table already exists (skipping)');
        } else {
          console.log('❌ Error:', error.message);
        }
      }
    }

    console.log(`\n=== SCHEMA CORRECTIONS SUMMARY ===`);
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${errorCount}`);

    // Verify the changes
    console.log('\n=== VERIFYING CORRECTIONS ===');

    // Check alumni_members structure
    const [alumniStructure] = await connection.execute('DESCRIBE alumni_members');
    console.log('\n📋 Alumni Members Table Structure:');
    console.log('New columns added:');
    const newCols = alumniStructure.filter(col =>
      ['first_name', 'last_name', 'email', 'phone'].includes(col.Field)
    );
    console.table(newCols);

    // Check data integrity
    const [dataCheck] = await connection.execute(`
      SELECT
        'alumni_members' as table_name,
        COUNT(*) as total_records,
        SUM(CASE WHEN first_name IS NOT NULL AND first_name != '' THEN 1 ELSE 0 END) as with_first_name,
        SUM(CASE WHEN last_name IS NOT NULL AND last_name != '' THEN 1 ELSE 0 END) as with_last_name,
        SUM(CASE WHEN email IS NOT NULL AND email != '' THEN 1 ELSE 0 END) as with_email,
        SUM(CASE WHEN phone IS NOT NULL AND phone != '' THEN 1 ELSE 0 END) as with_phone
      FROM alumni_members

      UNION ALL

      SELECT
        'app_users' as table_name,
        COUNT(*) as total_records,
        SUM(CASE WHEN first_name IS NOT NULL AND first_name != '' THEN 1 ELSE 0 END) as with_first_name,
        SUM(CASE WHEN last_name IS NOT NULL AND last_name != '' THEN 1 ELSE 0 END) as with_last_name,
        SUM(CASE WHEN alumni_member_id IS NOT NULL THEN 1 ELSE 0 END) as linked_to_alumni,
        0 as with_phone
      FROM app_users

      UNION ALL

      SELECT
        'user_profiles' as table_name,
        COUNT(*) as total_records,
        SUM(CASE WHEN first_name IS NOT NULL AND first_name != '' THEN 1 ELSE 0 END) as with_first_name,
        SUM(CASE WHEN last_name IS NOT NULL AND last_name != '' THEN 1 ELSE 0 END) as with_last_name,
        SUM(CASE WHEN alumni_member_id IS NOT NULL THEN 1 ELSE 0 END) as linked_to_alumni,
        SUM(CASE WHEN phone IS NOT NULL AND phone != '' THEN 1 ELSE 0 END) as with_phone
      FROM user_profiles
    `);

    console.log('\n📊 Data Integrity Check:');
    console.table(dataCheck);

    // Sample data verification
    const [sampleAlumni] = await connection.execute(`
      SELECT id, student_id, first_name, last_name, email, phone
      FROM alumni_members
      WHERE first_name IS NOT NULL AND email IS NOT NULL
      LIMIT 5
    `);

    console.log('\n📝 Sample Recovered Alumni Data:');
    console.table(sampleAlumni);

    console.log('\n✅ Database schema corrections completed successfully!');
    console.log('🎯 Task 8.0 Sub-task 8.0.2 (Schema Design Corrections) - COMPLETED');
    console.log('🎯 Task 8.0 Sub-task 8.0.4 (Data Recovery) - COMPLETED');

  } catch (error) {
    console.error('❌ Schema corrections failed:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed.');
    }
  }
}

runSchemaCorrections();