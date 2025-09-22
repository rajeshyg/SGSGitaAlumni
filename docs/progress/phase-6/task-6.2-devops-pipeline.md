# Task 6.2: DevOps Pipeline Setup

## Overview

Establish a comprehensive DevOps pipeline that automates the build, test, deployment, and monitoring processes for the SGSGita Alumni application, ensuring reliable and efficient delivery of high-quality software.

## Status
- **Status:** 🔴 Pending
- **Estimated Effort:** 4-5 days
- **Priority:** High
- **Dependencies:** Task 6.1 (Quality Assurance Framework)

## Objectives

1. **CI/CD Pipeline** - Implement automated build, test, and deployment
2. **Environment Management** - Configure development, staging, and production environments
3. **Deployment Automation** - Automate deployment processes and rollbacks
4. **Infrastructure as Code** - Define infrastructure through code
5. **Monitoring Integration** - Integrate monitoring and alerting into the pipeline

## Implementation Plan

### Phase 1: CI/CD Foundation (Day 1-2)

#### GitHub Actions Workflow Setup
```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

env:
  NODE_VERSION: '18'
  VITE_API_URL: ${{ secrets.VITE_API_URL }}

jobs:
  quality-check:
    name: Quality Assurance
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run ESLint
        run: npm run lint

      - name: Run TypeScript check
        run: npm run type-check

      - name: Run tests
        run: npm run test:run -- --coverage

      - name: Check code redundancy
        run: npm run check-redundancy

      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info

  build:
    name: Build Application
    needs: quality-check
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build application
        run: npm run build

      - name: Upload build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: build-files
          path: dist/

  deploy-staging:
    name: Deploy to Staging
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'
    environment: staging
    steps:
      - name: Download build artifacts
        uses: actions/download-artifact@v3
        with:
          name: build-files
          path: dist/

      - name: Deploy to staging
        run: |
          # Deployment commands for staging environment
          echo "Deploying to staging environment"
          # Add your staging deployment commands here

  deploy-production:
    name: Deploy to Production
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: production
    steps:
      - name: Download build artifacts
        uses: actions/download-artifact@v3
        with:
          name: build-files
          path: dist/

      - name: Deploy to production
        run: |
          # Deployment commands for production environment
          echo "Deploying to production environment"
          # Add your production deployment commands here
```

#### Environment Configuration
```typescript
// src/config/environments.ts

interface EnvironmentConfig {
  apiUrl: string
  environment: 'development' | 'staging' | 'production'
  sentryDsn?: string
  analyticsId?: string
  featureFlags: Record<string, boolean>
}

const configs: Record<string, EnvironmentConfig> = {
  development: {
    apiUrl: 'http://localhost:3001/api',
    environment: 'development',
    featureFlags: {
      debugMode: true,
      analytics: false,
      errorReporting: false
    }
  },
  staging: {
    apiUrl: 'https://api-staging.sgs-gita-alumni.com',
    environment: 'staging',
    sentryDsn: process.env.VITE_SENTRY_DSN_STAGING,
    analyticsId: process.env.VITE_ANALYTICS_ID_STAGING,
    featureFlags: {
      debugMode: false,
      analytics: true,
      errorReporting: true
    }
  },
  production: {
    apiUrl: 'https://api.sgs-gita-alumni.com',
    environment: 'production',
    sentryDsn: process.env.VITE_SENTRY_DSN_PRODUCTION,
    analyticsId: process.env.VITE_ANALYTICS_ID_PRODUCTION,
    featureFlags: {
      debugMode: false,
      analytics: true,
      errorReporting: true
    }
  }
}

export function getEnvironmentConfig(): EnvironmentConfig {
  const env = process.env.VITE_ENVIRONMENT || 'development'
  return configs[env] || configs.development
}

export const config = getEnvironmentConfig()
```

### Phase 2: Deployment Automation (Day 3)

#### Docker Configuration
```dockerfile
# Dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
RUN npm ci --only=production && npm cache clean --force

# Build the application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the application
RUN npm run build

# Production image
FROM nginx:alpine AS runner
WORKDIR /app

# Copy built application
COPY --from=builder /app/dist ./dist

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
```

