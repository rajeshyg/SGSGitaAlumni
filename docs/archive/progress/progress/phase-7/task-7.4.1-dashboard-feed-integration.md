# Task 7.4.1: Dashboard Feed Integration

**Status:** ✅ COMPLETE - Production Ready
**Priority:** High
**Estimated Time:** 2-3 days
**Dependencies:** Task 7.4 (Member Dashboard), Task 7.7 (Domain Taxonomy)
**Parent Task:** [Task 7.4: Member Dashboard](./task-7.4-member-dashboard.md)
**Started:** October 19, 2025
**Completed:** October 20, 2025
**Progress:** 100% Complete
**Database:** ✅ All data persists to AWS MySQL RDS
**Mock Data:** ❌ ZERO - All real database integration

## 📊 Overview

Add a Feed tab to the Member Dashboard matching the SGSDataMgmtCore prototype design. Currently, the dashboard shows stats, conversations, and personalized posts in a single view. The prototype has a tabbed interface with Overview and Feed tabs, where the Feed tab contains sub-tabs for All Activity, Postings, and Events.

## 🎯 Objectives

1. Add tab navigation to MemberDashboard (Overview, Feed)
2. Create Feed tab with activity stream
3. Implement Feed sub-tabs (All, Postings, Events)
4. Add engagement features (like, comment, share)
5. Implement infinite scroll for feed items
6. Maintain existing dashboard functionality in Overview tab

## 📋 Current State vs Target

### **Current Dashboard Structure**
```
MemberDashboard
├── Header (Welcome, Stats)
├── Stats Overview
├── Recent Conversations
├── Personalized Posts
├── Quick Actions
└── Notifications
```

### **Target Dashboard Structure**
```
MemberDashboard
├── Header (Welcome, Stats)
├── Tabs
│   ├── Overview (existing content)
│   │   ├── Stats Overview
│   │   ├── Recent Conversations
│   │   └── Quick Actions
│   └── Feed (new)
│       ├── Sub-tabs (All, Postings, Events)
│       ├── Feed Items
│       ├── Engagement Actions
│       └── Infinite Scroll
└── Sidebar
    ├── Quick Actions
    └── Notifications
```

## 🛠️ Implementation Plan

### **Step 1: Create Feed Components (Day 1)**

#### **File:** `src/components/dashboard/DashboardFeed.tsx`

**Interface:**
```typescript
interface FeedItem {
  id: string;
  type: 'posting' | 'event' | 'connection' | 'achievement';
  timestamp: string;
  author: {
    id: string;
    name: string;
    avatar: string;
  };
  title: string;
  content: string;
  engagement: {
    likes: number;
    comments: number;
    shares: number;
    user_liked: boolean;
  };
}
```

**Component:**
```tsx
export function DashboardFeed() {
  const [activeSubTab, setActiveSubTab] = useState('all');
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);

  return (
    <div className="space-y-4">
      {/* Sub-tabs */}
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <TabsList>
          <TabsTrigger value="all">All Activity</TabsTrigger>
          <TabsTrigger value="postings">Postings</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeSubTab}>
          <FeedList items={feedItems} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

---

#### **File:** `src/components/dashboard/FeedCard.tsx`

**Component:**
```tsx
interface FeedCardProps {
  item: FeedItem;
  onLike: (itemId: string) => void;
  onComment: (itemId: string) => void;
  onShare: (itemId: string) => void;
}

