---
title: Deployment Overview
version: 1.0
status: active
last_updated: 2025-11-23
category: deployment
---

# Deployment Overview

This section documents the deployment infrastructure and processes for the SGS Gita Alumni project.

## Environments

| Environment | Branch | Platform | Purpose |
|-------------|--------|----------|---------|
| Development | feature/* | Local | Development and testing |
| Staging | develop | Vercel | Pre-production validation |
| Production | main | AWS S3 + CloudFront | Live application |

## Infrastructure Overview

### Frontend
- **Staging**: Vercel (automatic preview deployments)
- **Production**: AWS S3 with CloudFront CDN

### Backend
- **Server**: Express.js with Socket.IO
- **Database**: MySQL with connection pooling
- **Cache**: Redis for rate limiting

### Supporting Services
- **Error Tracking**: Sentry
- **Email**: SendGrid / AWS SES
- **Monitoring**: Prometheus + Grafana

## Quick Links

- [Environment Configuration](./environments.md) - Environment variables and setup
- [CI/CD Pipeline](./ci-cd.md) - GitHub Actions workflows
- [Monitoring & Observability](./monitoring.md) - Error tracking and alerting

## Deployment Process

1. **Development**: Local development with hot reload
2. **Pull Request**: Automated testing via GitHub Actions
3. **Staging**: Auto-deploy to Vercel on merge to `develop`
4. **Production**: Auto-deploy to AWS on merge to `main`

## Related Documentation

- Original spec: `/docs/specs/technical/deployment.md`
- GitHub workflows: `/.github/workflows/`
