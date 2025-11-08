/**
 * Migration Script: Fix Existing Postings
 *
 * This script fixes postings created before the is_primary flag was added.
 * It marks the first domain of each posting as primary based on domain_level.
 */

const mysql = require('mysql2/promise');

async function fixExistingPostings() {
  const pool = mysql.createPool({
    host: 'sgsbg-app-db.cj88ledblqs8.us-east-1.rds.amazonaws.com',
    user: 'sgsgita_alumni_user',
    password: '2FvT6j06sfI',
    database: 'sgsgita_alumni',
    port: 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  try {
    console.log('🔍 Checking existing postings...\n');

    // Get all postings with their domains
    const [postings] = await pool.query(`
      SELECT DISTINCT p.id, p.title
      FROM POSTINGS p
      INNER JOIN POSTING_DOMAINS pd ON p.id = pd.posting_id
    `);

    console.log(`Found ${postings.length} postings with domain associations\n`);

    let fixedCount = 0;

    for (const posting of postings) {
      console.log(`📝 Processing: ${posting.title}`);

      // Get all domains for this posting
      const [domains] = await pool.query(`
        SELECT pd.id, pd.posting_id, pd.domain_id, pd.is_primary, d.name, d.domain_level
        FROM POSTING_DOMAINS pd
        INNER JOIN DOMAINS d ON pd.domain_id = d.id
        WHERE pd.posting_id = ?
        ORDER BY
          CASE d.domain_level
            WHEN 'primary' THEN 1
            WHEN 'secondary' THEN 2
            WHEN 'area_of_interest' THEN 3
          END,
          d.name
      `, [posting.id]);

      console.log(`   Found ${domains.length} domain associations:`);
      domains.forEach(d => {
        console.log(`     - ${d.name} (${d.domain_level}) is_primary=${d.is_primary}`);
      });

      // Find if there's already a primary
      const hasPrimary = domains.some(d => d.is_primary === 1);

      if (!hasPrimary && domains.length > 0) {
        // Find the first primary-level domain, or just use the first domain
        const primaryDomain = domains.find(d => d.domain_level === 'primary') || domains[0];

        console.log(`   ✅ Setting ${primaryDomain.name} as primary`);

        // Update this domain to be primary
        await pool.query(`
          UPDATE POSTING_DOMAINS
          SET is_primary = 1
          WHERE id = ?
        `, [primaryDomain.id]);

        // Ensure all others are not primary
        await pool.query(`
          UPDATE POSTING_DOMAINS
          SET is_primary = 0
          WHERE posting_id = ? AND id != ?
        `, [posting.id, primaryDomain.id]);

        fixedCount++;
      } else if (hasPrimary) {
        console.log(`   ⏭️  Already has primary domain`);
      } else {
        console.log(`   ⚠️  No domains found`);
      }

      console.log('');
    }

    console.log(`\n✅ Migration complete!`);
    console.log(`   Fixed ${fixedCount} postings`);
    console.log(`   ${postings.length - fixedCount} already had primary domains\n`);

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the migration
fixExistingPostings();
