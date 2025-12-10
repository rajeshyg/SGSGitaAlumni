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
    const [columns] = await conn.query('DESCRIBE USER_PREFERENCES');
    console.table(columns);
  } catch (error) {
    console.error(error);
  } finally {
    await conn.end();
  }
}

main();