```nginx
# nginx.conf
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json;

    server {
        listen 80;
        server_name localhost;
        root /app/dist;
        index index.html;

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header Referrer-Policy "no-referrer-when-downgrade" always;
        add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

        # Handle client-side routing
        location / {
            try_files $uri $uri/ /index.html;
        }

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # API proxy (if needed)
        location /api/ {
            proxy_pass http://api-server:3001;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

#### Docker Compose for Local Development
```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:80"
    environment:
      - NODE_ENV=production
    depends_on:
      - api
    networks:
      - app-network

  api:
    build:
      context: ./api
      dockerfile: Dockerfile.api
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
    networks:
      - app-network

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=sgs_alumni
      - POSTGRES_USER=alumni_user
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - db_data:/var/lib/postgresql/data
    networks:
      - app-network

networks:
  app-network:
    driver: bridge

volumes:
  db_data:
```

### Phase 3: Infrastructure as Code (Day 4)

#### Terraform Configuration for AWS
```hcl
# main.tf
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# S3 bucket for static website hosting
resource "aws_s3_bucket" "website" {
  bucket = var.bucket_name

  tags = {
    Name        = "SGS Alumni Website"
    Environment = var.environment
  }
}

resource "aws_s3_bucket_public_access_block" "website" {
  bucket = aws_s3_bucket.website.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_policy" "website" {
  bucket = aws_s3_bucket.website.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Resources = [
          "${aws_s3_bucket.website.arn}/*",
        ]
        Action = [
          "s3:GetObject",
        ]
      },
    ]
  })
}

resource "aws_s3_bucket_website_configuration" "website" {
  bucket = aws_s3_bucket.website.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "index.html"
  }
}

# CloudFront distribution
resource "aws_cloudfront_distribution" "website" {
  origin {
    domain_name = aws_s3_bucket.website.bucket_regional_domain_name
    origin_id   = "S3-${aws_s3_bucket.website.id}"
  }

  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${aws_s3_bucket.website.id}"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  tags = {
    Name        = "SGS Alumni CloudFront"
    Environment = var.environment
  }
}
```

```hcl
# variables.tf
variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "bucket_name" {
  description = "S3 bucket name"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}
```

### Phase 4: Monitoring Integration (Day 5)

#### Application Monitoring Setup
```typescript
// src/lib/monitoring.ts
import * as Sentry from '@sentry/react'
import { config } from '@/config/environments'

export function initializeMonitoring() {
  // Sentry initialization
  if (config.sentryDsn) {
    Sentry.init({
      dsn: config.sentryDsn,
      environment: config.environment,
      integrations: [
        new Sentry.BrowserTracing({
          tracePropagationTargets: ['localhost', config.apiUrl],
        }),
        new Sentry.Replay(),
      ],
      tracesSampleRate: config.environment === 'production' ? 0.1 : 1.0,
      replaysSessionSampleRate: config.environment === 'production' ? 0.1 : 1.0,
      replaysOnErrorSampleRate: 1.0,
    })
  }

  // Performance monitoring
  if (config.environment === 'production') {
    // Web Vitals tracking
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(console.log)
      getFID(console.log)
      getFCP(console.log)
      getLCP(console.log)
      getTTFB(console.log)
    })
  }
}

export function logError(error: Error, context?: Record<string, any>) {
  console.error('Application Error:', error)

  if (config.sentryDsn) {
    Sentry.captureException(error, {
      tags: {
        environment: config.environment,
      },
      extra: context,
    })
  }
}

export function logEvent(event: string, properties?: Record<string, any>) {
  console.log(`Event: ${event}`, properties)

  // Send to analytics service if configured
  if (config.analyticsId && window.gtag) {
    window.gtag('event', event, properties)
  }
}
```

#### Health Check Endpoint
```typescript
// src/pages/api/health.ts
import type { NextApiRequest, NextApiResponse } from 'next'

type HealthStatus = {
  status: 'healthy' | 'unhealthy'
  timestamp: string
  version: string
  environment: string
  checks: {
    database: boolean
    cache: boolean
    externalServices: boolean
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<HealthStatus>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      checks: {
        database: false,
        cache: false,
        externalServices: false,
      },
    })
  }

  try {
    // Database health check
    const dbHealthy = await checkDatabaseHealth()

    // Cache health check
    const cacheHealthy = await checkCacheHealth()

    // External services health check
    const externalHealthy = await checkExternalServicesHealth()

    const isHealthy = dbHealthy && cacheHealthy && externalHealthy

    res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      checks: {
        database: dbHealthy,
        cache: cacheHealthy,
        externalServices: externalHealthy,
      },
    })
  } catch (error) {
    console.error('Health check failed:', error)
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      checks: {
        database: false,
        cache: false,
        externalServices: false,
      },
    })
  }
}

