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

async function checkAppUsers() {
  try {
    const connection = await pool.getConnection();

    // Describe table
    console.log('🔍 Checking structure of app_users table...');
    const [columns] = await connection.execute('DESCRIBE app_users');
    console.log('📋 Table structure:');
    console.log('Columns:');
    columns.forEach((col, index) => {
      console.log(`  ${index + 1}. ${col.Field} - ${col.Type} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${col.Key ? `(${col.Key})` : ''}`);
    });

    // Count total records
    const [countResult] = await connection.execute('SELECT COUNT(*) as total FROM app_users');
    const totalRecords = countResult[0].total;
    console.log(`\n📊 Total records: ${totalRecords}`);

    // Sample data
    if (totalRecords > 0) {
      const [samples] = await connection.execute('SELECT * FROM app_users LIMIT 3');
      console.log('\n📝 Sample data (first 3 rows):');
      samples.forEach((row, index) => {
        console.log(`Row ${index + 1}:`, JSON.stringify(row, null, 2));
      });
    }

    connection.release();
  } catch (error) {
    console.error('Error checking app_users table:', error);
  } finally {
    await pool.end();
  }
}

checkAppUsers();