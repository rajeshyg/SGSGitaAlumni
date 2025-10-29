import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import fetch from 'node-fetch';

dotenv.config();

async function run() {
  const userId = 10025;
  const apiUrl = `http://localhost:${process.env.PORT || 3001}/api/postings/matched/${userId}`;

  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 5
  });

  try {
    // Read user preferences
    const [prefs] = await pool.query('SELECT primary_domain_id, secondary_domain_ids, areas_of_interest_ids FROM USER_PREFERENCES WHERE user_id = ?', [userId]);
    if (!prefs || prefs.length === 0) {
      console.error('No preferences found for user', userId);
      return process.exit(1);
    }

    const pref = prefs[0];
    let interestIds = [];
    if (pref.areas_of_interest_ids) {
      if (Array.isArray(pref.areas_of_interest_ids)) interestIds = pref.areas_of_interest_ids;
      else if (Buffer.isBuffer(pref.areas_of_interest_ids)) interestIds = JSON.parse(pref.areas_of_interest_ids.toString());
      else if (typeof pref.areas_of_interest_ids === 'string') interestIds = JSON.parse(pref.areas_of_interest_ids);
      else if (typeof pref.areas_of_interest_ids === 'object') interestIds = Object.values(pref.areas_of_interest_ids);
    }

    // Resolve interest names
    let interestRows = [];
    if (interestIds.length > 0) {
      const [rows] = await pool.query(`SELECT id, name FROM DOMAINS WHERE id IN (${interestIds.map(()=>'?').join(',')})`, interestIds);
      interestRows = rows;
    }

    console.log('\nUSER AREAS OF INTEREST (from DB):');
    if (interestRows.length === 0) console.log('  (none)');
    interestRows.forEach(r => console.log(`  - ${r.name} (${r.id})`));

    // Fetch API matched postings
    console.log('\nCALLING API:', apiUrl);
    const res = await fetch(apiUrl);
    if (!res.ok) {
      console.error('API returned', res.status, await res.text());
      return process.exit(1);
    }
    const body = await res.json();

    console.log('\nAPI returned postings:', body.postings ? body.postings.length : 0, ' matchedDomains:', body.matchedDomains);

    // For each posting, list domains and check if any domain id or name matches user's interest ids/names
    for (const p of (body.postings||[])) {
      console.log('\nPOSTING:', p.title, '\n  id:', p.id);
      const domains = p.domains || [];
      if (domains.length === 0) console.log('  domains: (none)');
      domains.forEach(d => console.log(`  - ${d.name} (${d.id}) [level:${d.domain_level}]`));

      // Compare by id and by normalized name
      const matchingById = domains.filter(d => interestIds.includes(d.id));
      const interestNames = interestRows.map(r=>r.name.toLowerCase());
      const matchingByName = domains.filter(d => interestNames.includes(d.name.toLowerCase()));

      console.log('  matches by ID:', matchingById.map(m=>m.name));
      console.log('  matches by NAME:', matchingByName.map(m=>m.name));

      if (matchingById.length===0 && matchingByName.length===0) {
        console.log('  => No match to user interests for this posting (both id and name)');
      } else {
        console.log('  => This posting MATCHES user interests');
      }
    }

    // If body.postings empty, warn
    if (!body.postings || body.postings.length===0) console.log('\nNo postings returned by API');

  } catch (err) {
    console.error('ERROR:', err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

run();
