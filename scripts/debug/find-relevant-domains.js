import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

async function fix() {
  try {
    // Get user's areas of interest
    const userInterests = [
      '040d54c8-c10b-40c6-a67b-68d3a80f4161', // Product Analytics & Metrics
      '2121d91b-0b8c-4550-bded-ab3ac1412d6f', // Venture Capital & Fundraising
      '9d30bb65-b5ce-43c7-834b-f881323edf40'  // Private Equity & Venture Capital
    ];

    console.log('\nUser Areas of Interest:');
    const [interests] = await pool.query(`SELECT id, name FROM DOMAINS WHERE id IN (${userInterests.map(()=>'?').join(',')})`, userInterests);
    interests.forEach(d => console.log(`  - ${d.name}`));

    // Find area_of_interest level domains that make sense for realistic postings
    const [allAreas] = await pool.query(`
      SELECT id, name FROM DOMAINS 
      WHERE domain_level = 'area_of_interest'
      ORDER BY name
    `);

    console.log(`\n\nFound ${allAreas.length} area_of_interest domains`);
    console.log('Looking for relevant ones for test postings...\n');

    // Find domains for realistic postings
    const dataScience = allAreas.find(d => d.name.toLowerCase().includes('data science') || d.name.toLowerCase().includes('machine learning'));
    const productManagement = allAreas.find(d => d.name.toLowerCase().includes('product management') || d.name.toLowerCase().includes('product analytics'));
    const mentorship = allAreas.find(d => d.name.toLowerCase().includes('mentorship') || d.name.toLowerCase().includes('career'));
    const internship = allAreas.find(d => d.name.toLowerCase().includes('internship') || d.name.toLowerCase().includes('career'));

    console.log('Potential domains for "Data Science Mentorship":');
    console.log('  ', dataScience || 'NOT FOUND');

    console.log('\nPotential domains for "Product Management Internship":');
    console.log('  ', productManagement || 'NOT FOUND');

    // Let's see what's available
    console.log('\n\nSample of available area_of_interest domains:');
    allAreas.slice(0, 50).forEach(d => console.log(`  - ${d.name}`));

  } catch (err) {
    console.error('ERROR:', err);
  } finally {
    await pool.end();
  }
}

fix();
