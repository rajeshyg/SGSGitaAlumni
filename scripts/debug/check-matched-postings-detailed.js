/**
 * Detailed diagnostic for matched postings issue
 * Shows exactly what domains are being matched and why
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

async function diagnose() {
  try {
    const userId = 10025; // harshayarlagadda2@gmail.com
    
    console.log('\n🔍 DETAILED MATCHED POSTINGS DIAGNOSTIC\n');
    console.log('=' .repeat(80));

    // 1. Get user's preferences
    console.log('\n1️⃣ User Preferences:');
    const [prefs] = await pool.query(`
      SELECT 
        primary_domain_id,
        secondary_domain_ids,
        areas_of_interest_ids
      FROM USER_PREFERENCES
      WHERE user_id = ?
    `, [userId]);

    if (prefs.length === 0) {
      console.log('❌ No preferences found');
      return;
    }

    const pref = prefs[0];
    const primaryDomainId = pref.primary_domain_id;
    
    // Handle both string and JSON array formats
    let secondaryDomainIds = [];
    if (pref.secondary_domain_ids) {
      if (typeof pref.secondary_domain_ids === 'string') {
        if (pref.secondary_domain_ids.startsWith('[')) {
          secondaryDomainIds = JSON.parse(pref.secondary_domain_ids);
        } else {
          secondaryDomainIds = pref.secondary_domain_ids.split(',').filter(Boolean);
        }
      } else if (Array.isArray(pref.secondary_domain_ids)) {
        secondaryDomainIds = pref.secondary_domain_ids;
      }
    }
    
    let areasOfInterestIds = [];
    if (pref.areas_of_interest_ids) {
      if (typeof pref.areas_of_interest_ids === 'string') {
        if (pref.areas_of_interest_ids.startsWith('[')) {
          areasOfInterestIds = JSON.parse(pref.areas_of_interest_ids);
        } else {
          areasOfInterestIds = pref.areas_of_interest_ids.split(',').filter(Boolean);
        }
      } else if (Array.isArray(pref.areas_of_interest_ids)) {
        areasOfInterestIds = pref.areas_of_interest_ids;
      }
    }

    console.log('Primary Domain ID:', primaryDomainId);
    console.log('Secondary Domain IDs:', secondaryDomainIds);
    console.log('Areas of Interest IDs:', areasOfInterestIds);

    // Get domain names
    const allPrefDomainIds = [primaryDomainId, ...secondaryDomainIds, ...areasOfInterestIds].filter(Boolean);
    if (allPrefDomainIds.length > 0) {
      const [prefDomains] = await pool.query(`
        SELECT id, name, domain_level, parent_domain_id
        FROM DOMAINS
        WHERE id IN (${allPrefDomainIds.map(() => '?').join(',')})
      `, allPrefDomainIds);
      console.log('\nUser\'s Preferred Domains:');
      prefDomains.forEach(d => {
        console.log(`  - ${d.name} (ID: ${d.id}, Level: ${d.domain_level})`);
      });
    }

    // 2. Build matching domain IDs (same logic as backend)
    const matchingDomainIds = new Set();
    
    if (primaryDomainId) matchingDomainIds.add(primaryDomainId);
    secondaryDomainIds.forEach(id => matchingDomainIds.add(id));
    areasOfInterestIds.forEach(id => matchingDomainIds.add(id));

    // Get children of primary domain
    if (primaryDomainId) {
      const [primaryChildren] = await pool.query(`
        SELECT id, name FROM DOMAINS
        WHERE parent_domain_id = ? OR
              parent_domain_id IN (SELECT id FROM DOMAINS WHERE parent_domain_id = ?)
      `, [primaryDomainId, primaryDomainId]);
      console.log(`\nChildren of primary domain (${primaryChildren.length}):`);
      primaryChildren.forEach(child => {
        console.log(`  - ${child.name} (ID: ${child.id})`);
        matchingDomainIds.add(child.id);
      });
    }

    // Get children of secondary domains
    if (secondaryDomainIds.length > 0) {
      const placeholders = secondaryDomainIds.map(() => '?').join(',');
      const [secondaryChildren] = await pool.query(`
        SELECT id, name FROM DOMAINS
        WHERE parent_domain_id IN (${placeholders})
      `, secondaryDomainIds);
      console.log(`\nChildren of secondary domains (${secondaryChildren.length}):`);
      secondaryChildren.forEach(child => {
        console.log(`  - ${child.name} (ID: ${child.id})`);
        matchingDomainIds.add(child.id);
      });
    }

    console.log(`\n✅ Total matching domain IDs: ${matchingDomainIds.size}`);

    // 3. Now check each active posting
    console.log('\n2️⃣ Checking All Active Postings:');
    const [allPostings] = await pool.query(`
      SELECT 
        p.id,
        p.title,
        p.posting_type,
        pc.name as category_name
      FROM POSTINGS p
      LEFT JOIN POSTING_CATEGORIES pc ON p.category_id = pc.id
      WHERE p.status IN ('active', 'approved')
      ORDER BY p.created_at DESC
    `);

    console.log(`\nFound ${allPostings.length} active postings\n`);

    for (const posting of allPostings) {
      // Get domains for this posting
      const [postingDomains] = await pool.query(`
        SELECT d.id, d.name, d.domain_level
        FROM POSTING_DOMAINS pd
        JOIN DOMAINS d ON pd.domain_id = d.id
        WHERE pd.posting_id = ?
      `, [posting.id]);

      const hasMatch = postingDomains.some(d => matchingDomainIds.has(d.id));
      const matchedDomains = postingDomains.filter(d => matchingDomainIds.has(d.id));
      const unmatchedDomains = postingDomains.filter(d => !matchingDomainIds.has(d.id));

      console.log(`${hasMatch ? '✅ MATCH' : '❌ NO MATCH'} | ${posting.title}`);
      console.log(`   Category: ${posting.category_name || 'None'}`);
      console.log(`   Type: ${posting.posting_type}`);
      console.log(`   Total Domains: ${postingDomains.length}`);
      
      if (matchedDomains.length > 0) {
        console.log(`   ✅ Matched Domains (${matchedDomains.length}):`);
        matchedDomains.forEach(d => {
          console.log(`      - ${d.name} (ID: ${d.id})`);
        });
      }
      
      if (unmatchedDomains.length > 0) {
        console.log(`   ❌ Unmatched Domains (${unmatchedDomains.length}):`);
        unmatchedDomains.forEach(d => {
          console.log(`      - ${d.name} (ID: ${d.id})`);
        });
      }
      
      console.log('');
    }

    console.log('\n' + '=' .repeat(80));
    console.log('✅ Diagnostic complete!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

diagnose();
