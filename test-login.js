async function testLogin() {
  try {
    console.log('Testing login API...');
    const response = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'datta.rajesh@gmail.com',
        password: 'Admin123!'
      })
    });

    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Response data:', data);

  } catch (error) {
    console.error('Error:', error);
  }
}

testLogin();