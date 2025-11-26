/**
 * Custom ESLint Rules for Fake Production Code Prevention
 * 
 * IMPORTANT CLARIFICATION:
 * These rules are designed to prevent AI from creating FAKE PRODUCTION UI with
 * hardcoded values that appear functional but have NO real API/database connectivity.
 * 
 * These rules are DISABLED for test files in eslint.config.js because:
 * - Unit tests SHOULD use mock data, fixtures, and test helpers
 * - Test files using faker, test data, etc. is EXPECTED and CORRECT
 * 
 * What these rules catch in PRODUCTION code:
 * - Hardcoded arrays that look like they should come from an API
 * - Variables named "mock*" in production components
 * - Imports from mock data modules in production code
 * 
 * This is NOT about preventing proper test mocking. It's about preventing
 * AI from delivering "100% production ready" code that is actually fake.
 */

export const noMockDataRule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow fake/mock data in production code (test files are exempt via eslint.config.js)',
      category: 'Best Practices',
      recommended: true
    },
    schema: []
  },
  create(context) {
    const mockPatterns = [
      'mockData',
      'MockAPI',
      'mockApiData',
      'getMockData',
      'generateMock',
      'Math.random()',
      'faker',
      'chance'
    ];

    return {
      // Check import statements
      ImportDeclaration(node) {
        const source = node.source.value;
        if (source.includes('mock') && source.includes('Data')) {
          context.report({
            node,
            message: 'Mock data imports detected in production code. Use real API endpoints. (This rule is disabled for test files)',
            data: { source }
          });
        }
      },

      // Check variable declarations
      VariableDeclarator(node) {
        if (node.id.name && node.id.name.toLowerCase().includes('mock')) {
          context.report({
            node,
            message: 'Mock data variables detected in production code. Use real data from API endpoints. (This rule is disabled for test files)',
          });
        }
      },

      // Check function calls
      CallExpression(node) {
        if (node.callee.name && mockPatterns.some(pattern => node.callee.name.includes(pattern))) {
          context.report({
            node,
            message: 'Mock data function detected in production code. Use real API calls. (This rule is disabled for test files)',
          });
        }
      },

      // Check object properties
      Property(node) {
        if (node.key.name && node.key.name.toLowerCase().includes('mock')) {
          context.report({
            node,
            message: 'Mock data properties detected in production code. Use real data structures. (This rule is disabled for test files)',
          });
        }
      },

      // Check hardcoded arrays and objects that look like mock data
      // NOTE: This is intentionally aggressive to catch fake production UI.
      // It's disabled for test files where such patterns are expected.
      ArrayExpression(node) {
        if (node.elements.length > 0 && node.elements[0].type === 'ObjectExpression') {
          // Check if it looks like user data, post data, etc.
          const firstElement = node.elements[0];
          const mockDataIndicators = ['name', 'email', 'title', 'content', 'id'];

          const hasMockIndicators = firstElement.properties.some(prop =>
            mockDataIndicators.includes(prop.key.name)
          );

          if (hasMockIndicators && node.elements.length <= 10) {
            context.report({
              node,
              message: 'Hardcoded arrays detected - production code should fetch data from APIs. (This rule is disabled for test files)',
            });
          }
        }
      }
    };
  }
};

export const noMockImportsRule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow imports from mock data modules in production code (test files are exempt via eslint.config.js)',
      category: 'Best Practices',
      recommended: true
    },
    schema: []
  },
  create(context) {
    return {
      ImportDeclaration(node) {
        const source = node.source.value;
        const mockModules = [
          'mockData',
          'mockApiData',
          'MockAPI',
          './mock',
          '../mock',
          '@/lib/mock'
        ];

        if (mockModules.some(mockModule => source.includes(mockModule))) {
          context.report({
            node,
            message: 'Mock module imports detected in production code. Use real API services. (This rule is disabled for test files)',
            data: { source }
          });
        }
      }
    };
  }
};

export const noHardcodedMockDataRule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow hardcoded fake data structures in production code (test files are exempt via eslint.config.js)',
      category: 'Best Practices',
      recommended: true
    },
    schema: []
  },
  create(context) {
    return {
      // NOTE: This rule is intentionally aggressive to catch fake production UI.
      // It's disabled for test files in eslint.config.js where such patterns are expected.
      ObjectExpression(node) {
        // Check for hardcoded user-like objects
        const properties = node.properties;
        const mockIndicators = ['name', 'email', 'title', 'content', 'description'];

        const hasMockStructure = properties.some(prop => {
          // Handle both prop.key.name and prop.key.value cases
          const keyName = prop.key?.name || prop.key?.value;
          return keyName && mockIndicators.includes(keyName);
        });

        if (hasMockStructure && properties.length >= 3) {
          context.report({
            node,
            message: 'Hardcoded data object detected - production code should use API responses. (This rule is disabled for test files)',
          });
        }
      }
    };
  }
};