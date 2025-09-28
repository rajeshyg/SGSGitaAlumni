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

async function checkForeignKeys() {
  try {
    const connection = await pool.getConnection();

    // Check foreign keys on USER_INVITATIONS table
    console.log('Checking foreign keys on USER_INVITATIONS table:');
    const [fkRows] = await connection.execute(`
      SELECT
        CONSTRAINT_NAME,
        COLUMN_NAME,
        REFERENCED_TABLE_NAME,
        REFERENCED_COLUMN_NAME
      FROM
        INFORMATION_SCHEMA.KEY_COLUMN_USAGE
      WHERE
        TABLE_NAME = 'USER_INVITATIONS'
        AND TABLE_SCHEMA = DATABASE()
        AND REFERENCED_TABLE_NAME IS NOT NULL
    `);

    if (fkRows.length === 0) {
      console.log('No foreign keys found on USER_INVITATIONS table');
    } else {
      fkRows.forEach(row => {
        console.log(`- ${row.CONSTRAINT_NAME}: ${row.COLUMN_NAME} -> ${row.REFERENCED_TABLE_NAME}(${row.REFERENCED_COLUMN_NAME})`);
      });
    }

    // Check enum values for invitation_type
    console.log('\nChecking invitation_type enum values:');
    const [enumRows] = await connection.execute(`
      SELECT COLUMN_TYPE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'USER_INVITATIONS'
        AND COLUMN_NAME = 'invitation_type'
        AND TABLE_SCHEMA = DATABASE()
    `);

    if (enumRows.length > 0) {
      console.log(`invitation_type enum: ${enumRows[0].COLUMN_TYPE}`);
    }

    connection.release();
  } catch (error) {
    console.error('Error checking foreign keys:', error);
  } finally {
    await pool.end();
  }
}

checkForeignKeys();