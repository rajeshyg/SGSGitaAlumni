---
title: Authorization Specification
version: 1.0
status: implemented
last_updated: 2025-11-23
applies_to: all
enforcement: required
---

# Authorization

## Overview

Role-based access control (RBAC) system implementing granular permissions for different user types.

## Implementation Status: Complete

## Role Hierarchy

### Defined Roles

| Role | Level | Description |
|------|-------|-------------|
| Member | 1 | Basic access to alumni features |
| Moderator | 2 | Content review and moderation |
| Admin | 3 | Full system access |

### Role Capabilities

#### Member
- View own profile
- Update own information
- Access alumni directory
- Participate in events
- Use messaging features

#### Moderator
- All Member capabilities
- Review pending content
- Moderate discussions
- Manage event registrations
- Generate basic reports

#### Admin
- All Moderator capabilities
- User management
- System configuration
- Access audit logs
- Manage roles and permissions

## Implementation

### Role Check Middleware

```javascript
// middleware/roleCheck.js
const roleCheck = (requiredRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userRole = req.user.role;

    if (!requiredRoles.includes(userRole)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};
```

### Usage Example

```javascript
const { roleCheck } = require('../middleware/roleCheck');

// Admin only route
router.get('/admin/users',
  authMiddleware,
  roleCheck(['admin']),
  adminController.getUsers
);

// Moderator and Admin route
router.post('/content/review',
  authMiddleware,
  roleCheck(['moderator', 'admin']),
  contentController.reviewContent
);
```

## Permissions System

### Permission Configuration

```javascript
// config/permissions.js
const permissions = {
  member: {
    profile: ['read', 'update'],
    directory: ['read'],
    events: ['read', 'register'],
    messages: ['read', 'create']
  },
  moderator: {
    content: ['read', 'update', 'approve', 'reject'],
    reports: ['read', 'generate'],
    events: ['read', 'manage']
  },
  admin: {
    users: ['read', 'create', 'update', 'delete'],
    system: ['configure'],
    audit: ['read'],
    roles: ['assign']
  }
};
```

### Fine-Grained Permission Checks

```javascript
const hasPermission = (user, resource, action) => {
  const rolePermissions = permissions[user.role];
  if (!rolePermissions) return false;

  const resourcePermissions = rolePermissions[resource];
  if (!resourcePermissions) return false;

  return resourcePermissions.includes(action);
};
```

## Access Control Patterns

### Resource-Level Access

```javascript
// Check if user can access specific resource
const canAccessResource = (user, resource) => {
  // Admins can access all
  if (user.role === 'admin') return true;

  // Check ownership
  if (resource.ownerId === user.id) return true;

  // Check explicit permissions
  return hasExplicitAccess(user, resource);
};
```

### Route Protection Patterns

```javascript
// Public route - no protection
router.get('/public/info', publicController.getInfo);

// Authenticated route - any logged in user
router.get('/profile', authMiddleware, profileController.get);

// Role-protected route
router.delete('/users/:id',
  authMiddleware,
  roleCheck(['admin']),
  userController.delete
);
```

## Authorization Events

All authorization decisions are logged:
- Access grants
- Access denials
- Permission changes
- Role assignments

### Event Structure

```javascript
{
  type: 'authorization',
  userId: 'user-123',
  resource: '/admin/users',
  action: 'read',
  result: 'granted', // or 'denied'
  timestamp: '2025-11-23T10:00:00Z',
  reason: 'User has admin role'
}
```

## Code References

| Component | File Path |
|-----------|-----------|
| Role Middleware | `middleware/roleCheck.js` |
| Permissions Config | `config/permissions.js` |

## Best Practices

1. **Least Privilege**: Assign minimum required permissions
2. **Defense in Depth**: Validate at multiple layers
3. **Fail Secure**: Deny by default on errors
4. **Audit Trail**: Log all access decisions

## Related Specifications

- [Authentication](./authentication.md) - User identity verification
- [Compliance](./compliance.md) - Audit logging requirements
- [Security Overview](./README.md) - Overall security architecture
