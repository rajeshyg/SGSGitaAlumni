/**
 * Simple test for /api/auth/refresh endpoint using password login
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:3001';

// Use the test user we just created
const testEmail = 'test.refresh@sgsgitaalumni.org';
const testPassword = 'TestPassword123!';

async function testRefreshEndpoint() {
  console.log('🧪 Testing /api/auth/refresh Endpoint\n');
  console.log('='.repeat(60));

  try {
    // Step 1: Login with password to get valid tokens
    console.log('\n📝 Step 1: Logging in with password...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: testEmail,
      password: testPassword,
      otpVerified: false // Traditional password login
    });
    
    console.log('✅ Login successful');
    console.log('User:', loginResponse.data.user.email);
    console.log('Role:', loginResponse.data.user.role);
    console.log('Token (first 20 chars):', loginResponse.data.token.substring(0, 20) + '...');
    console.log('Refresh Token (first 20 chars):', loginResponse.data.refreshToken.substring(0, 20) + '...');
    
    const refreshToken = loginResponse.data.refreshToken;
    
    // Step 2: Test the refresh endpoint
    console.log('\n📝 Step 2: Testing /api/auth/refresh...');
    const refreshResponse = await axios.post(`${BASE_URL}/api/auth/refresh`, {
      refreshToken: refreshToken
    });
    
    console.log('✅ Refresh successful!');
    console.log('New Token (first 20 chars):', refreshResponse.data.token.substring(0, 20) + '...');
    console.log('New Refresh Token (first 20 chars):', refreshResponse.data.refreshToken.substring(0, 20) + '...');
    console.log('User:', refreshResponse.data.user);
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ /api/auth/refresh ENDPOINT WORKS CORRECTLY');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('\n' + '='.repeat(60));
    console.error('❌ TEST FAILED');
    console.error('='.repeat(60));
    
    if (error.response) {
      console.error('\nStatus:', error.response.status);
      console.error('Error:', JSON.stringify(error.response.data, null, 2));
      
      // Log the full error for debugging
      if (error.response.status === 500) {
        console.error('\n🚨 500 INTERNAL SERVER ERROR DETECTED');
        console.error('This is the issue we need to fix!');
      }
    } else if (error.request) {
      console.error('\nNo response received:', error.message);
    } else {
      console.error('\nError:', error.message);
    }
    
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  }
}

// Run the test
testRefreshEndpoint();
