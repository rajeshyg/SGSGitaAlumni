import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

const [prefs] = await pool.query(`
  SELECT 
    primary_domain_id,
    secondary_domain_ids,
    areas_of_interest_ids
  FROM USER_PREFERENCES
  WHERE user_id = 10025
`);

console.log('RAW DATA:');
console.log(JSON.stringify(prefs[0], null, 2));
console.log('\nsecondary_domain_ids type:', typeof prefs[0].secondary_domain_ids);
console.log('areas_of_interest_ids type:', typeof prefs[0].areas_of_interest_ids);

if (Buffer.isBuffer(prefs[0].secondary_domain_ids)) {
  console.log('\nsecondary is Buffer, string value:', prefs[0].secondary_domain_ids.toString());
}

if (Buffer.isBuffer(prefs[0].areas_of_interest_ids)) {
  console.log('interests is Buffer, string value:', prefs[0].areas_of_interest_ids.toString());
}

await pool.end();
