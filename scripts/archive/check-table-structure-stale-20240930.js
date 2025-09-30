import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function checkTableStructure() {
  let connection;

  try {
    const config = {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: parseInt(process.env.DB_PORT || '3306'),
    };

    connection = await mysql.createConnection(config);
    console.log('Connected to database');

    console.log('\n=== app_users table structure ===');
    const [userRows] = await connection.execute('DESCRIBE app_users');
    userRows.forEach(row => {
      console.log(`- ${row.Field}: ${row.Type} ${row.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${row.Key ? `(${row.Key})` : ''} ${row.Default ? `DEFAULT ${row.Default}` : ''}`);
    });

    console.log('\n=== alumni_members table structure ===');
    const [alumniRows] = await connection.execute('DESCRIBE alumni_members');
    alumniRows.forEach(row => {
      console.log(`- ${row.Field}: ${row.Type} ${row.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${row.Key ? `(${row.Key})` : ''} ${row.Default ? `DEFAULT ${row.Default}` : ''}`);
    });

    await connection.end();

  } catch (error) {
    console.error('Database operation failed:', error.message);
  }
}

checkTableStructure();