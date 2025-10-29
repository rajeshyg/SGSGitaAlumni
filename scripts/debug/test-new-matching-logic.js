/**
 * Test the NEW matching logic (Areas of Interest only)
 * This directly queries using the new backend logic
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function testNewMatching() {
  try {
    const userId = 10025;
    
    console.log('\n🧪 TESTING NEW MATCHING LOGIC (Areas of Interest ONLY)\n');
    console.log('=' .repeat(80));

    // 1. Get user preferences
    const [prefs] = await pool.query(`
      SELECT primary_domain_id, secondary_domain_ids, areas_of_interest_ids
      FROM USER_PREFERENCES
      WHERE user_id = ?
    `, [userId]);

    if (prefs.length === 0) {
      console.log('❌ No preferences found');
      return;
    }

    const pref = prefs[0];
    const primaryDomainId = pref.primary_domain_id;
    
    let secondaryDomainIds = [];
    if (pref.secondary_domain_ids) {
      const raw = pref.secondary_domain_ids;
      if (Array.isArray(raw)) {
        secondaryDomainIds = raw;
      } else if (Buffer.isBuffer(raw)) {
        secondaryDomainIds = JSON.parse(raw.toString());
      } else if (typeof raw === 'string') {
        secondaryDomainIds = JSON.parse(raw);
      } else if (typeof raw === 'object') {
        // MySQL2 returns JSON as object
        secondaryDomainIds = Object.values(raw);
      }
    }
    
    let areasOfInterestIds = [];
    if (pref.areas_of_interest_ids) {
      const raw = pref.areas_of_interest_ids;
      if (Array.isArray(raw)) {
        areasOfInterestIds = raw;
      } else if (Buffer.isBuffer(raw)) {
        areasOfInterestIds = JSON.parse(raw.toString());
      } else if (typeof raw === 'string') {
        areasOfInterestIds = JSON.parse(raw);
      } else if (typeof raw === 'object') {
        // MySQL2 returns JSON as object
        areasOfInterestIds = Object.values(raw);
      }
    }

    console.log('✅ User Preferences Retrieved:\n');

    // Get domain names
    const [primaryDomain] = await pool.query('SELECT name FROM DOMAINS WHERE id = ?', [primaryDomainId]);
    console.log('   PRIMARY:', primaryDomain[0].name);

    if (secondaryDomainIds.length > 0) {
      const [secondary] = await pool.query(`
        SELECT name FROM DOMAINS WHERE id IN (${secondaryDomainIds.map(() => '?').join(',')})
      `, secondaryDomainIds);
      console.log('   SECONDARY:', secondary.map(d => d.name).join(', '));
    }

    if (areasOfInterestIds.length > 0) {
      const [interests] = await pool.query(`
        SELECT name FROM DOMAINS WHERE id IN (${areasOfInterestIds.map(() => '?').join(',')})
      `, areasOfInterestIds);
      console.log('   AREAS OF INTEREST:', interests.map(d => d.name).join(', '));
    }

    // 2. Apply NEW matching logic (Areas of Interest ONLY)
    console.log('\n📊 NEW MATCHING STRATEGY:\n');
    const matchingDomainIds = new Set();

    // ONLY use Areas of Interest
    areasOfInterestIds.forEach(id => matchingDomainIds.add(id));

    if (matchingDomainIds.size === 0 && secondaryDomainIds.length > 0) {
      console.log('   ⚠️  No Areas of Interest → Fallback to Secondary domains');
      secondaryDomainIds.forEach(id => matchingDomainIds.add(id));
    }

    if (matchingDomainIds.size === 0 && primaryDomainId) {
      console.log('   ⚠️  No Secondary domains → Fallback to Primary domain');
      matchingDomainIds.add(primaryDomainId);
    }

    console.log(`   ✅ Matching on ${matchingDomainIds.size} domain(s) (Areas of Interest level)`);

    // Get names
    const matchingArray = Array.from(matchingDomainIds);
    const [matchingDomains] = await pool.query(`
      SELECT name FROM DOMAINS WHERE id IN (${matchingArray.map(() => '?').join(',')})
    `, matchingArray);
    
    console.log('\n   📌 Domains used for matching:');
    matchingDomains.forEach(d => {
      console.log(`      - ${d.name}`);
    });

    // 3. Find matched postings
    console.log('\n\n3️⃣ MATCHED POSTINGS:\n');

    const [matchedPostings] = await pool.query(`
      SELECT DISTINCT p.id, p.title
      FROM POSTINGS p
      INNER JOIN POSTING_DOMAINS pd ON p.id = pd.posting_id
      WHERE pd.domain_id IN (${matchingArray.map(() => '?').join(',')})
        AND p.status IN ('active', 'approved')
      ORDER BY p.created_at DESC
    `, matchingArray);

    console.log(`Found ${matchedPostings.length} matched posting(s):\n`);

    for (const posting of matchedPostings) {
      console.log(`✅ "${posting.title}"`);
      
      // Show which domains match
      const [postingDomains] = await pool.query(`
        SELECT d.id, d.name
        FROM POSTING_DOMAINS pd
        JOIN DOMAINS d ON pd.domain_id = d.id
        WHERE pd.posting_id = ?
      `, [posting.id]);

      const matchedDomains = postingDomains.filter(d => matchingDomainIds.has(d.id));
      console.log(`   Matched on: ${matchedDomains.map(d => d.name).join(', ')}\n`);
    }

    // 4. Show non-matched postings
    console.log('\n4️⃣ NON-MATCHED POSTINGS:\n');

    const [allPostings] = await pool.query(`
      SELECT id, title
      FROM POSTINGS
      WHERE status IN ('active', 'approved')
        AND id NOT IN (${matchedPostings.map(() => '?').join(',')})
    `, matchedPostings.map(p => p.id));

    console.log(`Found ${allPostings.length} non-matched posting(s):\n`);

    for (const posting of allPostings) {
      console.log(`❌ "${posting.title}"`);
      
      const [postingDomains] = await pool.query(`
        SELECT d.name
        FROM POSTING_DOMAINS pd
        JOIN DOMAINS d ON pd.domain_id = d.id
        WHERE pd.posting_id = ?
      `, [posting.id]);

      console.log(`   Has domains: ${postingDomains.map(d => d.name).join(', ')}\n`);
    }

    console.log('=' .repeat(80));
    console.log('\n✅ NEW MATCHING LOGIC SUMMARY:\n');
    console.log(`   - Matching ONLY on Areas of Interest (${matchingDomainIds.size} domains)`);
    console.log(`   - ${matchedPostings.length} postings matched`);
    console.log(`   - ${allPostings.length} postings did NOT match`);
    console.log('\n   This is MORE PRECISE than the old hierarchy expansion!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

testNewMatching();
