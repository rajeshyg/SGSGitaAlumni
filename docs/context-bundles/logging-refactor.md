# Context Bundle: Unified Logging System

**Created:** 2025-12-12
**Status:** In Progress
**Context:** Improving debugging efficiency by centralizing logs.

## 1. Context & Motivation
*   **Problem:** Debugging was inefficient due to "log fragmentation." Developers had to constantly switch between the Browser Console (Frontend errors) and the PowerShell Terminal (Backend errors). This also made it difficult to provide comprehensive error context to AI assistants.
*   **Goal:** Create a "Unified Stream" where all errors (Client & Server) appear in a single terminal and are saved to a single file (`logs/errors.log`). This enables easier real-time debugging and simpler copy-pasting for AI support.

## 2. Architecture: The Unified Stream

We have implemented a bridge that routes client-side errors to the backend during development.

### Data Flow
1.  **Frontend Error** (e.g., `logger.error`, `window.onerror`) ->
2.  **Monitoring Service** (`src/lib/monitoring.ts`) intercepts it ->
3.  **Client Bridge** (`POST /api/dev/client-log`) receives it ->
4.  **Backend Logger** (`utils/logger.js`) formats it ->
5.  **File Logger** (`utils/file-logger.js`) writes it to `logs/errors.log`.

### Key Components
*   `logs/errors.log`: The single source of truth for errors.
*   `utils/file-logger.js`: Handles thread-safe writing and session markers.
*   `routes/dev.js`: The API endpoint that acts as the bridge.
*   `npm run clear-logs`: Utility to wipe the log file for a fresh start.

## 3. Progress Update

### ✅ Completed
*   [x] **Infrastructure**: Created `file-logger.js` and `routes/dev.js`.
*   [x] **Backend Integration**: Updated `server.js` to mount the dev routes and `utils/logger.js` to use the file logger.
*   [x] **Frontend Integration**: Updated `src/lib/monitoring.ts` to forward errors to the backend.
*   [x] **Session Management**: Added `logSessionStart()` to mark new server runs in the log file.
*   [x] **Validation**: Verified with `scripts/test-logger.js` that logs are correctly written.

### 🚧 In Progress
*   [ ] **Codebase Refactoring**: The system currently relies on `logger.error()`. However, much of the codebase still uses raw `console.error()` / `console.log()`. These need to be migrated to use the `logger` utility to be captured by the new system.

## 4. Next Steps (Refactoring Plan)
To fully realize the value of the Unified Stream, we need to systematically replace `console.*` calls with `logger.*` calls.

1.  **Phase 1: Critical Backend Modules**:
    *   Auth (`routes/auth.js`, `middleware/auth.js`)
    *   Database (`utils/database.js`)
    *   Server Startup (`server.js`)
    
2.  **Phase 2: Critical Frontend Modules**:
    *   API Clients (`src/lib/api.ts`)
    *   Auth Context (`src/contexts/AuthContext.tsx`)

3.  **Phase 3: Cleanup**:
    *   Scan for remaining `console.log` usage.
    *   Add linting rules to discourage raw console usage in the future.

## 5. Usage for Developers

*   **Start Debugging**: `npm run clear-logs && npm run dev`
*   **View Logs**: Check `logs/errors.log` for a clean, unified history.
*   **AI Assistance**: Copy the content of `logs/errors.log` when asking for help with bugs.
