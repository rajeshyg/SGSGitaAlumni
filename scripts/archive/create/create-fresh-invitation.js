import mysql from 'mysql2/promise';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const DB_CONFIG = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT || '3306'),
};

async function createFreshInvitation() {
  let connection;
  try {
    console.log('Connecting to database...');
    connection = await mysql.createConnection(DB_CONFIG);
    
    // 1. Find an alumni member who doesn't have an active invitation
    console.log('\n1. Finding alumni member without active invitation...');
    const [alumni] = await connection.execute(`
      SELECT am.id, am.first_name, am.last_name, am.email
      FROM alumni_members am
      WHERE am.email IS NOT NULL 
        AND am.email != ''
        AND NOT EXISTS (
          SELECT 1 FROM USER_INVITATIONS ui 
          WHERE ui.alumni_member_id = am.id 
            AND ui.status = 'pending'
        )
      LIMIT 1
    `);
    
    if (alumni.length === 0) {
      console.log('❌ No alumni members available for fresh invitation');
      console.log('\n2. Checking existing invitations...');
      const [existingInvites] = await connection.execute(`
        SELECT ui.invitation_token, ui.email, ui.status, ui.is_used, ui.expires_at,
               am.first_name, am.last_name
        FROM USER_INVITATIONS ui
        LEFT JOIN alumni_members am ON ui.alumni_member_id = am.id
        WHERE ui.status = 'pending' AND ui.is_used = 0
        LIMIT 5
      `);
      
      if (existingInvites.length > 0) {
        console.log('\n✅ Found existing unused invitations:');
        existingInvites.forEach((inv, idx) => {
          console.log(`\n${idx + 1}. Token: ${inv.invitation_token}`);
          console.log(`   Name: ${inv.first_name} ${inv.last_name}`);
          console.log(`   Email: ${inv.email}`);
          console.log(`   Status: ${inv.status}, Used: ${inv.is_used}`);
          console.log(`   Expires: ${inv.expires_at}`);
          console.log(`   URL: http://localhost:5173/invitation/${inv.invitation_token}`);
        });
      } else {
        console.log('❌ No unused invitations found. Creating new one anyway...');
        
        // Get any alumni member
        const [anyAlumni] = await connection.execute(`
          SELECT id, first_name, last_name, email
          FROM alumni_members
          WHERE email IS NOT NULL AND email != ''
          LIMIT 1
        `);
        
        if (anyAlumni.length === 0) {
          console.log('❌ No alumni members found in database!');
          return;
        }
        
        const member = anyAlumni[0];
        await createNewInvitation(connection, member);
      }
      return;
    }
    
    const member = alumni[0];
    await createNewInvitation(connection, member);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n✅ Database connection closed');
    }
  }
}

async function createNewInvitation(connection, member) {
  console.log(`\nFound alumni: ${member.first_name} ${member.last_name} (${member.email})`);
  
  // 2. Generate new invitation token
  const invitationToken = crypto.randomBytes(32).toString('hex');
  console.log(`\n2. Generated new token: ${invitationToken}`);
  
  // 3. Create invitation (expires in 30 days)
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  
  console.log('\n3. Creating invitation in database...');
  const [result] = await connection.execute(`
    INSERT INTO USER_INVITATIONS (
      invitation_token,
      email,
      alumni_member_id,
      invited_by,
      invitation_type,
      status,
      completion_status,
      is_used,
      expires_at,
      sent_at,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, 'admin', 'alumni', 'pending', 'pending', 0, ?, NOW(), NOW(), NOW())
  `, [
    invitationToken,
    member.email,
    member.id,
    expiresAt
  ]);
  
  console.log(`✅ Invitation created with ID: ${result.insertId}`);
  
  // 4. Display the invitation details
  console.log('\n' + '='.repeat(80));
  console.log('🎉 FRESH INVITATION CREATED');
  console.log('='.repeat(80));
  console.log(`\nAlumni Details:`);
  console.log(`  Name: ${member.first_name} ${member.last_name}`);
  console.log(`  Email: ${member.email}`);
  console.log(`  ID: ${member.id}`);
  console.log(`\nInvitation Details:`);
  console.log(`  Token: ${invitationToken}`);
  console.log(`  Expires: ${expiresAt.toLocaleString()}`);
  console.log(`  Status: pending`);
  console.log(`\n🔗 Test URLs:`);
  console.log(`  Frontend: http://localhost:5173/invitation/${invitationToken}`);
  console.log(`  API Test: Invoke-WebRequest -Uri "http://localhost:3001/api/auth/register-from-invitation" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"invitationToken":"${invitationToken}","additionalData":{}}' -UseBasicParsing`);
  console.log('\n' + '='.repeat(80));
}

createFreshInvitation();
