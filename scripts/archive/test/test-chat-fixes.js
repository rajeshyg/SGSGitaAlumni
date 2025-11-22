/**
 * Test Script: Verify Chat API Fixes
 * Date: November 11, 2025
 * 
 * Tests the three chat/messaging API fixes:
 * 1. DIRECT conversation creation with duplicate prevention
 * 2. GROUP conversation duplicate prevention
 * 3. Self-join for GROUP conversations
 */

import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const API_BASE = process.env.VITE_API_BASE_URL || 'http://localhost:5000';

// Test user credentials (use existing users)
const TEST_USERS = {
  user1: { id: null, token: null, email: 'test1@example.com', password: 'Test@123' },
  user2: { id: null, token: null, email: 'test2@example.com', password: 'Test@123' }
};

let testPostingId = null;

console.log('🧪 Starting Chat API Fix Tests\n');
console.log('Testing against:', API_BASE);
console.log('─'.repeat(60));

/**
 * Login and get auth token
 */
async function login(email, password) {
  try {
    const response = await axios.post(`${API_BASE}/api/auth/login`, {
      email,
      password
    });
    
    if (response.data.token) {
      return {
        token: response.data.token,
        userId: response.data.user?.id
      };
    }
    throw new Error('No token in response');
  } catch (error) {
    console.error(`❌ Login failed for ${email}:`, error.response?.data?.message || error.message);
    return null;
  }
}

/**
 * Create a test posting
 */
