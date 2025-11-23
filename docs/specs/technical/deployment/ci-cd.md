---
title: CI/CD Pipeline
version: 1.0
status: active
last_updated: 2025-11-23
category: deployment
---

# Continuous Integration & Deployment

## GitHub Actions Workflows

The project uses GitHub Actions for automated testing and deployment. Workflow files are located in `/.github/workflows/`.

### Main Pipeline (`ci-cd.yml`)

Triggers on:
- Push to `main` or `develop`
- Pull requests to `main` or `develop`

#### Jobs

**1. Quality Check**
```yaml
quality-check:
  runs-on: ubuntu-latest
  steps:
    - Checkout code
    - Setup Node.js 18
    - Install dependencies (npm ci)
    - Run ESLint (npm run lint)
    - TypeScript check (npx tsc --noEmit)
    - Run tests with coverage (npm run test:run -- --coverage)
    - Check code redundancy
    - Check integration patterns
    - Upload coverage to Codecov
```

**2. Build Application**
```yaml
build:
  needs: quality-check
  steps:
    - Build application (npm run build)
    - Upload build artifacts
```

**3. Deploy Staging** (develop branch only)
```yaml
deploy-staging:
  needs: build
  if: github.ref == 'refs/heads/develop'
  environment: staging
  steps:
    - Install Vercel CLI
    - Deploy to Vercel (preview)
```

**4. Deploy Production** (main branch only)
```yaml
deploy-production:
  needs: build
  if: github.ref == 'refs/heads/main'
  environment: production
  steps:
    - Download build artifacts
    - Configure AWS credentials
    - Sync to S3 bucket
    - Invalidate CloudFront cache
```

### Additional Workflows

- **`blue-green-deployment.yml`** - Zero-downtime production deployments
- **`rollback.yml`** - Quick rollback to previous version
- **`documentation-quality.yml`** - Documentation validation

## Build Pipeline

### Testing
```bash
# Unit tests
npm run test:run

# With coverage
npm run test:run -- --coverage

# Linting
npm run lint

# Type checking
npx tsc --noEmit
```

### Build Process
```bash
# Production build
npm run build

# Output directory: dist/
```

## Test Automation

### Test Structure
- Unit tests for services and utilities
- Integration tests for API endpoints
- Validation schema tests

### Running Tests Locally
```bash
# All tests
npm test

# Single run
npm run test:run

# Watch mode
npm run test

# Coverage report
npm run test:run -- --coverage
```

## Deployment Process

### Staging Deployment

1. Merge PR to `develop` branch
2. GitHub Actions triggers quality checks
3. On success, builds application
4. Deploys to Vercel (preview URL)
5. Team validates staging environment

### Production Deployment

1. Merge `develop` to `main` branch
2. GitHub Actions runs full pipeline
3. On success, syncs to S3
4. Invalidates CloudFront distribution
5. Monitor for errors in Sentry

### Rollback Procedure

Use the rollback workflow for quick recovery:
```bash
gh workflow run rollback.yml -f version=<previous-version>
```

## Required Secrets

Configure in GitHub repository settings:

| Secret | Purpose |
|--------|---------|
| `VITE_API_URL` | API endpoint for frontend |
| `VERCEL_TOKEN` | Vercel deployment |
| `VERCEL_ORG_ID` | Vercel organization |
| `VERCEL_PROJECT_ID` | Vercel project |
| `AWS_ACCESS_KEY_ID` | AWS deployment |
| `AWS_SECRET_ACCESS_KEY` | AWS deployment |
| `PRODUCTION_BUCKET_NAME` | S3 bucket |
| `PRODUCTION_CLOUDFRONT_ID` | CloudFront distribution |

## Related Files

- Main workflow: `/.github/workflows/ci-cd.yml`
- Rollback workflow: `/.github/workflows/rollback.yml`
- Package scripts: `/package.json`
