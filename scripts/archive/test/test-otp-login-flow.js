/**
 * Test script for complete OTP login flow
 * Tests: Generate OTP → Verify OTP → Login with otpVerified flag
 */

import fetch from 'node-fetch';

const testEmail = 'saikveni6@gmail.com';
const baseUrl = 'http://localhost:3001';

async function testOTPLoginFlow() {
  console.log('\n🧪 Testing Complete OTP Login Flow\n');
  console.log('='.repeat(60));

  try {
    // Step 1: Generate OTP
    console.log('\n📧 Step 1: Generating OTP...');
    const generateResponse = await fetch(`${baseUrl}/api/otp/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        type: 'login'
      })
    });

    const generateData = await generateResponse.json();
    console.log('Generate Response:', {
      status: generateResponse.status,
      data: generateData
    });

    if (!generateResponse.ok) {
      console.error('❌ Failed to generate OTP');
      return;
    }

    console.log('✅ OTP generated successfully');
    console.log(`📱 OTP Code: ${generateData.otp || generateData.otpCode || '(check email/console)'}`);

    // Prompt for OTP code
    const otpCode = generateData.otp || generateData.otpCode || await promptForOTP();

    // Step 2: Verify OTP
    console.log('\n🔑 Step 2: Verifying OTP...');
    const verifyResponse = await fetch(`${baseUrl}/api/otp/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        otpCode: otpCode,
        tokenType: 'login'
      })
    });

    const verifyData = await verifyResponse.json();
    console.log('Verify Response:', {
      status: verifyResponse.status,
      data: verifyData
    });

    if (!verifyResponse.ok) {
      console.error('❌ Failed to verify OTP');
      return;
    }

    console.log('✅ OTP verified successfully');

    // Step 3: Login with otpVerified flag
    console.log('\n🔐 Step 3: Logging in with OTP verification...');
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: '', // Empty password for OTP-verified login
        otpVerified: true
      })
    });

    const loginData = await loginResponse.json();
    console.log('Login Response:', {
      status: loginResponse.status,
      data: loginData
    });

    if (!loginResponse.ok) {
      console.error('❌ Login failed');
      console.error('Error details:', loginData);
      return;
    }

    console.log('✅ Login successful!');
    console.log('\n📊 Login Result:');
    console.log('  - User ID:', loginData.user?.id);
    console.log('  - Email:', loginData.user?.email);
    console.log('  - Name:', `${loginData.user?.firstName} ${loginData.user?.lastName}`);
    console.log('  - Role:', loginData.user?.role);
    console.log('  - Is Family Account:', loginData.user?.is_family_account);
    console.log('  - Token:', loginData.token ? '✓ (received)' : '✗ (missing)');

    // Step 4: Test family member selection (if family account)
    if (loginData.user?.is_family_account) {
      console.log('\n👨‍👩‍👧‍👦 Step 4: Testing family member selection...');
      const familyResponse = await fetch(`${baseUrl}/api/family/members`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${loginData.token}`,
          'Content-Type': 'application/json'
        }
      });

      const familyData = await familyResponse.json();
      console.log('Family Members Response:', {
        status: familyResponse.status,
        memberCount: Array.isArray(familyData) ? familyData.length : 0
      });

      if (familyResponse.ok && Array.isArray(familyData)) {
        console.log('✅ Family members retrieved successfully');
        familyData.forEach((member, idx) => {
          console.log(`  ${idx + 1}. ${member.first_name} ${member.last_name} (${member.relationship})`);
        });
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ ALL TESTS PASSED!\n');

  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
    console.error('Stack:', error.stack);
  }
}

async function promptForOTP() {
  // For automated testing, return a placeholder
  // In real scenario, you'd need to get this from email/console
  console.log('\n⚠️  Please enter the OTP code manually or check server logs');
  return '000000'; // Placeholder
}

// Run the test
testOTPLoginFlow();
