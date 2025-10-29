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
    const postingIds = [
      '410c3981-cb0e-44d5-8f52-2a6ded24ad83', // Data Science mentorship
      '67fe301e-09f6-4e15-bc10-64574863523a'  // Product Management internship
    ];

    for (const postingId of postingIds) {
      const [postings] = await pool.query('SELECT id, title, content, posting_type FROM POSTINGS WHERE id = ?', [postingId]);
      
      if (postings.length === 0) continue;
      
      const posting = postings[0];
      
      console.log('\n' + '='.repeat(80));
      console.log(`POSTING: ${posting.title}`);
      console.log('='.repeat(80));
      console.log(`Type: ${posting.posting_type}`);
      console.log(`\nContent:\n${posting.content}`);
      
      const [domains] = await pool.query(`
        SELECT d.id, d.name, d.domain_level
        FROM POSTING_DOMAINS pd
        JOIN DOMAINS d ON pd.domain_id = d.id
        WHERE pd.posting_id = ?
      `, [postingId]);
      
      console.log(`\nDomains (${domains.length}):`);
      domains.forEach(d => console.log(`  - ${d.name} [${d.domain_level}]`));
      console.log('\n');
    }

  } catch (err) {
    console.error('ERROR:', err);
  } finally {
    await pool.end();
  }
}

check();
