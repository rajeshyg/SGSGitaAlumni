import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function checkRawDataFormat() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306
  });

  console.log('🔍 Checking raw_csv_uploads data format...\n');

  // Check a few records to see the actual data format
  const [rows] = await connection.execute(
    'SELECT id, row_data FROM raw_csv_uploads WHERE id IN (2, 414, 459, 690, 2446) LIMIT 5'
  );

  rows.forEach((row, index) => {
    console.log(`Record ${index + 1} (ID: ${row.id}):`);
    console.log(`Type: ${typeof row.row_data}`);

    if (typeof row.row_data === 'string') {
      console.log(`Length: ${row.row_data.length}`);
      console.log(`Data: ${row.row_data.substring(0, 300)}...`);

      // Try to parse as JSON
      try {
        const parsed = JSON.parse(row.row_data);
        console.log(`✅ Successfully parsed as JSON: ${JSON.stringify(parsed).substring(0, 200)}...`);
      } catch (error) {
        console.log(`❌ JSON parse failed: ${error.message}`);
      }
    } else {
      // It's already an object
      console.log(`Data (object): ${JSON.stringify(row.row_data).substring(0, 300)}...`);
      console.log(`✅ Already an object with keys: ${Object.keys(row.row_data).join(', ')}`);
    }

    console.log('---');
  });

  await connection.end();
}

checkRawDataFormat().catch(console.error);