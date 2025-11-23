---
title: Event System
version: 1.0
status: active
last_updated: 2025-11-23
category: integration
---

# Real-time Event System

## Socket.IO Implementation

The chat and messaging system uses Socket.IO for real-time communication.

### Server Configuration

From `/server/socket/chatSocket.js`:

```javascript
import { Server } from 'socket.io';

export function initializeChatSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  return io;
}
```

### Server Initialization

From `/server.js`:

```javascript
import { initializeChatSocket } from './server/socket/chatSocket.js';
import registerChatRoutes, { setChatIO } from './routes/chat.js';

// Start HTTP server
const server = app.listen(PORT, () => {
  // Initialize Socket.IO
  const chatIO = initializeChatSocket(server);
  setChatIO(chatIO);
  console.log('Chat Socket.IO server initialized');
});
```

## Authentication

Socket connections require JWT authentication:

```javascript
io.use((socket, next) => {
  const token = socket.handshake.auth.token ||
                socket.handshake.headers.authorization?.split(' ')[1];

  if (!token) {
    return next(new Error('Authentication error: No token provided'));
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    socket.userId = decoded.userId;
    socket.email = decoded.email;
    next();
  } catch (error) {
    next(new Error(`Authentication error: ${error.message}`));
  }
});
```

## Connection Management

### User Tracking

```javascript
// Store active connections
const activeUsers = new Map(); // userId -> Set of socketIds
const userSockets = new Map(); // socketId -> userId

io.on('connection', (socket) => {
  const userId = socket.userId;

  // Track user's socket connections
  if (!activeUsers.has(userId)) {
    activeUsers.set(userId, new Set());
  }
  activeUsers.get(userId).add(socket.id);
  userSockets.set(socket.id, userId);

  // Notify user is online
  socket.broadcast.emit('user:online', { userId });
});
```

### Room Management

```javascript
// Join conversation room
socket.on('conversation:join', (conversationId, callback) => {
  const room = `conversation:${conversationId}`;
  socket.join(room);

  if (typeof callback === 'function') {
    callback({ success: true, conversationId, room });
  }
});

// Leave conversation room
socket.on('conversation:leave', (conversationId, callback) => {
  const room = `conversation:${conversationId}`;
  socket.leave(room);

  if (typeof callback === 'function') {
    callback({ success: true, conversationId });
  }
});
```

## Event Types

### Client to Server Events

| Event | Payload | Description |
|-------|---------|-------------|
| `conversation:join` | `conversationId` | Join conversation room |
| `conversation:leave` | `conversationId` | Leave conversation room |
| `message:send` | `{conversationId, content, ...}` | Send message |
| `typing:start` | `{conversationId, userName}` | Start typing indicator |
| `typing:stop` | `{conversationId}` | Stop typing indicator |

### Server to Client Events

| Event | Payload | Description |
|-------|---------|-------------|
| `user:online` | `{userId}` | User came online |
| `user:offline` | `{userId}` | User went offline |
| `message:new` | `{messageId, content, sender, ...}` | New message received |
| `message:edited` | `{messageId, content, editedAt}` | Message was edited |
| `message:deleted` | `{messageId, deletedAt}` | Message was deleted |
| `message:reaction` | `{messageId, reaction}` | Reaction added |
| `message:read` | `{conversationId, userId, messageId}` | Read receipt |
| `conversation:created` | `{conversation}` | New conversation |
| `conversation:archived` | `{conversationId}` | Conversation archived |
| `conversation:participant:added` | `{conversationId, participant}` | Participant added |
| `conversation:participant:removed` | `{conversationId, userId}` | Participant removed |
| `typing:start` | `{userId, userName, conversationId}` | User is typing |
| `typing:stop` | `{userId, conversationId}` | User stopped typing |

## Broadcasting

### To Conversation Room

```javascript
// Broadcast to all users in conversation except sender
const socketHelpers = await import('../server/socket/chatSocket.js');
socketHelpers.broadcastToConversation(io, conversationId, 'message:new', {
  messageId: message.id,
  content: message.content,
  sender: message.sender
}, req.user.id); // Exclude sender
```

### To Specific User

```javascript
socketHelpers.sendToUser(io, userId, 'conversation:added', {
  conversationId: id,
  addedBy: { id: req.user.id, firstName, lastName }
});
```

## Client Integration

### Connecting

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001', {
  auth: {
    token: localStorage.getItem('authToken')
  }
});

socket.on('connect', () => {
  console.log('Connected to chat server');
});

socket.on('connect_error', (error) => {
  console.error('Connection failed:', error.message);
});
```

### Joining Conversations

```javascript
socket.emit('conversation:join', conversationId, (response) => {
  if (response.success) {
    console.log('Joined conversation:', response.room);
  }
});
```

### Receiving Messages

```javascript
socket.on('message:new', (message) => {
  console.log('New message:', message);
  // Update UI
});
```

## Related Files

- Socket server: `/server/socket/chatSocket.js`
- Chat routes: `/routes/chat.js`
- Chat service: `/server/services/chatService.js`
- Server setup: `/server.js` (lines 729-732)
