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
    const [rows] = await conn.query('SHOW CREATE TABLE POSTINGS');
    console.log(rows[0]['Create Table']);
  } catch (error) {
    console.error(error);
  } finally {
    await conn.end();
  }
}

main();
