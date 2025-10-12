// Test script to directly test the invitation validation API call

// Simulate the SecureAPIClient request method with our fixes
async function testAPICall() {
  const token = 'test-token-123';
  const endpoint = `/api/invitations/validate/${token}`;
  const baseURL = 'http://localhost:3001';
  
  console.log('[TEST] Starting request:', { endpoint, url: `${baseURL}${endpoint}` });
  
  const url = `${baseURL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
  };

  const config = {
    method: 'GET',
    headers,
  };

  // Add timeout to prevent infinite hanging
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    console.error('[TEST] Request timeout after 30 seconds');
    controller.abort();
  }, 30000); // 30 second timeout

  config.signal = controller.signal;

  try {
    console.log('[TEST] Making fetch request...');
    const response = await fetch(url, config);
    
    clearTimeout(timeoutId); // Clear timeout on successful response
    
    console.log('[TEST] Received response:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      ok: response.ok
    });

    if (!response.ok) {
      console.error('[TEST] Response not ok:', response.status, response.statusText);
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // Check if response has content and is JSON
    const contentType = response.headers.get('content-type');
    console.log('[TEST] Content-Type:', contentType);
    
    let responseData = null;
    
    if (contentType && contentType.includes('application/json')) {
      console.log('[TEST] Parsing JSON response...');
      try {
        const text = await response.text();
        console.log('[TEST] Response text:', text);
        
        if (text.trim()) {
          responseData = JSON.parse(text);
          console.log('[TEST] Parsed JSON:', responseData);
        } else {
          console.log('[TEST] Empty response body');
          responseData = {};
        }
      } catch (jsonError) {
        console.error('[TEST] JSON parse error:', jsonError);
        throw new Error(`Invalid JSON response: ${jsonError.message}`);
      }
    } else {
      console.log('[TEST] Non-JSON response, getting text...');
      responseData = await response.text();
      console.log('[TEST] Text response:', responseData);
    }

    console.log('[TEST] Request completed successfully');
    return { data: responseData };
  } catch (error) {
    clearTimeout(timeoutId); // Clear timeout on error
    console.error('[TEST] Request failed:', error);
    
    if (error.name === 'AbortError') {
      throw new Error('Request timeout: The server took too long to respond');
    }
    
    throw error;
  }
}

// Run the test
testAPICall()
  .then(result => {
    console.log('[TEST] SUCCESS:', result);
  })
  .catch(error => {
    console.log('[TEST] FAILED:', error.message);
  });