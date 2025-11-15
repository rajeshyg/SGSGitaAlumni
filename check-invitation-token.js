/**
 * Check the invitation token format in database
 */

import db from './config/database.js';

async function checkInvitationToken() {
  try {
    console.log('\n🔍 CHECKING INVITATION TOKEN FORMAT\n');
    console.log('=' .repeat(80));

    // Get the most recent invitation for the test email
    const [invitations] = await db.execute(`
      SELECT id, email, invitation_token, created_at
      FROM USER_INVITATIONS
      WHERE email = ?
      ORDER BY created_at DESC
      LIMIT 1
    `, ['family.srinidhi.anand@yahoo.com']);

    if (invitations.length === 0) {
      console.log('❌ No invitation found for family.srinidhi.anand@yahoo.com');
      process.exit(0);
    }

    const invitation = invitations[0];
    console.log('✅ Found invitation:');
    console.log('  ID:', invitation.id);
    console.log('  Email:', invitation.email);
    console.log('  Created:', invitation.created_at);
    console.log('\n📝 Token Format:');
    console.log('  Length:', invitation.invitation_token.length);
    console.log('  First 100 chars:', invitation.invitation_token.substring(0, 100));
    console.log('  Last 100 chars:', invitation.invitation_token.substring(invitation.invitation_token.length - 100));
    console.log('\n🔍 Token Analysis:');
    console.log('  Contains dots (.):', invitation.invitation_token.includes('.'));
    console.log('  Starts with "eyJ" (JWT-like):', invitation.invitation_token.startsWith('eyJ'));
    console.log('  Is hex (like URL):', /^[0-9a-f]+$/.test(invitation.invitation_token));
    console.log('\n🌐 URL Token (from browser):');
    console.log('  8aef45f0842a51dd2232d02341356b0c033e2deddb175a407cf75dcefa24c6cd');
    console.log('\n🤔 Do they match?', invitation.invitation_token === '8aef45f0842a51dd2232d02341356b0c033e2deddb175a407cf75dcefa24c6cd');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    process.exit(0);
  }
}

checkInvitationToken();
