/**
 * List all users in the database
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

async function listUsers() {
  try {
    console.log('\n📋 LISTING ALL USERS\n');
    console.log('=' .repeat(80));

    const [users] = await pool.query(`
      SELECT 
        id,
        first_name,
        last_name,
        email,
        is_active,
        created_at
      FROM app_users
      ORDER BY created_at DESC
      LIMIT 20
    `);

    console.log(`\nTotal users (showing first 20): ${users.length}\n`);

    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.first_name} ${user.last_name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Active: ${user.is_active ? '✅' : '❌'}`);
      console.log(`   Created: ${user.created_at}`);
      console.log('');
    });

    // Check for users with preferences
    console.log('=' .repeat(80));
    console.log('\n📊 USERS WITH PREFERENCES\n');

    const [usersWithPrefs] = await pool.query(`
      SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        up.primary_domain_id,
        up.secondary_domain_ids,
        up.areas_of_interest_ids
      FROM app_users u
      INNER JOIN USER_PREFERENCES up ON u.id = up.user_id
      ORDER BY u.created_at DESC
      LIMIT 10
    `);

    console.log(`Total users with preferences: ${usersWithPrefs.length}\n`);

    usersWithPrefs.forEach((user, index) => {
      console.log(`${index + 1}. ${user.first_name} ${user.last_name} (${user.email})`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Primary Domain ID: ${user.primary_domain_id || 'None'}`);
      console.log('');
    });

    console.log('=' .repeat(80));
    console.log('✅ Done!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

listUsers();

