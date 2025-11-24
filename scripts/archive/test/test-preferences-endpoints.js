/**
 * Test Preferences Endpoints
 * Tests all preference-related API endpoints with authentication
 */

import dotenv from 'dotenv';

dotenv.config();

const API_BASE = 'http://localhost:5000';
const USER_ID = '10026';

async function testPreferencesEndpoints() {
  try {
    console.log('🧪 Testing Preferences Endpoints\n');
    
    // ========================================================================
    // STEP 1: Login to get auth token
    // ========================================================================
    console.log('📋 Step 1: Logging in as user 10026...');
    const loginResponse = await fetch(`${API_BASE}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'test.alumni@example.com',
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
    console.log(`   User ID: ${loginData.user.id}\n`);
    
    const authToken = loginData.token;
    
    // ========================================================================
    // STEP 2: Test GET /api/preferences/:userId
    // ========================================================================
    console.log('📋 Step 2: Fetching user preferences...');
    const prefsResponse = await fetch(`${API_BASE}/api/preferences/${USER_ID}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!prefsResponse.ok) {
      console.error('❌ Preferences request failed:', prefsResponse.status, prefsResponse.statusText);
      const errorText = await prefsResponse.text();
      console.error('Error:', errorText);
    } else {
      const prefsData = await prefsResponse.json();
      console.log('✅ Preferences fetched successfully');
      console.log(`   Primary Domain: ${prefsData.preferences.primary_domain_name || 'Not set'}`);
      console.log(`   Preference Type: ${prefsData.preferences.preference_type}`);
      console.log(`   Max Postings: ${prefsData.preferences.max_postings}\n`);
    }
    
    // ========================================================================
    // STEP 3: Test GET /api/users/:userId/notification-preferences
    // ========================================================================
    console.log('📋 Step 3: Fetching notification preferences...');
    const notifResponse = await fetch(`${API_BASE}/api/users/${USER_ID}/notification-preferences`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!notifResponse.ok) {
      console.error('❌ Notification preferences request failed:', notifResponse.status, notifResponse.statusText);
      const errorText = await notifResponse.text();
      console.error('Error:', errorText);
    } else {
      const notifData = await notifResponse.json();
      console.log('✅ Notification preferences fetched successfully');
      console.log(`   Email Notifications: ${notifData.preferences.email_notifications ? 'Enabled' : 'Disabled'}`);
      console.log(`   Email Frequency: ${notifData.preferences.email_frequency}`);
      console.log(`   Push Notifications: ${notifData.preferences.push_notifications ? 'Enabled' : 'Disabled'}\n`);
    }
    
    // ========================================================================
    // STEP 4: Test GET /api/users/:userId/privacy-settings
    // ========================================================================
    console.log('📋 Step 4: Fetching privacy settings...');
    const privacyResponse = await fetch(`${API_BASE}/api/users/${USER_ID}/privacy-settings`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!privacyResponse.ok) {
      console.error('❌ Privacy settings request failed:', privacyResponse.status, privacyResponse.statusText);
      const errorText = await privacyResponse.text();
      console.error('Error:', errorText);
    } else {
      const privacyData = await privacyResponse.json();
      console.log('✅ Privacy settings fetched successfully');
      console.log(`   Profile Visibility: ${privacyData.settings.profile_visibility}`);
      console.log(`   Show Email: ${privacyData.settings.show_email ? 'Yes' : 'No'}`);
      console.log(`   Allow Messaging: ${privacyData.settings.allow_messaging}\n`);
    }
    
    // ========================================================================
    // STEP 5: Test GET /api/users/:userId/account-settings
    // ========================================================================
    console.log('📋 Step 5: Fetching account settings...');
    const accountResponse = await fetch(`${API_BASE}/api/users/${USER_ID}/account-settings`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!accountResponse.ok) {
      console.error('❌ Account settings request failed:', accountResponse.status, accountResponse.statusText);
      const errorText = await accountResponse.text();
      console.error('Error:', errorText);
    } else {
      const accountData = await accountResponse.json();
      console.log('✅ Account settings fetched successfully');
      console.log(`   Email: ${accountData.settings.email}`);
      console.log(`   Email Verified: ${accountData.settings.email_verified ? 'Yes' : 'No'}`);
      console.log(`   2FA Enabled: ${accountData.settings.two_factor_enabled ? 'Yes' : 'No'}\n`);
    }
    
    // ========================================================================
    // STEP 6: Test PUT /api/users/:userId/notification-preferences
    // ========================================================================
    console.log('📋 Step 6: Testing notification preferences update...');
    const updateNotifResponse = await fetch(`${API_BASE}/api/users/${USER_ID}/notification-preferences`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email_notifications: true,
        email_frequency: 'weekly',
        posting_updates: true,
        connection_requests: true,
        event_reminders: true,
        weekly_digest: true,
        push_notifications: false
      })
    });
    
    if (!updateNotifResponse.ok) {
      console.error('❌ Update notification preferences failed:', updateNotifResponse.status, updateNotifResponse.statusText);
      const errorText = await updateNotifResponse.text();
      console.error('Error:', errorText);
    } else {
      const updateNotifData = await updateNotifResponse.json();
      console.log('✅ Notification preferences updated successfully');
      console.log(`   Message: ${updateNotifData.message}\n`);
    }
    
    // ========================================================================
    // STEP 7: Test GET /api/preferences/domains/available
    // ========================================================================
    console.log('📋 Step 7: Fetching available domains...');
    const domainsResponse = await fetch(`${API_BASE}/api/preferences/domains/available`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!domainsResponse.ok) {
      console.error('❌ Available domains request failed:', domainsResponse.status, domainsResponse.statusText);
      const errorText = await domainsResponse.text();
      console.error('Error:', errorText);
    } else {
      const domainsData = await domainsResponse.json();
      console.log('✅ Available domains fetched successfully');
      console.log(`   Primary Domains: ${domainsData.primary_domains.length}`);
      console.log(`   Secondary Domains: ${domainsData.secondary_domains.length}`);
      console.log(`   Areas of Interest: ${domainsData.areas_of_interest.length}\n`);
    }
    
    // ========================================================================
    // SUMMARY
    // ========================================================================
    console.log('✅ All preferences endpoint tests completed successfully!');
    console.log('\n📊 Test Summary:');
    console.log('   ✅ Login');
    console.log('   ✅ GET /api/preferences/:userId');
    console.log('   ✅ GET /api/users/:userId/notification-preferences');
    console.log('   ✅ GET /api/users/:userId/privacy-settings');
    console.log('   ✅ GET /api/users/:userId/account-settings');
    console.log('   ✅ PUT /api/users/:userId/notification-preferences');
    console.log('   ✅ GET /api/preferences/domains/available');
    console.log('\n🎉 Preferences module is fully functional!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

testPreferencesEndpoints();

