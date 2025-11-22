# Dashboard - Functional Specification

## Goal
Provide a personalized home experience with relevant content, quick actions, and role-based features.

## Features

### 1. Member Dashboard
**Status**: Complete

- Role-based feature display (Member/Moderator/Admin)
- Quick action links
- Recent activity summary
- Pending items indicator

### 2. Feed Integration
**Status**: Complete

- Real-time personalized content feed
- Postings matching user preferences
- Recent community activity
- Infinite scroll pagination

### 3. Dashboard Widgets
**Status**: Complete

- My postings summary
- Unread messages count
- Pending approvals (moderators)
- Quick search

### 4. Role-Specific Features

**Member Dashboard**:
- My postings
- Saved/bookmarked items
- Messages
- Profile completion %

**Moderator Dashboard**:
- Pending review queue
- Moderation statistics
- Recent approvals/rejections

**Admin Dashboard**:
- User management shortcuts
- System metrics
- Configuration access

## API Endpoints
- `GET /api/dashboard` - Personalized dashboard data
- `GET /api/feed` - Personalized feed items
