// Test that JWT secrets match between auth.js and chatSocket.js
import dotenv from 'dotenv';
dotenv.config();

console.log('=== JWT Secret Test ===\n');

// Check what's in the environment
console.log('Environment JWT_SECRET:', process.env.JWT_SECRET ? 
  `${process.env.JWT_SECRET.substring(0, 20)}...` : 'NOT SET');

// The development fallback
const devFallback = 'dev-only-secret-DO-NOT-USE-IN-PRODUCTION';
console.log('Dev fallback:', devFallback.substring(0, 20) + '...');

// What the auth.js would use (lazy init)
const authSecret = process.env.JWT_SECRET || (process.env.NODE_ENV === 'development' ? devFallback : null);
console.log('Auth.js would use:', authSecret ? authSecret.substring(0, 20) + '...' : 'NULL');

// Test signing and verifying
import jwt from 'jsonwebtoken';

const payload = { accountId: 'test-123', email: 'test@test.com', role: 'user', activeProfileId: null };

// Sign with auth secret
const token = jwt.sign(payload, authSecret, { expiresIn: '1h' });
console.log('\nSigned token (first 50 chars):', token.substring(0, 50) + '...');

// Verify with same secret
try {
  const decoded = jwt.verify(token, authSecret);
  console.log('✅ Verification with same secret: SUCCESS');
  console.log('   Decoded accountId:', decoded.accountId);
} catch (e) {
  console.log('❌ Verification with same secret: FAILED -', e.message);
}

// Verify with fallback (in case that's what socket used)
try {
  const decoded = jwt.verify(token, devFallback);
  console.log('✅ Verification with fallback: SUCCESS');
} catch (e) {
  console.log('❌ Verification with fallback: FAILED -', e.message);
}

console.log('\n=== Test Complete ===');
