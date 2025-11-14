# Socket Connection Test Guide

**Date:** November 9, 2025

## Issue
Socket not connecting - shows "Connected: ❌ No" in the debug panel

## Diagnostic Steps

### 1. Check if Backend Server is Running

Open a terminal and run:
```powershell
# Check if process is listening on port 3001
netstat -ano | findstr :3001
```

If you see nothing, the backend server is NOT running. Start it with:
```powershell
npm start
```

### 2. Check Backend Logs

When you start the backend with `npm start`, you should see:
```
🚀 Backend API server running on http://localhost:3001
📊 MySQL Database: [database name]
🏠 Host: localhost
💬 Chat Socket.IO server initialized
✅ Server startup completed successfully
```

If you DON'T see "💬 Chat Socket.IO server initialized", there's a problem with socket initialization.

### 3. Test Socket.IO Endpoint

Open a browser and navigate to:
```
http://localhost:3001/socket.io/
```

**Expected Response:** 
- Status code: `400` or `200`
- Message: `{"code":0,"message":"Transport unknown"}` or similar

**If you get "Cannot GET /socket.io/"** - Socket.IO is NOT initialized properly.

### 4. Check Frontend Console Logs

Open browser DevTools (F12) → Console tab

**When logging in**, you should see:
```
🔌 Initializing socket connection: {socketUrl: "http://localhost:5173", hasToken: true, ...}
💬 Chat socket connected: [socket-id]
```

**If you see:**
```
❌ Chat socket connection error: [error details]
```

Common errors and solutions:

#### Error: "xhr poll error"
- Backend server not running on port 3001
- **Solution:** Run `npm start` in backend terminal

#### Error: "Authentication error: No token provided"
- Token not being sent properly
- **Solution:** Check localStorage for 'token'

#### Error: "Authentication error: Invalid token"
- Token is expired or malformed
- **Solution:** Logout and login again

#### Error: "CORS error"
- CORS not configured properly
- **Solution:** Check server.js has proper CORS settings

### 5. Check Vite Proxy Configuration

Open `vite.config.js` and verify:
```javascript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3001',
      changeOrigin: true,
      secure: false,
      cache: false
    },
    '/socket.io': {
      target: 'http://localhost:3001',
      changeOrigin: true,
      ws: true  // Enable WebSocket proxying
    }
  }
}
```

### 6. Test Connection from Debug Panel

1. Login to the application
2. Click the 🔧 icon (bottom right) to open Debug Panel
3. Click the "Socket" tab
4. Click "Check Connection" button
5. Check the "Logs" tab for diagnostic information

### 7. Manual Socket Connection Test

Open browser console and run:
```javascript
// Check if socket client is accessible
console.log(window.chatClient);

// Try to get status
const status = window.chatClient?.getStatus();
console.log('Socket status:', status);
```

## Common Solutions

### Solution 1: Restart Backend Server
```powershell
# Stop the server (Ctrl+C)
# Then restart
npm start
```

### Solution 2: Clear Browser Cache and Tokens
```javascript
// In browser console
localStorage.clear();
// Then logout and login again
```

### Solution 3: Check Network Tab
1. Open DevTools → Network tab
2. Filter by "WS" (WebSocket)
3. Look for socket.io connection attempts
4. Check the status code and response

### Solution 4: Verify Token
```javascript
// In browser console
console.log('Token:', localStorage.getItem('token'));
// Should show a JWT token
```

## Expected Working State

When everything is working correctly:

**Backend Terminal:**
```
🚀 Backend API server running on http://localhost:3001
💬 Chat Socket.IO server initialized
[Chat Socket] User 123 connected (socket-id)
```

**Frontend Console:**
```
🔌 Initializing socket connection: {socketUrl: "http://localhost:5173", hasToken: true}
💬 Chat socket connected: socket-id
✅ Chat socket connected successfully
✅ Socket event listeners registered
```

**Debug Panel:**
```
Socket Status
Connected: ✅ Yes
Queued Messages: 0
Reconnect Attempts: 0
URL: http://localhost:5173
```

## Still Not Working?

If none of the above works, check:

1. **Firewall:** Make sure port 3001 is not blocked
2. **Antivirus:** Temporarily disable to test
3. **Network Proxy:** Check if corporate proxy is interfering
4. **Socket.IO Version:** Verify client and server versions match (both should be v4.x)
5. **Node Version:** Make sure you're using Node 18+ or Node 20+

## Quick Fix Command

Try this sequence:
```powershell
# Terminal 1 - Backend
cd c:\React-Projects\SGSGitaAlumni
npm start

# Terminal 2 - Frontend (in a new terminal)
npm run dev

# Then open browser to http://localhost:5173
# Login and check debug panel
```
