# Task 7.5: Alumni Directory

**Status:** 🟡 Planned
**Priority:** High
**Estimated Time:** 5-6 days

## Overview
Implement the alumni directory by migrating the prototype's searchable directory screen and replacing all mock data with real API integration. This creates the core discovery feature for alumni to find and connect with other members.

## Objectives
- Migrate alumni directory UI from prototype
- Implement real-time search and filtering
- Create profile card components with live data
- Add pagination and infinite scroll
- Ensure 100% mobile/tablet/desktop compatibility

## Prototype Reference
**Source:** `C:\React-Projects\SGSDataMgmtCore\prototypes\react-shadcn-platform`
- **Directory Screen:** `/src/pages/alumni-directory.tsx` - Complete directory interface
- **Directory Components:** Search bar, filter panel, profile cards, pagination
- **Layout:** Grid-based responsive layout with theme integration
- **Mock Data:** `mockAlumniProfiles`, `mockSearchResults`

## Technical Requirements

### Directory Data Structure
```typescript
// src/types/directory.ts
interface AlumniDirectoryResponse {
  data: AlumniCard[]
  metadata: PaginationMetadata
}

interface AlumniCard {
  userId: string
  displayName: string
  profilePictureUrl: string | null
  headline: string | null
  location: string | null
  graduationYear: number | null
  domains: string[]
  mutualConnectionsCount: number
  profileCompleteScore: number
  isConnected: boolean
}

interface DirectoryFilters {
  q?: string
  graduationYear?: number
  graduationYearRange?: [number, number]
  domain?: string[]
  location?: string
  batch?: string
}

interface PaginationMetadata {
  totalCount: number
  page: number
  perPage: number
  hasMore: boolean
}
```

### Directory Components
```typescript
// src/components/directory/AlumniDirectory.tsx
export function AlumniDirectory() {
  const [filters, setFilters] = useState<DirectoryFilters>({})
  const { data, loading, error, fetchMore } = useAlumniDirectory(filters)

  if (loading && !data) return <DirectorySkeleton />
  if (error) return <ErrorDisplay error={error} />

  return (
    <div className="directory-container">
      <SearchBar onSearch={(q) => setFilters({ ...filters, q })} />
      <FilterPanel filters={filters} onChange={setFilters} />
      <AlumniGrid alumni={data.data} />
      {data.metadata.hasMore && (
        <LoadMoreButton onClick={fetchMore} loading={loading} />
      )}
    </div>
  )
}
```

### Data Fetching Hook
```typescript
// src/hooks/useAlumniDirectory.ts
export function useAlumniDirectory(filters: DirectoryFilters) {
  return useInfiniteQuery({
    queryKey: ['alumni-directory', filters],
    queryFn: async ({ pageParam = 1 }) => {
      return api.searchAlumni({
        ...filters,
        page: pageParam,
        perPage: 20
      })
    },
    getNextPageParam: (lastPage) => 
      lastPage.metadata.hasMore ? lastPage.metadata.page + 1 : undefined,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}
```

## Implementation Steps

### Step 1: Migrate Directory UI
- [ ] Copy alumni directory from prototype
- [ ] Adapt component structure for production
- [ ] Update imports to use local components
- [ ] Remove all mock data references

### Step 2: Implement Search Components
- [ ] Create search bar with debouncing
- [ ] Build filter panel component
- [ ] Implement profile card component
- [ ] Add pagination/infinite scroll

### Step 3: API Integration
- [ ] Connect to GET /api/alumni endpoint
- [ ] Implement search query handling
- [ ] Integrate filter parameters
- [ ] Add pagination logic

### Step 4: Mobile Optimization
- [ ] Implement responsive grid layout
- [ ] Optimize touch targets for mobile
- [ ] Add pull-to-refresh gesture
- [ ] Ensure proper mobile spacing

### Step 5: Performance Optimization
- [ ] Implement search debouncing (300ms)
- [ ] Add result caching strategies
- [ ] Optimize re-rendering with memoization
- [ ] Add skeleton loading states

### Step 6: Accessibility Enhancement
- [ ] Add proper ARIA labels and roles
- [ ] Ensure keyboard navigation works
- [ ] Add screen reader support
- [ ] Implement focus management

## Directory Features

### Search Functionality
- **Text Search:** Search by name, headline, company
- **Debouncing:** 300ms debounce to reduce API calls
- **Highlighting:** Highlight matching text in results
- **Recent Searches:** Store recent search queries

### Filter Options
- **Graduation Year:** Single year or range filter
- **Domain:** Multi-select domain filter
- **Location:** Location-based filtering
- **Batch:** Batch/cohort filter
- **Connection Status:** Filter by connection status

### Profile Cards
- **Profile Picture:** Avatar with fallback initials
- **Name & Headline:** Display name and professional headline
- **Location:** Current location display
- **Graduation Info:** Year and batch information
- **Domains:** Visual domain tags
- **Connection Status:** Connected, pending, or connect button
- **Mutual Connections:** Display mutual connections count

### Pagination
- **Load More Button:** Manual loading for mobile
- **Infinite Scroll:** Auto-load on desktop
- **Page Size:** 20 profiles per page
- **Total Count:** Display total matching results

## Cross-Platform Compatibility

### Mobile Directory (< 640px)
- **Single Column:** One profile card per row
- **Large Touch Targets:** 44px minimum for buttons
- **Pull-to-Refresh:** Native refresh gesture
- **Sticky Search:** Search bar stays at top

