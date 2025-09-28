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

async function checkInvitationsTable() {
  try {
    const connection = await pool.getConnection();

    // Check if USER_INVITATIONS table exists
    const [tables] = await connection.execute(
      "SHOW TABLES LIKE 'USER_INVITATIONS'"
    );

    if (tables.length === 0) {
      console.log('USER_INVITATIONS table does not exist');
      connection.release();
      return;
    }

    console.log('USER_INVITATIONS table exists. Columns:');
    const [rows] = await connection.execute('DESCRIBE USER_INVITATIONS');
    rows.forEach(row => {
      console.log(`- ${row.Field}: ${row.Type} (${row.Null === 'YES' ? 'NULL' : 'NOT NULL'})`);
    });

    connection.release();
  } catch (error) {
    console.error('Error checking invitations table:', error);
  } finally {
    await pool.end();
  }
}

checkInvitationsTable();