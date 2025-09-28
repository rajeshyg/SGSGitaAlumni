import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testConnection() {
  let connection;

  try {
    console.log('🔍 Testing MySQL connection...');

    // First, try to connect without specifying a database
    const configWithoutDB = {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      port: parseInt(process.env.DB_PORT || '3306'),
      connectTimeout: 60000,
    };

    console.log('📋 Connecting without database...');
    connection = await mysql.createConnection(configWithoutDB);
    console.log('✅ Connected successfully!');

    // List available databases
    console.log('📊 Listing available databases...');
    const [databases] = await connection.execute('SHOW DATABASES');
    console.log('Available databases:');
    databases.forEach((db, index) => {
      console.log(`  ${index + 1}. ${db.Database}`);
    });

    // Try to find databases that might contain our data
    const possibleDBs = databases.filter(db =>
      db.Database.toLowerCase().includes('sgs') ||
      db.Database.toLowerCase().includes('alumni') ||
      db.Database.toLowerCase().includes('gita')
    );

    if (possibleDBs.length > 0) {
      console.log('\n🎯 Possible matching databases:');
      possibleDBs.forEach(db => {
        console.log(`  - ${db.Database}`);
      });
    }

    // Close the connection
    await connection.end();
    console.log('🔌 Connection closed.');

  } catch (error) {
    console.error('❌ Connection failed:', error.message);

    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\n💡 This usually means:');
      console.log('  - Username or password is incorrect');
      console.log('  - User doesn\'t have permission to connect from this host');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 This usually means:');
      console.log('  - Database server is not running');
      console.log('  - Wrong host or port');
      console.log('  - Firewall blocking connection');
    }
  }
}

testConnection();