# SGSGita Alumni Architecture

## Overview

This document outlines the core architectural decisions for the SGSGita Alumni platform, focusing on a simplified, AWS-ready architecture that prioritizes developer experience, cost efficiency, and scalability.

## Architecture Philosophy

### Design Principles
- **Simplicity First**: Minimize complexity while maintaining functionality
- **AWS Native**: Designed for cloud-first deployment and scaling
- **Developer Experience**: Fast iteration cycles and easy debugging
- **Cost Efficiency**: Pay-per-use model with minimal infrastructure overhead
- **Quality Focused**: Built-in quality assurance and monitoring

### Technology Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Express.js (AWS Elastic Beanstalk ready)
- **Database**: MySQL (AWS RDS ready)
- **Deployment**: AWS Elastic Beanstalk + RDS
- **Monitoring**: Sentry + CloudWatch

## Core Architecture Decisions

### 1. Simplified Data Layer
**Decision**: Mock data layer with localStorage persistence for development
**Rationale**: Eliminates complex backend setup during development while maintaining AWS migration path

```typescript
// Mock Data Layer Features:
- In-memory data management
- localStorage persistence
- Search and pagination
- CRUD operations
- Export functionality (CSV/JSON)
```

### 2. Component-Level Optimization
**Decision**: React.lazy() + Suspense for code splitting
**Rationale**: Reduces initial bundle size and improves loading performance

```typescript
// Lazy Loading Implementation
const AdminPage = lazy(() => import('./pages/AdminPage'))
const HomePage = lazy(() => import('./pages/HomePage'))

<Suspense fallback={<LoadingComponent />}>
  <Routes>...</Routes>
</Suspense>
```

### 3. Caching Strategy
**Decision**: 5-minute TTL cache for data operations
**Rationale**: Balances data freshness with performance

### 4. AWS-Ready Architecture
**Decision**: Design for AWS Elastic Beanstalk + RDS deployment
**Rationale**: Provides scalability, reliability, and cost-effective hosting

## System Components

### Frontend Layer
- **React Application**: Main user interface
- **Component Library**: shadcn/ui based components
- **State Management**: React Context + hooks
- **Routing**: React Router with lazy loading

### Data Layer
- **Development**: Mock data with localStorage
- **Production**: Express.js API + MySQL database
- **Caching**: Client-side caching with TTL

### Infrastructure Layer
- **Development**: Local development server
- **Production**: AWS Elastic Beanstalk + RDS + CloudFront

## Migration Path

### Phase 1: Development (Current)
- Mock data layer for rapid development
- Local development environment
- Component-based architecture

### Phase 2: AWS Migration
- Deploy Express.js backend to Elastic Beanstalk
- Configure MySQL RDS instance
- Set up CloudFront CDN
- Implement production monitoring

## Quality Integration

This architecture integrates with comprehensive quality assurance systems:
- **Standards**: See [Quality Standards](docs/QUALITY_STANDARDS.md)
- **Security**: See [Security Architecture](docs/architecture/SECURITY_ARCHITECTURE.md)
- **Performance**: See [Performance Architecture](docs/architecture/PERFORMANCE_ARCHITECTURE.md)
- **Data Flow**: See [Data Flow](docs/architecture/DATA_FLOW.md)

## Benefits

### Development Benefits
- **Fast Setup**: No complex infrastructure required
- **Rapid Iteration**: Hot reload and instant feedback
- **Easy Testing**: Isolated components with mock data
- **Clear Structure**: Well-defined component architecture

### Production Benefits
- **Scalability**: AWS auto-scaling capabilities
- **Reliability**: Enterprise-grade infrastructure
- **Cost Efficiency**: Pay-per-use model
- **Monitoring**: Comprehensive error tracking and performance monitoring

## Next Steps

1. **Complete Development**: Finalize component development with mock data
2. **AWS Setup**: Configure Elastic Beanstalk and RDS
3. **Backend Migration**: Deploy Express.js API
4. **Production Testing**: Load testing and performance validation
5. **Monitoring Setup**: Configure CloudWatch and Sentry integration

