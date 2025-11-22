// Test resend invitation for jayanthi236@gmail.com
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function testResend() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 3306
    });

    console.log('🔍 Current invitations for jayanthi236@gmail.com:\n');
    
    const [invites] = await connection.execute(`
      SELECT 
        id,
        email,
        status,
        DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as created_at,
        DATE_FORMAT(sent_at, '%Y-%m-%d %H:%i:%s') as sent_at,
        DATE_FORMAT(last_resent_at, '%Y-%m-%d %H:%i:%s') as last_resent_at,
        DATE_FORMAT(expires_at, '%Y-%m-%d %H:%i:%s') as expires_at,
        resend_count,
        SUBSTRING(invitation_token, 1, 50) as token_preview
      FROM USER_INVITATIONS
      WHERE email = 'jayanthi236@gmail.com'
      ORDER BY created_at DESC
    `);

    if (invites.length === 0) {
      console.log('   No invitations found for jayanthi236@gmail.com\n');
    } else {
      invites.forEach((inv, idx) => {
        console.log(`   ${idx + 1}. ID: ${inv.id}`);
        console.log(`      Status: ${inv.status}`);
        console.log(`      Created: ${inv.created_at}`);
        console.log(`      Sent: ${inv.sent_at}`);
        console.log(`      Last Resent: ${inv.last_resent_at || 'Never'}`);
        console.log(`      Expires: ${inv.expires_at}`);
        console.log(`      Resend Count: ${inv.resend_count}`);
        console.log(`      Token: ${inv.token_preview}...`);
        console.log();
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testResend();
