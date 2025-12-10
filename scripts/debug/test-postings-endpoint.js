/**
 * Test GET /api/postings endpoint
 * Run this while the server is already running in another terminal
 */

import http from 'http';

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/postings',
  method: 'GET',
  headers: {
    'Accept': 'application/json'
  },
  timeout: 10000
};

console.log('Testing GET /api/postings...\n');

const req = http.request(options, (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('\nResponse Body:');
    try {
      const json = JSON.parse(data);
      console.log('Success:', json.success);
      console.log('Postings count:', json.postings?.length || 0);
      if (json.postings && json.postings.length > 0) {
        console.log('\nFirst posting title:', json.postings[0].title);
      }
      if (json.pagination) {
        console.log('Pagination:', json.pagination);
      }
    } catch (e) {
      console.log('Raw response:', data.substring(0, 500));
    }
  });
});

req.on('error', (e) => {
  console.error(`Error: ${e.message}`);
});

req.on('timeout', () => {
  console.error('Request timed out');
  req.destroy();
});

req.end();