For detailed implementation guidance, see:
- [System Overview](docs/architecture/OVERVIEW.md)
- [Security Architecture](docs/architecture/SECURITY_ARCHITECTURE.md)
- [Performance Architecture](docs/architecture/PERFORMANCE_ARCHITECTURE.md)
- [Data Flow](docs/architecture/DATA_FLOW.md)




  private orientation: 'portrait' | 'landscape'
  private touchSupport: boolean

  constructor() {
    this.detectPlatform()
    this.detectOrientation()
    this.detectTouchSupport()
    this.setupPlatformListeners()
  }

  private detectPlatform(): void {
    const width = window.innerWidth
    if (width < 768) {
      this.platform = 'mobile'
    } else if (width < 1024) {
      this.platform = 'tablet'
    } else {
      this.platform = 'desktop'
    }
  }

  private detectOrientation(): void {
    this.orientation = window.innerHeight > window.innerWidth ? 'portrait' : 'landscape'
  }

  private detectTouchSupport(): void {
    this.touchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0
  }

  private setupPlatformListeners(): void {
    window.addEventListener('resize', () => {
      this.detectPlatform()
      this.detectOrientation()
      this.notifyPlatformChange()
    })

    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        this.detectOrientation()
        this.notifyPlatformChange()
      }, 100)
    })
  }

  getPlatformConfig(): PlatformConfig {
    return {
      platform: this.platform,
      orientation: this.orientation,
      touchSupport: this.touchSupport,
      minTouchTarget: this.platform === 'mobile' ? 44 : 32,
      supportsHover: this.platform === 'desktop',
      supportsSwipe: this.touchSupport,
      prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches
    }
  }

  private notifyPlatformChange(): void {
    // Notify components of platform changes
    window.dispatchEvent(new CustomEvent('platformChange', {
      detail: this.getPlatformConfig()
    }))
  }
}
```

## Component Architecture Patterns

### Enhancement vs. Replacement Strategy

#### Always Enhance First
Before creating new components, enhance existing ones to maintain consistency and reduce bundle size:

```typescript
// ✅ Enhancement approach: Extend existing component
interface AdvancedTableProps extends TableProps {
  selection?: SelectionConfig;
  groupHeaders?: GroupHeaderConfig[];
  frozenColumns?: FrozenColumnsConfig;
  // ... additional features
}

// ❌ Avoid: Complete replacement creates maintenance overhead
interface BrandNewTableProps {
  // Rebuilding everything from scratch
}
```

#### Wrapper Pattern for Complex Features
For significant enhancements, use the wrapper pattern to maintain backward compatibility:

```typescript
// ✅ Wrapper pattern preserves existing API while adding features
export function AdvancedDataTable<T>(props: AdvancedDataTableProps<T>) {
  // Advanced logic here
  return (
    <div className="advanced-table-wrapper">
      <Table {...baseTableProps}>
        {/* Enhanced content */}
      </Table>
    </div>
  );
}
```

### Component Architecture Standards

#### File Organization
```
src/components/ui/
├── advanced-data-table.tsx     # New advanced component
├── table.tsx                   # Original shadcn/ui component (unchanged)
├── enhanced-table.tsx          # Legacy component (if exists)
└── index.ts                    # Export all components
```

#### Export Strategy
```typescript
// src/components/ui/index.ts
export { Table } from './table'                    // Original
export { AdvancedDataTable } from './advanced-data-table'  // New
export type { AdvancedDataTableProps } from './advanced-data-table'
```

### TypeScript Standards

#### Interface Design
```typescript
// ✅ Comprehensive interface design with clear feature separation
export interface AdvancedDataTableProps<T = any> {
  // Core data
  data: T[];
  columns: ColumnDef<T>[];

  // Feature configurations
  selection?: SelectionConfig<T>;
  groupHeaders?: GroupHeaderConfig[];
  frozenColumns?: FrozenColumnsConfig;
  mobile?: MobileConfig;

  // Behavior props
  searchable?: boolean;
  sortable?: boolean;
  pagination?: boolean;

  // Event handlers
  onRowClick?: (row: T) => void;
  onSelectionChange?: (rows: T[]) => void;

  // Styling
  className?: string;
}
```

#### Generic Type Support
```typescript
// ✅ Proper generic type usage for type safety
export function AdvancedDataTable<T = any>({
  data,
  columns,
  onRowClick
}: AdvancedDataTableProps<T>) {
  const handleRowClick = (row: T) => {
    onRowClick?.(row); // Type-safe callback
  };
}
```

### Performance Standards

#### Component Size Limits
- **Maximum 500 lines** per component file
- Split large components into smaller, focused components
- Use composition over inheritance for maintainability

#### Lazy Loading Implementation
```typescript
// ✅ Implement lazy loading for large datasets
import { lazy, Suspense } from 'react';

const AdvancedDataTable = lazy(() => import('./advanced-data-table'));

export function LazyAdvancedDataTable(props: AdvancedDataTableProps) {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <AdvancedDataTable {...props} />
    </Suspense>
  );
}
```

### CSS Variable Management

#### Critical Rule: Never Override Theme Variables
```css
/* ❌ NEVER DO THIS: Static CSS variables break theme switching */
:root {
  --muted: 210 40% 96%;          /* Overrides theme system */
  --background: 0 0% 100%;       /* Prevents dark mode */
  --foreground: 222.2 84% 4.9%;  /* Breaks theme injection */
}

