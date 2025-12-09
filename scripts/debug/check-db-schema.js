import dotenv from 'dotenv';
dotenv.config();
import mysql from 'mysql2/promise';

async function checkDatabase() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    // Check for views
    console.log('\n=== Views ===');
    const [views] = await conn.execute("SHOW FULL TABLES WHERE Table_type = 'VIEW'");
    console.log('Views found:', views);

    // Check for user_profiles table
    console.log('\n=== user_profiles ===');
    try {
      const [desc] = await conn.execute('DESCRIBE user_profiles');
      console.log('user_profiles columns:', desc.map(r => r.Field));
    } catch (e) {
      console.log('user_profiles error:', e.message);
    }

    // Check what tables exist
    console.log('\n=== Tables ===');
    const [tables] = await conn.execute('SHOW TABLES');
    console.log('Tables:', tables.map(r => Object.values(r)[0]));

  } catch (e) {
    console.error('Error:', e.message);
  }

  await conn.end();
}

checkDatabase();
