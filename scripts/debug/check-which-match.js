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
    const userId = 10025;

    // Get user interests
    const [prefs] = await pool.query('SELECT areas_of_interest_ids FROM USER_PREFERENCES WHERE user_id = ?', [userId]);
    let interestIds = [];
    if (prefs[0]?.areas_of_interest_ids) {
      const raw = prefs[0].areas_of_interest_ids;
      if (Array.isArray(raw)) interestIds = raw;
      else if (Buffer.isBuffer(raw)) interestIds = JSON.parse(raw.toString());
      else if (typeof raw === 'string') interestIds = JSON.parse(raw);
      else if (typeof raw === 'object') interestIds = Object.values(raw);
    }

    const [interests] = await pool.query(`SELECT id, name FROM DOMAINS WHERE id IN (${interestIds.map(()=>'?').join(',')})`, interestIds);
    
    console.log('\nUSER AREAS OF INTEREST:');
    interests.forEach(i => console.log(`  - ${i.name} (${i.id})`));

    // Get all postings
    const [postings] = await pool.query(`
      SELECT p.id, p.title
      FROM POSTINGS p
      WHERE p.status IN ('active', 'approved')
    `);

    console.log(`\n\nCHECKING ${postings.length} POSTINGS:\n`);

    for (const posting of postings) {
      const [domains] = await pool.query(`
        SELECT d.id, d.name
        FROM POSTING_DOMAINS pd
        JOIN DOMAINS d ON pd.domain_id = d.id
        WHERE pd.posting_id = ?
      `, [posting.id]);

      const matches = domains.filter(d => interestIds.includes(d.id));
      
      if (matches.length > 0) {
        console.log(`✅ MATCH: ${posting.title}`);
        matches.forEach(m => console.log(`   Matched on: ${m.name}`));
      } else {
        console.log(`❌ NO MATCH: ${posting.title}`);
        console.log(`   Has: ${domains.map(d => d.name).join(', ')}`);
      }
      console.log('');
    }

  } catch (err) {
    console.error('ERROR:', err);
  } finally {
    await pool.end();
  }
}

check();
