// Simple frontend test to check API connectivity
console.log('Testing API connectivity...');

// Test 1: Check if fetch works at all
console.log('Test 1: Basic fetch test');
fetch('http://localhost:3001/api/health')
  .then(response => {
    console.log('Health check response:', response.status);
    return response.text();
  })
  .then(data => {
    console.log('Health check data:', data);
  })
  .catch(error => {
    console.error('Health check failed:', error);
  });

// Test 2: Test invitation validation directly
console.log('Test 2: Direct invitation validation');
fetch('http://localhost:3001/api/invitations/validate/test-token-123')
  .then(response => {
    console.log('Validation response status:', response.status);
    return response.json();
  })
  .then(data => {
    console.log('Validation response data:', data);
  })
  .catch(error => {
    console.error('Validation failed:', error);
  });