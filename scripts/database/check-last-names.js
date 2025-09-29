import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function checkLastNames() {
  let connection;

  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: parseInt(process.env.DB_PORT || '3306')
    });

    console.log('🔍 Checking for specific last names in raw_csv_uploads...\n');

    const firstNames = ['Sannidhi', 'Sriharsha'];

    for (const firstName of firstNames) {
      // Search in Name field (first name)
      const [rows] = await connection.execute(
        `SELECT
          JSON_UNQUOTE(JSON_EXTRACT(ROW_DATA, "$.Name")) as first_name,
          JSON_UNQUOTE(JSON_EXTRACT(ROW_DATA, "$.FamilyName")) as last_name,
          JSON_UNQUOTE(JSON_EXTRACT(ROW_DATA, "$.Email")) as email
         FROM raw_csv_uploads
         WHERE JSON_EXTRACT(ROW_DATA, "$.Name") LIKE ?`,
        [`%${firstName}%`]
      );

      console.log(`First name '${firstName}': ${rows.length} records`);
      if (rows.length > 0) {
        rows.forEach(row => {
          console.log(`  - ${row.first_name} ${row.last_name} (${row.email})`);
        });
      }
      console.log('');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkLastNames();