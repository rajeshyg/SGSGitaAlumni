/**
 * Test script for debugging /api/auth/refresh endpoint
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:3001';

// Test data
const testEmail = 'saikveni6@gmail.com';

async function testAuthRefresh() {
  console.log('🧪 Testing Auth Refresh Endpoint\n');
  console.log('='.repeat(60));

  try {
    // Step 1: Login to get a valid refresh token
    console.log('\n📝 Step 1: Logging in to get tokens...');
    
    // First, generate OTP
    console.log('Generating OTP...');
    const otpResponse = await axios.post(`${BASE_URL}/api/otp/generate-and-send`, {
      email: testEmail,
      type: 'login'
    });
    
    console.log('✅ OTP generated');
    
    // Get the OTP code (in dev mode, it's logged to console)
    console.log('\n⚠️  Please check the server console for the OTP code');
    console.log('Enter the OTP code when prompted, or use the one from server logs\n');
    
    // For testing, let's try to get recent OTP from admin endpoint
    const activeOtpsResponse = await axios.get(`${BASE_URL}/api/otp/admin/all-active`);
    console.log('Active OTPs response:', JSON.stringify(activeOtpsResponse.data, null, 2));
    const recentOtp = activeOtpsResponse.data.otps?.find(otp => otp.email === testEmail);
    
    if (recentOtp && recentOtp.otp_code) {
      console.log(`📧 Found recent OTP for ${testEmail}: ${recentOtp.otp_code}`);
      
      // Validate OTP
      console.log('\n📝 Step 2: Validating OTP...');
      const validateResponse = await axios.post(`${BASE_URL}/api/otp/validate`, {
        email: testEmail,
        otpCode: recentOtp.otp_code,
        tokenType: 'login'
      });
      
      console.log('✅ OTP validated');
      
      // Login with OTP verified
      console.log('\n📝 Step 3: Logging in with OTP verification...');
      const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
        email: testEmail,
        password: '', // Empty password for OTP login
        otpVerified: true
      });
      
      console.log('✅ Login successful');
      console.log('User:', loginResponse.data.user);
      console.log('Token:', loginResponse.data.token.substring(0, 20) + '...');
      console.log('Refresh Token:', loginResponse.data.refreshToken.substring(0, 20) + '...');
      
      const refreshToken = loginResponse.data.refreshToken;
      
      // Now test the refresh endpoint
      console.log('\n📝 Step 4: Testing refresh endpoint...');
      const refreshResponse = await axios.post(`${BASE_URL}/api/auth/refresh`, {
        refreshToken: refreshToken
      });
      
      console.log('✅ Refresh successful');
      console.log('New Token:', refreshResponse.data.token.substring(0, 20) + '...');
      console.log('New Refresh Token:', refreshResponse.data.refreshToken.substring(0, 20) + '...');
      console.log('User:', refreshResponse.data.user);
      
      console.log('\n' + '='.repeat(60));
      console.log('✅ ALL TESTS PASSED');
      console.log('='.repeat(60));
      
    } else {
      console.error('❌ Could not find recent OTP');
    }
    
  } catch (error) {
    console.error('\n' + '='.repeat(60));
    console.error('❌ TEST FAILED');
    console.error('='.repeat(60));
    
    if (error.response) {
      console.error('\nStatus:', error.response.status);
      console.error('Error:', error.response.data);
      console.error('\nFull response:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('\nNo response received:', error.message);
    } else {
      console.error('\nError:', error.message);
    }
    
    console.error('\nStack trace:', error.stack);
  }
}

// Run the test
testAuthRefresh();