async function checkDatabaseHealth(): Promise<boolean> {
  try {
    // Implement database health check
    // This would connect to your database and run a simple query
    return true
  } catch (error) {
    console.error('Database health check failed:', error)
    return false
  }
}

async function checkCacheHealth(): Promise<boolean> {
  try {
    // Implement cache health check
    return true
  } catch (error) {
    console.error('Cache health check failed:', error)
    return false
  }
}

async function checkExternalServicesHealth(): Promise<boolean> {
  try {
    // Implement external services health check
    return true
  } catch (error) {
    console.error('External services health check failed:', error)
    return false
  }
}
```

## Deployment Strategies

### Blue-Green Deployment
```yaml
# blue-green-deployment.yml
name: Blue-Green Deployment

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build application
        run: npm run build

      - name: Determine target environment
        id: target
        run: |
          # Logic to determine blue or green environment
          echo "target=blue" >> $GITHUB_OUTPUT

      - name: Deploy to target environment
        run: |
          TARGET=${{ steps.target.outputs.target }}
          echo "Deploying to $TARGET environment"

      - name: Health check
        run: |
          # Wait for deployment to be healthy
          echo "Performing health checks"

      - name: Switch traffic
        run: |
          # Switch load balancer to new environment
          echo "Switching traffic to new deployment"

      - name: Cleanup old deployment
        run: |
          # Clean up old environment after successful deployment
          echo "Cleaning up old deployment"
```

### Rollback Strategy
```yaml
# rollback.yml
name: Rollback Deployment

on:
  workflow_dispatch:
    inputs:
      target_version:
        description: 'Version to rollback to'
        required: true

jobs:
  rollback:
    runs-on: ubuntu-latest
    environment: production

    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          ref: ${{ github.event.inputs.target_version }}

      - name: Deploy rollback version
        run: |
          echo "Rolling back to version ${{ github.event.inputs.target_version }}"

      - name: Verify rollback
        run: |
          echo "Verifying rollback deployment"
```

## Success Criteria
- ✅ Automated CI/CD pipeline operational
- ✅ Multi-environment deployment configured
- ✅ Infrastructure as code implemented
- ✅ Monitoring and alerting integrated
- ✅ Rollback procedures documented and tested
- ✅ Build time under 5 minutes
- ✅ Deployment time under 3 minutes
- ✅ Pipeline success rate above 95%
- ✅ Mean time to recovery under 15 minutes
- ✅ Change failure rate below 5%

## Performance Requirements
- **Build Time:** < 5 minutes
- **Deployment Time:** < 3 minutes
- **Health Check Response:** < 2 seconds
- **Rollback Time:** < 5 minutes
- **Pipeline Success Rate:** > 95%
- **Deployment Frequency:** Multiple times per day
- **Mean Time to Recovery:** < 15 minutes
- **Change Failure Rate:** < 5%

## Testing & Validation

### Pipeline Testing
1. **Unit Tests**
   - Test individual pipeline steps
   - Mock external dependencies
   - Validate error handling

2. **Integration Tests**
   - Test complete pipeline flow
   - Validate environment configurations
   - Test deployment scenarios

3. **End-to-End Tests**
   - Test deployed application
   - Validate user workflows
   - Performance testing

### Deployment Validation
```bash
# deployment-validation.sh
#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo "🔍 Starting deployment validation..."

# Check if application is accessible
if curl -f -s "$DEPLOYMENT_URL" > /dev/null; then
    echo -e "${GREEN}✅ Application is accessible${NC}"
else
    echo -e "${RED}❌ Application is not accessible${NC}"
    exit 1
fi

# Check health endpoint
if curl -f -s "$DEPLOYMENT_URL/api/health" > /dev/null; then
    echo -e "${GREEN}✅ Health check passed${NC}"
else
    echo -e "${RED}❌ Health check failed${NC}"
    exit 1
fi

