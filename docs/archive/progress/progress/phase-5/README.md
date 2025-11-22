# Phase 5: Production Deployment

Status: ⏸️ On Hold (AWS Access Required)
Progress: 0%
Scope: Production build, deployment, and post-deploy validation with strict consolidation guardrails

## Overview
Prepare, deploy, and validate the SGSGitaAlumni application for production. This phase enforces the single-serving-root policy and centralized Tailwind/PostCSS configuration to prevent regressions like unstyled pages due to miswired build topologies.

## Release Gate: Frontend Consolidation Verified
This phase may start only after consolidation is complete.

Prerequisite
- Complete [Task 1.9: Frontend Consolidation and Redundancy Removal](../phase-1/task-1.9-frontend-consolidation.md).

Must be true before starting:
- Single serving root: Dev/build run only from SGSGitaAlumni (root).
- Tailwind/PostCSS exist only at root:
  - [postcss.config.js](SGSGitaAlumni/postcss.config.js:1)
  - [tailwind.config.js](SGSGitaAlumni/tailwind.config.js:1)
- Import hygiene: No ../frontend import paths; all runtime code lives under [src](SGSGitaAlumni/src).
- Tight content globs: In [tailwind.config.js](SGSGitaAlumni/tailwind.config.js:1) content is scoped to:
  - "./index.html"
  - "./src/**/*.{js,ts,jsx,tsx}"
- CI guardrails enabled (see below).

## Build and Deploy Workflow

1) Build
- Run production build from the root project (only):
  - npm run build
- Outputs must include generated Tailwind CSS (via PostCSS plugin configured at root).

2) Pre-Deploy Verification (local)
- Preview: npm run preview (or vite preview) from root.
- Visual check: /admin renders fully styled and themed.
- Console/network check: No missing CSS or 404s for app assets.

3) Deploy
- Use your chosen platform (VM, container, static host + API, etc.).
- Ensure environment variables and base paths are configured consistently between preview and production.

4) Post-Deploy Validation
- Smoke test critical routes:
  - /admin (primary styling check)
  - Auth/landing routes as applicable
- Confirm theming, fonts, and icons render identically to preview.
- Monitor logs for CSS or asset pipeline errors.

## CI Guardrails (Prevent Regressions)
Add and enforce CI checks that fail the pipeline if any of the following are detected:
- Duplicate app roots or dev servers:
  - Another index.html or Vite entry outside root (e.g., frontend/index.html, frontend/vite.config.*)
- Nested dev/build scripts:
  - package.json outside root (e.g., frontend/package.json) contains dev/build/preview scripts
- Tailwind/PostCSS configs outside root:
  - frontend/tailwind.config.* or frontend/postcss.config.*
- Cross-root imports after consolidation:
  - Any source imports referencing ../frontend

Recommended pre-commit hook:
- Verify [postcss.config.js](SGSGitaAlumni/postcss.config.js:1) and [tailwind.config.js](SGSGitaAlumni/tailwind.config.js:1) exist at root.
- Verify Tailwind content globs exclude frontend/ once consolidation is complete.
- Block commits introducing ../frontend imports.

## Pre-Deployment Checklist
- [ ] Consolidation complete: [Task 1.9](../phase-1/task-1.9-frontend-consolidation.md)
- [ ] Repo search: 0 matches for ../frontend in source files
- [ ] No Tailwind/PostCSS configs under [frontend](SGSGitaAlumni/frontend)
- [ ] No nested package.json with dev/build/preview scripts under frontend/
- [ ] Root-only Tailwind content globs in [tailwind.config.js](SGSGitaAlumni/tailwind.config.js:1)
- [ ] Production build succeeds locally (npm run build)
- [ ] Preview shows fully styled /admin (npm run preview)
- [ ] CI guardrails passing on main

## Acceptance Criteria
- Builds and deploys from root only (SGSGitaAlumni).
- /admin renders fully styled in production, matching local preview.
- No Tailwind/PostCSS duplication outside root.
- CI fails if a developer attempts to reintroduce a nested app root, duplicate configs, or ../frontend imports.

## Rollback Strategy
- Keep last known-good build artifact available for immediate rollback.
- Environment-based feature flags for risky toggles.
- Post-deploy monitors and alarms wired for 5xx spikes and asset-load failures.

## Artifacts and Links
 Project progress: [PROGRESS.md](../../../PROGRESS.md)

- Lock and monitor these invariants; the majority of styling regressions originate from violating them.