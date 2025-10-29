/**
 * Set proper preferences for the test user
 * Including Areas of Interest for proper matching
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

async function setUserPreferences() {
  try {
    const userId = 10025; // harshayarlagadda2@gmail.com
    
    console.log('\n🔧 SETTING USER PREFERENCES WITH AREAS OF INTEREST\n');
    console.log('=' .repeat(80));

    // 1. Get domain IDs for the preferences
    const [domains] = await pool.query(`
      SELECT id, name, domain_level
      FROM DOMAINS
      WHERE name IN (
        'Business',
        'Product Management',
        'Finance & Accounting',
        'Entrepreneurship & Startups',
        'Product Analytics & Metrics',
        'Private Equity & Venture Capital',
        'Venture Capital & Fundraising'
      )
      ORDER BY domain_level
    `);

    console.log('Found domains:');
    domains.forEach(d => {
      console.log(`  - ${d.name} (${d.domain_level})`);
    });

    const primary = domains.find(d => d.name === 'Business');
    const secondary = domains.filter(d => 
      ['Product Management', 'Finance & Accounting', 'Entrepreneurship & Startups'].includes(d.name)
    );
    const interests = domains.filter(d => 
      ['Product Analytics & Metrics', 'Private Equity & Venture Capital', 'Venture Capital & Fundraising'].includes(d.name)
    );

    console.log('\n✅ Primary Domain:', primary?.name);
    console.log('✅ Secondary Domains:', secondary.map(d => d.name).join(', '));
    console.log('✅ Areas of Interest:', interests.map(d => d.name).join(', '));

    // 2. Update or insert preferences
    const secondaryIds = JSON.stringify(secondary.map(d => d.id));
    const interestIds = JSON.stringify(interests.map(d => d.id));

    const [existing] = await pool.query(`
      SELECT id FROM USER_PREFERENCES WHERE user_id = ?
    `, [userId]);

    if (existing.length > 0) {
      console.log('\n📝 Updating existing preferences...');
      await pool.query(`
        UPDATE USER_PREFERENCES
        SET primary_domain_id = ?,
            secondary_domain_ids = ?,
            areas_of_interest_ids = ?,
            updated_at = NOW()
        WHERE user_id = ?
      `, [primary.id, secondaryIds, interestIds, userId]);
    } else {
      console.log('\n📝 Creating new preferences...');
      await pool.query(`
        INSERT INTO USER_PREFERENCES (
          id, user_id, primary_domain_id, secondary_domain_ids, 
          areas_of_interest_ids, created_at, updated_at
        ) VALUES (UUID(), ?, ?, ?, ?, NOW(), NOW())
      `, [userId, primary.id, secondaryIds, interestIds]);
    }

    console.log('✅ Preferences saved!');

    // 3. Verify
    const [saved] = await pool.query(`
      SELECT * FROM USER_PREFERENCES WHERE user_id = ?
    `, [userId]);

    console.log('\n📊 Saved Preferences:');
    console.log('Primary Domain ID:', saved[0].primary_domain_id);
    console.log('Secondary Domain IDs:', saved[0].secondary_domain_ids);
    console.log('Areas of Interest IDs:', saved[0].areas_of_interest_ids);

    console.log('\n' + '=' .repeat(80));
    console.log('✅ User preferences set with proper Areas of Interest!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

setUserPreferences();
