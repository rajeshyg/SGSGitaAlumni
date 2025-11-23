---
title: Environment Configuration
version: 1.0
status: active
last_updated: 2025-11-23
category: deployment
---

# Environment Configuration

## Development Setup

### Prerequisites
- Node.js 18+
- MySQL 8.0+
- Redis (optional, for rate limiting)

### Local Configuration

Create a `.env` file in the project root:

```bash
# Application
NODE_ENV=development
PORT=3001

# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=sgs_gita_alumni
DB_USER=root
DB_PASS=your_password

# Authentication
JWT_SECRET=dev-only-secret-DO-NOT-USE-IN-PRODUCTION

# Email (optional for development)
SMTP_PROVIDER=sendgrid
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your_sendgrid_api_key

# Frontend URL
CLIENT_URL=http://localhost:5173
CORS_ORIGIN=http://localhost:5173
VITE_API_URL=http://localhost:3001
```

### Starting Development Server

```bash
# Install dependencies
npm ci

# Start backend
npm run server

# Start frontend (separate terminal)
npm run dev
```

## Staging Configuration

Staging deploys automatically to Vercel when code is merged to `develop`.

### Required Secrets (GitHub)
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

### Environment Variables
```bash
NODE_ENV=staging
VITE_API_URL=https://staging-api.yourdomain.com
```

## Production Requirements

Production deploys to AWS S3 + CloudFront on merge to `main`.

### Required Secrets (GitHub)
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `PRODUCTION_BUCKET_NAME`
- `PRODUCTION_CLOUDFRONT_ID`

### Environment Variables
```bash
NODE_ENV=production
DATABASE_URL=mysql://user:password@host:3306/database
JWT_SECRET=<secure-random-string>
SMTP_HOST=smtp.sendgrid.net
SMTP_USER=apikey
SMTP_PASS=<sendgrid-api-key>
CORS_ORIGIN=https://yourdomain.com
CLIENT_URL=https://yourdomain.com
```

### Security Requirements
- All secrets managed via GitHub Secrets or AWS Secrets Manager
- JWT_SECRET must be cryptographically secure (256+ bits)
- SSL/TLS required for all connections
- Database connections via SSL

## Environment Variables Reference

| Variable | Development | Staging | Production | Description |
|----------|------------|---------|------------|-------------|
| `NODE_ENV` | development | staging | production | Runtime environment |
| `PORT` | 3001 | auto | auto | Server port |
| `JWT_SECRET` | dev-secret | secure | secure | JWT signing key |
| `DATABASE_URL` | local | managed | managed | Database connection |
| `CORS_ORIGIN` | localhost | staging-url | prod-url | Allowed origins |
| `SMTP_PROVIDER` | sendgrid | sendgrid | sendgrid | Email provider |

## Related Files

- Server configuration: `/server.js`
- Database utilities: `/utils/database.js`
- Original spec: `/docs/specs/technical/deployment.md`
