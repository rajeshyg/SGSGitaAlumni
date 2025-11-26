/**
 * EXCEPTIONS & IGNORED PATHS
 * Part of structure-rules dictionary. Keep under 80 lines.
 */

const EXCEPTION_REGISTRY = [
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

module.exports = { EXCEPTION_REGISTRY, IGNORED_PATHS };
