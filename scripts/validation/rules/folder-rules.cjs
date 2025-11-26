/**
 * FOLDER RULES - Extensions and patterns allowed per folder
 * Part of structure-rules dictionary. Keep under 150 lines.
 */

const FOLDER_RULES = {
  '/': {
    description: 'Project root - only config files',
    allowedFiles: [
      'README.md', 'claude.md', 'index.html', 'package.json', 'package-lock.json',
      'server-package.json', 'server.js', 'tsconfig.json', 'tsconfig.node.json',
      'vite.config.js', 'vite.config.ts', 'eslint.config.js', 'tailwind.config.js',
      'postcss.config.js', 'playwright.config.ts', 'vitest.config.ts',
      'docker-compose.yml', 'Dockerfile', 'nginx.conf',
    ],
    allowedPatterns: [/^\.gitignore$/, /^\.dockerignore$/, /^\.prettierrc(\.json)?$/, /^\.jscpd\.json$/, /^\.eslintrc(\.json|\.js)?$/, /^\.env(\.\w+)?$/],
    forbiddenExtensions: ['.sql', '.sh', '.ps1'],
    forbiddenPatterns: [
      { pattern: /^check-.*\.js$/, message: 'Move to scripts/validation/ or scripts/debug/' },
      { pattern: /^test-.*\.js$/, message: 'Move to tests/' },
      { pattern: /^fix-.*\.js$/, message: 'Archive or delete' },
      { pattern: /-output\.json$/, message: 'Add to .gitignore' },
      { pattern: /-violations\.json$/, message: 'Add to .gitignore' },
    ],
  },
  'src/': {
    description: 'Frontend source - TypeScript/TSX only',
    allowedExtensions: ['.ts', '.tsx', '.css', '.json', '.svg', '.png', '.jpg', '.gif'],
    forbiddenExtensions: ['.js', '.jsx', '.sql', '.html', '.md'],
    exceptions: ['src/vite-env.d.ts'],
  },
  'server/': {
    description: 'Backend business logic',
    allowedExtensions: ['.js', '.cjs', '.mjs', '.json'],
    forbiddenExtensions: ['.ts', '.tsx', '.sql'],
    maxFileLines: 300,
  },
  'services/': {
    forbidden: true,
    message: 'No services/ at root. Use server/services/ for backend, src/services/ for frontend.',
    migration: { 'FamilyMemberService.js': 'server/services/FamilyMemberService.js' },
  },
  'routes/': { description: 'Express route handlers', allowedExtensions: ['.js', '.cjs', '.mjs'], maxFileLines: 300 },
  'middleware/': { description: 'Express middleware', allowedExtensions: ['.js', '.cjs', '.mjs'], maxFileLines: 200 },
  'migrations/': { description: 'Database migrations', allowedExtensions: ['.sql', '.cjs', '.js'] },
  'scripts/validation/': {
    description: 'Validation scripts',
    allowedExtensions: ['.cjs', '.js', '.mjs', '.json'],
    namingConvention: { pattern: /^(validate-|audit-|detect-|run-|deployment-|cleanup-).*\.(c?js|mjs)$|.*\.json$/, description: 'validate-*.cjs' },
  },
  'scripts/validation/validators/': { description: 'Validator modules', allowedExtensions: ['.cjs', '.js', '.mjs'] },
  'scripts/validation/rules/': { description: 'Validation config', allowedExtensions: ['.cjs', '.js', '.mjs'] },
  'scripts/debug/': {
    description: 'Diagnostic scripts',
    allowedExtensions: ['.js', '.cjs', '.mjs'],
    namingConvention: { pattern: /^(debug-|diagnose-|show-|trace-).*\.(c?js|mjs)$/, description: 'debug-* prefix' },
  },
  'scripts/core/': {
    description: 'Infrastructure scripts ONLY',
    allowedFiles: ['delayed-vite.js', 'kill-port.js', 'check-ports.js', 'detect-mock-data.js', 'MANIFEST.json'],
    allowedExtensions: ['.js', '.cjs', '.mjs', '.json'],
  },
  'scripts/database/': { description: 'Database operations', allowedExtensions: ['.js', '.cjs', '.mjs', '.sql', '.ps1', '.sh'] },
  'scripts/archive/': { description: 'Archived scripts', allowedExtensions: ['.js', '.cjs', '.mjs', '.sql', '.ps1', '.sh', '.md'] },
  'docs/': { description: 'Documentation', allowedExtensions: ['.md', '.html', '.mmd', '.txt'] },
  '.claude/': { description: 'Claude AI config', allowedExtensions: ['.md', '.json'] },
  '.github/': { description: 'GitHub config', allowedExtensions: ['.yml', '.yaml', '.md', '.json'] },
  '.husky/': { description: 'Git hooks', allowedExtensions: ['', '.sh'] },
  'docs/specs/': { description: 'Specifications', allowedExtensions: ['.md'] },
  'docs/specs/functional/': { description: 'Feature specs', allowedExtensions: ['.md'], requireFrontmatter: true },
  'docs/specs/technical/': { description: 'Technical standards', allowedExtensions: ['.md'], requireFrontmatter: true },
  'tests/': { description: 'Test files', allowedExtensions: ['.ts', '.tsx', '.js', '.cjs', '.mjs', '.json'] },
  'tests/e2e/': { description: 'E2E tests', allowedExtensions: ['.ts', '.spec.ts'] },
  'config/': { description: 'Configuration', allowedExtensions: ['.js', '.cjs', '.mjs', '.json'] },
  'eslint-rules/': { description: 'ESLint rules', allowedExtensions: ['.js', '.cjs', '.mjs'] },
  'public/': { description: 'Static assets', allowedExtensions: ['.html', '.ico', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.json', '.txt', '.xml'] },
  'redis/': { description: 'Redis local', allowedExtensions: ['.conf', '.exe', '.dll', '.pdb', '.docx', '.txt', '.msi', '.zip'] },
  'terraform/': { description: 'Infrastructure', allowedExtensions: ['.tf', '.tfvars', '.hcl'] },
  'utils/': { description: 'Backend utilities', allowedExtensions: ['.js', '.cjs', '.mjs'] },
};

module.exports = { FOLDER_RULES };
