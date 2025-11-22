// Test if family account fields are returned by the API

const testLogin = async () => {
  try {
    console.log('Testing login API...');
    
    const response = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'harshayarlagadda2@gmail.com',
        password: 'test123' // You'll need to update this with the actual password
      })
    });

    const data = await response.json();
    
    console.log('\n=== LOGIN RESPONSE ===');
    console.log(JSON.stringify(data, null, 2));
    
    if (data.user) {
      console.log('\n=== USER OBJECT ===');
      console.log('is_family_account:', data.user.is_family_account);
      console.log('family_account_type:', data.user.family_account_type);
      console.log('primary_family_member_id:', data.user.primary_family_member_id);
      
      if (data.user.is_family_account) {
        console.log('\n✅ SUCCESS: Family account fields are present!');
      } else {
        console.log('\n❌ FAIL: User is not marked as family account');
      }
    }
    
    // Test getCurrentUser endpoint
    if (data.token) {
      console.log('\n\nTesting /api/users/profile...');
      const profileResponse = await fetch('http://localhost:3001/api/users/profile', {
        headers: {
          'Authorization': `Bearer ${data.token}`
        }
      });
      
      const profileData = await profileResponse.json();
      console.log('\n=== PROFILE RESPONSE ===');
      console.log(JSON.stringify(profileData, null, 2));
      
      console.log('\n=== PROFILE FAMILY FIELDS ===');
      console.log('is_family_account:', profileData.is_family_account);
      console.log('family_account_type:', profileData.family_account_type);
      console.log('primary_family_member_id:', profileData.primary_family_member_id);
      
      if (profileData.is_family_account) {
        console.log('\n✅ SUCCESS: Profile endpoint returns family account fields!');
      } else {
        console.log('\n❌ FAIL: Profile endpoint missing family account fields');
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
};

testLogin();
