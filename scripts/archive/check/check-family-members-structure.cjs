const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkFamilyMembersStructure() {
  let connection;

  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      charset: 'utf8mb4'
    });

    console.log('🔍 Checking FAMILY_MEMBERS table structure...\n');

    // Get table structure
    const [columns] = await connection.query(
      `DESCRIBE FAMILY_MEMBERS`
    );

    console.log('FAMILY_MEMBERS columns:');
    columns.forEach(col => {
      console.log(`  - ${col.Field}: ${col.Type} (${col.Null}, ${col.Key}, ${col.Default}, ${col.Extra})`);
    });

    // Check collation of key columns
    const [collationInfo] = await connection.query(
      `SELECT COLUMN_NAME, COLLATION_NAME, COLUMN_TYPE
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'FAMILY_MEMBERS'`,
      [process.env.DB_NAME]
    );

    console.log('\nFAMILY_MEMBERS collations:');
    collationInfo.forEach(col => {
      console.log(`  - ${col.COLUMN_NAME} (${col.COLUMN_TYPE}): ${col.COLLATION_NAME || 'NULL'}`);
    });

  } catch (error) {
    console.error('Database error:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkFamilyMembersStructure();