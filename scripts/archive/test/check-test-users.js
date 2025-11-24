import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const connection = await mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

const [users] = await connection.execute(
  'SELECT id, email, first_name, last_name FROM app_users WHERE id IN (2, 10025) ORDER BY id'
);

console.log('Test Users:');
users.forEach(u => {
  console.log(`  ID: ${u.id}, Email: ${u.email}, Name: ${u.first_name} ${u.last_name}`);
});

await connection.end();
