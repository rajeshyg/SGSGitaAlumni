/**
 * EXCEPTIONS, CONSTRAINTS & IGNORED PATHS
 * Part of structure-rules dictionary. Phase 0 enforcement.
 */

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 0: CONSTRAINT DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * LOCKED_FILES: Files that should NEVER be modified by AI agents without explicit approval
 * These are critical infrastructure files that could break the entire application
 */
const LOCKED_FILES = [
  // Core server infrastructure
  'server.js',
  'docker-compose.yml',
  'Dockerfile',
  'nginx.conf',

  // Database configuration
  'config/database.js',
  'migrations/*.sql',
  'migrations/*.cjs',

  // Security-critical files
  'middleware/auth.js',
  'middleware/rateLimit.js',
  '.env',
  '.env.*',

  // Validation rules - NEVER allow AI to modify the rulebook
  'scripts/validation/rules/*.cjs',
  '.claude/hooks/*.cjs',
  '.claude/duplication-registry.json',
  '.claude/skills/duplication-prevention.md',

  // Build configuration (change carefully)
  'vite.config.js',
  'tsconfig.json',
  'package.json',

  // CI/CD and deployment
  'terraform/*.tf',
  '.github/workflows/*.yml',
];

/**
 * STOP_TRIGGERS: Operations that should immediately halt and require human review
 * These are destructive or high-risk operations
 */
const STOP_TRIGGERS = [
  // Destructive file operations
  { pattern: /rm\s+-rf/i, reason: 'Recursive force delete is dangerous' },
  { pattern: /DROP\s+TABLE/i, reason: 'Dropping database tables requires review' },
  { pattern: /DROP\s+DATABASE/i, reason: 'Dropping database requires review' },
  { pattern: /TRUNCATE/i, reason: 'Truncating tables requires review' },
  { pattern: /DELETE\s+FROM\s+\w+\s*;?\s*$/i, reason: 'Unqualified DELETE requires review' },
  
  // Security-critical operations
  { pattern: /chmod\s+777/i, reason: 'World-writable permissions are insecure' },
  { pattern: /--force|--no-verify/i, reason: 'Bypassing safety checks requires review' },
  
  // Package management risks
  { pattern: /npm\s+publish/i, reason: 'Publishing packages requires review' },
  { pattern: /git\s+push.*--force/i, reason: 'Force push requires review' },
  
  // Environment manipulation
  { pattern: /process\.env\.\w+\s*=/i, reason: 'Modifying env vars at runtime is risky' },
];

/**
 * PORT_CONSTRAINTS: Reserved ports and their purposes
 * Prevents port conflicts during development
 */
const PORT_CONSTRAINTS = {
  reserved: {
    3000: 'Vite dev server',
    3001: 'API server',
    5432: 'PostgreSQL',
    6379: 'Redis',
    5173: 'Vite HMR',
  },
  ranges: {
    test: { start: 4000, end: 4999, purpose: 'Test servers' },
    mock: { start: 9000, end: 9099, purpose: 'Mock services' },
  },
  // Ports that should never be used
  forbidden: [22, 80, 443, 25, 587], // System ports
};

// ═══════════════════════════════════════════════════════════════════════════
// EXCEPTION REGISTRY (existing)
// ═══════════════════════════════════════════════════════════════════════════

const EXCEPTION_REGISTRY = [
  // Legacy documentation archive (ignore for validation)
  { path: 'Archive', reason: 'Legacy documentation archive', permanent: true },
  // Tool conventions (permanent)
  { path: 'playwright.config.ts', reason: 'Playwright convention', permanent: true },
  { path: 'vitest.config.ts', reason: 'Vitest convention', permanent: true },
  { pathPattern: /^\.env(\.\w+)?$/, reason: 'Environment config', permanent: true },
  
  // System-generated (review periodically)
  { path: 'docs/FEATURE_MATRIX.md', reason: 'System-generated', reviewDate: '2025-12-26' },
  { path: 'docs/generated-status-report.html', reason: 'System-generated', reviewDate: '2025-12-26' },
  
  // Temporary files (action required)
  { path: 'dump.rdb', reason: 'Redis persistence - should gitignore', action: 'gitignore' },
  { path: 'redis.msi', reason: 'Redis installer - delete after setup', action: 'delete_after_setup' },
  { path: 'redis.zip', reason: 'Redis archive - delete after setup', action: 'delete_after_setup' },
  { path: 'nul', reason: 'Windows artifact - delete', action: 'delete' },
  
  // NOTE: Gitignored files (eslint-output.json, lint-violations.json) don't need exceptions
  // The validator skips gitignored files automatically
];

const IGNORED_PATHS = {
  directories: ['node_modules', '.git', 'dist', 'coverage', 'build', 'playwright-report', 'test-results', '.vscode', '.idea', 'backups', '.claude', '.github', '.husky'],
  files: ['.DS_Store', 'Thumbs.db', '*.log'],
  patterns: [/\.map$/, /\.d\.ts$/, /-lock\.json$/, /\.lock$/],
};

module.exports = { 
  // Phase 0 Constraints
  LOCKED_FILES,
  STOP_TRIGGERS,
  PORT_CONSTRAINTS,
  // Existing exports
  EXCEPTION_REGISTRY, 
  IGNORED_PATHS 
};
