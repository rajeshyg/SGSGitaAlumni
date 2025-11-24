import dotenv from 'dotenv';

dotenv.config();

const API_BASE = 'http://localhost:3001';
const TEST_USER_ID = 10025; // Using the test user

async function testAccountSettingsAPI() {
  try {
    console.log('🧪 Testing Account Settings API Fix\n');
    console.log('=' .repeat(60));
    
    // Step 1: Login to get auth token
    console.log('\n📝 Step 1: Logging in as test user...');
    const loginResponse = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@sgsgitaalumni.org',
        password: 'Admin@123'
      })
    });
    
    if (!loginResponse.ok) {
      console.error('❌ Login failed:', loginResponse.status, loginResponse.statusText);
      return;
    }
    
    const loginData = await loginResponse.json();
    const authToken = loginData.token;
    const userId = loginData.user.id;
    
    console.log('✅ Login successful');
    console.log(`   User ID: ${userId}`);
    console.log(`   Token: ${authToken.substring(0, 20)}...`);
    
    // Step 2: Test GET /api/users/:userId/account-settings
    console.log('\n📋 Step 2: Fetching account settings...');
    const accountResponse = await fetch(`${API_BASE}/api/users/${userId}/account-settings`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`   Response Status: ${accountResponse.status} ${accountResponse.statusText}`);
    
    if (!accountResponse.ok) {
      const errorText = await accountResponse.text();
      console.error('❌ Account settings request failed');
      console.error('   Error:', errorText);
      return;
    }
    
    const accountData = await accountResponse.json();
    console.log('✅ Account settings fetched successfully\n');
    console.log('   Settings:');
    console.log(`     Email: ${accountData.settings.email}`);
    console.log(`     Email Verified: ${accountData.settings.email_verified ? 'Yes' : 'No'}`);
    console.log(`     Email Verified At: ${accountData.settings.email_verified_at || 'Never'}`);
    console.log(`     Last Login: ${accountData.settings.last_login_at || 'Never'}`);
    console.log(`     Account Created: ${accountData.settings.created_at}`);
    console.log(`     2FA Enabled: ${accountData.settings.two_factor_enabled ? 'Yes' : 'No'}`);
    console.log(`     Last Password Change: ${accountData.settings.last_password_change || 'Never'}`);
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ ALL TESTS PASSED - Account Settings API is working!');
    console.log('='.repeat(60) + '\n');
    
  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
    console.error('   Make sure the server is running on port 3001');
  }
}

testAccountSettingsAPI();

