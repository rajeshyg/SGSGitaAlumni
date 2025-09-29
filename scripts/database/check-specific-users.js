import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function checkSpecificUsers() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306
  });

  console.log('🔍 Checking for users with specific last names...\n');

  const lastNames = ['vadivel', 'yarlagadda', 'varanasi', 'dola'];

  for (const lastName of lastNames) {
    console.log(`=== Checking for "${lastName}" ===`);

    // Check alumni_members for these last names
    const [rows] = await connection.execute(
      'SELECT COUNT(*) as count FROM alumni_members WHERE LOWER(last_name) = ?',
      [lastName.toLowerCase()]
    );
    console.log(`📊 alumni_members: ${rows[0].count} records`);

    // Check raw_csv_uploads for these names (case insensitive search)
    const [rawRows] = await connection.execute(
      'SELECT COUNT(*) as count FROM raw_csv_uploads WHERE LOWER(row_data) LIKE ?',
      [`%${lastName.toLowerCase()}%`]
    );
    console.log(`📄 raw_csv_uploads: ${rawRows[0].count} records`);

    // Show sample data if found
    if (rows[0].count > 0) {
      const [samples] = await connection.execute(
        'SELECT id, first_name, last_name, email FROM alumni_members WHERE LOWER(last_name) = ? LIMIT 3',
        [lastName.toLowerCase()]
      );
      console.log('Sample alumni_members data:');
      samples.forEach(row => {
        console.log(`  - ${row.first_name} ${row.last_name} (${row.email})`);
      });
    }

    // Show sample raw data if found
    if (rawRows[0].count > 0) {
      const [rawSamples] = await connection.execute(
        'SELECT id, LEFT(row_data, 200) as sample_data FROM raw_csv_uploads WHERE LOWER(row_data) LIKE ? LIMIT 2',
        [`%${lastName.toLowerCase()}%`]
      );
      console.log('Sample raw_csv_uploads data:');
      rawSamples.forEach(row => {
        console.log(`  - ID ${row.id}: ${row.sample_data}...`);
      });
    }

    console.log('');
  }

  await connection.end();
}

checkSpecificUsers().catch(console.error);