### Tablet Directory (640px - 1024px)
- **Two Column Grid:** Two profile cards per row
- **Filter Drawer:** Slide-in filter panel
- **Hybrid Scroll:** Load more button + infinite scroll
- **Orientation Adaptive:** Layout adjusts to orientation

### Desktop Directory (> 1024px)
- **Multi-Column Grid:** 3-4 profile cards per row
- **Sidebar Filters:** Persistent filter panel
- **Infinite Scroll:** Auto-load on scroll
- **Keyboard Shortcuts:** Quick navigation shortcuts

## Performance Standards

### Loading Performance
- [ ] **Initial Load:** < 1.2 seconds (native-first target)
- [ ] **Search Response:** < 300ms for search queries
- [ ] **Filter Application:** Instant filter updates
- [ ] **Skeleton Display:** Immediate skeleton loading

### Search Performance
- [ ] **Debounce Delay:** 300ms for text search
- [ ] **Filter Debounce:** 100ms for filter changes
- [ ] **Cache Strategy:** 2-minute stale time
- [ ] **Background Prefetch:** Prefetch next page

### Runtime Performance
- [ ] **Smooth Scrolling:** 60fps scrolling performance
- [ ] **Image Lazy Loading:** Load images as they appear
- [ ] **Memory Usage:** < 75MB heap size
- [ ] **List Virtualization:** Virtual scrolling for large lists

## Success Criteria

### Functional Requirements
- [ ] **Search Works:** Text search returns relevant results
- [ ] **Filters Apply:** All filters correctly narrow results
- [ ] **Pagination Works:** Load more/infinite scroll functional
- [ ] **Profile Cards:** All profile information displays correctly
- [ ] **Connect Button:** Connection requests work from directory
- [ ] **Profile Navigation:** Clicking card navigates to full profile
- [ ] **Empty States:** Helpful messages when no results

### User Experience
- [ ] **Loading States:** Skeleton loading for all components
- [ ] **Error Handling:** Graceful error displays with retry options
- [ ] **Empty States:** Clear messaging for no results
- [ ] **Responsive Design:** Perfect adaptation to all screen sizes
- [ ] **Touch Friendly:** Optimized for touch interactions
- [ ] **Keyboard Accessible:** Full keyboard navigation support

### Performance Requirements
- [ ] **Search Speed:** < 300ms search response time
- [ ] **Smooth Scrolling:** 60fps scroll performance
- [ ] **Memory Efficient:** No memory leaks
- [ ] **Network Efficient:** Minimal redundant requests
- [ ] **Cache Effective:** Reduced API calls with caching

### Technical Standards
- [ ] **Code Quality:** Passes all linting and quality checks
- [ ] **Type Safety:** 100% TypeScript coverage
- [ ] **Testing:** Unit and integration tests for all components
- [ ] **Accessibility:** WCAG 2.1 AA compliance
- [ ] **Documentation:** Complete component documentation

## Dependencies

### Required Before Starting
- ✅ **API Foundation:** Task 7.1 API service layer complete
- ✅ **Authentication:** Task 7.3 authentication system working
- ✅ **Schema Mapping:** Task 7.2 directory data mapping complete
- ✅ **UI Components:** Directory widget components available

### External Dependencies
- **Directory API:** GET /api/alumni endpoint ready
- **Search Service:** Search algorithm implemented
- **Profile Service:** Profile data access endpoints
- **Connection Service:** Connection request endpoints

## Risk Mitigation

### Search Performance Issues
- **Debouncing:** Prevent excessive API calls
- **Caching:** Cache search results
- **Lazy Loading:** Load results progressively
- **Index Optimization:** Database indexes on search fields

### Large Dataset Handling
- **Pagination:** Limit results per page
- **Virtualization:** Virtual scrolling for performance
- **Lazy Images:** Load images on demand
- **Progressive Loading:** Load in chunks

### Mobile Performance
- **Optimize Images:** Responsive image sizing
- **Reduce Bundle:** Code splitting for directory
- **Cache Aggressively:** Reduce network requests
- **Network Awareness:** Adapt to connection quality

## Validation Steps

### After Implementation
```bash
# Run quality validation scripts
npm run lint
npm run check-redundancy
npm run test:run

# Test directory specifically
npm run test:directory-search
npm run test:directory-filters
npm run test:directory-pagination

# Cross-platform testing
npm run test:mobile-directory
npm run test:tablet-directory
npm run test:desktop-directory

# Validate documentation
npm run validate-documentation-standards
```

### Manual Testing Checklist
- [ ] Search returns relevant results
- [ ] All filters work correctly
- [ ] Pagination loads more results
- [ ] Profile cards display all data
- [ ] Connect button sends requests
- [ ] Navigation to profiles works
- [ ] Mobile layout perfect
- [ ] Tablet layout adapts properly
- [ ] Desktop layout uses full space
- [ ] Keyboard navigation works
- [ ] Screen readers navigate correctly
- [ ] Performance meets targets
- [ ] Error states handled gracefully

## Next Steps
1. **Migrate UI:** Copy directory from prototype and adapt
2. **Implement Search:** Create search and filter components
3. **API Integration:** Connect to real directory endpoints
4. **Mobile Optimization:** Ensure perfect cross-platform compatibility
5. **Performance Tuning:** Optimize search and rendering performance

---

*Task 7.5 creates the core alumni discovery feature, enabling members to search, filter, and connect with other alumni through a performant and accessible directory interface.*
