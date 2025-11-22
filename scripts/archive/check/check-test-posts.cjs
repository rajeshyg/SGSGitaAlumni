const mysql = require('mysql2/promise');

async function check() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'sgs_gita_alumni_test'
  });
  const [rows] = await conn.query('SELECT id, title, status, created_at FROM POSTINGS WHERE title LIKE "E2E Test Posting%" ORDER BY created_at DESC LIMIT 10');
  console.log('Test posts:', rows);
  await conn.end();
}

check();