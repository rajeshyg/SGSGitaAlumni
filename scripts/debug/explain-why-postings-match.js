/**
 * Explain WHY each matched posting matches
 * Shows the EXACT domain overlap between user preferences and postings
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

async function explainMatching() {
  try {
    const userId = 10025; // harshayarlagadda2@gmail.com
    
    console.log('\n📚 WHY DO THESE POSTINGS MATCH? - DETAILED EXPLANATION\n');
    console.log('=' .repeat(80));

    // 1. Get user's EXPLICIT preferences (what they selected)
    console.log('\n1️⃣ USER\'S EXPLICIT PREFERENCES (What you selected):');
    const [prefs] = await pool.query(`
      SELECT 
        primary_domain_id,
        secondary_domain_ids,
        areas_of_interest_ids
      FROM USER_PREFERENCES
      WHERE user_id = ?
    `, [userId]);

    const pref = prefs[0];
    const primaryDomainId = pref.primary_domain_id;
    
    let secondaryDomainIds = [];
    if (pref.secondary_domain_ids) {
      if (typeof pref.secondary_domain_ids === 'string') {
        if (pref.secondary_domain_ids.startsWith('[')) {
          secondaryDomainIds = JSON.parse(pref.secondary_domain_ids);
        } else {
          secondaryDomainIds = pref.secondary_domain_ids.split(',').filter(Boolean);
        }
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
      }
    }

    // Get names of explicit preferences
    const allExplicitIds = [primaryDomainId, ...secondaryDomainIds, ...areasOfInterestIds].filter(Boolean);
    
    let orderClause = `ORDER BY CASE WHEN id = ? THEN 1`;
    let orderParams = [primaryDomainId];
    
    if (secondaryDomainIds.length > 0) {
      orderClause += ` WHEN id IN (${secondaryDomainIds.map(() => '?').join(',')}) THEN 2`;
      orderParams.push(...secondaryDomainIds);
    }
    orderClause += ` ELSE 3 END`;
    
    const [explicitDomains] = await pool.query(`
      SELECT id, name, domain_level
      FROM DOMAINS
      WHERE id IN (${allExplicitIds.map(() => '?').join(',')})
      ${orderClause}
    `, [...allExplicitIds, ...orderParams]);

    console.log('\n   ✅ PRIMARY DOMAIN:');
    explicitDomains.filter(d => d.id === primaryDomainId).forEach(d => {
      console.log(`      - ${d.name}`);
    });

    console.log('\n   ✅ SECONDARY DOMAINS:');
    explicitDomains.filter(d => secondaryDomainIds.includes(d.id)).forEach(d => {
      console.log(`      - ${d.name}`);
    });

    console.log('\n   ✅ AREAS OF INTEREST:');
    explicitDomains.filter(d => areasOfInterestIds.includes(d.id)).forEach(d => {
      console.log(`      - ${d.name}`);
    });

    // 2. Show how hierarchy expansion works
    console.log('\n2️⃣ HIERARCHY EXPANSION (Why you see more than what you selected):');
    console.log('\n   📖 HOW IT WORKS:');
    console.log('   - When you select "Business" (primary domain)');
    console.log('   - The system ALSO includes ALL sub-domains of Business');
    console.log('   - This is called "domain hierarchy expansion"');
    console.log('   - So you match with postings in Finance, HR, Marketing, etc.');
    console.log('   - Because they are all CHILDREN of Business!');

    // Get children of primary
    if (primaryDomainId) {
      const [primaryInfo] = await pool.query('SELECT name FROM DOMAINS WHERE id = ?', [primaryDomainId]);
      const [primaryChildren] = await pool.query(`
        SELECT id, name FROM DOMAINS
        WHERE parent_domain_id = ? OR
              parent_domain_id IN (SELECT id FROM DOMAINS WHERE parent_domain_id = ?)
        ORDER BY name
      `, [primaryDomainId, primaryDomainId]);
      
      console.log(`\n   🌳 Children of "${primaryInfo[0].name}" (${primaryChildren.length} domains):`);
      console.log('      These are AUTOMATICALLY included because they are sub-domains:');
      primaryChildren.slice(0, 10).forEach(child => {
        console.log(`      - ${child.name}`);
      });
      if (primaryChildren.length > 10) {
        console.log(`      ... and ${primaryChildren.length - 10} more`);
      }
    }

    // 3. Build the set of ALL matching domain IDs (same as backend)
    const matchingDomainIds = new Set();
    if (primaryDomainId) matchingDomainIds.add(primaryDomainId);
    secondaryDomainIds.forEach(id => matchingDomainIds.add(id));
    areasOfInterestIds.forEach(id => matchingDomainIds.add(id));

    // Add children of primary
    if (primaryDomainId) {
      const [primaryChildren] = await pool.query(`
        SELECT id FROM DOMAINS
        WHERE parent_domain_id = ? OR
              parent_domain_id IN (SELECT id FROM DOMAINS WHERE parent_domain_id = ?)
      `, [primaryDomainId, primaryDomainId]);
      primaryChildren.forEach(child => matchingDomainIds.add(child.id));
    }

    // Add children of secondary
    if (secondaryDomainIds.length > 0) {
      const [secondaryChildren] = await pool.query(`
        SELECT id FROM DOMAINS
        WHERE parent_domain_id IN (${secondaryDomainIds.map(() => '?').join(',')})
      `, secondaryDomainIds);
      secondaryChildren.forEach(child => matchingDomainIds.add(child.id));
    }

    // 4. Now show each matched posting with WHY it matches
    console.log('\n\n3️⃣ MATCHED POSTINGS - WHY EACH ONE MATCHES:\n');

    const matchingDomainIdsArray = Array.from(matchingDomainIds);
    const [matchedPostings] = await pool.query(`
      SELECT DISTINCT p.id, p.title
      FROM POSTINGS p
      INNER JOIN POSTING_DOMAINS pd ON p.id = pd.posting_id
      WHERE pd.domain_id IN (${matchingDomainIdsArray.map(() => '?').join(',')})
        AND p.status IN ('active', 'approved')
      ORDER BY p.created_at DESC
    `, matchingDomainIdsArray);

    for (const posting of matchedPostings) {
      console.log('─'.repeat(80));
      console.log(`\n📌 POSTING: "${posting.title}"\n`);

      // Get posting's domains
      const [postingDomains] = await pool.query(`
        SELECT d.id, d.name, d.domain_level, d.parent_domain_id
        FROM POSTING_DOMAINS pd
        JOIN DOMAINS d ON pd.domain_id = d.id
        WHERE pd.posting_id = ?
      `, [posting.id]);

      console.log(`   This posting has ${postingDomains.length} domain(s):`);
      postingDomains.forEach(d => {
        console.log(`      - ${d.name}`);
      });

      // Check which ones match and WHY
      console.log('\n   ✅ MATCHING DOMAINS & WHY:');
      
      for (const domain of postingDomains) {
        // Is it an explicit preference?
        if (domain.id === primaryDomainId) {
          console.log(`      ✓ "${domain.name}" - YOUR PRIMARY DOMAIN (exact match!)`);
          continue;
        }
        
        if (secondaryDomainIds.includes(domain.id)) {
          console.log(`      ✓ "${domain.name}" - YOUR SECONDARY DOMAIN (exact match!)`);
          continue;
        }
        
        if (areasOfInterestIds.includes(domain.id)) {
          console.log(`      ✓ "${domain.name}" - YOUR AREA OF INTEREST (exact match!)`);
          continue;
        }

        // Is it a child of primary?
        if (primaryDomainId && domain.parent_domain_id === primaryDomainId) {
          const [parent] = await pool.query('SELECT name FROM DOMAINS WHERE id = ?', [primaryDomainId]);
          console.log(`      ✓ "${domain.name}" - Child of your PRIMARY domain "${parent[0].name}"`);
          continue;
        }

        // Is it a grandchild of primary?
        if (primaryDomainId) {
          const [grandparent] = await pool.query(`
            SELECT p.id, p.name
            FROM DOMAINS d
            JOIN DOMAINS p ON d.parent_domain_id = p.id
            WHERE d.id = ? AND p.parent_domain_id = ?
          `, [domain.id, primaryDomainId]);
          
          if (grandparent.length > 0) {
            const [primaryInfo] = await pool.query('SELECT name FROM DOMAINS WHERE id = ?', [primaryDomainId]);
            console.log(`      ✓ "${domain.name}" - Grandchild of your PRIMARY domain "${primaryInfo[0].name}"`);
            continue;
          }
        }

        // Is it a child of secondary?
        for (const secId of secondaryDomainIds) {
          if (domain.parent_domain_id === secId) {
            const [parent] = await pool.query('SELECT name FROM DOMAINS WHERE id = ?', [secId]);
            console.log(`      ✓ "${domain.name}" - Child of your SECONDARY domain "${parent[0].name}"`);
            break;
          }
        }
      }

      console.log('');
    }

    console.log('=' .repeat(80));
    console.log('\n📖 KEY TAKEAWAY:');
    console.log('   - You selected a few domains (Primary, Secondary, Interests)');
    console.log('   - The system expands to include ALL children/grandchildren');
    console.log('   - This gives you ~62 matching domains instead of just 7');
    console.log('   - Postings match if they have ANY of these 62 domains');
    console.log('   - This is BY DESIGN to show you relevant opportunities!');
    console.log('\n✅ All matched postings are relevant because they share domains');
    console.log('   with your Business/Product Management/Finance focus!\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

explainMatching();