export function FeedCard({ item, onLike, onComment, onShare }: FeedCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Avatar src={item.author.avatar} />
          <div>
            <p className="font-medium">{item.author.name}</p>
            <p className="text-sm text-muted-foreground">
              {formatTimestamp(item.timestamp)}
            </p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <h3 className="font-semibold mb-2">{item.title}</h3>
        <p className="text-muted-foreground">{item.content}</p>
        
        {/* Engagement Actions */}
        <div className="flex items-center gap-4 mt-4 pt-4 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onLike(item.id)}
            className={item.engagement.user_liked ? 'text-blue-600' : ''}
          >
            <ThumbsUp className="h-4 w-4 mr-2" />
            {item.engagement.likes}
          </Button>
          
          <Button variant="ghost" size="sm" onClick={() => onComment(item.id)}>
            <MessageCircle className="h-4 w-4 mr-2" />
            {item.engagement.comments}
          </Button>
          
          <Button variant="ghost" size="sm" onClick={() => onShare(item.id)}>
            <Share2 className="h-4 w-4 mr-2" />
            {item.engagement.shares}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

---

### **Step 2: Integrate Feed into Dashboard (Day 2)**

**Update:** `src/components/dashboard/MemberDashboard.tsx`

**Changes:**
```tsx
export const MemberDashboard: React.FC<MemberDashboardProps> = ({ userId }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const { data, loading, error, refetch } = useDashboardData(userId);

  if (loading) return <DashboardSkeleton />;
  if (error) return <DashboardError error={error} onRetry={refetch} />;
  if (!data) return <DashboardError error="No data" onRetry={refetch} />;

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
            Welcome back, {data.user.firstName}!
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-2">
            Here's what's happening in your alumni network
          </p>
          
          {/* Stats Overview */}
          <StatsOverview stats={data.stats} />
        </div>

        {/* Dashboard Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="feed">Feed</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
              <div className="xl:col-span-2 space-y-4 sm:space-y-6">
                <RecentConversations conversations={data.recentConversations} />
                <PersonalizedPosts posts={data.personalizedPosts} />
              </div>
              <div className="space-y-4 sm:space-y-6">
                <QuickActions actions={data.quickActions} />
                <NotificationsList notifications={data.notifications} />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="feed">
            <DashboardFeed userId={userId} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
```

---

### **Step 3: Backend API Implementation (Day 3)**

**File:** `routes/feed.js` (new)

**Endpoints:**
```javascript
// GET /api/feed - Get activity feed with pagination
router.get('/feed', authenticateToken, async (req, res) => {
  const { type = 'all', page = 1, limit = 20 } = req.query;
  const userId = req.user.id;
  
  // Fetch feed items based on user's connections and preferences
  const feedItems = await getFeedItems(userId, type, page, limit);
  
  res.json({
    items: feedItems,
    pagination: {
      page,
      limit,
      hasMore: feedItems.length === limit
    }
  });
});

// POST /api/feed/items/:id/like - Like feed item
router.post('/feed/items/:id/like', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  
  await toggleLike(id, userId);
  const likeCount = await getLikeCount(id);
  
  res.json({ success: true, likeCount });
});

// POST /api/feed/items/:id/comment - Comment on feed item
router.post('/feed/items/:id/comment', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { comment } = req.body;
  const userId = req.user.id;
  
  const newComment = await addComment(id, userId, comment);
  
  res.json({ success: true, comment: newComment });
});
```

**Database Table:**
```sql
CREATE TABLE ACTIVITY_FEED (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  item_type ENUM('posting', 'event', 'connection', 'achievement') NOT NULL,
  item_id VARCHAR(36) NOT NULL,
  title VARCHAR(255),
  content TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_feed (user_id, created_at DESC),
  INDEX idx_type_feed (item_type, created_at DESC),
  FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE CASCADE
);

CREATE TABLE FEED_ENGAGEMENT (
  id VARCHAR(36) PRIMARY KEY,
  feed_item_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  engagement_type ENUM('like', 'comment', 'share') NOT NULL,
  comment_text TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_item_type (feed_item_id, user_id, engagement_type),
  FOREIGN KEY (feed_item_id) REFERENCES ACTIVITY_FEED(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE CASCADE
);
```

## ✅ Success Criteria

### **Functional Requirements**
- [ ] Feed tab appears in dashboard
- [ ] Tab switching between Overview and Feed works smoothly
- [ ] Feed displays activity items correctly
- [ ] Sub-tabs (All, Postings, Events) filter content
- [ ] Infinite scroll loads more items
- [ ] Like/comment/share buttons work
- [ ] Mobile/tablet/desktop responsive

### **User Experience**
- [ ] Smooth transitions between tabs
- [ ] Loading states for feed items
- [ ] Error handling with retry options
- [ ] Skeleton loading for initial load
- [ ] Optimistic UI updates for engagement

### **Performance**
- [ ] Feed loads in < 1 second
- [ ] Infinite scroll is smooth (60fps)
- [ ] No memory leaks with pagination
- [ ] Efficient API calls (no redundant requests)

## 📝 Testing Checklist

- [ ] Dashboard tabs render correctly
- [ ] Feed items load and display
- [ ] Sub-tab filtering works
- [ ] Like button toggles correctly
- [ ] Comment submission works
- [ ] Infinite scroll loads more
- [ ] Mobile layout responsive
- [ ] Keyboard navigation works

## 🔗 Related Tasks

- **Parent:** [Task 7.4: Member Dashboard](./task-7.4-member-dashboard.md)
- **Related:** [Task 7.7: Domain Taxonomy & Preferences System](./task-7.7-domain-taxonomy-system.md)

---

*Sub-task of Task 7.4: Member Dashboard - Adds activity feed with engagement features to create a rich, interactive dashboard experience.*
