import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { getPool } from '../utils/database.js';

dotenv.config();

async function createTestInvitation() {
  const pool = getPool();
  
  try {
    console.log('🔍 Finding an alumni member with email...');
    
    // Get an alumni member with email
    const [alumni] = await pool.execute(
      `SELECT id, first_name, last_name, email, batch, center_name 
       FROM alumni_members 
       WHERE email IS NOT NULL AND email != '' 
       LIMIT 1`
    );
    
    if (alumni.length === 0) {
      console.log('❌ No alumni members found with email addresses');
      process.exit(1);
    }
    
    const alumniMember = alumni[0];
    console.log('✅ Found alumni member:', {
      id: alumniMember.id,
      name: `${alumniMember.first_name} ${alumniMember.last_name}`,
      email: alumniMember.email,
      batch: alumniMember.batch,
      center: alumniMember.center_name
    });
    
    // Generate invitation token
    const token = uuidv4();
    const invitationId = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now
    
    console.log('📝 Creating invitation...');
    
    // USER_INVITATIONS table structure:
    // - id: char(36) PK
    // - email: varchar(255)
    // - user_id: char(36) nullable
    // - invitation_token: varchar(500)
    // - invited_by: int (alumni_member id who invited)
    // - invitation_type: enum('alumni','family_member','admin')
    // - alumni_member_id: int nullable (the alumni member being invited to claim)
    // - completion_status: enum('pending','alumni_verified','completed')
    // - invitation_data: json
    // - status: enum('pending','accepted','expired','revoked')
    // - expires_at: timestamp
    
    // Insert invitation using correct USER_INVITATIONS table structure
    await pool.execute(
      `INSERT INTO USER_INVITATIONS 
       (id, email, invitation_token, invited_by, invitation_type, alumni_member_id, 
        completion_status, invitation_data, status, expires_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        invitationId, 
        alumniMember.email, 
        token, 
        1, // invited_by: admin user (alumni_member_id = 1)
        'alumni', // invitation_type 
        alumniMember.id, // alumni_member_id to claim
        'pending', // completion_status
        JSON.stringify({
          alumniMemberIds: [alumniMember.id],
          message: 'Welcome to SGS Gita Alumni!'
        }), // invitation_data
        'pending', // status
        expiresAt
      ]
    );
    
    console.log('✅ Invitation created successfully!');
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 TEST INVITATION DETAILS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`👤 Alumni: ${alumniMember.first_name} ${alumniMember.last_name}`);
    console.log(`📧 Email: ${alumniMember.email}`);
    console.log(`🎓 Batch: ${alumniMember.batch}`);
    console.log(`🏢 Center: ${alumniMember.center_name}`);
    console.log(`🔑 Token: ${token}`);
    console.log(`⏰ Expires: ${expiresAt.toISOString()}`);
    console.log('');
    console.log('🔗 ONBOARDING LINK:');
    console.log(`   http://localhost:5173/onboarding?token=${token}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('✅ Copy the link above and paste it in your browser to test!');
    
  } catch (error) {
    console.error('❌ Error creating invitation:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

createTestInvitation();
