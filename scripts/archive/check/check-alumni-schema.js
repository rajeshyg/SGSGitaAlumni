import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function checkSchema() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT || '3306'),
  });
  
  const [columns] = await connection.execute(`
    SHOW COLUMNS FROM alumni_members
  `);
  
  console.log('\n📋 alumni_members table columns:\n');
  columns.forEach(col => {
    console.log(`  - ${col.Field} (${col.Type})`);
  });
  
  await connection.end();
}

checkSchema();
