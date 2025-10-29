import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

async function check() {
  try {
    const [postings] = await pool.query(`
      SELECT p.id, p.title, p.status, COUNT(pd.domain_id) as domain_count
      FROM POSTINGS p
      LEFT JOIN POSTING_DOMAINS pd ON p.id = pd.posting_id
      WHERE p.status = 'active'
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `);

    console.log(`\nFound ${postings.length} active postings:\n`);
    postings.forEach((p, i) => {
      console.log(`${i+1}. ${p.title}`);
      console.log(`   ID: ${p.id.substring(0, 8)}... (${p.domain_count} domains)`);
    });

  } catch (err) {
    console.error('ERROR:', err);
  } finally {
    await pool.end();
  }
}

check();
