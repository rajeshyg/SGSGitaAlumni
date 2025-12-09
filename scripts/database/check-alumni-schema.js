/**
 * Check alumni_members schema
 */
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function checkAlumniSchema() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    const [columns] = await connection.query(`
      SELECT 
        column_name, 
        data_type, 
        column_type,
        is_nullable,
        column_default,
        ordinal_position
      FROM information_schema.columns 
      WHERE table_schema = ? 
      AND table_name = 'alumni_members' 
      ORDER BY ordinal_position
    `, [process.env.DB_NAME]);

    console.log('=== ALUMNI_MEMBERS SCHEMA ===\n');
    columns.forEach(c => {
      console.log(`${c.ordinal_position}. ${c.column_name}`);
      console.log(`   Type: ${c.column_type}`);
      console.log(`   Nullable: ${c.is_nullable}`);
      console.log('');
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    if (connection) await connection.end();
  }
}

checkAlumniSchema();
