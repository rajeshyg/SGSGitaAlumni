import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function migrateSpecificUsers() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306
  });

  console.log('🚀 Starting targeted migration for specific users...\n');

  const targetLastNames = ['vadivel', 'yarlagadda', 'varanasi', 'dola'];
  let totalMigrated = 0;

  for (const lastName of targetLastNames) {
    console.log(`=== Migrating users with last name: "${lastName}" ===`);

    // Find raw CSV records with this last name
    const [rawRecords] = await connection.execute(
      'SELECT id, row_data FROM raw_csv_uploads WHERE LOWER(row_data) LIKE ?',
      [`%${lastName.toLowerCase()}%`]
    );

    console.log(`Found ${rawRecords.length} raw records for "${lastName}"`);

    for (const record of rawRecords) {
      try {
        // Data is already an object, not JSON string
        const data = record.row_data;

        // Extract name information - data has both Name and FamilyName
        let firstName = '';
        let lastNameExtracted = '';

        if (data.FamilyName) {
          // Use FamilyName as last name
          lastNameExtracted = data.FamilyName.trim();
          // Extract first name from Name field (remove last name if present)
          const fullName = data.Name.trim();
          if (fullName.endsWith(lastNameExtracted)) {
            firstName = fullName.substring(0, fullName.length - lastNameExtracted.length).trim();
          } else {
            firstName = fullName;
          }
        } else if (data.Name) {
          // Fallback: split Name field
          const nameParts = data.Name.trim().split(' ');
          if (nameParts.length >= 2) {
            firstName = nameParts[0];
            lastNameExtracted = nameParts[nameParts.length - 1];
          } else {
            firstName = data.Name.trim();
            lastNameExtracted = lastName; // Use target last name if not in full name
          }
        }

        const email = (data.Email || '').trim();
        const phone = (data.Phone || '').trim();
        const studentId = (data.studentId || '').trim();

        // Check if alumni member already exists
        const [existing] = await connection.execute(
          'SELECT id FROM alumni_members WHERE email = ? OR student_id = ?',
          [email, studentId]
        );

        if (existing.length > 0) {
          // Update existing record
          await connection.execute(
            'UPDATE alumni_members SET first_name = ?, last_name = ?, phone = ? WHERE id = ?',
            [firstName, lastNameExtracted, phone, existing[0].id]
          );
          console.log(`✅ Updated: ${firstName} ${lastNameExtracted} (${email})`);
        } else {
          // Insert new record
          const [result] = await connection.execute(
            'INSERT INTO alumni_members (student_id, first_name, last_name, email, phone) VALUES (?, ?, ?, ?, ?)',
            [studentId, firstName, lastNameExtracted, email, phone]
          );
          console.log(`✅ Inserted: ${firstName} ${lastNameExtracted} (${email}) - ID: ${result.insertId}`);
        }

        totalMigrated++;

      } catch (error) {
        console.error(`❌ Error processing record ${record.id}:`, error.message);
      }
    }

    console.log('');
  }

  console.log(`🎯 Migration completed! Total records processed: ${totalMigrated}`);

  // Verify the results
  console.log('\n📊 Verification Results:');
  for (const lastName of targetLastNames) {
    const [count] = await connection.execute(
      'SELECT COUNT(*) as count FROM alumni_members WHERE LOWER(last_name) = ?',
      [lastName.toLowerCase()]
    );
    console.log(`"${lastName}": ${count[0].count} records in alumni_members`);
  }

  await connection.end();
}

migrateSpecificUsers().catch(console.error);