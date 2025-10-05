# API Usage Examples

**Status:** ✅ ALIGNED WITH CURRENT IMPLEMENTATION
**Date:** September 30, 2025
**Version:** 1.0.0

## WebSocket Events (Future)

The API supports real-time updates via WebSocket:

```javascript
// Connect to WebSocket
const ws = new WebSocket('ws://localhost:3001/ws');

// Authentication
ws.send(JSON.stringify({
  type: 'auth',
  token: 'your-jwt-token'
}));

// Subscribe to events
ws.send(JSON.stringify({
  type: 'subscribe',
  events: ['message', 'posting', 'user_update']
}));
```

## SDK Usage Examples

### JavaScript/TypeScript
```typescript
import { APIService } from './services/APIService';

// Search alumni
const results = await APIService.searchAlumni({
  graduationYear: [2020, 2021],
  major: ['Computer Science'],
  searchTerm: 'john'
});

// Create invitation
const invitation = await APIService.createInvitation({
  email: 'user@example.com',
  invitedBy: 'admin-id',
  invitationType: 'alumni',
  invitationData: { graduationYear: 2020 },
  expiresAt: '2025-10-07T00:00:00Z'
});
```

### cURL Examples
```bash
# Search alumni members
curl -X GET "http://localhost:3001/api/alumni-members/search?q=john&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create invitation
curl -X POST "http://localhost:3001/api/invitations" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "invitedBy": "admin-id",
    "invitationType": "alumni",
    "invitationData": {"graduationYear": 2020},
    "expiresAt": "2025-10-07T00:00:00Z"
  }'
```

## Best Practices

### Authentication
- Always include valid Bearer token in Authorization header
- Refresh tokens before they expire
- Handle token expiration gracefully in client applications

### Error Handling
- Check response `success` field before processing data
- Display user-friendly error messages from `error.message`
- Log technical details from `error.details` for debugging

### Performance
- Use pagination for large result sets
- Implement caching for frequently accessed data
- Batch multiple related requests when possible

### Security
- Never expose tokens in client-side logs
- Validate all data before sending to API
- Use HTTPS in production environments

## Support

For API support and questions:
- Check this documentation first
- Review existing API service implementation in `src/services/APIService.ts`
- Contact the development team for clarification on specific endpoints

---

*This document contains API usage examples and best practices for the SGSGitaAlumni platform.*