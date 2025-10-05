async function testHealth() {
  try {
    console.log('Testing health API...');
    const response = await fetch('http://localhost:3001/api/health');
    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Response data:', data);
  } catch (error) {
    console.error('Error:', error);
  }
}

testHealth();