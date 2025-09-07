import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function checkTableStructure() {
  let connection;

  try {
    console.log('🔍 Checking structure of raw_csv_uploads table...');

    const config = {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: parseInt(process.env.DB_PORT || '3306'),
      connectTimeout: 60000,
    };

    connection = await mysql.createConnection(config);
    console.log('✅ Connected to database successfully!');

    // Describe the table structure
    console.log('📋 Table structure:');
    const [columns] = await connection.execute('DESCRIBE raw_csv_uploads');
    console.log('Columns:');
    columns.forEach((column, index) => {
      console.log(`  ${index + 1}. ${column.Field} - ${column.Type} ${column.Null === 'NO' ? 'NOT NULL' : ''} ${column.Key ? `(${column.Key})` : ''} ${column.Default ? `DEFAULT ${column.Default}` : ''}`);
    });

    // Check if there's any data
    console.log('\n📊 Checking for data...');
    const [countResult] = await connection.execute('SELECT COUNT(*) as total FROM raw_csv_uploads');
    const totalRecords = countResult[0].total;
    console.log(`Total records: ${totalRecords}`);

    if (totalRecords > 0) {
      // Show a sample of the data
      console.log('\n📝 Sample data (first 3 rows):');
      const [sampleData] = await connection.execute('SELECT * FROM raw_csv_uploads LIMIT 3');
      sampleData.forEach((row, index) => {
        console.log(`Row ${index + 1}:`, row);
      });
    }

    await connection.end();
    console.log('🔌 Connection closed.');

  } catch (error) {
    console.error('❌ Database operation failed:', error.message);
  }
}

checkTableStructure();