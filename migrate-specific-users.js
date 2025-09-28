import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

async function migrateSpecificUsers() {
  let connection;

  try {
    console.log('🚀 Starting migration of specific users from raw_csv_uploads...');

    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: parseInt(process.env.DB_PORT || '3306'),
      multipleStatements: true
    });

    console.log('✅ Connected to database successfully!');

    // Get users with specified last names from raw_csv_uploads
    const targetLastNames = ['yarlagadda', 'dola', 'varanasi', 'divel'];
    console.log(`🔍 Searching for users with last names: ${targetLastNames.join(', ')}`);

    const [rawData] = await connection.execute(
      `SELECT ID, ROW_DATA FROM raw_csv_uploads
       WHERE JSON_EXTRACT(ROW_DATA, "$.FamilyName") IN (?, ?, ?, ?)
          OR JSON_EXTRACT(ROW_DATA, "$.FamilyName") LIKE ?`,
      ['yarlagadda', 'dola', 'varanasi', 'divel', '%divel%']
    );

    console.log(`📊 Found ${rawData.length} records to migrate`);

    if (rawData.length === 0) {
      console.log('❌ No records found with specified last names');
      return;
    }

    // Display found records
    console.log('\n📝 Records to be migrated:');
    rawData.forEach((row, index) => {
      const data = row.ROW_DATA;
      console.log(`${index + 1}. ${data.Name} (${data.FamilyName}) - ${data.Email}`);
    });

    // Check which emails already exist
    const emails = rawData.map(row => row.ROW_DATA.Email);
    const placeholders = emails.map(() => '?').join(',');
    const [existingUsers] = await connection.execute(
      `SELECT email FROM users WHERE email IN (${placeholders})`,
      emails
    );

    const existingEmails = new Set(existingUsers.map(u => u.email));
    console.log(`\n⚠️  ${existingUsers.length} users already exist and will be skipped`);

    // Also check for duplicates within the raw data itself
    const seenEmails = new Set();
    const uniqueRawData = [];

    for (const row of rawData) {
      const email = row.ROW_DATA.Email;
      if (!seenEmails.has(email) && !existingEmails.has(email)) {
        seenEmails.add(email);
        uniqueRawData.push(row);
      }
    }

    console.log(`\n📊 After removing duplicates: ${uniqueRawData.length} unique records to migrate`);

    // Filter out existing users
    const newUsers = uniqueRawData.filter(row => !existingEmails.has(row.ROW_DATA.Email));

    if (newUsers.length === 0) {
      console.log('ℹ️  All users already exist in the system');
      return;
    }

    console.log(`\n✅ Migrating ${newUsers.length} new users...`);

    // Begin transaction
    await connection.beginTransaction();

    try {
      for (const row of newUsers) {
          const data = row.ROW_DATA;
  
          // Parse name - assume "First Last" format
          const nameParts = data.Name.split(' ');
          const firstName = nameParts[0] || '';
          const lastName = nameParts.slice(1).join(' ') || data.FamilyName || '';
  
          // Convert batch to graduation year (assuming B8 = 2024, etc.)
          let graduationYear = null;
          if (data.batch) {
            const batchMatch = data.batch.match(/B(\d+)/);
            if (batchMatch) {
              const batchNum = parseInt(batchMatch[1]);
              // Assuming batch 1 started in 2015 or similar - adjust as needed
              graduationYear = 2015 + batchNum - 1;
            }
          }
  
          console.log(`   Migrating: ${firstName} ${lastName} (${data.Email})`);
  
          // Insert into users table (id is auto-increment, so don't specify it)
          const [userResult] = await connection.execute(
            `INSERT INTO users (email, role, is_active, created_at, updated_at)
             VALUES (?, 'member', 1, NOW(), NOW())`,
            [data.Email]
          );
  
          // Get the auto-generated user ID
          const userId = userResult.insertId;
  
          // Insert into alumni_profiles table
          await connection.execute(
            `INSERT INTO alumni_profiles (user_id, father_name, family_name, batch, center_name, result, category, student_id, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [
              userId,
              firstName, // father_name
              lastName, // family_name
              data.batch || null,
              data.centerName || null,
              data.result || null,
              data.category || null,
              data.studentId || null
            ]
          );
        }

      // Commit transaction
      await connection.commit();
      console.log(`\n✅ Successfully migrated ${newUsers.length} users!`);

      // Show summary
      console.log('\n📊 Migration Summary:');
      console.log(`   - Total found: ${rawData.length}`);
      console.log(`   - Already existed: ${existingUsers.length}`);
      console.log(`   - Newly migrated: ${newUsers.length}`);

    } catch (error) {
      await connection.rollback();
      throw error;
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed.');
    }
  }
}

migrateSpecificUsers();