async function createTestPosting(token) {
  try {
    const response = await axios.post(
      `${API_BASE}/api/postings`,
      {
        type: 'seeking_support',
        title: 'Test Chat Posting - ' + Date.now(),
        description: 'Testing chat conversation creation',
        tags: ['test'],
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    
    return response.data.data?.id || response.data.id;
  } catch (error) {
    console.error('❌ Create posting failed:', error.response?.data?.message || error.message);
    return null;
  }
}

/**
 * Test 1: DIRECT conversation creation (should not create duplicates)
 */
async function testDirectConversation() {
  console.log('\n📝 TEST 1: DIRECT Conversation Creation\n');
  
  try {
    // Create first DIRECT conversation
    console.log('Creating first DIRECT conversation...');
    const response1 = await axios.post(
      `${API_BASE}/api/conversations`,
      {
        type: 'DIRECT',
        postingId: testPostingId,
        participantIds: [TEST_USERS.user2.id],
        initialMessage: 'First message'
      },
      {
        headers: { Authorization: `Bearer ${TEST_USERS.user1.token}` }
      }
    );
    
    const conv1Id = response1.data.data?.id;
    console.log(`✅ First conversation created: ${conv1Id}`);
    
    // Try to create second DIRECT conversation with same posting and users
    console.log('\nTrying to create duplicate DIRECT conversation...');
    const response2 = await axios.post(
      `${API_BASE}/api/conversations`,
      {
        type: 'DIRECT',
        postingId: testPostingId,
        participantIds: [TEST_USERS.user2.id],
        initialMessage: 'Second message (should reuse existing)'
      },
      {
        headers: { Authorization: `Bearer ${TEST_USERS.user1.token}` }
      }
    );
    
    const conv2Id = response2.data.data?.id;
    
    if (conv1Id === conv2Id) {
      console.log(`✅ Returned existing conversation: ${conv2Id}`);
      console.log('✅ TEST PASSED: No duplicate DIRECT conversation created');
      return true;
    } else {
      console.log(`❌ Created new conversation: ${conv2Id}`);
      console.log('❌ TEST FAILED: Duplicate conversation was created');
      return false;
    }
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Test 2: GROUP conversation creation (should not create duplicates)
 */
async function testGroupConversation() {
  console.log('\n📝 TEST 2: GROUP Conversation Creation\n');
  
  try {
    // Create first GROUP conversation
    console.log('Creating first GROUP conversation...');
    const response1 = await axios.post(
      `${API_BASE}/api/conversations`,
      {
        type: 'GROUP',
        name: 'Test Group Discussion',
        postingId: testPostingId,
        participantIds: [TEST_USERS.user1.id]
      },
      {
        headers: { Authorization: `Bearer ${TEST_USERS.user1.token}` }
      }
    );
    
    const conv1Id = response1.data.data?.id;
    console.log(`✅ First GROUP conversation created: ${conv1Id}`);
    
    // Try to create second GROUP conversation for same posting
    console.log('\nTrying to create duplicate GROUP conversation...');
    const response2 = await axios.post(
      `${API_BASE}/api/conversations`,
      {
        type: 'GROUP',
        name: 'Another Test Group',
        postingId: testPostingId,
        participantIds: [TEST_USERS.user2.id]
      },
      {
        headers: { Authorization: `Bearer ${TEST_USERS.user2.token}` }
      }
    );
    
    const conv2Id = response2.data.data?.id;
    
    if (conv1Id === conv2Id) {
      console.log(`✅ Returned existing conversation: ${conv2Id}`);
      console.log('✅ TEST PASSED: No duplicate GROUP conversation created');
      return { passed: true, groupConvId: conv1Id };
    } else {
      console.log(`❌ Created new conversation: ${conv2Id}`);
      console.log('❌ TEST FAILED: Duplicate conversation was created');
      return { passed: false, groupConvId: null };
    }
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    return { passed: false, groupConvId: null };
  }
}

/**
 * Test 3: Self-join GROUP conversation
 */
async function testGroupSelfJoin(groupConvId) {
  console.log('\n📝 TEST 3: Self-Join GROUP Conversation\n');
  
  if (!groupConvId) {
    console.log('⚠️  Skipping test: No group conversation ID provided');
    return false;
  }
  
  try {
    // User2 tries to join the group conversation created by User1
    console.log(`User2 attempting to join group conversation ${groupConvId}...`);
    const response = await axios.post(
      `${API_BASE}/api/conversations/${groupConvId}/add-participant`,
      {
        userId: TEST_USERS.user2.id
      },
      {
        headers: { Authorization: `Bearer ${TEST_USERS.user2.token}` }
      }
    );
    
    console.log(`✅ User2 successfully joined the group`);
    console.log('✅ TEST PASSED: Self-join for GROUP conversation works');
    return true;
  } catch (error) {
    const errorMsg = error.response?.data?.error?.message || error.message;
    if (errorMsg.includes('Only admins can add participants') || errorMsg.includes('Only admins can add other participants')) {
      console.error('❌ TEST FAILED: Self-join rejected -', errorMsg);
      return false;
    }
    console.error('❌ Test failed with unexpected error:', errorMsg);
    return false;
  }
}

/**
 * Main test execution
 */
async function runTests() {
  try {
    // Step 1: Login both users
    console.log('\n🔐 Step 1: Logging in users\n');
    
    const auth1 = await login(TEST_USERS.user1.email, TEST_USERS.user1.password);
    if (!auth1) {
      console.error('Failed to login user1');
      process.exit(1);
    }
    TEST_USERS.user1.token = auth1.token;
    TEST_USERS.user1.id = auth1.userId;
    console.log(`✅ User1 logged in (ID: ${auth1.userId})`);
    
    const auth2 = await login(TEST_USERS.user2.email, TEST_USERS.user2.password);
    if (!auth2) {
      console.error('Failed to login user2');
      process.exit(1);
    }
    TEST_USERS.user2.token = auth2.token;
    TEST_USERS.user2.id = auth2.userId;
    console.log(`✅ User2 logged in (ID: ${auth2.userId})`);
    
    // Step 2: Create test posting
    console.log('\n📋 Step 2: Creating test posting\n');
    testPostingId = await createTestPosting(TEST_USERS.user1.token);
    if (!testPostingId) {
      console.error('Failed to create test posting');
      process.exit(1);
    }
    console.log(`✅ Test posting created: ${testPostingId}`);
    
    // Step 3: Run tests
    console.log('\n🧪 Step 3: Running Tests');
    console.log('─'.repeat(60));
    
    const test1Passed = await testDirectConversation();
    const test2Result = await testGroupConversation();
    const test3Passed = await testGroupSelfJoin(test2Result.groupConvId);
    
    // Summary
    console.log('\n' + '═'.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('═'.repeat(60));
    console.log(`Test 1 (DIRECT duplicate prevention): ${test1Passed ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Test 2 (GROUP duplicate prevention):  ${test2Result.passed ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Test 3 (GROUP self-join):             ${test3Passed ? '✅ PASSED' : '❌ FAILED'}`);
    console.log('═'.repeat(60));
    
    const allPassed = test1Passed && test2Result.passed && test3Passed;
    if (allPassed) {
      console.log('\n🎉 All tests PASSED! Chat fixes are working correctly.\n');
      process.exit(0);
    } else {
      console.log('\n⚠️  Some tests FAILED. Please review the errors above.\n');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n❌ Test execution failed:', error.message);
    process.exit(1);
  }
}

// Run tests
runTests();
