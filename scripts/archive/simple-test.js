// Simple test without any imports that might trigger server startup

console.log('Testing registration endpoint...');

const testData = {
  invitationToken: 'test-token-123',
  additionalData: {}
};

fetch('http://localhost:3001/api/auth/register-from-invitation', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(testData)
})
.then(response => {
  console.log('Response status:', response.status);
  return response.text();
})
.then(data => {
  console.log('Response data:', data);
  console.log('Test completed');
})
.catch(error => {
  console.error('Error:', error);
});