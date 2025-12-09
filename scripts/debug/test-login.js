// Test login endpoint
async function testLogin() {
  const response = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: 'datta.rajesh@gmail.com',
      password: 'Admin123!'
    })
  });
  
  const data = await response.json();
  console.log('Response status:', response.status);
  console.log('Response data:', JSON.stringify(data, null, 2));
}

testLogin().catch(console.error);