/* ✅ CORRECT: Only non-theme static variables */
:root {
  --radius: 0.5rem;             /* Layout constant */
  --table-row-height: 48px;     /* Component constant */
  --table-selection-width: 48px; /* Component constant */
}
```

#### Component Styling Rules
```typescript
// ✅ ALWAYS use dynamic CSS variables in components
<div style={{ backgroundColor: 'hsl(var(--muted))' }}>
<thead style={{ backgroundColor: 'hsl(var(--muted))' }}>

// ❌ NEVER use hardcoded classes that conflict with theme system
<div className="bg-gray-100"> // Breaks dark mode
<thead className="bg-muted">  // May conflict with CSS overrides
```

## File Storage Architecture

### S3 Integration for User-Generated Content
```typescript
// S3 File Storage Configuration
interface S3FileStorageConfig {
  bucketName: string
  region: string
  accessKeyId: string
  secretAccessKey: string
  allowedFileTypes: string[]
  maxFileSize: number
  cdnUrl?: string
}

// File upload service for profile pictures, attachments, and social content
class S3FileService {
  private s3: AWS.S3
  private config: S3FileStorageConfig

  async uploadFile(file: File, userId: string, type: 'profile' | 'attachment' | 'social'): Promise<string> {
    // Validate file type and size
    this.validateFile(file, type)

    // Generate unique filename with user ID and timestamp
    const fileName = `${type}/${userId}/${Date.now()}-${file.name}`

    // Upload to S3 with appropriate permissions
    const uploadResult = await this.s3.upload({
      Bucket: this.config.bucketName,
      Key: fileName,
      Body: file,
      ContentType: file.type,
      ACL: 'private', // Private access for security
      Metadata: {
        userId: userId,
        uploadType: type,
        originalName: file.name
      }
    }).promise()

    return uploadResult.Location
  }

  async getFileUrl(key: string): Promise<string> {
    // Generate presigned URL for secure access
    const url = await this.s3.getSignedUrlPromise('getObject', {
      Bucket: this.config.bucketName,
      Key: key,
      Expires: 3600 // 1 hour expiry
    })

    return url
  }

  private validateFile(file: File, type: string): void {
    const allowedTypes = this.getAllowedTypes(type)
    if (!allowedTypes.includes(file.type)) {
      throw new Error(`File type ${file.type} not allowed for ${type}`)
    }

    if (file.size > this.config.maxFileSize) {
      throw new Error(`File size ${file.size} exceeds maximum allowed size`)
    }
  }

  private getAllowedTypes(type: string): string[] {
    switch (type) {
      case 'profile':
        return ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
      case 'attachment':
        return ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
      case 'social':
        return ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime']
      default:
        return []
    }
  }
}
```

### File Storage Security Features
- **Private Access**: All files stored with private ACL for security
- **Presigned URLs**: Secure temporary access to files
- **File Validation**: Type and size validation before upload
- **Metadata Tracking**: User ID and upload type tracking
- **CDN Integration**: Optional CloudFront integration for faster global access

## Migration to AWS

### AWS Service Priorities

#### Must-Have Services (Priority 1)
1. **Elastic Beanstalk**: Deploy Node.js/Express.js backend API server
2. **S3 (Simple Storage Service)**: Store user-generated content including:
   - Profile pictures and user avatars
   - File attachments and documents
   - Social posts related media content
3. **CloudWatch**: Basic logging and metrics for monitoring backend performance
4. **RDS (MySQL)**: Relational database for alumni data storage

#### Good-to-Have Services (Priority 2)
1. **API Gateway**: Rate limiting and API management (can wait)
2. **ECS Fargate**: Alternative deployment option if outgrowing Elastic Beanstalk
3. **CloudWatch Advanced**: Custom dashboards and detailed performance metrics

### Phase 1: Elastic Beanstalk + RDS + S3
1. **Deploy Express.js Backend**: Deploy server.js to AWS Elastic Beanstalk
2. **Configure MySQL RDS**: Use existing RDS instance for data storage
3. **Set up S3 File Storage**: Configure S3 buckets for user-generated content
4. **Set Environment Variables**:
   - Database connection string
   - AWS region
   - S3 bucket configuration
   - Authentication secrets
5. **Configure Security Groups**: Allow frontend-backend communication and S3 access

### Phase 2: Database Optimization
1. **Optimize MySQL RDS**: Configure connection pooling and query optimization
2. **Database Schema**: Ensure proper indexing for search and filtering
3. **Data Migration**: Import existing data from CSV uploads to MySQL
4. **Performance Tuning**: Optimize queries for alumni data operations

### Phase 3: Authentication & Security
1. **Session Management**: Implement secure session handling
2. **API Security**: Add authentication middleware to Express.js
3. **CORS Configuration**: Configure cross-origin resource sharing
4. **Input Validation**: Add request validation and sanitization

### Phase 4: Performance & Monitoring
1. **Application Monitoring**: Set up logging and error tracking
2. **Database Optimization**: Query optimization and connection pooling
3. **Caching Strategy**: Implement Redis for session and data caching
4. **CDN Integration**: CloudFront for static asset delivery

### Phase 5: Production Optimization
1. **Load Balancing**: Configure Elastic Load Balancer
2. **Auto Scaling**: Set up auto-scaling groups for the application
3. **Security Groups**: Configure network security
4. **SSL/TLS**: Enable HTTPS with SSL certificates

## File Structure Changes

### Removed Files
```
# Legacy backend infrastructure and database scripts removed
# Complex dependencies and server management eliminated
# Simplified to focus on frontend architecture and AWS-ready deployment
```

### Added/Modified Files
```
src/
├── lib/
│   └── mockData.ts          # New mock data layer
├── hooks/
│   └── useLazyData.ts       # New lazy loading hook
├── services/
│   └── APIService.ts        # Updated to use mock data
└── pages/
    └── AdminPage.tsx        # Updated to use lazy loading

