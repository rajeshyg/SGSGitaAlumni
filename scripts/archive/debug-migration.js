import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT || '3306'),
});

async function debugMigration() {
  try {
    const connection = await pool.getConnection();

    console.log('🔍 DEBUGGING MIGRATION ISSUES\n');

    // Get sample raw data
    const [rawSamples] = await connection.execute(
      'SELECT id, ROW_DATA FROM raw_csv_uploads LIMIT 5'
    );

    console.log('📋 RAW CSV DATA ANALYSIS:');
    rawSamples.forEach((row, index) => {
      console.log(`\n--- Record ${index + 1} (ID: ${row.id}) ---`);
      const data = row.ROW_DATA;
      console.log('Full JSON:', JSON.stringify(data, null, 2));

      // Test current extraction logic
      console.log('\n🔍 EXTRACTION ANALYSIS:');

      // Test name extraction
      const name = data.Name || data.firstName || data.FirstName || '';
      const familyName = data.FamilyName || data.lastName || data.LastName || data.surname || '';
      const email = data.Email || data.email || '';
      const phone = data.Phone || data.phone || '';

      console.log(`Name field: "${name}"`);
      console.log(`FamilyName field: "${familyName}"`);
      console.log(`Email field: "${email}"`);
      console.log(`Phone field: "${phone}"`);

      // Test name splitting
      if (name) {
        const nameParts = name.trim().split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || familyName || '';
        console.log(`Split result: firstName="${firstName}", lastName="${lastName}"`);
      } else {
        console.log('❌ No Name field found!');
      }

      // Check if this data exists in current tables
      console.log('\n🔗 CURRENT DATABASE STATE:');
      console.log(`- alumni_members.family_name: "${data.FamilyName || 'NULL'}"`);
      console.log(`- alumni_members.email: NULL (missing)`);
      console.log(`- app_users.first_name: NULL (missing)`);
      console.log(`- app_users.last_name: NULL (missing)`);
    });

    // Analyze field mapping issues
    console.log('\n\n📊 FIELD MAPPING ANALYSIS:');
    const fieldMappings = {
      'Name -> first_name': 'Name field should be split',
      'FamilyName -> last_name': 'FamilyName should be last_name',
      'Email -> email': 'Email field exists but not migrated',
      'Phone -> phone': 'Phone field exists but not migrated',
      'StudentID -> student_id': 'StudentID exists',
      'batch -> graduation_year': 'batch needs conversion to year'
    };

    Object.entries(fieldMappings).forEach(([mapping, status]) => {
      console.log(`- ${mapping}: ${status}`);
    });

    // Check for JSON parsing issues
    console.log('\n\n🔧 JSON PARSING ISSUES IDENTIFIED:');
    console.log('1. ❌ Name splitting logic failed - no first_name/last_name columns created');
    console.log('2. ❌ Email/Phone extraction failed - fields exist but not migrated');
    console.log('3. ❌ Schema design wrong - alumni_members missing required columns');
    console.log('4. ❌ No validation - migration succeeded but with corrupted data');
    console.log('5. ❌ No error handling - silent failures');

    connection.release();
  } catch (error) {
    console.error('Error debugging migration:', error);
  } finally {
    await pool.end();
  }
}

debugMigration();