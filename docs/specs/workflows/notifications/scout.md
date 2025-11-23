# Notifications System - Scout Report (Planning Phase)

**Date**: 2025-11-23  
**Feature**: Notifications System  
**Status**: Pending - Not Started  
**Priority**: Medium (Post-MVP)

## Overview

This is a planning document for the notifications feature, which is scheduled for post-MVP implementation. The scout phase has not been executed yet, but this document outlines what will be needed when development begins.

## Planned Scope

### 1. Email Notifications
- Welcome emails on registration
- Password reset flows
- Posting moderation status (approved/rejected)
- Weekly activity digest
- Configurable preferences

### 2. In-App Notifications
- Real-time notification bell in header
- Notification types:
  - New messages
  - Posting status updates
  - Comment replies
  - Mentions
  - Likes/reactions
- Unread count badge
- Mark as read/unread
- Navigate to source on click
- Notification history

### 3. Push Notifications (Low Priority)
- Browser notifications
- Mobile push (future)
- User opt-in/preferences

## Preliminary Technical Considerations

### Backend Components to Create
- `routes/notifications.js` - Notification API endpoints
- `server/services/notificationService.js` - Business logic
- `server/services/emailService.js` - Email sending (SendGrid/SES)
- Database schema for notifications table
- Event emitters for notification triggers

### Frontend Components to Create
- `src/components/notifications/NotificationBell.tsx` - Header component
- `src/components/notifications/NotificationList.tsx` - Dropdown/panel
- `src/components/notifications/NotificationItem.tsx` - Individual notification
- `src/pages/NotificationSettings.tsx` - User preferences
- Real-time updates (Socket.IO or polling)

### Database Schema (Preliminary)
```sql
CREATE TABLE notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT,
  source_type VARCHAR(50), -- 'posting', 'message', 'comment'
  source_id INT,
  read_status BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE notification_preferences (
  user_id INT PRIMARY KEY,
  email_enabled BOOLEAN DEFAULT TRUE,
  push_enabled BOOLEAN DEFAULT FALSE,
  digest_frequency ENUM('none', 'daily', 'weekly') DEFAULT 'weekly',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

## Integration Points

### Event Triggers
Notifications should be triggered by events across the application:
- **Authentication**: Registration, password reset
- **Postings**: Status change, new comment, likes
- **Messaging**: New message received
- **Moderation**: Posting approved/rejected
- **Social**: Mentions, follows (if implemented)

### Existing Systems to Integrate
- Socket.IO connection (already exists for chat)
- Email infrastructure (may need to set up)
- User preferences system
- Authentication context

## Dependencies

### External Services
- Email service provider (SendGrid, AWS SES, or similar)
- Push notification service (optional - Firebase, OneSignal)

### Internal Dependencies
- Socket.IO server running
- Authentication system
- User management system
- Postings system
- Messaging system

## When to Start Scout Phase

The scout phase should begin when:
1. Core MVP features are complete and stable
2. Email service provider has been selected
3. Notification requirements have been finalized
4. Development resources are available

## Estimated Effort

**Total Estimated Time**: 16-24 hours

### Phase Breakdown
- **Phase 1**: Email notifications (8 hours)
  - Set up email service
  - Create email templates
  - Implement sending logic
  - User preferences
  
- **Phase 2**: In-app notifications (12 hours)
  - Database schema and API
  - Notification service
  - Frontend components
  - Real-time updates
  
- **Phase 3**: Push notifications (8 hours - optional)
  - Service worker setup
  - Push service integration
  - User opt-in flow

## Recommendations

### Priority Order (Post-MVP)
1. **Email notifications** - Essential for user engagement
2. **In-app notifications** - Good for user experience
3. **Push notifications** - Nice to have, can be deferred

### Quick Wins
- Start with email notifications for critical actions
- Use existing email templates/libraries
- Simple in-app notification count in header
- Defer push notifications until mobile strategy is defined

## Next Steps (When Ready to Implement)

1. Run full scout phase:
   - Identify all notification trigger points
   - Map event flows
   - Design database schema
   - Choose email service provider
   
2. Create detailed implementation plan:
   - Break down into tasks
   - Define API contracts
   - Design UI/UX
   - Write test strategy
   
3. Create task breakdown:
   - Atomic, testable tasks
   - Dependencies mapped
   - Acceptance criteria defined

## Related Documentation
- Postings engagement notifications (see workflows/postings/plan.md Phase 5)
- Authentication email flows (see specs/functional/authentication.md)
- Messaging system (see specs/functional/messaging.md)

## Status
🔜 **PENDING** - Awaiting MVP completion before starting implementation
