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
    const userInterestIds = [
      '040d54c8-c10b-40c6-a67b-68d3a80f4161', // Product Analytics & Metrics
      '2121d91b-0b8c-4550-bded-ab3ac1412d6f', // Venture Capital & Fundraising
      '9d30bb65-b5ce-43c7-834b-f881323edf40'  // Private Equity & Venture Capital
    ];

    // Find ALL postings that have ANY of these domain IDs
    const [postings] = await pool.query(`
      SELECT DISTINCT p.id, p.title, p.status
      FROM POSTINGS p
      INNER JOIN POSTING_DOMAINS pd ON p.id = pd.posting_id
      WHERE pd.domain_id IN (?, ?, ?)
    `, userInterestIds);

    console.log(`\nFound ${postings.length} postings with user's domain IDs:\n`);
    
    postings.forEach(p => {
      console.log(`  ${p.status === 'active' ? '✅' : '⚠️'} ${p.title} (${p.status})`);
      console.log(`     ID: ${p.id}`);
    });

    console.log('\n');

    // Now check which domains each posting has
    for (const posting of postings) {
      if (posting.status !== 'active') continue;
      
      const [domains] = await pool.query(`
        SELECT d.id, d.name
        FROM POSTING_DOMAINS pd
        JOIN DOMAINS d ON pd.domain_id = d.id
        WHERE pd.posting_id = ?
      `, [posting.id]);

      console.log(`\n${posting.title}:`);
      domains.forEach(d => {
        const matched = userInterestIds.includes(d.id);
        console.log(`  ${matched ? '🎯' : '  '} ${d.name}`);
      });
    }

  } catch (err) {
    console.error('ERROR:', err);
  } finally {
    await pool.end();
  }
}

check();
