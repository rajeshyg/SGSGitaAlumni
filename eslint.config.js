import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import sonarjs from 'eslint-plugin-sonarjs';
import globals from 'globals';

// Import custom mock data prevention rules
import { noMockDataRule, noMockImportsRule, noHardcodedMockDataRule } from './eslint-rules/no-mock-data.js';

export default [
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'server.js',
      'server-package.json',
      // Temporary and generated files
      'dump.rdb',
      'nul',
      '**/playwright-report/**',
      '**/test-results/**',
      '**/.vscode/**',
      '**/.idea/**',
      // Redis files
      'redis/**',
      'redis.msi',
      'redis.zip',
      // Documentation archives and generated reports
      'docs/archive/**',
      'docs/generated-*.html',
      '_*.txt', // Temporary text files like _invitation_auth_history.txt
      // Tool-specific folders (allow them to have their own rules)
      '.cursor/**',
      '.gemini/**',
      // Archive scripts (not active code)
      'scripts/archive/**'
    ]
  },
  // Node.js files (scripts, config files) - Allow console.log
  {
    files: [
      '**/*.{js,mjs,cjs}',
      'scripts/**/*.{js,cjs}',
      '*.config.js',
      'test-db.js',
      'check-*.js',
      'config/**/*.js',
      'utils/**/*.js'
    ],
    languageOptions: {
      globals: {
        ...globals.node
      }
    },
    rules: {
      'no-console': 'off', // Allow console in Node.js scripts
      'no-undef': 'error',
      'max-lines': ['warn', 800], // More lenient for scripts
      'max-lines-per-function': ['warn', 150], // More lenient for scripts
      'complexity': ['warn', 20] // More lenient for scripts
    }
  },
  // Backend routes and middleware - Production code with relaxed limits
  {
    files: [
      'routes/**/*.js',
      'middleware/**/*.js',
      'server/**/*.js',
      'migrations/**/*.{js,cjs}'
    ],
    languageOptions: {
      globals: {
        ...globals.node
      }
    },
    rules: {
      'no-console': 'off', // Allow console in backend for logging
      'no-undef': 'error',
      'max-lines': ['warn', 1500], // Routes can be longer
      'max-lines-per-function': ['warn', 400], // Route handlers can be complex
      'complexity': ['warn', 50] // Routes often have many branches
    }
  },
  // Browser/React files
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true
        }
      },
      globals: {
        ...globals.browser
      }
    },
    plugins: {
      '@typescript-eslint': tseslint,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      sonarjs: sonarjs,
      'custom': {
        rules: {
          'no-mock-data': noMockDataRule,
          'no-mock-imports': noMockImportsRule,
          'no-hardcoded-mock-data': noHardcodedMockDataRule
        }
      }
    },
    rules: {
      // TypeScript rules
      ...tseslint.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',

      // React rules
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true }
      ],

      // SonarJS rules - relaxed for development
      'sonarjs/no-duplicate-string': 'warn',
      'sonarjs/no-identical-functions': 'warn',
      'sonarjs/no-collapsible-if': 'warn',
      'sonarjs/no-useless-catch': 'warn',
      'sonarjs/no-redundant-jump': 'warn',
      'sonarjs/no-same-line-conditional': 'warn',
      'sonarjs/no-unused-collection': 'warn',
      'sonarjs/no-extra-arguments': 'warn',
      'sonarjs/no-identical-conditions': 'warn',
      'sonarjs/prefer-immediate-return': 'warn',

      // Code quality rules - RELAXED FOR DEVELOPMENT
      'no-console': 'warn', // Allow during development
      'no-debugger': 'warn',
      'no-duplicate-imports': 'error',
      'prefer-const': 'error',
      'no-var': 'error',

      // File size and complexity - RELAXED
      'max-lines': ['warn', 800],
      'max-lines-per-function': ['warn', 200],
      'complexity': ['warn', 30],

      // Import rules
      'no-unused-vars': 'off', // Let TypeScript handle this

      // 🚫 MOCK DATA PREVENTION RULES - WARNINGS ONLY FOR NOW
      'custom/no-mock-data': 'warn',
      'custom/no-mock-imports': 'warn',
      'custom/no-hardcoded-mock-data': 'warn',
    }
  },
  // Component files override (allow up to 500 lines for complex components)
  {
    files: ['src/components/**/*.tsx', 'src/components/**/*.ts'],
    rules: {
      'max-lines': ['error', 500], // Allow larger component files
    }
  },
  // Test files in src/ and tests/
  {
    files: [
      'src/**/*.{test,spec}.{ts,tsx}',
      'src/**/__tests__/**',
      'src/test/**',
      'tests/**/*.{js,ts}'
    ],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true
        }
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.jest,
        ...globals.mocha,
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        test: 'readonly',
        before: 'readonly',
        beforeAll: 'readonly',
        after: 'readonly',
        afterAll: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        vi: 'readonly'
      }
    },
    plugins: {
      '@typescript-eslint': tseslint,
      sonarjs: sonarjs
    },
    rules: {
      // Relax rules for tests
      'no-console': 'off',
      'max-lines': 'off',
      'max-lines-per-function': 'off',
      'complexity': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'sonarjs/no-duplicate-string': 'off',

      // 🚫 MOCK DATA RULES - DISABLED FOR TESTS (LEGITIMATE USAGE)
      'custom/no-mock-data': 'off',
      'custom/no-mock-imports': 'off',
      'custom/no-hardcoded-mock-data': 'off'
    }
  },
  // Playwright E2E test files
  {
    files: ['tests/**/*.{ts,js}', 'tests/**/*.spec.ts'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module'
      },
      globals: {
        ...globals.node,
        ...globals.browser
      }
    },
    plugins: {
      '@typescript-eslint': tseslint,
      sonarjs: sonarjs
    },
    rules: {
      // Relax rules for E2E tests
      'max-lines': ['error', 1000], // E2E tests can be longer
      'max-lines-per-function': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'sonarjs/no-duplicate-string': 'warn',
      'no-console': 'off', // Allow console in tests

      // 🚫 MOCK DATA RULES - DISABLED FOR TESTS (LEGITIMATE USAGE)
      'custom/no-mock-data': 'off',
      'custom/no-mock-imports': 'off',
      'custom/no-hardcoded-mock-data': 'off'
    }
  }
];