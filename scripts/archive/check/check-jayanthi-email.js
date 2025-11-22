// Check if jayanthi236@gmail.com exists in database
import mysql from 'mysql2/promise';

async function checkJayanthiEmail() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Admin@123',
    database: 'sgsgitaalumni'
  });

  try {
    console.log('\n=== Checking jayanthi236@gmail.com ===\n');

    // Check alumni_members
    const [alumniRows] = await connection.execute(
      'SELECT id, first_name, last_name, email FROM alumni_members WHERE email = ?',
      ['jayanthi236@gmail.com']
    );
    console.log('Alumni Members:', alumniRows.length > 0 ? alumniRows : 'NOT FOUND');

    // Check app_users
    const [userRows] = await connection.execute(
      'SELECT id, email, created_at FROM app_users WHERE email = ?',
      ['jayanthi236@gmail.com']
    );
    console.log('\nApp Users:', userRows.length > 0 ? userRows : 'NOT FOUND');

    // Check similar emails
    const [similarRows] = await connection.execute(
      'SELECT email FROM alumni_members WHERE email LIKE ?',
      ['%jayanthi%']
    );
    console.log('\nSimilar emails in alumni_members:', similarRows);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

checkJayanthiEmail();
