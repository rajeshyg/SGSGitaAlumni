import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    const [columns] = await conn.query('DESCRIBE POSTINGS');
    console.table(columns);

    const [constraints] = await conn.query(`
      SELECT 
          TABLE_NAME, 
          CONSTRAINT_NAME, 
          COLUMN_NAME, 
          REFERENCED_TABLE_NAME, 
          REFERENCED_COLUMN_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
      WHERE TABLE_NAME = 'POSTINGS'
      AND REFERENCED_TABLE_NAME IS NOT NULL
    `);
    console.table(constraints);

  } catch (error) {
    console.error(error);
  } finally {
    await conn.end();
  }
}

main();
