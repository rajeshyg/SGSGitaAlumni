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

async function checkAlumniMembers() {
  try {
    const connection = await pool.getConnection();

    // Describe table
    console.log('🔍 Checking structure of alumni_members table...');
    const [columns] = await connection.execute('DESCRIBE alumni_members');
    console.log('📋 Table structure:');
    console.log('Columns:');
    columns.forEach((col, index) => {
      console.log(`  ${index + 1}. ${col.Field} - ${col.Type} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${col.Key ? `(${col.Key})` : ''}`);
    });

    // Count total records
    const [countResult] = await connection.execute('SELECT COUNT(*) as total FROM alumni_members');
    const totalRecords = countResult[0].total;
    console.log(`\n📊 Total records: ${totalRecords}`);

    // Check for missing names (using available columns)
    const [missingFamilyName] = await connection.execute("SELECT COUNT(*) as count FROM alumni_members WHERE family_name IS NULL OR family_name = ''");
    console.log(`\n❌ Missing family names: ${missingFamilyName[0].count}`);

    // Check if there are any name-related columns
    const nameColumns = columns.filter(col => col.Field.toLowerCase().includes('name'));
    console.log(`\n📋 Name-related columns: ${nameColumns.map(col => col.Field).join(', ')}`);

    // Sample data
    if (totalRecords > 0) {
      const [samples] = await connection.execute('SELECT * FROM alumni_members LIMIT 3');
      console.log('\n📝 Sample data (first 3 rows):');
      samples.forEach((row, index) => {
        console.log(`Row ${index + 1}:`, JSON.stringify(row, null, 2));
      });
    }

    connection.release();
  } catch (error) {
    console.error('Error checking alumni_members table:', error);
  } finally {
    await pool.end();
  }
}

checkAlumniMembers();