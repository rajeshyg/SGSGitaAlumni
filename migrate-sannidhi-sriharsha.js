import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function migrateSannidhiSriharsha() {
  let connection;

  try {
    console.log('🚀 Starting migration of Sannidhi and Sriharsha users from raw_csv_uploads...');

    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: parseInt(process.env.DB_PORT || '3306'),
      multipleStatements: true
    });

    console.log('✅ Connected to database successfully!');

    // Get users with first names Sannidhi or Sriharsha
    const [rawData] = await connection.execute(
      `SELECT ID, ROW_DATA FROM raw_csv_uploads
       WHERE JSON_EXTRACT(ROW_DATA, "$.Name") LIKE ?
          OR JSON_EXTRACT(ROW_DATA, "$.Name") LIKE ?`,
      ['%Sannidhi%', '%Sriharsha%']
    );

    console.log(`📊 Found ${rawData.length} records to migrate`);

    if (rawData.length === 0) {
      console.log('❌ No records found with specified first names');
      return;
    }

    // Display found records
    console.log('\n📝 Records to be migrated:');
    rawData.forEach((row, index) => {
      const data = row.ROW_DATA;
      console.log(`${index + 1}. ${data.Name} (${data.FamilyName}) - ${data.Email}`);
    });

    // Note: Multiple users can share the same email (family members)
    // We'll migrate all found records regardless of email duplicates

    console.log(`\n✅ Migrating ${rawData.length} users (allowing duplicate emails for family members)...`);

    // Begin transaction
    await connection.beginTransaction();

    let migratedCount = 0;
    let skippedCount = 0;

    try {
      for (const row of rawData) {
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

          try {
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

            migratedCount++;
          } catch (insertError) {
            if (insertError.code === 'ER_DUP_ENTRY') {
              console.log(`   ⚠️  Skipped (duplicate email): ${data.Email}`);
              skippedCount++;
            } else {
              throw insertError; // Re-throw if it's not a duplicate error
            }
          }
        }

      // Commit transaction
      await connection.commit();
      console.log(`\n✅ Migration completed!`);

      // Show summary
      console.log('\n📊 Migration Summary:');
      console.log(`   - Total found: ${rawData.length}`);
      console.log(`   - Successfully migrated: ${migratedCount}`);
      console.log(`   - Skipped (duplicate emails): ${skippedCount}`);
      console.log(`   - Note: Database currently requires unique emails`);

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

migrateSannidhiSriharsha();