# Check for JavaScript errors
if curl -s "$DEPLOYMENT_URL" | grep -q "console.error"; then
    echo -e "${RED}❌ JavaScript errors detected${NC}"
    exit 1
else
    echo -e "${GREEN}✅ No JavaScript errors detected${NC}"
fi

echo -e "${GREEN}🎉 Deployment validation completed successfully!${NC}"
```

## Security Considerations

### Pipeline Security
- **Secret Management:** Use GitHub Secrets for sensitive data
- **Access Control:** Implement branch protection rules
- **Audit Logging:** Log all deployment activities
- **Vulnerability Scanning:** Integrate security scanning tools

### Deployment Security
- **HTTPS Only:** Enforce HTTPS for all deployments
- **Security Headers:** Implement security headers
- **Dependency Scanning:** Scan for vulnerable dependencies
- **Container Security:** Secure container configurations

## Documentation

### Deployment Documentation
```markdown
# Deployment Guide

## Environments

### Development
- **URL:** http://localhost:3000
- **Database:** Local PostgreSQL
- **Features:** Debug mode enabled

### Staging
- **URL:** https://staging.sgs-gita-alumni.com
- **Database:** Staging RDS instance
- **Features:** Full feature set, production-like data

### Production
- **URL:** https://sgs-gita-alumni.com
- **Database:** Production RDS instance
- **Features:** Optimized for performance

## Deployment Process

1. **Code Review:** All changes must be reviewed and approved
2. **Automated Testing:** CI pipeline runs all tests
3. **Quality Gates:** Code quality checks must pass
4. **Deployment:** Automated deployment to target environment
5. **Verification:** Health checks and smoke tests
6. **Monitoring:** Post-deployment monitoring for issues

## Rollback Procedure

1. **Identify Issue:** Determine the cause of deployment failure
2. **Select Version:** Choose the previous stable version
3. **Execute Rollback:** Use the rollback workflow
4. **Verify:** Confirm application is working correctly
5. **Investigate:** Analyze the root cause of the issue
```

## Monitoring & Alerting

### Application Metrics
- **Response Time:** Track API response times
- **Error Rate:** Monitor application errors
- **User Sessions:** Track user engagement
- **Performance Metrics:** Core Web Vitals

### Infrastructure Metrics
- **CPU Usage:** Monitor server resource usage
- **Memory Usage:** Track memory consumption
- **Disk Space:** Monitor storage utilization
- **Network Traffic:** Track bandwidth usage

### Alert Configuration
```yaml
# alerts.yml
alerts:
  - name: High Error Rate
    condition: error_rate > 5%
    severity: critical
    channels: [slack, email]

  - name: Slow Response Time
    condition: response_time > 3000ms
    severity: warning
    channels: [slack]

  - name: Deployment Failure
    condition: deployment_status == 'failed'
    severity: critical
    channels: [slack, email, sms]
```

## Next Steps

1. **Infrastructure Setup** - Configure cloud infrastructure
2. **Security Review** - Review security configurations
3. **Performance Testing** - Load testing and optimization
4. **Documentation Review** - Update deployment documentation
5. **Team Training** - Train team on DevOps processes

## Risk Mitigation

### Common Issues
1. **Deployment Failures** - Implement comprehensive testing
2. **Environment Drift** - Use infrastructure as code
3. **Security Vulnerabilities** - Regular security scanning
4. **Performance Degradation** - Continuous monitoring

### Contingency Plans
1. **Manual Deployment** - Document manual deployment procedures
2. **Database Backup** - Regular database backups
3. **Monitoring Redundancy** - Multiple monitoring systems
4. **Communication Plan** - Clear incident response procedures

## Additional Requirements
- [ ] CI/CD pipeline successfully builds and tests all code changes
- [ ] Automated deployment to staging environment works without errors
- [ ] Production deployment process is fully automated and tested
- [ ] Infrastructure as Code (Terraform) manages all AWS resources
- [ ] Monitoring and alerting systems detect and report issues accurately
- [ ] Blue-green deployment strategy enables zero-downtime deployments
- [ ] Rollback procedures are tested and functional
- [ ] Security scanning is integrated into the pipeline
- [ ] Performance monitoring provides actionable insights
- [ ] Documentation is complete and accessible to the team

---

*Task 6.2: DevOps Pipeline Setup - Last updated: September 22, 2025*