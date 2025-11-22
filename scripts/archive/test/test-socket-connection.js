/**
 * Socket Connection Test Script
 * Run this in the browser console to diagnose socket connection issues
 */

console.log('🔍 Starting Socket.IO Connection Diagnostic...\n');

// 1. Check if backend is reachable
console.log('1️⃣ Testing Backend Server...');
fetch('http://localhost:3001/api/health')
  .then(res => res.json())
  .then(data => {
    console.log('✅ Backend server is running:', data);
  })
  .catch(err => {
    console.error('❌ Backend server is NOT reachable:', err.message);
    console.log('💡 Solution: Run "npm start" in the backend terminal');
  });

// 2. Check Socket.IO endpoint
console.log('\n2️⃣ Testing Socket.IO Endpoint...');
fetch('http://localhost:3001/socket.io/')
  .then(res => {
    console.log('✅ Socket.IO endpoint responded with status:', res.status);
    if (res.status === 400 || res.status === 200) {
      console.log('✅ Socket.IO server is initialized');
    }
    return res.text();
  })
  .then(text => {
    console.log('Response:', text);
  })
  .catch(err => {
    console.error('❌ Socket.IO endpoint is NOT reachable:', err.message);
    console.log('💡 Socket.IO may not be properly initialized on the server');
  });

// 3. Check for auth token
console.log('\n3️⃣ Checking Authentication Token...');
const token = localStorage.getItem('token');
if (token) {
  console.log('✅ Token found in localStorage');
  console.log('Token length:', token.length);
  console.log('Token preview:', token.substring(0, 20) + '...');
  
  // Try to decode token (without verification)
  try {
    const parts = token.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(atob(parts[1]));
      console.log('Token payload:', {
        userId: payload.userId,
        email: payload.email,
        exp: new Date(payload.exp * 1000).toLocaleString()
      });
    }
  } catch (e) {
    console.warn('⚠️ Could not decode token:', e.message);
  }
} else {
  console.error('❌ No token found in localStorage');
  console.log('💡 Solution: Login to get a valid token');
}

// 4. Check if chatClient is available
console.log('\n4️⃣ Checking Chat Client...');
if (typeof window.chatClient !== 'undefined') {
  console.log('✅ chatClient is available');
  const status = window.chatClient.getStatus();
  console.log('Chat client status:', status);
  
  if (status.connected) {
    console.log('✅ Socket is CONNECTED');
  } else {
    console.error('❌ Socket is NOT connected');
    console.log('Reconnect attempts:', status.reconnectAttempts);
    console.log('Queued messages:', status.queuedMessages);
  }
} else {
  console.error('❌ chatClient is not available on window object');
  console.log('💡 This might be a timing issue - try running this script after the app loads');
}

// 5. Check Socket.IO client library
console.log('\n5️⃣ Checking Socket.IO Client Library...');
if (typeof io !== 'undefined') {
  console.log('✅ Socket.IO client library is loaded');
  console.log('Version:', io.version || 'unknown');
} else {
  console.error('❌ Socket.IO client library is NOT loaded');
  console.log('💡 Check if socket.io-client is installed: npm list socket.io-client');
}

// 6. Test direct Socket.IO connection
console.log('\n6️⃣ Testing Direct Socket.IO Connection...');
setTimeout(() => {
  if (token && typeof io !== 'undefined') {
    console.log('Attempting direct connection to:', window.location.origin);
    const testSocket = io(window.location.origin, {
      auth: { token },
      transports: ['websocket', 'polling']
    });
    
    testSocket.on('connect', () => {
      console.log('✅ Direct connection SUCCESSFUL!');
      console.log('Socket ID:', testSocket.id);
      testSocket.disconnect();
    });
    
    testSocket.on('connect_error', (error) => {
      console.error('❌ Direct connection FAILED:', error.message);
      console.log('Error details:', error);
      testSocket.disconnect();
    });
    
    // Timeout after 5 seconds
    setTimeout(() => {
      if (!testSocket.connected) {
        console.error('❌ Connection attempt timed out after 5 seconds');
        testSocket.disconnect();
      }
    }, 5000);
  } else {
    console.warn('⚠️ Skipping direct connection test (missing token or io library)');
  }
}, 2000);

console.log('\n📊 Diagnostic Summary:');
console.log('='.repeat(50));
console.log('Check the results above for any ❌ marks');
console.log('Each ❌ will have a 💡 Solution suggestion');
console.log('='.repeat(50));
