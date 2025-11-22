/**
 * Test HMAC token generation to see what format it produces
 */

import { hmacTokenService } from './src/lib/security/HMACTokenService.js';

async function testHMACGeneration() {
  try {
    console.log('\n🧪 TESTING HMAC TOKEN GENERATION\n');
    console.log('=' .repeat(80));

    const testPayload = {
      invitationId: 'test-id-123',
      email: 'test@example.com',
      type: 'alumni',
      expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000),
      issuedAt: Date.now()
    };

    console.log('📝 Test Payload:');
    console.log(JSON.stringify(testPayload, null, 2));

    const token = hmacTokenService.generateToken(testPayload);

    console.log('\n✅ Generated Token:');
    console.log('  Length:', token.length);
    console.log('  Format:', token);
    console.log('\n🔍 Token Analysis:');
    console.log('  Is base64url:', /^[A-Za-z0-9_-]+$/.test(token));
    console.log('  Is hex (64 chars):', /^[0-9a-f]{64}$/.test(token));
    console.log('  Contains dots:', token.includes('.'));

    console.log('\n🔬 Validation Test:');
    const validation = hmacTokenService.validateToken(token);
    console.log('  Is Valid:', validation.isValid);
    if (validation.isValid) {
      console.log('  Payload matches:', JSON.stringify(validation.payload) === JSON.stringify(testPayload));
    } else {
      console.log('  Error:', validation.error);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    process.exit(0);
  }
}

testHMACGeneration();
