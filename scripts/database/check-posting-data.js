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

async function checkData() {
  try {
    console.log('🔍 Checking posting domains and tags...\n');

    // Check domains
    const [domains] = await pool.query('SELECT COUNT(*) as count FROM DOMAINS');
    console.log('📊 Total domains:', domains[0].count);

    // Check tags
    const [tags] = await pool.query('SELECT COUNT(*) as count FROM TAGS');
    console.log('📊 Total tags:', tags[0].count);

    // Check posting domains associations
    const [postingDomains] = await pool.query('SELECT COUNT(*) as count FROM POSTING_DOMAINS');
    console.log('📊 Posting-domain associations:', postingDomains[0].count);

    // Check posting tags associations
    const [postingTags] = await pool.query('SELECT COUNT(*) as count FROM POSTING_TAGS');
    console.log('📊 Posting-tag associations:', postingTags[0].count);

    // Check sample posting with domains/tags
    const [samplePosting] = await pool.query(`
      SELECT p.id, p.title,
             (SELECT COUNT(*) FROM POSTING_DOMAINS pd WHERE pd.posting_id = p.id) as domain_count,
             (SELECT COUNT(*) FROM POSTING_TAGS pt WHERE pt.posting_id = p.id) as tag_count
      FROM POSTINGS p
      LIMIT 5
    `);

    console.log('\n📝 Sample postings with associations:');
    samplePosting.forEach(p => {
      console.log(`   ${p.title.substring(0, 50)}... - Domains: ${p.domain_count}, Tags: ${p.tag_count}`);
    });

    // Check if any postings have domains/tags
    const [postingsWithData] = await pool.query(`
      SELECT COUNT(*) as count
      FROM POSTINGS p
      WHERE EXISTS (SELECT 1 FROM POSTING_DOMAINS pd WHERE pd.posting_id = p.id)
         OR EXISTS (SELECT 1 FROM POSTING_TAGS pt WHERE pt.posting_id = p.id)
    `);

    console.log(`\n📊 Postings with domain/tag associations: ${postingsWithData[0].count}`);

    // Show some actual domains and tags
    const [sampleDomains] = await pool.query('SELECT id, name FROM DOMAINS LIMIT 5');
    console.log('\n📋 Sample domains:');
    sampleDomains.forEach(d => console.log(`   ${d.id}: ${d.name}`));

    const [sampleTags] = await pool.query('SELECT id, name FROM TAGS LIMIT 5');
    console.log('\n📋 Sample tags:');
    sampleTags.forEach(t => console.log(`   ${t.id}: ${t.name}`));

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkData();