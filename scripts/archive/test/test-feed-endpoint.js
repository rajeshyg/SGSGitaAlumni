/**
 * Test Feed Endpoint
 * Tests the /api/feed endpoint with authentication
 */

import dotenv from 'dotenv';

dotenv.config();

const API_BASE = 'http://localhost:5000';

async function testFeedEndpoint() {
  try {
    console.log('🧪 Testing Feed Endpoint\n');
    
    // Step 1: Login to get auth token
    console.log('📋 Step 1: Logging in...');
    const loginResponse = await fetch(`${API_BASE}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'datta.rajesh@gmail.com',
        password: 'Test@1234'
      })
    });
    
    if (!loginResponse.ok) {
      console.error('❌ Login failed:', loginResponse.status, loginResponse.statusText);
      const errorText = await loginResponse.text();
      console.error('Error:', errorText);
      process.exit(1);
    }
    
    const loginData = await loginResponse.json();
    console.log('✅ Login successful');
    console.log(`   User: ${loginData.user.firstName} ${loginData.user.lastName}`);
    console.log(`   Role: ${loginData.user.role}\n`);
    
    const authToken = loginData.token;
    
    // Step 2: Test feed endpoint
    console.log('📋 Step 2: Fetching feed...');
    const feedResponse = await fetch(`${API_BASE}/api/feed?page=1&limit=10&type=all`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!feedResponse.ok) {
      console.error('❌ Feed request failed:', feedResponse.status, feedResponse.statusText);
      const errorText = await feedResponse.text();
      console.error('Error:', errorText);
      process.exit(1);
    }
    
    const feedData = await feedResponse.json();
    console.log('✅ Feed fetched successfully\n');
    
    console.log('📊 Feed Response:');
    console.log(`   Success: ${feedData.success}`);
    console.log(`   Items: ${feedData.items.length}`);
    console.log(`   Page: ${feedData.pagination.page}`);
    console.log(`   Limit: ${feedData.pagination.limit}`);
    console.log(`   Has More: ${feedData.pagination.hasMore}\n`);
    
    if (feedData.items.length > 0) {
      console.log('📝 Sample Feed Items:');
      feedData.items.slice(0, 3).forEach((item, index) => {
        console.log(`\n   ${index + 1}. ${item.title}`);
        console.log(`      Type: ${item.type}`);
        console.log(`      Author: ${item.author.name}`);
        console.log(`      Content: ${item.content.substring(0, 80)}...`);
        console.log(`      Engagement: ${item.engagement.likes} likes, ${item.engagement.comments} comments, ${item.engagement.shares} shares`);
        console.log(`      User Liked: ${item.engagement.user_liked ? 'Yes' : 'No'}`);
      });
    }
    
    console.log('\n✅ Feed endpoint test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

testFeedEndpoint();

