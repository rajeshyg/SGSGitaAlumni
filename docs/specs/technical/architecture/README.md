---
version: "1.0"
status: active
last_updated: 2025-11-23
applies_to: all
---

# Architecture Specifications

This directory contains the technical architecture specifications for the SGS Gita Alumni platform. These documents replace the previous monolithic `ARCHITECTURE.md` file with focused, maintainable specification files.

## Overview

The SGS Gita Alumni platform follows a cloud-ready architecture designed for rapid development and seamless AWS deployment. The system uses React 18 with TypeScript on the frontend, Express.js with MySQL on the backend, and AWS services for production infrastructure.

## Architecture Documents

### Core Architecture

| Document | Description | Status |
|----------|-------------|--------|
| [System Overview](./system-overview.md) | High-level system components and design principles | Implemented |
| [Data Flow](./data-flow.md) | Data flow patterns, state management, caching strategies | Implemented |

### API & Communication

| Document | Description | Status |
|----------|-------------|--------|
| [API Design](./api-design.md) | RESTful API patterns, request/response standards, rate limiting | Implemented |
| [Error Handling](./error-handling.md) | Standardized error responses, error codes, frontend/backend patterns | Implemented |

### Operations

| Document | Description | Status |
|----------|-------------|--------|
| [Logging](./logging.md) | Logging implementation, log levels, sensitive data filtering | Implemented |
| [Performance](./performance.md) | Performance targets, optimization strategies, monitoring | In Progress |

## Quick Reference

### Technology Stack

**Frontend:**
- React 18 + TypeScript + Vite
- shadcn/ui components + Tailwind CSS
- React Hook Form + Zod validation

**Backend:**
- Express.js with MySQL
- JWT authentication
- Rate limiting with Redis fallback

**Infrastructure:**
- AWS Elastic Beanstalk (application)
- RDS MySQL (database)
- CloudFront CDN
- S3 (file storage)

### Key Implementation Files

- **Backend Entry**: `/server.js`
- **API Routes**: `/routes/*.js`
- **Services**: `/services/*.js`
- **Middleware**: `/middleware/*.js`
- **Frontend Services**: `/src/services/*.ts`
- **Error Handling**: `/server/errors/ApiError.js`, `/server/middleware/errorHandler.js`
- **Logger**: `/utils/logger.js`

## Related Documentation

- [Security Specifications](../security/) - Authentication, authorization, data protection
- [Database Schema](../database/) - Data models and migrations
- [Deployment Guide](../deployment/) - Deployment procedures

## Migration Notes

This architecture specification structure replaces the previous monolithic documentation approach. Content was sourced from:

- `docs/archive/architecture/OVERVIEW.md`
- `docs/archive/architecture/DATA_FLOW.md`
- `docs/archive/architecture/PERFORMANCE_ARCHITECTURE.md`
- `docs/archive/guidelines/ERROR_HANDLING_GUIDE.md`
- `docs/specs/technical/api-standards.md`
- `docs/specs/technical/error-handling.md`

The archived files remain available for historical reference.
