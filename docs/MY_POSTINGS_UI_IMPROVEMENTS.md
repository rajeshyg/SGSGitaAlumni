# My Postings Page - UI Improvements

**Date:** November 8, 2025  
**Scope:** Enhanced My Postings page with tab-based filtering and pagination

## Problem Statement

The original My Postings page (`/postings/my`) had several issues:

1. **Non-functional "Show Archived" checkbox** - Didn't properly filter archived posts
2. **All data loaded at once** - No pagination, causing performance issues with many posts
3. **No status-based filtering** - Users couldn't easily filter by post status
4. **Archived posts visibility** - Deleted posts were still visible with status indication
5. **Poor UX** - Hard to find specific posts by their current state

## Solution Implemented

### 1. Tab-Based Status Filtering

Replaced the non-functional checkbox with a comprehensive tab system:

- **All** - Shows all posts except archived (default view)
- **Active** - Shows approved/active posts only
- **Pending** - Shows posts awaiting moderation (pending_review, draft)
- **Rejected** - Shows posts rejected by moderators
- **Expired** - Shows posts past their expiry date
- **Archived** - Shows deleted/archived posts only

Each tab displays a badge with the count of posts in that status.

### 2. Pagination

Implemented client-side pagination with:
- **10 posts per page** - Reduces initial render time
- **Previous/Next navigation** - Easy page navigation
- **Page indicators** - Shows "Page X of Y • Z total postings"
- **Auto-reset** - Returns to page 1 when switching tabs

### 3. Improved Filtering Logic

- Archived posts are **completely hidden** from the "All" tab
- Each tab shows only relevant status posts
- Filters handle multiple status variations (e.g., "active" and "approved" both shown in Active tab)

### 4. Enhanced Delete/Archive Flow

When a user archives a post:
1. Confirmation dialog explains the post will move to Archived tab
2. API call archives the post (soft delete - status = 'archived')
3. Data reloads from backend
4. UI **automatically switches to Archived tab** to show where the post went
5. Post is invisible in other tabs

### 5. Performance Optimizations

- **Client-side filtering** - Fast tab switching without API calls
- **Lazy loading via pagination** - Only render visible posts
- **Efficient re-renders** - Separate PostingCard component prevents unnecessary updates
- **Batch data load** - Single API call loads all data (limit: 1000), then filter/paginate client-side

## Technical Implementation

### Component Structure

```typescript
MyPostingsPage
├── Tab Navigation (All, Active, Pending, Rejected, Expired, Archived)
├── Tab Content (per status)
│   ├── Empty State (if no posts)
│   ├── PostingCard[] (paginated list)
│   └── Pagination Controls (if > 10 posts)
└── PostingCard (separate component)
    ├── Status Badge
    ├── Type Badge
    ├── Domain Badges (3-level hierarchy)
    ├── Metadata (location, urgency, dates)
    └── Actions (View, Edit, Delete)
```

### Key Functions

- `getFilteredPostings()` - Filters all posts by active tab
- `getPaginatedPostings()` - Returns current page of filtered posts
- `getTotalPages()` - Calculates total pages for pagination
- `getTabCount(status)` - Returns count for each tab badge

### State Management

```typescript
const [allPostings, setAllPostings] = useState<Posting[]>([]);
const [activeTab, setActiveTab] = useState<StatusTab>('all');
const [currentPage, setCurrentPage] = useState(1);
```

## UI/UX Benefits

### Before
- ❌ "Show Archived" checkbox didn't work
- ❌ All posts loaded at once (performance issue)
- ❌ No way to filter by status
- ❌ Confusing to find specific posts
- ❌ Deleted posts still visible with status badge

### After
- ✅ Tab-based filtering with 6 clear categories
- ✅ Pagination (10 per page) for better performance
- ✅ Badge counts on each tab
- ✅ Archived posts only visible in Archived tab
- ✅ Auto-switch to Archived tab after deletion
- ✅ Clean, modern UI with shadcn/ui Tabs component

## Testing Updates

Updated E2E test (Test 5) to work with new tab-based UI:

**Before:**
```typescript
const showArchivedCheckbox = page.locator('input[type="checkbox"]').first();
await showArchivedCheckbox.check();
```

**After:**
```typescript
// Verify auto-switch to Archived tab
const archivedTab = page.locator('[role="tab"][data-state="active"]')
  .filter({ hasText: 'Archived' });
await expect(archivedTab).toBeVisible();

// Verify not visible in All tab
const allTab = page.locator('[role="tab"]').filter({ hasText: /^All/ });
await allTab.click();
const cardInAllTab = getPostingCard(page, postingTitle);
await expect(cardInAllTab).not.toBeVisible();
```

## API Considerations

Current implementation uses client-side filtering for fast tab switching. For future optimization with large datasets:

### Potential Backend Enhancement
```javascript
// Add status filter to API endpoint
GET /api/postings/my/:userId?status=active&limit=10&offset=0
GET /api/postings/my/:userId?status=archived&limit=10&offset=0
```

This would:
- Reduce data transfer for users with many posts
- Enable true server-side pagination
- Reduce client-side processing

## Files Modified

1. **src/pages/MyPostingsPage.tsx** - Complete rewrite with tabs and pagination
2. **tests/e2e/posts-workflow-clean.spec.ts** - Updated Test 5 for tab-based UI

## Dependencies Used

- `@/components/ui/tabs` - shadcn/ui Tabs component
- `@/components/ui/card` - Card wrapper component
- `@/components/ui/badge` - Status and count badges
- `@/components/ui/button` - Action buttons
- `lucide-react` - ChevronLeft, ChevronRight icons for pagination

## Performance Metrics

### Before
- Rendered all posts at once (could be 100+)
- No pagination controls
- Checkbox didn't filter

### After
- Renders maximum 10 posts per page
- Fast tab switching (client-side filtering)
- Clean separation of concerns

## User Flow Example

1. User navigates to `/postings/my`
2. Sees **All** tab (default) with non-archived posts
3. Creates a new post → appears in **Pending** tab (with badge count)
4. Moderator approves → moves to **Active** tab
5. User archives old post → auto-switches to **Archived** tab
6. Can view **Rejected** posts to see moderator feedback
7. Can check **Expired** posts to renew if needed

## Conclusion

The new tab-based UI with pagination provides:
- **Better performance** - Only renders 10 items at a time
- **Better UX** - Clear status-based organization
- **Better visibility** - Know exactly where archived posts are
- **Better scalability** - Ready for backend pagination if needed

The implementation follows React best practices with:
- Clean separation of concerns
- Reusable PostingCard component
- Type-safe TypeScript
- Modern UI with shadcn/ui components
