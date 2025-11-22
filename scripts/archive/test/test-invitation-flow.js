/**
 * Test the exact flow of invitation creation to see where token gets changed
 */

import db from './config/database.js';
import { hmacTokenService } from './src/lib/security/HMACTokenService.js';

async function testInvitationFlow() {
  try {
    console.log('\n🧪 TESTING INVITATION CREATION FLOW\n');
    console.log('=' .repeat(80));

    // Step 1: Generate HMAC token (same as routes/alumni.js)
    const invitationId = 'test-flow-' + Date.now();
    const testEmail = 'test.flow@example.com';
    
    console.log('📝 Step 1: Generate HMAC Token');
    const hmacToken = hmacTokenService.generateToken({
      invitationId,
      email: testEmail,
      type: 'alumni',
      expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000),
      issuedAt: Date.now()
    });
    
    console.log('  Generated token length:', hmacToken.length);
    console.log('  Generated token (first 100):', hmacToken.substring(0, 100));

    // Step 2: Store in database (same as routes/alumni.js)
    console.log('\n💾 Step 2: Store in Database');
    const insertQuery = `
      INSERT INTO USER_INVITATIONS (
        id, email, invitation_token, invited_by, invitation_type,
        invitation_data, status, sent_at, expires_at, is_used,
        resend_count, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      invitationId,
      testEmail,
      hmacToken,  // THIS IS THE KEY - what are we actually passing?
      4600,
      'alumni',
      JSON.stringify({ test: true }),
      'pending',
      new Date(),
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      false,
      0,
      new Date(),
      new Date()
    ];

    console.log('  Token being stored (first 100):', values[2].substring(0, 100));
    console.log('  Token being stored length:', values[2].length);

    await db.execute(insertQuery, values);
    console.log('  ✅ Inserted into database');

    // Step 3: Read back from database
    console.log('\n📖 Step 3: Read Back from Database');
    const [rows] = await db.execute(
      'SELECT id, email, invitation_token FROM USER_INVITATIONS WHERE id = ?',
      [invitationId]
    );

    if (rows.length > 0) {
      console.log('  Retrieved token length:', rows[0].invitation_token.length);
      console.log('  Retrieved token (first 100):', rows[0].invitation_token.substring(0, 100));
      console.log('  ✅ Tokens match:', rows[0].invitation_token === hmacToken);
    }

    // Step 4: Clean up
    await db.execute('DELETE FROM USER_INVITATIONS WHERE id = ?', [invitationId]);
    console.log('\n🧹 Cleaned up test data');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    process.exit(0);
  }
}

testInvitationFlow();
