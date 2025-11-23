---
version: "1.0"
status: implemented
last_updated: 2025-11-23
applies_to: all
---

# System Overview

## Architecture Summary

The SGS Gita Alumni platform follows a simplified, cloud-ready architecture designed for rapid development and seamless AWS deployment. The system separates concerns between frontend presentation, backend API services, and data persistence layers.

## System Components

### Frontend Application

**Status**: Implemented

```
React 18 + TypeScript + Vite
├── Components (shadcn/ui based)
├── Pages (lazy-loaded)
├── Hooks (custom data management)
├── Services (API abstraction)
└── Utils (shared utilities)
```

**Implementation**: `/src/`

### Backend API

**Status**: Implemented

```
Express.js + MySQL
├── RESTful API endpoints
├── Database connection pooling
├── JWT authentication
├── Data validation (Zod)
├── Error handling
└── Structured logging
```

**Implementation**: `/server.js`, `/routes/`, `/services/`

### Infrastructure

```
Development: Local Environment
├── Vite dev server
├── Hot module replacement
├── Mock data layer (optional)
└── Local MySQL

Production: AWS Cloud
├── Elastic Beanstalk (application)
├── RDS MySQL (database)
├── CloudFront (CDN)
├── S3 (file storage)
└── CloudWatch (monitoring)
```

## Component Hierarchy

### Frontend Structure

```
App
├── Router
│   ├── HomePage (lazy)
│   ├── AdminPage (lazy)
│   ├── ProfilePage (lazy)
│   └── SettingsPage (lazy)
├── Layout
│   ├── Header
│   ├── Navigation
│   └── Footer
└── Providers
    ├── ThemeProvider
    ├── AuthProvider
    └── DataProvider
```

### Backend Structure

```
server.js (entry point)
├── Middleware
│   ├── Authentication (auth.js)
│   ├── Rate Limiting (rateLimit.js)
│   ├── Monitoring (monitoring.js)
│   └── Error Handler (errorHandler.js)
├── Routes
│   ├── /api/auth
│   ├── /api/users
│   ├── /api/alumni-members
│   ├── /api/postings
│   └── /api/invitations
└── Services
    ├── Database operations
    └── Business logic
```

## Design Principles

### Separation of Concerns

| Layer | Responsibility | Implementation |
|-------|---------------|----------------|
| Presentation | UI rendering | React components |
| Logic | Business rules | Custom hooks, services |
| Data | Data operations | Service layer, API |
| State | Global state | Context providers |

### Component Design

- **Single Responsibility**: Each component has one clear purpose
- **Composition**: Build complex UIs from simple components
- **Reusability**: Components work across different contexts
- **Accessibility**: WCAG 2.1 AA compliance built-in

### Security Principles

- **Defense in Depth**: Multiple security layers
- **Least Privilege**: Minimal required permissions
- **Input Validation**: All inputs validated and sanitized
- **Secure Defaults**: Security enabled by default

## Data Model Architecture

### Core Entities

```
Data Separation Architecture:
├── Alumni Members (Source Data) → alumni_members table
├── App Users (Authenticated) → users table
├── User Profiles (Extended) → user_profiles table
├── Family Members → family_members table
└── Invitations (Access Control) → user_invitations table
```

### Entity Relationships

- Users can have multiple family members
- Alumni members are separate from app users (source data vs platform users)
- Invitations link alumni members to user registration

## File Organization

### Source Structure

```
src/
├── components/
│   ├── ui/           # Base UI components (shadcn)
│   ├── forms/        # Form components
│   ├── layout/       # Layout components
│   └── features/     # Feature-specific components
├── pages/            # Page components (lazy-loaded)
├── hooks/            # Custom React hooks
├── services/         # API and data services
├── lib/              # Utility libraries
├── types/            # TypeScript type definitions
└── styles/           # Global styles and themes
```

### Backend Structure

```
/
├── server.js         # Main server entry
├── routes/           # API route handlers
├── services/         # Business logic services
├── middleware/       # Express middleware
├── utils/            # Utility functions
├── config/           # Configuration files
└── server/
    ├── errors/       # Custom error classes
    └── middleware/   # Additional middleware
```

## Integration Points

### External Services

| Service | Purpose | Status |
|---------|---------|--------|
| MySQL (RDS) | Primary database | Implemented |
| Redis | Rate limiting, caching | Implemented |
| AWS S3 | File storage | Planned |
| CloudWatch | Monitoring | Planned |
| Sentry | Error tracking | Planned |

### Third-Party Libraries

**Frontend:**
- shadcn/ui (UI components)
- Tailwind CSS (styling)
- Lucide React (icons)
- React Hook Form (forms)
- Zod (validation)

**Backend:**
- express-rate-limit (rate limiting)
- jsonwebtoken (JWT auth)
- mysql2 (database)
- zod (validation)

## Scalability Considerations

### Horizontal Scaling

- **Stateless API**: No server-side session state
- **Connection Pooling**: MySQL pool with configurable limits
- **CDN**: CloudFront for static asset delivery
- **Load Balancing**: Elastic Beanstalk auto-scaling

### Performance Scaling

- **Code Splitting**: Lazy-loaded routes and components
- **Caching**: Multi-level caching (memory, localStorage, HTTP)
- **Database**: Indexed queries, connection pooling
- **Monitoring**: Real-time performance tracking

## Development Workflow

### Local Development

1. **Setup**: `npm install` and environment configuration
2. **Development**: `npm run dev` starts local server
3. **Testing**: `npm run test` for unit tests
4. **Quality**: `npm run lint` and code analysis
5. **Build**: `npm run build` for production bundle

### Deployment Pipeline

1. **Build**: Frontend bundle creation
2. **Test**: Automated test suite
3. **Deploy**: Elastic Beanstalk deployment
4. **Verify**: Health checks and smoke tests
5. **Monitor**: CloudWatch metrics review

## Related Specifications

- [Data Flow](./data-flow.md) - Detailed data flow patterns
- [API Design](./api-design.md) - API standards and patterns
- [Performance](./performance.md) - Performance optimization
- [Error Handling](./error-handling.md) - Error handling patterns
