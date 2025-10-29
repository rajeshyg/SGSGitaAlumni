import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT || '3306'),
});

async function populatePostingAssociations() {
  let connection;

  try {
    console.log('🔌 Connecting to database...');
    connection = await pool.getConnection();
    console.log('✅ Connected to database\n');

    // Get all active postings
    console.log('📋 Fetching active postings...');
    const [postings] = await connection.query(`
      SELECT id, title, content, posting_type
      FROM POSTINGS
      WHERE status IN ('active', 'approved')
    `);

    console.log(`✅ Found ${postings.length} active postings\n`);

    // Get available domains and tags
    console.log('📋 Fetching available domains and tags...');
    const [domains] = await connection.query('SELECT id, name FROM DOMAINS LIMIT 20');
    const [tags] = await connection.query('SELECT id, name FROM TAGS LIMIT 15');

    console.log(`✅ Found ${domains.length} domains and ${tags.length} tags\n`);

    // Clear existing associations
    console.log('🧹 Clearing existing associations...');
    await connection.query('DELETE FROM POSTING_DOMAINS');
    await connection.query('DELETE FROM POSTING_TAGS');
    console.log('✅ Cleared existing associations\n');

    // Create associations for each posting
    console.log('🔗 Creating domain and tag associations...');

    let domainIndex = 0;
    let tagIndex = 0;
    let totalAssociations = 0;

    for (const posting of postings) {
      // Assign 1-3 random domains to each posting
      const numDomains = Math.floor(Math.random() * 3) + 1;
      const postingDomains = [];

      for (let i = 0; i < numDomains; i++) {
        const domain = domains[domainIndex % domains.length];
        postingDomains.push([uuidv4(), posting.id, domain.id]);
        domainIndex++;
      }

      // Assign 1-4 random tags to each posting
      const numTags = Math.floor(Math.random() * 4) + 1;
      const postingTags = [];

      for (let i = 0; i < numTags; i++) {
        const tag = tags[tagIndex % tags.length];
        postingTags.push([uuidv4(), posting.id, tag.id]);
        tagIndex++;
      }

      // Insert domain associations
      if (postingDomains.length > 0) {
        await connection.query(`
          INSERT INTO POSTING_DOMAINS (id, posting_id, domain_id)
          VALUES ?
        `, [postingDomains]);
      }

      // Insert tag associations
      if (postingTags.length > 0) {
        await connection.query(`
          INSERT INTO POSTING_TAGS (id, posting_id, tag_id)
          VALUES ?
        `, [postingTags]);
      }

      totalAssociations += postingDomains.length + postingTags.length;

      if (postings.indexOf(posting) % 10 === 0) {
        console.log(`   Processed ${postings.indexOf(posting) + 1}/${postings.length} postings...`);
      }
    }

    console.log(`\n✅ Created ${totalAssociations} associations for ${postings.length} postings`);

    // Verify the results
    console.log('\n📋 Verifying associations...');
    const [domainCount] = await connection.query('SELECT COUNT(*) as count FROM POSTING_DOMAINS');
    const [tagCount] = await connection.query('SELECT COUNT(*) as count FROM POSTING_TAGS');

    console.log(`✅ Created ${domainCount[0].count} domain associations`);
    console.log(`✅ Created ${tagCount[0].count} tag associations`);

    // Show sample results
    const [sampleResults] = await connection.query(`
      SELECT p.title,
             COUNT(pd.id) as domain_count,
             COUNT(pt.id) as tag_count
      FROM POSTINGS p
      LEFT JOIN POSTING_DOMAINS pd ON p.id = pd.posting_id
      LEFT JOIN POSTING_TAGS pt ON p.id = pt.posting_id
      GROUP BY p.id, p.title
      LIMIT 5
    `);

    console.log('\n📝 Sample results:');
    sampleResults.forEach(p => {
      console.log(`   ${p.title.substring(0, 50)}... - Domains: ${p.domain_count}, Tags: ${p.tag_count}`);
    });

    console.log('\n🎉 Posting associations populated successfully!');
    console.log('📊 Dashboard feed should now show domains and tags for all postings');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    if (connection) {
      connection.release();
      console.log('\n🔌 Database connection closed');
    }
    await pool.end();
  }
}

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

populatePostingAssociations();