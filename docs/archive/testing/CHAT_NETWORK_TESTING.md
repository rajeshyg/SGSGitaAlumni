# Chat Module Network Testing Guide
## November 11, 2025

This guide helps you test the chat module on multiple devices connected to the same wifi network.

## Prerequisites
- Multiple devices (phones, tablets, computers) connected to the same wifi network
- All devices should be able to access each other on the network

## Quick Start

### 1. Start the Server for Network Access
```powershell
# Run this PowerShell script to automatically find your IP and start the server
.\start-network-test.ps1
```

### 2. Find Your Network IP Address
The script will automatically detect and display your IP address. It will look something like:
```
✅ Found network IP: 192.168.1.100
📱 Access your app from other devices using: http://192.168.1.100:3001
💻 Frontend will be available at: http://192.168.1.100:5173
```

### 3. Access from Other Devices
- **Backend API**: `http://[YOUR_IP]:3001`
- **Frontend App**: `http://[YOUR_IP]:5173`

### 4. Test Chat Functionality
1. Open the app on your main device (development machine)
2. Open the app on secondary devices using the network URLs
3. Create test accounts on different devices
4. Test chat features:
   - Direct messaging between users
   - Group chat creation and joining
   - Real-time message delivery
   - Post-linked conversations

## Manual Setup (Alternative)

If the PowerShell script doesn't work, you can do it manually:

### 1. Find Your IP Address
```powershell
# Run this command to find your network IP
Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.*" } | Select-Object IPAddress
```

### 2. Start the Development Server
```powershell
npm run dev
```

### 3. Access from Other Devices
Use the IP address you found in step 1:
- Backend: `http://[YOUR_IP]:3001`
- Frontend: `http://[YOUR_IP]:5173`

## Troubleshooting

### Firewall Issues
If other devices can't connect, you may need to allow the ports through Windows Firewall:
```powershell
# Allow port 3001 (backend)
New-NetFirewallRule -DisplayName "Allow Port 3001" -Direction Inbound -LocalPort 3001 -Protocol TCP -Action Allow

# Allow port 5173 (frontend)
New-NetFirewallRule -DisplayName "Allow Port 5173" -Direction Inbound -LocalPort 5173 -Protocol TCP -Action Allow
```

### Connection Refused
- Make sure all devices are on the same wifi network
- Check that the server is running and listening on 0.0.0.0
- Verify the IP address is correct

### Chat Not Working
- Check browser console for errors
- Ensure WebSocket connections are working (check Network tab)
- Verify users are logged in on different devices

## Testing Checklist

- [ ] Server starts successfully with network access
- [ ] Can access frontend from secondary device
- [ ] Can create accounts on different devices
- [ ] Direct messaging works between devices
- [ ] Group chat creation works
- [ ] Users can join group chats from different devices
- [ ] Real-time messages appear on all devices
- [ ] Post-linked conversations work correctly

## Recent Fixes Tested

This network testing setup includes the latest chat API fixes:
- ✅ Duplicate conversation prevention
- ✅ Group self-join authorization
- ✅ Conversation lookup handling

Run the test suite to verify fixes:
```bash
node test-chat-fixes.js
```

## Security Note

⚠️ **Important**: This network setup is for testing only. In production, the server should be properly secured behind a firewall and use HTTPS.