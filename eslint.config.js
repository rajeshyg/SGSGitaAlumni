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
    ignores: ['dist/**', 'node_modules/**', 'server.js', 'server-package.json']
  },
  // Node.js files (scripts, config files)
  {
    files: ['**/*.{js,mjs,cjs}', 'scripts/**', '*.config.js', 'test-db.js', 'check-*.js'],
    languageOptions: {
      globals: {
        ...globals.node
      }
    },
    rules: {
      'no-console': 'off', // Allow console in Node.js scripts
      'no-undef': 'error'
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
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',

      // React rules
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true }
      ],

      // SonarJS rules for better redundancy detection
      'sonarjs/no-duplicate-string': 'error',
      'sonarjs/no-identical-functions': 'error',
      'sonarjs/no-collapsible-if': 'error',
      'sonarjs/no-useless-catch': 'error',
      'sonarjs/no-redundant-jump': 'error',
      'sonarjs/no-same-line-conditional': 'error',
      'sonarjs/no-unused-collection': 'error',
      'sonarjs/no-extra-arguments': 'error',
      'sonarjs/no-identical-conditions': 'error',
      'sonarjs/prefer-immediate-return': 'error',

      // Code quality rules
      'no-console': 'error',
      'no-debugger': 'error',
      'no-duplicate-imports': 'error',
      'prefer-const': 'error',
      'no-var': 'error',

      // File size and complexity (general files: 500 lines max)
      'max-lines': ['error', 500],
      'max-lines-per-function': ['error', 50],
      'complexity': ['error', 10],

      // Import rules
      'no-unused-vars': 'off', // Let TypeScript handle this

      // 🚫 MOCK DATA PREVENTION RULES - ZERO TOLERANCE
      'custom/no-mock-data': 'error',
      'custom/no-mock-imports': 'error',
      'custom/no-hardcoded-mock-data': 'error',
    }
  },
  // Component files override (allow up to 500 lines for complex components)
  {
    files: ['src/components/**/*.tsx', 'src/components/**/*.ts'],
    rules: {
      'max-lines': ['error', 500], // Allow larger component files
    }
  },
  // Test files
  {
    files: ['src/**/*.{test,spec}.{ts,tsx}', 'src/**/__tests__/**'],
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
        ...globals.jest
      }
    },
    plugins: {
      '@typescript-eslint': tseslint,
      sonarjs: sonarjs
    },
    rules: {
      // Relax rules for tests
      'max-lines-per-function': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'sonarjs/no-duplicate-string': 'warn', // Less strict in tests

      // 🚫 MOCK DATA RULES - DISABLED FOR TESTS (LEGITIMATE USAGE)
      'custom/no-mock-data': 'off',
      'custom/no-mock-imports': 'off',
      'custom/no-hardcoded-mock-data': 'off'
    }
  }
];