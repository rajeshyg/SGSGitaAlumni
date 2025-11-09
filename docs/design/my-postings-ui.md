# My Postings Page - UI Design

## Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│  ← Back to All Postings       My Postings          [+ Create New]   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  All (12)  │ Active (3) │ Pending (2) │ Rejected (1) │         │  │
│  │            │            │             │              │         │  │
│  │  Expired (1) │ Archived (5)                                    │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  📄 E2E Test Posting 1234567890                             │    │
│  │  [Pending Review] [Offering Support]                        │    │
│  │                                                              │    │
│  │  Category: Career Support                                   │    │
│  │  This is an automated test posting created at...           │    │
│  │                                                              │    │
│  │  Primary: Technology                                        │    │
│  │  Secondary: Software Engineering                            │    │
│  │  Areas: Web Development                                     │    │
│  │                                                              │    │
│  │  📍 Remote  ⚡ medium  Created: 11/8/2025                   │    │
│  │                                    [View] [Edit] [Delete]   │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  📄 Another Posting Title                                   │    │
│  │  [Active] [Seeking Support]                                 │    │
│  │  ...                                           [View] [Edit] │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                       │
│  ... (up to 10 posts per page)                                      │
│                                                                       │
│  Page 1 of 2 • 12 total postings        [← Previous]  [Next →]     │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

## Tab States

### All Tab (Default)
- Shows all posts **except** archived
- Includes: active, pending_review, draft, rejected, expired
- Badge count: Total non-archived posts

### Active Tab
- Shows approved/active posts only
- Posts users can currently interact with
- Badge shows count of active posts

### Pending Tab
- Shows posts awaiting moderation
- Includes: pending_review, draft
- User can edit or delete these
- Badge shows count of pending posts

### Rejected Tab
- Shows posts rejected by moderators
- Red warning message with rejection reason
- User can view feedback
- Badge shows count of rejected posts

### Expired Tab
- Shows posts past their expiry date
- User can renew or archive
- Badge shows count of expired posts

### Archived Tab
- Shows deleted/archived posts only
- Hidden from other tabs completely
- Read-only view (no edit/delete)
- Badge shows count of archived posts

## Pagination

- **10 posts per page** (configurable via `ITEMS_PER_PAGE` constant)
- Navigation: Previous/Next buttons
- Page indicator: "Page X of Y • Z total postings"
- Disabled state for first/last page
- Auto-reset to page 1 when switching tabs

## Actions

### View Button
- Always available
- Opens posting detail page
- Shows full content + comments

### Edit Button
- Available for: draft, pending_review, active
- Opens edit page
- Can modify all fields including domains

### Delete Button
- Available for: draft, pending_review
- Shows confirmation dialog
- Soft delete (status → archived)
- Auto-switches to Archived tab after deletion

## Badge Colors

```
Draft          → Gray (bg-gray-500)
Pending Review → Yellow (bg-yellow-500)
Active         → Green (bg-green-500)
Rejected       → Red (bg-red-500)
Expired        → Gray (bg-gray-400)
Archived       → Slate (bg-slate-500)
```

## Responsive Design

### Desktop (> 1024px)
- Full tab bar visible
- All buttons with icons + text
- 3-column domain badges

### Tablet (768px - 1024px)
- Scrollable tab bar if needed
- Compact buttons (icon + text)
- 2-column domain badges

### Mobile (< 768px)
- Horizontal scroll tabs
- Icon-only buttons
- Stacked domain badges
- Pagination simplified

## Empty States

Each tab has a custom empty state:

**All Tab:**
> You haven't created any postings yet
> [Create Your First Posting]

**Active Tab:**
> You don't have any active postings
> [Create New Posting]

**Pending Tab:**
> You don't have any pending postings

**Rejected Tab:**
> You don't have any rejected postings

**Expired Tab:**
> You don't have any expired postings

**Archived Tab:**
> You don't have any archived postings

## Interaction Flow

1. **Initial Load**
   - Fetch all user postings (single API call)
   - Show "All" tab by default
   - Display first 10 posts
   - Calculate tab badge counts

2. **Tab Click**
   - Filter postings by status
   - Reset to page 1
   - Update badge to highlight active tab
   - Show relevant empty state if no posts

3. **Page Navigation**
   - Previous/Next buttons
   - Update currentPage state
   - Slice array to show current page
   - Maintain filter from active tab

4. **Delete Post**
   - Show confirmation dialog
   - API call to archive
   - Reload all postings
   - Auto-switch to Archived tab
   - Show archived post in list

5. **Edit Post**
   - Navigate to edit page
   - User makes changes
   - Return to My Postings
   - Post appears in appropriate tab based on new status

## Performance Optimizations

1. **Single API Call**
   - Load all posts once (limit: 1000)
   - Filter and paginate client-side
   - Fast tab switching

2. **Efficient Rendering**
   - Only render 10 posts at a time
   - Separate PostingCard component
   - Prevent unnecessary re-renders

3. **Lazy Badge Calculation**
   - Count posts on-demand for each tab
   - Cache-friendly filtering

4. **Future Backend Optimization**
   ```
   GET /api/postings/my/:userId?status=active&limit=10&offset=0
   ```
   - Server-side filtering
   - True pagination
   - Reduced data transfer

## Accessibility

- Semantic HTML with proper ARIA roles
- Keyboard navigation (Tab, Enter, Escape)
- Screen reader friendly labels
- High contrast badge colors
- Focus states on all interactive elements
- Descriptive button labels

## Component Hierarchy

```
MyPostingsPage
├── Header
│   ├── Back Button
│   ├── Page Title
│   └── Create Button
├── Error/Loading States
└── Tabs Component
    ├── TabsList
    │   └── TabsTrigger[] (6 tabs with badges)
    └── TabsContent[] (6 tab panels)
        ├── Empty State (if no posts)
        └── Postings + Pagination
            ├── PostingCard[] (1-10 items)
            │   ├── Title + Badges
            │   ├── Category
            │   ├── Content Preview
            │   ├── Domain Badges (3-level)
            │   ├── Metadata
            │   ├── Rejection Message (if rejected)
            │   └── Action Buttons
            └── Pagination Controls
                ├── Page Info
                └── Prev/Next Buttons
```

## Data Flow

```
User Action → State Update → Filter Posts → Slice Page → Render

loadMyPostings()
    ↓
setAllPostings([...])
    ↓
getFilteredPostings()  // Filter by active tab
    ↓
getPaginatedPostings() // Slice to current page
    ↓
PostingCard.map()      // Render visible posts
```
