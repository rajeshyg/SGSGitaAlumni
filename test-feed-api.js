/**
 * Test script to verify feed API returns embedded posting data
 * Run with: node test-feed-api.js
 */

const http = require('http');

// Test configuration
const TEST_USER_ID = '4600'; // Replace with actual user ID
const API_HOST = 'localhost';
const API_PORT = 5000;

function makeRequest(path, token) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: API_HOST,
      port: API_PORT,
      path: path,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error('Invalid JSON response'));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

async function testFeedAPI() {
  console.log('🧪 Testing Feed API for Embedded Posting Data\n');
  console.log('=' .repeat(60));

  try {
    // First, get a valid token (you'll need to replace this with actual auth)
    console.log('\n⚠️  NOTE: You need to provide a valid auth token');
    console.log('For now, testing without auth (will fail if auth required)\n');

    // Test feed endpoint
    console.log('📡 Testing: GET /api/feed?type=postings&limit=3\n');
    
    const response = await makeRequest('/api/feed?type=postings&limit=3', '');
    
    console.log('✅ Response received');
    console.log(`   Items count: ${response.items?.length || 0}`);
    
    if (response.items && response.items.length > 0) {
      const firstItem = response.items[0];
      
      console.log('\n📋 First Item Structure:');
      console.log(`   ID: ${firstItem.id}`);
      console.log(`   Type: ${firstItem.item_type || firstItem.type}`);
      console.log(`   Item ID: ${firstItem.item_id}`);
      console.log(`   Title: ${firstItem.title}`);
      
      // Check for embedded posting data
      if (firstItem.posting) {
        console.log('\n✅ EMBEDDED POSTING DATA FOUND!');
        console.log(`   Posting ID: ${firstItem.posting.id}`);
        console.log(`   Posting Type: ${firstItem.posting.posting_type}`);
        console.log(`   Domains: ${firstItem.posting.domains?.length || 0} items`);
        console.log(`   Tags: ${firstItem.posting.tags?.length || 0} items`);
        console.log(`   Location: ${firstItem.posting.location || 'N/A'}`);
        console.log(`   Urgency: ${firstItem.posting.urgency_level || 'N/A'}`);
        
        if (firstItem.posting.domains && firstItem.posting.domains.length > 0) {
          console.log('\n   📌 Domains:');
          firstItem.posting.domains.forEach(d => {
            console.log(`      - ${d.name} (${d.id})`);
          });
        }
        
        if (firstItem.posting.tags && firstItem.posting.tags.length > 0) {
          console.log('\n   🏷️  Tags:');
          firstItem.posting.tags.forEach(t => {
            console.log(`      - ${t.name} (${t.id})`);
          });
        }
      } else {
        console.log('\n❌ NO EMBEDDED POSTING DATA!');
        console.log('   This means the feed API is not including posting details');
        console.log('   FeedCard will need to make additional API calls');
      }
      
      console.log('\n📄 Full Item JSON:');
      console.log(JSON.stringify(firstItem, null, 2));
    } else {
      console.log('\n⚠️  No items returned from feed API');
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\nMake sure:');
    console.error('  1. Backend server is running on port 5000');
    console.error('  2. You have valid authentication');
    console.error('  3. There are posting items in the feed');
  }
  
  console.log('\n' + '='.repeat(60));
}

// Run the test
testFeedAPI();