vite.config.js               # Removed backend proxy
tsconfig.json               # Added for TypeScript
tsconfig.node.json          # Added for Vite
```

## Benefits Achieved

### Performance
- ⚡ **Faster Loading**: Lazy loading reduces initial bundle size
- 💾 **Efficient Caching**: 5-minute TTL prevents unnecessary requests
- 🚀 **Code Splitting**: Components load on-demand
- 📊 **Bundle Optimization**: Visual analysis prevents size bloat

### Quality Assurance
- 🛡️ **Quality Integration**: See [Quality Standards](docs/QUALITY_STANDARDS.md) for complete quality assurance details
- 🚨 **Error Tracking**: Sentry provides production insights

### Cost
- 💰 **Zero Infrastructure Costs**: No complex infrastructure during development
- 📊 **Pay-per-Use Ready**: AWS Elastic Beanstalk with auto-scaling
- 🔧 **Reduced Maintenance**: No server management or scaling overhead

### Developer Experience
- 🛠️ **Simplified Setup**: No complex dependencies or infrastructure
- 🔄 **Faster Iteration**: Hot reload and rapid development cycles
- 🧪 **Easy Testing**: Mock data for reliable and isolated testing
- 📝 **Clear Architecture**: Clean separation of concerns
- 🤖 **AI-Optimized**: File size limits for efficient AI collaboration

### Monitoring & Reliability
- 📈 **Error Tracking**: Sentry dashboard for production debugging
- 📊 **Performance Monitoring**: Bundle analysis and optimization insights
- 🔄 **Continuous Quality**: Automated checks prevent regressions
- 🚀 **Production Ready**: Enterprise-grade error handling and monitoring

### Scalability
- ☁️ **AWS Native**: Designed for cloud scalability
- 📈 **Auto Scaling**: Elastic Beanstalk auto-scaling groups
- 🌐 **Global CDN**: CloudFront for worldwide distribution
- 📊 **Quality Scaling**: Automated checks scale with team growth

## Next Steps

### AWS Migration
1. **Deploy to AWS**: Follow the migration phases above
2. **Database Setup**: Configure MySQL RDS instance
3. **Backend Deployment**: Deploy Express.js server to Elastic Beanstalk
4. **Security Configuration**: Set up authentication and security measures
5. **Monitoring Setup**: Configure CloudWatch and integrate with Sentry
6. **Performance Testing**: Load testing with realistic data volumes

### Quality Assurance Integration
See [Quality Standards](docs/QUALITY_STANDARDS.md) for complete quality assurance setup and monitoring guidelines.

## Migration Checklist

### AWS Migration
- [ ] Elastic Beanstalk application created and configured
- [ ] Express.js backend deployed to Elastic Beanstalk
- [ ] MySQL RDS instance configured and connected
- [ ] S3 buckets created for file storage (profile pictures, attachments, social content)
- [ ] S3 bucket policies and CORS configured
- [ ] Environment variables configured (including S3 configuration)
- [ ] Security groups and network configuration (including S3 access)
- [ ] SSL/TLS certificate configured
- [ ] Load balancer configured
- [ ] Auto-scaling groups set up
- [ ] CloudWatch monitoring integrated with Sentry
- [ ] Performance tested with quality metrics

### Quality Assurance Setup
See [Quality Standards](docs/QUALITY_STANDARDS.md) for complete quality assurance checklist and monitoring setup.

This simplified architecture provides a solid foundation for scaling to AWS while maintaining excellent developer experience and cost efficiency.