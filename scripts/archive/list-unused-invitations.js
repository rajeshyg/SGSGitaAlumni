import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function listUnusedInvitations() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: parseInt(process.env.DB_PORT || '3306'),
    });
    
    const [invites] = await connection.execute(`
      SELECT ui.invitation_token, ui.email, ui.status, ui.is_used, ui.expires_at,
             am.first_name, am.last_name
      FROM USER_INVITATIONS ui
      LEFT JOIN alumni_members am ON ui.alumni_member_id = am.id
      WHERE ui.status = 'pending' 
        AND ui.is_used = 0
        AND ui.expires_at > NOW()
      ORDER BY ui.created_at DESC
      LIMIT 10
    `);
    
    if (invites.length === 0) {
      console.log('\n❌ No unused, valid invitations found.');
      console.log('Run: .\\create-invitation.ps1 (in a new PowerShell window)');
    } else {
      console.log(`\n✅ Found ${invites.length} unused invitation(s):\n`);
      invites.forEach((inv, idx) => {
        console.log(`${idx + 1}. ${inv.first_name} ${inv.last_name} (${inv.email})`);
        console.log(`   Token: ${inv.invitation_token}`);
        console.log(`   Expires: ${new Date(inv.expires_at).toLocaleString()}`);
        console.log(`   URL: http://localhost:5173/invitation/${inv.invitation_token}\n`);
      });
    }
    
    await connection.end();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

listUnusedInvitations();
