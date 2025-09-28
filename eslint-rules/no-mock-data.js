/**
 * Custom ESLint Rules for Mock Data Prevention
 * Zero Tolerance Policy Implementation
 */

export const noMockDataRule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow mock data usage in production code',
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
            message: 'Mock data imports are prohibited in production code. Use real API endpoints instead.',
            data: { source }
          });
        }
      },

      // Check variable declarations
      VariableDeclarator(node) {
        if (node.id.name && node.id.name.toLowerCase().includes('mock')) {
          context.report({
            node,
            message: 'Mock data variables are prohibited. Use real data from API endpoints.',
          });
        }
      },

      // Check function calls
      CallExpression(node) {
        if (node.callee.name && mockPatterns.some(pattern => node.callee.name.includes(pattern))) {
          context.report({
            node,
            message: 'Mock data function calls are prohibited. Use real API calls instead.',
          });
        }
      },

      // Check object properties
      Property(node) {
        if (node.key.name && node.key.name.toLowerCase().includes('mock')) {
          context.report({
            node,
            message: 'Mock data properties are prohibited. Use real data structures.',
          });
        }
      },

      // Check hardcoded arrays and objects that look like mock data
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
              message: 'Hardcoded arrays that appear to be mock data are prohibited. Use API calls instead.',
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
      description: 'Disallow imports from mock data modules',
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
            message: 'Importing from mock data modules is prohibited. Use real API services instead.',
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
      description: 'Disallow hardcoded mock data structures',
      category: 'Best Practices',
      recommended: true
    },
    schema: []
  },
  create(context) {
    return {
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
            message: 'Hardcoded objects that appear to be mock data are prohibited. Use API responses instead.',
          });
        }
      }
    };
  }
};