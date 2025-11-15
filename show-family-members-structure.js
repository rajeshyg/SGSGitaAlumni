// Show FAMILY_MEMBERS table structure
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function showFamilyMembersStructure() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'sgsgitaalumni'
  });

  try {
    console.log('\n=== FAMILY_MEMBERS Table Structure ===\n');
    
    const [columns] = await connection.execute(
      `DESCRIBE FAMILY_MEMBERS`
    );
    
    console.log('Columns:');
    columns.forEach(col => {
      console.log(`  - ${col.Field} (${col.Type}) ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Key} ${col.Extra}`);
    });
    
    // Show sample data
    console.log('\n=== Sample Data ===\n');
    const [rows] = await connection.execute(
      `SELECT * FROM FAMILY_MEMBERS LIMIT 5`
    );
    
    if (rows.length > 0) {
      console.log('Sample records:', JSON.stringify(rows, null, 2));
    } else {
      console.log('No records found');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

showFamilyMembersStructure();
