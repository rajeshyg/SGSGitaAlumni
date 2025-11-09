/**
 * Test script to verify conversation creation fix
 * Tests:
 * 1. List existing users to find valid user IDs
 * 2. Create conversation with valid user IDs
 * 3. Create conversation with invalid user IDs (should fail gracefully)
 */

const API_URL = 'http://localhost:3001';

// Test credentials (from dev config)
const ADMIN_EMAIL = 'datta.rajesh@gmail.com';
const ADMIN_PASSWORD = 'Admin123!';

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function login() {
  console.log('\n🔐 Logging in as admin...');
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    })
  });

  if (!response.ok) {
    throw new Error(`Login failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  console.log('✅ Login successful');
  console.log('   User ID:', data.user.id);
  console.log('   Email:', data.user.email);
  console.log('   Role:', data.user.role);
  
  return {
    token: data.token,
    userId: data.user.id
  };
}

async function searchUsers(token, query = '') {
  console.log(`\n🔍 Searching for users (query: "${query}")...`);
  const response = await fetch(`${API_URL}/api/users/search?q=${query}&limit=10`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    }
  });

  if (!response.ok) {
    throw new Error(`Search failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  console.log('Search response:', JSON.stringify(data, null, 2));
  
  const users = data.data || data.users || [];
  console.log(`✅ Found ${users.length} users:`);
  users.forEach(user => {
    console.log(`   - ID: ${user.id}, Name: ${user.first_name} ${user.last_name}, Email: ${user.email}`);
  });
  
  return users;
}

async function createConversation(token, participantIds, type = 'DIRECT') {
  console.log(`\n💬 Creating ${type} conversation with participants: [${participantIds.join(', ')}]...`);
  
  const body = {
    type,
    participantIds
  };

  if (type === 'GROUP') {
    body.name = 'Test Group Chat';
  }

  const startTime = Date.now();
  
  const response = await fetch(`${API_URL}/api/conversations`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  const duration = Date.now() - startTime;
  console.log(`   Response time: ${duration}ms`);

  if (!response.ok) {
    const error = await response.json();
    console.log(`❌ Conversation creation failed (${response.status}):`, error);
    throw new Error(error.error?.message || 'Conversation creation failed');
  }

  const data = await response.json();
  console.log('✅ Conversation created successfully:');
  console.log('   ID:', data.data.id);
  console.log('   Type:', data.data.type);
  console.log('   Participants:', data.data.participants.length);
  
  return data.data;
}

async function testConversationCreation() {
  let token, userId;

  try {
    // Step 1: Login
    const loginResult = await login();
    token = loginResult.token;
    userId = loginResult.userId;

    await delay(500);

    // Step 2: Search for users
    const users = await searchUsers(token, 's');

    if (users.length < 2) {
      console.log('\n⚠️  Not enough users found to test conversation creation');
      return;
    }

    await delay(500);

    // Step 3: Test creating conversation with valid users
    const validUserId = users.find(u => u.id !== userId)?.id;
    if (validUserId) {
      console.log('\n--- TEST 1: Valid Participant ---');
      await createConversation(token, [validUserId], 'DIRECT');
    }

    await delay(500);

    // Step 4: Test creating conversation with invalid user ID (should fail gracefully)
    console.log('\n--- TEST 2: Invalid Participant (should fail gracefully) ---');
    try {
      await createConversation(token, [99999], 'DIRECT');
      console.log('❌ ERROR: Should have failed with invalid user ID');
    } catch (error) {
      console.log('✅ Correctly rejected invalid user ID:', error.message);
    }

    await delay(500);

    // Step 5: Test creating GROUP conversation
    if (users.length >= 2) {
      console.log('\n--- TEST 3: Group Conversation ---');
      const participantIds = users
        .filter(u => u.id !== userId)
        .slice(0, 2)
        .map(u => u.id);
      
      if (participantIds.length >= 2) {
        await createConversation(token, participantIds, 'GROUP');
      }
    }

    console.log('\n✅ All tests completed successfully!');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

// Run the tests
console.log('=== Testing Conversation Creation Fix ===');
testConversationCreation().catch(console.error);
