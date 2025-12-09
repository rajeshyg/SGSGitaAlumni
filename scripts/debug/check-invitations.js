/**
 * Debug script to check USER_INVITATIONS table structure
 */
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config();

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });
  
  try {
    // Check schema
    const [schema] = await conn.query('DESCRIBE USER_INVITATIONS');
    console.log('USER_INVITATIONS schema:');
    schema.forEach(r => console.log(`  ${r.Field}: ${r.Type} ${r.Key || ''}`));
    
    console.log('\nSample data:');
    const [sample] = await conn.query(`
      SELECT id, invitation_token, email, status, expires_at 
      FROM USER_INVITATIONS 
      ORDER BY created_at DESC
      LIMIT 5
    `);
    sample.forEach(r => {
      console.log(`  id: ${r.id}`);
      console.log(`  token: ${r.invitation_token}`);
      console.log(`  email: ${r.email}`);
      console.log(`  status: ${r.status}`);
      console.log(`  expires: ${r.expires_at}`);
      console.log('  ---');
    });
  } finally {
    await conn.end();
  }
}

main().catch(e => console.error('Error:', e.message));
