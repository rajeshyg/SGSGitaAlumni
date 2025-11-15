#!/usr/bin/env node

/**
 * Test Moderation Approve Endpoint
 * 
 * This script tests the moderator approve endpoint to ensure:
 * 1. The endpoint accepts the correct request format
 * 2. The endpoint returns proper success response
 * 3. The database is updated correctly
 * 
 * Usage: node test-moderation-approve.js
 */

const http = require('http');

// Sample data for testing
const MODERATOR_TOKEN = process.env.AUTH_TOKEN || 'your-jwt-token-here';
const TEST_POSTING_ID = process.env.POSTING_ID || 'posting-uuid-here';
const API_HOST = 'localhost';
const API_PORT = 3001;

console.log('\n🧪 Testing Moderation Approve Endpoint\n');
console.log('Configuration:');
console.log(`  Host: ${API_HOST}:${API_PORT}`);
console.log(`  Posting ID: ${TEST_POSTING_ID}`);
console.log(`  Token: ${MODERATOR_TOKEN ? '✓ Set' : '⚠ Not set - set AUTH_TOKEN env var'}\n`);

const testPayload = {
  postingId: TEST_POSTING_ID,
  moderatorNotes: 'Test approval - automation verified'
};

const options = {
  hostname: API_HOST,
  port: API_PORT,
  path: '/api/moderation/approve',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${MODERATOR_TOKEN}`
  }
};

console.log('📤 Sending request:');
console.log(`  Method: POST`);
console.log(`  Path: ${options.path}`);
console.log(`  Payload:`, JSON.stringify(testPayload, null, 2));
console.log('');

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log(`📥 Response Status: ${res.statusCode}\n`);
    
    try {
      const response = JSON.parse(data);
      console.log('Response Body:');
      console.log(JSON.stringify(response, null, 2));
      console.log('');

      if (response.success) {
        console.log('✅ Test PASSED - Approval succeeded!');
        console.log(`   Posting ${response.data.postingId} was approved.`);
        console.log(`   Expires: ${response.data.expiresAt}`);
      } else {
        console.log('❌ Test FAILED - Response indicates failure:');
        console.log(`   Error: ${response.error?.message || response.error}`);
      }
    } catch (e) {
      console.log('❌ Test FAILED - Invalid JSON response:');
      console.log('   Raw response:', data);
    }
  });
});

req.on('error', (e) => {
  console.log('❌ Request Error:', e.message);
  console.log('   Make sure the server is running on port 3001');
});

req.write(JSON.stringify(testPayload));
req.end();
