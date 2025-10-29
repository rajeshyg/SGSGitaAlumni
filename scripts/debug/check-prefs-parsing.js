import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

async function check() {
  try {
    const userId = 10025;

    // Get raw user preferences
    const [prefs] = await pool.query('SELECT * FROM USER_PREFERENCES WHERE user_id = ?', [userId]);
    
    if (prefs.length === 0) {
      console.log('No preferences found');
      return;
    }

    const pref = prefs[0];

    console.log('\n=== RAW DATABASE VALUES ===\n');
    console.log('primary_domain_id:', pref.primary_domain_id);
    console.log('Type:', typeof pref.primary_domain_id);
    console.log('');
    console.log('secondary_domain_ids:', pref.secondary_domain_ids);
    console.log('Type:', typeof pref.secondary_domain_ids);
    console.log('Is Buffer?', Buffer.isBuffer(pref.secondary_domain_ids));
    console.log('Is Array?', Array.isArray(pref.secondary_domain_ids));
    console.log('');
    console.log('areas_of_interest_ids:', pref.areas_of_interest_ids);
    console.log('Type:', typeof pref.areas_of_interest_ids);
    console.log('Is Buffer?', Buffer.isBuffer(pref.areas_of_interest_ids));
    console.log('Is Array?', Array.isArray(pref.areas_of_interest_ids));
    console.log('');

    // Now parse them
    let secondaryDomainIds = [];
    let areasOfInterestIds = [];

    if (pref.secondary_domain_ids) {
      if (Buffer.isBuffer(pref.secondary_domain_ids)) {
        const str = pref.secondary_domain_ids.toString();
        console.log('Secondary as string:', str);
        secondaryDomainIds = JSON.parse(str);
      } else if (typeof pref.secondary_domain_ids === 'string') {
        secondaryDomainIds = JSON.parse(pref.secondary_domain_ids);
      } else if (Array.isArray(pref.secondary_domain_ids)) {
        secondaryDomainIds = pref.secondary_domain_ids;
      } else if (typeof pref.secondary_domain_ids === 'object') {
        // MySQL JSON might return as object
        console.log('Secondary is object, keys:', Object.keys(pref.secondary_domain_ids));
        console.log('Values:', Object.values(pref.secondary_domain_ids));
        secondaryDomainIds = Object.values(pref.secondary_domain_ids);
      }
    }

    if (pref.areas_of_interest_ids) {
      if (Buffer.isBuffer(pref.areas_of_interest_ids)) {
        const str = pref.areas_of_interest_ids.toString();
        console.log('Areas as string:', str);
        areasOfInterestIds = JSON.parse(str);
      } else if (typeof pref.areas_of_interest_ids === 'string') {
        areasOfInterestIds = JSON.parse(pref.areas_of_interest_ids);
      } else if (Array.isArray(pref.areas_of_interest_ids)) {
        areasOfInterestIds = pref.areas_of_interest_ids;
      } else if (typeof pref.areas_of_interest_ids === 'object') {
        // MySQL JSON might return as object
        console.log('Areas is object, keys:', Object.keys(pref.areas_of_interest_ids));
        console.log('Values:', Object.values(pref.areas_of_interest_ids));
        areasOfInterestIds = Object.values(pref.areas_of_interest_ids);
      }
    }

    console.log('\n=== PARSED VALUES ===\n');
    console.log('Secondary Domain IDs:', secondaryDomainIds);
    console.log('Areas of Interest IDs:', areasOfInterestIds);
    console.log('');

    // Verify the IDs match expected domains
    if (areasOfInterestIds.length > 0) {
      const [domains] = await pool.query(`SELECT id, name FROM DOMAINS WHERE id IN (${areasOfInterestIds.map(()=>'?').join(',')})`, areasOfInterestIds);
      console.log('\n=== MATCHED DOMAINS ===\n');
      domains.forEach(d => console.log(`  ${d.name} (${d.id})`));
    }

  } catch (err) {
    console.error('ERROR:', err);
  } finally {
    await pool.end();
  }
}

check();
