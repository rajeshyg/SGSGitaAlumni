/**
 * MODULE & DUPLICATE RULES
 * Part of structure-rules dictionary. Keep under 100 lines.
 */

const MODULE_DEFINITIONS = {
  modules: ['authentication', 'user-management', 'directory', 'postings', 'messaging', 'dashboard', 'moderation', 'notifications', 'rating', 'admin'],
  functionalSpecFolders: ['admin', 'authentication', 'dashboard', 'directory', 'messaging', 'moderation', 'notifications', 'postings', 'rating', 'user-management'],
  technicalSpecFolders: ['architecture', 'coding-standards', 'database', 'deployment', 'development-framework', 'integration', 'security', 'testing', 'ui-standards', 'validation'],
  modulePatterns: {
    'auth': 'authentication', 'login': 'authentication', 'register': 'authentication', 'otp': 'authentication',
    'chat': 'messaging', 'message': 'messaging', 'post': 'postings', 'posting': 'postings',
    'dashboard': 'dashboard', 'moderat': 'moderation', 'notif': 'notifications',
    'user': 'user-management', 'directory': 'directory', 'alumni': 'directory', 'rating': 'rating',
  },
};

const DUPLICATE_RULES = {
  contentDuplicateExtensions: ['.js', '.ts', '.tsx', '.md', '.json', '.cjs'],
  minFileSizeBytes: 100,
  excludeDirs: ['node_modules', 'dist', '.git', 'coverage', 'build', 'playwright-report', 'test-results'],
  allowedDuplicatePatterns: [/^index\.(ts|js|tsx|jsx)$/, /^README\.md$/, /^types\.(ts|d\.ts)$/],
  similarityRules: {
    warnOnSameBasename: true,
    expectedPairs: [
      { folders: ['routes/', 'middleware/'], reason: 'Route and middleware share names' },
      { folders: ['src/services/', 'server/services/'], reason: 'Frontend/backend split' },
      { folders: ['docs/specs/functional/', 'docs/specs/technical/'], reason: 'Spec type split' },
    ],
  },
  moduleUniqueness: {
    onePerModule: [{ extension: '.mmd', description: 'Mermaid diagram' }],
    warnOnMultiple: [{ pattern: /\.spec\.ts$/, description: 'Playwright test' }],
  },
};

const SPEC_RULES = {
  requiredFrontmatter: ['version', 'status', 'last_updated'],
  validStatuses: ['implemented', 'in-progress', 'pending', 'active', 'proposed', 'deprecated', 'template'],
  functionalRequiredSections: ['Purpose', 'User Flow', 'Acceptance Criteria', 'Implementation', 'Related'],
  technicalRequiredSections: [],
  // DB Schema files have different required sections (focused on database documentation)
  dbSchemaRequiredSections: ['Overview', 'Tables', 'Table Relationships', 'Common Query Patterns', 'Migration Notes', 'Related'],
  acceptanceCriteriaFormat: { required: true, allowedMarkers: ['✅', '⏳', '☐', '-', '*', '- [ ]', '- [x]'] },
  strayFileRules: { allowedAtRoot: ['README.md', 'CONSTITUTION.md', 'index.md'] },
};

const CANONICAL_VOCABULARY = {
  scripts: {
    'validate': { meaning: 'Enforce rules, block on failure', replaces: ['check', 'verify'], locations: ['scripts/validation/'] },
    'audit': { meaning: 'Generate reports, non-blocking', replaces: ['scan', 'analyze', 'report'], locations: ['scripts/validation/'] },
    'detect': { meaning: 'Find patterns', replaces: ['find', 'search', 'locate'], locations: ['scripts/validation/', 'scripts/core/'] },
    'debug': { meaning: 'Diagnostic scripts', replaces: ['diagnose', 'investigate', 'show', 'check', 'test', 'get', 'list', 'set', 'explain', 'verify', 'find'], locations: ['scripts/debug/'] },
  },
  folders: {
    'validators': { meaning: 'Validator modules', replaces: ['checkers', 'verifiers'] },
    'rules': { meaning: 'Config files', replaces: ['config', 'settings', 'lib'] },
  },
  data: {
    'mock': { meaning: 'Test fixtures only', replaces: ['fake', 'stub'], forbiddenIn: ['src/pages/', 'src/components/', 'server/'] },
    'fixture': { meaning: 'Test data', replaces: ['test data', 'sample data'] },
  },
};

module.exports = { MODULE_DEFINITIONS, DUPLICATE_RULES, SPEC_RULES, CANONICAL_VOCABULARY };
