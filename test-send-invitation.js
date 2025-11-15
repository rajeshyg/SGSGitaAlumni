/**
 * Test the send invitation functionality
 * This will help debug why the invitation sending is failing
 */

import db from './config/database.js';
import { hmacTokenService } from './src/lib/security/HMACTokenService.js';

async function testSendInvitation() {
  try {
    console.log('\n🧪 TESTING SEND INVITATION FUNCTIONALITY\n');
    console.log('=' .repeat(80));

    // Find an alumni member that doesn't have an invitation yet
    const [alumni] = await db.execute(`
      SELECT am.id, am.first_name, am.last_name, am.email
      FROM alumni_members am
      LEFT JOIN USER_INVITATIONS ui ON am.email = ui.email
      WHERE am.email IS NOT NULL AND am.email != ''
      AND ui.id IS NULL
      LIMIT 1
    `);

    if (alumni.length === 0) {
      console.log('❌ No alumni members available for testing invitation sending');
      return;
    }

    const member = alumni[0];
    console.log(`✅ Found test alumni member: ${member.first_name} ${member.last_name} (${member.email})`);

    // Test the invitation creation logic directly
    console.log('\n🔧 Testing invitation creation logic...');

    // Generate HMAC token (same logic as in routes/alumni.js)
    const invitationId = generateUUID();
    const hmacToken = generateHMACInvitationToken({
      id: invitationId,
      email: member.email,
      invitationType: 'alumni',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });

    console.log(`✅ Generated invitation token: ${invitationId}`);
    console.log(`✅ Generated HMAC token: ${hmacToken.substring(0, 50)}...`);

    // Extract token components for database storage
    const tokenParts = hmacToken.split('.');
    const tokenPayload = tokenParts[0] || '';
    const tokenSignature = tokenParts[1] || '';

    console.log(`✅ Token payload: ${tokenPayload.substring(0, 30)}...`);
    console.log(`✅ Token signature: ${tokenSignature.substring(0, 30)}...`);

    // Test database insertion
    console.log('\n💾 Testing database insertion...');

    const insertQuery = `
      INSERT INTO USER_INVITATIONS (
        id, email, invitation_token, invited_by, invitation_type,
        invitation_data, status, sent_at, expires_at, is_used,
        resend_count, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const invitationData = JSON.stringify({
      alumniMemberId: member.id,
      firstName: member.first_name,
      lastName: member.last_name,
      invitationType: 'alumni'
    }).replace(/'/g, '"');

    const values = [
      invitationId,
      member.email,
      hmacToken,
      4600, // admin user ID
      'alumni',
      invitationData,
      'pending',
      new Date(),
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      false,
      0,
      new Date(),
      new Date()
    ];

    console.log('Insert values:', values.map((v, i) => `${i}: ${typeof v === 'string' ? v.substring(0, 30) + '...' : v}`).join(', '));

    const [result] = await db.execute(insertQuery, values);

    console.log(`✅ Database insertion successful! Insert ID: ${result.insertId}`);

    // Verify the invitation was created
    const [verify] = await db.execute(
      'SELECT id, email, status, invitation_token FROM USER_INVITATIONS WHERE id = ?',
      [invitationId]
    );

    if (verify.length > 0) {
      console.log(`✅ Invitation verified in database: ${verify[0].email} (${verify[0].status})`);
    } else {
      console.log('❌ Invitation not found in database after insertion!');
    }

    console.log('\n🎯 CONCLUSION:');
    console.log('The invitation creation logic works correctly.');
    console.log('The issue might be in the API endpoint or frontend integration.');
    console.log('Check server logs for any errors when the API is called.');

  } catch (error) {
    console.error('❌ Error during invitation test:', error.message);
    console.error(error.stack);
  } finally {
    process.exit(0);
  }
}

// Helper functions (copied from routes/alumni.js)
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function generateHMACInvitationToken(invitationData) {
  const payload = {
    invitationId: invitationData.id,
    email: invitationData.email,
    type: invitationData.invitationType || 'alumni',
    expiresAt: invitationData.expiresAt ? Math.floor(new Date(invitationData.expiresAt).getTime()) : Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days default
    issuedAt: Date.now()
  };

  return hmacTokenService.generateToken(payload);
}

testSendInvitation();