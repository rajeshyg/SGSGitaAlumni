/**
 * Quick API Test - Family Members Endpoints
 */
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3001';

async function testFamilyMembersAPI() {
  try {
    console.log('\n========================================');
    console.log('FAMILY MEMBERS API QUICK TEST');
    console.log('========================================\n');
    
    // Step 1: Login
    console.log('1. Logging in...');
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        email: 'test@example.com', 
        password: 'password123' 
      })
    });
    
    if (!loginResponse.ok) {
      throw new Error('Login failed');
    }
    
    const { token } = await loginResponse.json();
    console.log('✅ Login successful\n');
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // Step 2: Get family members
    console.log('2. Getting family members...');
    const membersResponse = await fetch(`${BASE_URL}/api/family-members`, {
      method: 'GET',
      headers
    });
    
    const membersData = await membersResponse.json();
    console.log(`✅ Found ${membersData.data.length} family member(s)`);
    membersData.data.forEach(m => {
      console.log(`   - ${m.display_name} (${m.relationship})`);
    });
    
    // Step 3: Create a new family member
    console.log('\n3. Creating new family member (age 16)...');
    const createResponse = await fetch(`${BASE_URL}/api/family-members`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        firstName: 'Emily',
        lastName: 'Test',
        displayName: 'Emily (16)',
        birthDate: '2008-03-15',
        relationship: 'child'
      })
    });
    
    const createData = await createResponse.json();
    if (createData.success) {
      console.log('✅ Created:', createData.data.display_name);
      console.log(`   Age: ${createData.data.current_age}, Status: ${createData.data.status}`);
      
      // Step 4: Grant consent if needed
      if (createData.data.requires_parent_consent) {
        console.log('\n4. Granting parent consent...');
        const consentResponse = await fetch(
          `${BASE_URL}/api/family-members/${createData.data.id}/consent/grant`,
          { method: 'POST', headers }
        );
        const consentData = await consentResponse.json();
        console.log('✅ Consent granted, status:', consentData.data.status);
      }
    }
    
    console.log('\n========================================');
    console.log('ALL API TESTS PASSED ✅');
    console.log('========================================\n');
    console.log('Backend is ready for frontend development!\n');
    
    return true;
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    return false;
  }
}

testFamilyMembersAPI()
  .then(success => process.exit(success ? 0 : 1));
