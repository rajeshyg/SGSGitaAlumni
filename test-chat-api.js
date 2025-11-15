// Test script to verify chat API calls work correctly
const API_URL = 'http://localhost:3001';

async function testChatAPI() {
  console.log('🧪 Testing Chat API Endpoints\n');

  // First, login to get auth token
  console.log('1. Logging in...');
  try {
    const loginResponse = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'john.doe@example.com',
        password: 'SecurePass123!'
      })
    });

    const loginData = await loginResponse.json();
    console.log('✅ Login response:', loginResponse.status, loginResponse.statusText);
    console.log('   Data:', JSON.stringify(loginData, null, 2));

    if (!loginResponse.ok) {
      console.error('❌ Login failed!');
      return;
    }

    const token = loginData.token || loginData.accessToken;
    console.log('   Token:', token ? '✅ Present' : '❌ Missing');

    if (!token) {
      console.error('❌ No token in login response!');
      return;
    }

    // Test: Get conversations
    console.log('\n2. Getting conversations...');
    const conversationsResponse = await fetch(`${API_URL}/api/conversations`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ GET /api/conversations:', conversationsResponse.status, conversationsResponse.statusText);
    const conversationsData = await conversationsResponse.json();
    console.log('   Data:', JSON.stringify(conversationsData, null, 2).substring(0, 500));

    // Test: Create a new conversation
    console.log('\n3. Creating new conversation...');
    const createBody = {
      type: 'DIRECT',
      participantIds: [1, 2]
    };
    console.log('   Request body:', JSON.stringify(createBody, null, 2));

    const createResponse = await fetch(`${API_URL}/api/conversations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(createBody)
    });

    console.log('✅ POST /api/conversations:', createResponse.status, createResponse.statusText);
    const createData = await createResponse.text();
    console.log('   Raw response:', createData);

    try {
      const parsedData = JSON.parse(createData);
      console.log('   Parsed data:', JSON.stringify(parsedData, null, 2));
    } catch (e) {
      console.error('   ❌ Failed to parse response as JSON!');
    }

    console.log('\n✅ All tests completed!');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.error('   Stack:', error.stack);
  }
}

testChatAPI();
