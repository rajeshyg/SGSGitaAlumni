import mysql from 'mysql2/promise';

async function checkAdminUser() {
  // Parse DATABASE_URL
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  // Parse the URL: mysql://user:password@host:port/database
  const url = new URL(databaseUrl);
  const host = url.hostname;
  const port = parseInt(url.port) || 3306;
  const user = decodeURIComponent(url.username);
  const password = decodeURIComponent(url.password);
  const database = url.pathname.slice(1); // Remove leading /

  console.log('🔍 Connecting to database...');

  const connection = await mysql.createConnection({
    host,
    port,
    user,
    password,
    database,
    connectTimeout: 60000,
  });

  try {
    console.log('✅ Connected successfully');
    console.log(`📊 Checking user with ID 4600 in database: ${database}`);

    // Query the users table for ID 4600
    const [rows] = await connection.execute(
      'SELECT * FROM users WHERE id = ?',
      [4600]
    );

    if (rows.length === 0) {
      console.log('❌ No user found with ID 4600');
      return;
    }

    const user = rows[0];
    console.log('✅ Admin user found:');
    console.log('==================');

    // Display all fields
    Object.keys(user).forEach(key => {
      const value = user[key];
      const displayValue = value === null ? 'NULL' : value === undefined ? 'UNDEFINED' : value;
      console.log(`${key}: ${displayValue}`);
    });

    console.log('==================');
    console.log('Profile fields summary:');
    console.log(`- firstName: ${user.firstName || 'NULL'}`);
    console.log(`- lastName: ${user.lastName || 'NULL'}`);
    console.log(`- email: ${user.email || 'NULL'}`);
    console.log(`- role: ${user.role || 'NULL'}`);

  } catch (error) {
    console.error('❌ Error querying database:', error.message);
  } finally {
    await connection.end();
    console.log('🔌 Connection closed');
  }
}

checkAdminUser().catch(console.error);