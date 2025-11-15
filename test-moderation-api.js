/**
 * Test Moderation API Access
 *
 * Tests the complete flow: login as moderator -> call moderation queue API
 */

const BASE_URL = 'http://localhost:3001';

async function testModerationAPI() {
  try {
    console.log('🔐 Logging in as moderator...');

    // Login as moderator
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'moderator@test.com',
        password: 'TestMod123!',
        rememberMe: false
      })
    });

    if (!loginResponse.ok) {
      console.error('❌ Login failed:', loginResponse.status, loginResponse.statusText);
      const errorText = await loginResponse.text();
      console.error('Error details:', errorText);
      return;
    }

    const loginData = await loginResponse.json();
    console.log('✅ Login successful');
    console.log('User:', loginData.user);
    console.log('Token preview:', loginData.token ? loginData.token.substring(0, 50) + '...' : 'No token');

    if (!loginData.token) {
      console.error('❌ No token received from login');
      return;
    }

    console.log('\n📋 Testing moderation queue access...');

    // Call moderation queue API
    const moderationResponse = await fetch(`${BASE_URL}/api/moderation/queue`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${loginData.token}`,
        'Content-Type': 'application/json',
      }
    });

    console.log('Moderation API response status:', moderationResponse.status);

    if (moderationResponse.ok) {
      const moderationData = await moderationResponse.json();
      console.log('✅ Moderation API access successful!');
      console.log('Response:', JSON.stringify(moderationData, null, 2));
    } else {
      console.error('❌ Moderation API access failed');
      const errorText = await moderationResponse.text();
      console.error('Error response:', errorText);
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testModerationAPI();