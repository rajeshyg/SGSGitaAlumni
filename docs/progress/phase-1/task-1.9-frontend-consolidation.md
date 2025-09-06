# Task 1.9: Frontend Consolidation and Redundancy Removal

Status: Pending (High Priority)
Owner: Frontend Lead
ETA: 1–2 days

Objective
Eliminate duplicate app roots and redundant code by consolidating all active UI/theme code into the single serving root app (SGSGitaAlumni). Ensure Tailwind/PostCSS exist only at the serving root and prevent regressions with CI guardrails.

Context
- The app runs from the root Vite server using [index.html](SGSGitaAlumni/index.html) and the entry [src/main.tsx](SGSGitaAlumni/src/main.tsx:1).
- Root now has Tailwind/PostCSS configs: [postcss.config.js](SGSGitaAlumni/postcss.config.js), [tailwind.config.js](SGSGitaAlumni/tailwind.config.js).
- Some components and styles are still referenced from [frontend/src](SGSGitaAlumni/frontend/src), creating a split source-of-truth and risk of future build topology issues.

Scope
- Source of truth: SGSGitaAlumni root app and [src](SGSGitaAlumni/src)
- Remove: Duplicate Tailwind/PostCSS configs and any nested dev/build scripts under [frontend](SGSGitaAlumni/frontend)
- Migrate: Any file under [frontend/src](SGSGitaAlumni/frontend/src) that is currently imported by root code
- Prevent: CI checks to block new nested app roots/configs and cross-root import paths

Deliverables
- All runtime UI/theme code lives under [src](SGSGitaAlumni/src)
- No imports from ../frontend remain in the codebase
- Tailwind/PostCSS only at root; root content globs tightened to root paths after migration
- CI guardrails to prevent reintroduction of duplicates

Plan of Record

1) Inventory references (current usage map)
- Search for cross-root imports into frontend:
  - Pattern: ../frontend/src or ^frontend/src
  - Targets to search:
    - [src](SGSGitaAlumni/src)
    - [index.html](SGSGitaAlumni/index.html)
- Catalog all referenced files under [frontend/src](SGSGitaAlumni/frontend/src) that are still imported by root code.

2) Migrate files to root
- For each referenced module in [frontend/src](SGSGitaAlumni/frontend/src), move it into the corresponding location under [src](SGSGitaAlumni/src). Keep same folder semantics where possible.
- Update all imports in [src](SGSGitaAlumni/src) to local paths (remove ../frontend references).
- If any shared utility or theme token file exists in [frontend/src/lib](SGSGitaAlumni/frontend/src/lib), relocate to [src/lib](SGSGitaAlumni/src/lib) and update imports across the project.

3) Tighten Tailwind content globs
- After migration completes, update [tailwind.config.js](SGSGitaAlumni/tailwind.config.js) content globs to cover only the root code paths:
  - "./index.html"
  - "./src/**/*.{js,ts,jsx,tsx}"
- Remove any "./frontend/src/**" content globs once no code is read from that path.

4) Remove redundancy
- Remove nested configs and scripts under [frontend](SGSGitaAlumni/frontend):
  - [frontend/postcss.config.js](SGSGitaAlumni/frontend/postcss.config.js)
  - [frontend/tailwind.config.js](SGSGitaAlumni/frontend/tailwind.config.js)
  - Any [frontend/package.json](SGSGitaAlumni/frontend/package.json) dev/build scripts
- Delete or archive any leftover unused components/styles in [frontend/src](SGSGitaAlumni/frontend/src) after confirming they have no references in the repository.

5) CI guardrails (prevent regressions)
- Add a CI script (e.g., node or bash) that fails if any of the following are detected:
  - Another index.html or Vite entry exists outside root:
    - e.g., "frontend/index.html", "frontend/vite.config.*"
  - Nested package.json with dev/build scripts outside root:
    - e.g., "frontend/package.json" containing "dev", "build", or "preview" scripts
  - Tailwind/PostCSS configs outside root:
    - e.g., "frontend/tailwind.config.*", "frontend/postcss.config.*"
  - Cross-root imports referencing ../frontend after consolidation:
    - Repo-wide search for ../frontend in source files
- Add a pre-commit hook to verify [postcss.config.js](SGSGitaAlumni/postcss.config.js) and [tailwind.config.js](SGSGitaAlumni/tailwind.config.js) exist at root and that the tailwind content globs are scoped to root paths only.

6) Verification
- Visual: /admin renders fully styled under root dev server (npm run dev from SGSGitaAlumni).
- Static checks:
  - 0 matches for ../frontend in code imports.
  - 0 matches for frontend/tailwind.config or frontend/postcss.config.
  - 0 nested package.json with dev/build scripts under frontend/.
- CI: New guardrail job passes; intentionally adding a duplicate config or nested dev script should fail CI.

Acceptance Criteria
- Running SGSGitaAlumni › npm run dev starts a single root dev server.
- All code imports resolve within [src](SGSGitaAlumni/src) without ../frontend references.
- Only one Tailwind/PostCSS configuration exists at root.
- Tailwind content globs cover only root paths after migration.
- CI blocks future reintroduction of nested app roots/configs.

Notes
- Theme and tokens remain unchanged; the consolidation only changes file locations and import paths.
- This task does not modify business logic or the existing theme system beyond path normalization.

Links
- Root entry: [index.html](SGSGitaAlumni/index.html), [src/main.tsx](SGSGitaAlumni/src/main.tsx:1)
- Root configs: [postcss.config.js](SGSGitaAlumni/postcss.config.js), [tailwind.config.js](SGSGitaAlumni/tailwind.config.js)
- Current split sources: [frontend/src](SGSGitaAlumni/frontend/src), [src](SGSGitaAlumni/src)