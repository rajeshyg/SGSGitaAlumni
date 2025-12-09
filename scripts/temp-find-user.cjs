const mysql = require('mysql2/promise');

async function main() {
  const conn = await mysql.createConnection({
    host: 'sgsbg-app-db.cj88ledblqs8.us-east-1.rds.amazonaws.com',
    user: 'sgsgita_alumni_user',
    password: '2FvT6j06sfI',
    database: 'sgsgita_alumni',
    port: 3306
  });

  console.log('=== Alumni Members (Rajesh/Yarlagadda/datta) ===');
  const [alumni] = await conn.execute(
    `SELECT id, first_name, last_name, email, batch FROM alumni_members 
     WHERE first_name LIKE '%Rajesh%' OR last_name LIKE '%Yarlagadda%' OR email LIKE '%datta%' 
     LIMIT 10`
  );
  console.table(alumni);

  console.log('\n=== Accounts (datta/rajesh) ===');
  const [accounts] = await conn.execute(
    `SELECT id, email, role, status FROM accounts 
     WHERE email LIKE '%datta%' OR email LIKE '%rajesh%' 
     LIMIT 10`
  );
  console.table(accounts);

  console.log('\n=== Existing user_profiles ===');
  const [profiles] = await conn.execute(
    `SELECT id, account_id, alumni_member_id, relationship, access_level, status FROM user_profiles LIMIT 10`
  );
  console.table(profiles);

  await conn.end();
}

main().catch(console.error);
