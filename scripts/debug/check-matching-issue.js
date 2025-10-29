/**
 * Debug script to check posting matching issues
 * 
 * Checks:
 * 1. User preferences for harshayarlagadda.2@gmail.com
 * 2. Domain hierarchy
 * 3. Posting domains
 * 4. Why matching is not working
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

async function checkMatchingIssue() {
  try {
    console.log('\n🔍 CHECKING POSTING MATCHING ISSUE\n');
    console.log('=' .repeat(80));

    // 1. Get user ID from email
    console.log('\n1️⃣ Finding user...');
    const [users] = await pool.query(`
      SELECT id, first_name, last_name, email
      FROM app_users
      WHERE email = ?
    `, ['harshayarlagadda2@gmail.com']);

    if (users.length === 0) {
      console.log('❌ User not found!');
      return;
    }

    const user = users[0];
    console.log(`✅ Found user: ${user.first_name} ${user.last_name} (${user.id})`);

    // 2. Get user preferences
    console.log('\n2️⃣ Checking user preferences...');
    const [prefs] = await pool.query(`
      SELECT 
        id,
        user_id,
        primary_domain_id,
        secondary_domain_ids,
        areas_of_interest_ids
      FROM USER_PREFERENCES
      WHERE user_id = ?
    `, [user.id]);

    if (prefs.length === 0) {
      console.log('❌ No preferences found for user!');
      return;
    }

    const pref = prefs[0];
    console.log('✅ Found preferences:');
    console.log('   Primary Domain ID:', pref.primary_domain_id);
    console.log('   Secondary Domain IDs (raw):', pref.secondary_domain_ids);
    console.log('   Areas of Interest IDs (raw):', pref.areas_of_interest_ids);

    // Parse JSON fields
    let secondaryIds = [];
    let areaIds = [];

    if (pref.secondary_domain_ids) {
      if (Buffer.isBuffer(pref.secondary_domain_ids)) {
        secondaryIds = JSON.parse(pref.secondary_domain_ids.toString());
      } else if (typeof pref.secondary_domain_ids === 'string') {
        secondaryIds = JSON.parse(pref.secondary_domain_ids);
      } else if (Array.isArray(pref.secondary_domain_ids)) {
        secondaryIds = pref.secondary_domain_ids;
      }
    }

    if (pref.areas_of_interest_ids) {
      if (Buffer.isBuffer(pref.areas_of_interest_ids)) {
        areaIds = JSON.parse(pref.areas_of_interest_ids.toString());
      } else if (typeof pref.areas_of_interest_ids === 'string') {
        areaIds = JSON.parse(pref.areas_of_interest_ids);
      } else if (Array.isArray(pref.areas_of_interest_ids)) {
        areaIds = pref.areas_of_interest_ids;
      }
    }

    console.log('   Secondary Domain IDs (parsed):', secondaryIds);
    console.log('   Areas of Interest IDs (parsed):', areaIds);

    // 3. Get domain names
    console.log('\n3️⃣ Resolving domain names...');
    
    if (pref.primary_domain_id) {
      const [primaryDomain] = await pool.query(`
        SELECT id, name, domain_level, parent_domain_id
        FROM DOMAINS
        WHERE id = ?
      `, [pref.primary_domain_id]);
      console.log('   Primary Domain:', primaryDomain[0]?.name || 'NOT FOUND');
    }

    if (secondaryIds.length > 0) {
      const placeholders = secondaryIds.map(() => '?').join(',');
      const [secondaryDomains] = await pool.query(`
        SELECT id, name, domain_level, parent_domain_id
        FROM DOMAINS
        WHERE id IN (${placeholders})
      `, secondaryIds);
      console.log('   Secondary Domains:');
      secondaryDomains.forEach(d => console.log(`     - ${d.name} (${d.domain_level})`));
    }

    if (areaIds.length > 0) {
      const placeholders = areaIds.map(() => '?').join(',');
      const [areaDomains] = await pool.query(`
        SELECT id, name, domain_level, parent_domain_id
        FROM DOMAINS
        WHERE id IN (${placeholders})
      `, areaIds);
      console.log('   Areas of Interest:');
      areaDomains.forEach(d => console.log(`     - ${d.name} (${d.domain_level})`));
    }

    // 4. Build matching domain set (same logic as API)
    console.log('\n4️⃣ Building matching domain set...');
    const matchingDomainIds = new Set();

    if (pref.primary_domain_id) matchingDomainIds.add(pref.primary_domain_id);
    secondaryIds.forEach(id => matchingDomainIds.add(id));
    areaIds.forEach(id => matchingDomainIds.add(id));

    // Get children of primary domain
    if (pref.primary_domain_id) {
      const [primaryChildren] = await pool.query(`
        SELECT id, name FROM DOMAINS
        WHERE parent_domain_id = ? OR
              parent_domain_id IN (SELECT id FROM DOMAINS WHERE parent_domain_id = ?)
      `, [pref.primary_domain_id, pref.primary_domain_id]);
      console.log(`   Primary domain children: ${primaryChildren.length}`);
      primaryChildren.forEach(child => {
        matchingDomainIds.add(child.id);
        console.log(`     - ${child.name}`);
      });
    }

    // Get children of secondary domains
    if (secondaryIds.length > 0) {
      const placeholders = secondaryIds.map(() => '?').join(',');
      const [secondaryChildren] = await pool.query(`
        SELECT id, name FROM DOMAINS
        WHERE parent_domain_id IN (${placeholders})
      `, secondaryIds);
      console.log(`   Secondary domain children: ${secondaryChildren.length}`);
      secondaryChildren.forEach(child => {
        matchingDomainIds.add(child.id);
        console.log(`     - ${child.name}`);
      });
    }

    console.log(`\n   ✅ Total matching domain IDs: ${matchingDomainIds.size}`);
    console.log('   Matching IDs:', Array.from(matchingDomainIds));

    // 5. Check active postings
    console.log('\n5️⃣ Checking active postings...');
    const [allPostings] = await pool.query(`
      SELECT 
        p.id,
        p.title,
        p.posting_type,
        p.status,
        u.first_name,
        u.last_name
      FROM POSTINGS p
      LEFT JOIN app_users u ON p.author_id = u.id
      WHERE p.status IN ('active', 'approved')
      ORDER BY p.created_at DESC
      LIMIT 10
    `);

    console.log(`   Total active postings (showing first 10): ${allPostings.length}`);
    
    for (const posting of allPostings) {
      console.log(`\n   📄 Posting: ${posting.title}`);
      console.log(`      ID: ${posting.id}`);
      console.log(`      Type: ${posting.posting_type}`);
      console.log(`      Author: ${posting.first_name || 'null'} ${posting.last_name || 'null'}`);
      
      // Get posting domains
      const [postingDomains] = await pool.query(`
        SELECT d.id, d.name, d.domain_level
        FROM POSTING_DOMAINS pd
        JOIN DOMAINS d ON pd.domain_id = d.id
        WHERE pd.posting_id = ?
      `, [posting.id]);

      console.log(`      Domains (${postingDomains.length}):`);
      postingDomains.forEach(d => {
        const matches = matchingDomainIds.has(d.id);
        console.log(`        ${matches ? '✅' : '❌'} ${d.name} (${d.domain_level}) - ID: ${d.id}`);
      });

      // Check if this posting should match
      const shouldMatch = postingDomains.some(d => matchingDomainIds.has(d.id));
      console.log(`      Should match user preferences: ${shouldMatch ? '✅ YES' : '❌ NO'}`);
    }

    // 6. Run the actual matching query
    console.log('\n6️⃣ Running actual matching query...');
    const domainPlaceholders = Array.from(matchingDomainIds).map(() => '?').join(',');
    const [matchedPostings] = await pool.query(`
      SELECT DISTINCT
        p.id,
        p.title,
        p.posting_type
      FROM POSTINGS p
      INNER JOIN POSTING_DOMAINS pd ON p.id = pd.posting_id
      WHERE pd.domain_id IN (${domainPlaceholders})
        AND p.status IN ('active', 'approved')
      ORDER BY p.created_at DESC
      LIMIT 10
    `, Array.from(matchingDomainIds));

    console.log(`   ✅ Matched postings: ${matchedPostings.length}`);
    matchedPostings.forEach(p => {
      console.log(`      - ${p.title} (${p.posting_type})`);
    });

    // 7. Check author NULL issue
    console.log('\n7️⃣ Checking author NULL issue...');
    const [postingsWithNullAuthor] = await pool.query(`
      SELECT 
        p.id,
        p.title,
        p.author_id,
        u.first_name,
        u.last_name
      FROM POSTINGS p
      LEFT JOIN app_users u ON p.author_id = u.id
      WHERE p.status IN ('active', 'approved')
        AND (u.first_name IS NULL OR u.last_name IS NULL)
      LIMIT 5
    `);

    console.log(`   Postings with NULL authors: ${postingsWithNullAuthor.length}`);
    postingsWithNullAuthor.forEach(p => {
      console.log(`      - ${p.title}`);
      console.log(`        Author ID: ${p.author_id || 'NULL'}`);
      console.log(`        First Name: ${p.first_name || 'NULL'}`);
      console.log(`        Last Name: ${p.last_name || 'NULL'}`);
    });

    console.log('\n' + '='.repeat(80));
    console.log('✅ Diagnostic complete!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

checkMatchingIssue();

